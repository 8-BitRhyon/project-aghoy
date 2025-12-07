import { ShieldCheck, ShieldAlert, AlertTriangle, ChevronRight, BookOpen, Copy, Check, Phone, Globe, Share2, Building2, Mail, Lock, FileText, Smartphone, Info, Landmark, Scale } from 'lucide-react';
import SmartSupport from './SmartSupport';
import React, { useState, useEffect } from 'react';
import { AnalysisResult, Verdict } from '../types';
import RiskGauge from './RiskGauge';
import FamilyWarningCard from './FamilyWarningCard';
import FlagKnowledgeModal from './FlagKnowledgeModal';
import { playSound } from '../utils/sound';
import { getFlagDefinition } from '../utils/flagDefinitions';

// --- 1. CONFIGURATION & HELPERS ---

const OFFICIAL_CHANNELS = [
  // 1. POLICE (Immediate Action)
  { 
    href: "https://acg.pnp.gov.ph/contact-us/", 
    label: "PNP-ACG", 
    desc: "Anti-Cybercrime Group", 
    action: "FILE POLICE COMPLAINT", 
    Icon: Globe, 
    colorClass: "text-blue-400", 
    hoverBorder: "hover:border-blue-500", 
    bgIcon: "bg-blue-900/30 border-blue-800", 
    groupHoverText: "group-hover:text-blue-400" 
  },
  { 
    href: "tel:1326", 
    label: "CICC", 
    desc: "Investigation Center", 
    action: "DIAL 1326 HOTLINE", 
    Icon: Phone, 
    colorClass: "text-green-400", 
    hoverBorder: "hover:border-green-500", 
    bgIcon: "bg-green-900/30 border-green-800", 
    groupHoverText: "group-hover:text-green-400" 
  },
  
  // 2. FINANCIAL REGULATORS (For Money Recovery/Reports)
  { 
    href: "mailto:epd@sec.gov.ph", // Direct email per screenshot
    label: "SEC-EIPD", 
    desc: "Investments & Lending", 
    action: "EMAIL COMPLAINT", 
    Icon: Scale, 
    colorClass: "text-yellow-400", 
    hoverBorder: "hover:border-yellow-500", 
    bgIcon: "bg-yellow-900/30 border-yellow-800", 
    groupHoverText: "group-hover:text-yellow-400" 
  },
  { 
    href: "https://www.bsp.gov.ph/Pages/InclusiveFinance/ConsumerAssistanceChannelsChatbot.aspx", 
    label: "BSP-BOB", 
    desc: "Central Bank Chatbot", 
    action: "FILE BANK COMPLAINT", 
    Icon: Landmark, 
    colorClass: "text-indigo-400", 
    hoverBorder: "hover:border-indigo-500", 
    bgIcon: "bg-indigo-900/30 border-indigo-800", 
    groupHoverText: "group-hover:text-indigo-400" 
  },

  // 3. TELECOM & INVESTIGATION (Spam Prevention)
  { 
    href: "https://www.globe.com.ph/stop-spam", 
    label: "GLOBE", 
    desc: "Stop Spam Portal", 
    action: "REPORT SCAM NUMBER", 
    Icon: Smartphone, 
    colorClass: "text-blue-300", 
    hoverBorder: "hover:border-blue-400", 
    bgIcon: "bg-blue-800/30 border-blue-700", 
    groupHoverText: "group-hover:text-blue-300" 
  },
  { 
    href: "https://ntc.gov.ph/text-spam-spam-report/", 
    label: "NTC", 
    desc: "Telecom Commission", 
    action: "REPORT SPAM NUMBER", 
    Icon: Mail, 
    colorClass: "text-orange-400", 
    hoverBorder: "hover:border-orange-500", 
    bgIcon: "bg-orange-900/30 border-orange-800", 
    groupHoverText: "group-hover:text-orange-400" 
  }
];

const getVerdictStyle = (verdict: Verdict) => {
  switch (verdict) {
    case Verdict.SAFE:
      return { borderColor: 'border-green-500', bgColor: 'bg-green-900', textColor: 'text-green-400', icon: <ShieldCheck className="w-8 h-8 md:w-12 md:h-12 text-green-400" />, label: 'STATUS: SAFE' };
    case Verdict.SUSPICIOUS:
      return { borderColor: 'border-yellow-500', bgColor: 'bg-yellow-900', textColor: 'text-yellow-400', icon: <AlertTriangle className="w-8 h-8 md:w-12 md:h-12 text-yellow-400" />, label: 'STATUS: SUSPICIOUS' };
    case Verdict.HIGH_RISK:
      return { borderColor: 'border-red-500', bgColor: 'bg-red-900', textColor: 'text-red-500', icon: <ShieldAlert className="w-8 h-8 md:w-12 md:h-12 text-red-500" />, label: 'STATUS: HIGH_RISK' };
    default:
      return { borderColor: 'border-slate-500', bgColor: 'bg-slate-900', textColor: 'text-slate-500', icon: <Info />, label: 'UNKNOWN' };
  }
};

