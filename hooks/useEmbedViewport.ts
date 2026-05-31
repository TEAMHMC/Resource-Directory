import type React from 'react';
import { useEffect, useState, useMemo, useRef, useCallback } from 'react';

/**
 * useEmbedViewport
 *
 * Fixes the "modal opens at the bottom of an embedded iframe" bug.
 *
 * Context: this app is embedded in Webflow as an iframe whose height is
 * dynamically resized by the parent (via the 'efHeight' postMessage protocol)
 * so the iframe stretches to fit the full document, sometimes thousands of
 * pixels tall. Inside that tall iframe, `position: fixed` pins to the iframe's
 * own viewport (the entire iframe box), not the parent window's visible area.
 * Result: a flex-centered modal lands at the geometric center of the iframe
 * (often far below where the user is currently looking), and the user has to
 * scroll the parent page to find it. Likewise, `dvh`-based max-heights blow
 * up because `100dvh` is now the entire iframe box.
 *
 * Two-mode strategy:
 *
 *   MODE A — parent listener present (preferred). The hook talks to the
 *   parent window with a small postMessage protocol:
 *     child  -> parent : { type: 'requestParentViewport' }
 *     parent -> child  : { type: 'parentViewport', scrollY, innerHeight, iframeTop }
 *   With those three numbers we compute where the parent's visible window
 *   lands inside the iframe's coordinate space and absolute-position the
 *   modal there so it always shows up in the user's currently-visible window.
 *
 *   MODE B — self-contained fallback (no parent code required). If the
 *   parent does not respond within ~600ms, the hook returns fallback styles
 *   that:
 *     1. Cap the modal card height to a sensible pixel value (not vh/dvh,
 *        which would resolve to the iframe's entire tall box).
 *     2. Use the consumer-supplied scrollIntoView via `attachCardRef` to
 *        bring the modal into the user's actual viewport. `scrollIntoView`
 *        propagates across iframe boundaries, so the parent page will scroll
 *        to make the modal visible.
 *     3. Position the overlay `absolute` near the iframe's current scroll
 *        position so the modal lands near where the user clicked rather than
 *        at the geometric center of a 10,000px-tall iframe.
 *
 * Returned values (spread onto the elements that already exist on each modal):
 *   - `overlayStyle`  - outer wrapper styles (overrides Tailwind `fixed inset-0`).
 *   - `cardMaxHeight` - CSS string to use as `maxHeight` on the modal card so
 *                       it never exceeds the user's visible area. The consumer
 *                       MUST have `overflow-y: auto` on the scrollable inner
 *                       section for body content to remain reachable.
 *   - `attachCardRef` - ref callback to attach to the modal card. When the
 *                       card mounts, we scrollIntoView to ensure the modal is
 *                       visible in the user's actual viewport. Cross-iframe
 *                       scroll propagation works even without parent cooperation.
 *
 * When NOT embedded, all values are empty/undefined/noop and the existing
 * Tailwind classes work unchanged.
 */

interface ParentViewport {
  scrollY: number;
  innerHeight: number;
  iframeTop: number;
}

export interface EmbedViewportResult {
  isEmbedded: boolean;
  overlayStyle: React.CSSProperties;
  cardMaxHeight: string | undefined;
  attachCardRef: (node: HTMLElement | null) => void;
}

const inIframe = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return window.parent !== window;
  } catch {
    return true;
  }
};

// Sensible upper bound for a modal card height in pixels. Tall enough to fit
// the referral form on a laptop, short enough to stay reachable on a phone
// without relying on dvh/vh (which break inside a tall iframe).
const FALLBACK_MAX_CARD_PX = 680;

// How long to wait for the parent to respond before assuming the parent
// listener is not installed and falling back to self-contained behavior.
const PARENT_RESPONSE_TIMEOUT_MS = 600;

