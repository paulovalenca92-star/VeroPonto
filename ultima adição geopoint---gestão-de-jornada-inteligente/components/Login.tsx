
import React, { useState, useEffect } from 'react';
import { supabase, StorageService } from '../services/storage';
import { 
  Shield, 
  Fingerprint, 
  Loader2, 
  Eye,
  EyeOff,
  Zap,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Globe,
  Camera,
  MapPin
} from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
  initialMode?: 'login' | 'register';
  onCancel?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, initialMode = 'login', onCancel }) => {
  const [isRegistering, setIsRegistering] = useState(initialMode === 'register');
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

  useEffect(() => {
    setIsRegistering(initialMode === 'register');
  }, [initialMode]);

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
      // Login normal, não define flag de novo usuário
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
        
        // SINALIZA PARA O APP QUE ESTE É UM NOVO CADASTRO
        sessionStorage.setItem('geopoint_new_user', 'true');
        
        setSuccess("Conta criada! Preparando seu acesso...");
        setTimeout(() => onLoginSuccess(), 1500);
      }
    } catch (err: any) {
      setError(translateError(err.message));
      setIsLoading(false);
    }
  };

  const benefits = [
    { icon: <Camera size={14} />, text: "Biometria Facial Verificada" },
    { icon: <MapPin size={14} />, text: "Geolocalização em Tempo Real" },
    { icon: <Shield size={14} />, text: "Segurança Jurídica Total" }
  ];

  return (
    <div className="min-h-[100dvh] bg-[#050505] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Luzes de Fundo (Atmospheric Lighting) */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[150px] rounded-full"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-teal-500/10 blur-[150px] rounded-full"></div>
      
      <div className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10 animate-in fade-in zoom-in-95 duration-1000">
        
        {/* Lado Esquerdo: Branding e Diferenciais */}
        <div className="hidden lg:flex flex-col space-y-12 pr-12">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-[#2DD4BF] to-[#4F46E5] rounded-[2rem] flex items-center justify-center shadow-[0_15px_40px_rgba(79,70,229,0.25)] border border-white/10">
               <Shield size={38} className="text-white fill-white/10" />
            </div>
            <div>
              <h1 className="text-6xl font-black text-white tracking-tighter italic leading-none">GeoPoint</h1>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2">Enterprise Cloud v2.4</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-5xl font-black text-white leading-[1.1] tracking-tight">
              A inteligência que seu <br/> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-500 italic">departamento pessoal</span> precisava.
            </h2>
            <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-md">
              Acompanhe sua equipe em tempo real com segurança jurídica e tecnologia de biometria avançada.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 pt-4">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-5 text-slate-300 group">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-teal-400 border border-white/5 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                  {b.icon}
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">{b.text}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-10 pt-10 border-t border-white/5">
             <div className="flex items-center gap-3 opacity-40">
                <Globe size={18} className="text-slate-400" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">Rede Global AWS</span>
             </div>
             <div className="flex items-center gap-3 opacity-40">
                <Lock size={18} className="text-slate-400" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">Criptografia Militar</span>
             </div>
          </div>
        </div>

        {/* Lado Direito: Formulário (Card Pro) */}
        <div className="w-full max-w-[460px] mx-auto">
          {/* Mobile Logo */}
          <div className="flex lg:hidden flex-col items-center justify-center gap-4 mb-12">
            <div className="w-20 h-20 bg-gradient-to-br from-[#2DD4BF] to-[#4F46E5] rounded-[2rem] flex items-center justify-center shadow-2xl border border-white/10">
               <Shield size={32} className="text-white" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter italic">GeoPoint</h1>
          </div>

          <div className="bg-[#0D0D0D]/90 backdrop-blur-3xl rounded-[4rem] border border-white/5 shadow-[0_50px_100px_rgba(0,0,0,0.8)] p-10 sm:p-14 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
            
            <div className="text-center space-y-3 mb-12">
              <h3 className="text-3xl font-black text-white tracking-tight">
                {isRegistering ? 'Nova Empresa' : 'Bem-vindo'}
              </h3>
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.5em]">
                {isRegistering ? 'SOLUÇÃO CORPORATIVA' : 'ACESSO AO PAINEL'}
              </p>
            </div>

            <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-5">
              {isRegistering && (
                <>
                  <div className="flex bg-white/5 rounded-2xl p-1.5 mb-8 border border-white/5">
                    <button type="button" onClick={() => setRegType('manager')} className={`flex-1 py-3 text-[9px] font-black uppercase rounded-xl transition-all ${regType === 'manager' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500'}`}>Sou Gestor</button>
                    <button type="button" onClick={() => setRegType('employee')} className={`flex-1 py-3 text-[9px] font-black uppercase rounded-xl transition-all ${regType === 'employee' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500'}`}>Sou Membro</button>
                  </div>
                  
                  <div className="space-y-3">
                    <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-7 py-5 bg-white/5 border border-white/5 rounded-2xl font-bold text-white text-sm outline-none focus:border-indigo-600/50 transition-all placeholder:text-slate-700" placeholder="Seu Nome Completo" />
                    
                    {regType === 'employee' && (
                      <div className="grid grid-cols-2 gap-3">
                        <input required type="text" value={workspaceId} onChange={(e) => setWorkspaceId(e.target.value.toUpperCase())} className="w-full px-5 py-5 bg-white/5 border border-white/5 rounded-2xl font-black text-white text-xs outline-none focus:border-indigo-600/50 placeholder:text-slate-800" placeholder="ID EMPRESA" />
                        <input required type="text" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="w-full px-5 py-5 bg-white/5 border border-white/5 rounded-2xl font-black text-white text-xs outline-none focus:border-indigo-600/50 placeholder:text-slate-800" placeholder="MATRÍCULA" />
                      </div>
                    )}
                  </div>
                </>
              )}
              
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-7 py-5 bg-white/5 border border-white/5 rounded-2xl font-bold text-white text-sm outline-none focus:border-indigo-600/50 transition-all placeholder:text-slate-700" placeholder="Email Corporativo" />
              
              <div className="relative">
                <input required type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-7 py-5 bg-white/5 border border-white/5 rounded-2xl font-bold text-white text-sm outline-none focus:border-indigo-600/50 transition-all placeholder:text-slate-700" placeholder="Senha de Acesso" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-700 hover:text-white transition-colors">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {isRegistering && (
                <input required type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-7 py-5 bg-white/5 border border-white/5 rounded-2xl font-bold text-white text-sm outline-none focus:border-indigo-600/50 transition-all placeholder:text-slate-700" placeholder="Confirmar Senha" />
              )}

              {!isRegistering && (
                <div className="text-right px-4">
                  <button type="button" className="text-[9px] font-black text-slate-600 uppercase tracking-widest hover:text-indigo-400 transition-colors">Esqueci a senha?</button>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 text-red-500 p-5 rounded-3xl border border-red-500/10 text-[10px] font-black uppercase text-center tracking-widest animate-in shake-x duration-500">
                  {error}
                </div>
              )}
              
              <button 
                disabled={isLoading} 
                type="submit" 
                className="w-full py-6 bg-gradient-to-r from-teal-500 to-indigo-600 rounded-[2.2rem] text-white font-black text-xs uppercase tracking-[0.4em] shadow-[0_20px_40px_rgba(79,70,229,0.3)] active:scale-[0.97] transition-all flex items-center justify-center gap-3 mt-8 hover:brightness-110"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : (isRegistering ? 'CONCLUIR REGISTRO' : 'ENTRAR NO SISTEMA')}
              </button>
            </form>

            <div className="text-center mt-10">
              <button 
                onClick={() => { setIsRegistering(!isRegistering); setError(null); }} 
                className="group inline-flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] hover:text-white transition-colors"
              >
                {isRegistering ? 'JÁ POSSUI CONTA? LOGIN' : 'NOVA EMPRESA? CADASTRE-SE'}
                <Zap size={14} className="group-hover:text-amber-500 transition-colors duration-500" />
              </button>
            </div>
          </div>
          
          <p className="text-center text-[9px] font-black text-slate-700 uppercase tracking-[0.8em] mt-12">
            GEOPONT &copy; 2025 ALL RIGHTS RESERVED
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
