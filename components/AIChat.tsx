
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
    { role: 'model', text: `Olá ${user.name.split(' ')[0]}! Sou o assistente inteligente do VeroPonto. Posso te ajudar a gerenciar sua equipe ou localizar endereços usando Google Maps. Como posso ajudar?` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fix: Directly check process.env.API_KEY without exposing key management to the user
  const isApiKeyMissing = !process.env.API_KEY || process.env.API_KEY === "" || process.env.API_KEY === "undefined";

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
        { timeout: 10000, enableHighAccuracy: false }
      );
    }
  }, [isOpen]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    
    if (isApiKeyMissing) {
      setMessages(prev => [...prev, { role: 'model', text: "Erro: Chave de API não detectada no ambiente. Entre em contato com o suporte." }]);
      return;
    }

    const userMessage = input.trim();
    setInput('');
    const newHistory = [...messages, { role: 'user', text: userMessage } as Message];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      // Fix: Use process.env.API_KEY directly for initialization as per SDK guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      // Filtra histórico para garantir que a primeira mensagem seja do usuário (exigência da API)
      const apiContents = newHistory
        .filter((m, idx) => !(idx === 0 && m.role === 'model')) 
        .map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }));

      if (apiContents.length === 0 || apiContents[0].role !== 'user') {
          apiContents.unshift({ role: 'user', parts: [{ text: userMessage }] });
      }

      const response = await ai.models.generateContent({
        // Fix: Changed model to 'gemini-flash-latest' (2.5 series) to support the googleMaps tool
        model: 'gemini-flash-latest',
        contents: apiContents,
        config: {
          systemInstruction: `Você é o "VeroPonto AI", assistente oficial do sistema VeroPonto.
          CONTEXTO:
          - Usuário atual: ${user.name} (${user.role})
          - Workspace: ${user.workspaceId}
          - Comportamento: Profissional, prestativo e focado em RH, gestão de ponto e localização de unidades.
          - Ferramentas: Use Google Maps para encontrar endereços ou empresas se solicitado.`,
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

      // Fix: Correctly access .text property from GenerateContentResponse
      const responseText = response.text || "Entendido. Como posso ajudar mais?";
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const links = groundingChunks
        .map((chunk: any) => {
          if (chunk.maps) return { title: chunk.maps.title || "Ver no Maps", uri: chunk.maps.uri };
          if (chunk.web) return { title: chunk.web.title || "Ver site", uri: chunk.web.uri };
          return null;
        })
        .filter(Boolean) as { title: string; uri: string }[];

      setMessages(prev => [...prev, { role: 'model', text: responseText, links: links.length > 0 ? links : undefined }]);
    } catch (error: any) {
      console.error("AI Error:", error);
      let errorMsg = "Ocorreu um erro ao processar sua solicitação. Verifique se sua chave de API do Gemini está ativa.";
      if (error.message?.includes("API_KEY_INVALID")) errorMsg = "Chave de API inválida.";
      
      setMessages(prev => [...prev, { role: 'model', text: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[500] flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-[calc(100vw-2rem)] sm:w-[400px] h-[calc(100dvh-10rem)] sm:h-[550px] bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-white/5 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className={`p-6 flex justify-between items-center shrink-0 ${isPro ? 'bg-gradient-to-r from-slate-900 to-indigo-950 text-white' : 'bg-slate-900 text-white'}`}>
            <div className="flex items-center gap-3">
              <div className={`${isPro ? 'bg-amber-500' : 'bg-indigo-600'} p-2 rounded-xl shadow-lg`}>
                <Sparkles size={20} className={isPro ? 'text-slate-900' : 'text-white'} />
              </div>
              <div>
                <h3 className="font-black text-sm tracking-tight">VeroPonto AI</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-70">Inteligência Ativa</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition">
              <X size={20} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 dark:bg-slate-950/20 custom-scrollbar">
            {isApiKeyMissing && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="text-red-600 shrink-0" size={16} />
                <p className="text-[10px] font-bold text-red-800 dark:text-red-400 uppercase tracking-wider">
                  Configuração: Variável API_KEY não configurada no ambiente.
                </p>
              </div>
            )}
            
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1`}>
                <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`p-4 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? (isPro ? 'bg-amber-500 text-slate-900' : 'bg-indigo-600 text-white') 
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-white/5'
                  } ${msg.role === 'user' ? 'rounded-tr-none' : 'rounded-tl-none'}`}>
                    {msg.text}
                    {msg.links && msg.links.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/10 space-y-2">
                        {msg.links.map((link, idx) => (
                          <a key={idx} href={link.uri} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all text-indigo-600 dark:text-indigo-400 font-bold text-[10px]">
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
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm flex items-center gap-3">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Analisando</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/5 shrink-0">
            <form onSubmit={handleSendMessage} className="relative">
              <input 
                disabled={isApiKeyMissing || isLoading}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isApiKeyMissing ? "Erro de Configuração" : "Escreva sua dúvida..."}
                className="w-full pl-5 pr-14 py-4 bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-white/10 border rounded-2xl text-xs font-bold text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
              <button disabled={isLoading || !input.trim() || isApiKeyMissing} className={`absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-xl shadow-lg transition-all ${isPro ? 'bg-amber-500 text-slate-900' : 'bg-indigo-600 text-white'} disabled:opacity-50`}>
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      <button onClick={() => setIsOpen(!isOpen)} className={`w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-300 active:scale-90 ${isOpen ? 'bg-slate-900 text-white rotate-90' : (isPro ? 'bg-amber-500 text-slate-900' : 'bg-indigo-600 text-white')}`}>
        {isOpen ? <X size={24} /> : <Sparkles size={24} className="animate-pulse" />}
      </button>
    </div>
  );
};

export default AIChat;
