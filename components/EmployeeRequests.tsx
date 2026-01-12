
import React, { useState, useEffect, useRef } from 'react';
import { User, EmployeeRequest } from '../types';
import { StorageService } from '../services/storage';
import { 
  FilePlus, 
  Upload, 
  X, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Loader2,
  FileText,
  Calendar,
  Image as ImageIcon,
  Paperclip,
  FileCheck
} from 'lucide-react';

interface EmployeeRequestsProps {
  user: User;
}

const EmployeeRequests: React.FC<EmployeeRequestsProps> = ({ user }) => {
  const [requests, setRequests] = useState<EmployeeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    type: 'Atestado Médico',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadRequests();
  }, [user.id]);

  const loadRequests = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await StorageService.getUserRequests(user.id);
      setRequests(data);
    } catch (err: any) {
      console.error("Erro ao carregar solicitações:", err);
      setErrorMsg(err.message || "Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert("Formato não suportado. Por favor, utilize PDF, JPG ou PNG.");
        return;
      }

      setSelectedFile(file);

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || isSubmitting) {
      if (!selectedFile) alert("Por favor, anexe o comprovante (PDF ou Imagem).");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload do Arquivo (ID do usuário logado é essencial para RLS)
      const publicUrl = await StorageService.uploadDocument(user.id, selectedFile);
      
      // 2. Gravação no Banco de Dados
      await StorageService.submitRequest({
        user_id: user.id, // ID FORÇADO PARA RLS
        user_name: user.name,
        workspace_id: user.workspaceId,
        type: form.type,
        date: form.date,
        description: form.description,
        arquivo_url: publicUrl
      });

      // 3. Sucesso: Feedback e Resete
      setIsAdding(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setForm({ type: 'Atestado Médico', date: new Date().toISOString().split('T')[0], description: '' });
      
      alert("Documento enviado com sucesso!");
      await loadRequests();
    } catch (err: any) {
      console.error("Erro no Processo de Envio:", err);
      alert(err.message || "Ocorreu um erro ao processar sua solicitação.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center px-2">
        <div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">Minhas Solicitações</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Documentos e Justificativas</p>
        </div>
        <button 
          onClick={() => { setIsAdding(true); setSelectedFile(null); setPreviewUrl(null); }}
          className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/20 hover:scale-110 active:scale-95 transition-all"
        >
          <FilePlus size={20} />
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 opacity-40">
            <Loader2 size={28} className="animate-spin mb-3 text-indigo-600" />
            <p className="text-[10px] font-black uppercase tracking-widest">Acessando Central...</p>
          </div>
        ) : errorMsg ? (
          <div className="bg-red-50 dark:bg-red-900/10 p-10 rounded-[2.5rem] text-center border border-red-100 dark:border-red-900/20">
            <AlertCircle size={36} className="mx-auto mb-4 text-red-500" />
            <p className="text-xs font-black uppercase text-red-600 mb-6">{errorMsg}</p>
            <button onClick={loadRequests} className="px-8 py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Tentar Novamente</button>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-16 text-center border border-dashed border-slate-200 dark:border-white/10 opacity-50">
            <FileText size={40} className="mx-auto mb-4 text-slate-300" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nenhum registro encontrado</p>
          </div>
        ) : (
          requests.map(req => (
            <div key={req.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  req.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 
                  req.status === 'rejected' ? 'bg-red-50 text-red-600' : 
                  'bg-amber-50 text-amber-600'
                }`}>
                  {req.status === 'approved' ? <CheckCircle2 size={24} /> : 
                   req.status === 'rejected' ? <X size={24} /> : 
                   <Clock size={24} />}
                </div>
                <div>
                  <h4 className="font-black text-slate-800 dark:text-white text-sm">{req.type}</h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{new Date(req.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                  req.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                  req.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' : 
                  'bg-amber-50 text-amber-600 border-amber-100'
                }`}>
                  {req.status === 'pending' ? 'Pendente' : req.status === 'approved' ? 'Deferido' : 'Recusado'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[6000] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[3.5rem] sm:rounded-[3rem] shadow-2xl overflow-hidden border border-white/5 flex flex-col animate-in slide-in-from-bottom-10 h-[92vh] sm:h-auto">
            
            <div className="p-8 border-b border-slate-50 dark:border-white/5 flex justify-between items-center bg-slate-50/30 dark:bg-white/5">
              <h3 className="font-black text-xs uppercase tracking-[0.3em] text-slate-800 dark:text-white">Nova Solicitação</h3>
              <button onClick={() => setIsAdding(false)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                <X size={28} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Tipo de Justificativa</label>
                  <select 
                    value={form.type}
                    onChange={(e) => setForm({...form, type: e.target.value})}
                    className="w-full p-5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-3xl text-xs font-black outline-none focus:border-indigo-600 transition-all dark:text-white"
                  >
                    <option>Atestado Médico</option>
                    <option>Declaração de Comparecimento</option>
                    <option>Esquecimento de Ponto</option>
                    <option>Ajuste de Horário</option>
                    <option>Férias / Folga</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Data do Evento</label>
                  <div className="relative">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="date" 
                      value={form.date}
                      onChange={(e) => setForm({...form, date: e.target.value})}
                      className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-3xl text-xs font-black outline-none focus:border-indigo-600 transition-all dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Comprovante (Imagem ou PDF)</label>
                  <div 
                    onClick={() => !isSubmitting && fileInputRef.current?.click()}
                    className={`w-full aspect-video bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-indigo-500 transition-all overflow-hidden relative group ${isSubmitting ? 'cursor-not-allowed opacity-70' : ''}`}
                  >
                    {selectedFile ? (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4">
                        {previewUrl ? (
                          <img src={previewUrl} className="w-full h-full object-contain" alt="Preview" />
                        ) : selectedFile.type === 'application/pdf' ? (
                          <div className="text-center space-y-3">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                              <FileCheck size={32} />
                            </div>
                            <p className="text-[10px] font-black text-slate-600 dark:text-white uppercase tracking-widest truncate max-w-[250px]">
                              {selectedFile.name} (PDF)
                            </p>
                          </div>
                        ) : (
                          <div className="text-center space-y-3">
                            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                              <FileText size={32} />
                            </div>
                            <p className="text-[10px] font-black text-slate-600 dark:text-white uppercase tracking-widest">
                              {selectedFile.name}
                            </p>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <p className="text-[10px] font-black text-white uppercase tracking-widest">Toque para trocar</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-14 h-14 bg-white dark:bg-slate-700 rounded-[1.5rem] shadow-sm flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                          <Paperclip size={28} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Anexar Comprovante Digital</p>
                      </>
                    )}
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*,application/pdf" 
                      onChange={handleFileChange} 
                      className="hidden" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Observações / Detalhes</label>
                  <textarea 
                    value={form.description}
                    onChange={(e) => setForm({...form, description: e.target.value})}
                    rows={3}
                    placeholder="Descreva brevemente o motivo..."
                    className="w-full p-6 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-3xl text-xs font-bold outline-none focus:border-indigo-600 transition-all dark:text-white placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={!selectedFile || isSubmitting}
                  className={`w-full py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl transition-all flex items-center justify-center gap-3 ${
                    !selectedFile || isSubmitting 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                    : 'bg-indigo-600 text-white shadow-indigo-600/30 hover:bg-indigo-700 active:scale-95'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Enviando Solicitação...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      Enviar ao RH
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeRequests;
