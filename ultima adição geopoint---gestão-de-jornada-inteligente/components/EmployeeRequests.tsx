
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { User, EmployeeRequest } from '../types';
import { StorageService } from '../services/storage';
import { 
  Upload, 
  X, 
  Clock, 
  Loader2, 
  Calendar,
  Zap,
  ArrowRight,
  FileCheck,
  FileText,
  AlertCircle,
  Database,
  Image as ImageIcon
} from 'lucide-react';

interface EmployeeRequestsProps {
  user: User;
}

const EmployeeRequests: React.FC<EmployeeRequestsProps> = ({ user }) => {
  const [requests, setRequests] = useState<EmployeeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    type: 'Registro de Ponto Manual',
    date: new Date().toISOString().split('T')[0],
    endDate: '',
    description: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadRequests = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await StorageService.getUserRequests(user.id);
      setRequests(data || []);
    } catch (err) {
      console.error("Erro ao carregar solicitações:", err);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const stats = useMemo(() => {
    return {
      total: requests.length,
      approved: requests.filter(r => r.status === 'approved').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
      pending: requests.filter(r => r.status === 'pending').length,
    };
  }, [requests]);

  const handleOpenForm = (type: string) => {
    setForm({
      type,
      date: new Date().toISOString().split('T')[0],
      endDate: type === 'Férias' ? new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0] : '',
      description: ''
    });
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorMsg(null);
    setIsAdding(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamanho (ex: 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("O arquivo é muito grande. Escolha um arquivo de até 5MB.");
        return;
      }
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setPreviewUrl(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg(null);

    if (!form.description.trim()) {
      setErrorMsg("Por favor, descreva o motivo da solicitação.");
      return;
    }

    setIsSubmitting(true);
    try {
      let attachmentUrl = '';
      if (selectedFile) {
        try {
          attachmentUrl = await StorageService.uploadDocument(user.id, selectedFile);
          console.log("Arquivo carregado com sucesso:", attachmentUrl);
        } catch (uploadErr: any) {
          console.error("Upload falhou:", uploadErr);
          throw new Error(`Erro ao enviar anexo: ${uploadErr.message || 'Verifique se o bucket "documents" está configurado no Supabase.'}`);
        }
      }
      
      const finalDescription = form.type === 'Férias' 
        ? `Período: ${form.date} até ${form.endDate}. Obs: ${form.description}`
        : form.description;

      await StorageService.submitRequest({
        user_id: user.id,
        user_name: user.name,
        workspace_id: user.workspaceId,
        type: form.type,
        date: form.date,
        description: finalDescription,
        attachment: attachmentUrl
      });

      setIsAdding(false);
      await loadRequests();
    } catch (err: any) {
      console.error("Submit Error:", err);
      setErrorMsg(err.message || "Falha ao enviar protocolo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 px-2 pb-12">
      <div className="text-center pt-4">
        <h3 className="text-xl font-black text-white uppercase tracking-widest italic">Central de Ajustes</h3>
        <div className="w-12 h-1 bg-indigo-600 mx-auto mt-2 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]"></div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {[
          { label: 'PONTO MANUAL', type: 'Registro de Ponto Manual', color: 'bg-indigo-600' },
          { label: 'ATESTADO MÉDICO', type: 'Atestado Médico', color: 'bg-violet-600' },
          { label: 'FÉRIAS / ABONOS', type: 'Férias', color: 'bg-teal-600' }
        ].map((btn) => (
          <button 
            key={btn.type}
            onClick={() => handleOpenForm(btn.type)}
            className={`w-full py-6 ${btn.color} text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all flex items-center justify-center px-8`}
          >
            SOLICITAR {btn.label}
          </button>
        ))}
      </div>

      <div className="bg-[#0A0A0A] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600"></div>
        <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Status da Auditoria</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
            <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Total</p>
            <p className="text-xl font-black text-white">{stats.total}</p>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
            <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Pendentes</p>
            <p className="text-xl font-black text-amber-500">{stats.pending}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4">Histórico de Protocolos</p>
        {requests.length > 0 ? requests.slice(0, 10).map(req => (
          <div key={req.id} className="bg-[#0A0A0A] p-5 rounded-3xl border border-white/5 flex items-center justify-between hover:border-indigo-500/30 transition-all">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : 
                req.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
              }`}>
                {req.status === 'pending' ? <Clock size={18} /> : (req.status === 'approved' ? <FileCheck size={18} /> : <AlertCircle size={18} />)}
              </div>
              <div>
                <p className="text-[9px] font-black text-white uppercase leading-none mb-1">{req.type}</p>
                <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">{new Date(req.date).toLocaleDateString()}</p>
              </div>
            </div>
            <div className={`text-[8px] font-black px-3 py-1 rounded-full border ${
              req.status === 'approved' ? 'border-emerald-500/20 text-emerald-500' : 
              req.status === 'rejected' ? 'border-red-500/20 text-red-500' : 'border-amber-500/20 text-amber-500'
            }`}>
              {req.status.toUpperCase()}
            </div>
          </div>
        )) : (
          <div className="py-20 text-center opacity-10 flex flex-col items-center">
            <FileText size={64} />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] mt-4">Nenhum protocolo</p>
          </div>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[6000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-[#0A0A0A] w-full max-w-md rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-indigo-500" />
                <h3 className="font-black text-[11px] uppercase tracking-[0.3em] text-white">Nova Solicitação</h3>
              </div>
              <button onClick={() => setIsAdding(false)} className="text-slate-500 hover:text-white transition">
                <X size={28} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-2xl flex items-start gap-3 animate-in shake duration-500">
                  <AlertCircle size={24} className="text-red-500 shrink-0" />
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-relaxed">{errorMsg}</p>
                </div>
              )}

              <div className="space-y-6">
                <div className="bg-indigo-600/10 p-5 rounded-2xl border border-indigo-600/20">
                   <p className="text-[8px] font-black uppercase text-indigo-400 mb-1 tracking-widest">Protocolo de Ajuste</p>
                   <p className="text-sm font-black text-white italic">{form.type}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Data do Evento</label>
                  <input 
                    type="date" 
                    required
                    value={form.date}
                    onChange={(e) => setForm({...form, date: e.target.value})}
                    className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-xs font-black outline-none focus:border-indigo-600 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Comprovante (Imagem/PDF)</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full aspect-video bg-white/5 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-3 cursor-pointer relative overflow-hidden transition-all ${selectedFile ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-white/10 hover:border-white/20'}`}
                  >
                    {previewUrl ? (
                      <img src={previewUrl} className="w-full h-full object-cover" />
                    ) : selectedFile ? (
                      <div className="flex flex-col items-center gap-2">
                         <FileText size={40} className="text-indigo-500" />
                         <span className="text-[10px] font-black uppercase text-indigo-400 px-6 text-center truncate w-full">
                           {selectedFile.name}
                         </span>
                      </div>
                    ) : (
                      <>
                        <ImageIcon size={32} className="text-slate-600" />
                        <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Toque para anexar foto/pdf</span>
                      </>
                    )}
                    <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" accept="image/*,application/pdf" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Justificativa</label>
                  <textarea 
                    required
                    value={form.description}
                    onChange={(e) => setForm({...form, description: e.target.value})}
                    placeholder="Explique o motivo do ajuste..."
                    className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl text-xs font-medium outline-none h-32 text-white resize-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <button 
                disabled={isSubmitting}
                type="submit" 
                className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-indigo-600/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />} 
                {isSubmitting ? 'ENVIANDO PROTOCOLO...' : 'CONFIRMAR SOLICITAÇÃO'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeRequests;
