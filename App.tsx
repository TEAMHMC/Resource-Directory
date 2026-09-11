
import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { Search, RotateCcw, ShieldAlert, Heart, Building2, Map as MapIcon, Layers, Info, Users, CheckCircle2, ChevronDown, ChevronUp, Compass, Plus, X, Loader2, CheckCircle } from 'lucide-react';
import { Resource, FilterState, CATEGORIES, ChatContext } from './types';
import { ALL_RESOURCES, HMC_PROGRAMS, FEATURED_PARTNERS, SPA_NAMES, spaCovers, serviceCategoriesFor, searchHaystack, parseSearchQuery } from './constants';
import ResourceCard from './components/ResourceCard';
import { useEmbedViewport } from './hooks/useEmbedViewport';
const ResourceModal = lazy(() => import('./components/ResourceModal'));
const ChatWidget = lazy(() => import('./components/ChatWidget'));
const VibeCheckModal = lazy(() => import('./components/VibeCheckModal'));

const normalizeValue = (value: string): string => {
  const v = value.toLowerCase().trim();
  if (v.includes('senior')) return 'Seniors';
  if (v.includes('youth') || v.includes('child')) return 'Youth & Young Adults';
  if (v.includes('unhoused') || v.includes('homeless')) return 'People Experiencing Homelessness';
  if (v.includes('justice') || v.includes('reentry') || v.includes('incarcerated')) return 'Justice-Impacted';
  if (v.includes('disab')) return 'People with Disabilities';
  if (v.includes('veteran')) return 'Veterans';
  if (v.includes('survivor') || v.includes('dv/sa')) return 'Survivors of DV/SA';
  if (v.includes('lgbtq')) return 'LGBTQ+';
  return value;
};

const PORTAL_URL = 'https://volunteer.healthmatters.clinic';

const SUGGEST_CATEGORIES = [
  "Basic Needs", "Mental & Behavioral Health", "HIV / Sexual Health",
  "Housing & Shelter", "Health Care", "Food Assistance",
  "Community Support", "Legal Aid", "Transportation", "Research Study", "Other"
];

// --- Duplicate detection helpers ---
const normalizeForMatch = (s: string): string =>
  s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();

