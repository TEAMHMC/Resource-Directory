
import React, { useState, useMemo, useEffect } from 'react';
import { Search, RotateCcw, ShieldAlert, Heart, Building2, Map as MapIcon, Layers, Info, Users, CheckCircle2, ChevronDown, ChevronUp, Compass } from 'lucide-react';
import { Resource, FilterState, CATEGORIES, ChatContext } from './types';
import { ALL_RESOURCES, HMC_PROGRAMS, FEATURED_PARTNERS } from './constants';
import ResourceCard from './components/ResourceCard';
import ResourceModal from './components/ResourceModal';
import ChatWidget from './components/ChatWidget';
import VibeCheckModal from './components/VibeCheckModal';

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

const App: React.FC = () => {
  const [filters, setFilters] = useState<FilterState>({
    q: "",
    category: "All",
    community: "All",
    geo: "All",
    spa: "All",
    service: "All",
    population: "All"
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeResource, setActiveResource] = useState<Resource | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showCompass, setShowCompass] = useState(false);
  const [chatContext, setChatContext] = useState<ChatContext | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const pinnedIds = useMemo(() => new Set([...HMC_PROGRAMS.map(r => r.id), ...FEATURED_PARTNERS.map(r => r.id)]), []);

  const communityFocusOptions = useMemo(() => {
    const allFocuses = ALL_RESOURCES.flatMap(r =>
      (r.communityFocus || "").split(',').map(s => normalizeValue(s.trim())).filter(Boolean)
    );
    return ["All", ...new Set(allFocuses)].sort();
  }, []);
  
  const geoAreaOptions = useMemo(() => ["All", ...new Set(ALL_RESOURCES.map(r => r.geographicArea).filter(Boolean))].sort(), []);
  
  const spaOptions = useMemo(() => ["All", ...new Set(ALL_RESOURCES.map(r => r.spa).filter(r => r && r !== 'N/A'))].sort(), []);

  const serviceOptions = useMemo(() => ["All", ...new Set(ALL_RESOURCES.flatMap(r => r.serviceCategories || []))].sort(), []);

  const populationOptions = useMemo(() => {
    const allPops = ALL_RESOURCES.flatMap(r => 
      (r.targetPopulation || "").split(',').map(s => normalizeValue(s.trim())).filter(Boolean)
    );
    return ["All", ...new Set(allPops)].sort();
  }, []);

  const filteredResources = useMemo(() => {
    return ALL_RESOURCES.filter(r => {
      if (pinnedIds.has(r.id)) return false;

      const q = filters.q.toLowerCase();
      if (q && !JSON.stringify(r).toLowerCase().includes(q)) return false;
      if (filters.category !== "All" && r.category !== filters.category) return false;
      if (filters.community !== "All") {
        const communityFocuses = (r.communityFocus || "").split(',').map(s => normalizeValue(s.trim()));
        if (!communityFocuses.includes(filters.community)) return false;
      }
      if (filters.geo !== "All" && r.geographicArea !== filters.geo) return false;
      if (filters.spa !== "All" && r.spa !== filters.spa) return false;
      
      if (filters.service !== "All" && !(r.serviceCategories || []).includes(filters.service)) return false;
      if (filters.population !== "All") {
        const pops = (r.targetPopulation || "").split(',').map(s => normalizeValue(s.trim()));
        if (!pops.includes(filters.population)) return false;
      }

      return true;
    });
  }, [filters, pinnedIds]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resourceId = params.get('r');
    if (resourceId) {
      const all = [...ALL_RESOURCES, ...HMC_PROGRAMS, ...FEATURED_PARTNERS];
      const found = all.find(r => r.id === resourceId);
      if (found) setActiveResource(found);
    }
  }, []);

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
      <div className="bg-[#e63946] text-white px-4 py-2.5 flex items-center justify-center gap-3 text-sm font-bold sticky top-0 z-[60] shadow-md">
        <ShieldAlert className="w-5 h-5 animate-pulse" />
        <span>Crisis? Call or Text 988 (24/7 Suicide & Crisis Lifeline)</span>
        <a href="tel:988" className="bg-white text-red-600 px-3 py-1 rounded-full text-xs ml-2 hover:bg-gray-100 border border-white font-bold">Call Now</a>
      </div>

      <header className="container mx-auto max-w-7xl px-4 pt-6 pb-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
          <div className="max-w-3xl">
            <h1 className="font-display text-4xl md:text-5xl font-medium text-gray-900 tracking-normal leading-none mb-2">
              Resource <br /><span className="text-[#233dff]">Directory.</span>
            </h1>
            <p className="text-base text-gray-600 font-medium leading-relaxed">
              Consolidated access to health, housing, and mental health support for the community.
            </p>
          </div>
        </div>
        
        <div className="bg-white/50 border border-[#233dff]/20 rounded-2xl p-4 text-center mb-4 shadow-sm">
            <div className="font-display flex items-center justify-center gap-2 text-lg font-medium text-gray-700 mb-1">
                <Compass className="w-5 h-5 text-[#233dff]" /> Need help finding resources?
            </div>
            <p className="text-gray-600 text-sm mb-3">Sunny can help you navigate to the right support.</p>
            <button
                onClick={() => setShowCompass(true)}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full font-semibold text-sm transition-all duration-200 border border-[#1a2baa] active:scale-95 tracking-wide bg-[#233dff] text-white hover:bg-[#1a2b99] hover:shadow-[0_4px_16px_rgba(35,61,255,0.35)]"
            >
                <span className="w-2 h-2 rounded-full bg-white"></span>Ask Sunny
            </button>
        </div>


        <div className="bg-white/70 backdrop-blur-xl border border-gray-200 rounded-2xl p-4 md:p-6 shadow-sm mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-2">
              <label className="text-[10px] font-medium uppercase tracking-wide text-gray-400 mb-2 block">Search Keywords</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  value={filters.q}
                  onChange={(e) => setFilters({...filters, q: e.target.value})}
                  placeholder="Name, clinic, service..."
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#233dff]/20 focus:border-[#233dff] outline-none transition-all font-medium"
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
              <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Showing <b>{filteredResources.length}</b> unique resources</span>
              </div>
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
            This directory is a living resource and is frequently updated. If you represent an organization and notice any inaccuracies, please help us keep it current.
          </p>
          <a 
            href="mailto:partner@healthmatters.clinic?subject=Directory Update Request"
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full font-semibold text-sm transition-all duration-200 border border-[#1a2baa] active:scale-95 tracking-wide bg-[#233dff] text-white hover:bg-[#1a2b99] hover:shadow-[0_4px_16px_rgba(35,61,255,0.35)] whitespace-nowrap flex-shrink-0"
          >
            <span className="w-2 h-2 rounded-full bg-white"></span>Suggest an Edit
          </a>
        </div>

        {(filters.category === 'All' && filters.q === '' && filters.service === 'All' && filters.population === 'All' && filters.community === 'All' && filters.geo === 'All' && filters.spa === 'All') && (
          <div className="space-y-8 mb-8">
            <section>
              <SectionHeader title="HMC Programs" count={HMC_PROGRAMS.length} />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {HMC_PROGRAMS.map(r => (
                  <ResourceCard key={r.id} resource={r} onOpen={setActiveResource} onShare={handleShare} isPinned />
                ))}
              </div>
            </section>

            <section>
              <SectionHeader title="Featured Partners" count={FEATURED_PARTNERS.length} />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {FEATURED_PARTNERS.map(r => (
                  <ResourceCard key={r.id} resource={r} onOpen={setActiveResource} onShare={handleShare} />
                ))}
              </div>
            </section>
          </div>
        )}

        <section>
          <SectionHeader title="Community Directory" count={filteredResources.length} />
          {filteredResources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map(r => (
                <ResourceCard key={r.id} resource={r} onOpen={setActiveResource} onShare={handleShare} />
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

      <footer className="p-6 bg-white border-t border-gray-200 text-center mt-16">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em]">
          &copy; {new Date().getFullYear()} Health Matters Clinic. All Rights Reserved.
        </p>
      </footer>

      <ResourceModal resource={activeResource} onClose={() => setActiveResource(null)} onShare={handleShare} />
      
      {showCompass && <VibeCheckModal onClose={() => setShowCompass(false)} onComplete={handleCompassComplete} />}

      <ChatWidget 
        onResourceClick={(r) => setActiveResource(r)}
        initialContext={chatContext}
        onContextHandled={() => setChatContext(null)}
        isOpen={isChatOpen}
        setIsOpen={setIsChatOpen}
      />

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-2.5 rounded-full shadow-lg text-sm font-bold animate-in fade-in slide-in-from-bottom-2">
          {toast}
        </div>
      )}
    </div>
  );
};

const FilterSelect: React.FC<{label: string, icon: React.ReactNode, value: string, options: string[], onChange: (v: string) => void}> = ({ label, icon, value, options, onChange }) => (
  <div>
    <label className="text-[10px] font-medium uppercase tracking-wide text-gray-400 mb-2 flex items-center gap-1.5">{icon} {label}</label>
    <div className="relative">
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none pl-4 pr-10 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#233dff]/20 focus:border-[#233dff] outline-none transition-all font-medium"
      >
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  </div>
);

const SectionHeader: React.FC<{title: string, count: number}> = ({ title, count }) => (
  <div className="flex items-end justify-between mb-6 border-b-2 border-gray-100 pb-3">
    <h2 className="font-display text-3xl font-medium text-gray-800 tracking-normal">{title}</h2>
    <span className="text-sm font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{count}</span>
  </div>
);

export default App;