// --- 2. SUB-COMPONENTS ---

// IMPORTANT: We now accept detectedEntity to pass it down
const VictimAssistanceGuide: React.FC<{ detectedEntity?: string }> = ({ detectedEntity }) => (
  <div className="border-[4px] border-red-900 bg-red-950/30 p-3 md:p-6 relative overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 animate-pulse"></div>
    <h4 className="text-red-400 text-[10px] md:text-sm font-['Press_Start_2P'] mb-4 flex items-center gap-2 uppercase tracking-wide">
      <AlertTriangle className="w-3 h-3 md:w-4 md:h-4 animate-bounce" /> VICTIM_ASSISTANCE PROTOCOL
    </h4>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-['VT323'] text-sm md:text-xl text-slate-300">
      {/* Step 1 */}
      <div className="flex md:flex-col gap-3 md:gap-2">
        <div className="flex-shrink-0 w-8 h-8 md:w-12 md:h-12 bg-red-900/50 border-2 border-red-500 flex items-center justify-center text-red-400 font-bold text-base md:text-2xl font-['Press_Start_2P'] shadow-[2px_2px_0_0_rgba(220,38,38,0.5)]">1</div>
        <div>
          <h5 className="text-red-300 font-bold text-base md:text-2xl mb-1 flex items-center gap-2"><Lock className="w-4 h-4 md:w-6 md:h-6" /> FREEZE FUNDS</h5>
          <p className="leading-tight mb-2 text-sm md:text-lg">Contact support immediately to <strong>LOCK</strong> accounts.</p>
          <ul className="text-sm md:text-lg text-slate-400 list-none space-y-1 border-l-2 border-red-900/50 pl-2">
            <li>
              <span className="text-blue-400 font-bold">[GCash]</span> <a href="tel:2882" className="hover:text-white underline decoration-dotted transition-colors">Dial 2882</a>
            </li>
            <li>
              <span className="text-green-400 font-bold">[Maya]</span> <a href="tel:*788" className="hover:text-white underline decoration-dotted transition-colors">Dial *788</a>
            </li>
            <li>
              <span className="text-blue-300 font-bold">[BDO]</span> <a href="tel:0286318000" className="hover:text-white underline decoration-dotted transition-colors">(02) 8631-8000</a>
            </li>
            <li>
              <span className="text-red-400 font-bold">[BPI]</span> <a href="tel:0288910000" className="hover:text-white underline decoration-dotted transition-colors">(02) 889-10000</a>
            </li>
          </ul>
        </div>
      </div>

      {/* Step 2 */}
      <div className="flex md:flex-col gap-3 md:gap-2">
        <div className="flex-shrink-0 w-8 h-8 md:w-12 md:h-12 bg-orange-900/50 border-2 border-orange-500 flex items-center justify-center text-orange-400 font-bold text-base md:text-2xl font-['Press_Start_2P'] shadow-[2px_2px_0_0_rgba(234,88,12,0.5)]">2</div>
        <div>
          <h5 className="text-orange-300 font-bold text-base md:text-2xl mb-1 flex items-center gap-2"><FileText className="w-4 h-4 md:w-6 md:h-6" /> EVIDENCE</h5>
          <p className="leading-tight mb-1 text-sm md:text-lg"><strong>DON'T DELETE!</strong></p>
          <ul className="text-sm md:text-lg text-slate-400 list-disc list-inside">
            <li>Screenshot chats</li>
            <li>Save receipts</li>
            <li>Copy URLs</li>
          </ul>
        </div>
      </div>

      {/* Step 3 */}
      <div className="flex md:flex-col gap-3 md:gap-2">
        <div className="flex-shrink-0 w-8 h-8 md:w-12 md:h-12 bg-slate-800 border-2 border-slate-500 flex items-center justify-center text-slate-400 font-bold text-base md:text-2xl font-['Press_Start_2P'] shadow-[2px_2px_0_0_rgba(100,116,139,0.5)]">3</div>
        <div>
          <h5 className="text-slate-300 font-bold text-base md:text-2xl mb-1 flex items-center gap-2"><Smartphone className="w-4 h-4 md:w-6 md:h-6" /> RESET</h5>
          <p className="leading-tight text-sm md:text-lg">Change MPIN, passwords, and enable 2FA on all apps.</p>
        </div>
      </div>
    </div>
    
    <div className="mt-4">
      <h5 className="text-slate-500 text-xs font-['Press_Start_2P'] mb-2 uppercase">Direct Support Line:</h5>
      {/* Pass the detected entity to SmartSupport */}
      <SmartSupport detectedEntity={detectedEntity} />
    </div>
  </div>
);

