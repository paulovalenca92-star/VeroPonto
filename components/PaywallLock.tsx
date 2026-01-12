
import React, { useEffect, useState } from 'react';
import { Lock, Sparkles, CreditCard, ShieldCheck, Check, Star, CalendarX } from 'lucide-react';
import { User } from '../types';

// ============================================================================
// LINKS DE PAGAMENTO (PRODUÇÃO)
// ============================================================================
const LINK_MENSAL = "https://pag.ae/81pcDD-S4"; 
const LINK_ANUAL = "https://pag.ae/81pcVw-Vp";
// ============================================================================

interface PaywallLockProps {
  user: User;
  isPro: boolean;
}

const PaywallLock: React.FC<PaywallLockProps> = ({ user, isPro }) => {
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    // Regra de Ouro: Se é PRO, nunca bloqueia.
    if (isPro) {
      setIsLocked(false);
      return;
    }

    // Regra de Trial: 30 dias a partir do createdAt
    const now = Date.now();
    const creationDate = user.createdAt;
    const trialDurationMs = 30 * 24 * 60 * 60 * 1000;
    const expirationDate = creationDate + trialDurationMs;

    if (now > expirationDate) {
      setIsLocked(true);
    } else {
      setIsLocked(false);
    }
  }, [isPro, user.createdAt]);

  if (!isLocked) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#050505]/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-1000">
      <div className="bg-[#0a0f1a] w-full max-w-[400px] rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden relative flex flex-col max-h-[90vh]">
        
        <div className="bg-gradient-to-b from-[#111827] to-[#0a0f1a] p-8 pb-4 text-center border-b border-white/5 relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-orange-500 to-red-600"></div>
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                <CalendarX size={28} className="text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">Período de Teste Encerrado</h2>
            <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-widest">Escolha um plano para continuar gerenciando</p>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
            
            <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-[1.8rem] opacity-75 blur-sm group-hover:opacity-100 transition duration-1000"></div>
                <div className="relative bg-[#131b2e] rounded-[1.7rem] p-5 border border-amber-500/50 flex flex-col gap-3">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-black text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                        <Star size={10} fill="currentColor" /> Recomendado
                    </div>
                    
                    <div className="flex justify-between items-center mt-2">
                        <div>
                            <h3 className="text-white font-black text-lg">Anual</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">Economize 6%</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-slate-400 text-[10px] line-through font-bold">R$ 598,80</p>
                            <p className="text-2xl font-black text-amber-400 tracking-tighter">R$ 562,80</p>
                            <p className="text-[9px] text-slate-400 uppercase font-bold">/ano</p>
                        </div>
                    </div>

                    <a 
                      href={LINK_ANUAL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-4 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-black rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                       Assinar Anual <Sparkles size={14} fill="black" />
                    </a>
                </div>
            </div>

            <div className="bg-white/5 rounded-[1.7rem] p-5 border border-white/5 hover:border-white/10 transition-all flex flex-col gap-3">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-white font-black text-lg">Mensal</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Flexibilidade Total</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-black text-white tracking-tighter">R$ 49,90</p>
                        <p className="text-[9px] text-slate-400 uppercase font-bold">/mês</p>
                    </div>
                </div>

                <a 
                  href={LINK_MENSAL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl font-black text-xs uppercase tracking-widest active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                   Assinar Mensal
                </a>
            </div>

            <div className="pt-2 text-center border-t border-white/5 mt-4">
                <p className="text-[9px] text-slate-500 font-medium flex items-center justify-center gap-1.5">
                  <ShieldCheck size={12} className="text-emerald-500" /> Compra segura via PagBank
                </p>
            </div>
        </div>

      </div>
    </div>
  );
};

export default PaywallLock;
