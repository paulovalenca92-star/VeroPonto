
import { GoogleGenAI } from "@google/genai";
import { Sparkles, X, Send, Bot, User as UserIcon, Loader2, MapPin, ExternalLink, AlertTriangle } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { User } from '../types';

interface Message {
  role: 'user' | 'model';
  text: string;
  links?: { title: string; uri: string }[];
}

interface AIChatProps {
  user: User;
  isPro?: boolean;
}

const AIChat: React.FC<AIChatProps> = ({ user, isPro }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: `Olá ${user.name.split(' ')[0]}! Sou o assistente inteligente do VeroPonto. Como posso ajudar com sua gestão hoje?` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // A chave agora vem injetada via vite.config.ts
  const apiKey = process.env.API_KEY;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => console.warn("AI Geolocation error:", err),
        { timeout: 10000 }
      );
    }
  }, [isOpen]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    
    if (!apiKey) {
      setMessages(prev => [...prev, { role: 'model', text: "Erro: Chave de API não configurada corretamente." }]);
      return;
    }

    const userMessage = input.trim();
    setInput('');
    const newHistory = [...messages, { role: 'user', text: userMessage } as Message];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const apiContents = newHistory
        .filter((m, idx) => !(idx === 0 && m.role === 'model')) 
        .map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }));

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp', // Modelo otimizado e rápido
        contents: apiContents,
        config: {
          systemInstruction: `Você é o "VeroPonto AI".
          - Usuário: ${user.name} (${user.role})
          - Domínio: RH, Ponto Eletrônico, Legislação Trabalhista Brasileira.
          - Use Google Maps para localizar unidades quando solicitado.`,
          tools: [{ googleMaps: {} }, { googleSearch: {} }],
          toolConfig: userCoords ? {
            retrievalConfig: {
              latLng: {
                latitude: userCoords.latitude,
                longitude: userCoords.longitude
              }
            }
          } : undefined
        },
      });

      const responseText = response.text || "Não consegui processar essa informação agora.";
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const links = groundingChunks
        .map((chunk: any) => {
          if (chunk.maps) return { title: chunk.maps.title || "Ver no Maps", uri: chunk.maps.uri };
          if (chunk.web) return { title: chunk.web.title || "Saiba mais", uri: chunk.web.uri };
          return null;
        })
        .filter(Boolean) as { title: string; uri: string }[];

      setMessages(prev => [...prev, { role: 'model', text: responseText, links: links.length > 0 ? links : undefined }]);
    } catch (error: any) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Erro na conexão com a inteligência artificial. Verifique sua chave ou tente novamente." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[500] flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-[calc(100vw-2rem)] sm:w-[400px] h-[calc(100dvh-10rem)] sm:h-[550px] bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-white/5 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className={`p-6 flex justify-between items-center shrink-0 ${isPro ? 'bg-indigo-950 text-white' : 'bg-slate-900 text-white'}`}>
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-xl">
                <Sparkles size={20} className="text-white" />
              </div>
              <h3 className="font-black text-sm">VeroPonto AI</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition">
              <X size={20} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-xs font-medium leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none'
                }`}>
                  {msg.text}
                  {msg.links && msg.links.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {msg.links.map((link, idx) => (
                        <a key={idx} href={link.uri} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2 bg-white dark:bg-white/5 rounded-xl text-indigo-500 font-bold text-[10px]">
                          {link.title} <ExternalLink size={12} />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-indigo-600" />
                  <span className="text-[10px] font-black uppercase text-slate-400">Processando...</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-100 dark:border-white/5">
            <form onSubmit={handleSendMessage} className="relative">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pergunte algo..."
                className="w-full pl-5 pr-12 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs font-bold outline-none"
              />
              <button disabled={isLoading || !input.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg disabled:opacity-50">
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      <button onClick={() => setIsOpen(!isOpen)} className={`w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all ${isPro ? 'bg-amber-500 text-black' : 'bg-indigo-600 text-white'}`}>
        {isOpen ? <X size={24} /> : <Sparkles size={24} />}
      </button>
    </div>
  );
};

export default AIChat;
