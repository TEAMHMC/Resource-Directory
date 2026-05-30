
import React, { useState } from 'react';
import { Resource } from '../types';
import { X, Share2, Printer, MapPin, Globe, Clock, Info, Phone, Mail, CheckCircle, HelpCircle, Copy } from 'lucide-react';

interface ResourceModalProps {
  resource: Resource | null;
  onClose: () => void;
  onShare: (resource: Resource) => void;
  onSuggestEdit?: (resource: Resource) => void;
  isPartner?: boolean;
}

const PORTAL_REFERRAL_ENDPOINT = 'https://volunteer.healthmatters.clinic/api/public/referrals';

type ReferralSubmitState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success'; referralId: string }
  | { kind: 'error'; message: string };

const ResourceModal: React.FC<ResourceModalProps> = ({ resource, onClose, onShare, onSuggestEdit, isPartner }) => {
  const [showReferralForm, setShowReferralForm] = useState(false);
  const [referralData, setReferralData] = useState({
    memberName: '',
    memberEmail: '',
    memberPhone: '',
    need: '',
    urgency: 'routine' as 'routine' | 'urgent',
    contactPref: 'email',
  });
  const [submitState, setSubmitState] = useState<ReferralSubmitState>({ kind: 'idle' });
  const [shareToast, setShareToast] = useState<string | null>(null);

  const handleShare = async () => {
    if (!resource) return;
    const shareUrl = window.location.href;
    const shareText = `${resource.name} — ${resource.description?.slice(0, 100) || ''}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: resource.name, text: shareText, url: shareUrl });
        return;
      } catch {
        // user cancelled or not supported — fall through
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareToast('Link copied to clipboard!');
    } catch {
      setShareToast(`Copy this link: ${shareUrl}`);
    }
    setTimeout(() => setShareToast(null), 3000);
  };

  if (!resource) return null;

  const handlePrint = () => window.print();

  const resetReferralForm = () => {
    setReferralData({
      memberName: '',
      memberEmail: '',
      memberPhone: '',
      need: '',
      urgency: 'routine',
      contactPref: 'email',
    });
    setSubmitState({ kind: 'idle' });
  };

  const closeReferralForm = () => {
    setShowReferralForm(false);
    resetReferralForm();
  };

  const submitReferral = async () => {
    if (!resource) return;
    setSubmitState({ kind: 'submitting' });
    try {
      const response = await fetch(PORTAL_REFERRAL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId: resource.id,
          resourceName: resource.name,
          memberName: referralData.memberName.trim(),
          memberEmail: referralData.memberEmail.trim(),
          memberPhone: referralData.memberPhone.trim() || undefined,
          reasonForReferral: referralData.need.trim(),
          urgencyLevel: referralData.urgency,
          preferredContactMethod: referralData.contactPref.trim() || 'email',
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) {
        const message = (data && typeof data.error === 'string') ? data.error : 'We could not submit your referral right now.';
        setSubmitState({ kind: 'error', message });
        return;
      }
      setSubmitState({ kind: 'success', referralId: data.referralId || '' });
    } catch (err) {
      setSubmitState({ kind: 'error', message: 'Network error. Please try again.' });
    }
  };

  const handleReferralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitState.kind === 'submitting') return;
    submitReferral();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 flex items-end md:items-center justify-center md:p-6" onClick={onClose}>
      <div
        className="bg-white w-full max-w-4xl rounded-t-[28px] md:rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-300 max-h-[88svh] md:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle — mobile only */}
        <div className="md:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        {shareToast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-full shadow-xl flex items-center gap-2 animate-in fade-in duration-200">
            <Copy className="w-4 h-4" /> {shareToast}
          </div>
        )}
        <div className="flex-shrink-0 sticky top-0 z-10 bg-white rounded-t-[32px] p-6 md:p-8 border-b border-gray-100 flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-block px-3 py-1 text-xs font-bold bg-[#233dff]/10 text-[#233dff] rounded-full uppercase tracking-wide">
                {resource.category}
              </span>
              {isPartner && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ color: '#cc3d18', background: 'rgba(255,110,64,0.1)', border: '1px solid rgba(255,110,64,0.3)' }}>
                  HMC Partner
                </span>
              )}
            </div>
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
            <button onClick={handlePrint} className="p-3 bg-gray-50 text-gray-600 rounded-full border border-gray-200 hover:bg-gray-100 transition-colors" title="Print Resource">
              <Printer className="w-5 h-5" />
            </button>
            <button onClick={handleShare} className="p-3 bg-gray-50 text-gray-600 rounded-full border border-gray-200 hover:bg-gray-100 transition-colors" title="Share">
              <Share2 className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-3 bg-gray-50 text-gray-600 rounded-full border border-gray-200 hover:bg-gray-100 transition-colors" title="Close">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 md:p-8 print:overflow-visible overflow-y-auto flex-1 min-h-0 overscroll-contain">
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
                <button
                  onClick={() => setShowReferralForm(true)}
                  className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-full font-normal text-base border-2 border-[#0f0f0f] bg-[#233dff] text-white hover:bg-[#1a2b99] transition-all active:scale-95"
                >
                  <span className="w-2 h-2 rounded-full bg-white"></span>Request a Referral
                </button>
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

        <div className="flex-shrink-0 px-8 py-3 border-t border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
            <span>Source: {resource.source || 'Verified Partner'}</span>
            <span className="ml-4">Last Updated: {resource.lastUpdated || 'Recently'}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {onSuggestEdit && (
              <button
                onClick={() => { onSuggestEdit(resource); onClose(); }}
                className="text-xs text-gray-400 hover:text-[#233dff] transition-colors underline underline-offset-2"
              >
                See incorrect info? Suggest an edit →
              </button>
            )}
            <a
              href="https://partner.healthmatters.clinic"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-[#233dff] hover:text-[#1a2b99] transition-colors underline underline-offset-2"
            >
              Is this your organization? Claim this listing →
            </a>
          </div>
        </div>
      </div>

      {showReferralForm && (
        <div
          className="fixed inset-0 z-[210] flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Referral Request Form"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeReferralForm} />
          <div className="relative bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[92dvh]">
            <div className="flex-shrink-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <h3 className="font-display text-xl font-medium text-gray-900">Referral Request Form</h3>
              <button onClick={closeReferralForm} className="p-2 hover:bg-gray-100 rounded-full transition-colors" aria-label="Close referral form">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {submitState.kind === 'success' ? (
              <div className="flex flex-col flex-1 min-h-0">
                <div className="px-6 py-8 space-y-4 overflow-y-auto flex-1 min-h-0 overscroll-contain">
                  <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-green-800">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-base mb-1">Thank you.</p>
                        <p className="text-sm leading-relaxed">We received your referral request and will follow up within 1-2 business days.</p>
                        {submitState.referralId && (
                          <p className="text-xs text-green-700 mt-2">Reference: {submitState.referralId}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 flex flex-col gap-2 px-6 py-4 border-t border-gray-100 bg-white rounded-b-3xl">
                  <button type="button" onClick={closeReferralForm} className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-full font-normal text-sm border-2 border-[#0f0f0f] bg-[#233dff] text-white hover:bg-[#1a2b99] transition-all active:scale-95">
                    <span className="w-2 h-2 rounded-full bg-white"></span>Close
                  </button>
                  <a href="https://volunteer.healthmatters.clinic" target="_blank" rel="noopener noreferrer" className="text-[10px] text-center text-gray-400 hover:text-[#233dff] transition-colors">
                    Powered by HMC
                  </a>
                </div>
              </div>
            ) : submitState.kind === 'error' ? (
              <div className="flex flex-col flex-1 min-h-0">
                <div className="px-6 py-8 space-y-4 overflow-y-auto flex-1 min-h-0 overscroll-contain">
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
                    <p className="font-bold text-base mb-2">Submission did not go through.</p>
                    <p className="text-sm leading-relaxed">We couldn't submit your referral right now. Please try again or email <a href="mailto:referrals@healthmatters.clinic" className="underline">referrals@healthmatters.clinic</a>.</p>
                    {submitState.message && (
                      <p className="text-xs text-red-700 mt-2">Details: {submitState.message}</p>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 flex flex-col gap-2 px-6 py-4 border-t border-gray-100 bg-white rounded-b-3xl">
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={closeReferralForm} className="inline-flex items-center gap-2.5 px-5 py-3 rounded-full font-normal text-sm border border-[#0f0f0f] bg-white text-[#1a1a1a] hover:bg-gray-50 transition-all active:scale-95">
                      <span className="w-2 h-2 rounded-full bg-[#0f0f0f]"></span>Cancel
                    </button>
                    <button type="button" onClick={() => { setSubmitState({ kind: 'idle' }); }} className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full font-normal text-sm border-2 border-[#0f0f0f] bg-[#233dff] text-white hover:bg-[#1a2b99] transition-all active:scale-95">
                      <span className="w-2 h-2 rounded-full bg-white"></span>Try again
                    </button>
                  </div>
                  <a href="https://volunteer.healthmatters.clinic" target="_blank" rel="noopener noreferrer" className="text-[10px] text-center text-gray-400 hover:text-[#233dff] transition-colors">
                    Powered by HMC
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleReferralSubmit} className="flex flex-col flex-1 min-h-0">
                <div className="px-6 py-6 space-y-5 overflow-y-auto flex-1 min-h-0 overscroll-contain">
                  <p className="text-xs text-gray-500 font-medium">
                    <strong>HIPAA / Privacy Notice:</strong> Share only the minimum necessary information. Your request is routed securely through Health Matters Clinic and our team will follow up within 1 to 2 business days.
                  </p>

                  <div>
                    <label htmlFor="ref-name" className="text-sm font-bold text-gray-700 block mb-1">Your Name</label>
                    <input
                      id="ref-name"
                      type="text"
                      value={referralData.memberName}
                      onChange={(e) => setReferralData({ ...referralData, memberName: e.target.value })}
                      placeholder="First and last name"
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      autoComplete="name"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="ref-email" className="text-sm font-bold text-gray-700 block mb-1">Your Email</label>
                    <input
                      id="ref-email"
                      type="email"
                      value={referralData.memberEmail}
                      onChange={(e) => setReferralData({ ...referralData, memberEmail: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      autoComplete="email"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="ref-phone" className="text-sm font-bold text-gray-700 block mb-1">Phone <span className="font-normal text-gray-400">(optional)</span></label>
                    <input
                      id="ref-phone"
                      type="tel"
                      value={referralData.memberPhone}
                      onChange={(e) => setReferralData({ ...referralData, memberPhone: e.target.value })}
                      placeholder="(555) 555-5555"
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      autoComplete="tel"
                    />
                  </div>

                  <div>
                    <label htmlFor="ref-need" className="text-sm font-bold text-gray-700 block mb-1">Reason for Referral</label>
                    <textarea
                      id="ref-need"
                      value={referralData.need}
                      onChange={(e) => setReferralData({ ...referralData, need: e.target.value })}
                      placeholder="What kind of help do you need? E.g., emergency shelter, mental health support, food access."
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      rows={3}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="ref-urgency" className="text-sm font-bold text-gray-700 block mb-1">Urgency</label>
                    <select
                      id="ref-urgency"
                      value={referralData.urgency}
                      onChange={(e) => setReferralData({ ...referralData, urgency: e.target.value as 'routine' | 'urgent' })}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white"
                      required
                    >
                      <option value="routine">Routine (follow up within 1-2 business days)</option>
                      <option value="urgent">Urgent (please prioritize)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="ref-contact" className="text-sm font-bold text-gray-700 block mb-1">Preferred Contact Method</label>
                    <select
                      id="ref-contact"
                      value={referralData.contactPref}
                      onChange={(e) => setReferralData({ ...referralData, contactPref: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white"
                      required
                    >
                      <option value="email">Email</option>
                      <option value="phone">Phone call</option>
                      <option value="text">Text message</option>
                    </select>
                  </div>
                </div>

                <div className="flex-shrink-0 flex flex-col gap-2 px-6 py-4 border-t border-gray-100 bg-white rounded-b-3xl">
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={closeReferralForm} disabled={submitState.kind === 'submitting'} className="inline-flex items-center gap-2.5 px-5 py-3 rounded-full font-normal text-sm border border-[#0f0f0f] bg-white text-[#1a1a1a] hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50">
                      <span className="w-2 h-2 rounded-full bg-[#0f0f0f]"></span>Cancel
                    </button>
                    <button type="submit" disabled={submitState.kind === 'submitting'} className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full font-normal text-sm border-2 border-[#0f0f0f] bg-[#233dff] text-white hover:bg-[#1a2b99] transition-all active:scale-95 disabled:opacity-60">
                      <span className="w-2 h-2 rounded-full bg-white"></span>
                      {submitState.kind === 'submitting' ? 'Submitting...' : 'Submit Referral'}
                    </button>
                  </div>
                  <a href="https://volunteer.healthmatters.clinic" target="_blank" rel="noopener noreferrer" className="text-[10px] text-center text-gray-400 hover:text-[#233dff] transition-colors">
                    Powered by HMC
                  </a>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
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
