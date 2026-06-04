
import React, { useState } from 'react';
import { X, ArrowRight, Activity, Users, Shield, Phone, Home, Utensils, Car, Compass, MessageSquare, HeartPulse, Flame, Brain, Briefcase, CheckSquare, Square } from 'lucide-react';
import { ChatContext } from '../types';
import { useEmbedViewport } from '../hooks/useEmbedViewport';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbz5vZVE7f124Wowhtg6f7b1XBy1YV-uu6qPZeSMipBBUoM1MwxhXfT0wIJZeXlSVyfuMg/exec';

interface VibeCheckModalProps {
  onClose: () => void;
  onComplete: (context: ChatContext) => void;
  autoStartDisaster?: boolean;
}

const questions = [
  { text: "Have you or your family been affected by a natural disaster (wildfires, flooding, earthquake, etc.)?", key: 'disaster' },
  { text: "Is it hard for you to see a doctor or get medical care when you need it?", key: 'healthcare' },
  { text: "Have you been feeling stressed, anxious, or overwhelmed lately?", key: 'mentalhealth' },
  { text: "Do you ever feel unsafe where you live?", key: 'safety' },
  { text: "Have you been worried about losing your housing or having a stable place to stay?", key: 'housing' },
  { text: "Have you worried about having enough food for yourself or your family?", key: 'food' },
  { text: "Are you looking for work or struggling to find stable employment?", key: 'employment' },
  { text: "Has a lack of transportation kept you from getting what you need?", key: 'transport' }
];

const options = [
  { text: "Yes", value: 1 },
  { text: "No", value: 0 },
];

const HOUSEHOLD_DETAIL_OPTIONS = [
  'Children under 18',
  'Elderly / seniors (65+)',
  'Pets',
  'Disabled or special needs',
];

const URGENT_NEEDS_OPTIONS = [
  'Food and water',
  'Clothing',
  'Hygiene products',
  'Bedding and towels',
  'Cleaning supplies',
  'Baby / infant items',
  'Pet food and supplies',
  'School supplies',
];

const HOUSEHOLD_SIZE_OPTIONS = ['1', '2', '3', '4', '5', '6+'];

interface DisasterData {
  isLAWildfires: boolean | null;
  householdSize: string;
  householdDetails: string[];
  urgentNeeds: string[];
  otherNeeds: string;
  isDisplaced: boolean | null;
  priorStreet: string;
  priorCity: string;
  priorZip: string;
  canPickUp: boolean | null;
  deliveryName: string;
  deliveryStreet: string;
  deliveryCity: string;
  deliveryZip: string;
  gofundmeUrl: string;
}

