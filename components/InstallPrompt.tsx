
import React, { useEffect, useState } from 'react';
import { Download, X, Share, PlusSquare } from 'lucide-react';

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detectar se já está instalado (Standalone mode)
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                               (window.navigator as any).standalone || 
                               document.referrer.includes('android-app://');
    
    setIsStandalone(isInStandaloneMode);

    // Detectar iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Handler para Android/Desktop (Chrome/Edge)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Só mostra se não estiver instalado
      if (!isInStandaloneMode) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Mostrar prompt iOS apenas se não estiver instalado
    if (isIosDevice && !isInStandaloneMode) {
      // Pequeno delay para não ser intrusivo
      setTimeout(() => setShowPrompt(true), 3000);
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
    <div className="fixed bottom-4 left-4 right-4 z-[1000] animate-in slide-in-from-bottom-6 duration-500">
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-white/10 flex flex-col gap-4 relative">
        <button 
          onClick={() => setShowPrompt(false)} 
          className="absolute top-2 right-2 p-1 text-slate-400 hover:text-white transition"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-4 pr-6">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
             {/* Ícone simplificado para o prompt */}
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white"><path d="M12 12c0-3 2.5-5.5 5.5-5.5S23 9 23 12M12 12c0 3 2.5 5.5 5.5 5.5S23 14.5 23 12M12 12V2M16.5 4.5C17.5 7 19 10 19 12M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8"/></svg>
          </div>
          <div>
            <h4 className="font-bold text-sm">Instalar VeroPonto</h4>
            <p className="text-xs text-slate-300 mt-0.5">Adicione à tela inicial para acesso rápido e offline.</p>
          </div>
        </div>

        {isIOS ? (
          <div className="text-xs bg-white/10 p-3 rounded-xl space-y-2">
            <p className="flex items-center gap-2"><Share size={14} /> 1. Toque em Compartilhar</p>
            <p className="flex items-center gap-2"><PlusSquare size={14} /> 2. Selecione "Adicionar à Tela de Início"</p>
          </div>
        ) : (
          <button 
            onClick={handleInstallClick}
            className="w-full py-3 bg-white text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition active:scale-95 flex items-center justify-center gap-2"
          >
            <Download size={16} /> Instalar Agora
          </button>
        )}
      </div>
    </div>
  );
};

export default InstallPrompt;
