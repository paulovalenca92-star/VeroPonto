
import React, { useState, useEffect } from 'react';
import { AuthState, User } from './types';
import { StorageService, supabase } from './services/storage';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import AIChat from './components/AIChat';
import InstallPrompt from './components/InstallPrompt';
import { 
  LogOut, 
  Fingerprint, 
  Loader2, 
  Building, 
  Settings, 
  X, 
  Moon, 
  Sun, 
  Globe, 
  Check,
  Bell,
  CreditCard,
  ShieldCheck,
  Zap,
  ChevronRight,
  ArrowLeft,
  QrCode,
  Smartphone,
  Star,
  Award,
  Sparkles,
  RefreshCcw
} from 'lucide-react';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true
  });

  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'general' | 'billing' | 'plans'>('general');
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  
  // Flag de controle Pro (Sincronizada com localStorage para persistência após retorno do checkout)
  const [isPro, setIsPro] = useState(() => localStorage.getItem('veroponto_pro') === 'true');
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return localStorage.getItem('theme') as 'light' | 'dark' || 'light';
  });

  useEffect(() => {
    checkSession();
    checkPaymentReturn();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setAuth({ user: null, isAuthenticated: false, loading: false });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const checkPaymentReturn = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    if (status === 'approved') {
      setIsPro(true);
      localStorage.setItem('veroponto_pro', 'true');
      setShowSettings(true);
      setSettingsTab('plans');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await fetchProfile(session.user.id);
    } else {
      setAuth(prev => ({ ...prev, loading: false }));
    }
  };

  const fetchProfile = async (userId: string, retryCount = 0) => {
    try {
      const profile = await StorageService.getProfile(userId);
      if (profile) {
        setAuth({ user: profile, isAuthenticated: true, loading: false });
      } else if (retryCount < 3) {
        setTimeout(() => fetchProfile(userId, retryCount + 1), 1000);
      } else {
        setAuth({ user: null, isAuthenticated: false, loading: false });
      }
    } catch (err: any) {
      setAuth({ user: null, isAuthenticated: false, loading: false });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleMercadoPagoCheckout = async (planId: string) => {
    if (isPro) return;
    setIsCheckoutLoading(true);
    const linkFinal = 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=261492276-a8f67799-f2d6-4332-b9d7-5b6aa57e8af1';
    setTimeout(() => {
      setIsCheckoutLoading(false);
      window.location.href = linkFinal;
    }, 800);
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
      
      <header className={`${theme === 'dark' ? 'bg-[#111827]/80 border-slate-800' : 'bg-white/80 border-slate-100'} backdrop-blur-md sticky top-0 z-40 border-b safe-top`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className={`${isPro ? 'bg-gradient-to-br from-amber-400 to-orange-600 shadow-amber-500/20' : 'bg-indigo-600 shadow-indigo-200'} p-2.5 rounded-2xl shadow-lg transition-all`}>
                {isPro ? <Sparkles className="text-white" size={20} /> : <Fingerprint className="text-white" size={20} />}
             </div>
             <div className="flex flex-col">
                <h1 className="text-xl font-black tracking-tighter leading-none">
                  VeroPonto {isPro && <span className="text-amber-500">Pro</span>}
                </h1>
                {!isPro && <span className="text-[9px] font-black uppercase text-indigo-600 tracking-widest mt-1">Free Edition</span>}
             </div>
             <button onClick={() => { setSettingsTab('general'); setShowSettings(true); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400 transition-all hover:rotate-45 ml-2">
                <Settings size={18} />
             </button>
          </div>

          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
                <p className="text-sm font-black">{auth.user.name}</p>
                <p className={`text-[10px] font-bold uppercase tracking-widest flex items-center justify-end gap-1 ${isPro ? 'text-amber-500' : 'text-slate-400'}`}>
                   {isPro ? <Star size={10} fill="currentColor" /> : <Check size={10} />}
                   {isPro ? 'Empresa Pro' : 'Conta Básica'}
                </p>
             </div>
             <button onClick={handleLogout} className="p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl text-slate-400 hover:text-red-500 transition-colors">
               <LogOut size={20} />
             </button>
          </div>
        </div>
      </header>

      {showSettings && (
        <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className={`bg-[#0a0a0a] border border-white/10 w-full max-w-[420px] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative`}>
            
            <div className="p-6 flex justify-between items-center text-white border-b border-white/5">
               <button 
                onClick={() => settingsTab === 'general' ? setShowSettings(false) : setSettingsTab('general')} 
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl hover:bg-white/10 transition"
               >
                 <ArrowLeft size={14} /> Voltar
               </button>
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
                 </div>
               )}

               {settingsTab === 'plans' && (
                 <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                    {isPro ? (
                      <div className="text-center space-y-6 py-10">
                         <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-600 text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-amber-500/20 border border-white/10 rotate-3">
                            <Star size={44} fill="currentColor" />
                         </div>
                         <div className="space-y-2">
                            <h4 className="text-3xl font-black text-white tracking-tighter">VeroPonto Pro</h4>
                            <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.3em] bg-emerald-500/10 py-1.5 rounded-full inline-block px-4 border border-emerald-500/20">Acesso Vitalício Ativado</p>
                         </div>
                         <div className="bg-white/5 p-6 rounded-3xl border border-white/5 text-left space-y-4">
                            {['Colaboradores Ilimitados', 'Exportação CSV Profissional', 'Geofencing de Alta Precisão', 'Suporte Prioritário'].map((f, i) => (
                              <div key={i} className="flex items-center gap-3 text-[9px] font-black text-white/60 uppercase tracking-widest">
                                 <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> {f}
                              </div>
                            ))}
                         </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-center space-y-2 mb-10">
                           <h4 className="text-3xl font-black text-white tracking-tighter">Eleve sua Gestão</h4>
                           <p className="text-[11px] text-white/40 font-bold max-w-[250px] mx-auto uppercase tracking-widest">Controle total, sem limites.</p>
                        </div>

                        <div className="space-y-6">
                           <div className="p-8 rounded-[2.5rem] border-2 border-amber-500/50 bg-amber-500/5 relative overflow-hidden group">
                              <span className="absolute top-0 right-0 bg-amber-500 text-black px-5 py-1.5 rounded-bl-2xl text-[8px] font-black uppercase tracking-widest">Recomendado</span>
                              <div className="flex justify-between items-start mb-8">
                                 <div className="p-4 rounded-2xl bg-amber-500 text-black shadow-xl shadow-amber-500/20"><Zap size={24}/></div>
                                 <div className="text-right text-white">
                                    <p className="text-2xl font-black tracking-tight">R$ 149,90</p>
                                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest italic">Pagamento Único</p>
                                 </div>
                              </div>
                              <h5 className="font-black text-white text-xs uppercase tracking-widest mb-6">Versão Profissional</h5>
                              <ul className="space-y-3.5 mb-10">
                                 {['Colaboradores Ilimitados', 'Geofencing GPS Real', 'Exportação em Massa', 'IA VeroPonto Plus'].map((f, i) => (
                                   <li key={i} className="text-[10px] font-bold text-white/50 flex items-center gap-2.5">
                                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> {f}
                                   </li>
                                 ))}
                              </ul>
                              <button onClick={() => !isCheckoutLoading && handleMercadoPagoCheckout('pro')} className="w-full py-5 bg-amber-500 text-black rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-amber-500/10 hover:bg-amber-400 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                                 {isCheckoutLoading ? <Loader2 size={16} className="animate-spin" /> : <>Assinar Agora <ChevronRight size={16}/></>}
                              </button>
                           </div>
                        </div>
                      </>
                    )}
                    
                    <div className="flex items-center justify-center gap-6 py-8 opacity-20 grayscale invert">
                       <img src="https://logodownload.org/wp-content/uploads/2019/06/pix-logo-4.png" className="h-4" alt="PIX" />
                       <img src="https://logopng.com.br/logos/mercado-pago-45.png" className="h-3" alt="Mercado Pago" />
                    </div>
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
    </div>
  );
};

export default App;
