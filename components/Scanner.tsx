
import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, X, QrCode as QrIcon } from 'lucide-react';

interface ScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ onScan, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Atraso curto para garantir que o DOM esteja pronto
    const timer = setTimeout(() => {
      try {
        scannerRef.current = new Html5QrcodeScanner(
          "reader",
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          false
        );

        scannerRef.current.render(
          (decodedText) => {
            if (scannerRef.current) {
              scannerRef.current.clear().then(() => {
                onScan(decodedText);
              }).catch(() => onScan(decodedText));
            }
          },
          () => {}
        );
      } catch (err) {
        setError("Não foi possível acessar a câmera. Verifique as permissões.");
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[300] bg-slate-900 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
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
        
        <div className="p-8">
          <div id="reader" className="w-full overflow-hidden rounded-[2rem] border-4 border-slate-50"></div>
          
          {error && (
            <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-bold uppercase text-center">
              {error}
            </div>
          )}
          
          <div className="mt-8 space-y-2 text-center">
             <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Escaneie o código da unidade</p>
             <p className="text-slate-300 text-[9px] font-medium leading-relaxed">O ponto só pode ser registrado em locais autorizados via QR Code.</p>
          </div>
        </div>
      </div>
      
      <button 
        onClick={onClose}
        className="mt-10 text-white/40 hover:text-white font-black text-[10px] uppercase tracking-[0.3em] transition-all"
      >
        Cancelar Operação
      </button>
    </div>
  );
};

export default Scanner;
