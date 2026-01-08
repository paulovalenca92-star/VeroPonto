
import React, { useRef, useEffect, useState } from 'react';
import { Camera, X, Check, AlertCircle } from 'lucide-react';

interface SelfieCameraProps {
  onCapture: (base64Image: string) => void;
  onCancel: () => void;
}

const SelfieCamera: React.FC<SelfieCameraProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isPhotoTaken, setIsPhotoTaken] = useState(false);
  const [capturedImg, setCapturedImg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    async function startCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Seu navegador não suporta acesso à câmera ou a conexão não é segura (Requer HTTPS).");
        }

        const constraints = { 
          video: { 
            facingMode: 'user', 
            width: { ideal: 640 }, 
            height: { ideal: 640 } 
          }, 
          audio: false 
        };

        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(currentStream);

        if (videoRef.current) {
          videoRef.current.srcObject = currentStream;
          // Garante que o vídeo toque em dispositivos iOS
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
        }
      } catch (err: any) {
        console.error("Erro ao abrir câmera:", err);
        setError(err.name === 'NotAllowedError' ? "Acesso à câmera negado. Por favor, libere nas configurações do navegador." : err.message);
      }
    }

    startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        // Captura o frame atual do vídeo
        context.drawImage(videoRef.current, 0, 0, 480, 480);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
        setCapturedImg(dataUrl);
        setIsPhotoTaken(true);
      }
    }
  };

  const confirmPhoto = () => {
    if (capturedImg) onCapture(capturedImg);
  };

  if (error) {
    return (
      <div className="fixed inset-0 z-[200] bg-slate-900 flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-white/10 p-6 rounded-[2.5rem] border border-white/10 space-y-4 max-w-sm">
          <AlertCircle size={48} className="text-red-400 mx-auto" />
          <h3 className="text-white text-xl font-bold">Problema com a Câmera</h3>
          <p className="text-slate-400 text-sm leading-relaxed">{error}</p>
          <button 
            onClick={onCancel}
            className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-sm"
          >
            VOLTAR E TENTAR NOVAMENTE
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900 flex flex-col items-center justify-between py-12 px-6 overflow-hidden">
      <div className="text-center space-y-2">
        <h3 className="text-white text-2xl font-black tracking-tight">Identificação Facial</h3>
        <p className="text-indigo-200/60 text-sm font-medium">Posicione seu rosto dentro da moldura</p>
      </div>

      <div className="relative w-72 h-72 sm:w-80 sm:h-80">
        {/* Elementos de UI de Scanner */}
        <div className="absolute inset-0 border-[4px] border-indigo-500/40 rounded-full z-10 animate-pulse"></div>
        <div className="absolute -inset-4 border border-dashed border-indigo-400/20 rounded-full animate-spin-slow"></div>
        
        <div className="w-full h-full rounded-full overflow-hidden bg-slate-800 shadow-2xl relative border-4 border-white/5">
          {!isPhotoTaken ? (
            <video 
              ref={videoRef} 
              autoPlay 
              muted
              playsInline 
              className="w-full h-full object-cover scale-x-[-1]"
            />
          ) : (
            <img src={capturedImg!} className="w-full h-full object-cover scale-x-[-1]" />
          )}
          <canvas ref={canvasRef} width="480" height="480" className="hidden" />
        </div>
        
        {!isPhotoTaken && (
          <div className="absolute top-1/2 left-0 w-full h-[1.5px] bg-indigo-400/50 shadow-[0_0_15px_rgba(99,102,241,0.6)] animate-scan z-20"></div>
        )}
      </div>

      <div className="w-full max-w-xs space-y-4">
        {!isPhotoTaken ? (
          <button 
            onClick={takePhoto}
            className="w-full py-5 bg-white text-indigo-700 rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
          >
            <Camera size={24} />
            CAPTURAR FOTO
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            <button 
              onClick={confirmPhoto}
              className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-lg flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              <Check size={24} /> CONFIRMAR PONTO
            </button>
            <button 
              onClick={() => setIsPhotoTaken(false)}
              className="w-full py-3 text-slate-400 font-bold text-xs uppercase tracking-[0.2em]"
            >
              Tentar Novamente
            </button>
          </div>
        )}
        
        <button 
          onClick={onCancel}
          className="w-full text-slate-500 font-bold py-2 text-[10px] uppercase tracking-widest"
        >
          Cancelar Registro
        </button>
      </div>

      <style>{`
        @keyframes scan {
          0%, 100% { top: 15%; opacity: 0.2; }
          50% { top: 85%; opacity: 1; }
        }
        .animate-scan {
          animation: scan 2.5s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: rotate 12s linear infinite;
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SelfieCamera;
