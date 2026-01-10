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
        const { error } = await supabase.from('locations').select('address').limit(1);
        if (error && (
            error.code === '42P01' || 
            error.code === '42703' || 
            error.message.includes('not found') || 
            error.message.includes('does not exist')
        )) {
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
      <div className="min-h-[100dvh] bg-[#0f172a] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
        <div className="max-w-2xl w-full bg-white rounded-[3rem] p-10 shadow-2xl relative z-10 border border-slate-100">
          <div className="flex flex-col items-center text-center space-y-4 mb-8">
            <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-[2rem] flex items-center justify-center shadow-inner">
              <Database size={40} />
            </div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Setup de Infraestrutura</h2>
            <p className="text-slate-500 font-medium max-w-md">Para começar a usar o VeroPonto, você precisa atualizar as tabelas no seu Supabase.</p>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-4">
               <div className="flex items-center gap-3 text-slate-600">
                  <AlertCircle size={20} className="text-indigo-500" />
                  <p className="text-xs font-bold uppercase tracking-wide">Instruções Rápidas:</p>
               </div>
               <ol className="list-decimal list-inside text-sm text-slate-600 space-y-2 marker:font-bold marker:text-indigo-500">
                  <li>Copie o código SQL abaixo.</li>
                  <li>Vá até o painel do Supabase {'>'} SQL Editor.</li>
                  <li>Cole o código e clique em "Run".</li>
                  <li>Recarregue esta página.</li>
               </ol>
            </div>

            <button 
              onClick={handleCopySql}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all"
            >
               {copied ? <><Check size={18} /> Código Copiado!</> : <><Copy size={18} /> Copiar SQL de Correção</>}
            </button>
            
            <div className="text-center">
                <button onClick={() => window.location.reload()} className="text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-indigo-500">
                    Já executei, recarregar página
                </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (auth.loading) {
    return (
      <div className="min-h-[100dvh] bg-slate-50 flex items-center justify-center">
        <Loader2 size={40} className="text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!auth.isAuthenticated || !auth.user) {
    return <Login onLoginSuccess={checkSession} />;
  }

  return (
    <div className="min-h-[100dvh] bg-[#f8fafc] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-700">
      
      {/* Header Mobile/Desktop */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100 safe-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
                <Fingerprint className="text-white" size={20} />
             </div>
             <div>
                <h1 className="text-xl font-black tracking-tighter text-slate-800 hidden sm:block">Vero<span className="text-indigo-600">Ponto</span></h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest sm:hidden">VeroPonto</p>
             </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-slate-800">{auth.user.name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-end gap-1">
                   <Building size={10} /> {auth.user.workspaceId}
                </p>
             </div>
             <button 
               onClick={handleLogout}
               className="p-3 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-red-500 transition-colors"
               title="Sair"
             >
               <LogOut size={20} />
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 safe-bottom">
        {auth.user.role === 'admin' ? (
          <AdminDashboard />
        ) : (
          <EmployeeDashboard user={auth.user} />
        )}
      </main>

      {/* Chat flutuante disponível para todos */}
      <AIChat user={auth.user} />
    </div>
  );
};

export default App;