
import React, { useEffect, useRef } from 'react';
import { FLAG_DEFINITIONS } from '../utils/flagDefinitions';
import { AlertTriangle, BookOpen, X } from 'lucide-react';
import { playSound } from '../utils/sound';

interface FlagKnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  highlightedFlag?: string | null;
}

const FlagKnowledgeModal: React.FC<FlagKnowledgeModalProps> = ({ isOpen, onClose, highlightedFlag }) => {
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (isOpen && highlightedFlag) {
      // Find the normalized key
      const upperFlag = highlightedFlag.toUpperCase();
      const targetKey = Object.keys(FLAG_DEFINITIONS).find(key => upperFlag.includes(key)) || upperFlag;
      
      const element = scrollRefs.current[targetKey];
      if (element) {
        setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Add a temporary flash effect
            element.classList.add('bg-yellow-900/50');
            setTimeout(() => element.classList.remove('bg-yellow-900/50'), 1500);
        }, 300);
      }
    }
  }, [isOpen, highlightedFlag]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl border-4 border-white bg-slate-900 shadow-[8px_8px_0px_0px_rgba(234,88,12,0.5)] flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-orange-900/20 border-b-4 border-orange-500 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="bg-orange-500 p-2 border-2 border-white text-black">
                    <BookOpen className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="font-['Press_Start_2P'] text-lg md:text-xl text-white">THREAT_DATABASE</h2>
                    <p className="font-['VT323'] text-orange-400 text-lg">Definitions & Indicators</p>
                </div>
            </div>
            <button 
                onClick={() => {
                    playSound('click');
                    onClose();
                }}
                className="text-white hover:text-red-400 transition-transform hover:scale-110"
            >
                <X className="w-8 h-8" />
            </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 custom-scrollbar bg-slate-900">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(FLAG_DEFINITIONS).map(([key, definition]) => {
                    const isHighlighted = highlightedFlag && key.includes(highlightedFlag.toUpperCase());
                    
                    return (
                        <div 
                            key={key} 
                            ref={(el) => { scrollRefs.current[key] = el; }}
                            className={`p-4 border-2 transition-all duration-500 ${
                                isHighlighted 
                                ? 'border-yellow-400 bg-yellow-900/30 shadow-[0_0_15px_rgba(250,204,21,0.3)]' 
                                : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'
                            }`}
                        >
                            <h3 className="font-['Press_Start_2P'] text-xs md:text-sm text-orange-400 mb-2 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                {key}
                            </h3>
                            <p className="font-['VT323'] text-xl text-slate-300 leading-relaxed">
                                {definition}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-black border-t-4 border-slate-700 text-center font-['VT323'] text-slate-500 text-sm">
            KNOWLEDGE IS YOUR BEST DEFENSE
        </div>
      </div>
    </div>
  );
};

export default FlagKnowledgeModal;
