import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { AnalysisResult, Verdict } from '../types';
import { ShieldAlert, AlertTriangle, Download, Share2 } from 'lucide-react';
import { playSound } from '../utils/sound';
import PixelLogo from './PixelLogo';

interface FamilyWarningCardProps {
  result: AnalysisResult;
  isOpen: boolean;
  onClose: () => void;
}

const FamilyWarningCard: React.FC<FamilyWarningCardProps> = ({ result, isOpen, onClose }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    playSound('click');
    setIsGenerating(true);
    
    try {
      // Wait a moment for fonts/layout
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0f172a', // Match bg
        scale: 2, // Higher quality
      });
      
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `Aghoy-Warning-${result.scamType}.png`;
      link.click();
      playSound('success');
    } catch (err) {
      console.error("Failed to generate image", err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Color logic
  const isHighRisk = result.verdict === Verdict.HIGH_RISK;
  const mainColor = isHighRisk ? 'bg-red-600' : 'bg-yellow-500';
  const textColor = isHighRisk ? 'text-red-500' : 'text-yellow-500';
  const borderColor = isHighRisk ? 'border-red-500' : 'border-yellow-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="flex flex-col items-center gap-3 max-w-md w-full animate-in fade-in zoom-in duration-300 my-auto">
        
        {/* The Card to be Captured */}
        <div 
          ref={cardRef} 
          className={`w-full bg-slate-900 border-[6px] ${borderColor} p-4 md:p-6 relative overflow-hidden shadow-2xl font-['Press_Start_2P']`}
        >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>

            <div className="flex items-center gap-3 mb-4 md:mb-6 border-b-4 border-slate-700 pb-3 md:pb-4">
                <div className="bg-slate-800 p-1 border-2 border-white">
                    <PixelLogo width={48} height={48} />
                </div>
                <div>
                    <h1 className="text-white text-xs md:text-lg leading-tight">PROJECT AGHOY</h1>
                    <p className="text-[8px] md:text-[10px] text-slate-400 mt-1">AI SCAM DETECTOR</p>
                </div>
            </div>

            <div className={`${mainColor} text-white p-3 md:p-4 text-center mb-4 md:mb-6 border-4 border-black shadow-[4px_4px_0_0_#fff]`}>
                <h2 className="text-lg md:text-2xl uppercase font-bold leading-snug">
                    BABALA: <br/> SCAM ITO!
                </h2>
            </div>

            <div className="space-y-3 md:space-y-4 text-center font-['VT323']">
                <div className="text-slate-300 text-lg md:text-2xl uppercase">
                    TYPE: <span className={textColor}>{result.scamType}</span>
                </div>

                <div className="bg-black/50 p-3 md:p-4 border-l-4 border-white text-left">
                     <p className="text-sm md:text-xl text-white leading-relaxed break-words">
                        "{result.educationalTip}"
                     </p>
                </div>

                {result.senderEntity && (
                     <div className="mt-2 md:mt-4 p-2 bg-slate-800 text-slate-300 text-xs md:text-lg border border-slate-600 break-all">
                        SENDER: {result.senderEntity}
                     </div>
                )}
            </div>

            <div className="mt-6 md:mt-8 pt-3 md:pt-4 border-t-4 border-slate-700 flex justify-between items-end">
                 <div className="text-[8px] md:text-[10px] text-slate-500 max-w-[60%]">
                    VERIFIED BY PROJECT AGHOY AI
                 </div>
                 <div className="text-[8px] md:text-[10px] text-white bg-slate-800 px-2 py-1">
                    #ProjectAghoy
                 </div>
            </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3 w-full">
            <button 
                onClick={onClose}
                className="flex-1 py-3 bg-slate-700 text-white font-['VT323'] text-lg md:text-xl border-b-4 border-slate-900 hover:bg-slate-600 active:border-b-0 active:translate-y-1"
            >
                CLOSE
            </button>
            <button 
                onClick={handleDownload}
                disabled={isGenerating}
                className="flex-1 py-3 bg-blue-600 text-white font-['VT323'] text-lg md:text-xl border-b-4 border-blue-900 hover:bg-blue-500 active:border-b-0 active:translate-y-1 flex items-center justify-center gap-2"
            >
                {isGenerating ? 'SAVING...' : <><Download className="w-5 h-5"/> SAVE CARD</>}
            </button>
        </div>
      </div>
    </div>
  );
};

export default FamilyWarningCard;