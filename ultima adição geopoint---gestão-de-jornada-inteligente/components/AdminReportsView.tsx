
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { StorageService } from '../services/storage';
import { TimeRecord, User, EmployeeRequest } from '../types';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { GoogleGenAI } from "@google/genai";
import { 
  FileText, 
  Download, 
  Search, 
  Calendar, 
  ArrowDownCircle, 
  ArrowUpCircle,
  Loader2,
  Activity,
  User as UserIcon,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  MapPin,
  Sparkles,
  Zap,
  TrendingDown,
  AlertCircle,
  Stethoscope,
  Palmtree,
  Info,
  BrainCircuit,
  ChevronRight,
  Target,
  // Added missing Clock import to fix 'Cannot find name Clock' error
  Clock
} from 'lucide-react';

interface AdminReportsViewProps {
  workspaceId: string;
  users: User[];
}

interface AIInsightResult {
  summary: string;
  anomalies: {
    userName: string;
    type: 'atraso' | 'falta' | 'afastamento' | 'ferias';
    description: string;
    severity: 'low' | 'medium' | 'high';
  }[];
  attendanceScore: number;
}

const AdminReportsView: React.FC<AdminReportsViewProps> = ({ workspaceId, users }) => {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<TimeRecord[]>([]);
  const [requests, setRequests] = useState<EmployeeRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Estados Lux AI
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<AIInsightResult | null>(null);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      if (!workspaceId || workspaceId === 'PENDENTE') return;
      const [recData, reqData] = await Promise.all([
        StorageService.getRecords(workspaceId),
        StorageService.getAdminRequests(workspaceId)
      ]);
      setRecords(recData || []);
      setRequests(reqData || []);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const generateAIInsight = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Preparar dados para a IA (simplificados para economizar tokens)
      const dataForAI = {
        period: dateRange,
        employees: users.map(u => ({ id: u.id, name: u.name })),
        punches: records.filter(r => {
          const d = new Date(r.timestamp).toISOString().split('T')[0];
          return d >= dateRange.start && d <= dateRange.end;
        }).map(r => ({ user: r.userName, type: r.type, time: new Date(r.timestamp).toLocaleTimeString(), date: new Date(r.timestamp).toLocaleDateString() })),
        approvedRequests: requests.filter(r => r.status === 'approved').map(r => ({
          user: r.user_name,
          type: r.type,
          date: r.date
        }))
      };

      const prompt = `Analise os dados de jornada da empresa para o período ${dateRange.start} a ${dateRange.end}.
      Sua tarefa é identificar:
      1. ATRASOS: Batidas de entrada após as 08:15 (use 08:00 como referência padrão).
      2. FALTAS: Dias úteis sem registro e sem pedido de abono.
      3. AFASTAMENTOS/FÉRIAS: Identificar quem está oficialmente de atestado médico ou férias conforme os 'approvedRequests'.
      4. Padrões comportamentais preocupantes.

      Responda em JSON rigoroso:
      {
        "summary": "resumo executivo profissional",
        "anomalies": [{ "userName": "string", "type": "atraso|falta|afastamento|ferias", "description": "detalhe", "severity": "low|medium|high" }],
        "attendanceScore": number (0-100)
      }`;

      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt + "\n\nDados:\n" + JSON.stringify(dataForAI) }] }],
        config: { responseMimeType: "application/json" }
      });

      const analysis = JSON.parse(result.text || "{}") as AIInsightResult;
      setAiInsight(analysis);
    } catch (err) {
      console.error("AI Insight Error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const date = new Date(r.timestamp).toISOString().split('T')[0];
      const matchesDate = date >= dateRange.start && date <= dateRange.end;
      const matchesUser = selectedUser === 'all' || r.userId === selectedUser;
      const matchesSearch = r.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            r.locationName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesDate && matchesUser && matchesSearch;
    }).sort((a, b) => b.timestamp - a.timestamp);
  }, [records, dateRange, selectedUser, searchTerm]);

  // Função para identificar status inteligente de uma linha
  const getSmartStatus = (record: TimeRecord) => {
    const punchDate = new Date(record.timestamp).toISOString().split('T')[0];
    const punchTime = new Date(record.timestamp).getHours() * 60 + new Date(record.timestamp).getMinutes();
    
    // Procura atestado/férias aprovados para este usuário nesta data
    const request = requests.find(r => r.user_id === record.userId && r.date === punchDate && r.status === 'approved');
    
    if (request?.type.toLowerCase().includes('atestado')) return { label: 'Atestado Médico', icon: <Stethoscope size={10} />, color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' };
    if (request?.type.toLowerCase().includes('férias')) return { label: 'Em Férias', icon: <Palmtree size={10} />, color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' };
    if (record.type === 'entry' && punchTime > (8 * 60 + 15)) return { label: 'Atraso Detectado', icon: <TrendingDown size={10} />, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    
    return { label: 'Regular', icon: <CheckCircle2 size={10} />, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      
      {/* LUX AI INSIGHT PANEL */}
      <div className="bg-[#0A0A0A] rounded-[3rem] border border-white/10 p-10 shadow-[0_0_80px_rgba(0,0,0,0.5)] relative overflow-hidden">
         <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
            <BrainCircuit size={300} />
         </div>

         <div className="flex flex-col lg:flex-row justify-between items-start gap-10 relative z-10">
            <div className="max-w-xl space-y-6">
               <div className="inline-flex items-center gap-3 px-4 py-2 bg-amber-500/10 rounded-full border border-amber-500/20">
                  <Sparkles size={16} className="text-amber-500" />
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Lux AI behavioral insight</span>
               </div>
               <h2 className="text-4xl font-black italic text-white leading-none">Inteligência de Jornada</h2>
               <p className="text-sm text-slate-400 font-medium leading-relaxed">
                  Utilizamos processamento neural para reconciliar batidas de ponto, atestados médicos e períodos de férias, identificando automaticamente anomalias e riscos trabalhistas.
               </p>
               
               {!aiInsight ? (
                  <button 
                    onClick={generateAIInsight}
                    disabled={isAnalyzing}
                    className="px-10 py-5 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-2xl hover:scale-105 active:scale-95 transition-all"
                  >
                     {isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} fill="black" />}
                     {isAnalyzing ? 'Processando Dados...' : 'Gerar Análise Lux AI'}
                  </button>
               ) : (
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4 animate-in slide-in-from-left-4">
                     <p className="text-xs font-bold text-slate-300 leading-relaxed italic">"{aiInsight.summary}"</p>
                     <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                        <div className="text-center">
                           <p className="text-[8px] font-black text-slate-500 uppercase">Eficiência Geral</p>
                           <p className="text-xl font-black text-teal-400">{aiInsight.attendanceScore}%</p>
                        </div>
                        <div className="text-center">
                           <p className="text-[8px] font-black text-slate-500 uppercase">Alertas Ativos</p>
                           <p className="text-xl font-black text-red-500">{aiInsight.anomalies.length}</p>
                        </div>
                        <button onClick={() => setAiInsight(null)} className="text-[9px] font-black text-slate-600 hover:text-white uppercase ml-auto">Recalcular</button>
                     </div>
                  </div>
               )}
            </div>

            {aiInsight && (
               <div className="w-full lg:w-[350px] space-y-4">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Incidentes de Auditoria</p>
                  <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                     {aiInsight.anomalies.map((anom, idx) => (
                        <div key={idx} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-4 group hover:bg-white/10 transition-all">
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              anom.severity === 'high' ? 'bg-red-500/10 text-red-500' : 
                              anom.severity === 'medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-indigo-500/10 text-indigo-500'
                           }`}>
                              {anom.type === 'atraso' ? <Clock size={20} /> : anom.type === 'falta' ? <AlertCircle size={20} /> : <Stethoscope size={20} />}
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-black text-white truncate uppercase">{anom.userName}</p>
                              <p className="text-[9px] text-slate-500 font-bold uppercase truncate">{anom.description}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}
         </div>
      </div>

      {/* FILTROS E TABELA (Padronizados) */}
      <div className="bg-[#0A0A0A] p-10 rounded-[3rem] border border-white/5 shadow-2xl space-y-8">
        <div className="flex flex-col lg:flex-row items-end gap-6">
           <div className="flex-1 space-y-3 w-full">
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 ml-4 flex items-center gap-2">
                 <Calendar size={12} /> Período
              </label>
              <div className="flex items-center gap-3">
                 <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="flex-1 bg-white/5 border border-white/10 p-5 rounded-2xl text-xs font-black text-white outline-none focus:border-indigo-600 transition-all" />
                 <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="flex-1 bg-white/5 border border-white/10 p-5 rounded-2xl text-xs font-black text-white outline-none focus:border-indigo-600 transition-all" />
              </div>
           </div>

           <div className="flex-1 space-y-3 w-full">
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 ml-4 flex items-center gap-2">
                 <UserIcon size={12} /> Colaborador
              </label>
              <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-xs font-black text-white outline-none focus:border-indigo-600 transition-all appearance-none">
                 <option value="all">TODOS OS MEMBROS</option>
                 {users.map(u => <option key={u.id} value={u.id}>{u.name.toUpperCase()}</option>)}
              </select>
           </div>
           
           <button onClick={() => loadData()} className="p-5 bg-white/5 border border-white/5 rounded-2xl text-slate-400 hover:text-white transition-all active:rotate-180 duration-700">
              <RefreshCw size={24} />
           </button>
        </div>

        <div className="rounded-[2.5rem] border border-white/5 overflow-hidden">
           <table className="w-full text-left border-collapse">
              <thead>
                 <tr className="bg-white/5 border-b border-white/5">
                    <th className="p-6 text-[9px] font-black uppercase tracking-widest text-slate-500">Data/Hora</th>
                    <th className="p-6 text-[9px] font-black uppercase tracking-widest text-slate-500">Colaborador</th>
                    <th className="p-6 text-[9px] font-black uppercase tracking-widest text-slate-500">Análise Lux AI</th>
                    <th className="p-6 text-[9px] font-black uppercase tracking-widest text-slate-500">Localização</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                 {filteredRecords.map(r => {
                   const status = getSmartStatus(r);
                   return (
                     <tr key={r.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="p-6">
                           <p className="text-sm font-black text-white tabular-nums">{new Date(r.timestamp).toLocaleDateString()}</p>
                           <p className="text-[10px] text-slate-600 font-bold tabular-nums mt-1">{new Date(r.timestamp).toLocaleTimeString()}</p>
                        </td>
                        <td className="p-6">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-500">
                                 <UserIcon size={14} />
                              </div>
                              <div>
                                 <p className="text-xs font-black text-white uppercase">{r.userName}</p>
                                 <p className="text-[8px] font-bold text-slate-600 uppercase">MAT: {r.employeeId}</p>
                              </div>
                           </div>
                        </td>
                        <td className="p-6">
                           <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${status.color}`}>
                              {status.icon}
                              <span className="text-[9px] font-black uppercase tracking-widest">{status.label}</span>
                           </div>
                        </td>
                        <td className="p-6">
                           <div className="flex items-center gap-3">
                              <MapPin size={14} className="text-slate-600" />
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight italic">{r.locationName.split('(')[0]}</p>
                           </div>
                        </td>
                     </tr>
                   );
                 })}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};

export default AdminReportsView;
