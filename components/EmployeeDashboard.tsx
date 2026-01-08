
import React, { useState, useEffect } from 'react';
import { User, TimeRecord, PunchType, Location } from '../types';
import { StorageService } from '../services/storage';
import SelfieCamera from './SelfieCamera';
import Scanner from './Scanner';
import { 
  History, 
  CheckCircle2, 
  ArrowUpCircle, 
  ArrowDownCircle,
  Clock,
  MapPin,
  Loader2,
  Camera,
  AlertTriangle,
  Locate,
  QrCode,
  Smartphone
} from 'lucide-react';

interface EmployeeDashboardProps {
  user: User;
}

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ user }) => {
  const [records, setRecords] = useState<TimeRecord[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [activeLocation, setActiveLocation] = useState<Location | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadUserRecords();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [user.id, user.workspaceId]);

  const loadUserRecords = async () => {
    setLoadingHistory(true);
    const userRecords = await StorageService.getRecords(user.workspaceId, user.id);
    setRecords(userRecords);
    setLoadingHistory(false);
  };

  const handleStartQRScan = () => {
    setMessage(null);
    setIsScanning(true);
  };

  const handleStartDirectPunch = () => {
    setMessage(null);
    setActiveLocation(null);
    setIsCapturing(true);
  };

  const handleScanSuccess = async (decodedText: string) => {
    const locations = await StorageService.getLocations(user.workspaceId);
    const foundLocation = locations.find(l => l.code === decodedText || l.id === decodedText);

    if (foundLocation) {
      setActiveLocation(foundLocation);
      setIsScanning(false);
      setIsCapturing(true);
    } else {
      setMessage({ text: "Este QR Code não pertence à sua empresa.", type: 'error' });
      setIsScanning(false);
    }
  };

  const finalizePunch = async (selfieBase64: string) => {
    setIsCapturing(false);
    setIsProcessing(true);

    let coords: { latitude: number; longitude: number } | undefined;
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      coords = { latitude: position.coords.latitude, longitude: position.coords.longitude };
    } catch (err) {
      console.warn("GPS não capturado.");
    }

    const lastRecord = await StorageService.getLastRecord(user.workspaceId, user.id);
    const punchType: PunchType = !lastRecord || lastRecord.type === 'exit' ? 'entry' : 'exit';

    const newRecord: TimeRecord = {
      id: `rec-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      employeeId: user.employeeId,
      workspaceId: user.workspaceId,
      type: punchType,
      timestamp: Date.now(),
      locationCode: activeLocation?.code || 'MANUAL-APP',
      locationName: activeLocation?.name || 'Registro em Nuvem',
      photo: selfieBase64,
      coords: coords
    };

    try {
      await StorageService.addRecord(newRecord);
      await loadUserRecords();
      setMessage({ 
        text: `Ponto de ${punchType === 'entry' ? 'Entrada' : 'Saída'} confirmado na empresa ${user.workspaceId}!`, 
        type: 'success' 
      });
    } catch (err) {
      setMessage({ text: "Erro ao sincronizar ponto.", type: 'error' });
    } finally {
      setIsProcessing(false);
      setActiveLocation(null);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  return (
    <div className="max-w-md mx-auto flex flex-col gap-6 animate-in fade-in duration-500 pb-12">
      
      <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-slate-100 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-indigo-600 px-4 py-1.5 rounded-bl-2xl text-[8px] font-black text-white uppercase tracking-widest">
          Cloud ID: {user.workspaceId}
        </div>
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-1">Olá, {user.name.split(' ')[0]}</p>
        <h2 className="text-5xl font-black text-slate-800 tabular-nums tracking-tighter">
          {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          <span className="text-xl font-light text-slate-300 ml-1">{currentTime.toLocaleTimeString('pt-BR', { second: '2-digit' })}</span>
        </h2>
        <p className="text-slate-300 font-bold mt-1 text-[10px] uppercase tracking-widest">
          {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <button 
          disabled={isProcessing}
          onClick={handleStartDirectPunch}
          className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black shadow-xl transition-all flex items-center justify-between px-8 hover:bg-indigo-700 active:scale-95"
        >
          <div className="flex flex-col items-start gap-1">
            <span className="tracking-widest uppercase text-sm">Registro Biométrico</span>
            <span className="text-[9px] opacity-70 font-medium uppercase tracking-wider">Identificação por Selfie</span>
          </div>
          <Camera size={24} />
        </button>

        <button 
          disabled={isProcessing}
          onClick={handleStartQRScan}
          className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black shadow-xl transition-all flex items-center justify-between px-8 hover:bg-black active:scale-95"
        >
          <div className="flex flex-col items-start gap-1">
            <span className="tracking-widest uppercase text-sm">Validar Unidade</span>
            <span className="text-[9px] opacity-50 font-medium uppercase tracking-wider">QR Code Localização</span>
          </div>
          <QrCode size={24} />
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 shadow-lg animate-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-slate-900 text-white' : 'bg-red-500 text-white'}`}>
          {message.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-400" /> : <AlertTriangle size={18} />}
          <p className="font-bold text-[10px] uppercase tracking-widest">{message.text}</p>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-50 flex items-center justify-between">
          <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-widest flex items-center gap-2">
            <History size={12} /> Seus Registros
          </h3>
          {loadingHistory && <Loader2 size={12} className="animate-spin text-slate-300" />}
        </div>
        
        <div className="divide-y divide-slate-50">
          {records.slice(0, 5).map(record => (
            <div key={record.id} className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${record.type === 'entry' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                  {record.type === 'entry' ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
                </div>
                <div>
                  <p className="font-black text-slate-800 text-[10px] uppercase">{record.type === 'entry' ? 'Entrada' : 'Saída'}</p>
                  <p className="text-[8px] font-bold text-slate-300 uppercase truncate max-w-[120px]">{record.locationName}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-slate-800 text-sm tabular-nums tracking-tighter">
                  {new Date(record.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-[8px] font-black text-slate-300 uppercase">{new Date(record.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</p>
              </div>
            </div>
          ))}
          {!loadingHistory && records.length === 0 && (
            <div className="py-12 text-center text-slate-200 uppercase font-black text-[9px] tracking-widest">Sem atividades registradas</div>
          )}
        </div>
      </div>

      {isScanning && <Scanner onScan={handleScanSuccess} onClose={() => setIsScanning(false)} />}
      {isCapturing && <SelfieCamera onCapture={finalizePunch} onCancel={() => { setIsCapturing(false); setActiveLocation(null); }} />}
    </div>
  );
};

export default EmployeeDashboard;
