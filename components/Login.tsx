
import React, { useState } from 'react';
import { supabase, StorageService } from '../services/storage';
import { 
  Lock, 
  Mail, 
  MapPin,
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
  Fingerprint
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
      {/* Background Glows */}
      <div className="absolute top-[10%] left-[20%] w-[400px] h-[400px] bg-teal-500/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[10%] right-[20%] w-[400px] h-[400px] bg-indigo-600/10 blur-[120px] rounded-full"></div>
      
      <div className="max-w-[420px] w-full mx-auto space-y-10 relative z-10">
        {/* Logo Section */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-indigo-600 rounded-[1.4rem] flex items-center justify-center shadow-[0_0_30px_rgba(20,184,166,0.3)]">
               <div className="relative">
                 <MapPin size={32} className="text-white" />
                 <Clock size={14} className="text-white absolute bottom-[-4px] right-[-4px] bg-black rounded-full" />
               </div>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter">Geo<span className="text-indigo-400">Point</span></h1>
          </div>
        </div>

        <div className="bg-[#111111] rounded-[2.5rem] shadow-2xl border border-white/5 overflow-hidden">
          {isRegistering && (
            <div className="flex bg-black/40 border-b border-white/5">
              <button 
                onClick={() => setRegType('manager')}
                className={`flex-1 py-4 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${regType === 'manager' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-slate-600'}`}
              >
                <Building2 size={14} /> Cadastrar Empresa
              </button>
              <button 
                onClick={() => setRegType('employee')}
                className={`flex-1 py-4 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${regType === 'employee' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-slate-600'}`}
              >
                <Users size={14} /> Sou Colaborador
              </button>
            </div>
          )}

          <div className="p-8 sm:p-10">
            <div className="mb-8 text-center">
              <h2 className="text-xl font-black text-white tracking-tight">
                {isRegistering ? 'Criar nova conta' : 'Bem-vindo de volta'}
              </h2>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-1">
                {isRegistering ? 'Preencha seus dados de acesso' : 'Entre com suas credenciais para acessar'}
              </p>
            </div>

            <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
              {isRegistering && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                    <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-5 py-4 bg-[#1a1a1a] border border-white/5 rounded-2xl font-bold text-white focus:border-teal-500 transition-all outline-none text-xs" placeholder="Seu nome" />
                  </div>
                  
                  {regType === 'employee' && (
                    <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                       <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cód. Empresa</label>
                        <input required type="text" value={workspaceId} onChange={(e) => setWorkspaceId(e.target.value.toUpperCase())} className="w-full px-5 py-4 bg-[#1a1a1a] border border-white/5 rounded-2xl font-black text-white focus:border-teal-500 transition-all outline-none text-xs" placeholder="GEO-XXXX" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Matrícula</label>
                        <input required type="text" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="w-full px-5 py-4 bg-[#1a1a1a] border border-white/5 rounded-2xl font-black text-white focus:border-teal-500 transition-all outline-none text-xs" placeholder="001" />
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-5 py-4 bg-[#1a1a1a] border border-white/5 rounded-2xl font-bold text-white focus:border-teal-500 transition-all outline-none text-xs" placeholder="seu@email.com" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha</label>
                <div className="relative">
                  <input required type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-5 py-4 bg-[#1a1a1a] border border-white/5 rounded-2xl font-bold text-white focus:border-teal-500 transition-all outline-none text-xs" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {isRegistering && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Repetir Senha</label>
                  <input required type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-5 py-4 bg-[#1a1a1a] border border-white/5 rounded-2xl font-bold text-white focus:border-teal-500 transition-all outline-none text-xs" placeholder="••••••••" />
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 text-red-400 p-4 rounded-2xl flex flex-col gap-3 border border-red-500/20 animate-in shake">
                  <div className="flex items-center gap-3">
                    <AlertCircle size={18} className="shrink-0" />
                    <p className="text-[10px] font-black uppercase leading-tight">{error}</p>
                  </div>
                  {isFkeyError && retryUserId && (
                    <button type="button" onClick={() => trySaveProfile(retryUserId)} className="w-full py-3 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase">Sincronizar Agora</button>
                  )}
                </div>
              )}

              {success && (
                <div className="bg-emerald-500/10 text-emerald-400 p-4 rounded-2xl flex items-center gap-3 border border-emerald-500/20">
                  <CheckCircle2 size={18} />
                  <p className="text-[10px] font-black uppercase tracking-widest">{success}</p>
                </div>
              )}

              <button 
                disabled={isLoading} 
                type="submit" 
                className={`w-full py-5 rounded-2xl text-white font-black text-xs uppercase tracking-[0.2em] shadow-[0_10px_25px_rgba(20,184,166,0.2)] transition-all flex items-center justify-center gap-3 active:scale-95 ${isLoading ? 'bg-slate-700' : 'bg-gradient-to-r from-teal-500 to-indigo-600 hover:brightness-110'}`}
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : (isRegistering ? 'Criar Minha Conta' : 'Entrar')}
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-white/5 text-center">
              <button 
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError(null);
                  setSuccess(null);
                  setRetryUserId(null);
                  setIsFkeyError(false);
                }} 
                className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
              >
                {isRegistering ? 'Já possuo uma conta de acesso' : 'Ainda não tem uma conta?'}
              </button>
              
              {!isRegistering && (
                 <button 
                    onClick={() => { setIsRegistering(true); setRegType('manager'); }}
                    className="w-full mt-4 py-4 border border-white/5 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                 >
                    <Building2 size={16} /> Cadastrar minha empresa
                 </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
