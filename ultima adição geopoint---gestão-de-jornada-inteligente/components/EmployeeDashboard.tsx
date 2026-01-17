
import React, { useState, useEffect, useCallback } from 'react';
import { User, TimeRecord, PunchType, Location } from '../types';
import { StorageService } from '../services/storage';
import SelfieCamera from './SelfieCamera';
import Scanner from './Scanner';
import RecordDetailsModal from './RecordDetailsModal';
import MonthlyReport from './MonthlyReport';
import EmployeeRequests from './EmployeeRequests';
import { 
  History, 
  ArrowUpCircle, 
  ArrowDownCircle,
  Clock,
  Loader2,
  Camera,
  QrCode,
  ShieldCheck,
  FileText,
  Home,
  FilePlus,
  Bell,
  Settings,
  User as UserIcon,
  RefreshCw,
  LogOut,
  Moon,
  Sun,
  Shield,
  Fingerprint,
  Zap,
  ChevronRight,
  Download,
  Lock,
  ExternalLink
} from 'lucide-react';

interface EmployeeDashboardProps {
  user: User;
  isPro?: boolean;
  onLogout: () => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  onForceUpdate: () => void;
}

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ 
  user, 
  onLogout, 
  theme, 
  onThemeToggle, 
  onForceUpdate 
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'requests' | 'notifications' | 'profile'>('home');
  const [records, setRecords] = useState<TimeRecord[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [activeLocation, setActiveLocation] = useState<Location | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedRecord, setSelectedRecord] = useState<TimeRecord | null>(null);

  const loadUserRecords = useCallback(async () => {
    try {
      if (!user.workspaceId || user.workspaceId === 'PENDENTE') return;
      const userRecords = await StorageService.getRecords(user.workspaceId, user.id);
      setRecords(userRecords || []);
    } catch (e) {
      console.error("Erro ao carregar histórico:", e);
    }
  }, [user.workspaceId, user.id]);

  useEffect(() => {
    loadUserRecords();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [loadUserRecords]);

  const getPreciseLocation = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0
      });
    });
  }, []);

  const handleScanSuccess = useCallback(async (decodedText: string) => {
    setIsScanning(false);
    setIsProcessing(true);
    try {
      const locations = await StorageService.getLocations(user.workspaceId);
      const foundLocation = locations.find(l => l.code === decodedText || l.id === decodedText);
      if (foundLocation) {
        setActiveLocation(foundLocation);
        setIsCapturing(true);
      } else {
        setMessage({ text: "QR Code inválido.", type: 'error' });
      }
    } catch (err) {
      setMessage({ text: "Erro na validação.", type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  }, [user.workspaceId]);

  const finalizePunch = useCallback(async (selfieBase64: string) => {
    setIsCapturing(false);
    setIsProcessing(true);
    let coords;
    try {
      const position = await getPreciseLocation();
      coords = { latitude: position.coords.latitude, longitude: position.coords.longitude };
    } catch (err) {}

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
      locationCode: activeLocation?.code || 'REMOTE',
      locationName: activeLocation?.name || 'Registro Externo',
      photo: selfieBase64,
      coords
    };

    try {
      await StorageService.addRecord(newRecord);
      await loadUserRecords();
      setMessage({ text: `Ponto de ${punchType === 'entry' ? 'Entrada' : 'Saída'} confirmado!`, type: 'success' });
    } catch (err) {
      setMessage({ text: "Erro ao salvar o ponto.", type: 'error' });
    } finally {
      setIsProcessing(false);
      setActiveLocation(null);
      setTimeout(() => setMessage(null), 5000);
    }
  }, [user, activeLocation, getPreciseLocation, loadUserRecords]);

  const renderTabContent = () => {
    switch(activeTab) {
      case 'home':
        return (
          <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-12">
            <div className="bg-[#121212] rounded-[3rem] p-10 shadow-2xl border border-white/5 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 to-indigo-600"></div>
              <p className="text-slate-500 font-black text-[9px] uppercase tracking-[0.3em] mb-2">Monitoramento de Turno</p>
              <h2 className="text-6xl font-black text-white tabular-nums tracking-tighter mb-2">
                {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </h2>
              <p className="text-teal-400 font-black text-[10px] uppercase tracking-[0.2em]">
                {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={() => setIsCapturing(true)}
                className="w-full py-8 bg-[#1A1A1A] border border-white/5 text-white rounded-[2.5rem] font-black shadow-xl flex items-center justify-between px-10 active:scale-95 transition-all"
              >
                <div className="flex flex-col items-start text-left">
                  <span className="tracking-[0.2em] uppercase text-[10px] mb-1">Registro Remoto</span>
                  <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Biometria Facial</span>
                </div>
                <div className="p-3 bg-white/5 rounded-2xl text-teal-400">
                  <Camera size={24} />
                </div>
              </button>

              <button 
                onClick={() => setIsScanning(true)}
                className="w-full py-8 bg-gradient-to-br from-teal-500 to-indigo-700 text-white rounded-[2.5rem] font-black shadow-2xl flex items-center justify-between px-10 active:scale-95 transition-all"
              >
                <div className="flex flex-col items-start text-left">
                  <span className="tracking-[0.2em] uppercase text-[10px] mb-1">Validar Presença</span>
                  <span className="text-[8px] text-white/50 font-black uppercase tracking-widest">Escanear QR Unidade</span>
                </div>
                <div className="p-3 bg-black/10 rounded-2xl">
                   <QrCode size={24} />
                </div>
              </button>
            </div>

            {/* SEÇÃO DE DOCUMENTAÇÃO MOVIDA PARA A HOME */}
            <div className="space-y-3">
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] ml-6 flex items-center gap-2">
                 <FileText size={12} /> Documentação Digital
               </p>
               <button 
                 onClick={() => setShowReport(true)} 
                 className="w-full p-6 bg-[#121212] border border-white/5 rounded-[2.2rem] flex items-center justify-between group hover:border-teal-500/30 transition-all active:scale-95 shadow-xl"
               >
                  <div className="flex items-center gap-5 text-left">
                     <div className="w-12 h-12 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-500">
                        <Download size={22} />
                     </div>
                     <div>
                        <p className="text-xs font-black text-white uppercase tracking-widest">Exportar Folha Mensal</p>
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Relatório assinado em PDF</p>
                     </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-600" />
               </button>
            </div>

            <div className="bg-[#121212] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
                <h3 className="font-black text-slate-500 text-[9px] uppercase tracking-[0.3em] flex items-center gap-2">
                  <History size={14} className="text-teal-400" /> Atividade Recente
                </h3>
              </div>
              <div className="divide-y divide-white/5">
                {records.slice(0, 5).map(record => (
                  <div key={record.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setSelectedRecord(record)}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${record.type === 'entry' ? 'bg-teal-500/10 text-teal-500' : 'bg-white/5 text-slate-500'}`}>
                        {record.type === 'entry' ? <ArrowDownCircle size={22} /> : <ArrowUpCircle size={22} />}
                      </div>
                      <div>
                        <p className="font-black text-[10px] uppercase tracking-widest text-white">{record.type === 'entry' ? 'Entrada' : 'Saída'}</p>
                        <p className="text-[8px] font-bold text-slate-500 uppercase mt-0.5 truncate max-w-[100px]">{record.locationName}</p>
                      </div>
                    </div>
                    <p className="font-black text-white text-base tabular-nums tracking-tighter">
                      {new Date(record.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
                {records.length === 0 && (
                  <div className="p-12 text-center opacity-20 flex flex-col items-center gap-3">
                    <Clock size={32} />
                    <p className="text-[9px] font-black uppercase tracking-widest">Sem registros hoje</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'requests':
        return <EmployeeRequests user={user} />;
      case 'notifications':
        return (
          <div className="flex flex-col items-center justify-center py-40 text-center space-y-6 opacity-30 animate-in fade-in">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center border border-white/5">
               <Bell size={48} strokeWidth={1} />
            </div>
            <p className="font-black text-[10px] uppercase tracking-[0.4em]">Nenhum comunicado oficial</p>
          </div>
        );
      case 'profile':
        return (
          <div className="space-y-8 animate-in slide-in-from-right-10 duration-500 pb-10">
            <div className="bg-[#121212] rounded-[3.5rem] p-10 border border-white/5 text-center relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 to-indigo-600"></div>
              <div className="w-28 h-28 bg-gradient-to-br from-teal-500 to-indigo-700 rounded-[2.5rem] mx-auto mb-6 flex items-center justify-center text-white shadow-2xl relative">
                <UserIcon size={48} />
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2.5 rounded-xl border-4 border-[#121212] shadow-lg">
                   <ShieldCheck size={18} />
                </div>
              </div>
              <h3 className="text-2xl font-black text-white italic">{user.name}</h3>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-3">Colaborador Ativo</p>
              
              <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-white/5">
                 <div className="text-left">
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">ID Matrícula</p>
                    <p className="text-xs font-black text-white mt-1">{user.employeeId}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Unidade</p>
                    <p className="text-xs font-black text-teal-500 mt-1">{user.workspaceId}</p>
                 </div>
              </div>
            </div>

            <div className="space-y-3 px-2">
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] ml-6 flex items-center gap-2">
                 <Settings size={12} /> Preferências do App
               </p>
               <div className="bg-[#121212] rounded-[2.5rem] border border-white/5 divide-y divide-white/5 overflow-hidden shadow-2xl">
                  <button 
                    onClick={onThemeToggle} 
                    className="w-full p-6 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
                  >
                     <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${theme === 'dark' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-500'}`}>
                           {theme === 'dark' ? <Moon size={22} /> : <Sun size={22} />}
                        </div>
                        <div>
                           <p className="text-xs font-black text-white uppercase tracking-widest">Modo de Exibição</p>
                           <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Tema atual: {theme === 'dark' ? 'Escuro' : 'Claro'}</p>
                        </div>
                     </div>
                     <div className={`w-10 h-5 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${theme === 'dark' ? 'left-6' : 'left-1'}`}></div>
                     </div>
                  </button>

                  <button 
                    onClick={onForceUpdate} 
                    className="w-full p-6 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors group"
                  >
                     <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 group-active:rotate-180 transition-transform duration-500">
                           <RefreshCw size={22} />
                        </div>
                        <div>
                           <p className="text-xs font-black text-white uppercase tracking-widest">Limpar Cache & Sincronizar</p>
                           <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Forçar atualização do sistema</p>
                        </div>
                     </div>
                     <ChevronRight size={18} className="text-slate-600" />
                  </button>
               </div>
            </div>

            <div className="px-4 space-y-6">
               <button 
                 onClick={onLogout} 
                 className="w-full py-6 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 text-red-500 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all active:scale-95"
               >
                  <LogOut size={18} /> Encerrar Sessão Segura
               </button>

               <div className="text-center space-y-3 opacity-20">
                  <div className="flex items-center justify-center gap-6">
                     <Shield size={16} />
                     <Fingerprint size={16} />
                     <Zap size={16} />
                  </div>
                  <p className="text-[8px] font-black uppercase tracking-[0.6em]">GeoPoint Cloud Platform v2.4.2</p>
               </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen relative flex flex-col pb-24">
      <div className="flex-1 py-4 px-4">
        {renderTabContent()}
      </div>

      {isProcessing && (
        <div className="fixed inset-0 z-[5000] bg-black/60 backdrop-blur-md flex items-center justify-center">
          <Loader2 size={40} className="text-teal-400 animate-spin" />
        </div>
      )}

      {message && (
        <div className={`fixed bottom-24 left-6 right-6 z-[4000] p-5 rounded-3xl border animate-in slide-in-from-bottom-4 shadow-2xl ${
          message.type === 'success' ? 'bg-teal-950/90 text-teal-400 border-teal-500/20' : 'bg-red-950/90 text-red-400 border-red-500/20'
        }`}>
          <p className="font-black text-[10px] uppercase tracking-widest text-center">{message.text}</p>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A]/95 backdrop-blur-2xl border-t border-white/5 z-[3000] safe-bottom h-20">
        <div className="max-w-md mx-auto h-full flex items-center justify-around px-2">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'home' ? 'text-teal-400' : 'text-slate-600 hover:text-slate-400'}`}
          >
            <Home size={22} className={activeTab === 'home' ? 'fill-teal-400/10' : ''} />
            <span className="text-[8px] font-black uppercase tracking-widest">Início</span>
          </button>

          <button 
            onClick={() => setActiveTab('requests')}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'requests' ? 'text-indigo-400' : 'text-slate-600 hover:text-slate-400'}`}
          >
            <FilePlus size={22} className={activeTab === 'requests' ? 'fill-indigo-400/10' : ''} />
            <span className="text-[8px] font-black uppercase tracking-widest">Pedidos</span>
          </button>

          <div className="relative -top-8">
            <button 
              onClick={() => { setActiveTab('home'); setIsCapturing(true); }}
              className="w-16 h-16 bg-gradient-to-br from-teal-400 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-teal-500/30 ring-4 ring-[#050505] active:scale-90 transition-all"
            >
              <UserIcon size={28} />
            </button>
            <p className="text-[8px] font-black uppercase tracking-widest text-center mt-2 text-teal-500">Ponto</p>
          </div>

          <button 
            onClick={() => setActiveTab('notifications')}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'notifications' ? 'text-teal-400' : 'text-slate-600 hover:text-slate-400'}`}
          >
            <Bell size={22} />
            <span className="text-[8px] font-black uppercase tracking-widest">Avisos</span>
          </button>

          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'profile' ? 'text-white' : 'text-slate-600 hover:text-slate-400'}`}
          >
            <Settings size={22} className={activeTab === 'profile' ? 'rotate-90 text-teal-400 transition-all duration-500' : ''} />
            <span className="text-[8px] font-black uppercase tracking-widest">Ajustes</span>
          </button>
        </div>
      </div>

      {isScanning && <Scanner onScan={handleScanSuccess} onClose={() => setIsScanning(false)} />}
      {isCapturing && <SelfieCamera onCapture={finalizePunch} onCancel={() => setIsCapturing(false)} />}
      {selectedRecord && <RecordDetailsModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />}
      {showReport && <MonthlyReport user={user} records={records} onClose={() => setShowReport(false)} />}
    </div>
  );
};

export default EmployeeDashboard;
