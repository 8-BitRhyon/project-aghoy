import React from 'react';
import { playSound } from '../utils/sound';
import { Github, Linkedin, Briefcase, Terminal, Shield, Cpu, Box, Code } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl border-4 border-white bg-slate-900 shadow-[8px_8px_0px_0px_rgba(59,130,246,0.5)] flex flex-col max-h-[90vh]">
        
        {/* Close Button */}
        <button 
          onClick={() => {
              playSound('click');
              onClose();
          }}
          className="absolute top-4 right-4 z-10 text-red-500 hover:text-red-400 font-['Press_Start_2P'] text-xl transition-transform hover:scale-110 bg-slate-900"
        >
          [X]
        </button>

        {/* Scrollable Content Container - Separated to prevent shadow clipping */}
        <div className="overflow-y-auto p-6 md:p-8 custom-scrollbar">
            {/* Header Profile */}
            <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 mb-4 bg-slate-800 border-2 border-blue-400 flex items-center justify-center shadow-[4px_4px_0px_0px_#3b82f6]">
                <span className="text-4xl filter drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]">👨‍💻</span>
            </div>
            <h2 className="font-['Press_Start_2P'] text-xl md:text-2xl text-yellow-400 mb-2 text-center leading-relaxed">
                OPERATOR PROFILE
            </h2>
            <p className="font-['VT323'] text-3xl text-cyan-400 uppercase tracking-widest font-bold text-center">
                Rhyon Caleb Foz Santos
            </p>
            <div className="flex gap-2 mt-3">
                <span className="px-3 py-1 bg-blue-900/50 border border-blue-500 text-blue-300 text-xs font-['Press_Start_2P']">CYBERSEC</span>
                <span className="px-3 py-1 bg-green-900/50 border border-green-500 text-green-300 text-xs font-['Press_Start_2P']">DEV</span>
            </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-['VT323'] text-xl text-slate-300">
            
            {/* Mission / Bio */}
            <div className="col-span-1 md:col-span-2 bg-slate-800/50 p-5 border-l-4 border-green-500">
                <h3 className="font-['Press_Start_2P'] text-sm text-green-400 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 animate-pulse"></span> MISSION_LOG
                </h3>
                <p className="leading-relaxed">
                I am a security practitioner and "worldschooler" bridging the gap between technical defense and human resilience. 
                <br/><br/>
                My background involves navigating high-stakes environments (from evacuation zones to complex network labs). 
                I built <strong>Project Aghoy</strong> to give Filipinos a digital shield against modern social engineering attacks.
                </p>
            </div>

            {/* Certifications (The "Credentials") */}
            <div className="bg-slate-800 p-5 border-2 border-slate-700 hover:border-yellow-500/50 transition-colors group">
                <h3 className="font-['Press_Start_2P'] text-xs text-yellow-400 mb-4 border-b border-slate-600 pb-2 group-hover:text-yellow-300">CREDENTIALS</h3>
                <ul className="space-y-3 text-base">
                <li className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-0.5">★</span> 
                    <span>(ISC)² Certified in Cybersecurity</span>
                </li>
                <li className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-0.5">★</span> 
                    <span>IBM & (ISC)² Cybersecurity Specialist</span>
                </li>
                <li className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-0.5">★</span> 
                    <span>Oracle Cloud AI Foundations</span>
                </li>
                <li className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-0.5">★</span> 
                    <span>OCI Foundations</span>
                </li>
                <li className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-0.5">★</span> 
                    <span>ISO 27001 Auditor (Candidate)</span>
                </li>
                </ul>
            </div>

            {/* Operational Toolkit (Replaces Tech Loadout) */}
            <div className="bg-slate-800 p-5 border-2 border-slate-700 hover:border-purple-500/50 transition-colors group">
                <h3 className="font-['Press_Start_2P'] text-xs text-purple-400 mb-4 border-b border-slate-600 pb-2 group-hover:text-purple-300">OPERATIONAL_TOOLKIT</h3>
                <div className="flex flex-wrap gap-2">
                    {/* Development */}
                    <span className="px-3 py-1 bg-purple-900/40 border border-purple-500 text-purple-200 text-sm flex items-center gap-2">
                        <Code className="w-4 h-4" /> TypeScript
                    </span>
                    <span className="px-3 py-1 bg-purple-900/40 border border-purple-500 text-purple-200 text-sm flex items-center gap-2">
                        <Cpu className="w-4 h-4" /> React
                    </span>
                    <span className="px-3 py-1 bg-purple-900/40 border border-purple-500 text-purple-200 text-sm flex items-center gap-2">
                        <Terminal className="w-4 h-4" /> Python
                    </span>
                    
                    {/* Security */}
                    <span className="px-3 py-1 bg-blue-900/40 border border-blue-500 text-blue-200 text-sm flex items-center gap-2">
                        <Shield className="w-4 h-4" /> NetDef
                    </span>
                    <span className="px-3 py-1 bg-blue-900/40 border border-blue-500 text-blue-200 text-sm flex items-center gap-2">
                        <Box className="w-4 h-4" /> OSINT
                    </span>
                    <span className="px-3 py-1 bg-blue-900/40 border border-blue-500 text-blue-200 text-sm flex items-center gap-2">
                        <Terminal className="w-4 h-4" /> Automation
                    </span>
                </div>
            </div>

            </div>

            {/* Footer Links */}
            <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a href="https://github.com/8-BitRhyon" target="_blank" rel="noreferrer" 
                onClick={() => playSound('click')}
                className="flex items-center gap-2 px-6 py-3 bg-slate-800 border-b-4 border-r-4 border-white text-white font-['Press_Start_2P'] text-xs hover:bg-white hover:text-black transition-all active:border-0 active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)]">
                <Github className="w-4 h-4" />
                <span>GITHUB</span>
            </a>
            <a href="https://www.linkedin.com/in/rhyoncalebfozsantos/" target="_blank" rel="noreferrer"
                onClick={() => playSound('click')}
                className="flex items-center gap-2 px-6 py-3 bg-blue-900 border-b-4 border-r-4 border-blue-400 text-white font-['Press_Start_2P'] text-xs hover:bg-blue-400 hover:text-black transition-all active:border-0 active:translate-y-1 shadow-[4px_4px_0px_0px_#3b82f6]">
                <Linkedin className="w-4 h-4" />
                <span>LINKEDIN</span>
            </a>
            <a href="https://github.com/8-BitRhyon" target="_blank" rel="noreferrer"
                onClick={() => playSound('click')}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-900 border-b-4 border-r-4 border-emerald-400 text-white font-['Press_Start_2P'] text-xs hover:bg-emerald-400 hover:text-black transition-all active:border-0 active:translate-y-1 shadow-[4px_4px_0px_0px_#10b981]">
                <Briefcase className="w-4 h-4" />
                <span>PROJECTS</span>
            </a>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;