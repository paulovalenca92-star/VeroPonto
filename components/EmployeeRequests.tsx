import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Paperclip,
  FileCheck,
  RefreshCw
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

  const loadRequests = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setErrorMsg(null);
    try {
      const data = await StorageService.getUserRequests(user.id);
      setRequests(data);
    } catch (err: any) {
      console.error("Erro ao carregar solicitações:", err);
      setErrorMsg("Erro de sincronização.");
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadRequests();

    // Sincronização de foco para APK/WebView
    const handleFocus = () => loadRequests(true);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') loadRequests(true);
    });

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadRequests]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert("Formato não suportado. Utilize PDF, JPG ou PNG.");
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
    if (!selectedFile || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const publicUrl = await StorageService.uploadDocument(user.id, selectedFile);
      await StorageService.submitRequest({
        user_id: user.id,
        user_name: user.name,
        workspace_id: user.workspaceId,
        type: form.type,
        date: form.date,
        description: form.description,
        arquivo_url: publicUrl
      });

      setIsAdding(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setForm({ type: 'Atestado Médico', date: new Date().toISOString().split('T')[0], description: '' });
      await loadRequests();
    } catch (err: any) {
      alert("Erro ao enviar documento. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Overlay Bloqueante de Salvamento */}
      {isSubmitting && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-4">
            <Loader2 size={40} className="text-indigo-600 animate-spin" />
            <p className="text-xs font-black uppercase tracking-widest dark:text-white text-slate-800">Enviando Arquivo...</p>
          </div>
        </div>
      )}

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
            <p className="text-[10px] font-black uppercase tracking-widest">Sincronizando...</p>
          </div>
        ) : (
          requests.map(req => (
            <div key={req.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 p-6 flex items-center justify-between shadow-sm">
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
        <div className="fixed inset-0 z-[6000] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[3.5rem] sm:rounded-[3rem] shadow-2xl overflow-hidden border border-white/5 flex flex-col h-[92vh] sm:h-auto">
            <div className="p-8 border-b border-slate-50 dark:border-white/5 flex justify-between items-center bg-slate-50/30 dark:bg-white/5">
              <h3 className="font-black text-xs uppercase tracking-[0.3em] text-slate-800 dark:text-white">Nova Solicitação</h3>
              <button onClick={() => setIsAdding(false)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                <X size={28} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto flex-1">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Tipo</label>
                  <select 
                    value={form.type}
                    onChange={(e) => setForm({...form, type: e.target.value})}
                    className="w-full p-5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-3xl text-xs font-black outline-none focus:border-indigo-600 transition-all dark:text-white"
                  >
                    <option>Atestado Médico</option>
                    <option>Declaração de Comparecimento</option>
                    <option>Esquecimento de Ponto</option>
                    <option>Férias / Folga</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Comprovante</label>
                  <div 
                    onClick={() => !isSubmitting && fileInputRef.current?.click()}
                    className="w-full aspect-video bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 cursor-pointer overflow-hidden relative group"
                  >
                    {selectedFile ? (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4">
                        {previewUrl ? (
                          <img src={previewUrl} className="w-full h-full object-contain" />
                        ) : (
                          <div className="text-center space-y-2">
                            <FileCheck size={32} className="text-emerald-500 mx-auto" />
                            <p className="text-[10px] font-black uppercase text-slate-400">{selectedFile.name}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <Paperclip size={28} className="text-slate-400" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Anexar Arquivo</p>
                      </>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="hidden" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Observações</label>
                  <textarea 
                    value={form.description}
                    onChange={(e) => setForm({...form, description: e.target.value})}
                    rows={3}
                    placeholder="Descreva o motivo..."
                    className="w-full p-6 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-3xl text-xs font-bold outline-none dark:text-white"
                  />
                </div>
              </div>
              <button disabled={!selectedFile || isSubmitting} type="submit" className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all disabled:opacity-50">
                {isSubmitting ? "Enviando..." : "Enviar ao RH"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeRequests;