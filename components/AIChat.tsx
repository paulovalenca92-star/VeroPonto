
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Sparkles, X, Send, Loader2, Bot, User as UserIcon, Zap, AlertTriangle } from 'lucide-react';
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
  // CONFIGURAÇÃO DO NOME DA ASSISTENTE
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
    if (!key || key === 'undefined' || key.length < 10) {
      setApiKeyError(true);
    } else {
      setApiKeyError(false);
    }
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
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      const result = await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: updatedHistory.map(m => ({ 
          role: m.role, 
          parts: [{ text: m.text }] 
        })),
        config: {
          systemInstruction: `Você é a "${ASSISTANT_NAME}", uma assistente virtual inteligente, amigável e prestativa do sistema de ponto GeoPoint.
          Seu objetivo é ajudar funcionários e gestores.
          Usuário atual: ${user.name} (${user.role === 'admin' ? 'Gestor' : 'Colaborador'}).
          
          Regras de personalidade:
          1. Identifique-se sempre como ${ASSISTANT_NAME}.
          2. Seja educada, profissional e use um tom levemente feminino e acolhedor.
          3. Responda de forma concisa.
          4. Se perguntarem sobre CLT ou leis, dê orientações gerais e recomende consultar o RH.`,
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
      console.error("Erro AI:", error);
      let errorMsg = "Ops! Tive um probleminha técnico. Pode tentar de novo?";
      if (error.message?.includes('API_KEY_INVALID')) {
        errorMsg = "Minha chave de ativação parece estar com problemas. Avise o suporte!";
      }
      setMessages(prev => [...prev, { role: 'model', text: errorMsg }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[5000] flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-[calc(100vw-2rem)] sm:w-[380px] h-[calc(100dvh-12rem)] sm:h-[520px] bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-2xl rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/20 dark:border-white/5 flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-500">
          
          <div className="p-6 flex justify-between items-center shrink-0 bg-gradient-to-r from-[#050505] to-[#1a1a1a] text-white">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-amber-400 to-yellow-600 p-2 rounded-2xl shadow-lg shadow-amber-500/20">
                <Sparkles size={18} className="text-white animate-pulse" />
              </div>
              <div>
                <h3 className="font-black text-xs uppercase tracking-widest">{ASSISTANT_NAME} AI</h3>
                <div className="flex items-center gap-1">
                   <span className={`w-1.5 h-1.5 rounded-full ${apiKeyError ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`}></span>
                   <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                     {apiKeyError ? 'Offline' : 'Online'}
                   </p>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
              <X size={18} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {apiKeyError && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex gap-3 text-red-500">
                <AlertTriangle size={20} className="shrink-0" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-tight">Configuração Necessária</p>
                  <p className="text-[9px] font-medium leading-relaxed mt-1">Adicione a variável API_KEY no Netlify para que eu possa falar com você!</p>
                </div>
              </div>
            )}
            
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center shadow-sm ${
                  msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-amber-500 text-white'
                }`}>
                  {msg.role === 'user' ? <UserIcon size={14} /> : <Bot size={14} />}
                </div>
                <div className={`max-w-[80%] p-4 rounded-3xl text-xs font-medium leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-200/50 dark:border-white/5'
                }`}>
                  {msg.text || (isTyping && i === messages.length - 1 ? (
                    <div className="flex gap-1 py-1 text-amber-500">
                      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  ) : msg.text)}
                </div>
              </div>
            ))}
          </div>

          <div className="p-5 bg-slate-50/50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5">
            <form onSubmit={handleSendMessage} className="relative group">
              <input 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                disabled={apiKeyError}
                placeholder={apiKeyError ? "IA Desativada..." : `Falar com ${ASSISTANT_NAME}...`} 
                className="w-full pl-5 pr-14 py-4 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-[1.8rem] text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500/50 transition-all dark:text-white disabled:opacity-50"
              />
              <button 
                disabled={isTyping || !input.trim() || apiKeyError} 
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-gradient-to-br from-amber-400 to-orange-600 text-white rounded-2xl shadow-lg disabled:opacity-30 transition-all hover:scale-105"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      <button onClick={() => setIsOpen(!isOpen)} className={`w-16 h-16 rounded-[1.8rem] shadow-xl flex items-center justify-center transition-all duration-500 hover:scale-110 border-4 border-white dark:border-[#050505] ${isOpen ? 'bg-slate-900 text-white' : 'bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-amber-500/20 shadow-2xl'}`}>
        {isOpen ? <X size={28} /> : <Bot size={28} />}
      </button>
    </div>
  );
};

export default AIChat;
