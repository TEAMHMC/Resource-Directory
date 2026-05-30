import { useEffect, useState, useMemo, useRef } from 'react';

/**
 * useEmbedViewport
 *
 * Fixes the "modal opens at the bottom of an embedded iframe" bug.
 *
 * Context: this app is embedded in Webflow as an iframe whose height is
 * dynamically resized by the parent (via the 'efHeight' postMessage protocol)
 * so the iframe stretches to fit the full document — sometimes thousands of
 * pixels tall. Inside that tall iframe, `position: fixed` pins to the iframe's
 * own viewport (the entire iframe box), not the parent window's visible area.
 * Result: a flex-centered modal lands at the geometric center of the iframe
 * (often far below where the user is currently looking), and the user has to
 * scroll the parent page to find it. Likewise, `dvh`-based max-heights blow
 * up because `100dvh` is now the entire iframe box.
 *
 * This hook talks to the parent window with a small postMessage protocol:
 *   child -> parent : { type: 'requestParentViewport' }
 *   parent -> child : { type: 'parentViewport', scrollY, innerHeight, iframeTop }
 *
 * `iframeTop` is the iframe's bounding-rect top relative to the parent's
 * document (i.e. `rect.top + parent.scrollY`). With those three numbers we can
 * compute where the parent's visible window lands inside the iframe's
 * coordinate space, and absolute-position the modal there so it always shows
 * up in the user's currently-visible window.
 *
 * Returned styles (spread onto the elements that already exist on each modal):
 *   - `overlayStyle`  — the outer wrapper that currently uses
 *                       `fixed inset-0 ... flex items-(end|center) justify-center`.
 *                       When embedded, we override to absolute and clip to the
 *                       parent's visible band.
 *   - `cardMaxHeight` — a CSS string to use as `maxHeight` on the modal card
 *                       so it never exceeds the parent's visible area.
 *
 * When NOT embedded, both values are empty/undefined and the existing
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
}

const inIframe = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return window.parent !== window;
  } catch {
    return true;
  }
};

export function useEmbedViewport(active: boolean): EmbedViewportResult {
  const isEmbedded = useMemo(inIframe, []);
  const [viewport, setViewport] = useState<ParentViewport | null>(null);
  const lastRequestRef = useRef(0);

  useEffect(() => {
    if (!active || !isEmbedded) return;

    const requestViewport = () => {
      const now = Date.now();
      if (now - lastRequestRef.current < 100) return;
      lastRequestRef.current = now;
      try {
        window.parent.postMessage({ type: 'requestParentViewport' }, '*');
      } catch {
        // ignore
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
    };
  }, [active, isEmbedded]);

  return useMemo<EmbedViewportResult>(() => {
    if (!isEmbedded || !viewport) {
      return {
        isEmbedded,
        overlayStyle: {},
        cardMaxHeight: undefined,
      };
    }

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

    return { isEmbedded, overlayStyle, cardMaxHeight };
  }, [isEmbedded, viewport]);
}
