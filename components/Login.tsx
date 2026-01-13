
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
  CheckCircle2,
  Building2,
  Users,
  RefreshCw
} from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [regType, setRegType] = useState<'manager' | 'employee'>('manager');
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
      return 'O servidor ainda não processou seu acesso. Aguarde 5 segundos e clique no botão de Sincronizar abaixo.';
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
      ? `VERO-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
      : workspaceId.toUpperCase().trim();

    try {
      let profileSaved = false;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (!profileSaved && attempts < maxAttempts) {
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
          profileSaved = true;
        } catch (profileErr: any) {
          attempts++;
          if (attempts >= maxAttempts) throw profileErr;
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      setSuccess("Cadastro concluído! Agora você já pode entrar no sistema.");
      setIsLoading(false);
      
      // Reseta o formulário e volta para o login após 3 segundos
      setTimeout(() => {
        setIsRegistering(false);
        setSuccess(null);
        setPassword('');
        setConfirmPassword('');
      }, 3500);

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
    setIsFkeyError(false);

    if (password !== confirmPassword) {
      setError("As senhas informadas não coincidem.");
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
        // Se já tem conta mas deu erro no perfil antes, tentamos logar para "resgatar"
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
    <div className="min-h-screen bg-[#0a0f1a] flex flex-col justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-blue-600/5 blur-[120px] rounded-full"></div>
      
      <div className="max-w-[480px] w-full mx-auto space-y-6 relative z-10">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-indigo-600/20 mb-4">
            <Fingerprint size={36} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter">Vero<span className="text-indigo-500">Ponto</span></h1>
          <p className="text-slate-500 font-bold text-[9px] uppercase tracking-[0.4em]">HR CLOUD PLATFORM</p>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-white/5 overflow-hidden">
          {isRegistering && (
            <div className="flex bg-slate-50 border-b">
              <button 
                onClick={() => setRegType('manager')}
                className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${regType === 'manager' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 opacity-50'}`}
              >
                <Building2 size={14} /> Nova Empresa
              </button>
              <button 
                onClick={() => setRegType('employee')}
                className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${regType === 'employee' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 opacity-50'}`}
              >
                <Users size={14} /> Sou Colaborador
              </button>
            </div>
          )}

          <div className="p-8 sm:p-10">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                {isRegistering ? (regType === 'manager' ? 'Cadastrar Empresa' : 'Criar Meu Acesso') : 'Acesso ao Sistema'}
              </h2>
              <p className="text-slate-400 text-xs font-medium mt-1">
                {isRegistering ? 'Preencha seus dados profissionais' : 'Identifique-se para registrar sua jornada'}
              </p>
            </div>

            <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
              {isRegistering && (
                <>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold text-slate-800 focus:border-indigo-500 transition-all outline-none text-xs" placeholder="Nome e Sobrenome" />
                    </div>
                  </div>
                  
                  {regType === 'employee' && (
                    <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                       <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Código Empresa</label>
                        <input required type="text" value={workspaceId} onChange={(e) => setWorkspaceId(e.target.value.toUpperCase())} className="w-full px-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-slate-800 focus:border-indigo-500 transition-all outline-none text-xs" placeholder="VERO-XXXX" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Matrícula</label>
                        <input required type="text" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-slate-800 focus:border-indigo-500 transition-all outline-none text-xs" placeholder="ID-001" />
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold text-slate-800 focus:border-indigo-500 transition-all outline-none text-xs" placeholder="seu@email.com" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input required type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-11 pr-11 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold text-slate-800 focus:border-indigo-500 transition-all outline-none text-xs" placeholder="Mínimo 6 dígitos" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-600 transition-colors">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {isRegistering && (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmar Senha</label>
                  <input required type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold text-slate-800 focus:border-indigo-500 transition-all outline-none text-xs" placeholder="Repita a senha" />
                </div>
              )}

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex flex-col gap-3 border border-red-100 animate-in fade-in zoom-in duration-200">
                  <div className="flex items-center gap-3">
                    <AlertCircle size={18} className="shrink-0" />
                    <p className="text-[10px] font-black uppercase leading-tight">{error}</p>
                  </div>
                  {isFkeyError && retryUserId && (
                    <button 
                      type="button"
                      onClick={() => trySaveProfile(retryUserId)}
                      className="w-full py-3 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 shadow-lg"
                    >
                      <RefreshCw size={14} /> Sincronizar Perfil Agora
                    </button>
                  )}
                </div>
              )}

              {success && (
                <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl flex items-center gap-3 border border-emerald-100 animate-in fade-in zoom-in">
                  <CheckCircle2 size={18} className="shrink-0" />
                  <p className="text-[10px] font-black uppercase leading-tight">{success}</p>
                </div>
              )}

              <button 
                disabled={isLoading} 
                type="submit" 
                className={`w-full py-5 rounded-2xl text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-2 ${isLoading ? 'bg-slate-400' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'}`}
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : (isRegistering ? 'Concluir Cadastro' : 'Entrar no Sistema')}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-slate-50">
              <button 
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError(null);
                  setSuccess(null);
                  setRetryUserId(null);
                  setIsFkeyError(false);
                }} 
                className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
              >
                {isRegistering ? 'Já possuo uma conta de acesso' : 'Minha empresa não tem conta? Criar agora'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
