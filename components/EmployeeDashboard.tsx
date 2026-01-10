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
  Copy,
  Navigation,
  Ban,
  ChevronDown,
  Ruler,
  ShieldCheck
} from 'lucide-react';

interface EmployeeDashboardProps {
  user: User;
}

// Função utilitária para calcular distância (Haversine Formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // Raio da Terra em metros
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distância em metros
};

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ user }) => {
  const [records, setRecords] = useState<TimeRecord[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [activeLocation, setActiveLocation] = useState<Location | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentCoords, setCurrentCoords] = useState<{lat: number, lng: number} | null>(null);
  
  // Controle de paginação
  const [visibleCount, setVisibleCount] = useState(5);
  // Modal de detalhes
  const [selectedRecord, setSelectedRecord] = useState<TimeRecord | null>(null);

  // Distância calculada do local escaneado
  const [distanceInfo, setDistanceInfo] = useState<{ meters: number; isFar: boolean } | null>(null);

  useEffect(() => {
    loadUserRecords();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Tenta pegar GPS em background ao montar para agilizar
    navigator.geolocation.getCurrentPosition(
      (pos) => setCurrentCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.warn("GPS Background Error", err),
      { enableHighAccuracy: true }
    );

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
      
      // Validação de Geofencing
      if (foundLocation.latitude && foundLocation.longitude) {
        // Tenta usar coords atuais ou pede novas
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const dist = calculateDistance(
              pos.coords.latitude, 
              pos.coords.longitude, 
              foundLocation.latitude!, 
              foundLocation.longitude!
            );
            
            const isFar = dist > 300; // Limite de 300 metros
            setDistanceInfo({ meters: Math.round(dist), isFar });
            
            if (isFar) {
               setMessage({ 
                 text: `Atenção: Você está a ${Math.round(dist)}m do local cadastrado. O registro será marcado.`, 
                 type: 'warning' 
               });
            }
            setIsCapturing(true);
          },
          () => {
            // Se falhar GPS, permite mas avisa
            setIsCapturing(true);
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      } else {
        setIsCapturing(true);
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
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { 
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0 
        });
      });
      coords = { latitude: position.coords.latitude, longitude: position.coords.longitude };
    } catch (err) {
      console.warn("GPS não capturado.");
    }

    const lastRecord = await StorageService.getLastRecord(user.workspaceId, user.id);
    const punchType: PunchType = !lastRecord || lastRecord.type === 'exit' ? 'entry' : 'exit';
    
    // Adiciona flag de distância ao nome do local se necessário
    let finalLocationName = activeLocation?.name || 'Registro Remoto';
    if (distanceInfo?.isFar) {
        finalLocationName += ` (Fora do Perímetro: ${distanceInfo.meters}m)`;
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
      setMessage({ 
        text: `Ponto de ${punchType === 'entry' ? 'Entrada' : 'Saída'} confirmado!`, 
        type: 'success' 
      });
    } catch (err) {
      setMessage({ text: "Erro ao sincronizar ponto.", type: 'error' });
    } finally {
      setIsProcessing(false);
      setActiveLocation(null);
      setDistanceInfo(null);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const getRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'há menos de 1 hora';
    if (hours === 1) return 'há 1 hora';
    return `há ${hours} horas`;
  };

  return (
    <div className="max-w-md mx-auto flex flex-col gap-6 animate-in fade-in duration-500 pb-12">
      
      {/* Relógio Principal */}
      <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-slate-100 text-center relative overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
        <div className="absolute top-0 right-0 bg-slate-900 px-4 py-1.5 rounded-bl-2xl text-[8px] font-black text-white uppercase tracking-widest flex items-center gap-1">
          <Smartphone size={8} /> {user.workspaceId}
        </div>
        
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-1">Olá, {user.name.split(' ')[0]}</p>
        <h2 className="text-5xl font-black text-slate-800 tabular-nums tracking-tighter relative z-10">
          {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          <span className="text-xl font-light text-slate-300 ml-1">{currentTime.toLocaleTimeString('pt-BR', { second: '2-digit' })}</span>
        </h2>
        <p className="text-indigo-500 font-bold mt-1 text-[10px] uppercase tracking-widest">
          {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
        </p>

        {/* GPS Indicator */}
        <div className="mt-4 flex justify-center">
            {currentCoords ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-bold uppercase tracking-wide border border-emerald-100">
                    <ShieldCheck size={10} /> GPS Ativo
                </span>
            ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[9px] font-bold uppercase tracking-wide border border-amber-100 animate-pulse">
                    <Loader2 size={10} className="animate-spin" /> Buscando GPS...
                </span>
            )}
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="grid grid-cols-1 gap-4">
        <button 
          disabled={isProcessing}
          onClick={handleStartDirectPunch}
          className="group w-full py-6 bg-white border border-slate-100 text-slate-800 rounded-[2rem] font-black shadow-sm transition-all flex items-center justify-between px-8 hover:bg-indigo-50 hover:border-indigo-100 active:scale-95"
        >
          <div className="flex flex-col items-start gap-1">
            <span className="tracking-widest uppercase text-sm group-hover:text-indigo-600 transition-colors">Registro Remoto</span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Home Office / Externo</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
            <Camera size={20} className="text-slate-400 group-hover:text-indigo-600" />
          </div>
        </button>

        <button 
          disabled={isProcessing}
          onClick={handleStartQRScan}
          className="group w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black shadow-xl shadow-slate-200 transition-all flex items-center justify-between px-8 hover:bg-black active:scale-95 border border-transparent hover:border-slate-700"
        >
          <div className="flex flex-col items-start gap-1">
            <span className="tracking-widest uppercase text-sm text-indigo-200 group-hover:text-white transition-colors">Escanear Unidade</span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Validar Presença Local</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <QrCode size={20} className="text-indigo-300" />
          </div>
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 shadow-lg animate-in slide-in-from-top-2 border ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
          message.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' :
          'bg-amber-50 text-amber-700 border-amber-100'
        }`}>
          {message.type === 'success' && <CheckCircle2 size={18} className="shrink-0" />}
          {message.type === 'error' && <AlertTriangle size={18} className="shrink-0" />}
          {message.type === 'warning' && <MapPin size={18} className="shrink-0" />}
          <p className="font-bold text-[10px] uppercase tracking-widest leading-tight">{message.text}</p>
        </div>
      )}

      {distanceInfo && !message && (
         <div className={`p-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest border ${
             distanceInfo.isFar ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
         }`}>
             <Ruler size={12} />
             Distância da Unidade: {distanceInfo.meters}m
         </div>
      )}

      {/* Histórico */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-widest flex items-center gap-2">
            <History size={12} /> Últimos Registros
          </h3>
          {loadingHistory && <Loader2 size={12} className="animate-spin text-slate-300" />}
        </div>
        
        <div className="divide-y divide-slate-50">
          {records.slice(0, visibleCount).map(record => (
            <div 
              key={record.id} 
              onClick={() => setSelectedRecord(record)}
              className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors active:scale-[0.98] group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm ${record.type === 'entry' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
                  {record.type === 'entry' ? <ArrowDownCircle size={18} /> : <ArrowUpCircle size={18} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                      <p className={`font-black text-[10px] uppercase tracking-wide ${record.type === 'entry' ? 'text-indigo-900' : 'text-orange-900'}`}>
                        {record.type === 'entry' ? 'Entrada' : 'Saída'}
                      </p>
                      {record.locationName?.includes('Fora') && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Registro fora do perímetro"></span>
                      )}
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase truncate max-w-[140px] flex items-center gap-1">
                      <MapPin size={8} /> {record.locationName?.split('(')[0] || 'Local'}
                  </p>
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
            <div className="py-12 text-center text-slate-300 uppercase font-black text-[9px] tracking-widest flex flex-col items-center gap-2">
                <Clock size={24} className="opacity-20" />
                Sem atividades registradas
            </div>
          )}
        </div>
        
        {visibleCount < records.length && (
            <button 
                onClick={() => setVisibleCount(prev => prev + 5)}
                className="w-full py-4 bg-white text-slate-400 font-bold text-[9px] uppercase tracking-widest hover:bg-slate-50 hover:text-indigo-500 transition-all flex items-center justify-center gap-2 border-t border-slate-50"
            >
                <ChevronDown size={12} /> Carregar Mais
            </button>
        )}
      </div>

      {isScanning && <Scanner onScan={handleScanSuccess} onClose={() => setIsScanning(false)} />}
      {isCapturing && <SelfieCamera onCapture={finalizePunch} onCancel={() => { setIsCapturing(false); setActiveLocation(null); setDistanceInfo(null); }} />}

      {/* Detalhes do Registro - DARK MODE */}
      {selectedRecord && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#111] rounded-[2.5rem] w-full max-w-[380px] overflow-hidden relative border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
                
                <div className="p-6 pb-4">
                    <div className="flex justify-between items-start mb-6">
                         <div className="bg-white/5 px-3 py-1 rounded-full border border-white/5">
                            <span className="text-[10px] font-bold text-gray-300 tracking-widest uppercase">Comprovante Digital</span>
                         </div>
                         <button onClick={() => setSelectedRecord(null)} className="p-2 bg-white/5 rounded-full hover:bg-white/20 text-gray-400 transition">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="text-center mb-8">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_40px_-10px] ${
                            selectedRecord.type === 'entry' ? 'bg-indigo-500/20 text-indigo-400 shadow-indigo-500/30' : 'bg-orange-500/20 text-orange-400 shadow-orange-500/30'
                        }`}>
                            {selectedRecord.type === 'entry' ? <ArrowDownCircle size={40} /> : <ArrowUpCircle size={40} />}
                        </div>
                        <h2 className="text-white font-black text-3xl tracking-tight mb-1">
                            {new Date(selectedRecord.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                        </h2>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
                            {new Date(selectedRecord.timestamp).toLocaleDateString('pt-BR', {weekday:'long', day:'numeric', month:'long'})}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                            <p className="text-gray-500 text-[9px] font-bold uppercase tracking-wider mb-1">Colaborador</p>
                            <p className="text-white font-bold text-xs truncate">{selectedRecord.userName}</p>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                            <p className="text-gray-500 text-[9px] font-bold uppercase tracking-wider mb-1">Local</p>
                            <p className="text-white font-bold text-xs truncate">{selectedRecord.locationName?.split('(')[0] || 'Local'}</p>
                        </div>
                    </div>

                    {selectedRecord.locationName?.includes('Fora') && (
                         <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center gap-3 mb-6">
                            <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                            <p className="text-[10px] font-medium text-amber-200 leading-tight">
                                Registro efetuado fora do perímetro geográfico da unidade.
                            </p>
                         </div>
                    )}

                    <div className="space-y-3">
                         <div className="h-[120px] w-full rounded-2xl bg-[#222] relative overflow-hidden group border border-white/5">
                            {selectedRecord.coords ? (
                                <>
                                    <div className="absolute inset-0 opacity-40 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] bg-cover bg-center grayscale invert"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_0_4px_rgba(99,102,241,0.2)]"></div>
                                    </div>
                                    <a 
                                        href={`https://www.google.com/maps/search/?api=1&query=${selectedRecord.coords.latitude},${selectedRecord.coords.longitude}`}
                                        target="_blank"
                                        className="absolute bottom-2 right-2 bg-white text-black text-[9px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-indigo-50 transition"
                                    >
                                        Ver GPS <Navigation size={10} />
                                    </a>
                                </>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center flex-col gap-2 text-gray-600">
                                    <Ban size={20} />
                                    <span className="text-[9px] font-bold uppercase tracking-widest">Sem GPS</span>
                                </div>
                            )}
                         </div>
                         
                         <div className="text-center">
                            <p className="text-[9px] text-gray-600 font-mono break-all">
                                ID: {selectedRecord.id}
                            </p>
                         </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;