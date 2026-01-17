
import React, { useState, useEffect, useCallback } from 'react';
import { StorageService } from '../services/storage';
import { WorkSchedule, WorkShift } from '../types';
import { 
  Plus, 
  Trash2, 
  Save, 
  Clock, 
  Calendar, 
  ChevronRight, 
  Settings, 
  X, 
  Edit3, 
  ArrowLeft,
  LayoutGrid,
  Zap,
  Loader2,
  AlertCircle,
  ChevronDown,
  Info,
  CheckCircle2
} from 'lucide-react';

interface AdminSchedulesViewProps {
  workspaceId: string;
}

const AdminSchedulesView: React.FC<AdminSchedulesViewProps> = ({ workspaceId }) => {
  const [view, setView] = useState<'list' | 'editor' | 'shifts'>('list');
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [editingSchedule, setEditingSchedule] = useState<WorkSchedule | null>(null);
  const [showShiftModal, setShowShiftModal] = useState<Partial<WorkShift> | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!workspaceId || workspaceId === 'PENDENTE') return;
      const [sch, shf] = await Promise.all([
        StorageService.getSchedules(workspaceId),
        StorageService.getShifts(workspaceId)
      ]);
      setSchedules(sch);
      setShifts(shf);
    } catch (err) {
      console.error("Erro ao carregar escalas:", err);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateNewSchedule = () => {
    const newSch: WorkSchedule = {
      id: `sch-${Date.now()}`,
      name: '',
      type: 'standard',
      workspaceId,
    };
    setEditingSchedule(newSch);
    setView('editor');
  };

  const handleSaveSchedule = async () => {
    if (!editingSchedule || !editingSchedule.name.trim()) {
       alert("Dê um nome para a escala.");
       return;
    }
    
    setIsLoading(true);
    try {
      await StorageService.saveSchedule(editingSchedule);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setView('list');
        loadData();
      }, 1500);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar escala no banco de dados.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveShift = async (shift: Partial<WorkShift>) => {
    if (!shift.name?.trim()) {
       alert("Nome da jornada obrigatório.");
       return;
    }
    setIsLoading(true);
    try {
      await StorageService.saveShift(workspaceId, shift);
      setShowShiftModal(null);
      loadData();
    } catch (err) {
      alert("Erro ao salvar jornada.");
    } finally {
      setIsLoading(false);
    }
  };

  const days = [
    { key: 'mondayShiftId', label: 'Segunda' },
    { key: 'tuesdayShiftId', label: 'Terça' },
    { key: 'wednesdayShiftId', label: 'Quarta' },
    { key: 'thursdayShiftId', label: 'Quinta' },
    { key: 'fridayShiftId', label: 'Sexta' },
    { key: 'saturdayShiftId', label: 'Sábado' },
    { key: 'sundayShiftId', label: 'Domingo' },
  ];

  if (view === 'editor' && editingSchedule) {
    return (
      <div className="animate-in fade-in space-y-10 pb-20">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-6">
              <button onClick={() => setView('list')} className="p-4 bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-all"><ArrowLeft size={24} /></button>
              <div>
                 <h2 className="text-3xl font-black italic text-white">Configurar Escala</h2>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Defina as regras semanais</p>
              </div>
           </div>
           
           <button 
             disabled={isLoading || saveSuccess}
             onClick={handleSaveSchedule} 
             className={`px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-2xl transition-all ${
               saveSuccess ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:scale-105 active:scale-95'
             }`}
           >
              {saveSuccess ? <CheckCircle2 size={18} /> : (isLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />)}
              {saveSuccess ? 'ESCALA SALVA!' : (isLoading ? 'SALVANDO...' : 'SALVAR ESCALA')}
           </button>
        </div>

        <div className="bg-[#0A0A0A] rounded-[3rem] border border-white/5 p-10 space-y-12 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
              <Calendar size={200} />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              <div className="space-y-3">
                 <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-4">Descrição da Escala</label>
                 <input 
                   value={editingSchedule.name} 
                   onChange={e => setEditingSchedule({...editingSchedule, name: e.target.value})}
                   className="w-full p-6 bg-[#121212] border-2 border-white/5 rounded-3xl text-sm font-black text-white outline-none focus:border-indigo-600/50 transition-all placeholder:text-slate-800" 
                   placeholder="Ex: Comercial 8h - Sede Administrativa" 
                 />
              </div>
              <div className="space-y-3">
                 <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-4">Tipo de Regime</label>
                 <div className="relative">
                    <select 
                      value={editingSchedule.type} 
                      onChange={e => setEditingSchedule({...editingSchedule, type: e.target.value as any})}
                      className="w-full p-6 bg-[#121212] border-2 border-white/5 rounded-3xl text-sm font-black text-white outline-none focus:border-indigo-600/50 transition-all appearance-none cursor-pointer"
                    >
                        <option value="standard">Padrão Semanal (5x2 ou 6x1)</option>
                        <option value="12x36">Regime de Plantão 12x36</option>
                        <option value="flexible">Jornada Total Flexível</option>
                    </select>
                    <ChevronDown size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                 </div>
              </div>
           </div>

           <div className="pt-10 border-t border-white/5 space-y-8 relative z-10">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                    <h3 className="text-xl font-black uppercase italic text-white tracking-tight">Grade de Turnos Diários</h3>
                 </div>
                 <button onClick={() => setView('shifts')} className="text-[9px] font-black text-indigo-400 hover:text-white uppercase tracking-widest flex items-center gap-2 bg-indigo-500/10 px-4 py-2 rounded-full transition-all">
                    <Edit3 size={14} /> Criar Novos Turnos
                 </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                 {days.map(day => {
                   const isWeekend = day.key === 'saturdayShiftId' || day.key === 'sundayShiftId';
                   const currentShiftId = (editingSchedule as any)[day.key];
                   const isFolga = !currentShiftId;

                   return (
                    <div key={day.key} className={`p-6 rounded-[2.5rem] border-2 transition-all group ${
                      isFolga ? 'bg-black/40 border-white/5 grayscale' : 'bg-indigo-600/5 border-indigo-600/20'
                    }`}>
                        <p className={`text-[10px] font-black uppercase text-center mb-4 tracking-widest ${isWeekend ? 'text-amber-500' : 'text-slate-500'}`}>
                          {day.label}
                        </p>
                        <div className="relative">
                          <select 
                              value={currentShiftId || ''} 
                              onChange={e => setEditingSchedule({...editingSchedule, [day.key]: e.target.value})}
                              className={`w-full p-4 rounded-2xl text-[10px] font-black outline-none border transition-all appearance-none text-center cursor-pointer ${
                                isFolga ? 'bg-black text-slate-600 border-white/5' : 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20'
                              }`}
                          >
                              <option value="">FOLGA</option>
                              {shifts.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                          </select>
                          <ChevronDown size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isFolga ? 'text-slate-800' : 'text-indigo-200'}`} />
                        </div>
                        {currentShiftId && (
                           <div className="mt-4 pt-4 border-t border-indigo-600/10 text-center">
                              <p className="text-[8px] font-black text-indigo-400 uppercase">Horário Vinculado</p>
                              <p className="text-[10px] font-bold text-slate-400 mt-1">
                                {shifts.find(s => s.id === currentShiftId)?.startTime} - {shifts.find(s => s.id === currentShiftId)?.endTime}
                              </p>
                           </div>
                        )}
                    </div>
                 )})}
              </div>
           </div>
        </div>
      </div>
    );
  }

  if (view === 'shifts') {
    return (
      <div className="animate-in fade-in space-y-10">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-6">
              <button onClick={() => setView('editor')} className="p-4 bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-all"><ArrowLeft size={24} /></button>
              <div>
                 <h2 className="text-3xl font-black italic text-white">Catálogo de Jornadas</h2>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Modelos de turnos disponíveis</p>
              </div>
           </div>
           <button onClick={() => setShowShiftModal({ id: `shf-${Date.now()}`, name: '', startTime: '08:00', endTime: '18:00', breakMinutes: 60 })} className="px-8 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">
              Nova Jornada
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {shifts.map(s => (
             <div key={s.id} className="bg-[#0A0A0A] p-10 rounded-[3rem] border border-white/5 flex flex-col group hover:border-indigo-600/30 transition-all relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-6 opacity-[0.02] pointer-events-none">
                   <Clock size={100} />
                </div>
                <div className="flex justify-between items-start mb-10">
                   <div className="w-16 h-16 bg-indigo-600/10 text-indigo-500 rounded-2xl flex items-center justify-center border border-indigo-600/10 shadow-inner">
                      <Clock size={32} />
                   </div>
                   <div className="flex gap-2">
                      <button onClick={() => setShowShiftModal(s)} className="p-3 bg-white/5 rounded-xl text-slate-500 hover:text-indigo-400 transition-all border border-white/5"><Edit3 size={18} /></button>
                      <button onClick={async () => { if(confirm('Excluir este modelo?')) { await supabase.from('work_shifts').delete().eq('id', s.id); loadData(); } }} className="p-3 bg-white/5 rounded-xl text-slate-500 hover:text-red-500 transition-all border border-white/5"><Trash2 size={18} /></button>
                   </div>
                </div>
                <h3 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tighter">{s.name}</h3>
                <div className="space-y-4 pt-8 border-t border-white/5 mt-auto">
                   <div className="flex justify-between items-center">
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Duração</p>
                      <p className="text-sm font-black text-white tabular-nums">{s.startTime} às {s.endTime}</p>
                   </div>
                   <div className="flex justify-between items-center">
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Almoço</p>
                      <p className="text-sm font-black text-teal-400 tabular-nums">{s.breakMinutes} Minutos</p>
                   </div>
                </div>
             </div>
           ))}
        </div>

        {showShiftModal && (
          <div className="fixed inset-0 z-[8000] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-in zoom-in-95 duration-300">
             <div className="bg-[#0D0D0D] w-full max-w-lg rounded-[4rem] border border-white/10 shadow-2xl p-12 space-y-12 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 to-indigo-600"></div>
                <div className="flex items-center justify-between">
                   <div>
                      <h3 className="text-3xl font-black italic text-white leading-none">Configurar Turno</h3>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mt-3">Parâmetros Horários</p>
                   </div>
                   <button onClick={() => setShowShiftModal(null)} className="p-4 bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-all"><X size={24} /></button>
                </div>
                <div className="space-y-8">
                   <div className="space-y-3">
                      <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-4">Título da Jornada</label>
                      <input value={showShiftModal.name} onChange={e => setShowShiftModal({...showShiftModal, name: e.target.value})} className="w-full p-6 bg-[#1A1A1A] border-2 border-white/5 rounded-3xl text-sm font-black text-white outline-none focus:border-teal-500/30 transition-all placeholder:text-slate-800" placeholder="Ex: Comercial SP (08:00 às 18:00)" />
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                         <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-4">Entrada Padrão</label>
                         <input type="time" value={showShiftModal.startTime} onChange={e => setShowShiftModal({...showShiftModal, startTime: e.target.value})} className="w-full p-6 bg-[#1A1A1A] border-2 border-white/5 rounded-3xl text-sm font-black text-white outline-none focus:border-teal-500/30 transition-all" />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-4">Saída Padrão</label>
                         <input type="time" value={showShiftModal.endTime} onChange={e => setShowShiftModal({...showShiftModal, endTime: e.target.value})} className="w-full p-6 bg-[#1A1A1A] border-2 border-white/5 rounded-3xl text-sm font-black text-white outline-none focus:border-teal-500/30 transition-all" />
                      </div>
                   </div>
                   <div className="space-y-3">
                      <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-4">Intervalo Intrajornada (Minutos)</label>
                      <input type="number" value={showShiftModal.breakMinutes} onChange={e => setShowShiftModal({...showShiftModal, breakMinutes: parseInt(e.target.value)})} className="w-full p-6 bg-[#1A1A1A] border-2 border-white/5 rounded-3xl text-sm font-black text-white outline-none focus:border-teal-500/30 transition-all" />
                   </div>
                </div>
                <button 
                  disabled={isLoading}
                  onClick={() => handleSaveShift(showShiftModal)} 
                  className="w-full py-6 bg-gradient-to-r from-teal-500 to-indigo-600 text-white rounded-3xl font-black text-[11px] uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                   {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                   {isLoading ? 'SALVANDO JORNADA...' : 'CONFIRMAR E SALVAR'}
                </button>
             </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-in fade-in space-y-10">
       <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black italic text-white">Escalas Operacionais</h2>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Sincronização de regras trabalhistas</p>
          </div>
          <button onClick={handleCreateNewSchedule} className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">
             Nova Escala
          </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {schedules.map(sch => (
            <div key={sch.id} className="bg-[#0A0A0A] rounded-[3.5rem] border border-white/5 p-10 shadow-2xl flex flex-col group hover:border-indigo-600/30 transition-all relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none scale-150 group-hover:scale-[1.7] transition-transform duration-700">
                  <Calendar size={120} />
               </div>
               
               <div className="flex justify-between items-start mb-10 relative z-10">
                 <div className="w-16 h-16 bg-indigo-600/10 text-indigo-500 rounded-2xl flex items-center justify-center border border-indigo-600/10 shrink-0 shadow-inner">
                    <Calendar size={32} />
                 </div>
                 <div className="flex gap-2 relative z-30">
                    <button onClick={() => { setEditingSchedule(sch); setView('editor'); }} className="p-3 bg-white/5 rounded-xl text-slate-500 hover:text-indigo-400 border border-white/10 transition-all opacity-40 hover:opacity-100 shadow-sm"><Edit3 size={18} /></button>
                    <button onClick={async () => { if(confirm('Excluir esta escala permanentemente?')) { await StorageService.deleteSchedule(sch.id); loadData(); } }} className="p-3 bg-white/5 rounded-xl text-slate-500 hover:text-red-500 border border-white/10 transition-all opacity-40 hover:opacity-100 shadow-sm"><Trash2 size={18} /></button>
                 </div>
               </div>
               
               <h3 className="text-2xl font-black text-white mb-3 uppercase italic tracking-tighter leading-none relative z-10">{sch.name}</h3>
               <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-10 relative z-10 flex items-center gap-2">
                 <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse"></div>
                 {sch.type === 'standard' ? 'Escala Semanal' : (sch.type === '12x36' ? 'Plantão 12x36' : 'Flexível')}
               </p>
               
               <div className="pt-8 border-t border-white/5 flex items-center justify-between relative z-10">
                  <div className="flex -space-x-3">
                     {[1,2,3,4,5,6,7].map(i => (
                       <div key={i} className="w-8 h-8 rounded-full bg-white/5 border-2 border-[#050505] flex items-center justify-center text-[8px] font-black text-slate-600 group-hover:text-indigo-400 transition-colors">
                         {i}
                       </div>
                     ))}
                  </div>
                  <button onClick={() => { setEditingSchedule(sch); setView('editor'); }} className="text-[9px] font-black text-white uppercase tracking-widest flex items-center gap-2 hover:text-indigo-400 transition-colors">
                     Configurar Grade <ChevronRight size={16} />
                  </button>
               </div>
            </div>
          ))}

          {schedules.length === 0 && (
             <div className="col-span-full py-40 text-center bg-white/[0.02] rounded-[4rem] border-2 border-dashed border-white/5 space-y-8">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto text-slate-700 shadow-inner">
                   <LayoutGrid size={48} />
                </div>
                <div className="space-y-2 px-10">
                   <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-500">Nenhum cronograma ativo</p>
                   <p className="text-[10px] text-slate-600 font-bold uppercase max-w-sm mx-auto leading-relaxed">
                     Para começar a gerir as horas extras, você deve criar uma Escala de Trabalho e atribuir aos seus colaboradores.
                   </p>
                </div>
                <button onClick={handleCreateNewSchedule} className="px-10 py-5 bg-white text-black rounded-3xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">
                  Criar Primeiro Modelo
                </button>
             </div>
          )}
       </div>
    </div>
  );
};

export default AdminSchedulesView;
