
import React, { useState, useEffect, useCallback } from 'react';
import { User, TimeRecord, PunchType, Location } from '../types';
import { StorageService } from '../services/storage';
import SelfieCamera from './SelfieCamera';
import Scanner from './Scanner';
import RecordDetailsModal from './RecordDetailsModal';
import MonthlyReport from './MonthlyReport';
import { 
  History, 
  ArrowUpCircle, 
  ArrowDownCircle,
  Clock,
  Loader2,
  Camera,
  AlertTriangle,
  QrCode,
  ChevronDown,
  ShieldCheck,
  FileText
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
  const [showReport, setShowReport] = useState(false);
  const [activeLocation, setActiveLocation] = useState<Location | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentCoords, setCurrentCoords] = useState<{lat: number, lng: number} | null>(null);
  const [visibleCount, setVisibleCount] = useState(5);
  const [distanceInfo, setDistanceInfo] = useState<{ meters: number; isFar: boolean } | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<TimeRecord | null>(null);

  const loadUserRecords = useCallback(async (silent = false) => {
    if (!silent) setLoadingHistory(true);
    try {
      const userRecords = await StorageService.getRecords(user.workspaceId, user.id);
      setRecords(userRecords || []);
    } catch (e) {
      console.error("Erro ao carregar histórico:", e);
    } finally {
      setLoadingHistory(false);
    }
  }, [user.workspaceId, user.id]);

  useEffect(() => {
    loadUserRecords();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    const getInitialGPS = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCurrentCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("Erro GPS:", err.message),
        { enableHighAccuracy: false, timeout: 10000 }
      );
    };
    getInitialGPS();

    return () => clearInterval(timer);
  }, [user.id, loadUserRecords]);

  const getPreciseLocation = useCallback((): Promise<GeolocationPosition> => {
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
  }, []);

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

  const handleScanSuccess = useCallback(async (decodedText: string) => {
    setIsScanning(false);
    setIsProcessing(true);
    
    try {
      const locations = await StorageService.getLocations(user.workspaceId);
      const foundLocation = locations.find(l => l.code === decodedText || l.id === decodedText);
      
      if (foundLocation) {
        setActiveLocation(foundLocation);
        if (foundLocation.latitude && foundLocation.longitude) {
          try {
            const pos = await getPreciseLocation();
            const dist = calculateDistance(pos.coords.latitude, pos.coords.longitude, foundLocation.latitude!, foundLocation.longitude!);
            const isFar = dist > 400; 
            setDistanceInfo({ meters: Math.round(dist), isFar });
          } catch (e) {}
        }
        setIsCapturing(true);
      } else {
        setMessage({ text: "Este QR Code não pertence à sua empresa.", type: 'error' });
      }
    } catch (err) {
      setMessage({ text: "Erro ao validar unidade.", type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  }, [user.workspaceId, getPreciseLocation]);

  const finalizePunch = useCallback(async (selfieBase64: string) => {
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
    } catch (err: any) { 
      setMessage({ text: "Erro ao salvar o ponto. Verifique sua conexão.", type: 'error' }); 
    } finally { 
      setIsProcessing(false); 
      setActiveLocation(null); 
      setDistanceInfo(null); 
      setTimeout(() => setMessage(null), 6000); 
    }
  }, [user, activeLocation, distanceInfo, getPreciseLocation, loadUserRecords]);

  return (
    <div className="max-w-md mx-auto flex flex-col gap-6 animate-in fade-in duration-500 pb-24">
      
      {isProcessing && (
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-[#121212] p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-4 border border-white/5">
            <Loader2 size={40} className="text-[#2DD4BF] animate-spin" />
            <p className="text-xs font-black uppercase tracking-widest text-white">Validando Jornada...</p>
          </div>
        </div>
      )}

      {/* Header do Dashboard com gradiente Teal-Indigo */}
      <div className="bg-[#121212] rounded-[3rem] p-10 shadow-2xl border border-white/5 text-center relative overflow-hidden transition-all ring-2 ring-[#2DD4BF]/10">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2DD4BF] to-[#4F46E5]"></div>
        
        <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mb-2">Olá, {user.name.split(' ')[0]}</p>
        <h2 className="text-6xl font-black text-white tabular-nums tracking-tighter mb-2">
          {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </h2>
        <p className="text-[#2DD4BF] font-black text-[10px] uppercase tracking-[0.25em]">
          {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
        </p>

        <div className="mt-6 flex flex-col items-center gap-2">
            {currentCoords ? (
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2DD4BF]/10 text-[#2DD4BF] text-[9px] font-black uppercase tracking-widest border border-[#2DD4BF]/20">
                    <ShieldCheck size={12} /> Localização Protegida
                </span>
            ) : (
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase tracking-widest border border-amber-500/20 animate-pulse">
                    <Loader2 size={12} className="animate-spin" /> Sincronizando GPS...
                </span>
            )}
        </div>
      </div>

      {/* Botões de Ação Principais */}
      <div className="grid grid-cols-1 gap-4">
        <button 
          disabled={isProcessing}
          onClick={handleStartDirectPunch}
          className="group w-full py-7 bg-[#1A1A1A] border border-white/5 text-white rounded-[2.5rem] font-black shadow-xl transition-all flex items-center justify-between px-10 hover:bg-[#222] active:scale-95 disabled:opacity-50"
        >
          <div className="flex flex-col items-start gap-1">
            <span className="tracking-[0.2em] uppercase text-xs">Registro Remoto</span>
            <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider">Home Office / Externo</span>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl text-slate-400 group-hover:text-[#2DD4BF] transition-colors">
            <Camera size={22} />
          </div>
        </button>

        <button 
          disabled={isProcessing}
          onClick={handleStartQRScan}
          className="group w-full py-7 bg-gradient-to-r from-[#2DD4BF] to-[#4F46E5] text-white rounded-[2.5rem] font-black shadow-2xl transition-all flex items-center justify-between px-10 active:scale-95 disabled:opacity-50"
        >
          <div className="flex flex-col items-start gap-1">
            <span className="tracking-[0.25em] uppercase text-xs">Validar Presença</span>
            <span className="text-[9px] text-white/50 font-black uppercase tracking-wider">Escanear QR Unidade</span>
          </div>
          <div className="p-3 bg-black/10 rounded-2xl">
            {isProcessing ? <Loader2 size={22} className="animate-spin" /> : <QrCode size={22} />}
          </div>
        </button>

        <button 
          onClick={() => setShowReport(true)}
          className="group w-full py-5 bg-[#121212] border border-[#2DD4BF]/20 text-[#2DD4BF] rounded-[2rem] font-black shadow-lg transition-all flex items-center justify-center gap-3 px-8 hover:bg-[#2DD4BF]/5 active:scale-95"
        >
          <FileText size={18} />
          <span className="tracking-[0.2em] uppercase text-[10px]">Gerar Folha Mensal Assinada</span>
        </button>
      </div>

      {message && (
        <div className={`p-5 rounded-3xl flex items-center gap-4 shadow-2xl animate-in slide-in-from-top-4 border ${
          message.type === 'success' ? 'bg-[#0F1A16] text-[#2DD4BF] border-[#2DD4BF]/20' : 
          message.type === 'error' ? 'bg-[#1A0F0F] text-red-500 border-red-500/20' :
          'bg-[#1A180F] text-amber-500 border-amber-500/20'
        }`}>
          <div className={`p-2 rounded-xl ${message.type === 'success' ? 'bg-[#2DD4BF]/10' : 'bg-red-500/10'}`}>
            <AlertTriangle size={20} className="shrink-0" />
          </div>
          <p className="font-black text-[10px] uppercase tracking-widest leading-relaxed">{message.text}</p>
        </div>
      )}

      {/* Histórico Estilizado */}
      <div className="bg-[#121212] rounded-[2.5rem] shadow-2xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
          <h3 className="font-black text-slate-500 text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
            <History size={14} className="text-[#2DD4BF]" /> Histórico Recente
          </h3>
          {loadingHistory && <Loader2 size={14} className="animate-spin text-[#2DD4BF]" />}
        </div>
        
        <div className="divide-y divide-white/5">
          {records.slice(0, visibleCount).map(record => (
            <div 
                key={record.id} 
                onClick={() => setSelectedRecord(record)}
                className="p-6 flex items-center justify-between transition-colors hover:bg-white/5 cursor-pointer active:scale-[0.98]"
            >
              <div className="flex items-center gap-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${record.type === 'entry' ? 'bg-[#2DD4BF]/10 text-[#2DD4BF]' : 'bg-white/5 text-slate-500'}`}>
                  {record.type === 'entry' ? <ArrowDownCircle size={22} /> : <ArrowUpCircle size={22} />}
                </div>
                <div>
                  <p className="font-black text-[11px] uppercase tracking-widest text-white">
                    {record.type === 'entry' ? 'Entrada' : 'Saída'}
                  </p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase truncate max-w-[150px] mt-0.5">
                    {record.locationName?.split('(')[0]}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-white text-base tabular-nums tracking-tighter">
                  {new Date(record.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                  {new Date(record.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {records.length === 0 && !loadingHistory && (
             <div className="p-16 text-center space-y-4 opacity-20">
                <Clock className="mx-auto" size={40} />
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Nenhum Registro Localizado</p>
             </div>
          )}
        </div>
        
        {visibleCount < records.length && (
            <button onClick={() => setVisibleCount(prev => prev + 5)} className="w-full py-5 text-slate-500 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-white/5 transition-all flex items-center justify-center gap-3 border-t border-white/5">
                <ChevronDown size={14} /> Carregar mais registros
            </button>
        )}
      </div>

      {isScanning && <Scanner onScan={handleScanSuccess} onClose={() => setIsScanning(false)} />}
      {isCapturing && <SelfieCamera onCapture={finalizePunch} onCancel={() => { setIsCapturing(false); setActiveLocation(null); setDistanceInfo(null); }} />}

      {selectedRecord && (
        <RecordDetailsModal 
          record={selectedRecord} 
          onClose={() => setSelectedRecord(null)} 
          isPro={true}
        />
      )}

      {showReport && (
        <MonthlyReport 
          user={user}
          records={records}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
};

export default EmployeeDashboard;
