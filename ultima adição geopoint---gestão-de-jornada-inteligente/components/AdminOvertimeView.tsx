
import React, { useState, useMemo } from 'react';
import { TimeRecord, User } from '../types';
import { GoogleGenAI } from "@google/genai";
import { 
  Zap, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  Loader2, 
  ChevronRight, 
  User as UserIcon,
  Building2,
  Sparkles,
  BarChart,
  History,
  Info
} from 'lucide-react';

interface AdminOvertimeViewProps {
  records: TimeRecord[];
  users: User[];
}

interface OvertimeData {
  userId: string;
  userName: string;
  totalWorkedMinutes: number;
  extraMinutes: number;
  units: {[key: string]: number};
}

interface AIOvertimeInsight {
  summary: string;
  risks: { 
    employeeName: string; 
    reason: string; 
    severity: 'low' | 'medium' | 'high';
    mainUnit: string;
  }[];
  costEfficiency: number;
}

const AdminOvertimeView: React.FC<AdminOvertimeViewProps> = ({ records, users }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<AIOvertimeInsight | null>(null);

  // Lógica de cálculo de banco de horas (Base 8h por dia útil)
  const overtimeStats = useMemo(() => {
    const userGroups: {[key: string]: OvertimeData} = {};
    const standardDailyMinutes = 8 * 60; // 8 horas padrão

    // Agrupar registros por dia e por usuário
    const dailyData: {[key: string]: {[key: string]: { entries: number[], exits: number[], unit: string }}} = {};

    records.forEach(r => {
      const dateKey = new Date(r.timestamp).toISOString().split('T')[0];
      const userId = r.userId;

      if (!dailyData[dateKey]) dailyData[dateKey] = {};
      if (!dailyData[dateKey][userId]) dailyData[dateKey][userId] = { entries: [], exits: [], unit: r.locationName };

      if (r.type === 'entry') dailyData[dateKey][userId].entries.push(r.timestamp);
      else dailyData[dateKey][userId].exits.push(r.timestamp);
    });

    Object.keys(dailyData).forEach(date => {
      Object.keys(dailyData[date]).forEach(userId => {
        const data = dailyData[date][userId];
        if (data.entries.length > 0 && data.exits.length > 0) {
          const entry = Math.min(...data.entries);
          const exit = Math.max(...data.exits);
          const workedMs = exit - entry;
          const workedMinutes = workedMs / (1000 * 60);

          if (!userGroups[userId]) {
            const user = users.find(u => u.id === userId);
            userGroups[userId] = {
              userId,
              userName: user?.name || 'Desconhecido',
              totalWorkedMinutes: 0,
              extraMinutes: 0,
              units: {}
            };
          }

          userGroups[userId].totalWorkedMinutes += workedMinutes;
          const extra = workedMinutes > standardDailyMinutes ? workedMinutes - standardDailyMinutes : 0;
          userGroups[userId].extraMinutes += extra;

          if (!userGroups[userId].units[data.unit]) userGroups[userId].units[data.unit] = 0;
          userGroups[userId].units[data.unit] += extra;
        }
      });
    });

    return Object.values(userGroups).sort((a, b) => b.extraMinutes - a.extraMinutes);
  }, [records, users]);

  const generateAIAudit = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `Analise os dados de horas extras da empresa abaixo. 
      Identifique funcionários com excesso de jornada (mais de 2h extras por dia ou tendência perigosa) e em quais unidades isso mais acontece. 
      Retorne um JSON rigoroso:
      {
        "summary": "Resumo executivo da eficiência de horas extras",
        "risks": [{"employeeName": "Nome", "reason": "Motivo", "severity": "low|medium|high", "mainUnit": "Nome da Unidade"}],
        "costEfficiency": number (0-100)
      }`;

      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt + "\n\nDados:\n" + JSON.stringify(overtimeStats.slice(0, 10)) }] }],
        config: { responseMimeType: "application/json" }
      });

      setAiInsight(JSON.parse(result.text || "{}"));
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatHours = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      
      {/* LUX AI OVERTIME PANEL */}
      <div className="bg-[#0A0A0A] rounded-[3rem] border border-white/10 p-10 shadow-[0_0_80px_rgba(0,0,0,0.5)] relative overflow-hidden">
         <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
            <TrendingUp size={300} />
         </div>

         <div className="flex flex-col lg:flex-row justify-between items-start gap-10 relative z-10">
            <div className="max-w-xl space-y-6">
               <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                  <Sparkles size={16} className="text-indigo-400" />
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Lux Overtime Audit</span>
               </div>
               <h2 className="text-4xl font-black italic text-white leading-none">Inteligência de Banco de Horas</h2>
               <p className="text-sm text-slate-400 font-medium leading-relaxed">
                  Auditamos automaticamente a jornada de cada colaborador para identificar excedentes, custos por unidade e possíveis irregularidades jurídicas.
               </p>
               
               {!aiInsight ? (
                  <button 
                    onClick={generateAIAudit}
                    disabled={isAnalyzing}
                    className="px-10 py-5 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-2xl hover:scale-105 active:scale-95 transition-all"
                  >
                     {isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} fill="black" />}
                     {isAnalyzing ? 'Calculando Métricas...' : 'Auditar com Lux AI'}
                  </button>
               ) : (
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4 animate-in slide-in-from-left-4">
                     <p className="text-xs font-bold text-slate-300 leading-relaxed italic">"{aiInsight.summary}"</p>
                     <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                        <div className="text-center">
                           <p className="text-[8px] font-black text-slate-500 uppercase">Eficiência de Custo</p>
                           <p className={`text-xl font-black ${aiInsight.costEfficiency > 80 ? 'text-teal-400' : 'text-amber-500'}`}>{aiInsight.costEfficiency}%</p>
                        </div>
                        <div className="text-center">
                           <p className="text-[8px] font-black text-slate-500 uppercase">Risco Detectado</p>
                           <p className="text-xl font-black text-red-500">{aiInsight.risks.length}</p>
                        </div>
                        <button onClick={() => setAiInsight(null)} className="text-[9px] font-black text-slate-600 hover:text-white uppercase ml-auto">Atualizar Dados</button>
                     </div>
                   </div>
               )}
            </div>

            {aiInsight && (
               <div className="w-full lg:w-[400px] space-y-4">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Alertas de Auditoria</p>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                     {aiInsight.risks.map((risk, idx) => (
                        <div key={idx} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col gap-2 group hover:bg-white/10 transition-all">
                           <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${risk.severity === 'high' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                                <p className="text-[10px] font-black text-white uppercase">{risk.employeeName}</p>
                             </div>
                             <span className="text-[8px] font-black text-slate-600 uppercase">{risk.mainUnit}</span>
                           </div>
                           <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed">{risk.reason}</p>
                        </div>
                     ))}
                  </div>
               </div>
            )}
         </div>
      </div>

      {/* OVERTIME LIST */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-[#0A0A0A] rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
              <div className="px-10 py-8 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <History size={18} className="text-slate-500" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Consolidado Mensal</h3>
                 </div>
              </div>
              <div className="divide-y divide-white/5">
                 {overtimeStats.map(stat => (
                    <div key={stat.userId} className="p-8 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                       <div className="flex items-center gap-6">
                          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-600 border border-white/5">
                             <UserIcon size={20} />
                          </div>
                          <div>
                             <h4 className="font-black text-white uppercase tracking-tight">{stat.userName}</h4>
                             <div className="flex items-center gap-4 mt-1.5">
                                <p className="text-[9px] font-bold text-slate-600 uppercase flex items-center gap-1">
                                   <Clock size={10} /> Total: {formatHours(stat.totalWorkedMinutes)}
                                </p>
                             </div>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className={`text-2xl font-black tabular-nums ${stat.extraMinutes > 0 ? 'text-amber-500' : 'text-slate-500'}`}>
                             +{formatHours(stat.extraMinutes)}
                          </p>
                          <p className="text-[8px] font-black text-slate-700 uppercase mt-1 tracking-widest">Banco Excedente</p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* TOP UNITS BY OVERTIME */}
        <div className="space-y-6">
           <div className="bg-[#0A0A0A] rounded-[2.5rem] border border-white/5 p-8 shadow-2xl h-full">
              <div className="flex items-center gap-3 mb-8">
                 <Building2 size={18} className="text-indigo-500" />
                 <h4 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Overtime por Unidade</h4>
              </div>
              <div className="space-y-4">
                 {Object.entries(
                    overtimeStats.reduce((acc, curr) => {
                       Object.entries(curr.units).forEach(([unit, extra]) => {
                          acc[unit] = (acc[unit] || 0) + extra;
                       });
                       return acc;
                    }, {} as {[key: string]: number})
                 ).sort((a, b) => b[1] - a[1]).map(([unit, extra], idx) => (
                    <div key={idx} className="bg-white/5 p-6 rounded-3xl border border-white/5 group hover:border-indigo-500/20 transition-all">
                       <div className="flex justify-between items-center mb-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase truncate">{unit}</p>
                          <span className="text-[10px] font-black text-indigo-400">+{formatHours(extra)}</span>
                       </div>
                       <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <div 
                             className="h-full bg-indigo-600 rounded-full" 
                             style={{ width: `${Math.min(100, (extra / (100 * 60)) * 100)}%` }}
                          ></div>
                       </div>
                    </div>
                 ))}
                 {overtimeStats.length === 0 && (
                   <div className="py-20 text-center opacity-10 flex flex-col items-center gap-4">
                     <BarChart size={40} strokeWidth={1} />
                     <p className="text-[9px] font-black uppercase tracking-widest">Sem dados de unidades</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOvertimeView;
