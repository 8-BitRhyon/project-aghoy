import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Search, Info, Lock, Globe, AlertOctagon, Image as ImageIcon, X, Terminal, Shield, Bot, Menu } from 'lucide-react';
import { analyzeContent } from './services/geminiService';
import { AnalysisResult, Verdict } from './types';
import ResultCard from './components/ResultCard';
import Dojo from './components/Dojo';
import AboutModal from './components/AboutModal';
import PixelLogo from './components/PixelLogo';
import { playSound } from './utils/sound';

// QUICK TRY EXAMPLES
const SCAM_EXAMPLES = [
  { 
    label: 'Task Scam', 
    text: 'Good day! We are hiring part-time employees. Earn ₱500-₱2000/day by just liking YouTube videos. No fees collected. Contact wa.me/12345678' 
  },
  { 
    label: 'Fake GCash', 
    text: 'GCash Warning: Your account has been restricted due to suspicious activity. Verify now at https://g-cash-verify.com to avoid suspension.' 
  },
  { 
    label: 'Love Scam', 
    text: 'Hello dear, I am Engineer James from US. I have a package for you with $50,000 inside but it is stuck at customs. Please send fee to release it.' 
  },
  { 
    label: 'Investment', 
    text: 'Invest 500 pesos and get 5000 pesos return in just 3 days! Proven and tested. PM me how.' 
  }
];

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('TAGALOG');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'SCANNER' | 'DOJO'>('SCANNER');
  const [showAbout, setShowAbout] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize Logic
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(160, textarea.scrollHeight)}px`;
    }
  }, [input]);

  // Global Paste Listener for Image
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            playSound('click');
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64String = reader.result as string;
              const base64Data = base64String.split(',')[1];
              setSelectedImage(base64Data);
              setImageMimeType(blob.type);
              setActiveTab('SCANNER'); // Switch to scanner on paste
            };
            reader.readAsDataURL(blob);
            return; // Stop after first image
          }
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, []);

  const handleAnalyze = async () => {
    if (!input && !selectedImage) return;
    
    playSound('click');
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Simulate scan sound
      playSound('scan');
      const analysis = await analyzeContent(input, language, selectedImage || undefined, imageMimeType || undefined);
      setResult(analysis);
      if (analysis.verdict === 'SAFE') {
        playSound('success');
      } else {
        playSound('alert');
      }
    } catch (err: any) {
      setError(err.message);
      playSound('alert');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      playSound('click');
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Extract raw base64 (remove data:image/xxx;base64, prefix)
        const base64Data = base64String.split(',')[1];
        setSelectedImage(base64Data);
        setImageMimeType(file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTabChange = (tab: 'SCANNER' | 'DOJO') => {
    playSound('click');
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen pb-20 relative">
       <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />

      {/* Top Banner */}
      <div className="bg-slate-900 border-b-4 border-slate-700 p-4 sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
           <div className="flex items-center gap-3 md:gap-4">
               <div className="border-2 border-white bg-slate-800 p-1">
                  <PixelLogo width={48} height={48} />
               </div>
               <div>
                  <h1 className="text-lg md:text-2xl font-bold text-white font-['Press_Start_2P'] tracking-tighter leading-none">
                    PROJECT <span className="text-cyan-400">AGHOY</span>
                  </h1>
                  <p className="text-[10px] md:text-xs text-slate-400 font-mono tracking-widest mt-1">AI SCAM DETECTOR & DOJO</p>
               </div>
           </div>
           
           <button 
             onClick={() => {
               playSound('click');
               setShowAbout(true);
             }}
             className="p-2 hover:bg-slate-800 border-2 border-transparent hover:border-slate-500 transition-colors text-slate-300 flex flex-col items-center"
           >
             <Info className="w-6 h-6" />
             <span className="text-[8px] font-['Press_Start_2P'] mt-1 hidden md:block">ABOUT</span>
           </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto mt-6 px-4">
        <div className="flex border-b-4 border-slate-700">
           <button 
             onClick={() => handleTabChange('SCANNER')}
             className={`flex-1 py-3 md:py-4 font-['Press_Start_2P'] text-xs md:text-sm flex items-center justify-center gap-2 transition-all relative ${
               activeTab === 'SCANNER' 
                 ? 'bg-slate-800 text-cyan-400 border-t-4 border-l-4 border-r-4 border-slate-600 -mb-1 z-10' 
                 : 'bg-slate-900 text-slate-500 hover:bg-slate-800 hover:text-slate-300'
             }`}
           >
             <Search className="w-4 h-4 md:w-5 md:h-5" />
             SCANNER
           </button>
           <button 
             onClick={() => handleTabChange('DOJO')}
             className={`flex-1 py-3 md:py-4 font-['Press_Start_2P'] text-xs md:text-sm flex items-center justify-center gap-2 transition-all relative ${
               activeTab === 'DOJO' 
                 ? 'bg-slate-800 text-yellow-400 border-t-4 border-l-4 border-r-4 border-slate-600 -mb-1 z-10' 
                 : 'bg-slate-900 text-slate-500 hover:bg-slate-800 hover:text-slate-300'
             }`}
           >
             <Bot className="w-4 h-4 md:w-5 md:h-5" />
             TRAINING_DOJO
           </button>
        </div>
      </div>

      {/* Main Content Area - Wrapped to prevent edge clipping */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <div className="p-4 md:p-6 bg-slate-800 min-h-[60vh] border-x-4 border-b-4 border-slate-700 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            
            {/* Language Selector */}
            <div className="mb-6 flex justify-end">
                <div className="grid grid-cols-4 md:inline-flex bg-black border-2 border-slate-600 p-1 gap-1 md:gap-0 w-full md:w-auto">
                    {['TAGALOG', 'BISAYA', 'ILOCANO', 'ENGLISH'].map((lang) => (
                    <button
                        key={lang}
                        onClick={() => {
                            playSound('click');
                            setLanguage(lang);
                        }}
                        className={`px-3 py-2 md:py-1 text-[10px] md:text-sm font-['Press_Start_2P'] transition-colors w-full text-center ${
                        language === lang ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        {lang.substring(0,3)}
                    </button>
                    ))}
                </div>
            </div>

            {activeTab === 'SCANNER' ? (
            <div className="animate-fade-in">
                
                {/* Aghoy Character (The "Soul") */}
                <div className="flex flex-col items-center justify-center my-4 md:my-8">
                    <div className={`transition-all duration-500 ${
                        result?.verdict === Verdict.HIGH_RISK ? 'animate-pulse' : 
                        result?.verdict === Verdict.SAFE ? '' : 'animate-float'
                    }`}>
                        <div className="relative">
                             {/* Use PixelLogo as the Soul/Avatar */}
                             <PixelLogo 
                                width={96} 
                                height={96} 
                                className={
                                    result?.verdict === Verdict.HIGH_RISK ? 'filter drop-shadow-[0_0_10px_red]' : 
                                    result?.verdict === Verdict.SAFE ? 'filter drop-shadow-[0_0_10px_green]' :
                                    'filter drop-shadow-[0_0_15px_cyan]'
                                } 
                             />
                        </div>
                    </div>
                    <p className={`font-['Press_Start_2P'] text-[10px] md:text-xs mt-4 tracking-widest ${
                         result?.verdict === Verdict.HIGH_RISK ? 'text-red-500 animate-pulse' : 
                         result?.verdict === Verdict.SAFE ? 'text-green-400' :
                         'text-cyan-300'
                    }`}>
                        {result ? 'ANALYSIS_COMPLETE' : 'AGHOY_SYSTEM_ACTIVE'}
                    </p>
                </div>

                {/* Input Section */}
                {!result && (
                    <div className="space-y-4 max-w-3xl mx-auto">
                        
                        {/* Quick Try Buttons */}
                        <div className="mb-4">
                          <p className="text-slate-400 text-xs font-['Press_Start_2P'] mb-2 uppercase">Quick Try:</p>
                          <div className="grid grid-cols-2 md:flex gap-2">
                            {SCAM_EXAMPLES.map((ex, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  playSound('click');
                                  setInput(ex.text);
                                }}
                                className="px-3 py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 hover:border-cyan-400 text-slate-300 text-xs font-mono text-left transition-all truncate"
                              >
                                &gt; {ex.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="bg-black p-1 border-2 border-slate-600 relative group flex flex-col">
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Paste text message, email, job offer details, or paste an image (Ctrl+V)..."
                                className="w-full min-h-[160px] max-h-[60vh] bg-slate-900 text-green-400 p-4 pb-20 font-mono text-lg focus:outline-none placeholder:text-slate-600 resize-none block overflow-y-auto"
                            />
                            <div className="absolute bottom-2 right-2 flex gap-2">
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                    accept="image/*"
                                    className="hidden"
                                />
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`p-2 border-2 ${selectedImage ? 'border-green-500 text-green-500' : 'border-slate-600 text-slate-500'} bg-black hover:bg-slate-800 transition-colors`}
                                    title="Upload Screenshot"
                                >
                                    <ImageIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        
                        {selectedImage && (
                            <div className="flex items-center gap-3 p-2 bg-slate-900 border border-green-900 text-green-400 text-sm">
                                <ImageIcon className="w-4 h-4" />
                                <span>Image attached</span>
                                <button onClick={() => setSelectedImage(null)} className="ml-auto text-red-500 hover:text-red-400"><X className="w-4 h-4"/></button>
                            </div>
                        )}

                        <button
                            onClick={handleAnalyze}
                            disabled={isLoading || (!input && !selectedImage)}
                            className="w-full py-4 bg-cyan-700 hover:bg-cyan-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-['Press_Start_2P'] border-b-4 border-cyan-900 active:border-b-0 active:translate-y-1 transition-all shadow-lg flex items-center justify-center gap-3"
                        >
                            {isLoading ? (
                                <><Loader2 className="animate-spin" /> SCANNING...</>
                            ) : (
                                <><Search /> ANALYZE_THREAT</>
                            )}
                        </button>

                        {/* Privacy Lock Disclaimer */}
                        <div className="mt-4 flex items-center justify-center gap-2 text-slate-500 opacity-60">
                          <Lock className="w-3 h-3" />
                          <p className="text-[10px] font-mono uppercase">
                            Secure Analysis. Your data is processed privately.
                          </p>
                        </div>
                        
                        {error && (
                            <div className="p-4 bg-red-900/50 border-2 border-red-500 text-red-200 flex items-center gap-3 font-mono">
                                <AlertOctagon className="w-6 h-6 shrink-0" />
                                {error}
                            </div>
                        )}
                    </div>
                )}

                {/* Results Section */}
                {result && (
                    <ResultCard 
                        result={result} 
                        onReset={() => {
                            playSound('click');
                            setResult(null);
                            setInput('');
                            setSelectedImage(null);
                        }} 
                    />
                )}
            </div>
            ) : (
            <div className="animate-fade-in">
                <Dojo selectedLanguage={language} />
            </div>
            )}

        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-slate-600 font-['VT323'] text-lg">
         <p>SECURE THE PHILIPPINES • ONE SCAN AT A TIME</p>
         <button 
            onClick={() => setShowAbout(true)}
            className="mt-2 text-slate-500 hover:text-cyan-400 text-sm font-['Press_Start_2P'] flex items-center justify-center gap-2 mx-auto"
         >
            [?] OPERATOR_PROFILE
         </button>
      </div>

    </div>
  );
}

export default App;
