
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User as UserIcon, 
  Loader2, 
  MessageSquare,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { User } from '../types';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface AIChatProps {
  user: User;
}

const AIChat: React.FC<AIChatProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: `Olá ${user.name.split(' ')[0]}! Sou o assistente do VeroPonto. Como posso ajudar você hoje com sua jornada de trabalho?` }
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
      const chat = ai.chats.create({
        model: 'gemini-3-pro-preview',
        config: {
          systemInstruction: `Você é o "VeroPonto AI", o suporte oficial do aplicativo de controle de ponto VeroPonto.
          CONTEXTO DO USUÁRIO:
          - Nome: ${user.name}
          - Cargo: ${user.role === 'admin' ? 'Administrador/Gestor' : 'Colaborador/Funcionário'}
          - ID Empresa: ${user.workspaceId}
          
          REGRAS DO SISTEMA:
          1. O VeroPonto exige Selfie e GPS para todos os registros por segurança.
          2. QR Codes são usados para validar unidades físicas.
          3. Admins gerenciam Unidades e Colaboradores.
          4. Se o usuário tiver problemas com a câmera, sugira verificar permissões do navegador.
          5. Se o GPS falhar, sugira ativar a localização de alta precisão.
          6. Mantenha as respostas curtas, profissionais e cordiais. Use emojis moderadamente.
          7. O código de convite da empresa dele é ${user.workspaceId}.`,
        },
      });

      const responseStream = await chat.sendMessageStream({ message: userMessage });
      
      let fullText = '';
      setMessages(prev => [...prev, { role: 'model', text: '' }]);

      for await (const chunk of responseStream) {
        const textChunk = chunk.text;
        fullText += textChunk;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { role: 'model', text: fullText };
          return newMessages;
        });
      }
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Desculpe, tive um problema de conexão. Poderia tentar novamente?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[500] flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[350px] sm:w-[400px] h-[500px] bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-black text-sm tracking-tight">Suporte VeroPonto</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-70">IA Online</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition">
              <X size={20} />
            </button>
          </div>

          {/* Messages Container */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 custom-scrollbar">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400'}`}>
                    {msg.role === 'user' ? <UserIcon size={14} /> : <Bot size={14} />}
                  </div>
                  <div className={`p-4 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}`}>
                    {msg.text || (isLoading && i === messages.length - 1 && <Loader2 size={14} className="animate-spin opacity-50" />)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-100">
            <form onSubmit={handleSendMessage} className="relative">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Como posso ajudar?"
                className="w-full pl-5 pr-14 py-4 bg-slate-50 border-slate-100 border rounded-2xl text-xs font-bold text-slate-800 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
              <button 
                type="submit"
                disabled={isLoading || !input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition-all"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
            <p className="text-[8px] text-center text-slate-300 font-bold uppercase tracking-widest mt-3">
              Powered by Google Gemini 3
            </p>
          </div>
        </div>
      )}

      {/* FAB Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-300 active:scale-90 ${isOpen ? 'bg-slate-900 text-white rotate-90' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-1 shadow-indigo-200'}`}
      >
        {isOpen ? <X size={24} /> : <Sparkles size={24} className="animate-pulse" />}
      </button>
    </div>
  );
};

export default AIChat;
