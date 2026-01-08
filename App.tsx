
import React, { useState, useEffect } from 'react';
import { AuthState, User } from './types';
import { StorageService, supabase, SETUP_SQL } from './services/storage';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import AIChat from './components/AIChat';
import { LogOut, Fingerprint, Loader2, Database, AlertCircle, Copy, Check, Building } from 'lucide-react';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true
  });
  const [dbMissing, setDbMissing] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await fetchProfile(session.user.id);
    } else {
      try {
        const { error } = await supabase.from('locations').select('id').limit(1);
        if (error && (error.code === '42P01' || error.message.includes('not found'))) {
          setDbMissing(true);
        }
        setAuth(prev => ({ ...prev, loading: false }));
      } catch (err: any) {
        setAuth(prev => ({ ...prev, loading: false }));
      }
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
      if (err.message === "DB_NOT_READY") setDbMissing(true);
      setAuth({ user: null, isAuthenticated: false, loading: false });
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SETUP_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (dbMissing) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
        <div className="max-w-2xl w-full bg-white rounded-[3rem] p-10 shadow-2xl relative z-10 border border-slate-100">
          <div className="flex flex-col items-center text-center space-y-4 mb-8">
            <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-[2rem] flex items-center justify-center shadow-inner">
              <Database size={40} />
            </div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Setup de Infraestrutura</h2>
            <p className="text-slate-500 font-medium max-w-md">Para começar a vender o VeroPonto, você precisa inicializar as tabelas no seu Supabase.</p>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <AlertCircle size={14} /> Passo único necessário:
              </h3>
              <ol className="text-sm text-slate-600 space-y-3 font-semibold">
                <li className="flex gap-3 items-start"><span className="bg-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-sm shrink-0">1</span> No painel Supabase, vá em <strong>SQL Editor</strong>.</li>
                <li className="flex gap-3 items-start"><span className="bg-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-sm shrink-0">2</span> Cole o script abaixo e clique em <strong>RUN</strong>.</li>
              </ol>
            </div>

            <div className="relative group">
              <div className="absolute right-4 top-4 z-10">
                <button 
                  onClick={handleCopySql}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${copied ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-white text-slate-600 hover:bg-slate-100 shadow-sm'}`}
                >
                  {copied ? <><Check size={14} /> Copiado!</> : <><Copy size={14} /> Copiar SQL</>}
                </button>
              </div>
              <pre className="bg-slate-900 text-indigo-300 p-8 rounded-[2rem] text-xs font-mono overflow-x-auto max-h-[250px] shadow-inner custom-scrollbar">
                {SETUP_SQL}
              </pre>
            </div>

            <button 
              onClick={() => window.location.reload()}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
            >
              Já executei o SQL! Recarregar App
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (auth.loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return <Login onLoginSuccess={() => checkSession()} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-lg shadow-indigo-100">
              <Fingerprint size={20} />
            </div>
            <h1 className="font-black text-xl tracking-tighter text-slate-900">
              Vero<span className="text-indigo-600">Ponto</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-bold text-slate-800 leading-none">{auth.user?.name}</span>
              <div className="flex items-center gap-1.5 mt-1">
                <Building size={10} className="text-indigo-400" />
                <span className="text-[9px] uppercase font-black text-indigo-500 tracking-widest">
                  {auth.user?.workspaceId}
                </span>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="Sair"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8 relative">
        {auth.user?.role === 'admin' ? (
          <AdminDashboard />
        ) : (
          <EmployeeDashboard user={auth.user!} />
        )}
      </main>

      {/* IA Assistant */}
      <AIChat user={auth.user!} />

      <footer className="py-8 text-center border-t border-slate-100 bg-white">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">&copy; 2024 VeroPonto Multi-Tenant HR</p>
      </footer>
    </div>
  );
};

export default App;
