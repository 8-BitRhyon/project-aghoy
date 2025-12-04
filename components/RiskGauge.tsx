import React from 'react';

interface RiskGaugeProps {
  score: number; // 0-10
}

const RiskGauge: React.FC<RiskGaugeProps> = ({ score }) => {
  // Direct Risk Logic: Higher score = Higher width (Higher Threat)
  // We ensure at least 5% width so the bar is always visible
  const percentage = Math.max(5, score * 10);
  
  // Colors & Labels
  let barColor = 'bg-green-500';
  let label = 'LOW';
  let labelColor = 'text-green-400';
  
  if (score > 3 && score <= 7) {
    barColor = 'bg-yellow-500';
    label = 'MODERATE';
    labelColor = 'text-yellow-400';
  } else if (score > 7) {
    barColor = 'bg-red-600 animate-pulse'; // Pulse when danger
    label = 'CRITICAL';
    labelColor = 'text-red-500 blink';
  }

  return (
    <div className="w-full font-['Press_Start_2P']">
      <div className="flex flex-col items-start mb-2">
        <span className="text-[10px] text-slate-400 uppercase">THREAT_LEVEL</span>
        <span className={`text-xs ${labelColor}`}>{label}</span>
      </div>
      
      {/* Container for the bar */}
      <div className="relative h-8 w-full bg-slate-900 border-4 border-slate-600 p-1">
        {/* The Bar */}
        <div 
          className={`h-full transition-all duration-1000 ease-out ${barColor}`}
          style={{ width: `${percentage}%` }}
        >
          {/* Highlights/Shine for pseudo-3D effect */}
          <div className="w-full h-1/2 bg-white/30"></div>
        </div>
        
        {/* Grid lines over the bar */}
        <div className="absolute top-0 left-0 w-full h-full grid grid-cols-10 pointer-events-none">
          {[...Array(10)].map((_, i) => (
             <div key={i} className="border-r border-black/20 h-full"></div>
          ))}
        </div>
      </div>
      
      {/* Score Display */}
      <div className="flex justify-end mt-1">
         <span className="text-[10px] text-slate-500">RISK_SCORE: {score}/10</span>
      </div>
    </div>
  );
};

export default RiskGauge;