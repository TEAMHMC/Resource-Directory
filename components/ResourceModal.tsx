
import React, { useState } from 'react';
import { Resource } from '../types';
import { X, Share2, Printer, MapPin, Globe, Clock, Info, Phone, Mail, CheckCircle, HelpCircle } from 'lucide-react';

interface ResourceModalProps {
  resource: Resource | null;
  onClose: () => void;
  onShare: (resource: Resource) => void;
}

const ResourceModal: React.FC<ResourceModalProps> = ({ resource, onClose, onShare }) => {
  const [showReferralForm, setShowReferralForm] = useState(false);
  const [referralData, setReferralData] = useState({
    need: '',
    urgency: '',
    contactPref: '',
  });

  if (!resource) return null;

  const handlePrint = () => window.print();

  const handleReferralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = `Referral Request: ${resource.name}`;
    const body = `
Resource Requested: ${resource.name} (ID: ${resource.id})
---
IMPORTANT: Please do not add any personal identifying information (name, address, DOB, etc.) to this email. A member of our team will contact you via your preferred method below within 72 hours to securely continue the process.
---

Primary Need:
${referralData.need}

Deadline / Urgency:
${referralData.urgency}

Preferred Contact Method (a safe phone number or email):
${referralData.contactPref}
  `;
    window.location.href = `mailto:referrals@healthmatters.clinic?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setShowReferralForm(false);
    setReferralData({ need: '', urgency: '', contactPref: '' });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 md:p-8 border-b border-gray-100 flex items-start justify-between gap-4">
          <div>
            <span className="inline-block px-3 py-1 mb-3 text-xs font-bold bg-[#233dff]/10 text-[#233dff] rounded-full uppercase tracking-wide">
              {resource.category}
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-medium text-gray-900 leading-none">
              {resource.name}
            </h2>
            <div className="mt-2 text-gray-500 font-medium flex flex-wrap gap-2 text-sm">
              <span>{resource.geographicArea}</span>
              {resource.spa && resource.spa !== 'N/A' && <span>• {resource.spa}</span>}
              {resource.resourceType && <span>• {resource.resourceType}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="p-3 bg-gray-50 text-gray-600 rounded-full hover:bg-gray-100 transition-colors" title="Print Resource">
              <Printer className="w-5 h-5" />
            </button>
            <button onClick={() => onShare(resource)} className="p-3 bg-gray-50 text-gray-600 rounded-full hover:bg-gray-100 transition-colors" title="Share">
              <Share2 className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-3 bg-gray-50 text-gray-600 rounded-full hover:bg-gray-100 transition-colors" title="Close">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 md:p-8 overflow-y-auto flex-grow print:overflow-visible">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <section>
                <h4 className="text-sm font-medium uppercase tracking-wide text-gray-400 mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" /> About
                </h4>
                <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {resource.description}
                </p>
              </section>

              <div className="md:col-span-2">
                {!showReferralForm ? (
                  <button
                    onClick={() => setShowReferralForm(true)}
                    className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-full font-semibold text-sm transition-all duration-200 border border-[#1a2baa] active:scale-95 tracking-wide bg-[#233dff] text-white hover:bg-[#1a2b99] hover:shadow-[0_4px_16px_rgba(35,61,255,0.35)]"
                  >
                    <span className="w-2 h-2 rounded-full bg-white"></span>Request a Referral
                  </button>
                ) : (
                  <form onSubmit={handleReferralSubmit} className="bg-gray-50 p-6 rounded-3xl border border-gray-200 space-y-4 animate-in fade-in duration-300">
                    <h3 className="text-xl font-medium text-gray-900">Referral Request Form</h3>
                    <p className="text-xs text-gray-500 font-medium">
                      <strong>HIPAA/Privacy Notice:</strong> Please include minimum necessary information only. Do not include direct identifiers (name, DOB, full address, etc.). This information will be sent via your own email client to our secure referrals team.
                    </p>
                    
                    <div>
                      <label htmlFor="ref-need" className="text-sm font-bold text-gray-700 block mb-1">Primary Need</label>
                      <textarea
                        id="ref-need"
                        value={referralData.need}
                        onChange={(e) => setReferralData({ ...referralData, need: e.target.value })}
                        placeholder="e.g., Emergency shelter, mental health service..."
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                        rows={3}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="ref-urgency" className="text-sm font-bold text-gray-700 block mb-1">Deadline / Urgency</label>
                      <input
                        id="ref-urgency"
                        type="text"
                        value={referralData.urgency}
                        onChange={(e) => setReferralData({ ...referralData, urgency: e.target.value })}
                        placeholder="e.g., Tonight, within 3 days, within 2 weeks"
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="ref-contact" className="text-sm font-bold text-gray-700 block mb-1">Preferred Contact Method</label>
                      <input
                        id="ref-contact"
                        type="text"
                        value={referralData.contactPref}
                        onChange={(e) => setReferralData({ ...referralData, contactPref: e.target.value })}
                        placeholder="Enter a safe phone or email for our team to use"
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                        required
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button type="submit" className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full font-semibold text-sm transition-all duration-200 border border-[#1a2baa] active:scale-95 tracking-wide bg-[#233dff] text-white hover:bg-[#1a2b99] hover:shadow-[0_4px_16px_rgba(35,61,255,0.35)]"><span className="w-2 h-2 rounded-full bg-white"></span>Submit via Email</button>
                      <button type="button" onClick={() => setShowReferralForm(false)} className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full font-semibold text-sm transition-all duration-200 border border-[#e8e6e3] active:scale-95 tracking-wide bg-white text-[#1a1a1a] hover:bg-gray-50 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]"><span className="w-2 h-2 rounded-full bg-[#1a1a1a]"></span>Cancel</button>
                    </div>
                  </form>
                )}
              </div>

              {resource.referralNotes && (
                <section className="bg-[#233dff]/5 p-6 rounded-3xl border border-[#233dff]/20">
                  <h4 className="text-sm font-medium uppercase tracking-wide text-[#233dff] mb-2 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" /> How to Access / Referrals
                  </h4>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {resource.referralNotes}
                  </p>
                </section>
              )}

              {resource.notes && (
                <section>
                  <h4 className="text-sm font-medium uppercase tracking-wide text-gray-400 mb-2">Additional Notes</h4>
                  <div className="bg-gray-50 p-6 rounded-3xl text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {resource.notes}
                  </div>
                </section>
              )}
            </div>

            <div className="space-y-4">
              <DetailItem icon={<Phone className="w-4 h-4"/>} label="Phone" value={resource.phone} isLink={`tel:${resource.phone?.replace(/[^0-9]/g, '')}`} />
              <DetailItem icon={<Globe className="w-4 h-4"/>} label="Website" value={resource.website} isLink={resource.website} />
              <DetailItem icon={<Mail className="w-4 h-4"/>} label="Email" value={resource.email} isLink={`mailto:${resource.email}`} />
              <DetailItem icon={<MapPin className="w-4 h-4"/>} label="Address" value={resource.address} />
              <DetailItem icon={<Clock className="w-4 h-4"/>} label="Hours" value={resource.hours} />
              <DetailItem icon={<CheckCircle className="w-4 h-4"/>} label="Eligibility" value={resource.eligibility} />
              <DetailItem icon={<Globe className="w-4 h-4"/>} label="Languages" value={resource.languages} />
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-[10px] font-bold uppercase tracking-wide text-gray-400 px-8">
          <span>Source: {resource.source || 'Verified Partner'}</span>
          <span>Last Updated: {resource.lastUpdated || 'Recently'}</span>
        </div>
      </div>
    </div>
  );
};

const DetailItem: React.FC<{ icon: React.ReactNode, label: string, value?: string, isLink?: string }> = ({ icon, label, value, isLink }) => {
  if (!value || value === "—") return null;
  return (
    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
      <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wide text-gray-400 mb-1">
        {icon} {label}
      </div>
      <div className="text-sm font-bold text-gray-900 break-words">
        {isLink ? (
          <a href={isLink} target="_blank" rel="noopener noreferrer" className="text-[#233dff] hover:underline">
            {value}
          </a>
        ) : value}
      </div>
    </div>
  );
};

export default ResourceModal;
