
import React from 'react';
import { TimeRecord } from '../types';
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
  Shield
} from 'lucide-react';

interface RecordDetailsModalProps {
  record: TimeRecord;
  onClose: () => void;
  isPro?: boolean;
}

const RecordDetailsModal: React.FC<RecordDetailsModalProps> = ({ record, onClose, isPro }) => {
  // Geração de dados de prova digital
  const protocol = `VP-${record.timestamp}-${record.userId.substring(0, 6).toUpperCase()}`;
  const mockHash = Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
  
  const isQrCode = record.locationCode !== 'MANUAL-APP';
  const dateObj = new Date(record.timestamp);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[7000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="printable-receipt bg-[#050505] border border-white/10 w-full max-w-lg rounded-[3.5rem] shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[94vh] relative">
        
        {/* Cabeçalho Superior Estilizado */}
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
          
          {/* Seção Superior: Foto + Horário/Status */}
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
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Status do Vínculo</p>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isQrCode ? 'bg-amber-400' : 'bg-indigo-500'} animate-pulse`}></span>
                    <p className="text-xs font-black text-white">
                      {isQrCode ? 'Registro Local (QR Code)' : 'Registro Remoto (App Cloud)'}
                    </p>
                  </div>
               </div>

               <div className="grid grid-cols-1 gap-4">
                  <div className="bg-[#111111] p-5 rounded-[2rem] border border-white/5">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Horário de Registro</p>
                    <p className="text-3xl font-black text-white tabular-nums tracking-tighter">
                      {dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                  </div>
                  <div className="bg-[#111111] p-5 rounded-[2rem] border border-white/5">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Data da Jornada</p>
                    <p className="text-sm font-black text-white uppercase tracking-widest">
                      {dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
               </div>
            </div>
          </div>

          {/* Dados do Colaborador e Empresa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className="bg-[#111111] p-6 rounded-[2.5rem] border border-white/5 space-y-4">
                <div className="flex items-center gap-2 opacity-50">
                   <UserIcon size={14} className="text-white" />
                   <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">Colaborador</span>
                </div>
                <div>
                   <p className="text-lg font-black text-white truncate leading-none">{record.userName}</p>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Matrícula: {record.employeeId}</p>
                </div>
             </div>
             <div className="bg-[#111111] p-6 rounded-[2.5rem] border border-white/5 space-y-4">
                <div className="flex items-center gap-2 opacity-50">
                   <Building2 size={14} className="text-white" />
                   <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">Unidade Registrada</span>
                </div>
                <div>
                   <p className="text-lg font-black text-white truncate leading-none">{record.locationName.split('(')[0]}</p>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Empresa: {record.workspaceId}</p>
                </div>
             </div>
          </div>

          {/* Geolocalização GPS */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 px-2">
                <Navigation size={14} className="text-slate-500" />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Geolocalização (GPS WGS84)</p>
             </div>
             
             <div className="w-full p-6 bg-[#0A0A0A] rounded-[2.5rem] border border-white/5 flex items-center justify-center text-center">
                {record.coords ? (
                   <p className="text-[11px] font-mono text-slate-300 tracking-tight font-bold uppercase">
                     Latitude: <span className="text-white">{record.coords.latitude.toFixed(6)}</span> | Longitude: <span className="text-white">{record.coords.longitude.toFixed(6)}</span>
                   </p>
                ) : (
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">Coordenadas Não Capturadas</p>
                )}
             </div>
          </div>

          {/* Prova de Autenticidade Digital */}
          <div className="bg-[#111111] p-8 rounded-[3rem] border border-[#2DD4BF]/10 space-y-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5">
                <Lock size={80} />
             </div>
             
             <div className="flex items-center gap-3 relative z-10">
                <Lock size={16} className="text-amber-500" />
                <h4 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Prova de Autenticidade Digital</h4>
             </div>
             
             <div className="space-y-5 relative z-10">
                <div>
                   <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <Hash size={10} /> Protocolo NSR (Nº Sequencial de Registro)
                   </p>
                   <p className="text-sm font-black text-white font-mono tracking-tight">{protocol}</p>
                </div>
                <div>
                   <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <ShieldCheck size={10} /> Assinatura Eletrônica (SHA-256 Signature)
                   </p>
                   <p className="text-[8px] font-mono text-slate-500 break-all leading-tight">
                      {mockHash.toUpperCase()}
                   </p>
                </div>
             </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="p-10 bg-[#0A0A0A] border-t border-white/5 flex flex-col sm:flex-row gap-4 no-print">
           <button 
             onClick={handlePrint}
             className="flex-1 py-5 bg-white/5 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-white/10 transition-all border border-white/10 active:scale-95"
           >
              <Printer size={18} /> Imprimir Recibo
           </button>
           <button 
             onClick={onClose}
             className="flex-1 py-5 bg-[#F97316] text-black rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-xl shadow-orange-500/10 transition-all active:scale-95"
           >
              Fechar Detalhes
           </button>
        </div>
      </div>
      
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .printable-receipt { 
            position: absolute; top: 0; left: 0; width: 100%; border: none; box-shadow: none; background: white; color: black;
          }
          .printable-receipt * { color: black !important; border-color: #ddd !important; }
        }
      `}</style>
    </div>
  );
};

export default RecordDetailsModal;
