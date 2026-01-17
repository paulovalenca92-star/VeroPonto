
import React, { useEffect, useState } from 'react';
import { Download, X, Share, PlusSquare, Fingerprint, Shield } from 'lucide-react';

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Verifica se já está rodando como APP instalado
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                               (window.navigator as any).standalone || 
                               document.referrer.includes('android-app://');
    
    setIsStandalone(isInStandaloneMode);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Evento disparado pelo Chrome quando o app é instalável
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Mostra o prompt se não estiver em standalone
      if (!isInStandaloneMode) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // No iOS, mostramos após um pequeno delay para não incomodar o usuário imediatamente
    if (isIosDevice && !isInStandaloneMode) {
      const timer = setTimeout(() => setShowPrompt(true), 4000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 z-[9999] animate-in slide-in-from-bottom-10 duration-700">
      <div className="bg-[#111827] text-white p-6 rounded-[2.5rem] shadow-[0_30px_70px_rgba(0,0,0,0.9)] border border-white/10 flex flex-col gap-6 relative overflow-hidden">
        {/* Glow de fundo */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 blur-[60px] rounded-full"></div>
        
        <button 
          onClick={() => setShowPrompt(false)} 
          className="absolute top-5 right-5 p-2 text-slate-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-5 pr-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#2DD4BF] to-[#4F46E5] rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-lg shadow-teal-500/20 relative overflow-hidden">
             <Shield size={30} className="text-white fill-white/10 relative z-10" />
             <Fingerprint size={14} className="text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-60 z-20" />
          </div>
          <div className="space-y-0.5">
            <h4 className="font-extrabold text-lg tracking-tight">Instalar GeoPoint</h4>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">Adicione à tela inicial para acesso rápido, seguro e offline.</p>
          </div>
        </div>

        {isIOS ? (
          <div className="text-[10px] font-black uppercase tracking-[0.15em] bg-white/5 p-5 rounded-2xl space-y-3 text-slate-300 border border-white/5">
            <p className="flex items-center gap-3"><Share size={18} className="text-[#2DD4BF]" /> 1. Toque em "Compartilhar"</p>
            <p className="flex items-center gap-3"><PlusSquare size={18} className="text-[#2DD4BF]" /> 2. "Adicionar à Tela de Início"</p>
          </div>
        ) : (
          <button 
            onClick={handleInstallClick}
            className="w-full py-5 bg-white text-slate-950 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.25em] hover:bg-slate-100 transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-xl"
          >
            <Download size={20} /> INSTALAR AGORA
          </button>
        )}
      </div>
    </div>
  );
};

export default InstallPrompt;
