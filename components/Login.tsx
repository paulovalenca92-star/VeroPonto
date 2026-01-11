import React, { useState } from 'react';
import { supabase, StorageService } from '../services/storage';
import { 
  Lock, 
  Mail, 
  Fingerprint, 
  AlertCircle, 
  Loader2, 
  User as UserIcon, 
  Eye,
  EyeOff,
  CheckCircle2
} from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const translateError = (msg: string) => {
    if (msg.includes('security purposes')) return 'Aguarde alguns segundos antes de tentar novamente.';
    if (msg.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
    if (msg.includes('User already registered')) return 'Este e-mail já está cadastrado.';
    return msg;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(translateError(authError.message));
      setIsLoading(false);
    } else {
      onLoginSuccess();
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      setIsLoading(false);
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } }
      });

      if (authError) throw authError;

      if (authData.user) {
        const finalWorkspaceId = `VERO-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        await StorageService.saveUser({
          id: authData.user.id,
          email,
          name,
          employeeId: 'GESTOR',
          role: 'admin',
          workspaceId: finalWorkspaceId,
          createdAt: Date.now()
        });
        
        setSuccess("Empresa cadastrada com sucesso!");
        setTimeout(() => onLoginSuccess(), 1500);
      }
    } catch (err: any) {
      setError(translateError(err.message));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
      
      <div className="max-w-[500px] w-full mx-auto space-y-6 relative z-10">
        <div className="text-center space-y-4 mb-8">
          <Fingerprint size={64} className="text-indigo-400 mx-auto" />
          <h1 className="text-4xl font-black text-white tracking-tighter">Vero<span className="text-indigo-500">Ponto</span></h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.4em]">Multi-Tenant HR Cloud</p>
        </div>

        <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-slate-100">
          <h2 className="text-2xl font-black text-slate-800 text-center mb-10">
            {isRegistering ? 'Nova Empresa' : 'Acesso ao Sistema'}
          </h2>

          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-6">
            {isRegistering && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Gestor</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-slate-100 border-2 rounded-2xl font-semibold text-slate-800 focus:border-indigo-500 transition-all outline-none" placeholder="Nome completo" />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-slate-100 border-2 rounded-2xl font-semibold text-slate-800 focus:border-indigo-500 transition-all outline-none" placeholder="email@empresa.com" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input required type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-12 pr-12 py-4 bg-slate-50 border-slate-100 border-2 rounded-2xl font-semibold text-slate-800 focus:border-indigo-500 transition-all outline-none" placeholder="******" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </div>

            {isRegistering && (
              <div className="space-y-2 animate-in fade-in">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmar Senha</label>
                <input required type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-4 bg-slate-50 border-slate-100 border-2 rounded-2xl font-semibold text-slate-800 focus:border-indigo-500 transition-all outline-none" />
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-2 border border-red-100 animate-in fade-in slide-in-from-top-1 duration-300">
                <AlertCircle size={14} className="shrink-0" />
                <p className="text-[10px] font-black uppercase leading-tight">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl flex items-center gap-2 border border-emerald-100 animate-in fade-in slide-in-from-top-1 duration-300">
                <CheckCircle2 size={14} className="shrink-0" />
                <p className="text-[10px] font-black uppercase leading-tight">{success}</p>
              </div>
            )}

            <button 
              disabled={isLoading} 
              type="submit" 
              className={`w-full py-5 rounded-[1.5rem] text-white font-black text-xs uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 ${isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'}`}
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : (isRegistering ? 'Criar Minha Empresa' : 'Entrar no Sistema')}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-50 flex flex-col gap-3">
            <button 
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError(null);
                setSuccess(null);
              }} 
              className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-500 transition-colors"
            >
              {isRegistering ? 'Já tenho uma conta corporativa' : 'Minha empresa não tem conta? Criar agora'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;