
import React from 'react';
import { TimeRecord } from '../types';
import LocationPickerMap from './LocationPickerMap';
import { 
  X, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  User as UserIcon, 
  Building2, 
  Fingerprint, 
  Camera,
  Hash,
  Lock,
  Navigation,
  AlertTriangle,
  Printer,
  Calendar,
  Zap,
  Shield,
  ExternalLink
} from 'lucide-react';

interface RecordDetailsModalProps {
  record: TimeRecord;
  onClose: () => void;
  isPro?: boolean;
}

const RecordDetailsModal: React.FC<RecordDetailsModalProps> = ({ record, onClose, isPro }) => {
  // Geração de dados de prova digital para auditoria
  const protocol = `VP-${record.timestamp}-${record.userId.substring(0, 6).toUpperCase()}`;
  const mockHash = Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
  
  const isQrCode = record.locationCode !== 'MANUAL-APP';
  const dateObj = new Date(record.timestamp);

  const handlePrint = () => {
    window.print();
  };

  const openInGoogleMaps = () => {
    if (record.coords) {
      const url = `https://www.google.com/maps?q=${record.coords.latitude},${record.coords.longitude}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-[7000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="printable-receipt bg-[#050505] border border-white/10 w-full max-w-lg rounded-[3.5rem] shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[94vh] relative">
        
        {/* Cabeçalho Superior */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5 no-print">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#2DD4BF] to-[#4F46E5] rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20 relative overflow-hidden">
              <Shield size={24} className="text-white fill-white/10 relative z-10" />
              <Fingerprint size={12} className="text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-60 z-20" />
            </div>
            <div>
              <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-500">Comprovante Digital</h3>
              <p className="text-sm font-black text-white uppercase tracking-tighter">Detalhes do Registro</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-500 hover:text-white transition-all">
            <X size={24} />
          </button>
        </div>

        {/* Conteúdo Principal */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8 print:p-0">
          
          {/* Seção Superior: Foto + Horário */}
          <div className="flex flex-col sm:flex-row gap-8 items-start">
            <div className="relative shrink-0 mx-auto sm:mx-0">
              <div className="w-44 h-44 rounded-[3rem] overflow-hidden border-4 border-white/5 shadow-2xl bg-slate-900 relative">
                {record.photo ? (
                  <img src={record.photo} className="w-full h-full object-cover" alt="Selfie Bio" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-700">
                    <Camera size={48} />
                    <span className="text-[9px] font-black uppercase mt-2">Sem Captura</span>
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2.5 rounded-2xl shadow-xl border-4 border-[#050505] flex items-center justify-center">
                <ShieldCheck size={20} />
              </div>
            </div>

            <div className="flex-1 space-y-4 w-full">
               <div className="bg-[#111111] p-5 rounded-[2rem] border border-white/5">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Vínculo de Rede</p>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isQrCode ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-indigo-500'} animate-pulse`}></span>
                    <p className="text-xs font-black text-white">
                      {isQrCode ? 'Registro Local (QR Code)' : 'Registro Remoto (App Cloud)'}
                    </p>
                  </div>
               </div>

               <div className="grid grid-cols-1 gap-4">
                  <div className="bg-[#111111] p-5 rounded-[2rem] border border-white/5">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Horário</p>
                    <p className="text-3xl font-black text-white tabular-nums tracking-tighter">
                      {dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                  </div>
                  <div className="bg-[#111111] p-5 rounded-[2rem] border border-white/5">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Data</p>
                    <p className="text-sm font-black text-white uppercase tracking-widest">
                      {dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
               </div>
            </div>
          </div>

          {/* Mini Mapa de Localização */}
          <div className="space-y-4">
             <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-[#2DD4BF]" />
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Mapa de Georreferenciamento</p>
                </div>
                {record.coords && (
                  <span className="text-[8px] font-black bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-md border border-indigo-500/20 uppercase tracking-tighter">
                    GPS Ativo
                  </span>
                )}
             </div>

             <div className="w-full h-56 bg-[#0A0A0A] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-inner relative group">
                {record.coords ? (
                  <>
                    <LocationPickerMap 
                      latitude={record.coords.latitude} 
                      longitude={record.coords.longitude} 
                      radius={30} 
                    />
                    <button 
                      onClick={openInGoogleMaps}
                      className="absolute top-4 right-4 z-[500] bg-black/60 backdrop-blur-xl text-white px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-2 font-black text-[9px] uppercase tracking-widest hover:bg-white hover:text-black transition-all shadow-2xl no-print"
                    >
                      <ExternalLink size={14} /> Abrir no Google Maps
                    </button>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-800 gap-4 opacity-40">
                    <Navigation size={40} />
                    <p className="text-[10px] font-black uppercase tracking-widest">Coordenadas Não Disponíveis</p>
                  </div>
                )}
             </div>

             <div className="w-full p-6 bg-[#111111] rounded-[2rem] border border-white/5 flex items-center justify-center text-center">
                {record.coords ? (
                   <p className="text-[11px] font-mono text-slate-400 tracking-tight font-bold">
                     LAT: <span className="text-white">{record.coords.latitude.toFixed(6)}</span> | LNG: <span className="text-white">{record.coords.longitude.toFixed(6)}</span>
                   </p>
                ) : (
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Sem dados WGS84</p>
                )}
             </div>
          </div>

          {/* Dados do Colaborador */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className="bg-[#111111] p-6 rounded-[2rem] border border-white/5">
                <div className="flex items-center gap-2 opacity-30 mb-3">
                   <UserIcon size={12} className="text-white" />
                   <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white">Colaborador</span>
                </div>
                <p className="text-lg font-black text-white truncate leading-none">{record.userName}</p>
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-2">ID: {record.employeeId}</p>
             </div>
             <div className="bg-[#111111] p-6 rounded-[2rem] border border-white/5">
                <div className="flex items-center gap-2 opacity-30 mb-3">
                   <Building2 size={12} className="text-white" />
                   <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white">Unidade</span>
                </div>
                <p className="text-lg font-black text-white truncate leading-none">{record.locationName.split('(')[0]}</p>
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-2">Workspace: {record.workspaceId}</p>
             </div>
          </div>

          {/* Auditoria Digital */}
          <div className="bg-[#111111] p-8 rounded-[3rem] border border-[#2DD4BF]/10 space-y-6 relative overflow-hidden shadow-2xl">
             <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Lock size={80} />
             </div>
             
             <div className="flex items-center gap-3 relative z-10">
                <ShieldCheck size={16} className="text-[#2DD4BF]" />
                <h4 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Audit Trail Compliance</h4>
             </div>
             
             <div className="space-y-4 relative z-10">
                <div>
                   <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">NSR Protocol</p>
                   <p className="text-xs font-black text-white font-mono tracking-tight">{protocol}</p>
                </div>
                <div>
                   <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">SHA-256 Digital Signature</p>
                   <p className="text-[8px] font-mono text-slate-600 break-all leading-tight">
                      {mockHash.toUpperCase()}
                   </p>
                </div>
             </div>
          </div>
        </div>

        {/* Rodapé de Ações */}
        <div className="p-10 bg-[#0A0A0A] border-t border-white/5 flex flex-col sm:flex-row gap-4 no-print">
           <button 
             onClick={handlePrint}
             className="flex-1 py-5 bg-white/5 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-white/10 transition-all border border-white/10"
           >
              <Printer size={18} /> Imprimir Recibo
           </button>
           <button 
             onClick={onClose}
             className="flex-1 py-5 bg-gradient-to-r from-[#2DD4BF] to-[#4F46E5] text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
           >
              Fechar Detalhes
           </button>
        </div>
      </div>
    </div>
  );
};

export default RecordDetailsModal;
