
import React, { useState, useEffect } from 'react';
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
  ChevronRight,
  Filter,
  X
} from 'lucide-react';

interface AdminRequestsProps {
  workspaceId: string;
}

const AdminRequests: React.FC<AdminRequestsProps> = ({ workspaceId }) => {
  // Fix: Use EmployeeRequest from types instead of local Request to avoid type mismatch
  const [requests, setRequests] = useState<EmployeeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
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
      // Fix: Ensured state updates with correct type from StorageService
      setRequests(data || []);
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

  const filteredRequests = requests.filter(r => {
    const matchesFilter = filter === 'all' || r.status === filter;
    const matchesSearch = r.user_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p className="text-[10px] font-black uppercase tracking-widest">Carregando Solicitações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou tipo..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-2xl text-xs font-bold outline-none"
          />
        </div>
        
        <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-100 dark:border-white/10 overflow-x-auto w-full md:w-auto">
          {['all', 'pending', 'approved', 'rejected'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                filter === f 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {f === 'all' ? 'Todas' : f === 'pending' ? 'Pendentes' : f === 'approved' ? 'Aprovadas' : 'Recusadas'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRequests.map((req) => (
          <div 
            key={req.id}
            onClick={() => setViewingRequest(req)}
            className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-white/10 p-6 hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className={`absolute top-0 left-0 right-0 h-1 ${
              req.status === 'pending' ? 'bg-amber-400' : req.status === 'approved' ? 'bg-emerald-500' : 'bg-red-500'
            }`}></div>

            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <div>
                  <h4 className="font-black text-slate-800 dark:text-white text-sm">{req.user_name}</h4>
                  <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">{req.type}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                req.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                req.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                'bg-red-50 text-red-600 border-red-100'
              }`}>
                {req.status === 'pending' ? 'Pendente' : req.status === 'approved' ? 'Aprovada' : 'Recusada'}
              </span>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-slate-400">
                <Calendar size={12} />
                <span className="text-[10px] font-bold">Data: {new Date(req.date).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 italic leading-relaxed">
                "{req.description || 'Sem descrição'}"
              </p>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); setViewingRequest(req); }}
                className="flex-1 py-3 bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-300 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-600 hover:text-white transition-all"
              >
                <Eye size={12} /> Detalhes
              </button>
            </div>
          </div>
        ))}

        {filteredRequests.length === 0 && (
          <div className="col-span-full py-20 text-center space-y-4 opacity-30">
            <Filter size={48} className="mx-auto" />
            <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma solicitação encontrada</p>
          </div>
        )}
      </div>

      {viewingRequest && (
        <div className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/5 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-50 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
              <div className="flex items-center gap-3">
                <UserIcon className="text-indigo-600" size={20} />
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-900 dark:text-white">Análise de Solicitação</h3>
              </div>
              <button onClick={() => setViewingRequest(null)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><X size={20}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-2xl font-black text-slate-800 dark:text-white">{viewingRequest.user_name}</h4>
                  <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em]">{viewingRequest.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Data do Evento</p>
                  <p className="text-sm font-black text-slate-800 dark:text-white">{new Date(viewingRequest.date).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Documento / Comprovante</p>
                <div className="aspect-video bg-slate-100 dark:bg-white/5 rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 group relative">
                  {viewingRequest.attachment ? (
                    <img src={viewingRequest.attachment} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 opacity-20">
                      <FileText size={48} />
                      <p className="text-[10px] font-bold uppercase">Sem imagem anexa</p>
                    </div>
                  )}
                  {viewingRequest.attachment && (
                    <a href={viewingRequest.attachment} target="_blank" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2 font-black text-[10px] uppercase tracking-widest">
                      <Eye size={20} /> Ampliar Documento
                    </a>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-3xl border border-slate-100 dark:border-white/10">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3">Justificativa do Colaborador</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
                  "{viewingRequest.description || 'Nenhuma descrição detalhada fornecida.'}"
                </p>
              </div>
            </div>

            <div className="p-6 bg-slate-50/50 dark:bg-white/5 border-t border-slate-50 dark:border-white/5 flex gap-3">
              {viewingRequest.status === 'pending' ? (
                <>
                  <button 
                    disabled={actionLoading !== null}
                    onClick={() => handleUpdateStatus(viewingRequest.id, 'rejected')}
                    className="flex-1 py-4 bg-white dark:bg-red-500/10 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-red-100 dark:border-red-500/20 hover:bg-red-50 transition-all active:scale-95"
                  >
                    {actionLoading === viewingRequest.id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />} 
                    Recusar
                  </button>
                  <button 
                    disabled={actionLoading !== null}
                    onClick={() => handleUpdateStatus(viewingRequest.id, 'approved')}
                    className="flex-[1.5] py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95"
                  >
                    {actionLoading === viewingRequest.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} 
                    Aprovar Solicitação
                  </button>
                </>
              ) : (
                <div className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 ${
                  viewingRequest.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                }`}>
                  {viewingRequest.status === 'approved' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                  Solicitação {viewingRequest.status === 'approved' ? 'Aprovada' : 'Recusada'} em {new Date(viewingRequest.created_at).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRequests;