const wordOverlapScore = (a: string, b: string): number => {
  const wordsA = new Set(normalizeForMatch(a).split(' ').filter(w => w.length > 2));
  const wordsB = new Set(normalizeForMatch(b).split(' ').filter(w => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let shared = 0;
  wordsA.forEach(w => { if (wordsB.has(w)) shared++; });
  return shared / Math.max(wordsA.size, wordsB.size);
};

const findDuplicateResource = (name: string): Resource | null => {
  if (!name || name.trim().length < 3) return null;
  const normInput = normalizeForMatch(name);
  const allForCheck = [...ALL_RESOURCES, ...HMC_PROGRAMS, ...FEATURED_PARTNERS];
  for (const r of allForCheck) {
    const normExisting = normalizeForMatch(r.name);
    if (
      normInput.includes(normExisting) ||
      normExisting.includes(normInput) ||
      wordOverlapScore(normInput, normExisting) >= 0.7
    ) {
      return r;
    }
  }
  return null;
};

const SuggestResourceModal: React.FC<{
  onClose: () => void;
  editResource?: Resource | null;
  onSwitchToEdit?: (resource: Resource) => void;
}> = ({ onClose, editResource = null, onSwitchToEdit }) => {
  const isEditMode = editResource !== null;

  const [form, setForm] = useState({
    resourceName: editResource?.name || '',
    description: editResource?.description || '',
    category: editResource?.category || '',
    submitterName: '',
    submitterEmail: '',
    contactName: '',
    contactEmail: editResource?.email || '',
    contactPhone: editResource?.phone || '',
    websiteUrl: editResource?.website || '',
    address: editResource?.address || '',
    hours: editResource?.hours || '',
    eligibility: editResource?.eligibility || '',
    languages: editResource?.languages || '',
    targetPopulation: editResource?.targetPopulation || '',
    geographicArea: editResource?.geographicArea || '',
    intakeNotes: editResource?.referralNotes || '',
    website_url: '', // honeypot
  });
  const [correctionNote, setCorrectionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [duplicateMatch, setDuplicateMatch] = useState<Resource | null>(null);
  const [dismissedDuplicate, setDismissedDuplicate] = useState(false);
  const { overlayStyle, cardMaxHeight } = useEmbedViewport(true);

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleNameBlur = () => {
    if (isEditMode) return;
    const match = findDuplicateResource(form.resourceName);
    setDuplicateMatch(match);
    setDismissedDuplicate(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = isEditMode
        ? {
            ...form,
            isEditSuggestion: true,
            existingResourceId: editResource!.id,
            existingResourceName: editResource!.name,
            correctionNote,
          }
        : { ...form, wantPartnerInfo: true };
      const res = await fetch(`${PORTAL_URL}/api/public/suggest-resource`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Submission failed');
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-[#233dff]/20 focus:border-[#233dff] focus:outline-none transition-all";
  const labelClass = "block text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-1.5";

  const showDuplicateWarning = !isEditMode && duplicateMatch && !dismissedDuplicate;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label={isEditMode ? "Suggest an edit" : "Suggest a resource"} style={overlayStyle}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[92dvh]" style={cardMaxHeight ? { maxHeight: cardMaxHeight } : undefined}>
        <div className="flex-shrink-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <h2 className="font-display text-xl font-medium text-gray-900">{isEditMode ? 'Suggest an Edit' : 'Suggest a Resource'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors" aria-label="Close"><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center py-12 px-6 text-center gap-4 overflow-y-auto flex-1 min-h-0 overscroll-contain">
            <CheckCircle className="w-14 h-14 text-emerald-500" />
            <h3 className="font-display text-2xl font-medium text-gray-900">Thank you!</h3>
            <p className="text-gray-600 text-sm leading-relaxed max-w-sm">
              {isEditMode
                ? 'We got your edit suggestion. Our team will review it and email you once we decide.'
                : 'We got your submission. Our team will review it and email you once we decide.'}
            </p>
            <button onClick={onClose} className="mt-2 px-6 py-3 bg-[#233dff] text-white rounded-full text-sm font-medium hover:bg-[#1a2b99] transition-colors">Close</button>

            {!isEditMode && (
              <>
                <div className="w-full border-t border-gray-200 mt-4" />
                <p className="text-sm font-semibold text-gray-700 mt-2">Want to do more with HMC?</p>
                <div className="w-full max-w-md text-left border-l-4 border-amber-400 bg-amber-50 rounded-2xl px-5 py-4">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Your organization can join the HMC Partner Network. Post events to the Event Finder, manage referrals from HMC clients, work with other community organizations, and sign partnership agreements online.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 mt-1">
                  <a
                    href="https://volunteer.healthmatters.clinic?page=partner"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-amber-500 text-white rounded-full text-sm font-medium hover:bg-amber-600 transition-colors"
                  >
                    Create a Partner Account &rarr;
                  </a>
                  <a
                    href="https://volunteer.healthmatters.clinic?page=partner"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2 transition-colors"
                  >
                    Learn More
                  </a>
                </div>
              </>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="px-6 py-6 space-y-6 overflow-y-auto flex-1 min-h-0 overscroll-contain">
            {/* Honeypot */}
            <input type="text" name="website_url" value={form.website_url} onChange={e => set('website_url', e.target.value)} style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" />

            {isEditMode ? (
              <>
                <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3">
                  <Info className="w-4 h-4 text-[#233dff] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700 leading-relaxed">
                    <span className="font-semibold">Editing:</span> {editResource!.name}
                    <br />
                    <span className="text-gray-500 text-xs">Update any fields below and describe what needs to be corrected.</span>
                  </p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#233dff]">What Needs to Be Corrected?</h3>
                  <div>
                    <label className={labelClass}>Description of the correction <span className="text-rose-500">*</span></label>
                    <textarea
                      required
                      value={correctionNote}
                      onChange={e => setCorrectionNote(e.target.value)}
                      rows={3}
                      className={`${fieldClass} resize-none`}
                      placeholder="e.g., The phone number has changed, the hours are outdated, the address is incorrect..."
                    />
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-600 leading-relaxed">Know a program, clinic, or organization that should be in this directory? Submit it below. Our team reviews all submissions before they are added.</p>
            )}

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#233dff]">Resource Information</h3>
              <div>
                <label className={labelClass}>Organization / Resource Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={form.resourceName}
                  onChange={e => { set('resourceName', e.target.value); if (duplicateMatch) { setDuplicateMatch(null); } }}
                  onBlur={handleNameBlur}
                  className={fieldClass}
                  placeholder="e.g., Filipino Family Health Initiative"
                  readOnly={isEditMode}
                />
                {showDuplicateWarning && (
                  <div className="mt-2 bg-amber-50 border border-amber-300 rounded-2xl p-4 space-y-2">
                    <p className="text-sm text-amber-800 font-medium">
                      This resource may already be in our directory: <span className="font-bold">{duplicateMatch!.name}</span>
                    </p>
                    <p className="text-xs text-amber-700">If you are updating their info, use "Suggest an Edit" instead.</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {onSwitchToEdit && (
                        <button
                          type="button"
                          onClick={() => onSwitchToEdit(duplicateMatch!)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#233dff] text-white rounded-full text-xs font-medium hover:bg-[#1a2b99] transition-colors"
                        >
                          Suggest an Edit for {duplicateMatch!.name} →
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDismissedDuplicate(true)}
                        className="px-4 py-2 rounded-full text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200"
                      >
                        It is different, continue
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className={labelClass}>Category <span className="text-rose-500">*</span></label>
                <select required value={form.category} onChange={e => set('category', e.target.value)} className={fieldClass}>
                  <option value="">Select a category</option>
                  {SUGGEST_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Description <span className="text-rose-500">*</span></label>
                <textarea required value={form.description} onChange={e => set('description', e.target.value)} rows={3} className={`${fieldClass} resize-none`} placeholder="What services or programs do you offer? Who do you serve?" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Website</label>
                  <input type="url" value={form.websiteUrl} onChange={e => set('websiteUrl', e.target.value)} className={fieldClass} placeholder="https://example.org" />
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <input type="tel" value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} className={fieldClass} placeholder="(xxx) xxx-xxxx" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Contact Email</label>
                  <input type="email" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} className={fieldClass} placeholder="info@organization.org" />
                </div>
                <div>
                  <label className={labelClass}>Geographic Area Served</label>
                  <input type="text" value={form.geographicArea} onChange={e => set('geographicArea', e.target.value)} className={fieldClass} placeholder="e.g., Los Angeles County, California" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Who is eligible / Who do you serve?</label>
                <input type="text" value={form.eligibility} onChange={e => set('eligibility', e.target.value)} className={fieldClass} placeholder="e.g., Filipino children ages 8-12 in California" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Languages Available</label>
                  <input type="text" value={form.languages} onChange={e => set('languages', e.target.value)} className={fieldClass} placeholder="e.g., English, Tagalog" />
                </div>
                <div>
                  <label className={labelClass}>Hours of Operation</label>
                  <input type="text" value={form.hours} onChange={e => set('hours', e.target.value)} className={fieldClass} placeholder="e.g., Mon-Fri 9am-5pm" />
                </div>
              </div>
              <div>
                <label className={labelClass}>How to Access / How to Refer</label>
                <input type="text" value={form.intakeNotes} onChange={e => set('intakeNotes', e.target.value)} className={fieldClass} placeholder="e.g., Email study team, visit website to enroll" />
              </div>
            </div>

            <div className="space-y-4 border-t border-gray-100 pt-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#233dff]">Your Information</h3>
              <p className="text-xs text-gray-500">We will contact you when your submission is reviewed.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Your Name <span className="text-rose-500">*</span></label>
                  <input type="text" required value={form.submitterName} onChange={e => set('submitterName', e.target.value)} className={fieldClass} placeholder="First and last name" />
                </div>
                <div>
                  <label className={labelClass}>Your Email <span className="text-rose-500">*</span></label>
                  <input type="email" required value={form.submitterEmail} onChange={e => set('submitterEmail', e.target.value)} className={fieldClass} placeholder="you@organization.org" />
                </div>
              </div>
            </div>

          </div>
          {error && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl mx-6 mb-2 px-4 py-3">{error}</p>}
          <div className="flex-shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-white rounded-b-3xl">
              <button type="button" onClick={onClose} className="px-5 py-3 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
              <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 px-6 py-3 bg-[#233dff] text-white rounded-full text-sm font-medium hover:bg-[#1a2b99] disabled:opacity-50 transition-colors">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {submitting ? 'Submitting...' : (isEditMode ? 'Submit Edit for Review' : 'Submit for Review')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  /**
   * A search that arrives in the link.
   *
   * The Member Hub's search bar, the Playbook's resource links and Sunny all send people
   * here as directory.healthmatters.clinic/?q=<what they typed>. Nothing read that
   * parameter, so every one of those arrived at an unfiltered directory with their words
   * thrown away, and the search looked broken from the outside while working fine from
   * the inside. Read once, at first render, so typing afterwards is never overwritten.
   */
  const initialFilters = (): FilterState => {
    const base: FilterState = {
      q: "", category: "All", community: "All", geo: "All",
      spa: "All", service: "All", population: "All",
    };
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q');
      if (q) base.q = q.slice(0, 120);
      const category = params.get('category');
      if (category) base.category = category;
      const spa = params.get('spa');
      if (spa) base.spa = /^\d$/.test(spa) ? `SPA ${spa}` : spa;
      const service = params.get('service');
      if (service) base.service = service;
    } catch {
      /* no URL to read, e.g. a non-browser render. The empty filters below are correct. */
    }
    return base;
  };

  const [filters, setFilters] = useState<FilterState>(() => initialFilters());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeResource, setActiveResource] = useState<Resource | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showCompass, setShowCompass] = useState(false);
  const [autoStartDisaster, setAutoStartDisaster] = useState(false);
  const [chatContext, setChatContext] = useState<ChatContext | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [suggestEditResource, setSuggestEditResource] = useState<Resource | null>(null);
  const [officialPartnerNames, setOfficialPartnerNames] = useState<Set<string>>(new Set());

  const pinnedIds = useMemo(() => new Set([...HMC_PROGRAMS.map(r => r.id), ...FEATURED_PARTNERS.map(r => r.id)]), []);

  /**
   * "All" first, then everything else alphabetically.
   *
   * Every one of these lists was built as ["All", ...values].sort(), which sorts "All"
   * along with the values. So the reset option was filed under A, between Advocacy and
   * Basic Needs in one list and after "Adults with SMI" in another, and the way to clear
   * a filter was hidden in the middle of the thing it clears.
   */
  const withAllFirst = (values: string[]): string[] =>
    ["All", ...[...new Set(values)].filter((v) => v && v !== 'All').sort((a, b) => a.localeCompare(b))];

  const communityFocusOptions = useMemo(() => withAllFirst(
    ALL_RESOURCES.flatMap(r =>
      (r.communityFocus || "").split(',').map(s => normalizeValue(s.trim())).filter(Boolean)
    )
  ), []);

  const geoAreaOptions = useMemo(() => withAllFirst(
    ALL_RESOURCES.map(r => r.geographicArea).filter(Boolean) as string[]
  ), []);

  /**
   * One row per SPA, even for an organisation that covers several.
   *
   * `spa` is a single free-text field that in practice holds "SPA 4", "SPA 4, SPA 6" and
   * "All SPAs". Feeding it straight into a filter produced a dropdown listing every
   * combination anybody had typed as though each were its own area, so an organisation
   * serving two SPAs was findable under neither of them. The eight real areas are listed
   * once each, and the matcher below decides whether a row covers the one selected.
   */
  const spaOptions = useMemo(() => ['All', ...SPA_NAMES], []);

  const serviceOptions = useMemo(() => withAllFirst(
    ALL_RESOURCES.flatMap(r => serviceCategoriesFor(r))
  ), []);

  const populationOptions = useMemo(() => withAllFirst(
    ALL_RESOURCES.flatMap(r =>
      (r.targetPopulation || "").split(',').map(s => normalizeValue(s.trim())).filter(Boolean)
    )
  ), []);

  const searchQuery = useMemo(() => parseSearchQuery(filters.q), [filters.q]);

  /** Whether anybody has actually narrowed anything. */
  const isFiltering = useMemo(() => (
    filters.q.trim() !== '' || filters.category !== 'All' || filters.service !== 'All' ||
    filters.population !== 'All' || filters.community !== 'All' || filters.geo !== 'All' ||
    filters.spa !== 'All'
  ), [filters]);

  const filteredResources = useMemo(() => {
    /**
     * What gets searched, and why HMC's own work is in it.
     *
     * HMC Programs and Featured Partners were rendered in their own sections above the
     * directory and then excluded from the search by id, so the moment anybody typed
     * anything, every HMC program and every featured partner disappeared. Searching
     * "mental health" returned no Unstoppable, no Unboxed, no wellness meetups, and no
     * LACDMH help line: a directory run by HMC that could not find HMC.
     *
     * With nothing typed the two pinned sections still render above and are left out
     * here, so the page is not the same cards twice. Once somebody searches, they are
     * searched with everything else and sorted first, because a person looking for mental
     * health support in our own directory should be shown what we ourselves run.
     */
    const pool = isFiltering
      ? [...HMC_PROGRAMS, ...FEATURED_PARTNERS, ...ALL_RESOURCES]
      : ALL_RESOURCES;

    return pool.filter(r => {
      if (!isFiltering && pinnedIds.has(r.id)) return false;

      // A SPA typed into the search box narrows exactly as the dropdown does, so
      // "housing in spa 1" answers the question that was asked rather than the
      // question without the area.
      if (searchQuery.spas.length && !searchQuery.spas.every(n => spaCovers(r.spa, `SPA ${n}`))) return false;

      // Every word has to appear somewhere, rather than the whole phrase appearing
      // verbatim. The old check asked whether the record contained the literal string
      // "reentry in compton", which no record ever will, so any search of more than one
      // word returned nothing at all.
      //
      // The haystack includes the derived service categories, not just the stored
      // fields. Reentry is derived from phrases like justice-involved and formerly
      // incarcerated: only 9 of 322 listings say "reentry", while 64 are reentry
      // providers. Searching the raw record found the 9 and hid the other 55.
      if (searchQuery.tokens.length) {
        const hay = searchHaystack(r);
        if (!searchQuery.tokens.every(t => hay.includes(t))) return false;
      }
      if (filters.category !== "All" && r.category !== filters.category) return false;
      if (filters.community !== "All") {
        const communityFocuses = (r.communityFocus || "").split(',').map(s => normalizeValue(s.trim()));
        if (!communityFocuses.includes(filters.community)) return false;
      }
      if (filters.geo !== "All" && r.geographicArea !== filters.geo) return false;
      if (!spaCovers(r.spa, filters.spa)) return false;
      
      if (filters.service !== "All" && !serviceCategoriesFor(r).includes(filters.service)) return false;
      if (filters.population !== "All") {
        const pops = (r.targetPopulation || "").split(',').map(s => normalizeValue(s.trim()));
        if (!pops.includes(filters.population)) return false;
      }

      return true;
    });
  }, [filters, pinnedIds, searchQuery, isFiltering]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resourceId = params.get('r');
    if (resourceId) {
      const all = [...ALL_RESOURCES, ...HMC_PROGRAMS, ...FEATURED_PARTNERS];
      const found = all.find(r => r.id === resourceId);
      if (found) setActiveResource(found);
    }
    if (params.get('relief') === 'true') {
      setAutoStartDisaster(true);
      setShowCompass(true);
    }
  }, []);

  useEffect(() => {
    const ALLOWED_ORIGINS = ['https://www.healthmatters.clinic', 'https://healthmatters.clinic'];
    const handler = (e: MessageEvent) => {
      if (!ALLOWED_ORIGINS.includes(e.origin)) return;
      if (e.data && e.data.type === 'openRelief') {
        setAutoStartDisaster(true);
        setShowCompass(true);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  useEffect(() => {
    fetch('https://volunteer.healthmatters.clinic/api/public/official-partners')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const names = new Set<string>(
            data.partners.map((p: any) => p.name.toLowerCase().trim())
          );
          setOfficialPartnerNames(names);
        }
      })
      .catch(() => {}); // fail silently, badge is enhancement only
  }, []);

  // When embedded in an iframe (e.g. inside the Webflow page), post our document
  // height to the parent so it can resize the iframe to fit content. Otherwise
  // the iframe gets a fixed height and we end up with two scrollbars (one inside
  // the iframe, one on the Webflow page). Reuses the 'efHeight' protocol that
  // the Webflow custom code already listens for.
  useEffect(() => {
    if (typeof window === 'undefined' || window.parent === window) return;
    let lastSent = 0;
    const postHeight = () => {
      const h = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      );
      if (h && h !== lastSent) {
        lastSent = h;
        window.parent.postMessage({ type: 'efHeight', height: h }, '*');
      }
    };
    postHeight();
    const ro = new ResizeObserver(() => postHeight());
    ro.observe(document.body);
    window.addEventListener('resize', postHeight);
    const interval = window.setInterval(postHeight, 1500); // catch async content
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', postHeight);
      window.clearInterval(interval);
    };
  }, []);

  const isOfficialPartner = (resource: Resource): boolean => {
    const normalizedName = resource.name.toLowerCase().trim();
    return officialPartnerNames.has(normalizedName);
  };

  const handleShare = async (resource: Resource) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?r=${resource.id}`;
    const shareText = `Check out this resource: ${resource.name}\n${resource.phone || ''}\n${resource.website || ''}`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: resource.name, text: shareText, url: shareUrl });
      } catch (err: any) {
        if (err.name !== 'AbortError') showToast("Sharing cancelled or failed.");
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        showToast("Link copied to clipboard");
      } catch (err) {
        showToast("Unable to copy link.");
      }
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const resetFilters = () => setFilters({ q: "", category: "All", community: "All", geo: "All", spa: "All", service: "All", population: "All" });
  
  const handleCompassComplete = (context: ChatContext) => {
    setShowCompass(false);
    setChatContext(context);
    setIsChatOpen(true);
  };

  return (
    <div className="min-h-screen">
      <div role="banner" className="bg-[#e63946] text-white px-4 py-2.5 flex flex-wrap items-center justify-center gap-3 text-sm font-bold z-[60] shadow-md">
        <ShieldAlert className="w-5 h-5 animate-pulse" aria-hidden="true" />
        <span>Crisis? Call or Text 988 (24/7 Suicide &amp; Crisis Lifeline)</span>
        <a href="tel:988" aria-label="Call 988 Suicide and Crisis Lifeline" className="hmc-btn hmc-btn-primary min-h-[44px]"><span className="w-2 h-2 rounded-full bg-white" aria-hidden="true"></span>Call Now</a>
      </div>

      <header className="container mx-auto max-w-7xl px-4 pt-6 pb-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
          <div className="max-w-3xl">
            <h1 className="font-display text-4xl md:text-5xl font-medium text-gray-900 tracking-normal leading-none mb-2">
              Resource <br /><span className="text-[#233dff]">Directory.</span>
            </h1>
            <p className="text-base text-gray-600 font-medium leading-relaxed">
              Health, housing, and mental health support for our community, in one place.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSuggestModal(true)}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full font-normal text-base border border-[#233dff] bg-white text-[#233dff] hover:bg-blue-50 hover:shadow-[0_4px_12px_rgba(35,61,255,0.1)] transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />Suggest a Resource
            </button>
            <button
              onClick={() => setShowCompass(true)}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full font-normal text-base border border-[#0f0f0f] bg-white text-[#1a1a1a] hover:bg-gray-50 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all active:scale-95"
            >
              <span className="w-2 h-2 rounded-full bg-[#0f0f0f]"></span>Get Support
            </button>
          </div>
        </div>
        
        <div className="bg-white/50 border border-[#233dff]/20 rounded-2xl p-4 text-center mb-4 shadow-sm">
            <div className="font-display flex items-center justify-center gap-2 text-lg font-medium text-gray-700 mb-1">
                <Compass className="w-5 h-5 text-[#233dff]" /> Need help finding resources?
            </div>
            <p className="text-gray-600 text-sm mb-3">Sunny can help you navigate to the right support.</p>
            <button
                onClick={() => setShowCompass(true)}
                className="hmc-btn hmc-btn-primary"
            >
                <span className="w-2 h-2 rounded-full bg-white"></span>Ask Sunny
            </button>
        </div>


        <div className="bg-white/70 backdrop-blur-xl border border-gray-200 rounded-2xl p-4 md:p-6 shadow-sm mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-2">
              <label htmlFor="resource-search" className="text-[10px] font-medium uppercase tracking-wide text-gray-400 mb-2 block">Search Keywords</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
                <input
                  id="resource-search"
                  type="text"
                  value={filters.q}
                  onChange={(e) => setFilters({...filters, q: e.target.value})}
                  placeholder="Name, clinic, service..."
                  aria-label="Search resources by name, clinic, or service type"
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#233dff]/20 focus:border-[#233dff] focus:outline-none transition-all font-medium text-base"
                />
              </div>
            </div>
            
            <FilterSelect 
              label="Resource Category" 
              icon={<Layers className="w-3 h-3"/>}
              value={filters.category} 
              options={CATEGORIES} 
              onChange={(v) => setFilters({...filters, category: v})} 
            />

            <FilterSelect 
              label="Service Planning Area (SPA)" 
              icon={<Building2 className="w-3 h-3"/>}
              value={filters.spa} 
              options={spaOptions} 
              onChange={(v) => setFilters({...filters, spa: v})} 
            />
          </div>

          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6 pt-6 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
               <FilterSelect 
                label="Service Type" 
                icon={<CheckCircle2 className="w-3 h-3"/>}
                value={filters.service} 
                options={serviceOptions} 
                onChange={(v) => setFilters({...filters, service: v})} 
              />
              
              <FilterSelect 
                label="Target Population" 
                icon={<Users className="w-3 h-3"/>}
                value={filters.population} 
                options={populationOptions} 
                onChange={(v) => setFilters({...filters, population: v})} 
              />
              
              <FilterSelect 
                label="Community Focus" 
                icon={<Heart className="w-3 h-3"/>}
                value={filters.community} 
                options={communityFocusOptions} 
                onChange={(v) => setFilters({...filters, community: v})} 
              />
              
              <FilterSelect 
                label="Geographic Scope" 
                icon={<MapIcon className="w-3 h-3"/>}
                value={filters.geo} 
                options={geoAreaOptions} 
                onChange={(v) => setFilters({...filters, geo: v})} 
              />
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[#233dff] hover:text-[#233dff]/80 transition-colors"
              >
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {showAdvanced ? "Fewer Filters" : "More Filters"}
              </button>
            </div>
            <button 
              onClick={resetFilters}
              className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-400 hover:text-[#233dff] transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Reset Filters
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl px-4">
        <div className="bg-blue-50/50 border border-blue-200/50 text-gray-700 rounded-2xl p-3 flex flex-col sm:flex-row items-center gap-3 text-sm mb-6">
          <Info className="w-8 h-8 text-[#233dff] flex-shrink-0" />
          <p className="flex-grow text-center sm:text-left font-medium">
            We update this directory often. If you represent an organization and see something out of date, tell us.
          </p>
          <a 
            href="mailto:partner@healthmatters.clinic?subject=Directory Update Request"
            className="hmc-btn hmc-btn-primary whitespace-nowrap flex-shrink-0"
          >
            <span className="w-2 h-2 rounded-full bg-white"></span>Suggest an Edit
          </a>
        </div>

        {!isFiltering && (
          <div className="space-y-8 mb-8">
            <section>
              <SectionHeader title="HMC Programs" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {HMC_PROGRAMS.map(r => (
                  <ResourceCard key={r.id} resource={r} onOpen={setActiveResource} onShare={handleShare} isPinned />
                ))}
              </div>
            </section>

            <section>
              <SectionHeader title="Featured Partners" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {FEATURED_PARTNERS.map(r => (
                  <ResourceCard key={r.id} resource={r} onOpen={setActiveResource} onShare={handleShare} isPartner={isOfficialPartner(r)} />
                ))}
              </div>
            </section>
          </div>
        )}

        <section>
          {/* Named for what it is holding. Once somebody searches, this list also carries
              HMC's own programs and the featured partners, so calling it the Community
              Directory would be describing only part of it. */}
          <SectionHeader title={isFiltering ? `${filteredResources.length} ${filteredResources.length === 1 ? 'result' : 'results'}` : 'Community Directory'} />
          {filteredResources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map(r => (
                <ResourceCard
                  key={r.id}
                  resource={r}
                  onOpen={setActiveResource}
                  onShare={handleShare}
                  isPinned={pinnedIds.has(r.id)}
                  isPartner={isOfficialPartner(r)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-3xl">
              <h3 className="font-display text-xl font-medium text-gray-800">No resources found</h3>
              <p className="text-gray-500 mt-2">Try adjusting your filters or search terms.</p>
            </div>
          )}
        </section>
      </main>


      <Suspense fallback={null}>
        <ResourceModal
          resource={activeResource}
          onClose={() => setActiveResource(null)}
          onShare={handleShare}
          isPartner={activeResource ? isOfficialPartner(activeResource) : false}
          onSuggestEdit={(resource) => {
            setActiveResource(null);
            setSuggestEditResource(resource);
          }}
        />
      </Suspense>

      {showCompass && (
        <Suspense fallback={null}>
          <VibeCheckModal
            onClose={() => { setShowCompass(false); setAutoStartDisaster(false); }}
            onComplete={(ctx) => { setAutoStartDisaster(false); handleCompassComplete(ctx); }}
            autoStartDisaster={autoStartDisaster}
          />
        </Suspense>
      )}

      <Suspense fallback={null}>
        <ChatWidget
          onResourceClick={(r) => setActiveResource(r)}
          initialContext={chatContext}
          onContextHandled={() => setChatContext(null)}
          isOpen={isChatOpen}
          setIsOpen={setIsChatOpen}
          anyModalOpen={!!activeResource || showCompass || showSuggestModal || !!suggestEditResource}
        />
      </Suspense>

      {(showSuggestModal || suggestEditResource) && (
        <SuggestResourceModal
          editResource={suggestEditResource}
          onClose={() => { setShowSuggestModal(false); setSuggestEditResource(null); }}
          onSwitchToEdit={(resource) => {
            setShowSuggestModal(false);
            setSuggestEditResource(resource);
          }}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-2.5 rounded-full shadow-lg text-sm font-bold animate-in fade-in slide-in-from-bottom-2">
          {toast}
        </div>
      )}
    </div>
  );
};

const FilterSelect: React.FC<{label: string, icon: React.ReactNode, value: string, options: string[], onChange: (v: string) => void}> = ({ label, icon, value, options, onChange }) => {
  const id = `filter-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div>
      <label htmlFor={id} className="text-[10px] font-medium uppercase tracking-wide text-gray-400 mb-2 flex items-center gap-1.5">{icon} {label}</label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none pl-4 pr-10 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#233dff]/20 focus:border-[#233dff] focus:outline-none transition-all font-medium text-base"
        >
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" aria-hidden="true" />
      </div>
    </div>
  );
};

const SectionHeader: React.FC<{title: string}> = ({ title }) => (
  <div className="flex items-end justify-between mb-6 border-b-2 border-gray-100 pb-3">
    <h2 className="font-display text-3xl font-medium text-gray-800 tracking-normal">{title}</h2>
  </div>
);

export default App;
