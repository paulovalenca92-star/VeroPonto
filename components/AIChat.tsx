import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, X, Send, Bot, User as UserIcon, Loader2, MapPin, ExternalLink } from 'lucide-react';
import { User } from '../types';

interface Message {
  role: 'user' | 'model';
  text: string;
  links?: { title: string; uri: string }[];
}

interface AIChatProps {
  user: User;
}

const AIChat: React.FC<AIChatProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: `Olá ${user.name.split(' ')[0]}! Sou o assistente inteligente do VeroPonto. Posso te ajudar a gerenciar sua equipe ou até localizar endereços para novas unidades usando o Google Maps. Como posso ajudar?` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: messages.concat({ role: 'user', text: userMessage }).map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        })),
        config: {
          systemInstruction: `Você é o "VeroPonto AI".
          CONTEXTO:
          - Usuário: ${user.name} (${user.role})
          - Empresa: ${user.workspaceId}
          - Use Google Maps para sugerir endereços.`,
          tools: [{ googleMaps: {} }, { googleSearch: {} }],
        },
      });

      const text = response.text || "Não consegui processar essa informação agora.";
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const links = groundingChunks
        .map((chunk: any) => {
          if (chunk.maps) return { title: chunk.maps.title, uri: chunk.maps.uri };
          if (chunk.web) return { title: chunk.web.title, uri: chunk.web.uri };
          return null;
        })
        .filter(Boolean) as { title: string; uri: string }[];

      setMessages(prev => [...prev, { role: 'model', text, links: links.length > 0 ? links : undefined }]);
    } catch (error: any) {
      console.error("AI Error:", error);
      let errorMsg = "Desculpe, tive um problema técnico.";
      setMessages(prev => [...prev, { role: 'model', text: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[500] flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-[calc(100vw-3rem)] sm:w-[400px] h-[calc(100dvh-8rem)] sm:h-[550px] bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-xl">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-black text-sm tracking-tight">VeroPonto AI</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-70">Gemini 2.5 Flash</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition">
              <X size={20} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 custom-scrollbar">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`p-4 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}`}>
                    {msg.text}
                    {msg.links && msg.links.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-50 flex items-center gap-1">
                          <MapPin size={10} /> Referências:
                        </p>
                        {msg.links.map((link, idx) => (
                          <a key={idx} href={link.uri} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100 hover:bg-indigo-50 hover:border-indigo-100 transition-all text-indigo-600 font-bold text-[10px]">
                            <span className="truncate">{link.title}</span><ExternalLink size={12} />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-in fade-in">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                  <Loader2 size={16} className="animate-spin text-indigo-600" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">IA está pensando...</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-slate-100 shrink-0">
            <form onSubmit={handleSendMessage} className="relative">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="w-full pl-5 pr-14 py-4 bg-slate-50 border-slate-100 border rounded-2xl text-xs font-bold text-slate-800 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
              <button disabled={isLoading || !input.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition-all">
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      <button onClick={() => setIsOpen(!isOpen)} className={`w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-300 active:scale-90 ${isOpen ? 'bg-slate-900 text-white rotate-90' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-1 shadow-indigo-200'}`}>
        {isOpen ? <X size={24} /> : <Sparkles size={24} className="animate-pulse" />}
      </button>
    </div>
  );
};

export default AIChat;