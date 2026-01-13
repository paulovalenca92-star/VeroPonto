import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, X, Check, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

interface SelfieCameraProps {
  onCapture: (base64Image: string) => void;
  onCancel: () => void;
}

const SelfieCamera: React.FC<SelfieCameraProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isPhotoTaken, setIsPhotoTaken] = useState(false);
  const [capturedImg, setCapturedImg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    setIsInitializing(true);
    setError(null);
    
    // Pequeno delay de 500ms para garantir que a WebView processe a permissão de hardware
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Câmera não suportada ou permissão ausente.");
      }

      // Resolução 480p (640x480) é a mais estável para WebViews em APKs (WebIntoApp)
      const constraints = { 
        video: { 
          facingMode: 'user', 
          width: { ideal: 640 }, 
          height: { ideal: 480 } 
        }, 
        audio: false 
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Atributos forçados programaticamente para garantir funcionamento no Android WebView
        videoRef.current.setAttribute('autoplay', 'true');
        videoRef.current.setAttribute('muted', 'true');
        videoRef.current.setAttribute('playsinline', 'true');
        
        try {
          // Garante que o vídeo comece a rodar
          await videoRef.current.play();
        } catch (e) {
          console.warn("Auto-play interrompido pela WebView, tentando novamente...", e);
        }
      }
      setIsInitializing(false);
    } catch (err: any) {
      console.error("Erro Câmera APK:", err);
      const msg = err.name === 'NotAllowedError' ? "Permissão negada. Ative a câmera nas configurações do Android." : "Erro ao carregar hardware da câmera.";
      setError(msg);
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, 640, 480);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
        setCapturedImg(dataUrl);
        setIsPhotoTaken(true);
      }
    }
  };

  if (error) {
    return (
      <div className="fixed inset-0 z-[2000] bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-white/5 p-8 rounded-[3rem] border border-white/10 space-y-6 max-w-sm shadow-2xl">
          <AlertCircle size={48} className="text-red-500 mx-auto" />
          <h3 className="text-white text-xl font-black">Câmera não responde</h3>
          <p className="text-slate-400 text-sm font-medium leading-relaxed">{error}</p>
          <div className="space-y-3 pt-2">
            <button onClick={startCamera} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
              <RefreshCw size={16} /> Tentar Novamente
            </button>
            <button onClick={onCancel} className="w-full py-4 text-slate-500 font-black text-xs uppercase tracking-widest">Sair</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-950 flex flex-col items-center justify-between py-12 px-6 overflow-hidden h-[100dvh]">
      <div className="text-center space-y-2 mt-4 safe-top">
        <h3 className="text-white text-2xl font-black tracking-tight">Selfie do Ponto</h3>
        <p className="text-indigo-200/60 text-sm font-medium">Enquadre seu rosto</p>
      </div>

      <div className="relative w-[75vw] h-[75vw] max-w-[320px] max-h-[320px]">
        {isInitializing && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900 rounded-full border-4 border-white/5 animate-pulse">
            <Loader2 size={40} className="text-indigo-500 animate-spin mb-3" />
            <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">Iniciando Câmera...</p>
          </div>
        )}
        
        <div className="absolute inset-0 border-[4px] border-indigo-500/40 rounded-full z-10 animate-pulse"></div>
        <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 shadow-2xl relative border-4 border-white/5">
          {!isPhotoTaken ? (
            <video 
              ref={videoRef} 
              autoPlay={true}
              muted={true}
              playsInline={true}
              controls={false}
              // @ts-ignore
              disablePictureInPicture={true}
              className="w-full h-full object-cover scale-x-[-1]"
            />
          ) : (
            <img src={capturedImg!} className="w-full h-full object-cover scale-x-[-1]" />
          )}
          <canvas ref={canvasRef} width="640" height="480" className="hidden" />
        </div>
      </div>

      <div className="w-full max-w-xs space-y-4 safe-bottom mb-4">
        {!isPhotoTaken ? (
          <button 
            disabled={isInitializing}
            onClick={takePhoto} 
            className="w-full py-5 bg-white text-indigo-700 rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all disabled:opacity-50"
          >
            <Camera size={24} /> CAPTURAR
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            <button onClick={() => onCapture(capturedImg!)} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-lg flex items-center justify-center gap-2 shadow-lg">
              <Check size={24} /> CONFIRMAR
            </button>
            <button onClick={() => setIsPhotoTaken(false)} className="w-full py-3 text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">
              Tentar Novamente
            </button>
          </div>
        )}
        <button onClick={onCancel} className="w-full text-slate-500 font-bold py-2 text-[10px] uppercase tracking-widest">Cancelar</button>
      </div>
    </div>
  );
};

export default SelfieCamera;