const OfficialChannelsList: React.FC = () => (
  <div className="bg-slate-950 p-3 md:p-4 border-4 border-slate-800">
    <h4 className="text-slate-400 text-[10px] md:text-sm font-['Press_Start_2P'] mb-3 uppercase flex items-center gap-2">
      <ShieldCheck className="w-3 h-3 md:w-4 md:h-4" /> Government_Uplink
    </h4>
    <div className="flex flex-col gap-2">
      {OFFICIAL_CHANNELS.map((channel, idx) => (
        <a key={idx} href={channel.href} target={channel.href.startsWith('http') ? "_blank" : undefined} rel="noreferrer" 
           className={`flex items-center gap-3 p-2 md:p-3 bg-slate-900 border-l-4 border-slate-700 ${channel.hoverBorder} hover:bg-slate-800 transition-all group relative overflow-hidden`}
           onMouseEnter={() => playSound('hover')} onClick={() => playSound('click')}>
          <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 ${channel.bgIcon} transition-opacity`}></div>
          <div className={`w-10 h-10 shrink-0 flex items-center justify-center ${channel.colorClass} border-2 border-current rounded-sm bg-black/20`}>
            <channel.Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1 flex flex-col">
            <div className="flex justify-between items-baseline">
              <span className={`text-sm md:text-base font-bold text-slate-200 ${channel.groupHoverText} font-['Press_Start_2P']`}>{channel.label}</span>
              <span className="text-[10px] md:text-xs text-slate-500 uppercase tracking-tighter hidden sm:inline">{channel.desc}</span>
            </div>
            <div className={`text-xs md:text-sm font-bold mt-1 flex items-center gap-1 ${channel.colorClass}`}>
              {channel.action} <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </a>
      ))}
    </div>
  </div>
);

// --- 3. MAIN COMPONENT ---

interface ResultCardProps {
  result: AnalysisResult;
  onReset: () => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ result, onReset }) => {
  const [expandedEducation, setExpandedEducation] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showWarningCard, setShowWarningCard] = useState(false);
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);
  const [highlightedFlag, setHighlightedFlag] = useState<string | null>(null);
  const [hoveredFlag, setHoveredFlag] = useState<string | null>(null);

  useEffect(() => { setExpandedEducation(true); }, [result]);

  const style = getVerdictStyle(result.verdict);
  const isHighRisk = result.verdict === Verdict.HIGH_RISK;
  const isSuspiciousOrHigh = result.verdict === Verdict.SUSPICIOUS || result.verdict === Verdict.HIGH_RISK;

  const handleCopyReport = () => {
    playSound('click');
    const reportText = `REPORT TO PNP-ACG\n\nType: ${result.scamType}\nSender: ${result.senderEntity || 'Unknown'}\n\nDetails:\nI received a suspicious message identified as a potential ${result.scamType}. \n\nRed Flags Detected: ${result.redFlags.join(', ')}.`;
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div key={result.riskScore + result.verdict} className="w-full mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 font-['VT323'] px-0 md:px-0 pb-10">
      
      {/* Modals */}
      <FamilyWarningCard result={result} isOpen={showWarningCard} onClose={() => setShowWarningCard(false)} />
      <FlagKnowledgeModal isOpen={showKnowledgeModal} onClose={() => setShowKnowledgeModal(false)} highlightedFlag={highlightedFlag} />

      {/* Main Container */}
      <div className={`border-[4px] md:border-[6px] ${style.borderColor} bg-slate-900 p-1 shadow-[6px_6px_0_0_rgba(0,0,0,0.8)] md:shadow-[14px_14px_0_0_rgba(0,0,0,0.8)] relative m-1 md:m-2 transition-colors duration-500`}>
        
        {/* Decorative Screws */}
        <div className={`absolute -top-2 -left-2 w-4 h-4 ${style.bgColor} border-2 border-slate-900`}></div>
        <div className={`absolute -top-2 -right-2 w-4 h-4 ${style.bgColor} border-2 border-slate-900`}></div>
        <div className={`absolute -bottom-2 -left-2 w-4 h-4 ${style.bgColor} border-2 border-slate-900`}></div>
        <div className={`absolute -bottom-2 -right-2 w-4 h-4 ${style.bgColor} border-2 border-slate-900`}></div>

        <div className="border-2 border-slate-700 p-3 md:p-6 bg-[#0f172a] relative overflow-hidden">
          {/* CRT Overlay */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,6px_100%] opacity-20 z-0"></div>

          {/* --- HEADER --- */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 border-b-4 border-slate-800 pb-4 gap-4 relative z-10">
            <div className="flex items-center gap-4 flex-1 w-full">
              <div className={`p-2 md:p-4 border-[3px] border-slate-800 ${style.bgColor} shadow-[2px_2px_0_0_#000]`}>
                {style.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xs md:text-lg text-slate-500 font-bold mb-1 truncate font-mono">ID: #AGHOY-{Math.floor(Math.random() * 9999)}</h2>
                <h3 className={`text-xl md:text-4xl font-bold font-['Press_Start_2P'] ${style.textColor} leading-tight mt-1 break-words text-shadow-retro`}>{style.label}</h3>
                <div className="flex flex-wrap gap-2 mt-2 md:mt-4">
                  {result.scamType && result.scamType !== 'None' && (
                    <div className="inline-block px-2 py-0.5 md:px-3 md:py-1 bg-slate-800 text-white border-2 border-slate-600 text-[10px] md:text-sm font-['Press_Start_2P']">
                      TYPE: {result.scamType.toUpperCase()}
                    </div>
                  )}
                  {result.verdict !== Verdict.SAFE && (
                    <button onClick={() => { playSound('click'); setShowWarningCard(true); }} className="flex items-center gap-2 px-2 py-0.5 md:px-3 md:py-1 bg-pink-700 hover:bg-pink-600 text-white border-b-4 border-r-4 border-pink-900 active:border-0 active:translate-y-1 transition-all text-[10px] md:text-xs font-['Press_Start_2P']">
                      <Share2 className="w-3 h-3" /> WARN_FAMILY
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="w-full md:w-48 shrink-0 mt-2 md:mt-0">
               <RiskGauge score={result.riskScore} />
            </div>
          </div>

          {/* --- GRID CONTENT --- */}
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 relative z-10">
            
            {/* LEFT COLUMN: Flags & Actions */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              {result.redFlags.length > 0 && (
                <div className="relative">
                  <h4 className="text-sm md:text-xl font-bold text-white mb-2 flex items-center gap-2 font-['Press_Start_2P'] uppercase">
                    <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-orange-500" /> DETECTED_FLAGS:
                  </h4>
                  {/* Tooltip Area */}
                  <div className="h-32 mb-2 border border-slate-700 bg-slate-900/50 p-2 overflow-y-auto custom-scrollbar">
                     {hoveredFlag ? (
                        <div className="text-xs md:text-sm text-cyan-300 font-mono animate-fade-in">
                           <span className="font-bold text-white block mb-1 uppercase border-b border-cyan-500/30 pb-1">INFO: {hoveredFlag}</span>
                           {getFlagDefinition(hoveredFlag)}
                        </div>
                     ) : (
                        <div className="h-full flex items-center justify-center text-xs text-slate-600 font-mono italic text-center">[ HOVER FLAGS FOR INTEL ]</div>
                     )}
                  </div>
                  {/* Flag Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {result.redFlags.map((flag, index) => (
                      <button key={index} onMouseEnter={() => setHoveredFlag(flag)} onMouseLeave={() => setHoveredFlag(null)} 
                        onClick={() => { playSound('click'); setHighlightedFlag(flag); setShowKnowledgeModal(true); }}
                        className="px-2 py-1 bg-red-950/40 text-red-200 border-2 border-red-800/60 text-xs md:text-sm flex items-center gap-2 hover:bg-red-900 hover:border-red-500 transition-all cursor-help group text-left">
                        <span className="w-1.5 h-1.5 bg-red-500 animate-pulse group-hover:bg-white"></span>
                        {flag.toUpperCase()} <Info className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* PNP Report Button (High Risk Only) */}
              {isHighRisk && (
                <div className="w-full bg-red-700 text-white border-b-4 md:border-b-8 border-r-4 md:border-r-8 border-red-900 flex flex-col p-3 md:p-4 gap-3 relative overflow-hidden group">
                   <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000_10px,#000_20px)]"></div>
                   <div className="flex items-center gap-3 relative z-10">
                      <ShieldAlert className="w-8 h-8 md:w-10 md:h-10 animate-pulse shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="block font-bold text-sm md:text-lg font-['Press_Start_2P'] mb-1 truncate">GENERATE REPORT</span>
                        <span className="block text-xs md:text-sm opacity-90 font-mono">Create PNP-ACG Text</span>
                      </div>
                   </div>
                   <button onClick={handleCopyReport} className={`w-full flex items-center justify-center gap-2 text-xs md:text-sm font-bold bg-red-900 hover:bg-red-800 px-3 py-2 border-2 ${copied ? 'border-green-400 text-green-400' : 'border-white text-white'} font-['Press_Start_2P'] transition-all active:scale-95 relative z-10`}>
                      {copied ? <Check className="w-3 h-3 md:w-4 md:h-4" /> : <Copy className="w-3 h-3 md:w-4 md:h-4" />} {copied ? 'COPIED!' : 'COPY REPORT'}
                   </button>
                </div>
              )}

              {/* Official Channels List */}
              {isSuspiciousOrHigh && <OfficialChannelsList />}
            </div>

            {/* RIGHT COLUMN: Analysis & Education */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Terminal Box */}
              <div className="bg-black p-3 md:p-6 border-[3px] border-green-900/50 shadow-inner h-fit">
                <div className="flex items-center justify-between border-b border-green-900/50 pb-2 mb-4">
                  <div className="bg-green-900 text-green-100 px-2 py-0.5 text-[10px] md:text-xs font-bold font-['Press_Start_2P']">SYS_LOG</div>
                  <div className="flex gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div><div className="w-2 h-2 rounded-full bg-yellow-500"></div><div className="w-2 h-2 rounded-full bg-green-500"></div></div>
                </div>
                <p className="text-green-400 leading-relaxed text-sm md:text-xl whitespace-pre-line font-mono break-words">
                  {">"} {result.analysis} <span className="inline-block w-2 h-4 md:w-3 md:h-6 bg-green-400 ml-1 animate-pulse align-middle"></span>
                </p>
              </div>

              {/* Education Mode */}
              {result.verdict !== Verdict.SAFE && (
                <div className="border-t-4 border-slate-800 pt-4">
                  <button onClick={() => { playSound('click'); setExpandedEducation(!expandedEducation); }} className="flex items-center justify-between w-full text-left text-cyan-400 hover:text-cyan-300 transition-colors group mb-4">
                    <div className="flex items-center gap-2">
                       <BookOpen className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
                       <span className="font-bold text-xs md:text-lg uppercase decoration-cyan-500/50 underline underline-offset-4 font-['Press_Start_2P']">Aghoy Defense Guide</span>
                    </div>
                    <div className={`border-2 border-cyan-500 p-0.5 md:p-1 transition-transform duration-300 bg-slate-900 ${expandedEducation ? 'rotate-90' : ''}`}>
                       <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
                    </div>
                  </button>
                  {expandedEducation && (
                    <div className="animate-in slide-in-from-top-2 duration-300">
                      <div className="bg-blue-950/50 border-l-4 md:border-l-8 border-blue-500 p-3 md:p-6 flex flex-col md:flex-row items-start gap-3">
                        <div className="p-2 md:p-3 bg-blue-600 text-white shrink-0 border-2 border-white shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] hidden md:block"><AlertTriangle className="w-6 h-6" /></div>
                        <div>
                          <h5 className="text-blue-300 font-bold text-[10px] md:text-sm mb-2 uppercase font-['Press_Start_2P'] tracking-wide">Strategy: {result.scamType}</h5>
                          <p className="text-blue-100 text-sm md:text-xl leading-relaxed italic border-l-2 border-blue-500/30 pl-3 md:pl-4">"{result.educationalTip}"</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Victim Assistance (includes SmartSupport) */}
              {isSuspiciousOrHigh && <VictimAssistanceGuide detectedEntity={result.senderEntity || result.scamType} />}
            </div>
          </div>

          {/* Reset Button */}
          <button onClick={onReset} className="mt-6 w-full py-3 md:py-4 px-4 md:px-6 bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm md:text-xl rounded-none border-b-4 md:border-b-8 border-r-4 md:border-r-8 border-slate-900 active:border-0 active:translate-y-2 active:translate-x-2 transition-all flex items-center justify-center gap-2 uppercase font-['Press_Start_2P'] relative z-10">
            New_Scan <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
          </button>

        </div>
      </div>
    </div>
  );
};

export default ResultCard;
