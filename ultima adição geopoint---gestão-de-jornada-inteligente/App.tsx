
import React, { useState, useEffect } from 'react';
import { AuthState } from './types';
import { StorageService, supabase } from './services/storage';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import AIChat from './components/AIChat';
import InstallPrompt from './components/InstallPrompt';
import { 
  Loader2, 
  Shield,
  Fingerprint,
  RefreshCw,
  PartyPopper,
  X
} from 'lucide-react';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true
  });

  const [showWelcome, setShowWelcome] = useState(false);
  const [swUpdate, setSwUpdate] = useState<ServiceWorkerRegistration | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return localStorage.getItem('theme') as 'light' | 'dark' || 'dark';
  });

  useEffect(() => {
    checkSession();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // VERIFICA SE O USUÁRIO ACABOU DE SE CADASTRAR
        const isNewUser = sessionStorage.getItem('geopoint_new_user') === 'true';
        if (isNewUser) {
          setShowWelcome(true);
          sessionStorage.removeItem('geopoint_new_user'); // Limpa após usar
        }
        await fetchProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setAuth({ user: null, isAuthenticated: false, loading: false });
      }
    });

    const handleSWUpdate = (e: any) => setSwUpdate(e.detail);
    window.addEventListener('sw-update-available', handleSWUpdate);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('sw-update-available', handleSWUpdate);
    };
  }, []); // Removido auth.isAuthenticated para evitar loops

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
      
      {showWelcome && (
        <div className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="bg-[#0A0A0A] border border-white/10 p-12 rounded-[4rem] max-w-sm text-center space-y-8 shadow-[0_0_100px_rgba(0,0,0,1)] relative overflow-hidden">
            <div className="absolute -top-12 -left-12 w-40 h-40 bg-indigo-600/10 blur-[80px] rounded-full"></div>
            
            <div className="w-24 h-24 bg-gradient-to-br from-[#2DD4BF] to-[#4F46E5] rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl border border-white/10">
              <PartyPopper size={44} className="text-white" />
            </div>
            
            <div className="space-y-3">
              <h3 className="text-3xl font-black text-white tracking-tighter italic">Acesso Liberado!</h3>
              <p className="text-xs text-slate-500 font-black uppercase tracking-widest leading-relaxed">
                Bem-vindo à nova era da <br/> <span className="text-teal-400">gestão de jornada</span> inteligente.
              </p>
            </div>
            
            <button 
              onClick={() => setShowWelcome(false)}
              className="w-full py-6 bg-white text-black rounded-3xl font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all hover:brightness-90"
            >
              Começar Agora
            </button>
          </div>
        </div>
      )}

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

      {/* Header Global - Padronizado e Profissional */}
      <header className={`${theme === 'dark' ? 'bg-[#050505] border-white/5' : 'bg-white border-slate-100'} sticky top-0 z-40 border-b safe-top transition-colors duration-300 backdrop-blur-xl bg-opacity-90`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-gradient-to-br from-indigo-500 to-teal-400 p-2.5 rounded-xl shadow-lg relative border border-white/10">
                <Shield className="text-white" size={22} />
             </div>
             <div>
                <h1 className="text-xl font-black tracking-tighter leading-none text-white uppercase italic">GeoPoint</h1>
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mt-1">Status: Sincronizado</p>
             </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-white uppercase tracking-tight">{auth.user.name}</p>
              <p className="text-[8px] font-bold text-teal-500 uppercase tracking-widest">{auth.user.role === 'admin' ? 'Acesso Master' : 'Membro da Equipe'}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 shadow-inner">
               <Fingerprint size={20} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 safe-bottom min-h-[calc(100vh-80px)]">
        {auth.user.role === 'admin' ? (
          <AdminDashboard isPro={true} />
        ) : (
          <EmployeeDashboard 
            user={auth.user} 
            onLogout={handleLogout}
            theme={theme}
            onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            onForceUpdate={handleForceUpdate}
          />
        )}
      </main>

      <AIChat user={auth.user} isPro={true} />
      <InstallPrompt />
    </div>
  );
};

export default App;
