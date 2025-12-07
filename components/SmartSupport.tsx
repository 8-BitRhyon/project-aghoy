import React from 'react';
import { Phone, Smartphone, Building2, ChevronDown, ChevronRight } from 'lucide-react';

const SmartSupport: React.FC = () => {
  return (
    <div className="w-full font-['VT323'] mt-4">
      
      {/* Main Card */}
      <div className="bg-slate-900 border-4 border-slate-700 p-1 shadow-[4px_4px_0_0_rgba(0,0,0,0.5)]">
        
        {/* Header / Primary Hotline */}
        <div className="bg-slate-800 p-4 border-2 border-slate-600 relative overflow-hidden group hover:border-green-500 transition-colors">
          
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-green-400 font-['Press_Start_2P'] text-xs md:text-sm uppercase flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Maya Hotline
            </h3>
            {/* Pulsing Status Dot */}
            <div className="flex items-center gap-2 px-2 py-1 bg-green-900/30 border border-green-500/50 rounded-full">
              <div className="relative w-2 h-2">
                <div className="absolute w-full h-full bg-green-400 rounded-full animate-ping opacity-75"></div>
                <div className="relative w-full h-full bg-green-500 rounded-full"></div>
              </div>
              <span className="text-xs text-green-300 font-bold tracking-wider">ONLINE 8AM-7PM</span>
            </div>
          </div>

          <p className="text-slate-400 text-lg leading-tight mb-4">
            For lost phones, fraud, or unauthorized transactions.
          </p>

          {/* Primary Call Action */}
          <a href="tel:+63288457788" className="block bg-green-700 hover:bg-green-600 text-white p-3 border-b-4 border-r-4 border-green-900 active:border-0 active:translate-y-1 transition-all text-center">
             <span className="font-['Press_Start_2P'] text-sm md:text-lg flex items-center justify-center gap-3">
               (02) 8845 7788
             </span>
             <span className="block text-xs text-green-200 mt-1 font-sans opacity-80 uppercase tracking-widest">Tap to Call • Standard Rates</span>
          </a>
        </div>

        {/* Secondary Options (The Dropdown) */}
        <div className="bg-slate-950 border-t-0 border-2 border-slate-700 mt-1">
          <details className="group">
            <summary className="flex items-center justify-between p-3 cursor-pointer text-slate-400 hover:text-green-400 transition-colors list-none">
              <span className="flex items-center gap-2 text-lg uppercase tracking-wide">
                <Building2 className="w-4 h-4" />
                View Toll-Free Numbers
              </span>
              <ChevronDown className="w-5 h-5 group-open:rotate-180 transition-transform" />
            </summary>
            
            <div className="p-4 pt-0 border-t border-slate-800 grid gap-4 animate-in slide-in-from-top-2">
              
              {/* Smart/Sun Users */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-800 text-yellow-400 border border-slate-600">
                    <Smartphone className="w-5 h-5" />
                </div>
                <div>
                    <span className="block text-slate-500 text-sm uppercase font-bold">Smart / Sun / TNT</span>
                    <a href="tel:*788" className="text-xl text-white hover:text-green-400 font-bold tracking-wider">
                        *788
                    </a>
                    <span className="ml-2 px-1.5 py-0.5 bg-green-900 text-green-400 text-xs border border-green-700 rounded">FREE</span>
                </div>
              </div>

              {/* PLDT Landline */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-800 text-blue-400 border border-slate-600">
                    <Phone className="w-5 h-5" />
                </div>
                <div>
                    <span className="block text-slate-500 text-sm uppercase font-bold">PLDT Landline</span>
                    <a href="tel:1800108457788" className="text-xl text-white hover:text-blue-400 font-bold tracking-wider">
                        1-800-1084-57788
                    </a>
                     <span className="ml-2 px-1.5 py-0.5 bg-slate-800 text-slate-400 text-xs border border-slate-600 rounded">TOLL-FREE</span>
                </div>
              </div>

            </div>
          </details>
        </div>

      </div>
    </div>
  );
};

export default SmartSupport;
