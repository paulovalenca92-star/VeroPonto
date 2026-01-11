
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
  Smartphone,
  X,
  Navigation,
  ChevronDown,
  ShieldCheck,
  Award,
  ChevronRight,
  Info,
  User as UserIcon,
  ExternalLink
} from 'lucide-react';

interface EmployeeDashboardProps {
  user: User;
  isPro?: boolean;
}

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ user, isPro }) => {
  const [records, setRecords] = useState<TimeRecord[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [activeLocation, setActiveLocation] = useState<Location | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentCoords, setCurrentCoords] = useState<{lat: number, lng: number} | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(5);
  const [distanceInfo, setDistanceInfo] = useState<{ meters: number; isFar: boolean } | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<TimeRecord | null>(null);

  useEffect(() => {
    loadUserRecords();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    const getInitialGPS = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
            setCurrentCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setGpsError(null);
        },
        (err) => {
            console.warn("Erro GPS:", err.message);
            setGpsError(err.code === 1 ? "Permissão Negada" : "Erro de Sinal");
        },
        { enableHighAccuracy: false, timeout: 10000 }
      );
    };
    getInitialGPS();

    return () => clearInterval(timer);
  }, [user.id]);

  const loadUserRecords = async () => {
    setLoadingHistory(true);
    const userRecords = await StorageService.getRecords(user.workspaceId, user.id);
    setRecords(userRecords);
    setLoadingHistory(false);
  };

  const getPreciseLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, (err) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 30000
        });
      }, {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0
      });
    });
  };

  const handleStartQRScan = () => {
    setMessage(null);
    setDistanceInfo(null);
    setIsScanning(true);
  };

  const handleStartDirectPunch = () => {
    setMessage(null);
    setActiveLocation(null);
    setDistanceInfo(null);
    setIsCapturing(true);
  };

  const handleScanSuccess = async (decodedText: string) => {
    const locations = await StorageService.getLocations(user.workspaceId);
    const foundLocation = locations.find(l => l.code === decodedText || l.id === decodedText);
    
    if (foundLocation) {
      setActiveLocation(foundLocation);
      setIsScanning(false);
      setIsProcessing(true);

      try {
        if (foundLocation.latitude && foundLocation.longitude) {
          const pos = await getPreciseLocation();
          const dist = calculateDistance(pos.coords.latitude, pos.coords.longitude, foundLocation.latitude!, foundLocation.longitude!);
          const isFar = dist > 400; 
          setDistanceInfo({ meters: Math.round(dist), isFar });
        }
        setIsCapturing(true);
      } catch (err) {
        setIsCapturing(true); 
      } finally {
        setIsProcessing(false);
      }
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
      const position = await getPreciseLocation();
      coords = { latitude: position.coords.latitude, longitude: position.coords.longitude };
    } catch (err) { }

    const lastRecord = await StorageService.getLastRecord(user.workspaceId, user.id);
    const punchType: PunchType = !lastRecord || lastRecord.type === 'exit' ? 'entry' : 'exit';
    
    let finalLocationName = activeLocation?.name || 'Registro Remoto';
    if (distanceInfo?.isFar) {
      finalLocationName += ` (Afastado: ${distanceInfo.meters}m)`;
    }

    const newRecord: TimeRecord = {
      id: `rec-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      employeeId: user.employeeId,
      workspaceId: user.workspaceId,
      type: punchType,
      timestamp: Date.now(),
      locationCode: activeLocation?.code || 'MANUAL-APP',
      locationName: finalLocationName,
      photo: selfieBase64,
      coords: coords
    };

    try {
      await StorageService.addRecord(newRecord);
      await loadUserRecords();
      setMessage({ text: `Ponto de ${punchType === 'entry' ? 'Entrada' : 'Saída'} confirmado!`, type: 'success' });
    } catch (err) { 
      setMessage({ text: "Erro ao salvar. Verifique sua conexão.", type: 'error' }); 
    } finally { 
      setIsProcessing(false); 
      setActiveLocation(null); 
      setDistanceInfo(null); 
      setTimeout(() => setMessage(null), 5000); 
    }
  };

  return (
    <div className="max-w-md mx-auto flex flex-col gap-6 animate-in fade-in duration-500 pb-12">
      <div className={`bg-white dark:bg-slate-900 rounded-[3rem] p-8 shadow-sm border border-slate-100 dark:border-white/5 text-center relative overflow-hidden transition-all ${isPro ? 'ring-2 ring-amber-500/20' : ''}`}>
        <div className={`absolute top-0 left-0 right-0 h-1 ${isPro ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400' : 'bg-indigo-600'}`}></div>
        
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-1 mt-2">Olá, {user.name.split(' ')[0]}</p>
        <h2 className="text-5xl font-black text-slate-800 dark:text-white tabular-nums tracking-tighter">
          {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </h2>
        <p className={`${isPro ? 'text-amber-500' : 'text-indigo-500'} font-bold mt-1 text-[10px] uppercase tracking-widest`}>
          {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
        </p>

        <div className="mt-4 flex flex-col items-center gap-2">
            {currentCoords ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 text-[9px] font-bold uppercase tracking-wide border border-emerald-100 dark:border-emerald-500/20">
                    <ShieldCheck size={10} /> GPS Vinculado
                </span>
            ) : gpsError ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 text-[9px] font-bold uppercase tracking-wide border border-red-100 dark:border-red-500/20">
                    <AlertTriangle size={10} /> {gpsError}
                </span>
            ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 text-[9px] font-bold uppercase tracking-wide border border-amber-100 dark:border-amber-500/20 animate-pulse">
                    <Loader2 size={10} className="animate-spin" /> Aguardando Permissão GPS
                </span>
            )}
            {!currentCoords && !gpsError && (
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Info size={8}/> Clique em "Permitir" no aviso do navegador</p>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <button 
          disabled={isProcessing}
          onClick={handleStartDirectPunch}
          className="group w-full py-6 bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/10 text-slate-800 dark:text-white rounded-[2rem] font-black shadow-sm transition-all flex items-center justify-between px-8 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 disabled:opacity-50"
        >
          <div className="flex flex-col items-start gap-1">
            <span className="tracking-widest uppercase text-xs">Registro Remoto</span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Home Office / Externo</span>
          </div>
          <Camera size={20} className="text-slate-400" />
        </button>

        <button 
          disabled={isProcessing}
          onClick={handleStartQRScan}
          className={`group w-full py-6 rounded-[2rem] font-black shadow-xl transition-all flex items-center justify-between px-8 active:scale-95 disabled:opacity-50 ${isPro ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white' : 'bg-slate-900 text-white'}`}
        >
          <div className="flex flex-col items-start gap-1">
            <span className="tracking-widest uppercase text-xs">Escanear Unidade</span>
            <span className="text-[9px] text-white/50 font-bold uppercase tracking-wider">Validar Presença Local</span>
          </div>
          {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <QrCode size={20} />}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 shadow-lg animate-in slide-in-from-top-2 border ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
          message.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' :
          'bg-amber-50 text-amber-700 border-amber-100'
        }`}>
          <AlertTriangle size={18} className="shrink-0" />
          <p className="font-bold text-[10px] uppercase tracking-widest leading-tight">{message.text}</p>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
        <div className="p-5 border-b border-slate-50 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
          <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-widest flex items-center gap-2">
            <History size={12} /> Últimos Registros
          </h3>
        </div>
        
        <div className="divide-y divide-slate-50 dark:divide-white/5">
          {records.slice(0, visibleCount).map(record => (
            <div 
                key={record.id} 
                onClick={() => setSelectedRecord(record)}
                className="p-5 flex items-center justify-between transition-colors hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${record.type === 'entry' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                  {record.type === 'entry' ? <ArrowDownCircle size={18} /> : <ArrowUpCircle size={18} />}
                </div>
                <div>
                  <p className="font-black text-[10px] uppercase tracking-wide text-slate-800 dark:text-slate-200">
                    {record.type === 'entry' ? 'Entrada' : 'Saída'}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase truncate max-w-[140px] italic">
                    {record.locationName?.split('(')[0]}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-slate-800 dark:text-white text-sm tabular-nums tracking-tighter">
                  {new Date(record.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase">
                  {new Date(record.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {records.length === 0 && !loadingHistory && (
             <div className="p-10 text-center space-y-2 opacity-30">
                <Clock className="mx-auto" size={32} />
                <p className="text-[10px] font-black uppercase tracking-widest">Nenhum registro ainda</p>
             </div>
          )}
        </div>
        
        {visibleCount < records.length && (
            <button onClick={() => setVisibleCount(prev => prev + 5)} className="w-full py-4 text-slate-400 font-bold text-[9px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex items-center justify-center gap-2">
                <ChevronDown size={12} /> Ver Mais
            </button>
        )}
      </div>

      {isScanning && <Scanner onScan={handleScanSuccess} onClose={() => setIsScanning(false)} />}
      {isCapturing && <SelfieCamera onCapture={finalizePunch} onCancel={() => { setIsCapturing(false); setActiveLocation(null); setDistanceInfo(null); }} />}

      {selectedRecord && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-[350px] overflow-hidden shadow-2xl relative flex flex-col border border-white/5">
              <div className="p-5 border-b border-slate-50 dark:border-white/5 flex justify-between items-center">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Detalhes do Ponto</h4>
                  <button onClick={() => setSelectedRecord(null)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><X size={20}/></button>
              </div>
              <div className="p-6 text-center space-y-5">
                 <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-3xl mx-auto flex items-center justify-center overflow-hidden border-2 border-white dark:border-slate-700 shadow-lg">
                    {selectedRecord.photo ? <img src={selectedRecord.photo} className="w-full h-full object-cover" /> : <UserIcon className="text-slate-300 dark:text-slate-600" size={32} />}
                 </div>
                 <div>
                    <h2 className="text-3xl font-black text-slate-800 dark:text-white">
                        {new Date(selectedRecord.timestamp).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}
                    </h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {new Date(selectedRecord.timestamp).toLocaleDateString('pt-BR', {day:'2-digit', month:'long'})}
                    </p>
                 </div>
                 <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 text-left space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                         <div>
                            <p className="text-[8px] font-black uppercase text-slate-400 dark:text-slate-600 tracking-widest mb-1">Colaborador</p>
                            <p className="text-xs font-black text-slate-700 dark:text-slate-200 truncate">{selectedRecord.userName}</p>
                         </div>
                         <div>
                            <p className="text-[8px] font-black uppercase text-slate-400 dark:text-slate-600 tracking-widest mb-1">Matrícula</p>
                            <p className="text-xs font-black text-slate-700 dark:text-slate-200">{selectedRecord.employeeId}</p>
                         </div>
                    </div>
                    <div>
                        <p className="text-[8px] font-black uppercase text-slate-400 dark:text-slate-600 tracking-widest mb-1">Localização</p>
                        <p className="text-xs font-black text-slate-700 dark:text-slate-200">{selectedRecord.locationName}</p>
                    </div>
                 </div>
                 {selectedRecord.coords && (
                    <a href={`https://www.google.com/maps?q=${selectedRecord.coords.latitude},${selectedRecord.coords.longitude}`} target="_blank" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20">
                        Ver no Mapa <ExternalLink size={14}/>
                    </a>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
