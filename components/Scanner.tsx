import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, QrCode as QrIcon, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

interface ScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ onScan, onClose }) => {
  const [status, setStatus] = useState<'initializing' | 'scanning' | 'error'>('initializing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const elementId = useRef(`qr-reader-${Math.random().toString(36).substr(2, 9)}`).current;
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStarted = useRef(false);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const startScanner = useCallback(async () => {
    if (isStarted.current) return;
    setStatus('initializing');
    setErrorMessage(null);
    
    // Delay de 500ms essencial para que a WebView do Android libere o hardware após a permissão
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const element = document.getElementById(elementId);
    if (!element) return;

    try {
      const scannerInstance = new Html5Qrcode(elementId, {
          verbose: false,
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
      });
      
      scannerRef.current = scannerInstance;

      // Injeta atributos no vídeo via MutationObserver assim que a lib criar o elemento
      const observer = new MutationObserver(() => {
          const video = element.querySelector('video');
          if (video) {
              video.setAttribute('autoplay', 'true');
              video.setAttribute('muted', 'true');
              video.setAttribute('playsinline', 'true');
              video.removeAttribute('controls');
              // @ts-ignore
              video.disablePictureInPicture = true;
          }
      });
      observer.observe(element, { childList: true, subtree: true });

      await scannerInstance.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          disableFlip: false,
          // Força resolução 480p para evitar que a WebView do APK trave em telas pretas
          videoConstraints: {
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        },
        (decodedText) => {
          if (isStarted.current) {
             isStarted.current = false;
             scannerInstance?.stop().then(() => {
               onScanRef.current(decodedText);
             }).catch(() => {
               onScanRef.current(decodedText);
             });
          }
        },
        () => { /* ignore frame errors */ }
      );

      isStarted.current = true;
      setStatus('scanning');

    } catch (err: any) {
      console.error("Scanner APK Error:", err);
      setStatus('error');
      const msg = err.name === 'NotAllowedError' ? "Acesso negado. Verifique as permissões de câmera do Android." : "Erro ao carregar câmera de unidade.";
      setErrorMessage(msg);
    }
  }, [elementId]);

  useEffect(() => {
    startScanner();
    return () => {
      if (scannerRef.current && isStarted.current) {
        const instance = scannerRef.current;
        isStarted.current = false;
        instance.stop().then(() => instance.clear()).catch(e => console.debug(e));
      }
    };
  }, [elementId, startScanner]);

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-white rounded-[3rem] overflow-hidden shadow-2xl relative">
        <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <QrIcon size={20} />
            <h3 className="font-black text-xs uppercase tracking-widest">Validar Unidade</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-8 bg-black relative min-h-[350px] flex flex-col">
          <div className="w-full flex-1 overflow-hidden rounded-[2rem] border-4 border-white/10 relative bg-slate-900 min-h-[250px]">
             <div id={elementId} className="w-full h-full bg-slate-900 rounded-[1.5rem] overflow-hidden"></div>

             {(status === 'initializing') && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white z-10 bg-slate-900 pointer-events-none">
                    <Loader2 size={32} className="animate-spin text-indigo-400" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Iniciando câmera...</p>
                 </div>
             )}
             
             {status === 'error' && (
                <div className="absolute inset-0 flex items-center justify-center p-6 bg-slate-900 z-20 text-center">
                    <div className="space-y-4">
                        <AlertCircle size={40} className="text-red-500 mx-auto" />
                        <p className="text-white text-[10px] font-bold uppercase leading-relaxed px-4">{errorMessage}</p>
                        <button onClick={startScanner} className="px-6 py-3 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 mx-auto">
                            <RefreshCw size={14} /> Tentar Novamente
                        </button>
                    </div>
                </div>
             )}
          </div>
          
          <div className="mt-6 space-y-2 text-center">
             <p className="text-white font-bold text-[10px] uppercase tracking-widest">Escaneie o QR Code</p>
             <p className="text-slate-400 text-[9px] font-medium leading-relaxed italic px-4">
                Aponte para o código da unidade fixado no local.
             </p>
          </div>
        </div>
      </div>
      
      <button onClick={onClose} className="mt-8 text-white/50 hover:text-white font-black text-[10px] uppercase tracking-[0.3em] transition-all">
        Cancelar
      </button>

      <style>{`
        #${elementId} video { 
            object-fit: cover; 
            border-radius: 1.5rem; 
            width: 100% !important; 
            height: 100% !important; 
        }
      `}</style>
    </div>
  );
};

export default Scanner;