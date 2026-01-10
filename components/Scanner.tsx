import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, QrCode as QrIcon, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

interface ScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ onScan, onClose }) => {
  const [status, setStatus] = useState<'initializing' | 'scanning' | 'error'>('initializing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // ID único para garantir que o DOM seja fresco a cada montagem
  const elementId = useRef(`qr-reader-${Math.random().toString(36).substr(2, 9)}`).current;
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    let scannerInstance: Html5Qrcode | null = null;

    const startScanner = async () => {
      // Delay para garantir que o modal abriu e o DOM existe
      await new Promise(r => setTimeout(r, 300));
      
      if (!isMountedRef.current) return;

      const element = document.getElementById(elementId);
      if (!element) {
        console.error("Scanner element not found");
        return;
      }

      try {
        // Limpa qualquer instância residual
        try {
            if (scannerRef.current) {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            }
        } catch (e) { /* ignore cleanup errors */ }

        scannerInstance = new Html5Qrcode(elementId, {
            verbose: false,
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
        });
        
        scannerRef.current = scannerInstance;

        await scannerInstance.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            disableFlip: false
          },
          (decodedText) => {
            if (isMountedRef.current) {
               // Callback de sucesso
               // Pausa imediatamente para evitar múltiplas leituras
               if (scannerInstance?.isScanning) {
                   scannerInstance.pause(true);
               }
               onScan(decodedText);
            }
          },
          () => { /* ignore frame errors */ }
        );

        if (isMountedRef.current) {
            setStatus('scanning');
        } else {
            // Se desmontou durante o start, aborta
            cleanup(scannerInstance);
        }

      } catch (err: any) {
        console.error("Scanner Start Error:", err);
        if (isMountedRef.current) {
          setStatus('error');
          if (err.name === 'NotAllowedError' || err.message?.includes('Permission')) {
             setErrorMessage("Acesso à câmera negado.");
          } else if (err.name === 'NotFoundError') {
             setErrorMessage("Câmera não encontrada.");
          } else {
             setErrorMessage("Erro ao iniciar câmera.");
          }
        }
      }
    };

    startScanner();

    // Função de limpeza robusta
    const cleanup = async (instance: Html5Qrcode | null) => {
        if (!instance) return;
        
        try {
            // Verifica estado interno antes de tentar parar
            // @ts-ignore - Acessando propriedade privada para verificação de segurança extra se necessário, ou confiando no try/catch
            if (instance.isScanning) {
                await instance.stop();
            }
            // Só limpa o DOM após o stop ter sucesso
            instance.clear();
        } catch (err: any) {
            console.warn("Scanner Cleanup Warning:", err);
            // Se falhar o stop, ainda tentamos limpar o DOM se o elemento existir
            try {
                if (document.getElementById(elementId)) {
                    instance.clear();
                }
            } catch (e) { /* ignore final clear error */ }
        }
    };

    return () => {
      isMountedRef.current = false;
      if (scannerRef.current) {
          // Executa limpeza desconectada do ciclo de renderização para evitar travamento
          const instance = scannerRef.current;
          scannerRef.current = null;
          cleanup(instance);
      }
    };
  }, [elementId, onScan]);

  return (
    <div className="fixed inset-0 z-[300] bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
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
             {/* Container do Vídeo */}
             <div id={elementId} className="w-full h-full bg-slate-900 rounded-[1.5rem] overflow-hidden"></div>

             {/* Overlays de Estado */}
             {status === 'initializing' && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white z-10 bg-slate-900 pointer-events-none">
                    <Loader2 size={32} className="animate-spin text-indigo-400" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Iniciando...</p>
                 </div>
             )}
             
             {status === 'scanning' && (
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div className="w-48 h-48 border-2 border-indigo-500 rounded-2xl animate-pulse shadow-[0_0_20px_rgba(99,102,241,0.5)]"></div>
                 </div>
             )}
             
             {status === 'error' && (
                <div className="absolute inset-0 flex items-center justify-center p-6 bg-slate-900 z-20 text-center">
                    <div className="space-y-4">
                        <AlertCircle size={40} className="text-red-500 mx-auto" />
                        <p className="text-white text-xs font-bold uppercase leading-relaxed">{errorMessage}</p>
                        <button onClick={() => window.location.reload()} className="px-6 py-3 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 mx-auto hover:bg-slate-200 transition">
                            <RefreshCw size={14} /> Recarregar
                        </button>
                    </div>
                </div>
             )}
          </div>
          
          <div className="mt-6 space-y-2 text-center">
             <p className="text-white font-bold text-[10px] uppercase tracking-widest">Escaneie o QR Code</p>
             <p className="text-slate-400 text-[9px] font-medium leading-relaxed italic px-4">
                Aponte para o código da unidade.
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