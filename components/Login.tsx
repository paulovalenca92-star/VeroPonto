
import React, { useState } from 'react';
import { supabase, StorageService } from '../services/storage';
import { 
  Lock, 
  Mail, 
  Fingerprint, 
  AlertCircle, 
  Loader2, 
  User as UserIcon, 
  Hash,
  Eye,
  EyeOff,
  CheckCircle2,
  Building,
  Users as UsersIcon,
  ChevronRight
} from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [role, setRole] = useState<'admin' | 'employee'>('employee');
  const [showPassword, setShowPassword] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const translateError = (msg: string) => {
    if (msg.includes('security purposes')) return 'Aguarde alguns segundos antes de tentar novamente (segurança).';
    if (msg.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
    if (msg.includes('User already registered')) return 'Este e-mail já está cadastrado.';
    if (msg.includes('Password should be at least 6 characters')) return 'A senha deve ter pelo menos 6 caracteres.';
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

    if (role === 'employee' && !workspaceId) {
      setError("Colaboradores precisam do ID da Empresa.");
      setIsLoading(false);
      return;
    }

    try {
      // 1. Criar usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } }
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Definir o Workspace ID
        const finalWorkspaceId = role === 'admin' 
          ? `VERO-${Math.random().toString(36).substring(2, 7).toUpperCase()}` 
          : workspaceId.toUpperCase();

        // 3. Salvar no banco
        await StorageService.saveUser({
          id: authData.user.id,
          email,
          name,
          employeeId: role === 'admin' ? 'GESTOR' : employeeId,
          role: role,
          workspaceId: finalWorkspaceId,
          createdAt: Date.now()
        });
        
        setSuccess(role === 'admin' 
          ? `Empresa registrada! Código: ${finalWorkspaceId}` 
          : "Cadastro realizado com sucesso!");
        
        // Pequeno atraso para o usuário ver a mensagem e garantir que o DB salvou
        setTimeout(() => {
          setIsLoading(false); // Libera o botão
          onLoginSuccess();    // Notifica o App.tsx
        }, 2000);
      }
    } catch (err: any) {
      setError(translateError(err.message));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
      
      <div className="max-w-md w-full mx-auto space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <Fingerprint size={48} className="text-indigo-400 mx-auto" />
          <h1 className="text-3xl font-black text-white tracking-tighter">Vero<span className="text-indigo-500">Ponto</span></h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.4em]">Multi-Tenant HR Cloud</p>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-slate-100">
          {!isRegistering ? (
            <h2 className="text-xl font-black text-slate-800 text-center mb-6">Acesso ao Sistema</h2>
          ) : (
            <div className="flex bg-slate-50 p-1.5 rounded-2xl mb-8 border border-slate-100">
              <button 
                type="button"
                onClick={() => setRole('employee')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${role === 'employee' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
              >
                <UsersIcon size={14} /> Colaborador
              </button>
              <button 
                type="button"
                onClick={() => setRole('admin')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${role === 'admin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
              >
                <Building size={14} /> Sou Empresa
              </button>
            </div>
          )}

          {isRegistering && (
            <h2 className="text-xl font-black text-slate-800 text-center mb-6">
              {role === 'admin' ? 'Registrar Empresa' : 'Cadastro de Colaborador'}
            </h2>
          )}

          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
            {isRegistering && (
              <>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border-slate-100 border rounded-xl font-semibold text-slate-800" placeholder="Ex: João Silva" />
                  </div>
                </div>
                
                {role === 'employee' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Código da Empresa (Workspace)</label>
                      <div className="relative">
                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input required type="text" value={workspaceId} onChange={(e) => setWorkspaceId(e.target.value.toUpperCase())} className="w-full pl-12 pr-4 py-3 bg-indigo-50 border-indigo-100 border rounded-xl font-black text-indigo-600 uppercase" placeholder="VERO-XXXXX" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Sua Matrícula</label>
                      <div className="relative">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input required type="text" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border-slate-100 border rounded-xl font-semibold text-slate-800" placeholder="001-ABC" />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border-slate-100 border rounded-xl font-semibold text-slate-800" placeholder="email@empresa.com" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input required type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-12 pr-12 py-3 bg-slate-50 border-slate-100 border rounded-xl font-semibold text-slate-800" placeholder="******" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </div>

            {isRegistering && (
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Repetir Senha</label>
                <input required type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border-slate-100 border rounded-xl font-semibold text-slate-800" />
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2 border border-red-100 animate-in fade-in slide-in-from-top-1 duration-300">
                <AlertCircle size={14} className="shrink-0" />
                <p className="text-[9px] font-black uppercase leading-tight">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl flex items-center gap-2 border border-emerald-100 animate-in fade-in slide-in-from-top-1 duration-300">
                <CheckCircle2 size={14} className="shrink-0" />
                <p className="text-[9px] font-black uppercase leading-tight">{success}</p>
              </div>
            )}

            <button 
              disabled={isLoading} 
              type="submit" 
              className={`w-full py-4 rounded-xl text-white font-black text-[11px] uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 ${isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'}`}
            >
              {isLoading ? (
                <><Loader2 className="animate-spin" size={18} /> Processando...</>
              ) : (
                isRegistering ? 'Finalizar Cadastro' : 'Entrar no Sistema'
              )}
            </button>
          </form>

          <button 
            type="button"
            disabled={isLoading}
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError(null);
              setSuccess(null);
            }} 
            className="w-full mt-6 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-500 transition-colors disabled:opacity-50"
          >
            {isRegistering ? 'Já tenho uma conta corporativa' : 'Minha empresa não tem conta? Criar Agora'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
