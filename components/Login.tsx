
import React, { useState } from 'react';
import { supabase, StorageService } from '../services/storage';
import { 
  Shield, 
  Fingerprint, 
  Loader2, 
  Eye,
  EyeOff
} from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [regType, setRegType] = useState<'manager' | 'employee'>('employee');
  const [showPassword, setShowPassword] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const translateError = (msg: string) => {
    const lowerMsg = msg.toLowerCase();
    if (lowerMsg.includes('security purposes')) return 'Muitas tentativas. Aguarde.';
    if (lowerMsg.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
    return msg;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

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
      setError("Senhas não coincidem.");
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

      const userId = authData.user?.id;
      if (userId) {
        const finalWorkspaceId = regType === 'manager' 
          ? `GEO-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
          : workspaceId.toUpperCase().trim();

        await StorageService.saveUser({
          id: userId,
          email,
          name,
          employeeId: regType === 'manager' ? 'GESTOR' : employeeId,
          role: regType === 'manager' ? 'admin' : 'employee',
          workspaceId: finalWorkspaceId,
          createdAt: Date.now()
        });
        
        setSuccess("Conta criada com sucesso!");
        setTimeout(() => setIsRegistering(false), 2000);
      }
    } catch (err: any) {
      setError(translateError(err.message));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#050505] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent pointer-events-none"></div>
      
      <div className="w-full max-w-[400px] space-y-8 relative z-10 animate-in fade-in zoom-in-95 duration-700">
        {/* Logo Section - Matching precisely the screenshot and professional feel */}
        <div className="flex items-center justify-center gap-5 mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-[#2DD4BF] to-[#4F46E5] rounded-[1.8rem] flex items-center justify-center shadow-[0_10px_30px_rgba(45,212,191,0.25)] relative overflow-hidden">
             <Shield size={38} className="text-white fill-white/10 relative z-10" />
             <Fingerprint size={18} className="text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-60 z-20" />
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter">GeoPoint</h1>
        </div>

        {/* Login Card */}
        <div className="bg-[#121212]/90 backdrop-blur-2xl rounded-[3rem] border border-white/5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] p-8 sm:p-10 space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              {isRegistering ? 'Criar sua conta' : 'Bem-vindo de volta'}
            </h2>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] opacity-80">
              {isRegistering ? 'PREENCHA OS DADOS ABAIXO' : 'ENTRE COM SUAS CREDENCIAIS'}
            </p>
          </div>

          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-5">
            {isRegistering && (
              <>
                <div className="flex bg-black/40 rounded-2xl p-1 mb-4 border border-white/5">
                  <button type="button" onClick={() => setRegType('manager')} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-xl transition-all ${regType === 'manager' ? 'bg-white/10 text-white' : 'text-slate-600'}`}>Gestor</button>
                  <button type="button" onClick={() => setRegType('employee')} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-xl transition-all ${regType === 'employee' ? 'bg-white/10 text-white' : 'text-slate-600'}`}>Colaborador</button>
                </div>
                <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-6 py-5 bg-[#1a1a1a] border border-white/5 rounded-2xl font-bold text-white text-sm outline-none focus:border-[#2DD4BF]/50 transition-all placeholder:text-slate-600" placeholder="Nome Completo" />
                {regType === 'employee' && (
                  <div className="grid grid-cols-2 gap-3">
                    <input required type="text" value={workspaceId} onChange={(e) => setWorkspaceId(e.target.value.toUpperCase())} className="w-full px-4 py-5 bg-[#1a1a1a] border border-white/5 rounded-2xl font-black text-white text-xs outline-none focus:border-[#2DD4BF]/50 placeholder:text-slate-700" placeholder="CÓDIGO EMPRESA" />
                    <input required type="text" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="w-full px-4 py-5 bg-[#1a1a1a] border border-white/5 rounded-2xl font-black text-white text-xs outline-none focus:border-[#2DD4BF]/50 placeholder:text-slate-700" placeholder="MATRÍCULA" />
                  </div>
                )}
              </>
            )}
            
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-6 py-5 bg-[#1a1a1a] border border-white/5 rounded-2xl font-bold text-white text-sm outline-none focus:border-[#2DD4BF]/50 transition-all placeholder:text-slate-600" placeholder="seu@email.com" />
            
            <div className="relative">
              <input required type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-6 py-5 bg-[#1a1a1a] border border-white/5 rounded-2xl font-bold text-white text-sm outline-none focus:border-[#2DD4BF]/50 transition-all placeholder:text-slate-600" placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {isRegistering && <input required type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-6 py-5 bg-[#1a1a1a] border border-white/5 rounded-2xl font-bold text-white text-sm outline-none focus:border-[#2DD4BF]/50" placeholder="Confirme a senha" />}

            {error && <div className="bg-red-500/10 text-red-500 p-4 rounded-2xl border border-red-500/20 text-[10px] font-black uppercase text-center tracking-widest">{error}</div>}
            {success && <div className="bg-emerald-500/10 text-emerald-500 p-4 rounded-2xl border border-emerald-500/20 text-[10px] font-black uppercase text-center tracking-widest">{success}</div>}

            <button disabled={isLoading} type="submit" className="w-full py-5 bg-gradient-to-r from-[#2DD4BF] to-[#4F46E5] rounded-[1.8rem] text-white font-black text-xs uppercase tracking-[0.25em] shadow-xl shadow-[#2DD4BF]/10 active:scale-[0.98] transition-all flex items-center justify-center gap-3">
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : (isRegistering ? 'CADASTRAR AGORA' : 'ENTRAR')}
            </button>
          </form>

          <div className="pt-2 text-center">
            <button onClick={() => { setIsRegistering(!isRegistering); setError(null); }} className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] hover:text-white transition-colors">
              {isRegistering ? 'JÁ TEM UMA CONTA? CLIQUE AQUI' : 'AINDA NÃO TEM CONTA? CLIQUE AQUI'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
