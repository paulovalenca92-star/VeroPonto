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
    let isMounted = true;

    async function startCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Câmera não suportada neste navegador.");
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
        
        if (isMounted) {
            setStream(currentStream);
            if (videoRef.current) {
              videoRef.current.srcObject = currentStream;
            }
        } else {
            currentStream.getTracks().forEach(track => track.stop());
        }
      } catch (err: any) {
        console.error("Erro Câmera:", err);
        if (isMounted) {
            const msg = err.name === 'NotAllowedError' ? "Permissão de câmera negada." : "Erro ao acessar câmera.";
            setError(msg);
            // Alerta amigável para WebView/APK conforme solicitado
            alert(`${msg} O VeroPonto precisa de acesso à câmera para realizar a verificação por selfie. Verifique as permissões nas configurações do seu dispositivo.`);
        }
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current) {
          videoRef.current.srcObject = null;
      }
    };
  }, []);

  const handleVideoLoaded = () => {
    if (videoRef.current) {
        videoRef.current.play().catch(e => console.log("Play interrompido"));
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
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
      <div className="fixed inset-0 z-[2000] bg-slate-900 flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-white/10 p-6 rounded-[2.5rem] border border-white/10 space-y-4 max-w-sm">
          <AlertCircle size={48} className="text-red-400 mx-auto" />
          <h3 className="text-white text-xl font-bold">Erro na Câmera</h3>
          <p className="text-slate-400 text-sm leading-relaxed">{error}</p>
          <button onClick={onCancel} className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-sm">VOLTAR</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-900 flex flex-col items-center justify-between py-12 px-6 overflow-hidden h-[100dvh]">
      <div className="text-center space-y-2 mt-4 safe-top">
        <h3 className="text-white text-2xl font-black tracking-tight">Selfie do Ponto</h3>
        <p className="text-indigo-200/60 text-sm font-medium">Enquadre seu rosto</p>
      </div>

      <div className="relative w-[70vw] h-[70vw] max-w-[320px] max-h-[320px]">
        <div className="absolute inset-0 border-[4px] border-indigo-500/40 rounded-full z-10 animate-pulse"></div>
        <div className="w-full h-full rounded-full overflow-hidden bg-slate-800 shadow-2xl relative border-4 border-white/5">
          {!isPhotoTaken ? (
            <video 
              ref={videoRef} 
              autoPlay 
              muted
              playsInline 
              onLoadedMetadata={handleVideoLoaded}
              className="w-full h-full object-cover scale-x-[-1]"
            />
          ) : (
            <img src={capturedImg!} className="w-full h-full object-cover scale-x-[-1]" />
          )}
          <canvas ref={canvasRef} width="480" height="480" className="hidden" />
        </div>
      </div>

      <div className="w-full max-w-xs space-y-4 safe-bottom mb-4">
        {!isPhotoTaken ? (
          <button onClick={takePhoto} className="w-full py-5 bg-white text-indigo-700 rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
            <Camera size={24} /> CAPTURAR
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            <button onClick={confirmPhoto} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-lg flex items-center justify-center gap-2 shadow-lg">
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