export function useEmbedViewport(active: boolean): EmbedViewportResult {
  const isEmbedded = useMemo(inIframe, []);
  const [viewport, setViewport] = useState<ParentViewport | null>(null);
  const [parentTimedOut, setParentTimedOut] = useState(false);
  const lastRequestRef = useRef(0);
  const cardRef = useRef<HTMLElement | null>(null);

  // Scroll the modal card into view once it's attached. scrollIntoView
  // propagates up through ancestor frames, so even without any parent
  // postMessage cooperation, the parent page will scroll so the modal is
  // visible. We do this for both MODE A and MODE B because it costs nothing
  // when the modal is already in view.
  const attachCardRef = useCallback((node: HTMLElement | null) => {
    cardRef.current = node;
    if (!node || !active || !isEmbedded) return;
    // Defer to next frame so layout has settled (max-height applied, etc).
    requestAnimationFrame(() => {
      try {
        node.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
      } catch {
        // Older browsers without smooth scroll support.
        try { node.scrollIntoView(); } catch { /* ignore */ }
      }
    });
  }, [active, isEmbedded]);

  useEffect(() => {
    if (!active || !isEmbedded) {
      setParentTimedOut(false);
      return;
    }

    let timedOut = false;
    const timeoutHandle = window.setTimeout(() => {
      timedOut = true;
      setParentTimedOut(true);
    }, PARENT_RESPONSE_TIMEOUT_MS);

    const requestViewport = () => {
      const now = Date.now();
      if (now - lastRequestRef.current < 100) return;
      lastRequestRef.current = now;
      try {
        window.parent.postMessage({ type: 'requestParentViewport' }, '*');
      } catch {
        // ignore - cross-origin restrictions, etc.
      }
    };

    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || data.type !== 'parentViewport') return;
      const { scrollY, innerHeight, iframeTop } = data;
      if (
        typeof scrollY !== 'number' ||
        typeof innerHeight !== 'number' ||
        typeof iframeTop !== 'number'
      ) {
        return;
      }
      // Parent responded - cancel the fallback timer if it hasn't already
      // fired, and clear the timed-out flag in case the parent comes online
      // after the modal has been open a while.
      window.clearTimeout(timeoutHandle);
      if (timedOut) setParentTimedOut(false);
      setViewport({ scrollY, innerHeight, iframeTop });
    };

    window.addEventListener('message', onMessage);

    // Ask immediately, then poll so that if the user scrolls or resizes the
    // parent window while the modal is open, we keep re-centering. (We
    // cannot listen to parent scroll/resize events directly across the
    // iframe boundary.)
    requestViewport();
    const interval = window.setInterval(requestViewport, 250);

    const onResize = () => requestViewport();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('message', onMessage);
      window.removeEventListener('resize', onResize);
      window.clearInterval(interval);
      window.clearTimeout(timeoutHandle);
    };
  }, [active, isEmbedded]);

  return useMemo<EmbedViewportResult>(() => {
    if (!isEmbedded) {
      return {
        isEmbedded,
        overlayStyle: {},
        cardMaxHeight: undefined,
        attachCardRef,
      };
    }

    // MODE A — parent responded with real viewport data.
    if (viewport) {
      // Translate the parent's visible band into iframe-document coordinates.
      // `iframeTop` is the iframe's top in the parent's document coordinate
      // space. The parent's visible window spans [scrollY, scrollY + innerHeight]
      // in parent coords; subtract iframeTop to express that range relative to
      // the iframe's own top.
      const topInIframe = viewport.scrollY - viewport.iframeTop;
      const visibleHeight = viewport.innerHeight;

      const overlayStyle: React.CSSProperties = {
        // Override Tailwind's `fixed inset-0`. `fixed` pins to the iframe's
        // entire (thousands-of-px) box, which is exactly the bug. Absolute
        // anchored to the slice of the iframe that is currently visible in
        // the parent solves it.
        position: 'absolute',
        top: `${Math.max(0, topInIframe)}px`,
        left: 0,
        right: 0,
        height: `${visibleHeight}px`,
        // Reset Tailwind `inset-0` bottom.
        bottom: 'auto',
      };

      // Cap card height to the visible parent window minus a little padding so
      // the modal card never overflows the user's visible area. (The Tailwind
      // `max-h-[92dvh]` style would otherwise resolve to ~92% of the entire
      // iframe box, defeating the centering.)
      const cardMaxHeight = `${Math.max(280, visibleHeight - 32)}px`;

      return { isEmbedded, overlayStyle, cardMaxHeight, attachCardRef };
    }

    // MODE B — fallback: parent listener not installed (or has not responded
    // yet). The modal will scrollIntoView on mount via attachCardRef, which
    // propagates across the iframe boundary and brings the modal into the
    // user's actual viewport. We still need to cap the card height in pixels
    // (NOT vh/dvh, which would resolve to the tall iframe box).
    if (parentTimedOut) {
      // Use the iframe's own scroll position as a hint for where to anchor
      // the overlay. In most embed scenarios the iframe itself does not
      // scroll (the parent does), so this is typically 0 — but if the
      // iframe ever does scroll internally we want to track that.
      const iframeScrollY =
        typeof window !== 'undefined' ? window.scrollY || 0 : 0;

      // For the overlay height, use the iframe's own innerHeight capped to a
      // sensible maximum. This is the iframe's box height which, in our
      // setup, equals the document scrollHeight (because we post efHeight
      // to the parent for resizing). So this can be very large. We cap it
      // and rely on scrollIntoView to bring the modal into the actual
      // visible area.
      const overlayHeight = FALLBACK_MAX_CARD_PX + 80;

      const overlayStyle: React.CSSProperties = {
        position: 'absolute',
        top: `${iframeScrollY}px`,
        left: 0,
        right: 0,
        height: `${overlayHeight}px`,
        bottom: 'auto',
        // Center contents inside the overlay band. Reset Tailwind's
        // `items-end` mobile default so the card lands in the middle of
        // the visible slice rather than at the bottom (which on a tall
        // iframe means far off-screen).
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      };

      const cardMaxHeight = `${FALLBACK_MAX_CARD_PX}px`;
      return { isEmbedded, overlayStyle, cardMaxHeight, attachCardRef };
    }

    // Embedded but parent has not timed out yet and has not responded —
    // pre-emptively apply the fallback overlay so the modal never lands
    // off-screen even for the first 600ms. (Without this, the modal would
    // flash at the geometric center of the iframe before the fallback
    // kicks in.)
    const overlayStyle: React.CSSProperties = {
      position: 'absolute',
      top: `${typeof window !== 'undefined' ? window.scrollY || 0 : 0}px`,
      left: 0,
      right: 0,
      height: `${FALLBACK_MAX_CARD_PX + 80}px`,
      bottom: 'auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    };
    const cardMaxHeight = `${FALLBACK_MAX_CARD_PX}px`;
    return { isEmbedded, overlayStyle, cardMaxHeight, attachCardRef };
  }, [isEmbedded, viewport, parentTimedOut, attachCardRef]);
}
