
import React, { useState, useEffect } from 'react';
import { AuthState, User } from './types';
import { StorageService, supabase } from './services/storage';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import AIChat from './components/AIChat';
import InstallPrompt from './components/InstallPrompt';
import PaywallLock from './components/PaywallLock';
import { 
  LogOut, 
  Fingerprint, 
  Loader2, 
  Settings, 
  X, 
  Moon, 
  Sun, 
  Check,
  Zap,
  ChevronRight,
  ArrowLeft,
  Star,
  Sparkles,
  Crown,
  CheckCircle2,
  CalendarDays,
  Rocket,
  RefreshCw
} from 'lucide-react';

const LINK_MENSAL_PROD = "https://pag.ae/81pcDD-S4";
const LINK_ANUAL_PROD = "https://pag.ae/81pcVw-Vp";

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true
  });

  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'general' | 'billing' | 'plans'>('general');
  const [isPro, setIsPro] = useState(false);
  const [isTrial, setIsTrial] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [showProAlert, setShowProAlert] = useState(false);
  const [swUpdate, setSwUpdate] = useState<ServiceWorkerRegistration | null>(null);
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return localStorage.getItem('theme') as 'light' | 'dark' || 'light';
  });

  useEffect(() => {
    checkSession();
    
    // Listener para atualização do PWA
    const handleSWUpdate = (e: any) => setSwUpdate(e.detail);
    window.addEventListener('sw-update-available', handleSWUpdate);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setAuth({ user: null, isAuthenticated: false, loading: false });
        setIsPro(false);
        setIsTrial(false);
      }
    });
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('sw-update-available', handleSWUpdate);
    };
  }, []);

  useEffect(() => {
    if (!auth.user?.id || auth.user.role !== 'admin') return;
    const channel = supabase
      .channel(`profile_updates_${auth.user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${auth.user.id}` }, (payload) => {
          const newUser = payload.new as any;
          if (newUser.is_premium === true && auth.user?.role === 'admin' && !isPro) {
            setIsPro(true);
            setIsTrial(false);
            setAuth(prev => ({
              ...prev,
              user: prev.user ? { 
                ...prev.user, 
                isPremium: true, 
                planType: newUser.plan_type,
                premiumUntil: newUser.premium_until ? new Date(newUser.premium_until).getTime() : null
              } : null
            }));
            setShowProAlert(true);
            setShowSettings(false);
          }
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [auth.user?.id, auth.user?.role, isPro]);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) await fetchProfile(session.user.id);
    else setAuth(prev => ({ ...prev, loading: false }));
  };

  const fetchProfile = async (userId: string, retryCount = 0) => {
    try {
      const profile = await StorageService.getProfile(userId);
      if (profile) {
        setAuth({ user: profile, isAuthenticated: true, loading: false });
        const now = Date.now();
        const trialDays = 30;
        const creationDate = profile.createdAt;
        const remaining = Math.max(0, trialDays - Math.floor((now - creationDate) / (1000 * 60 * 60 * 24)));
        if (profile.isPremium === true && profile.role === 'admin') {
           setIsPro(true);
           setIsTrial(false);
        } else if (profile.role === 'admin') {
           setIsPro(false);
           setIsTrial(remaining > 0);
           setDaysRemaining(remaining);
        } else {
           setIsPro(false);
           setIsTrial(false);
        }
      } else if (retryCount < 3) {
        setTimeout(() => fetchProfile(userId, retryCount + 1), 1000);
      } else {
        setAuth({ user: null, isAuthenticated: false, loading: false });
      }
    } catch (err) {
      setAuth({ user: null, isAuthenticated: false, loading: false });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsPro(false);
    setIsTrial(false);
  };

  const updatePWA = () => {
    if (swUpdate && swUpdate.waiting) {
      swUpdate.waiting.postMessage('SKIP_WAITING');
      swUpdate.waiting.addEventListener('statechange', (e: any) => {
        if (e.target.state === 'activated') {
          window.location.reload();
        }
      });
    }
  };

  if (auth.loading) {
    return (
      <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex items-center justify-center transition-colors">
        <Loader2 size={40} className="text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!auth.isAuthenticated || !auth.user) {
    return (
      <>
        <Login onLoginSuccess={checkSession} />
        <InstallPrompt />
      </>
    );
  }

  return (
    <div className={`min-h-[100dvh] transition-colors ${theme === 'dark' ? 'bg-[#0a0f1a] text-slate-100' : 'bg-[#f8fafc] text-slate-900'}`}>
      
      {/* PWA UPDATE TOAST */}
      {swUpdate && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-sm animate-in slide-in-from-top-4 duration-500">
          <div className="bg-indigo-600 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 border border-white/20">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-white/10 rounded-xl"><RefreshCw className="animate-spin" size={20} /></div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest">Nova versão disponível</p>
                  <p className="text-xs font-bold opacity-80">Atualize para as melhorias mais recentes.</p>
               </div>
             </div>
             <button onClick={updatePWA} className="px-4 py-2 bg-white text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform active:scale-95 whitespace-nowrap">
                Atualizar
             </button>
          </div>
        </div>
      )}

      {showProAlert && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-300">
           <div className="bg-[#0a0f1a] p-8 rounded-[2.5rem] border border-amber-500/50 text-center max-w-sm w-full relative overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.3)]">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 animate-pulse"></div>
              <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/20">
                <Crown size={40} className="text-amber-500" fill="currentColor" />
              </div>
              <h2 className="text-3xl font-black text-white tracking-tight mb-2">Parabéns!</h2>
              <p className="text-amber-400 font-bold uppercase tracking-widest text-xs mb-6">Sua conta PRO foi ativada com sucesso!</p>
              <p className="text-slate-400 text-sm mb-8">Todos os recursos premium foram desbloqueados para sua empresa.</p>
              <button onClick={() => setShowProAlert(false)} className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:scale-[1.02] transition-transform shadow-lg">Acessar Dashboard PRO</button>
           </div>
        </div>
      )}

      <header className={`${theme === 'dark' ? 'bg-[#111827]/80 border-slate-800' : 'bg-white/80 border-slate-100'} backdrop-blur-md sticky top-0 z-40 border-b safe-top`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className={`${isPro ? 'bg-gradient-to-br from-amber-400 to-orange-600 shadow-amber-500/20' : isTrial ? 'bg-indigo-600 shadow-indigo-200' : 'bg-slate-400'} p-2.5 rounded-2xl shadow-lg transition-all`}>
                {isPro ? <Crown className="text-white" size={20} /> : <Fingerprint className="text-white" size={20} />}
             </div>
             <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black tracking-tighter leading-none flex items-center gap-1">VeroPonto {isPro && <span className="text-amber-500 flex items-center gap-0.5"><Star size={12} fill="currentColor"/>PRO</span>}</h1>
                  {!isPro && auth.user.role === 'admin' && (
                    <button onClick={() => { setSettingsTab('plans'); setShowSettings(true); }} className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-black text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg hover:scale-105 transition-all flex items-center gap-1.5">Upgrade PRO 🚀</button>
                  )}
                </div>
                {isPro ? (
                  <span className="text-[9px] font-black uppercase text-amber-500 tracking-widest mt-1 flex items-center gap-1"><CheckCircle2 size={10} /> PRO EDITION</span>
                ) : isTrial ? (
                  <span className="text-[9px] font-black uppercase text-indigo-500 tracking-widest mt-1 flex items-center gap-1"><CalendarDays size={10} /> PERÍODO DE TESTE ({daysRemaining}d)</span>
                ) : auth.user.role === 'admin' ? (
                  <span className="text-[9px] font-black uppercase text-red-500 tracking-widest mt-1">TESTE EXPIRADO</span>
                ) : (
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest mt-1">SISTEMA ATIVO</span>
                )}
             </div>
             <button onClick={() => { setSettingsTab('general'); setShowSettings(true); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400 transition-all hover:rotate-45 ml-2"><Settings size={18} /></button>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
                <p className="text-sm font-black">{auth.user.name}</p>
                <p className={`text-[10px] font-bold uppercase tracking-widest flex items-center justify-end gap-1 ${isPro ? 'text-amber-500' : 'text-slate-400'}`}>{isPro ? <Crown size={10} fill="currentColor" /> : isTrial ? <Sparkles size={10} /> : <Check size={10} />}{isPro ? 'CONTA PLUS' : isTrial ? 'BETA TEST' : 'CONTA GRÁTIS'}</p>
             </div>
             <button onClick={handleLogout} className="p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl text-slate-400 hover:text-red-500 transition-colors"><LogOut size={20} /></button>
          </div>
        </div>
      </header>

      {showSettings && (
        <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-[420px] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative">
            <div className="p-6 flex justify-between items-center text-white border-b border-white/5">
               <button onClick={() => settingsTab === 'general' ? setShowSettings(false) : setSettingsTab('general')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl hover:bg-white/10 transition"><ArrowLeft size={14} /> Voltar</button>
               <h3 className="font-black text-[10px] uppercase tracking-widest opacity-40">Configurações</h3>
               <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white/5 rounded-full transition text-white/40"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
               {settingsTab === 'general' && (
                 <div className="space-y-10">
                    <div className="space-y-4">
                       <p className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Sistema</p>
                       <div className="p-1 rounded-2xl flex gap-1 bg-white/5 border border-white/5">
                          <button onClick={() => setTheme('light')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${theme === 'light' ? 'bg-white text-indigo-600' : 'text-white/40'}`}><Sun size={12} /> Claro</button>
                          <button onClick={() => setTheme('dark')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${theme === 'dark' ? 'bg-white/10 text-white' : 'text-white/40'}`}><Moon size={12} /> Escuro</button>
                       </div>
                    </div>
                    {auth.user.role === 'admin' && (
                      <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Financeiro</p>
                        <button onClick={() => setSettingsTab('plans')} className="w-full p-6 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-between group hover:bg-white/10 transition-all">
                            <div className="flex items-center gap-4">
                              <div className={`${isPro ? 'bg-amber-500 shadow-amber-500/20' : 'bg-indigo-600'} p-3 text-white rounded-2xl shadow-lg transition-colors`}><Zap size={20} /></div>
                              <div className="text-left">
                                  <p className="text-xs font-black text-white uppercase tracking-wider">{isPro ? 'Plano Ativo' : 'Planos e Preços'}</p>
                                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-0.5">{isPro ? 'Recursos Pro Liberados' : 'Liberar recursos pro'}</p>
                              </div>
                            </div>
                            <ChevronRight size={18} className="text-white/20 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    )}
                 </div>
               )}
               {settingsTab === 'plans' && (
                 <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                    {isPro ? (
                      <div className="text-center space-y-6 py-10">
                         <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-600 text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-amber-500/20 border border-white/10 rotate-3"><Star size={44} fill="currentColor" /></div>
                         <div className="space-y-2">
                            <h4 className="text-3xl font-black text-white tracking-tighter">VeroPonto Pro</h4>
                            <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.3em] bg-emerald-500/10 py-1.5 rounded-full inline-block px-4 border border-emerald-500/20">Assinatura Ativa</p>
                         </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-center space-y-2 mb-8">
                           <h4 className="text-3xl font-black text-white tracking-tighter">Escolha seu Plano</h4>
                           <p className="text-[11px] text-white/40 font-bold uppercase tracking-widest">Cancele quando quiser</p>
                        </div>
                        <div className="space-y-4">
                           <div className="relative group">
                              <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-[1.8rem] opacity-75 blur-sm group-hover:opacity-100 transition duration-1000"></div>
                              <div className="relative bg-[#131b2e] rounded-[1.7rem] p-5 border border-amber-500/50 flex flex-col gap-3">
                                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-black text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg flex items-center gap-1"><Star size={10} fill="currentColor" /> Recomendado</div>
                                  <div className="flex justify-between items-center mt-2">
                                      <div><h3 className="text-white font-black text-lg">Anual</h3><span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">Economize 6%</span></div>
                                      <div className="text-right"><p className="text-slate-400 text-[10px] line-through font-bold">R$ 598,80</p><p className="text-2xl font-black text-amber-400 tracking-tighter">R$ 562,80</p></div>
                                  </div>
                                  <a href={LINK_ANUAL_PROD} target="_blank" rel="noopener noreferrer" className="w-full py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-black rounded-xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2">Assinar Anual <Sparkles size={14} fill="black" /></a>
                              </div>
                           </div>
                           <div className="bg-white/5 rounded-[1.7rem] p-5 border border-white/5 hover:border-white/10 transition-all flex flex-col gap-3">
                              <div className="flex justify-between items-center">
                                  <div><h3 className="text-white font-black text-lg">Mensal</h3><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Flexibilidade</p></div>
                                  <div className="text-right"><p className="text-xl font-black text-white tracking-tighter">R$ 49,90</p></div>
                              </div>
                              <a href={LINK_MENSAL_PROD} target="_blank" rel="noopener noreferrer" className="w-full py-4 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2">Assinar Mensal</a>
                           </div>
                        </div>
                      </>
                    )}
                 </div>
               )}
            </div>
            <div className="p-6 bg-black/40 border-t border-white/5">
               <button onClick={() => setShowSettings(false)} className="w-full py-5 bg-white/5 text-white/60 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-white/10 hover:text-white transition-all">Voltar ao App</button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 safe-bottom">
        {auth.user.role === 'admin' ? <AdminDashboard isPro={isPro} /> : <EmployeeDashboard user={auth.user} isPro={isPro} />}
      </main>
      <AIChat user={auth.user} isPro={isPro} />
      <InstallPrompt />
      {auth.user.role === 'admin' && <PaywallLock user={auth.user} isPro={isPro} />}
    </div>
  );
};

export default App;
