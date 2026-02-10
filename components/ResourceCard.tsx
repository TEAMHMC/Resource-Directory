
import React from 'react';
import { Resource } from '../types';
import { Share2, Phone, ExternalLink } from 'lucide-react';

interface ResourceCardProps {
  resource: Resource;
  onOpen: (resource: Resource) => void;
  onShare: (resource: Resource) => void;
  isPinned?: boolean;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource, onOpen, onShare, isPinned }) => {
  const isEmergency = resource.phone === '988' || resource.phone === '911';

  return (
    <div 
      onClick={() => onOpen(resource)}
      className={`group relative flex flex-col h-full bg-white rounded-3xl border border-gray-100 p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:border-[#233dff]/30 cursor-pointer ${isPinned ? 'ring-2 ring-[#233dff]/10' : ''}`}
    >
      <button 
        onClick={(e) => { e.stopPropagation(); onShare(resource); }}
        className="absolute top-4 right-4 p-2.5 bg-white border border-gray-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:shadow-md"
      >
        <Share2 className="w-4 h-4 text-gray-600" />
      </button>

      <div className="flex flex-wrap gap-2 mb-3">
        {isPinned && (
          <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase rounded-full bg-[#233dff]/10 text-[#233dff]">
            HMC Program
          </span>
        )}
        {isEmergency && (
          <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase rounded-full bg-red-100 text-red-700">
            Emergency
          </span>
        )}
        <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase rounded-full bg-gray-100 text-gray-600">
          {resource.category}
        </span>
      </div>

      <h3 className="text-xl font-medium text-gray-900 leading-tight mb-2 group-hover:text-[#233dff]">
        {resource.name}
      </h3>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {resource.communityFocus && (
           <span className="px-2 py-0.5 text-xs font-semibold text-[#233dff] bg-[#233dff]/10 rounded-lg">
             {resource.communityFocus}
           </span>
        )}
        {resource.spa && resource.spa !== 'N/A' && (
           <span className="px-2 py-0.5 text-xs font-semibold text-orange-600 bg-[#ff6e40]/10 rounded-lg">
             {resource.spa}
           </span>
        )}
      </div>

      <p className="text-sm text-gray-600 line-clamp-3 flex-grow mb-4">
        {resource.description}
      </p>

      <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-2 mt-auto">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Phone</span>
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
            <Phone className="w-3 h-3 text-[#233dff]" />
            {resource.phone || '—'}
          </div>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Website</span>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#233dff] overflow-hidden">
            <ExternalLink className="w-3 h-3" />
            <span className="truncate">{resource.website?.replace(/^https?:\/\//, '') || '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceCard;