import React, { useState, useEffect } from 'react';
import { Shield, Check, X } from 'lucide-react';
import { playSound } from '../utils/sound';

interface PrivacyConsentProps {
  onConsentChange?: (granted: boolean) => void;
}

const PrivacyConsent: React.FC<PrivacyConsentProps> = ({ onConsentChange }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('aghoy_privacy_consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleConsent = (accepted: boolean) => {
    playSound(accepted ? 'success' : 'click');
    localStorage.setItem('aghoy_privacy_consent', accepted ? 'granted' : 'denied');
    
    if (onConsentChange) {
      onConsentChange(accepted);
    }

    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 flex justify-center items-end pointer-events-none">
      <div className="bg-slate-900 border-4 border-cyan-500 shadow-[0_0_50px_rgba(6,182,212,0.3)] max-w-2xl w-full pointer-events-auto animate-in slide-in-from-bottom-10 fade-in duration-500 p-4 relative">
        
        {/* Decorative Header */}
        <div className="absolute -top-3 left-4 bg-cyan-600 text-white px-3 py-1 font-['Press_Start_2P'] text-[10px] uppercase tracking-widest border-2 border-slate-900">
          <Shield className="w-3 h-3 inline-block mr-2" />
          System Security
        </div>

        <div className="flex flex-col md:flex-row gap-4 mt-2">
          <div className="flex-1">
            <h3 className="text-white font-['Press_Start_2P'] text-xs mb-2">
              INITIALIZE PRIVACY PROTOCOLS?
            </h3>
            <p className="font-['VT323'] text-slate-300 text-lg leading-tight text-justify">
              Project Aghoy uses <span className="text-white font-bold">Advanced AI</span> to analyze messages. 
              To help protect others, we collect <span className="text-cyan-400 font-bold">anonymized scam patterns</span>.
              <br/>
              <span className="text-red-400">WE NEVER STORE:</span> Your personal messages, names, phone numbers, or passwords.
            </p>
          </div>

          <div className="flex gap-2 shrink-0">
            <button 
              onClick={() => handleConsent(true)}
              className="px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white font-['Press_Start_2P'] text-[10px] border-b-4 border-cyan-900 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" /> ACCEPT
            </button>
            <button 
              onClick={() => handleConsent(false)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-['Press_Start_2P'] text-[10px] border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2"
            >
              <X className="w-4 h-4" /> DECLINE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyConsent;