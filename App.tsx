import React, { useState, useEffect } from 'react';
import { AuthState, User } from './types';
import { StorageService, supabase } from './services/storage';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import AIChat from './components/AIChat';
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
  Bell
} from 'lucide-react';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true
  });

  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return localStorage.getItem('theme') as 'light' | 'dark' || 'light';
  });
  const [lang, setLang] = useState<'pt' | 'en'>(() => {
    return localStorage.getItem('lang') as 'pt' | 'en' || 'pt';
  });

  useEffect(() => {
    checkSession();

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
    // Aplica o tema dark no elemento raiz para Tailwind
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

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
      } else {
        if (retryCount < 3) {
          setTimeout(() => fetchProfile(userId, retryCount + 1), 1000);
        } else {
          setAuth({ user: null, isAuthenticated: false, loading: false });
        }
      }
    } catch (err: any) {
      setAuth({ user: null, isAuthenticated: false, loading: false });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (auth.loading) {
    return (
      <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex items-center justify-center transition-colors">
        <Loader2 size={40} className="text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!auth.isAuthenticated || !auth.user) {
    return <Login onLoginSuccess={checkSession} />;
  }

  return (
    <div className={`min-h-[100dvh] transition-colors ${theme === 'dark' ? 'bg-[#0a0f1a] text-slate-100' : 'bg-[#f8fafc] text-slate-900'}`}>
      
      {/* Header Mobile/Desktop */}
      <header className={`${theme === 'dark' ? 'bg-[#111827]/80 border-slate-800' : 'bg-white/80 border-slate-100'} backdrop-blur-md sticky top-0 z-40 border-b safe-top`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
                <Fingerprint className="text-white" size={20} />
             </div>
             <div className="flex items-center gap-2">
                <div>
                   <h1 className="text-xl font-black tracking-tighter hidden sm:block">Vero<span className="text-indigo-600">Ponto</span></h1>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest sm:hidden">VeroPonto</p>
                </div>
                <button 
                  onClick={() => setShowSettings(true)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400 transition-all hover:rotate-45"
                >
                   <Settings size={18} />
                </button>
             </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
                <p className="text-sm font-black">{auth.user.name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-end gap-1">
                   <Building size={10} /> {auth.user.workspaceId}
                </p>
             </div>
             <button 
               onClick={handleLogout}
               className="p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl text-slate-400 hover:text-red-500 transition-colors"
               title="Sair"
             >
               <LogOut size={20} />
             </button>
          </div>
        </div>
      </header>

      {/* Modal de Configurações */}
      {showSettings && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 animate-in fade-in duration-300">
          <div className={`${theme === 'dark' ? 'bg-[#161b22] border-white/5 text-white' : 'bg-white border-slate-100 text-slate-900'} w-full max-w-sm rounded-[2.5rem] shadow-2xl border overflow-hidden animate-in zoom-in-95 duration-200 mt-20 sm:mt-0`}>
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
               <h3 className="font-black text-xs uppercase tracking-[0.2em] opacity-50">Configurações App</h3>
               <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white/5 rounded-full transition">
                  <X size={20} />
               </button>
            </div>
            
            <div className="p-6 space-y-8">
               {/* Sessão: Tema */}
               <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    {theme === 'dark' ? <Moon size={12} /> : <Sun size={12} />} Modo Visual
                  </p>
                  <div className={`p-1 rounded-2xl flex gap-1 ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'}`}>
                     <button 
                        onClick={() => setTheme('light')}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${theme === 'light' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                     >
                        Claro
                     </button>
                     <button 
                        onClick={() => setTheme('dark')}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${theme === 'dark' ? 'bg-slate-800 text-indigo-400 shadow-sm' : 'text-slate-400'}`}
                     >
                        Escuro
                     </button>
                  </div>
               </div>

               {/* Sessão: Idioma */}
               <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Globe size={12} /> Idioma do Sistema
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                     <button 
                       onClick={() => setLang('pt')}
                       className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${lang === 'pt' ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-white/5 bg-white/2 hover:bg-white/5'}`}
                     >
                        <div className="flex items-center gap-3">
                           <span className="text-lg">🇧🇷</span>
                           <span className="text-xs font-bold uppercase tracking-widest">Português (Brasil)</span>
                        </div>
                        {lang === 'pt' && <Check size={14} className="text-indigo-400" />}
                     </button>
                     <button 
                       onClick={() => setLang('en')}
                       className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${lang === 'en' ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-white/5 bg-white/2 hover:bg-white/5'}`}
                     >
                        <div className="flex items-center gap-3">
                           <span className="text-lg">🇺🇸</span>
                           <span className="text-xs font-bold uppercase tracking-widest">English (US)</span>
                        </div>
                        {lang === 'en' && <Check size={14} className="text-indigo-400" />}
                     </button>
                  </div>
               </div>

               {/* Sessão: Notificações */}
               <div className="flex items-center justify-between p-4 bg-white/2 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                     <Bell size={18} className="text-slate-400" />
                     <span className="text-[10px] font-black uppercase tracking-widest">Notificações</span>
                  </div>
                  <div className="w-10 h-5 bg-indigo-600/20 rounded-full relative">
                     <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-indigo-600 rounded-full"></div>
                  </div>
               </div>
            </div>

            <div className="p-6 bg-slate-900/10 text-center">
               <button 
                 onClick={() => setShowSettings(false)}
                 className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition active:scale-95"
               >
                  Salvar Preferências
               </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 safe-bottom">
        {auth.user.role === 'admin' ? (
          <AdminDashboard />
        ) : (
          <EmployeeDashboard user={auth.user} />
        )}
      </main>

      <AIChat user={auth.user} />
    </div>
  );
};

export default App;