const VibeCheckModal: React.FC<VibeCheckModalProps> = ({ onClose, onComplete, autoStartDisaster = false }) => {
  const [step, setStep] = useState(autoStartDisaster ? 1 : 0);
  const [answers, setAnswers] = useState<Record<string, number>>(autoStartDisaster ? { disaster: 1 } : {});
  const [disasterSubStep, setDisasterSubStep] = useState(autoStartDisaster ? 1 : 0);
  const [disasterData, setDisasterData] = useState<DisasterData>({
    isLAWildfires: null,
    householdSize: '',
    householdDetails: [],
    urgentNeeds: [],
    otherNeeds: '',
    isDisplaced: null,
    priorStreet: '',
    priorCity: '',
    priorZip: '',
    canPickUp: null,
    deliveryName: '',
    deliveryStreet: '',
    deliveryCity: '',
    deliveryZip: '',
    gofundmeUrl: '',
  });
  const [disasterSubmitting, setDisasterSubmitting] = useState(false);
  const [disasterSubmitted, setDisasterSubmitted] = useState(false);
  const { overlayStyle, cardMaxHeight, attachCardRef } = useEmbedViewport(true);

  const handleAnswer = (questionKey: string, value: number) => {
    const newAnswers = { ...answers, [questionKey]: value };
    setAnswers(newAnswers);
    if (questionKey === 'disaster' && value === 1) {
      // Branch into disaster intake sub-flow
      setTimeout(() => setDisasterSubStep(1), 200);
    } else {
      setTimeout(() => setStep(step + 1), 200);
    }
  };

  const reset = () => {
    setStep(0);
    setAnswers({});
    setDisasterSubStep(0);
    setDisasterData({ isLAWildfires: null, householdSize: '', householdDetails: [], urgentNeeds: [], otherNeeds: '', isDisplaced: null, priorStreet: '', priorCity: '', priorZip: '', canPickUp: null, deliveryName: '', deliveryStreet: '', deliveryCity: '', deliveryZip: '', gofundmeUrl: '' });
    setDisasterSubmitting(false);
    setDisasterSubmitted(false);
  };

  const handleChatHandoff = (needs: string[], recommendations: string[]) => {
    onComplete({ needs, recommendations });
  };

  const toggleMultiSelect = (list: string[], item: string): string[] =>
    list.includes(item) ? list.filter(x => x !== item) : [...list, item];

  const submitDisasterRequest = async () => {
    setDisasterSubmitting(true);
    try {
      const payload = {
        action: 'wildfire_relief_request',
        isLAWildfires: disasterData.isLAWildfires,
        householdSize: disasterData.householdSize,
        householdDetails: disasterData.householdDetails.join(', '),
        urgentNeeds: disasterData.urgentNeeds.join(', '),
        otherNeeds: disasterData.otherNeeds,
        isDisplaced: disasterData.isDisplaced,
        priorStreet: disasterData.priorStreet,
        priorCity: disasterData.priorCity,
        priorZip: disasterData.priorZip,
        canPickUp: disasterData.canPickUp,
        deliveryName: disasterData.deliveryName,
        deliveryStreet: disasterData.deliveryStreet,
        deliveryCity: disasterData.deliveryCity,
        deliveryZip: disasterData.deliveryZip,
        gofundmeUrl: disasterData.gofundmeUrl,
        timestamp: new Date().toISOString(),
      };
      fetch(GAS_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
    } catch (_) {
      // fire and forget
    }
    setDisasterSubmitting(false);
    setDisasterSubmitted(true);
  };

  const renderDisasterSubFlow = () => {
    // Sub-step 1: LA Wildfires specifically?
    if (disasterSubStep === 1) {
      return (
        <div className="p-8">
          <div className="text-center mb-8">
            <Flame className="w-10 h-10 text-orange-500 bg-orange-100 rounded-full p-2 mx-auto mb-3" />
            <span className="text-sm font-bold text-gray-400">Disaster Relief</span>
            <p className="text-xl md:text-2xl font-bold text-gray-800 mt-2">Is this related to the recent LA Wildfires?</p>
            <p className="text-sm text-gray-500 mt-2">We have dedicated relief resources specifically for wildfire-impacted families.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[{ label: 'Yes, the LA Wildfires', val: true }, { label: 'No, a different disaster', val: false }].map(opt => (
              <button
                key={String(opt.val)}
                onClick={() => { setDisasterData(d => ({ ...d, isLAWildfires: opt.val })); setDisasterSubStep(2); }}
                className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-full font-normal text-base border border-[#0f0f0f] bg-white text-[#1a1a1a] hover:bg-gray-50 transition-all active:scale-95"
              >
                <span className="w-2 h-2 rounded-full bg-[#0f0f0f]"></span>{opt.label}
              </button>
            ))}
          </div>
        </div>
      );
    }

    // Sub-step 2: Household size
    if (disasterSubStep === 2) {
      return (
        <div className="p-8">
          <div className="text-center mb-8">
            <Users className="w-10 h-10 text-blue-500 bg-blue-100 rounded-full p-2 mx-auto mb-3" />
            <span className="text-sm font-bold text-gray-400">Household</span>
            <p className="text-xl md:text-2xl font-bold text-gray-800 mt-2">How many people are in your household?</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {HOUSEHOLD_SIZE_OPTIONS.map(size => (
              <button
                key={size}
                onClick={() => { setDisasterData(d => ({ ...d, householdSize: size })); setDisasterSubStep(3); }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full font-normal text-base border border-[#0f0f0f] bg-white text-[#1a1a1a] hover:bg-gray-50 transition-all active:scale-95"
              >
                <span className="w-2 h-2 rounded-full bg-[#0f0f0f]"></span>{size}
              </button>
            ))}
          </div>
        </div>
      );
    }

    // Sub-step 3: Household details (multi-select)
    if (disasterSubStep === 3) {
      return (
        <div className="p-8">
          <div className="text-center mb-6">
            <Users className="w-10 h-10 text-blue-500 bg-blue-100 rounded-full p-2 mx-auto mb-3" />
            <span className="text-sm font-bold text-gray-400">Household</span>
            <p className="text-xl md:text-2xl font-bold text-gray-800 mt-2">Who is in your household?</p>
            <p className="text-sm text-gray-500 mt-1">Select all that apply</p>
          </div>
          <div className="space-y-2 mb-6">
            {HOUSEHOLD_DETAIL_OPTIONS.map(opt => {
              const selected = disasterData.householdDetails.includes(opt);
              return (
                <button
                  key={opt}
                  onClick={() => setDisasterData(d => ({ ...d, householdDetails: toggleMultiSelect(d.householdDetails, opt) }))}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all ${selected ? 'border-[#233dff] bg-[#233dff]/5 text-[#233dff]' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}`}
                >
                  {selected ? <CheckSquare className="w-5 h-5 flex-shrink-0" /> : <Square className="w-5 h-5 flex-shrink-0 text-gray-400" />}
                  <span className="text-sm font-medium">{opt}</span>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setDisasterSubStep(4)}
            className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-full font-normal text-base border border-[#233dff] bg-[#233dff] text-white hover:bg-[#1a2b99] transition-all active:scale-95"
          >
            <span className="w-2 h-2 rounded-full bg-white"></span>Continue
          </button>
        </div>
      );
    }

    // Sub-step 4: Urgent needs (multi-select)
    if (disasterSubStep === 4) {
      return (
        <div className="p-8">
          <div className="text-center mb-6">
            <Utensils className="w-10 h-10 text-green-500 bg-green-100 rounded-full p-2 mx-auto mb-3" />
            <span className="text-sm font-bold text-gray-400">Relief Items</span>
            <p className="text-xl md:text-2xl font-bold text-gray-800 mt-2">What do you need most urgently?</p>
            <p className="text-sm text-gray-500 mt-1">Select all that apply</p>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {URGENT_NEEDS_OPTIONS.map(opt => {
              const selected = disasterData.urgentNeeds.includes(opt);
              return (
                <button
                  key={opt}
                  onClick={() => setDisasterData(d => ({ ...d, urgentNeeds: toggleMultiSelect(d.urgentNeeds, opt) }))}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${selected ? 'border-[#233dff] bg-[#233dff]/5 text-[#233dff]' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}`}
                >
                  {selected ? <CheckSquare className="w-4 h-4 flex-shrink-0" /> : <Square className="w-4 h-4 flex-shrink-0 text-gray-400" />}
                  <span className="text-xs font-medium">{opt}</span>
                </button>
              );
            })}
          </div>
          <input
            type="text"
            placeholder="Other items needed (optional)"
            value={disasterData.otherNeeds}
            onChange={e => setDisasterData(d => ({ ...d, otherNeeds: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#233dff]/30"
          />
          <button
            onClick={() => setDisasterSubStep(5)}
            disabled={disasterData.urgentNeeds.length === 0 && !disasterData.otherNeeds.trim()}
            className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-full font-normal text-base border border-[#233dff] bg-[#233dff] text-white hover:bg-[#1a2b99] transition-all active:scale-95 disabled:opacity-40"
          >
            <span className="w-2 h-2 rounded-full bg-white"></span>Continue
          </button>
        </div>
      );
    }

    // Sub-step 5: Situation + address + pickup + GoFundMe
    if (disasterSubStep === 5) {
      const canSubmit = disasterData.isDisplaced !== null && disasterData.canPickUp !== null &&
        disasterData.deliveryStreet.trim() && disasterData.deliveryCity.trim() && disasterData.deliveryZip.trim();
      const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#233dff]/30";
      const toggleBtn = (label: string, active: boolean, onClick: () => void) => (
        <button
          type="button"
          onClick={onClick}
          className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${active ? 'border-[#233dff] bg-[#233dff]/5 text-[#233dff]' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
        >{label}</button>
      );

      return (
        <div className="p-6">
          <div className="text-center mb-5">
            <Home className="w-10 h-10 text-blue-500 bg-blue-100 rounded-full p-2 mx-auto mb-3" />
            <span className="text-sm font-bold text-gray-400">Situation and Delivery</span>
            <p className="text-xl font-bold text-gray-800 mt-2">A few more details</p>
          </div>

          <div className="space-y-4 mb-5">

            {/* Displaced */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Are you displaced from your home? <span className="text-rose-500">*</span></p>
              <div className="flex gap-2">
                {toggleBtn('Yes, I am displaced', disasterData.isDisplaced === true, () => setDisasterData(d => ({ ...d, isDisplaced: true })))}
                {toggleBtn('No, still at home', disasterData.isDisplaced === false, () => setDisasterData(d => ({ ...d, isDisplaced: false })))}
              </div>
            </div>

            {/* Prior address — only if displaced */}
            {disasterData.isDisplaced === true && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Address before the disaster</p>
                <div className="space-y-2">
                  <input type="text" placeholder="Prior street address" value={disasterData.priorStreet} onChange={e => setDisasterData(d => ({ ...d, priorStreet: e.target.value }))} className={inputClass} />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="City" value={disasterData.priorCity} onChange={e => setDisasterData(d => ({ ...d, priorCity: e.target.value }))} className={inputClass} />
                    <input type="text" placeholder="ZIP" value={disasterData.priorZip} onChange={e => setDisasterData(d => ({ ...d, priorZip: e.target.value }))} className={inputClass} />
                  </div>
                </div>
              </div>
            )}

            {/* Pickup availability */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Are you able to pick up supplies? <span className="text-rose-500">*</span></p>
              <div className="flex gap-2">
                {toggleBtn('Yes, I can pick up', disasterData.canPickUp === true, () => setDisasterData(d => ({ ...d, canPickUp: true })))}
                {toggleBtn('No, I need delivery', disasterData.canPickUp === false, () => setDisasterData(d => ({ ...d, canPickUp: false })))}
              </div>
            </div>

            {/* Delivery / current address */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">
                {disasterData.canPickUp ? 'Where are you currently located?' : 'Delivery address'} <span className="text-rose-500">*</span>
              </p>
              <div className="space-y-2">
                <input type="text" placeholder="Your name (optional)" value={disasterData.deliveryName} onChange={e => setDisasterData(d => ({ ...d, deliveryName: e.target.value }))} className={inputClass} />
                <input type="text" placeholder="Street address *" value={disasterData.deliveryStreet} onChange={e => setDisasterData(d => ({ ...d, deliveryStreet: e.target.value }))} className={inputClass} />
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="City *" value={disasterData.deliveryCity} onChange={e => setDisasterData(d => ({ ...d, deliveryCity: e.target.value }))} className={inputClass} />
                  <input type="text" placeholder="ZIP code *" value={disasterData.deliveryZip} onChange={e => setDisasterData(d => ({ ...d, deliveryZip: e.target.value }))} className={inputClass} />
                </div>
              </div>
            </div>

            {/* GoFundMe */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Do you have a GoFundMe or fundraising link? <span className="text-gray-400 font-normal">(optional)</span></p>
              <input type="url" placeholder="https://gofundme.com/..." value={disasterData.gofundmeUrl} onChange={e => setDisasterData(d => ({ ...d, gofundmeUrl: e.target.value }))} className={inputClass} />
            </div>

          </div>

          <button
            onClick={submitDisasterRequest}
            disabled={!canSubmit || disasterSubmitting}
            className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-full font-normal text-base border border-[#233dff] bg-[#233dff] text-white hover:bg-[#1a2b99] transition-all active:scale-95 disabled:opacity-40"
          >
            <span className="w-2 h-2 rounded-full bg-white"></span>
            {disasterSubmitting ? 'Submitting...' : 'Submit Relief Request'}
          </button>
        </div>
      );
    }

    // Submitted confirmation
    if (disasterSubmitted) {
      return (
        <div className="text-center p-8">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Activity className="w-7 h-7 text-green-600" />
          </div>
          <h2 className="font-display text-2xl font-medium text-gray-900 mb-2">Request Received</h2>
          <p className="text-gray-600 mb-2 max-w-md mx-auto">Your relief request has been submitted to our team. We will share your needs with our community partner network and follow up regarding delivery or pickup.</p>
          <p className="text-sm text-gray-500 mb-6">For urgent support you can also reach our dedicated team at <strong>lawr@healthmatters.clinic</strong>.</p>
          <button
            onClick={() => handleChatHandoff(['disaster', 'mentalhealth'], ['hmc-mobile-health', 'cityserve-ca-relief', '988-suicide-crisis-lifeline'])}
            className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-full font-normal text-base border border-[#233dff] bg-[#233dff] text-white hover:bg-[#1a2b99] transition-all active:scale-95 mb-3"
          >
            <span className="w-2 h-2 rounded-full bg-white"></span>
            Chat with Sunny about more resources
          </button>
          <button onClick={reset} className="text-sm font-bold text-gray-500 hover:text-gray-800">Start Over</button>
        </div>
      );
    }

    return null;
  };

  const renderContent = () => {
    // Disaster sub-flow takes over when active
    if (disasterSubStep > 0) {
      return renderDisasterSubFlow();
    }

    if (step === 0) {
      return (
        <div className="text-center p-8">
          <Compass className="w-12 h-12 text-[#233dff] bg-blue-100 rounded-full p-2.5 mx-auto mb-4" />
          <h2 className="font-display text-3xl font-medium text-gray-900 mb-2">Resource Navigator</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">We'll ask a few quick questions about what's going on in your life right now so we can point you to the best resources.</p>
          <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-2xl p-4 text-sm text-left font-medium flex items-start gap-3 mb-6">
            <Shield className="w-8 h-8 flex-shrink-0 mt-1" />
            <div>
              <strong>Your privacy matters.</strong> Your responses are used only to personalize your results. When you start a chat, your needs are shared with our AI assistant to help find the right resources.
            </div>
          </div>
          <button
            onClick={() => setStep(1)}
            className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-full font-normal text-base border border-[#233dff] bg-[#233dff] text-white hover:bg-[#1a2b99] transition-all active:scale-95"
          >
            <span className="w-2 h-2 rounded-full bg-white"></span>Let's Get Started
          </button>
        </div>
      );
    }

    if (step > 0 && step <= questions.length) {
      const question = questions[step - 1];
      return (
        <div className="p-8">
          <div className="text-center mb-8">
            <span className="text-sm font-bold text-gray-400">Question {step} of {questions.length}</span>
            <p className="text-xl md:text-2xl font-bold text-gray-800 mt-2">{question.text}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleAnswer(question.key, option.value)}
                className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-full font-normal text-base border border-[#0f0f0f] bg-white text-[#1a1a1a] hover:bg-gray-50 transition-all active:scale-95"
              >
                <span className="w-2 h-2 rounded-full bg-[#0f0f0f]"></span>{option.text}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (step > questions.length) {
      return renderResults();
    }

    return null;
  };

  const renderResults = () => {
    const needsMap = {
      disaster: answers['disaster'] === 1,
      healthcare: answers['healthcare'] === 1,
      mentalhealth: answers['mentalhealth'] === 1,
      safety: answers['safety'] === 1,
      housing: answers['housing'] === 1,
      food: answers['food'] === 1,
      employment: answers['employment'] === 1,
      transport: answers['transport'] === 1,
    };
    const identifiedNeeds = Object.entries(needsMap).filter(([, value]) => value).map(([key]) => key);
    const hasNeeds = identifiedNeeds.length > 0;

    const recommendations: { [key: string]: { icon: React.ReactNode; title: string; resources: {id: string, name: string, desc: string}[] } } = {
        disaster: {
            icon: <Flame className="w-5 h-5 text-orange-600" />,
            title: "Disaster Recovery Support",
            resources: [
                {id: 'hmc-mobile-health', name: 'HMC Mobile Health Outreach', desc: 'On-the-ground care where you are.'},
                {id: 'cityserve-ca-relief', name: 'CityServe', desc: 'Household goods and disaster relief.'},
                {id: '988-suicide-crisis-lifeline', name: '988 Crisis Lifeline', desc: '24/7 emotional support after a crisis.'},
            ]
        },
        healthcare: {
            icon: <HeartPulse className="w-5 h-5 text-[#233dff]" />,
            title: "Access to Care",
            resources: [
                {id: 'hmc-pop-up-clinic', name: 'HMC Pop-Up Clinics', desc: 'Free walk-in care events in your community.'},
                {id: 'hmc-mobile-health', name: 'HMC Mobile Health Outreach', desc: 'Care that comes to you.'},
                {id: 'la-care-health-plan', name: 'L.A. Care Health Plan', desc: 'Help enrolling in Medi-Cal.'},
                {id: 'umma-clinic-wellness', name: 'UMMA Community Clinic', desc: 'Care for underserved and uninsured.'},
            ]
        },
        mentalhealth: {
            icon: <Brain className="w-5 h-5 text-purple-600" />,
            title: "Mental Health & Wellness",
            resources: [
                {id: 'hmc-live-unstoppable', name: 'Live Unstoppable Wellness', desc: 'Movement-as-medicine community events.'},
                {id: '988-suicide-crisis-lifeline', name: '988 Crisis Lifeline', desc: '24/7 free emotional support.'},
                {id: 'pacific-clinics-behavioral', name: 'Pacific Clinics', desc: 'Behavioral health counseling.'},
                {id: 'exodus-recovery-crisis', name: 'Exodus Recovery', desc: 'Crisis stabilization programs.'},
            ]
        },
        safety: {
            icon: <Shield className="w-5 h-5 text-red-600" />,
            title: "Safety & Protection",
            resources: [
                {id: '988-suicide-crisis-lifeline', name: '988 Crisis Lifeline', desc: '24/7 crisis support.'},
                {id: 'jenesse-center-dv', name: 'Jenesse Center', desc: 'Domestic violence intervention.'},
                {id: 'elawc-women-survivors', name: 'East LA Women\'s Center', desc: 'Support for survivors of DV/SA.'},
            ]
        },
        housing: {
            icon: <Home className="w-5 h-5 text-blue-600" />,
            title: "Housing Support",
            resources: [
                {id: 'hopics-housing-shelter', name: 'HOPICS', desc: 'Housing services for South LA.'},
                {id: 'a-new-way-of-life', name: 'A New Way of Life', desc: 'Housing for formerly incarcerated.'},
                {id: 'union-station-homeless-SGV', name: 'Union Station Homeless Services', desc: 'Shelter and services in SGV.'},
            ]
        },
        food: {
            icon: <Utensils className="w-5 h-5 text-green-600" />,
            title: "Food Assistance",
            resources: [
                {id: 'project-angel-food-mtm', name: 'Project Angel Food', desc: 'Medically tailored meal delivery.'},
                {id: 'everytable-meals', name: 'Everytable', desc: 'Affordable, healthy meals.'},
                {id: 'seeds-of-hope-nutrition', name: 'Seeds of Hope', desc: 'Food justice and nutrition education.'},
            ]
        },
        employment: {
            icon: <Briefcase className="w-5 h-5 text-teal-600" />,
            title: "Jobs & Career Support",
            resources: [
                {id: 'good-seed-cdc-outreach', name: 'Good Seed CDC', desc: 'Job readiness and community outreach.'},
                {id: 'hillsides-youth-moving-on-housing', name: 'Hillsides Youth Moving On', desc: 'Employment support for transition-age youth.'},
                {id: 'el-sol-neighborhood-health', name: 'El Sol Neighborhood Center', desc: 'Education and workforce development.'},
                {id: 'skid-row-clean-up-unhoused', name: 'Skid Row Community Clean Up', desc: 'Employment pathways for unhoused individuals.'},
            ]
        },
        transport: {
            icon: <Car className="w-5 h-5 text-orange-600" />,
            title: "Getting Around",
            resources: [
                {id: 'metro-life-fare-lowincome', name: 'Metro LIFE Program', desc: 'Discounted fares for Metro.'},
            ]
        },
    };

    const recommendedResourceIds = identifiedNeeds.flatMap(need => recommendations[need]?.resources.map(r => r.id) || []);

    const topResources: { id: string; name: string; desc: string; icon: React.ReactNode }[] = [];
    for (const need of identifiedNeeds) {
      for (const r of recommendations[need]?.resources || []) {
        if (!topResources.some(x => x.id === r.id)) {
          topResources.push({ ...r, icon: recommendations[need].icon });
        }
        if (topResources.length >= 3) break;
      }
      if (topResources.length >= 3) break;
    }

    if (!hasNeeds) {
      return (
        <div className="text-center p-8">
            <Activity className="w-12 h-12 text-green-500 bg-green-100 rounded-full p-2 mx-auto mb-4" />
            <h2 className="font-display text-3xl font-medium text-gray-900 mb-2">Thanks for checking in.</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">It looks like your basic needs are covered right now, which is great! If you'd like to explore wellness activities or community connections, Sunny can help with that too.</p>
            <button
                onClick={() => handleChatHandoff(['general wellness'], ['hmc-live-unstoppable', 'onegeneration-intergen-care'])}
                className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-full font-normal text-base border border-[#233dff] bg-[#233dff] text-white hover:bg-[#1a2b99] transition-all active:scale-95"
            >
                <span className="w-2 h-2 rounded-full bg-white"></span>
                Chat with Sunny about wellness
            </button>
            <button onClick={reset} className="mt-4 text-sm font-bold text-gray-500 hover:text-gray-800">Start Over</button>
        </div>
      );
    }

    return (
      <div className="p-8">
          <div className="text-center">
              <Compass className="w-12 h-12 text-blue-500 bg-blue-100 rounded-full p-2.5 mx-auto mb-4" />
              <h2 className="font-display text-3xl font-medium text-gray-900 mb-2">Your Resource Navigator Results</h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">Thank you for sharing. Based on your answers, here are some areas where we can offer support. The next step is to chat with Sunny, our AI Navigator, who can guide you through these resources.</p>
          </div>

          <div className="space-y-3 mb-6">
            {topResources.map((r, i) => (
              <div key={r.id} className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-2xl p-4">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-[#233dff] text-sm font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                <div>
                  <p className="font-bold text-gray-800 text-sm">{r.name}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => handleChatHandoff(identifiedNeeds, recommendedResourceIds)}
            className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-full font-normal text-base border border-[#233dff] bg-[#233dff] text-white hover:bg-[#1a2b99] transition-all active:scale-95"
          >
            <span className="w-2 h-2 rounded-full bg-white"></span>
            Chat with Sunny about these results
          </button>
          <button onClick={reset} className="mt-4 text-sm font-bold text-gray-500 hover:text-gray-800 mx-auto block">Start Over</button>
      </div>
    );
  };

  // Progress bar logic
  const showProgressBar = (disasterSubStep > 0 && disasterSubStep <= 5) || (step > 0 && step <= questions.length && disasterSubStep === 0);
  const progressPct = disasterSubStep > 0
    ? (disasterSubStep / 5) * 100
    : (step / questions.length) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} style={overlayStyle}>
      <div
        ref={attachCardRef}
        className="bg-white w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 relative"
        style={{ maxHeight: cardMaxHeight ? `min(${cardMaxHeight}, 700px)` : 'min(90vh, 700px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-3 bg-gray-100 text-gray-600 rounded-full border border-gray-200 hover:bg-gray-200 transition-colors z-10" title="Close">
          <X className="w-5 h-5" />
        </button>

        <div className="flex-grow min-h-0 overflow-y-auto overscroll-contain">
            {renderContent()}
        </div>

        {showProgressBar && (
            <div className="flex-shrink-0 p-4 bg-gray-50 border-t border-gray-100">
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-[#233dff] h-2 rounded-full" style={{ width: `${progressPct}%`, transition: 'width 0.3s ease-in-out' }}></div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default VibeCheckModal;
