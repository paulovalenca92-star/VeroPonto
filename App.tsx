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
  Loader2, 
  Settings, 
  X, 
  Moon, 
  Sun, 
  ArrowLeft,
  RefreshCw,
  Fingerprint
} from 'lucide-react';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true
  });

  const [showSettings, setShowSettings] = useState(false);
  const [swUpdate, setSwUpdate] = useState<ServiceWorkerRegistration | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return localStorage.getItem('theme') as 'light' | 'dark' || 'light';
  });

  useEffect(() => {
    checkSession();
    const handleSWUpdate = (e: any) => setSwUpdate(e.detail);
    window.addEventListener('sw-update-available', handleSWUpdate);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) fetchProfile(session.user.id);
      else setAuth({ user: null, isAuthenticated: false, loading: false });
    });
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('sw-update-available', handleSWUpdate);
    };
  }, []);

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
        setAuth({ 
          user: { ...profile, isPremium: true }, 
          isAuthenticated: true, 
          loading: false 
        });
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
      
      {swUpdate && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-sm animate-in slide-in-from-top-4">
          <div className="bg-indigo-600 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-white/20">
             <div className="flex items-center gap-3">
               <RefreshCw className="animate-spin" size={18} />
               <p className="text-[10px] font-black uppercase tracking-widest">Atualização Disponível</p>
             </div>
             <button onClick={() => window.location.reload()} className="px-4 py-2 bg-white text-indigo-600 rounded-xl font-black text-[10px] uppercase">OK</button>
          </div>
        </div>
      )}

      <header className={`${theme === 'dark' ? 'bg-[#111827]/80 border-slate-800' : 'bg-white/80 border-slate-100'} backdrop-blur-md sticky top-0 z-40 border-b safe-top`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-slate-900 p-2.5 rounded-2xl shadow-lg">
                <Fingerprint className="text-white" size={20} />
             </div>
             <div>
                <h1 className="text-xl font-black tracking-tighter leading-none">VeroPonto</h1>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Painel Administrativo</p>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
                <p className="text-sm font-black">{auth.user.name}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase">{auth.user.role === 'admin' ? 'Gestor' : 'Colaborador'}</p>
             </div>
             <button onClick={() => setShowSettings(true)} className="p-2.5 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl text-slate-400"><Settings size={20} /></button>
             <button onClick={handleLogout} className="p-2.5 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl text-slate-400 hover:text-red-500"><LogOut size={20} /></button>
          </div>
        </div>
      </header>

      {showSettings && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[380px] rounded-[2.5rem] shadow-2xl p-8">
            <div className="flex justify-between items-center mb-8">
               <h3 className="font-black text-xs uppercase tracking-widest">Aparência</h3>
               <button onClick={() => setShowSettings(false)} className="p-2 text-slate-400"><X size={20} /></button>
            </div>
            <div className="p-1 rounded-2xl flex gap-1 bg-slate-100 dark:bg-white/5">
              <button onClick={() => setTheme('light')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 ${theme === 'light' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}><Sun size={12} /> Claro</button>
              <button onClick={() => setTheme('dark')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 ${theme === 'dark' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400'}`}><Moon size={12} /> Escuro</button>
            </div>
            <button onClick={() => setShowSettings(false)} className="w-full mt-6 py-4 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest">Fechar</button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 safe-bottom">
        {auth.user.role === 'admin' ? <AdminDashboard isPro={true} /> : <EmployeeDashboard user={auth.user} isPro={true} />}
      </main>
      <AIChat user={auth.user} isPro={true} />
      <InstallPrompt />
    </div>
  );
};

export default App;