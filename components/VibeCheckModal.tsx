
import React, { useState } from 'react';
import { X, ArrowRight, Activity, Users, Shield, Phone, Home, Utensils, Car, Compass, MessageSquare } from 'lucide-react';
import { ChatContext } from '../types';

interface VibeCheckModalProps {
  onClose: () => void;
  onComplete: (context: ChatContext) => void;
}

const questions = [
  { text: "Do you ever feel unsafe where you live?", key: 'safety' },
  { text: "In the past year, have you been worried about losing your housing?", key: 'housing' },
  { text: "In the past year, have you worried that your food would run out before you could get more?", key: 'food' },
  { text: "In the past year, has a lack of transportation kept you from getting what you need?", key: 'transport' }
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
          <h2 className="font-display text-3xl font-medium text-gray-900 mb-2">Resource Compass</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">Answer a few private questions to find the right resources for your current situation.</p>
          <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-2xl p-4 text-sm text-left font-medium flex items-start gap-3 mb-6">
            <Shield className="w-8 h-8 flex-shrink-0 mt-1" />
            <div>
              <strong>This is a private screening tool.</strong> It is not a medical diagnosis and your answers are not stored or shared.
            </div>
          </div>
          <button
            onClick={() => setStep(1)}
            className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-full font-semibold text-sm transition-all duration-200 border border-black active:scale-95 tracking-wide bg-[#233dff] text-white hover:bg-[#1a2b99] hover:shadow-[0_4px_16px_rgba(35,61,255,0.35)]"
          >
            <span className="w-2 h-2 rounded-full bg-white"></span>Find My Direction
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
                className="w-full text-left p-4 bg-gray-50 border border-gray-200 rounded-2xl hover:bg-white hover:border-[#233dff] hover:ring-2 hover:ring-[#233dff]/50 transition-all font-semibold text-gray-700 flex items-center justify-center text-lg"
              >
                {option.text}
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
      safety: answers['safety'] === 1,
      housing: answers['housing'] === 1,
      food: answers['food'] === 1,
      transport: answers['transport'] === 1,
    };
    const identifiedNeeds = Object.entries(needsMap).filter(([, value]) => value).map(([key]) => key);
    const hasNeeds = identifiedNeeds.length > 0;

    const recommendations: { [key: string]: { icon: React.ReactNode; title: string; resources: {id: string, name: string, desc: string}[] } } = {
        safety: {
            icon: <Shield className="w-5 h-5 text-red-600" />,
            title: "For Your Safety",
            resources: [
                {id: '988-suicide-crisis-lifeline', name: '988 Suicide & Crisis Lifeline', desc: 'Immediate 24/7 crisis support.'},
                {id: 'jenesse-center-dv', name: 'Jenesse Center', desc: 'Domestic violence intervention.'},
                {id: 'elawc-women-survivors', name: 'East LA Women\'s Center', desc: 'Support for survivors of DV/SA.'},
            ]
        },
        housing: {
            icon: <Home className="w-5 h-5 text-blue-600" />,
            title: "For Housing Support",
            resources: [
                {id: 'hopics-housing-shelter', name: 'HOPICS', desc: 'Housing services for South LA.'},
                {id: 'a-new-way-of-life', name: 'A New Way of Life', desc: 'Housing for formerly incarcerated.'},
                {id: 'union-station-homeless-SGV', name: 'Union Station Homeless Services', desc: 'Shelter and services in SGV.'},
            ]
        },
        food: {
            icon: <Utensils className="w-5 h-5 text-green-600" />,
            title: "For Food Assistance",
            resources: [
                {id: 'project-angel-food-mtm', name: 'Project Angel Food', desc: 'Medically tailored meal delivery.'},
                {id: 'everytable-meals', name: 'Everytable', desc: 'Affordable, healthy meals.'},
                {id: 'seeds-of-hope-nutrition', name: 'Seeds of Hope', desc: 'Food justice and nutrition education.'},
            ]
        },
        transport: {
            icon: <Car className="w-5 h-5 text-orange-600" />,
            title: "For Transportation",
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
                className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-full font-semibold text-sm transition-all duration-200 border border-black active:scale-95 tracking-wide bg-[#233dff] text-white hover:bg-[#1a2b99] hover:shadow-[0_4px_16px_rgba(35,61,255,0.35)]"
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
              <h2 className="font-display text-3xl font-medium text-gray-900 mb-2">Your Resource Compass Results</h2>
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
            className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-full font-semibold text-sm transition-all duration-200 border border-black active:scale-95 tracking-wide bg-[#233dff] text-white hover:bg-[#1a2b99] hover:shadow-[0_4px_16px_rgba(35,61,255,0.35)]"
          >
            <span className="w-2 h-2 rounded-full bg-white"></span>
            Chat with Sunny about these results
          </button>
          <button onClick={reset} className="mt-4 text-sm font-bold text-gray-500 hover:text-gray-800 mx-auto block">Start Over</button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-xl max-h-[90vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-3 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors z-10" title="Close">
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
