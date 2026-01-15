
import React, { useState, useEffect } from 'react';
import { AuthState } from './types';
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
  RefreshCw,
  Shield,
  Fingerprint,
  User as UserIcon,
  Crown,
  Info
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
    return localStorage.getItem('theme') as 'light' | 'dark' || 'dark';
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

  const handleForceUpdate = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const name of cacheNames) {
          await caches.delete(name);
        }
      }
      // Força recarregamento limpo
      window.location.href = window.location.pathname + '?v=' + Date.now();
    } catch (error) {
      window.location.reload();
    }
  };

  if (auth.loading) {
    return (
      <div className="min-h-[100dvh] bg-[#050505] flex items-center justify-center text-teal-500">
        <Loader2 size={40} className="animate-spin" />
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
    <div className={`min-h-[100dvh] transition-colors ${theme === 'dark' ? 'bg-[#050505] text-slate-100' : 'bg-[#f8fafc] text-slate-900'}`}>
      
      {swUpdate && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-sm">
          <div className="bg-teal-600 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-white/20">
             <div className="flex items-center gap-3">
               <RefreshCw className="animate-spin" size={18} />
               <p className="text-[10px] font-black uppercase tracking-widest">Nova Versão</p>
             </div>
             <button onClick={handleForceUpdate} className="px-4 py-2 bg-white text-teal-600 rounded-xl font-black text-[10px] uppercase">Atualizar</button>
          </div>
        </div>
      )}

      <header className={`${theme === 'dark' ? 'bg-[#050505] border-white/5' : 'bg-white border-slate-100'} sticky top-0 z-40 border-b safe-top transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-gradient-to-br from-indigo-500 to-teal-400 p-2.5 rounded-xl shadow-lg relative">
                <Shield className="text-white" size={22} />
                <Fingerprint size={10} className="text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-80" />
             </div>
             <div>
                <h1 className="text-xl font-black tracking-tighter leading-none text-white">GeoPoint</h1>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">JORNADA</p>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => setShowSettings(true)} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 border border-white/10 transition-all active:scale-95">
                <Settings size={20} />
             </button>
             <button onClick={handleLogout} className="p-2.5 hover:bg-white/5 rounded-xl text-slate-500 hover:text-red-500 transition-colors">
                <LogOut size={22} />
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 safe-bottom">
        {auth.user.role === 'admin' ? <AdminDashboard isPro={true} /> : <EmployeeDashboard user={auth.user} isPro={true} />}
      </main>

      {showSettings && (
        <div className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
           <div className="bg-[#111111] border border-white/10 w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative">
              <div className="p-6 flex justify-between items-center border-b border-white/5">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 rounded-xl text-white">
                       <Settings size={18} />
                    </div>
                    <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-white">Configurações</h3>
                 </div>
                 <button onClick={() => setShowSettings(false)} className="p-2 text-slate-500 hover:text-white transition">
                    <X size={20} />
                 </button>
              </div>

              <div className="p-6 space-y-6">
                 <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
                    <div className="flex items-center gap-4 mb-4">
                       <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                          <UserIcon size={22} />
                       </div>
                       <div>
                          <p className="text-sm font-black text-white">{auth.user.name}</p>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{auth.user.role === 'admin' ? 'Gestor' : 'Colaborador'}</p>
                       </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                       <p className="text-[9px] font-black text-slate-500 uppercase">Unidade</p>
                       <p className="text-[10px] font-black text-white">{auth.user.workspaceId}</p>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Personalização</p>
                    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-full p-5 bg-white/5 rounded-3xl border border-white/5 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          {theme === 'dark' ? <Moon size={18} className="text-indigo-400" /> : <Sun size={18} className="text-amber-400" />}
                          <span className="text-[10px] font-black uppercase tracking-widest text-white">Modo Noturno</span>
                       </div>
                       <div className={`w-10 h-5 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${theme === 'dark' ? 'left-6' : 'left-1'}`}></div>
                       </div>
                    </button>
                 </div>

                 <div className="space-y-3">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Sistema</p>
                    <button onClick={handleForceUpdate} className="w-full p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between hover:bg-white/10 transition group">
                       <div className="flex items-center gap-4">
                          <RefreshCw size={16} className="text-teal-400 group-active:rotate-180 transition-transform" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-white">Limpar Cache e Atualizar</span>
                       </div>
                    </button>
                    <div className="w-full p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between opacity-80">
                       <div className="flex items-center gap-4">
                          <Crown size={16} className="text-amber-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-white">Versão Pro Ativa</span>
                       </div>
                       <p className="text-[9px] font-bold text-slate-500">v2.4.1</p>
                    </div>
                 </div>
              </div>

              <div className="p-6 text-center">
                 <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest flex items-center justify-center gap-2">
                    <Info size={10} /> GEOPOINT CLOUD PLATFORM &copy; 2025
                 </p>
              </div>
           </div>
        </div>
      )}

      <AIChat user={auth.user} isPro={true} />
      <InstallPrompt />
    </div>
  );
};

export default App;