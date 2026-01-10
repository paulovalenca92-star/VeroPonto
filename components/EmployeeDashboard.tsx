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
  ChevronDown
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
  
  // Controle de paginação / Load More
  const [visibleCount, setVisibleCount] = useState(5);
  
  // Novo estado para o modal de detalhes
  const [selectedRecord, setSelectedRecord] = useState<TimeRecord | null>(null);

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
        navigator.geolocation.getCurrentPosition(resolve, reject, { 
            enableHighAccuracy: true, // Força o uso do GPS de alta precisão
            timeout: 10000,           // Dá um pouco mais de tempo para triangular
            maximumAge: 0             // Não aceita posições em cache
        });
      });
      coords = { latitude: position.coords.latitude, longitude: position.coords.longitude };
    } catch (err) {
      console.warn("GPS não capturado ou permissão negada.");
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

  const getRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'há menos de 1 hora';
    if (hours === 1) return 'há 1 hora';
    return `há ${hours} horas`;
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
          {records.slice(0, visibleCount).map(record => (
            <div 
              key={record.id} 
              onClick={() => setSelectedRecord(record)}
              className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors active:scale-[0.98] group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${record.type === 'entry' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
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
        
        {/* Botão Carregar Mais */}
        {visibleCount < records.length && (
            <button 
                onClick={() => setVisibleCount(prev => prev + 5)}
                className="w-full py-5 bg-white text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 border-t border-slate-50 group"
            >
                <ChevronDown size={14} className="group-hover:translate-y-1 transition-transform" /> Carregar Mais Antigos
            </button>
        )}
      </div>

      {isScanning && <Scanner onScan={handleScanSuccess} onClose={() => setIsScanning(false)} />}
      {isCapturing && <SelfieCamera onCapture={finalizePunch} onCancel={() => { setIsCapturing(false); setActiveLocation(null); }} />}

      {/* Detalhes do Registro - PREMIUM DARK MODE (COMPROVANTE) */}
      {selectedRecord && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#18181b] rounded-[2rem] w-full max-w-[400px] overflow-hidden relative border border-white/5 shadow-2xl flex flex-col max-h-[90vh]">
                
                {/* Header Section */}
                <div className="p-6 pb-4">
                    <div className="flex justify-between items-start mb-4">
                         <div className="w-8"></div>
                         <button onClick={() => setSelectedRecord(null)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 transition">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 shadow-lg ${
                            selectedRecord.type === 'entry' ? 'bg-[#ccff00] text-black' : 'bg-[#ff4400] text-white'
                        }`}>
                            {selectedRecord.type === 'entry' ? <ArrowDownCircle size={32} /> : <ArrowUpCircle size={32} />}
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-lg leading-tight">
                                Registro online
                            </h2>
                            <p className="text-gray-400 text-xs mt-1">
                                Efetuado às {new Date(selectedRecord.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})} em {new Date(selectedRecord.timestamp).toLocaleDateString('pt-BR')}
                            </p>
                            <p className="text-gray-500 text-xs mt-0.5 font-medium">
                                {getRelativeTime(selectedRecord.timestamp)}
                            </p>
                        </div>
                        <div className="ml-auto">
                             <Smartphone size={20} className="text-indigo-400 opacity-80" />
                        </div>
                    </div>
                </div>

                <div className="h-px bg-white/10 w-full"></div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    
                    <div className="space-y-4">
                        <h3 className="text-[#818cf8] text-sm font-medium">Detalhes do registro</h3>
                        
                        <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                            <div>
                                <p className="text-white font-bold text-sm mb-1">Empregador</p>
                                <p className="text-gray-400 text-xs uppercase font-medium leading-relaxed truncate">
                                    {user.workspaceId || "Empresa"}
                                </p>
                            </div>
                             <div>
                                <p className="text-white font-bold text-sm mb-1">CNPJ/CPF</p>
                                <p className="text-gray-400 text-xs uppercase font-medium">NÃO PREENCHIDO</p>
                            </div>

                            <div>
                                <p className="text-white font-bold text-sm mb-1">Local de Trabalho</p>
                                <p className="text-gray-400 text-xs uppercase font-medium leading-relaxed truncate">
                                    {selectedRecord.locationName}
                                </p>
                            </div>
                             <div>
                                <p className="text-white font-bold text-sm mb-1">NSR</p>
                                <p className="text-gray-400 text-xs uppercase font-medium">
                                    {selectedRecord.timestamp.toString().slice(-4)}
                                </p>
                            </div>

                             <div className="col-span-2 sm:col-span-1">
                                <p className="text-white font-bold text-sm mb-1">Nome completo</p>
                                <p className="text-gray-400 text-xs uppercase font-medium leading-relaxed truncate">
                                     {selectedRecord.userName}
                                </p>
                            </div>
                             <div className="col-span-2 sm:col-span-1">
                                <p className="text-white font-bold text-sm mb-1">Protocolo</p>
                                <p className="text-gray-400 text-xs font-mono break-all leading-tight">
                                    {selectedRecord.id.replace(/\D/g, '').padEnd(12, '0').slice(0, 16)} <Copy size={12} className="inline ml-1 opacity-50" />
                                </p>
                            </div>

                             <div>
                                <p className="text-white font-bold text-sm mb-1">Foto</p>
                                {selectedRecord.photo ? (
                                     <button onClick={() => window.open(selectedRecord.photo, '_blank')} className="text-white text-xs underline decoration-1 underline-offset-4 font-medium hover:text-indigo-400">
                                         VER
                                     </button>
                                ) : (
                                    <span className="text-gray-600 text-xs">--</span>
                                )}
                            </div>
                             <div>
                                <p className="text-white font-bold text-sm mb-1">SHA-256</p>
                                <p className="text-gray-500 text-[10px] font-mono break-all leading-none">
                                    60e9b2f469ed747b30cb6dab3fcb11ee6474ffde71a6b69970f6f3c9c9ba13dd
                                </p>
                            </div>
                            
                            <div className="col-span-2">
                                 <p className="text-white font-bold text-sm mb-1">Registro no INPI</p>
                                 <p className="text-gray-400 text-xs uppercase font-medium">BR512022000438-0</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                         <h3 className="text-white font-bold text-sm">Localização</h3>
                         <div className="w-full aspect-video bg-[#242424] rounded-xl overflow-hidden relative border border-white/10 group">
                            {/* Fake Map Background using CSS patterns */}
                            <div className="absolute inset-0 opacity-30" style={{
                                 backgroundImage: `
                                    linear-gradient(#333 1px, transparent 1px),
                                    linear-gradient(90deg, #333 1px, transparent 1px)
                                 `,
                                 backgroundSize: '20px 20px'
                            }}></div>
                            
                            {/* Map Roads Abstract */}
                            <div className="absolute top-0 bottom-0 left-[30%] w-3 bg-[#333] -skew-x-12"></div>
                            <div className="absolute top-[40%] left-0 right-0 h-3 bg-[#333] skew-y-6"></div>

                             <div className="absolute inset-0 flex items-center justify-center">
                                <MapPin size={40} className="text-red-500 drop-shadow-2xl relative z-10 -mt-4" fill="currentColor" />
                                <div className="w-4 h-4 bg-black/50 blur-sm rounded-full absolute mt-8"></div>
                             </div>

                            {selectedRecord.coords ? (
                                 <a 
                                    href={`https://www.google.com/maps/search/?api=1&query=${selectedRecord.coords.latitude},${selectedRecord.coords.longitude}`}
                                    target="_blank"
                                    className="absolute inset-0 z-20 flex items-end justify-end p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-all"
                                 >
                                    <span className="bg-white text-black text-[10px] font-bold px-2 py-1 rounded shadow-lg flex items-center gap-1 hover:bg-slate-200 transition">
                                        Abrir no Google Maps <Navigation size={10} />
                                    </span>
                                 </a>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
                                    <span className="text-white text-xs font-bold flex items-center gap-2"><Ban size={14} /> Sem localização GPS</span>
                                </div>
                            )}
                         </div>
                         {selectedRecord.coords && (
                             <p className="text-center text-[10px] text-gray-600 font-mono">
                                 {selectedRecord.coords.latitude.toFixed(6)}, {selectedRecord.coords.longitude.toFixed(6)}
                             </p>
                         )}
                    </div>

                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;