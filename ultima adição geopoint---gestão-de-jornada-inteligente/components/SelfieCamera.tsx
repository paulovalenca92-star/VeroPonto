
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
    
    // Pequeno delay para garantir que a WebView processe a permissão de hardware
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Câmera não suportada ou permissão ausente.");
      }

      const constraints = { 
        video: { 
          facingMode: 'user', 
          width: { ideal: 1280 }, // Aumentando a resolução ideal para melhor qualidade
          height: { ideal: 720 } 
        }, 
        audio: false 
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('autoplay', 'true');
        videoRef.current.setAttribute('muted', 'true');
        videoRef.current.setAttribute('playsinline', 'true');
        
        try {
          await videoRef.current.play();
        } catch (e) {
          console.warn("Auto-play interrompido pela WebView", e);
        }
      }
      setIsInitializing(false);
    } catch (err: any) {
      console.error("Erro Câmera APK:", err);
      const msg = err.name === 'NotAllowedError' ? "Permissão negada. Ative a câmera nas configurações." : "Erro ao carregar hardware da câmera.";
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
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        // Ajustamos o canvas para as dimensões REAIS que o vídeo está entregando
        // Isso evita que a foto fique esticada/espremida (larga)
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Desenha o frame atual do vídeo no canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Converte para base64 com boa qualidade
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
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
        
        {/* Guia Circular */}
        <div className="absolute inset-0 border-[4px] border-indigo-500/40 rounded-full z-10 animate-pulse pointer-events-none"></div>
        
        <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 shadow-2xl relative border-4 border-white/10">
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
            <img 
              src={capturedImg!} 
              className="w-full h-full object-cover scale-x-[-1]" 
              alt="Preview"
            />
          )}
          {/* Canvas invisível para processamento */}
          <canvas ref={canvasRef} className="hidden" />
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
