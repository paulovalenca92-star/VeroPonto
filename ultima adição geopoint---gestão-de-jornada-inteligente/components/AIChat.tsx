
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Sparkles, X, Send, Loader2, Bot, User as UserIcon, Zap, AlertTriangle, MessageSquare } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { User } from '../types';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface AIChatProps {
  user: User;
  isPro?: boolean;
}

const AIChat: React.FC<AIChatProps> = ({ user, isPro }) => {
  const ASSISTANT_NAME = "Lux";
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: `Olá ${user.name.split(' ')[0]}! Eu sou a ${ASSISTANT_NAME}, sua assistente inteligente. Como posso ajudar com sua jornada hoje?` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [apiKeyError, setApiKeyError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isTyping]);

  useEffect(() => {
    const key = process.env.API_KEY;
    const isInvalid = !key || key === 'undefined' || key === 'null' || key.trim().length < 10;
    setApiKeyError(isInvalid);
  }, [isOpen]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping || apiKeyError) return;

    const userMessage = input.trim();
    setInput('');
    
    const updatedHistory = [...messages, { role: 'user', text: userMessage } as Message];
    setMessages(updatedHistory);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const chatContents = updatedHistory
        .filter((m, i) => !(i === 0 && m.role === 'model'))
        .map(m => ({ 
          role: m.role, 
          parts: [{ text: m.text }] 
        }));

      const result = await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: chatContents,
        config: {
          systemInstruction: `Você é a "${ASSISTANT_NAME}", uma assistente virtual inteligente e prestativa do GeoPoint.
          Usuário atual: ${user.name} (${user.role === 'admin' ? 'Gestor' : 'Colaborador'}).
          Responda de forma concisa e amigável.`,
          temperature: 0.7,
        },
      });

      setMessages(prev => [...prev, { role: 'model', text: '' }]);
      let fullText = "";
      
      for await (const chunk of result) {
        const chunkText = chunk.text;
        if (chunkText) {
          fullText += chunkText;
          setMessages(prev => {
            const newMsgs = [...prev];
            newMsgs[newMsgs.length - 1] = { role: 'model', text: fullText };
            return newMsgs;
          });
        }
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'model', text: "Ops! Tive um probleminha de conexão. Pode tentar de novo?" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[5000] flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-[calc(100vw-2rem)] sm:w-[400px] h-[calc(100dvh-12rem)] sm:h-[580px] bg-white dark:bg-[#050505] rounded-[3.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.6)] border border-slate-100 dark:border-white/10 flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
          
          <div className="p-8 flex justify-between items-center shrink-0 bg-gradient-to-br from-slate-900 to-black text-white relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-600"></div>
            <div className="flex items-center gap-4">
              <div className="bg-amber-500 p-2.5 rounded-2xl shadow-xl shadow-amber-500/20 relative group">
                <Bot size={22} className="text-white group-hover:rotate-12 transition-transform" />
                {!apiKeyError && <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-black animate-pulse"></span>}
              </div>
              <div>
                <h3 className="font-black text-sm tracking-tight">{ASSISTANT_NAME} AI</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                   <div className={`w-1.5 h-1.5 rounded-full ${apiKeyError ? 'bg-red-500' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}></div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                     {apiKeyError ? 'Serviço Offline' : 'Assistente Ativa'}
                   </p>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5">
              <X size={20} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-slate-50/30 dark:bg-transparent">
            {apiKeyError && (
              <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-[2rem] flex flex-col items-center text-center gap-3 animate-pulse">
                <AlertTriangle size={32} className="text-red-500/50" />
                <div>
                  <p className="text-[10px] font-black uppercase text-red-500 tracking-wider">Aguardando Configuração</p>
                  <p className="text-[9px] text-slate-500 font-medium mt-2 leading-relaxed">A Lux precisa da API_KEY configurada no Cloudflare para ganhar vida. <br/><b>Lembre-se de fazer o Deploy novamente!</b></p>
                </div>
              </div>
            )}
            
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${
                  msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-white/10 text-amber-500 border border-slate-100 dark:border-white/5'
                }`}>
                  {msg.role === 'user' ? <UserIcon size={18} /> : <Sparkles size={18} />}
                </div>
                <div className={`max-w-[85%] p-5 rounded-[2rem] text-sm font-medium leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-200/50 dark:border-white/10'
                }`}>
                  {msg.text}
                  {isTyping && i === messages.length - 1 && !msg.text && (
                    <div className="flex gap-1.5 py-1 text-amber-500">
                      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 bg-white dark:bg-[#0a0a0a] border-t border-slate-100 dark:border-white/10">
            <form onSubmit={handleSendMessage} className="relative group">
              <input 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                disabled={apiKeyError}
                placeholder={apiKeyError ? "API Offline (Aguardando Redeploy)" : "Pergunte algo para a Lux..."} 
                className="w-full pl-6 pr-16 py-5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2rem] text-xs font-bold outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/30 transition-all dark:text-white disabled:opacity-50"
              />
              <button 
                disabled={isTyping || !input.trim() || apiKeyError} 
                className="absolute right-2 top-1/2 -translate-y-1/2 p-3.5 bg-amber-500 text-white rounded-[1.4rem] shadow-xl shadow-amber-500/20 disabled:opacity-0 transition-all hover:scale-105 active:scale-95"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={`w-18 h-18 rounded-[2rem] shadow-2xl flex items-center justify-center transition-all duration-500 hover:scale-110 border-4 border-white dark:border-[#050505] group overflow-hidden ${
          isOpen ? 'bg-slate-900 text-white rotate-90' : 'bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-amber-500/40'
        }`}
      >
        <div className="relative">
          {isOpen ? <X size={32} /> : <Bot size={32} className="group-hover:animate-bounce" />}
          {!apiKeyError && !isOpen && <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-orange-600 animate-ping"></span>}
        </div>
      </button>
    </div>
  );
};

export default AIChat;
