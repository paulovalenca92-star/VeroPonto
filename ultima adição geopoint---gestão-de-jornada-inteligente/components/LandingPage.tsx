
import React from 'react';
import { 
  Shield, 
  Fingerprint, 
  MapPin, 
  Zap, 
  Smartphone, 
  BarChart3, 
  ChevronRight, 
  CheckCircle2,
  Lock,
  Users,
  Building2
} from 'lucide-react';

interface LandingPageProps {
  onStart: (mode: 'login' | 'register') => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-[#2DD4BF]/30">
      {/* Header / Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-[100] border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-gradient-to-br from-[#2DD4BF] to-[#4F46E5] p-2 rounded-xl">
                <Shield size={22} className="text-white" />
             </div>
             <span className="text-xl font-black tracking-tighter">GeoPoint</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Tecnologia</a>
            <a href="#security" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Segurança</a>
            <a href="#plans" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Planos</a>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => onStart('login')}
              className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
            >
              Entrar
            </button>
            <button 
              onClick={() => onStart('register')}
              className="px-6 py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all shadow-xl shadow-white/5 active:scale-95"
            >
              Começar Agora
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 px-6 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#2DD4BF]/5 blur-[100px] rounded-full"></div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-4 animate-in fade-in slide-in-from-top-4 duration-1000">
            <Zap size={12} className="text-[#2DD4BF]" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Plataforma Cloud v2.4 Disponível</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] text-white animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
            Gestão de Jornada <br/>
            <span className="bg-gradient-to-r from-[#2DD4BF] via-indigo-400 to-[#4F46E5] bg-clip-text text-transparent italic">Inteligente.</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-slate-400 text-lg md:text-xl font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
            Controle de ponto com geolocalização precisa e biometria facial. 
            Segurança jurídica total para sua empresa e mobilidade para seu time.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-700">
            <button 
              onClick={() => onStart('register')}
              className="w-full sm:w-auto px-10 py-6 bg-gradient-to-r from-[#2DD4BF] to-indigo-600 rounded-[2rem] text-white font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-2xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              Criar minha Empresa <ChevronRight size={18} />
            </button>
            <button 
              onClick={() => onStart('login')}
              className="w-full sm:w-auto px-10 py-6 bg-white/5 border border-white/10 rounded-[2rem] text-white font-black text-xs uppercase tracking-[0.3em] hover:bg-white/10 transition-all"
            >
              Acessar Painel
            </button>
          </div>

          <div className="pt-20 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-40 grayscale animate-in fade-in duration-1000 delay-1000">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black tabular-nums">1.2M+</span>
              <span className="text-[8px] font-black uppercase tracking-widest mt-1">Registros/Mês</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black tabular-nums">450+</span>
              <span className="text-[8px] font-black uppercase tracking-widest mt-1">Empresas</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black tabular-nums">100%</span>
              <span className="text-[8px] font-black uppercase tracking-widest mt-1">Cloud Nativo</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black tabular-nums">0%</span>
              <span className="text-[8px] font-black uppercase tracking-widest mt-1">Fraude Facial</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black tracking-tighter">Tecnologia de ponta a ponta</h2>
            <p className="text-slate-500 font-medium max-w-xl mx-auto">Tudo o que você precisa para uma gestão moderna, eliminando papéis e processos lentos.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                icon: <Fingerprint size={32} />, 
                title: "Biometria Facial", 
                desc: "Captura obrigatória de selfie no momento do registro para auditoria visual instantânea." 
              },
              { 
                icon: <MapPin size={32} />, 
                title: "Geofencing", 
                desc: "Cerca virtual que valida se o colaborador está dentro do raio permitido pela empresa." 
              },
              { 
                icon: <Smartphone size={32} />, 
                title: "App PWA", 
                desc: "Não ocupa espaço no celular. Funciona como um app nativo, direto no navegador do usuário." 
              },
              { 
                icon: <Smartphone size={32} />, 
                title: "QR Code Dinâmico", 
                desc: "Gere códigos exclusivos para cada unidade física. Registro por presença confirmada." 
              },
              { 
                icon: <BarChart3 size={32} />, 
                title: "Relatórios PDF", 
                desc: "Folha de ponto mensal gerada em segundos com assinatura digital do colaborador." 
              },
              { 
                icon: <Building2 size={32} />, 
                title: "Multi-Unidades", 
                desc: "Gerencie diversas sedes, filiais ou locais de obras em um único painel administrativo." 
              }
            ].map((f, i) => (
              <div key={i} className="bg-[#0A0A0A] p-10 rounded-[3rem] border border-white/5 hover:border-[#2DD4BF]/30 transition-all group">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-[#2DD4BF] transition-all mb-8">
                  {f.icon}
                </div>
                <h3 className="text-xl font-black mb-4">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security CTA */}
      <section id="security" className="py-32 px-6">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-[#111111] to-black rounded-[4rem] p-12 md:p-20 border border-white/10 relative overflow-hidden text-center md:text-left flex flex-col md:flex-row items-center gap-12 shadow-2xl">
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 text-indigo-400 bg-indigo-500/10 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
              <CheckCircle2 size={12} /> Compliance Jurídico
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
              Pronto para as <br/>
              normativas do RH.
            </h2>
            <p className="text-slate-400 text-lg font-medium leading-relaxed">
              Nossa plataforma foi desenhada seguindo as melhores práticas de auditoria digital, garantindo que cada batida de ponto seja imutável e verificável.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-sm font-bold text-slate-200">
                <Lock size={16} className="text-[#2DD4BF]" /> Criptografia de Ponta a Ponta
              </li>
              <li className="flex items-center gap-3 text-sm font-bold text-slate-200">
                <Lock size={16} className="text-[#2DD4BF]" /> Logs de Auditoria SHA-256
              </li>
              <li className="flex items-center gap-3 text-sm font-bold text-slate-200">
                <Lock size={16} className="text-[#2DD4BF]" /> Armazenamento Seguro Cloud
              </li>
            </ul>
          </div>
          
          <div className="w-full md:w-80 space-y-6">
            <div className="bg-white/5 p-8 rounded-[3rem] border border-white/10 space-y-6">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                <Users size={24} />
              </div>
              <p className="text-xs text-slate-400 font-medium text-center italic">"Reduzimos nossas falhas de registro em 94% nos primeiros 3 meses."</p>
              <div className="text-center">
                <p className="font-black text-xs">Carlos M.</p>
                <p className="text-[9px] text-slate-600 uppercase tracking-widest font-black">Diretor de Operações</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/5 bg-[#030303]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="space-y-4 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
               <div className="bg-white/10 p-2 rounded-xl">
                  <Shield size={20} className="text-white" />
               </div>
               <span className="text-lg font-black tracking-tighter">GeoPoint</span>
            </div>
            <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em]">Gestão de Jornada Inteligente</p>
          </div>
          
          <div className="flex gap-12">
            <div className="space-y-4">
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Plataforma</p>
               <ul className="space-y-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  <li className="hover:text-[#2DD4BF] transition-colors cursor-pointer">Funcionalidades</li>
                  <li className="hover:text-[#2DD4BF] transition-colors cursor-pointer">Segurança</li>
                  <li className="hover:text-[#2DD4BF] transition-colors cursor-pointer">Mobile</li>
               </ul>
            </div>
            <div className="space-y-4">
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Empresa</p>
               <ul className="space-y-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  <li className="hover:text-[#2DD4BF] transition-colors cursor-pointer">Sobre</li>
                  <li className="hover:text-[#2DD4BF] transition-colors cursor-pointer">Contato</li>
                  <li className="hover:text-[#2DD4BF] transition-colors cursor-pointer">Privacidade</li>
               </ul>
            </div>
          </div>

          <div className="text-center md:text-right space-y-4">
            <button 
              onClick={() => onStart('register')}
              className="px-8 py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
            >
              Começar Teste Grátis
            </button>
            <p className="text-[9px] text-slate-700 font-black uppercase tracking-widest">&copy; 2025 GeoPoint System. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
