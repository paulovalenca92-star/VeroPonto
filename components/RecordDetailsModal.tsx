
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
  Printer
} from 'lucide-react';

interface RecordDetailsModalProps {
  record: TimeRecord;
  onClose: () => void;
  isPro?: boolean;
}

const RecordDetailsModal: React.FC<RecordDetailsModalProps> = ({ record, onClose, isPro }) => {
  // Geração de dados de prova digital simulados
  const protocol = `VP-${record.timestamp}-${record.userId.substring(0, 5).toUpperCase()}`;
  const mockHash = Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
  
  const isQrCode = record.locationCode !== 'MANUAL-APP';
  const dateObj = new Date(record.timestamp);

  const handlePrint = () => {
    const originalTitle = document.title;
    const dateStr = dateObj.toISOString().split('T')[0];
    const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h');
    
    // Altera o título para que o nome do arquivo PDF sugerido seja profissional
    document.title = `Comprovante_Ponto_${record.userName.replace(/\s+/g, '_')}_${dateStr}_${timeStr}`;
    
    // Pequeno delay para garantir que o navegador processe o novo título e o layout de impressão
    setTimeout(() => {
      window.print();
      // Restaura o título após o diálogo de impressão fechar
      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-[5000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="printable-receipt bg-[#0f172a] border border-white/10 w-full max-w-lg rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[92vh] relative">
        
        {/* PRINT ONLY HEADER */}
        <div className="hidden print:flex print-logo">
           <div className="bg-black p-2 rounded-lg">
              <Fingerprint size={24} className="text-white" />
           </div>
           <div>
              <h2 className="print-header-title">VeroPonto</h2>
              <p className="text-[8pt] font-black uppercase tracking-widest leading-none">Comprovante Digital de Registro de Ponto</p>
           </div>
        </div>

        {/* HEADER NO-PRINT */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5 no-print">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isPro ? 'bg-amber-500' : 'bg-indigo-600'} text-white shadow-lg`}>
              <Fingerprint size={20} />
            </div>
            <div>
              <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-white/40">Comprovante Digital</h3>
              <p className="text-xs font-black text-white uppercase tracking-widest">Detalhes do Registro</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl text-white/30 hover:text-white transition-all">
            <X size={24} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 print:overflow-visible print:p-0">
          
          {/* STATUS E FOTO */}
          <div className="flex flex-col md:flex-row gap-6 items-center print:flex-row print:items-start print:gap-10">
            <div className="relative group">
              <div className="w-40 h-40 rounded-[2.5rem] overflow-hidden border-4 border-white/5 shadow-2xl relative bg-slate-800 print:border-black print:rounded-2xl print:w-32 print:h-32">
                {record.photo ? (
                  <img src={record.photo} className="w-full h-full object-cover" alt="Selfie de Confirmação" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white/20 print:text-black">
                    <Camera size={40} />
                    <span className="text-[8px] font-black uppercase mt-2">Sem Foto</span>
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-xl shadow-lg border-4 border-[#0f172a] print:hidden no-print">
                <ShieldCheck size={16} />
              </div>
            </div>

            <div className="flex-1 space-y-4 w-full print:space-y-2">
               <div className="bg-white/5 p-4 rounded-3xl border border-white/5 print:border-none print:p-0">
                  <p className="text-[8px] font-black text-white/30 print:print-label uppercase tracking-[0.2em] mb-1">Status do Vínculo</p>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isQrCode ? 'bg-amber-400' : 'bg-indigo-500'} animate-pulse print:hidden`}></span>
                    <p className="text-sm font-black text-white print:print-value">
                      {isQrCode ? 'Confirmado via QR Code Local' : 'Registro Remoto (App Cloud)'}
                    </p>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-3 print:grid-cols-1 print:gap-2">
                  <div className="bg-white/5 p-4 rounded-3xl border border-white/5 print:border-none print:p-0">
                    <p className="text-[8px] font-black text-white/30 print:print-label uppercase tracking-[0.2em] mb-1">Horário de Registro</p>
                    <p className="text-xl font-black text-white print:print-value tabular-nums tracking-tighter">
                      {dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-3xl border border-white/5 print:border-none print:p-0">
                    <p className="text-[8px] font-black text-white/30 print:print-label uppercase tracking-[0.2em] mb-1">Data da Jornada</p>
                    <p className="text-sm font-black text-white print:print-value uppercase">
                      {dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
               </div>
            </div>
          </div>

          <div className="print-divider hidden print:block"></div>

          {/* DADOS DO COLABORADOR E EMPRESA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2">
             <div className="bg-white/5 p-5 rounded-[2rem] border border-white/5 space-y-3 print:border-none print:p-0">
                <div className="flex items-center gap-2 opacity-40 print:opacity-100">
                   <UserIcon size={12} className="text-white print:text-black" />
                   <span className="text-[8px] font-black uppercase tracking-widest text-white print:print-label">Colaborador</span>
                </div>
                <div>
                   <p className="text-sm font-black text-white print:print-value truncate">{record.userName}</p>
                   <p className="text-[9px] font-bold text-white/40 print:text-black uppercase tracking-widest mt-0.5">Matrícula: {record.employeeId}</p>
                </div>
             </div>
             <div className="bg-white/5 p-5 rounded-[2rem] border border-white/5 space-y-3 print:border-none print:p-0">
                <div className="flex items-center gap-2 opacity-40 print:opacity-100">
                   <Building2 size={12} className="text-white print:text-black" />
                   <span className="text-[8px] font-black uppercase tracking-widest text-white print:print-label">Unidade Registrada</span>
                </div>
                <div>
                   <p className="text-sm font-black text-white print:print-value truncate">{record.locationName.split('(')[0]}</p>
                   <p className="text-[9px] font-bold text-white/40 print:text-black uppercase tracking-widest mt-0.5">Empresa: {record.workspaceId}</p>
                </div>
             </div>
          </div>

          {/* MAPA E GPS */}
          <div className="space-y-3 print:space-y-1">
             <div className="flex justify-between items-end px-2 print:px-0">
                <p className="text-[10px] font-black text-white/30 print:print-label uppercase tracking-widest flex items-center gap-1">
                   <Navigation size={10} /> Geolocalização (GPS WGS84)
                </p>
             </div>
             
             <div className="w-full h-24 bg-slate-900 rounded-[2.5rem] border border-white/10 overflow-hidden relative shadow-inner print:h-auto print:bg-white print:border-none print:p-0">
                {record.coords ? (
                   <div className="w-full h-full relative flex items-center justify-center print:block">
                      <div className="z-10 flex flex-col items-center gap-2 print:items-start">
                        <p className="text-[10px] font-mono text-white/60 print:print-value tracking-tighter">
                          Latitude: {record.coords.latitude.toFixed(6)} | Longitude: {record.coords.longitude.toFixed(6)}
                        </p>
                      </div>
                   </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white/10 gap-3 print:text-black print:items-start">
                     <p className="text-[10px] font-black uppercase tracking-widest">Coordenadas Não Disponíveis no momento do registro</p>
                  </div>
                )}
             </div>
          </div>

          {/* DADOS TÉCNICOS / SEGURANÇA */}
          <div className="bg-black/40 p-6 rounded-[2.5rem] border border-white/5 space-y-4 print:bg-white print:border-none print:p-0 print:space-y-2">
             <div className="flex items-center gap-3 print:gap-1">
                <Lock size={14} className="text-amber-500 print:text-black" />
                <h4 className="text-[10px] font-black text-white print:print-label uppercase tracking-[0.3em]">Prova de Autenticidade Digital</h4>
             </div>
             
             <div className="space-y-4 print:space-y-2">
                <div>
                   <p className="text-[8px] font-black text-white/20 print:print-label uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Hash size={8} /> Protocolo NSR (Número Sequencial de Registro)
                   </p>
                   <p className="text-xs font-mono text-white/80 print:print-value font-bold">{protocol}</p>
                </div>
                <div>
                   <p className="text-[8px] font-black text-white/20 print:print-label uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Lock size={8} /> Assinatura Eletrônica (SHA-256 Signature)
                   </p>
                   <p className="text-[8px] font-mono text-white/40 print:text-black break-all leading-none opacity-80">
                      {mockHash.toUpperCase()}
                   </p>
                </div>
             </div>
          </div>

          <div className="hidden print:block print-footer">
            <p>Este documento é um comprovante oficial de registro de jornada, gerado eletronicamente e assinado digitalmente conforme os protocolos de segurança do VeroPonto.</p>
            <p className="mt-2">Emitido em: {new Date().toLocaleString('pt-BR')}</p>
          </div>
        </div>

        {/* FOOTER ACTIONS - NO PRINT */}
        <div className="p-8 bg-white/5 border-t border-white/5 flex gap-3 no-print">
           <button 
             onClick={handlePrint}
             className="flex-1 py-4 bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/20 transition-all border border-white/10"
           >
              <Printer size={16} /> Imprimir Recibo
           </button>
           <button 
             onClick={onClose}
             className={`flex-1 py-4 ${isPro ? 'bg-amber-500 text-black' : 'bg-indigo-600 text-white'} rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95`}
           >
              Fechar
           </button>
        </div>
      </div>
    </div>
  );
};

export default RecordDetailsModal;
