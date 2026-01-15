
import React, { useState } from 'react';
import { supabase, StorageService } from '../services/storage';
import { 
  Lock, 
  Mail, 
  Fingerprint, 
  Clock,
  AlertCircle, 
  Loader2, 
  User as UserIcon, 
  Eye,
  EyeOff,
  CheckCircle2,
  Building2,
  Users,
  RefreshCw,
  Shield
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
  
  const [retryUserId, setRetryUserId] = useState<string | null>(null);
  const [isFkeyError, setIsFkeyError] = useState(false);

  const translateError = (msg: string) => {
    const lowerMsg = msg.toLowerCase();
    if (lowerMsg.includes('security purposes')) return 'Aguarde alguns segundos antes de tentar novamente.';
    if (lowerMsg.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
    if (lowerMsg.includes('already registered')) return 'Este e-mail já está cadastrado. Tente fazer login.';
    if (lowerMsg.includes('profiles_id_fkey') || lowerMsg.includes('foreign key')) {
      setIsFkeyError(true);
      return 'O servidor ainda não processou seu acesso. Clique em Sincronizar em 5 segundos.';
    }
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

  const trySaveProfile = async (userId: string) => {
    setIsLoading(true);
    setError(null);
    const finalWorkspaceId = regType === 'manager' 
      ? `GEO-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
      : workspaceId.toUpperCase().trim();

    try {
      await StorageService.saveUser({
        id: userId,
        email,
        name,
        employeeId: regType === 'manager' ? 'GESTOR' : employeeId,
        role: regType === 'manager' ? 'admin' : 'employee',
        workspaceId: finalWorkspaceId,
        createdAt: Date.now()
      });
      
      setSuccess("Cadastro concluído! Agora você já pode entrar.");
      setIsLoading(false);
      
      setTimeout(() => {
        setIsRegistering(false);
        setSuccess(null);
        setPassword('');
        setConfirmPassword('');
      }, 3000);

    } catch (err: any) {
      setError(translateError(err.message));
      setIsLoading(false);
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
      let { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } }
      });

      if (authError?.message.includes('already registered')) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw new Error("E-mail já cadastrado com outra senha.");
        authData = signInData;
      } else if (authError) {
        throw authError;
      }

      const userId = authData.user?.id;
      if (userId) {
        setRetryUserId(userId);
        await trySaveProfile(userId);
      }
    } catch (err: any) {
      setError(translateError(err.message));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[10%] left-[20%] w-[400px] h-[400px] bg-teal-500/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[10%] right-[20%] w-[400px] h-[400px] bg-indigo-600/10 blur-[120px] rounded-full"></div>
      
      <div className="max-w-[420px] w-full mx-auto space-y-10 relative z-10">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-indigo-600 rounded-[1.4rem] flex items-center justify-center shadow-[0_0_40px_rgba(20,184,166,0.3)]">
               <div className="relative">
                 <Shield size={32} className="text-white" />
                 <Fingerprint size={16} className="text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-80" />
               </div>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter">Geo<span className="text-indigo-400">Point</span></h1>
          </div>
        </div>

        <div className="bg-[#111111] rounded-[2.5rem] shadow-2xl border border-white/5 overflow-hidden">
          {isRegistering && (
            <div className="flex bg-black/40 border-b border-white/5">
              <button onClick={() => setRegType('manager')} className={`flex-1 py-4 text-[9px] font-black uppercase tracking-widest transition-all ${regType === 'manager' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-slate-600'}`}>Novo Gestor</button>
              <button onClick={() => setRegType('employee')} className={`flex-1 py-4 text-[9px] font-black uppercase tracking-widest transition-all ${regType === 'employee' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-slate-600'}`}>Sou Colaborador</button>
            </div>
          )}

          <div className="p-8 sm:p-10">
            <div className="mb-8 text-center">
              <h2 className="text-xl font-black text-white tracking-tight">{isRegistering ? 'Criar nova conta' : 'Bem-vindo de volta'}</h2>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-1">{isRegistering ? 'Preencha seus dados' : 'Entre com suas credenciais'}</p>
            </div>

            <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
              {isRegistering && (
                <>
                  <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-5 py-4 bg-[#1a1a1a] border border-white/5 rounded-2xl font-bold text-white outline-none text-xs" placeholder="Seu Nome" />
                  {regType === 'employee' && (
                    <div className="grid grid-cols-2 gap-3">
                      <input required type="text" value={workspaceId} onChange={(e) => setWorkspaceId(e.target.value.toUpperCase())} className="w-full px-5 py-4 bg-[#1a1a1a] border border-white/5 rounded-2xl font-black text-white text-xs" placeholder="GEO-XXXX" />
                      <input required type="text" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="w-full px-5 py-4 bg-[#1a1a1a] border border-white/5 rounded-2xl font-black text-white text-xs" placeholder="ID-001" />
                    </div>
                  )}
                </>
              )}
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-5 py-4 bg-[#1a1a1a] border border-white/5 rounded-2xl font-bold text-white outline-none text-xs" placeholder="seu@email.com" />
              <div className="relative">
                <input required type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-5 py-4 bg-[#1a1a1a] border border-white/5 rounded-2xl font-bold text-white outline-none text-xs" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
              {isRegistering && <input required type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-5 py-4 bg-[#1a1a1a] border border-white/5 rounded-2xl font-bold text-white outline-none text-xs" placeholder="Repetir Senha" />}

              {error && <div className="bg-red-500/10 text-red-400 p-4 rounded-2xl border border-red-500/20 text-[10px] font-black uppercase">{error}</div>}
              {success && <div className="bg-emerald-500/10 text-emerald-400 p-4 rounded-2xl border border-emerald-500/20 text-[10px] font-black uppercase">{success}</div>}

              <button disabled={isLoading} type="submit" className="w-full py-5 rounded-2xl text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 bg-gradient-to-r from-teal-500 to-indigo-600">
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : (isRegistering ? 'Criar Conta' : 'Entrar')}
              </button>
            </form>

            <button onClick={() => setIsRegistering(!isRegistering)} className="w-full mt-8 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">
              {isRegistering ? 'Já possuo uma conta' : 'Ainda não tem conta? Clique aqui'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
