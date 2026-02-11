
import React, { useState } from 'react';
import { X, ArrowRight, Activity, Users, Shield, Phone, Home, Utensils, Car, Compass, MessageSquare, HeartPulse, Flame, Brain, Briefcase } from 'lucide-react';
import { ChatContext } from '../types';

interface VibeCheckModalProps {
  onClose: () => void;
  onComplete: (context: ChatContext) => void;
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

const VibeCheckModal: React.FC<VibeCheckModalProps> = ({ onClose, onComplete }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const handleAnswer = (questionKey: string, value: number) => {
    const newAnswers = { ...answers, [questionKey]: value };
    setAnswers(newAnswers);
    setTimeout(() => setStep(step + 1), 200);
  };

  const reset = () => {
    setStep(0);
    setAnswers({});
  }
  
  const handleChatHandoff = (needs: string[], recommendations: string[]) => {
    onComplete({ needs, recommendations });
  };

  const renderContent = () => {
    if (step === 0) {
      return (
        <div className="text-center p-8">
          <Compass className="w-12 h-12 text-[#233dff] bg-blue-100 rounded-full p-2.5 mx-auto mb-4" />
          <h2 className="font-display text-3xl font-medium text-gray-900 mb-2">Resource Navigator</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">We'll ask a few quick questions about what's going on in your life right now so we can point you to the best resources.</p>
          <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-2xl p-4 text-sm text-left font-medium flex items-start gap-3 mb-6">
            <Shield className="w-8 h-8 flex-shrink-0 mt-1" />
            <div>
              <strong>Your answers stay between us.</strong> Nothing is saved, stored, or shared with anyone. This is just to help connect you with the right support.
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
                {id: 'hillsides-youth-moving-on', name: 'Hillsides Youth Moving On', desc: 'Employment support for transition-age youth.'},
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
          
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6">
            <h4 className="font-bold text-gray-800 mb-3 text-center">Recommended Support Areas:</h4>
            <div className="space-y-3 max-h-[25vh] overflow-y-auto pr-2">
                {identifiedNeeds.map(need => (
                    <div key={need} className="flex items-start gap-3">
                       <div className="flex-shrink-0 mt-1">{recommendations[need].icon}</div>
                       <div>
                           <p className="font-bold text-gray-800">{recommendations[need].title}</p>
                           <ul className="list-disc pl-5 text-sm text-gray-600">
                             {recommendations[need].resources.map(r => <li key={r.id}>{r.name}</li>)}
                           </ul>
                       </div>
                    </div>
                ))}
            </div>
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

  return (
    <div className="fixed inset-0 z-[100] flex items-start md:items-center justify-center overflow-y-auto p-4 pt-16 md:pt-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="bg-white w-full max-w-xl max-h-[85vh] md:max-h-[90vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 relative my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-3 bg-gray-100 text-gray-600 rounded-full border border-gray-200 hover:bg-gray-200 transition-colors z-10" title="Close">
          <X className="w-5 h-5" />
        </button>

        <div className="flex-grow overflow-y-auto">
            {renderContent()}
        </div>
        
        {step > 0 && step <= questions.length && (
            <div className="p-4 bg-gray-50 border-t border-gray-100">
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-[#233dff] h-2 rounded-full" style={{ width: `${(step / questions.length) * 100}%`, transition: 'width 0.3s ease-in-out' }}></div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default VibeCheckModal;
