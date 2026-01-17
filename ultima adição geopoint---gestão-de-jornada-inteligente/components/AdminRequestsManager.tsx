
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { StorageService } from '../services/storage';
import { EmployeeRequest } from '../types';
import { GoogleGenAI } from "@google/genai";
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
  X,
  ExternalLink,
  ChevronRight,
  ClipboardList,
  RefreshCw,
  Download,
  AlertTriangle,
  Inbox,
  Sparkles,
  ShieldCheck,
  Zap,
  Fingerprint,
  FileSearch
} from 'lucide-react';

interface AdminRequestsManagerProps {
  workspaceId: string;
}

interface AIAnalysisResult {
  isOfficial: boolean;
  confidence: number;
  summary: string;
  detectedData: {
    doctorName?: string;
    crm?: string;
    daysOff?: string;
    date?: string;
  };
  recommendation: string;
}

const AdminRequestsManager: React.FC<AdminRequestsManagerProps> = ({ workspaceId }) => {
  const [requests, setRequests] = useState<EmployeeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingRequest, setViewingRequest] = useState<EmployeeRequest | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Estados para Lux AI
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);

  const loadRequests = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      if (!workspaceId || workspaceId === 'PENDENTE') {
        setLoading(false);
        return;
      }
      const data = await StorageService.getAdminRequests(workspaceId);
      setRequests(data || []);
    } catch (err: any) {
      console.error("Erro ao carregar solicitações:", err);
      setError("Erro ao conectar com o banco de dados.");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const analyzeDocumentWithLux = async (request: EmployeeRequest) => {
    if (!request.attachment || isAnalyzing) return;
    
    setIsAnalyzing(true);
    setAiResult(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // 1. Precisamos converter a URL da imagem para Base64 para a Gemini Vision
      const responseImg = await fetch(request.attachment);
      const blob = await responseImg.blob();
      const base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      const pureBase64 = base64Data.split(',')[1];

      // 2. Prompt de Especialista para Auditoria
      const prompt = `Você é um perito em auditoria de documentos de RH. Analise esta imagem de um documento (atestado médico ou declaração) enviado por ${request.user_name} para o motivo: ${request.type}.
      
      Verifique rigorosamente:
      1. É um documento oficial? (Procure por logotipos, timbres, assinaturas, carimbos).
      2. Extraia: Nome do médico, CRM/Registro, Data e total de dias (se houver).
      3. O documento parece autêntico ou contém indícios de edição/fraude?
      
      Responda EXCLUSIVAMENTE em formato JSON com esta estrutura:
      {
        "isOfficial": boolean,
        "confidence": number (0 a 100),
        "summary": "resumo curto do que foi encontrado",
        "detectedData": { "doctorName": "string", "crm": "string", "daysOff": "string", "date": "string" },
        "recommendation": "sua recomendação final para o gestor"
      }`;

      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: blob.type,
                  data: pureBase64
                }
              }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const analysis = JSON.parse(result.text || "{}") as AIAnalysisResult;
      setAiResult(analysis);
    } catch (err) {
      console.error("Erro na análise Lux AI:", err);
      alert("Lux AI encontrou dificuldades em processar este arquivo específico.");
    } finally {
      setIsAnalyzing(false);
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
      setAiResult(null);
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

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="bg-[#0A0A0A] rounded-[3rem] p-10 border border-white/5 flex flex-col lg:flex-row justify-between items-center gap-10 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-500 border border-indigo-600/20">
            <ClipboardList size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">Auditoria de Pedidos</h2>
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] mt-1">Gestão de Justificativas e Abonos</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          {[
            { id: 'all', label: 'Todas', count: counts.all },
            { id: 'pending', label: 'Pendentes', count: counts.pending },
            { id: 'approved', label: 'Deferidas', count: counts.approved },
            { id: 'rejected', label: 'Indeferidas', count: counts.rejected }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-3 border ${
                filter === f.id 
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-xl shadow-indigo-600/20' 
                : 'bg-white/5 text-slate-500 border-white/5 hover:text-white hover:bg-white/10'
              }`}
            >
              {f.label}
              <span className={`px-2 py-0.5 rounded-md text-[8px] ${
                filter === f.id ? 'bg-black/40 text-white' : 'bg-white/5 text-slate-600'
              }`}>
                {f.count}
              </span>
            </button>
          ))}
          <button onClick={() => loadRequests()} className="p-3 bg-white/5 border border-white/5 rounded-2xl text-slate-400 hover:text-white transition-all active:rotate-180 duration-500">
             <RefreshCw size={20} />
          </button>
        </div>
      </div>

      <div className="relative group max-w-lg">
        <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
        <input 
          type="text" 
          placeholder="Filtrar por nome do colaborador ou motivo..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-16 pr-8 py-6 bg-[#0A0A0A] border border-white/5 rounded-[2rem] text-xs font-bold outline-none text-white focus:border-indigo-600/50 transition-all placeholder:text-slate-700"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full py-32 flex flex-col items-center text-indigo-500 gap-6">
             <Loader2 size={64} className="animate-spin opacity-20" />
             <p className="text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">Sincronizando Banco...</p>
          </div>
        ) : filteredRequests.length > 0 ? (
          filteredRequests.map((req) => (
            <div 
              key={req.id}
              onClick={() => setViewingRequest(req)}
              className="bg-[#0A0A0A] rounded-[3rem] border border-white/5 p-10 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all cursor-pointer group relative flex flex-col h-full hover:border-indigo-600/30 overflow-hidden"
            >
              <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                req.status === 'pending' ? 'bg-amber-400' : req.status === 'approved' ? 'bg-emerald-500' : 'bg-red-500'
              }`}></div>
              
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 text-slate-500 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all border border-white/5 shadow-inner">
                    <UserIcon size={28} />
                  </div>
                  <div>
                    <h4 className="font-black text-white text-lg leading-none mb-2">{req.user_name}</h4>
                    <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em]">{req.type}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 p-6 rounded-3xl space-y-4 flex-1 mb-8 border border-white/5">
                <div className="flex items-center gap-3 text-slate-400">
                  <Calendar size={14} className="text-indigo-500" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Data: {new Date(req.date).toLocaleDateString('pt-BR')}</span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 italic leading-relaxed font-medium">
                  "{req.description || 'Sem justificativa detalhada'}"
                </p>
              </div>

              <button className="w-full py-5 bg-white/5 hover:bg-white text-white hover:text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all border border-white/5">
                Analisar Protocolo <ChevronRight size={16} />
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-full py-40 text-center space-y-6 opacity-20 flex flex-col items-center">
             <Inbox size={100} strokeWidth={1} />
             <p className="text-[11px] font-black uppercase tracking-[0.4em]">Nenhum pedido pendente</p>
          </div>
        )}
      </div>

      {viewingRequest && (
        <div className="fixed inset-0 z-[6000] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-[#0A0A0A] w-full max-w-4xl rounded-[3.5rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[94vh]">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl">
                  <FileText size={28} />
                </div>
                <div>
                  <h3 className="font-black text-[10px] uppercase tracking-[0.4em] text-slate-500">Módulo Auditoria Digital</h3>
                  <p className="text-sm font-black text-white uppercase italic tracking-tight">Protocolo: {viewingRequest.id.split('-')[0]}</p>
                </div>
              </div>
              <button onClick={() => { setViewingRequest(null); setAiResult(null); }} className="p-4 bg-white/5 rounded-2xl text-slate-500 hover:text-red-500 transition-all border border-white/5"><X size={24}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row custom-scrollbar">
              {/* Lado Esquerdo: Documento */}
              <div className="flex-1 p-10 space-y-8 border-b lg:border-b-0 lg:border-r border-white/5">
                <div className="flex items-center justify-between">
                   <h4 className="text-3xl font-black text-white tracking-tighter italic">{viewingRequest.user_name}</h4>
                   <span className="text-[9px] font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full">{viewingRequest.type}</span>
                </div>

                <div className="aspect-[3/4] bg-black rounded-[3rem] overflow-hidden border-4 border-white/5 group relative shadow-2xl flex items-center justify-center">
                  {viewingRequest.attachment ? (
                    <img src={viewingRequest.attachment} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-6 opacity-20 text-white">
                      <FileText size={80} />
                      <p className="text-[11px] font-black uppercase tracking-[0.4em]">Sem anexo disponível</p>
                    </div>
                  )}
                  {viewingRequest.attachment && (
                    <a href={viewingRequest.attachment} target="_blank" className="absolute top-6 right-6 p-4 bg-black/60 backdrop-blur-xl text-white rounded-2xl border border-white/10 hover:bg-white hover:text-black transition-all">
                       <ExternalLink size={20} />
                    </a>
                  )}
                </div>

                <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 italic text-slate-300 text-sm leading-relaxed">
                   <p className="text-[9px] font-black uppercase text-indigo-500 mb-4 not-italic tracking-[0.3em]">Justificativa do Colaborador</p>
                   "{viewingRequest.description || 'Nenhuma descrição informada.'}"
                </div>
              </div>

              {/* Lado Direito: Inteligência Lux AI */}
              <div className="w-full lg:w-[400px] bg-[#050505] p-10 space-y-8">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <Sparkles size={20} className="text-amber-500" />
                       <h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Lux AI Auditoria</h4>
                    </div>
                    {aiResult && (
                       <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${aiResult.isOfficial ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                          {aiResult.isOfficial ? 'OFICIAL' : 'ALERTA DE FRAUDE'}
                       </div>
                    )}
                 </div>

                 {!aiResult ? (
                   <div className="bg-white/5 rounded-[2.5rem] p-10 text-center space-y-6 border border-white/5">
                      <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 mx-auto animate-pulse">
                         <FileSearch size={32} />
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-black text-white uppercase tracking-widest">Auditoria Automática</p>
                        <p className="text-[9px] font-medium text-slate-500 leading-relaxed">
                          Deseja que a Lux analise a legitimidade deste documento agora?
                        </p>
                      </div>
                      <button 
                        onClick={() => analyzeDocumentWithLux(viewingRequest)}
                        disabled={isAnalyzing || !viewingRequest.attachment}
                        className="w-full py-5 bg-amber-500 text-black rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-amber-500/20 flex items-center justify-center gap-3 hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
                      >
                         {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} fill="black" />}
                         {isAnalyzing ? 'ANALISANDO...' : 'LUX AI: ANALISAR AGORA'}
                      </button>
                   </div>
                 ) : (
                   <div className="space-y-6 animate-in slide-in-from-right-10 duration-500">
                      <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
                         <div className="flex justify-between items-center">
                            <p className="text-[9px] font-black text-slate-500 uppercase">Resumo da Visão</p>
                            <span className="text-[10px] font-black text-amber-500">{aiResult.confidence}% Precisão</span>
                         </div>
                         <p className="text-xs font-bold text-slate-300 leading-relaxed italic">"{aiResult.summary}"</p>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                         <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                            <span className="text-[8px] font-black text-slate-600 uppercase">Médico</span>
                            <span className="text-[10px] font-black text-white">{aiResult.detectedData.doctorName || 'Não identificado'}</span>
                         </div>
                         <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                            <span className="text-[8px] font-black text-slate-600 uppercase">CRM</span>
                            <span className="text-[10px] font-black text-indigo-400">{aiResult.detectedData.crm || 'N/A'}</span>
                         </div>
                         <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                            <span className="text-[8px] font-black text-slate-600 uppercase">Afastamento</span>
                            <span className="text-[10px] font-black text-teal-400">{aiResult.detectedData.daysOff || '0 dias'}</span>
                         </div>
                      </div>

                      <div className={`p-6 rounded-3xl border ${aiResult.isOfficial ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'} space-y-3`}>
                         <div className="flex items-center gap-2">
                            {aiResult.isOfficial ? <ShieldCheck size={16} className="text-emerald-500" /> : <AlertTriangle size={16} className="text-red-500" />}
                            <p className="text-[10px] font-black uppercase text-white tracking-widest">Recomendação Lux</p>
                         </div>
                         <p className="text-[10px] font-bold text-slate-400 leading-relaxed">{aiResult.recommendation}</p>
                      </div>

                      <div className="flex gap-3 pt-4">
                         <button 
                           onClick={() => handleUpdateStatus(viewingRequest.id, 'rejected')}
                           className="flex-1 py-4 bg-red-500/10 text-red-500 rounded-2xl font-black text-[9px] uppercase tracking-widest border border-red-500/20 active:scale-95 transition-all"
                         >
                            Indeferir
                         </button>
                         <button 
                           onClick={() => handleUpdateStatus(viewingRequest.id, 'approved')}
                           className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-xl shadow-emerald-600/20 active:scale-95 transition-all"
                         >
                            Deferir Pedido
                         </button>
                      </div>
                   </div>
                 )}
                 
                 <div className="flex items-center gap-3 opacity-20 justify-center">
                    <Fingerprint size={16} />
                    <span className="text-[8px] font-black uppercase tracking-[0.4em]">Audit Compliance v2.1</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRequestsManager;
