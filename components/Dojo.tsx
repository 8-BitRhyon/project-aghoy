import React, { useState, useEffect, useRef } from 'react';
import { createDojoChat } from '../services/aiService';
import { Send, RefreshCw, Trophy, HelpCircle, AlertCircle, Skull, ShieldAlert, Smartphone, WifiOff, Zap } from 'lucide-react';
import { playSound } from '../utils/sound';

interface DojoProps {
  selectedLanguage: string;
}

const Dojo: React.FC<DojoProps> = ({ selectedLanguage }) => {
  const [chatSession, setChatSession] = useState<any | null>(null);
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [gameStatus, setGameStatus] = useState<'active' | 'won' | 'lost' | 'error'>('active');
  const [errorMessage, setErrorMessage] = useState('');
  const [errorTitle, setErrorTitle] = useState('CONNECTION LOST');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleError = (error: any) => {
    console.error("Dojo Error Debug:", error);
    setGameStatus('error');
    const errString = error?.message || error?.toString() || JSON.stringify(error) || "";
    
    if (errString.includes("429") || errString.toLowerCase().includes("quota")) {
       setErrorTitle("SYSTEM OVERLOAD");
       setErrorMessage("Daily AI Quota Exceeded. Please try again tomorrow.");
    } else if (errString.toLowerCase().includes("network") || errString.toLowerCase().includes("fetch")) {
       setErrorTitle("CONNECTION ERROR");
       setErrorMessage("Unable to reach AI servers. Check your internet.");
    } else {
       setErrorTitle("SYSTEM FAILURE");
       setErrorMessage("An unexpected error occurred.");
    }
    playSound('alert');
  };

  const startNewGame = async () => {
    playSound('click'); 
    setIsLoading(true);
    setMessages([]);
    setGameStatus('active');
    setErrorMessage('');
    
    try {
      // 1. Initialize the new Secure Chat
      const chat = createDojoChat(selectedLanguage);
      setChatSession(chat);
      
      // 2. Send plain text string
      const result = await chat.sendMessage("Start simulation.");
      
      // 3. Read text from the new response format
      const text = result.response.text();
      setMessages([{ role: 'model', text: text || "Hello!" }]);
      playSound('scan');
    } catch (error: any) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    startNewGame();
  }, [selectedLanguage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || !chatSession || isLoading || gameStatus !== 'active') return;
    
    playSound('typing');
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      // 4. Send plain text string
      const result = await chatSession.sendMessage(userMsg);
      const responseText = result.response.text() || "...";
      
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
      
      if (responseText.includes("GAME OVER") || responseText.includes("Nahuli mo")) {
        playSound('success');
        setGameStatus('won');
      } else if (responseText.includes("FAILURE") || responseText.includes("Huli ka") || responseText.includes("Naloko")) {
         playSound('alert');
         setGameStatus('lost');
      } else {
         playSound('hover');
      }

    } catch (error: any) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getContainerBorder = () => {
    if (gameStatus === 'won') return 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)]';
    if (gameStatus === 'lost') return 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]';
    if (gameStatus === 'error') return 'border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.5)]';
    return 'border-slate-600 shadow-[10px_10px_0_0_rgba(0,0,0,0.5)]';
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
        <div className="mb-6 border-4 border-yellow-600 bg-yellow-900/20 p-4 pixel-corners-sm animate-fade-in font-['VT323']">
            <div className="flex items-start gap-4">
                <div className="p-2 bg-yellow-600 text-black shrink-0 border-2 border-yellow-400 hidden md:block">
                    <HelpCircle className="w-8 h-8" />
                </div>
                <div>
                    <h3 className="text-yellow-500 font-bold text-lg md:text-xl font-['Press_Start_2P'] mb-3 uppercase flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 md:hidden" />
                        Mission Briefing
                    </h3>
                    <ul className="text-yellow-100/90 space-y-2 text-lg md:text-xl list-disc list-inside">
                        <li><strong className="text-white">OBJECTIVE:</strong> The AI will pretend to be a scammer in <span className="text-cyan-400 font-bold">{selectedLanguage}</span>.</li>
                        <li><strong className="text-white">ACTION:</strong> Reply to uncover their lies. Don't give info!</li>
                        <li><strong className="text-white">WIN:</strong> Type <span className="bg-red-900/50 px-2 py-0.5 border border-red-500 text-red-300">BLOCK</span> or <span className="bg-red-900/50 px-2 py-0.5 border border-red-500 text-red-300">SCAM</span> when you catch them.</li>
                    </ul>
                </div>
            </div>
        </div>

        <div className={`bg-slate-900 border-4 transition-all duration-500 ${getContainerBorder()}`}>
            <div className={`p-4 border-b-4 border-slate-700 flex justify-between items-center transition-colors duration-500 ${
                gameStatus === 'won' ? 'bg-green-900' : 
                gameStatus === 'lost' ? 'bg-red-900' : 
                gameStatus === 'error' ? 'bg-orange-900' :
                'bg-indigo-900'
            }`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-800 border-2 border-white flex items-center justify-center relative">
                        {gameStatus === 'won' ? (
                            <Trophy className="w-6 h-6 text-yellow-400" />
                        ) : gameStatus === 'lost' ? (
                            <Skull className="w-6 h-6 text-red-500" />
                        ) : gameStatus === 'error' ? (
                            <Zap className="w-6 h-6 text-orange-500" />
                        ) : (
                            <Smartphone className="w-6 h-6 text-white" />
                        )}
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 border border-white ${
                            gameStatus === 'active' ? 'bg-green-500 animate-pulse' : 'bg-slate-500'
                        }`}></div>
                    </div>
                    <div>
                        <h2 className="text-lg md:text-xl font-['Press_Start_2P'] text-white">
                            {gameStatus === 'won' ? 'MISSION SUCCESS' : 
                             gameStatus === 'lost' ? 'SYSTEM BREACHED' : 
                             gameStatus === 'error' ? 'SYSTEM FAULT' :
                             'AGHOY DOJO'}
                        </h2>
                        <p className="text-slate-200 uppercase text-xs md:text-sm font-['VT323']">
                            Status: {gameStatus === 'active' ? 'LIVE CONNECTION...' : gameStatus.toUpperCase()}
                        </p>
                    </div>
                </div>
                <button 
                    onClick={startNewGame}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-white border-2 border-slate-500 transition-colors"
                    title="Reset Simulation"
                >
                    <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="h-[500px] bg-slate-950 relative overflow-hidden flex flex-col">
                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] z-20 bg-[length:100%_4px] opacity-10"></div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10 font-sans custom-scrollbar">
                    <div className="text-center py-2">
                        <span className="bg-slate-800/80 text-slate-400 text-xs px-3 py-1 rounded-full">
                            Encrypted Conversation • {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                    </div>

                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`relative max-w-[80%] p-3 md:p-4 text-sm md:text-base shadow-sm leading-relaxed ${
                                msg.role === 'user' 
                                ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm' 
                                : 'bg-slate-800 text-slate-200 rounded-2xl rounded-tl-sm border border-slate-700'
                            }`}>
                                {msg.role === 'model' && (
                                    <span className="block text-[10px] text-slate-400 mb-1 uppercase font-bold tracking-wider">
                                        {gameStatus !== 'active' && idx === messages.length - 1 ? 'SYSTEM' : 'Unknown Sender'}
                                    </span>
                                )}
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    
                    {isLoading && (
                        <div className="flex justify-start animate-fade-in">
                            <div className="bg-slate-800 border border-slate-700 text-slate-300 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1 items-center h-10">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                            </div>
                        </div>
                    )}

                    {gameStatus === 'error' && (
                        <div className="my-4 mx-auto max-w-[90%] animate-fade-in font-['VT323']">
                             <div className="bg-orange-950/95 border-4 border-orange-500 p-6 text-center shadow-[0_0_30px_rgba(249,115,22,0.3)] backdrop-blur-sm rounded-lg">
                                <WifiOff className="w-12 h-12 text-orange-200 mx-auto mb-2 drop-shadow-[0_2px_0_rgba(0,0,0,0.5)]" />
                                <h3 className="text-xl md:text-2xl font-['Press_Start_2P'] text-white mb-2 text-shadow-retro uppercase">
                                    {errorTitle}
                                </h3>
                                <p className="text-orange-200 text-lg mb-4">{errorMessage}</p>
                                <button 
                                    onClick={startNewGame} 
                                    className="px-4 py-2 bg-white text-orange-900 font-bold text-lg border-b-4 border-orange-700 active:border-b-0 active:translate-y-1 hover:bg-orange-100 transition-all font-['Press_Start_2P']"
                                >
                                    RETRY CONNECTION &gt;
                                </button>
                             </div>
                        </div>
                    )}

                    {gameStatus === 'won' && (
                        <div className="my-4 mx-auto max-w-[90%] animate-fade-in font-['VT323']">
                             <div className="bg-green-900/95 border-4 border-green-500 p-6 text-center shadow-[0_0_30px_rgba(34,197,94,0.3)] backdrop-blur-sm rounded-lg">
                                <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-2 drop-shadow-[0_2px_0_rgba(0,0,0,0.5)]" />
                                <h3 className="text-xl md:text-2xl font-['Press_Start_2P'] text-white mb-2 text-shadow-retro">YOU WON!</h3>
                                <p className="text-green-200 text-lg mb-4">Threat neutralized. You successfully identified the red flags.</p>
                                <button onClick={startNewGame} className="px-4 py-2 bg-white text-green-900 font-bold text-lg border-b-4 border-green-700 active:border-b-0 active:translate-y-1 hover:bg-green-100 transition-all font-['Press_Start_2P']">NEXT_LEVEL &gt;</button>
                             </div>
                        </div>
                    )}
                    {gameStatus === 'lost' && (
                        <div className="my-4 mx-auto max-w-[90%] animate-fade-in font-['VT323']">
                             <div className="bg-red-900/95 border-4 border-red-500 p-6 text-center shadow-[0_0_30px_rgba(239,68,68,0.3)] backdrop-blur-sm rounded-lg">
                                <ShieldAlert className="w-12 h-12 text-red-200 mx-auto mb-2 drop-shadow-[0_2px_0_rgba(0,0,0,0.5)] animate-pulse" />
                                <h3 className="text-xl md:text-2xl font-['Press_Start_2P'] text-white mb-2 text-shadow-retro">FAILURE</h3>
                                <p className="text-red-200 text-lg mb-4">You provided sensitive info or agreed to the scam.</p>
                                <button onClick={startNewGame} className="px-4 py-2 bg-white text-red-900 font-bold text-lg border-b-4 border-red-700 active:border-b-0 active:translate-y-1 hover:bg-red-100 transition-all font-['Press_Start_2P']">TRY_AGAIN &gt;</button>
                             </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="p-3 md:p-4 bg-slate-900 border-t-4 border-slate-700 flex gap-2">
                {gameStatus === 'active' ? (
                    <>
                        <input 
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Message..."
                            className="flex-1 bg-slate-800 text-white border border-slate-600 rounded-full px-4 py-3 font-sans text-base focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-500"
                            disabled={isLoading}
                            autoFocus
                        />
                        <button 
                            onClick={handleSend}
                            disabled={isLoading}
                            className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-full shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center w-12 h-12 shrink-0"
                        >
                            {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
                        </button>
                    </>
                ) : (
                    <button 
                        onClick={startNewGame}
                        className={`w-full py-3 font-['Press_Start_2P'] text-white border-b-4 active:border-b-0 active:translate-y-1 transition-all text-sm md:text-base ${
                            gameStatus === 'won' ? 'bg-green-600 border-green-800 hover:bg-green-500' : 
                            gameStatus === 'lost' ? 'bg-red-600 border-red-800 hover:bg-red-500' :
                            'bg-orange-600 border-orange-800 hover:bg-orange-500'
                        }`}
                    >
                        {gameStatus === 'won' ? 'START NEW SCENARIO' : gameStatus === 'error' ? 'RETRY CONNECTION' : 'RETRY SIMULATION'}
                    </button>
                )}
            </div>
        </div>
    </div>
  );
};

export default Dojo;