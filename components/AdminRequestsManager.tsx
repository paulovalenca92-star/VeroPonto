
import React, { useState, useEffect, useMemo } from 'react';
import { StorageService } from '../services/storage';
import { EmployeeRequest } from '../types';
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  User as UserIcon, 
  Calendar,
  Search,
  Loader2,
  Filter,
  X,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  ClipboardList
} from 'lucide-react';

interface AdminRequestsManagerProps {
  workspaceId: string;
}

const AdminRequestsManager: React.FC<AdminRequestsManagerProps> = ({ workspaceId }) => {
  const [requests, setRequests] = useState<EmployeeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingRequest, setViewingRequest] = useState<EmployeeRequest | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, [workspaceId]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await StorageService.getAdminRequests(workspaceId);
      setRequests((data as any) || []);
    } catch (err) {
      console.error("Erro ao carregar solicitações:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    setActionLoading(id);
    try {
      await StorageService.updateRequestStatus(id, status);
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      if (viewingRequest?.id === id) {
        setViewingRequest(prev => prev ? { ...prev, status } : null);
      }
    } catch (err) {
      alert("Erro ao atualizar status.");
    } finally {
      setActionLoading(null);
    }
  };

  const counts = useMemo(() => {
    return {
      all: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      approved: requests.filter(r => r.status === 'approved').length,
      rejected: requests.filter(r => r.status === 'rejected').length
    };
  }, [requests]);

  const filteredRequests = requests.filter(r => {
    const matchesFilter = filter === 'all' || r.status === filter;
    const matchesSearch = r.user_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <Loader2 className="animate-spin mb-4" size={40} />
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">Sincronizando Central...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* HEADER DA CENTRAL */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-white/5 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-5 w-full md:w-auto">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
            <ClipboardList size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Central de Documentos</h2>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Gestão de Atestados e Justificativas</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-center">
          {[
            { id: 'all', label: 'Todas', count: counts.all },
            { id: 'pending', label: 'Pendentes', count: counts.pending },
            { id: 'approved', label: 'Deferidas', count: counts.approved },
            { id: 'rejected', label: 'Indeferidas', count: counts.rejected }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                filter === f.id 
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-lg' 
                : 'bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-white'
              }`}
            >
              {f.label}
              <span className={`px-2 py-0.5 rounded-md text-[8px] ${
                filter === f.id ? 'bg-indigo-500 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-500'
              }`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* BARRA DE BUSCA */}
      <div className="relative group max-w-lg">
        <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
        <input 
          type="text" 
          placeholder="Filtrar por nome ou motivo..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[1.5rem] text-xs font-bold outline-none shadow-sm focus:ring-4 focus:ring-indigo-500/5 transition-all dark:text-white"
        />
      </div>

      {/* LISTA DE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRequests.map((req) => (
          <div 
            key={req.id}
            onClick={() => setViewingRequest(req)}
            className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 p-7 hover:shadow-2xl transition-all cursor-pointer group relative flex flex-col h-full"
          >
            <div className={`absolute top-0 left-0 bottom-0 w-1.5 rounded-l-[2.5rem] ${
              req.status === 'pending' ? 'bg-amber-400' : req.status === 'approved' ? 'bg-emerald-500' : 'bg-red-500'
            }`}></div>

            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <UserIcon size={24} />
                </div>
                <div>
                  <h4 className="font-black text-slate-800 dark:text-white text-base leading-none mb-1">{req.user_name}</h4>
                  <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em]">{req.type}</p>
                </div>
              </div>
              <div className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                req.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                req.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                'bg-red-50 text-red-600 border-red-100'
              }`}>
                {req.status === 'pending' ? 'Pendente' : req.status === 'approved' ? 'Aprovado' : 'Recusado'}
              </div>
            </div>

            <div className="bg-slate-50/50 dark:bg-white/5 p-4 rounded-2xl space-y-3 flex-1 mb-6">
              <div className="flex items-center gap-2 text-slate-400">
                <Calendar size={12} />
                <span className="text-[10px] font-black uppercase tracking-widest">Ref: {new Date(req.date).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 italic leading-relaxed">
                "{req.description || 'Sem descrição fornecida'}"
              </p>
            </div>

            <button 
              onClick={(e) => { e.stopPropagation(); setViewingRequest(req); }}
              className="w-full py-4 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
            >
              Analisar Documento <ChevronRight size={14} />
            </button>
          </div>
        ))}

        {filteredRequests.length === 0 && (
          <div className="col-span-full py-24 text-center space-y-6 opacity-30">
            <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto">
              <Filter size={40} className="text-slate-300" />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.3em]">Nada pendente por aqui</p>
          </div>
        )}
      </div>

      {/* MODAL DE ANÁLISE */}
      {viewingRequest && (
        <div className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden border border-white/5 flex flex-col max-h-[90vh] animate-in zoom-in-95">
            <div className="p-8 border-b border-slate-50 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-widest text-slate-900 dark:text-white">Análise de Documento</h3>
                  <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{viewingRequest.type}</p>
                </div>
              </div>
              <button onClick={() => setViewingRequest(null)} className="p-3 text-slate-400 hover:text-red-500 transition-colors bg-white dark:bg-white/5 rounded-2xl shadow-sm"><X size={24}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">{viewingRequest.user_name}</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1 flex items-center gap-2">
                    <Calendar size={12} /> Enviado em {new Date(viewingRequest.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right bg-indigo-50 dark:bg-indigo-500/10 px-6 py-3 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
                  <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Referência</p>
                  <p className="text-lg font-black text-indigo-700 dark:text-indigo-400">{new Date(viewingRequest.date).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end px-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comprovante Digital</p>
                    {viewingRequest.attachment && (
                      <a href={viewingRequest.attachment} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-indigo-600 hover:underline flex items-center gap-1">
                        Abrir em nova aba <ExternalLink size={10} />
                      </a>
                    )}
                </div>
                <div className="aspect-video bg-slate-950 rounded-[2.5rem] overflow-hidden border-4 border-slate-50 dark:border-white/5 group relative shadow-inner">
                  {viewingRequest.attachment ? (
                    <img src={viewingRequest.attachment} className="w-full h-full object-cover" alt="Documento" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-4 opacity-30 text-white">
                      <AlertTriangle size={48} />
                      <p className="text-xs font-black uppercase tracking-widest">Sem imagem vinculada</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-white/5 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <FileText size={64} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Justificativa do Colaborador</p>
                <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed italic font-medium">
                  "{viewingRequest.description || 'Nenhuma descrição detalhada fornecida pelo funcionário.'}"
                </p>
              </div>
            </div>

            <div className="p-8 bg-slate-50/50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row gap-4">
              {viewingRequest.status === 'pending' ? (
                <>
                  <button 
                    disabled={actionLoading !== null}
                    onClick={() => handleUpdateStatus(viewingRequest.id, 'rejected')}
                    className="flex-1 py-5 bg-white dark:bg-red-500/10 text-red-600 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 border border-red-100 dark:border-red-500/20 hover:bg-red-50 dark:hover:bg-red-500/20 transition-all shadow-sm"
                  >
                    {actionLoading === viewingRequest.id ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />} 
                    Indeferir
                  </button>
                  <button 
                    disabled={actionLoading !== null}
                    onClick={() => handleUpdateStatus(viewingRequest.id, 'approved')}
                    className="flex-[1.5] py-5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 hover:scale-[1.02] transition-all active:scale-95"
                  >
                    {actionLoading === viewingRequest.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />} 
                    Deferir Solicitação
                  </button>
                </>
              ) : (
                <div className={`w-full py-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 border ${
                  viewingRequest.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
                }`}>
                  {viewingRequest.status === 'approved' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                  Solicitação {viewingRequest.status === 'approved' ? 'Aprovada' : 'Recusada'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRequestsManager;
