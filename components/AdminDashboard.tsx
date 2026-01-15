
import { QRCodeCanvas } from 'qrcode.react';
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { StorageService, supabase } from '../services/storage';
import { Location, TimeRecord, User } from '../types';
import RecordDetailsModal from './RecordDetailsModal';
import LocationPickerMap from './LocationPickerMap';
import { 
  AlertOctagon, 
  Building2, 
  CheckCircle2, 
  Clock, 
  Download, 
  Loader2, 
  MapPin, 
  Navigation, 
  Plus, 
  QrCode, 
  Save, 
  Search, 
  Trash2, 
  TrendingUp, 
  Users,
  X,
  RefreshCw,
  Edit2
} from 'lucide-react';

interface AdminDashboardProps {
  isPro?: boolean;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ isPro = true }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'locations' | 'records'>('records');
  const [showAddLoc, setShowAddLoc] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  const [newLoc, setNewLoc] = useState({ id: '', name: '', address: '', document: '', radius: 100 });
  const [editUserForm, setEditUserForm] = useState({ 
    id: '', 
    name: '', 
    employeeId: '', 
    role: 'employee' as 'employee' | 'admin',
    email: '' 
  });
  
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{lat: number, lon: number} | null>(null);
  
  const [selectedRecord, setSelectedRecord] = useState<TimeRecord | null>(null);
  const [viewingQR, setViewingQR] = useState<Location | null>(null);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [records, setRecords] = useState<TimeRecord[]>([]);
  const [adminProfile, setAdminProfile] = useState<User | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const qrRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsLoadingData(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const profile = await StorageService.getProfile(user.id);
      if (!profile) return;
      setAdminProfile(profile);
      const [u, l, r] = await Promise.all([
        StorageService.getUsers(profile.workspaceId),
        StorageService.getLocations(profile.workspaceId),
        StorageService.getRecords(profile.workspaceId)
      ]);
      setUsers(u);
      setLocations(l);
      setRecords(r);
    } catch (err) {
      console.error("Erro ao sincronizar dados:", err);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const handleFocus = () => loadData(true);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') loadData(true);
    });
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadData]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (newLoc.address.length > 4 && !selectedCoords) {
        setIsSearchingAddress(true);
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(newLoc.address)}`);
          const data = await response.json();
          setAddressSuggestions(data.slice(0, 5));
        } catch (error) { console.error(error); } finally { setIsSearchingAddress(false); }
      } else { setAddressSuggestions([]); }
    }, 800);
    return () => clearTimeout(delayDebounceFn);
  }, [newLoc.address, selectedCoords]);

  const handleSelectSuggestion = (suggestion: any) => {
    setSelectedCoords({ lat: parseFloat(suggestion.lat), lon: parseFloat(suggestion.lon) });
    setNewLoc(prev => ({ ...prev, address: suggestion.display_name }));
    setAddressSuggestions([]);
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminProfile) return;
    setIsSubmitting(true);
    try {
      const locData = {
        name: newLoc.name,
        address: newLoc.address,
        document: newLoc.document,
        code: newLoc.id ? locations.find(l => l.id === newLoc.id)?.code : `LOC-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        workspaceId: adminProfile.workspaceId,
        latitude: selectedCoords?.lat,
        longitude: selectedCoords?.lon
      };

      if (newLoc.id) {
        await StorageService.updateLocation(newLoc.id, locData);
      } else {
        await StorageService.saveLocation(locData);
      }
      
      setShowAddLoc(false);
      setNewLoc({ id: '', name: '', address: '', document: '', radius: 100 });
      setSelectedCoords(null);
      await loadData();
    } catch (err) { alert("Erro ao salvar unidade."); } finally { setIsSubmitting(false); }
  };

  const handleUpdateUserProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminProfile || !editUserForm.id) return;
    setIsSubmitting(true);
    try {
      await StorageService.saveUser({
        id: editUserForm.id,
        name: editUserForm.name,
        email: editUserForm.email,
        employeeId: editUserForm.employeeId,
        role: editUserForm.role,
        workspaceId: adminProfile.workspaceId,
        createdAt: Date.now() 
      });
      setShowEditUser(false);
      await loadData();
    } catch (err: any) { 
      alert("Erro ao atualizar perfil."); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const filteredRecords = records.filter(r => r.userName.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.employeeId.includes(searchTerm));

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
      
      {isLoadingData && !isSubmitting && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[5000] bg-slate-900 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-2 border border-white/10">
          <RefreshCw size={12} className="animate-spin text-indigo-400" /> Sincronizando Central...
        </div>
      )}

      <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white border border-white/5 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10 mb-10">
            <div>
                <h2 className="text-3xl font-black tracking-tighter flex items-center gap-2 italic">Central de Gestão</h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Controle de Infraestrutura e Equipe</p>
            </div>
            <div className="bg-white/10 px-5 py-2.5 rounded-2xl flex items-center gap-3 border border-white/10 backdrop-blur-md">
                <Building2 size={16} className="text-indigo-400" />
                <span className="text-xs font-black tracking-widest uppercase">{adminProfile?.workspaceId}</span>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
            <div className="bg-white/5 p-6 rounded-3xl border border-white/5 flex flex-col justify-between h-36">
                <div className="p-2.5 bg-indigo-500/20 rounded-xl text-indigo-300 w-fit"><Clock size={20} /></div>
                <div><h3 className="text-3xl font-black tabular-nums">{records.length}</h3><p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Registros Hoje</p></div>
            </div>
            <div className="bg-white/5 p-6 rounded-3xl border border-white/5 flex flex-col justify-between h-36">
                <div className="p-2.5 bg-blue-500/20 rounded-xl text-blue-300 w-fit"><Users size={20} /></div>
                <div><h3 className="text-3xl font-black tabular-nums">{users.length}</h3><p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Membros Vinculados</p></div>
            </div>
            <div className="bg-white/5 p-6 rounded-3xl border border-white/5 flex flex-col justify-between h-36">
                <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-300 w-fit"><MapPin size={20} /></div>
                <div><h3 className="text-3xl font-black tabular-nums">{locations.length}</h3><p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Unidades Ativas</p></div>
            </div>
        </div>
      </section>

      <nav className="flex bg-white dark:bg-slate-900 p-2 rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 gap-2 overflow-x-auto custom-scrollbar">
        {[
          { id: 'records', label: 'Registros', icon: <Clock size={12}/> }, 
          { id: 'users', label: 'Equipe', icon: <Users size={12}/> }, 
          { id: 'locations', label: 'Unidades', icon: <MapPin size={12}/> }
        ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 min-w-[130px] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl scale-105' : 'text-slate-400 hover:bg-slate-50'}`}>
                {tab.icon} {tab.label}
            </button>
        ))}
      </nav>

      {activeTab === 'users' && (
        <div className="animate-in fade-in space-y-6">
          <div className="px-4">
             <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">Membros da Empresa</h3>
             <p className="text-slate-400 text-xs font-medium">Os colaboradores criam seus próprios acessos usando o código da empresa. Você pode gerenciar os dados de perfil abaixo.</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
             <div className="p-4 border-b border-slate-50 flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                   <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                   <input type="text" placeholder="Pesquisar membro..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none" />
                </div>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead>
                   <tr className="bg-slate-50/50 dark:bg-white/5">
                     <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Colaborador</th>
                     <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Matrícula</th>
                     <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Cargo</th>
                     <th className="px-8 py-5 text-right">Ações</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                   {filteredUsers.map(u => (
                     <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                       <td className="px-8 py-5">
                         <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-[12px]">{u.name.substring(0, 2).toUpperCase()}</div>
                           <div><p className="font-black text-sm text-slate-800 dark:text-white">{u.name}</p><p className="text-[10px] text-slate-400 font-bold">{u.email}</p></div>
                         </div>
                       </td>
                       <td className="px-8 py-5 text-[11px] font-black text-slate-500 tabular-nums">{u.employeeId}</td>
                       <td className="px-8 py-5"><span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase ${u.role === 'admin' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>{u.role === 'admin' ? 'Gestor' : 'Funcionário'}</span></td>
                       <td className="px-8 py-5 text-right space-x-2">
                         <button onClick={() => { setEditUserForm({id: u.id, name: u.name, employeeId: u.employeeId, role: u.role, email: u.email}); setShowEditUser(true); }} className="p-2.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Edit2 size={18} /></button>
                         <button onClick={() => setUserToDelete(u)} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'locations' && (
        <div className="space-y-8 animate-in fade-in">
           <div className="flex justify-between items-center px-4">
              <div><h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">Locais Habilitados</h3><p className="text-slate-400 text-xs font-medium">Unidades para registro de ponto eletrônico.</p></div>
              <button onClick={() => { setNewLoc({id: '', name: '', address: '', document: '', radius: 100}); setSelectedCoords(null); setShowAddLoc(true); }} className="px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl hover:scale-105 transition-all"><Plus size={16} /> Nova Unidade</button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.map(loc => (
                 <div key={loc.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-[3rem] p-8 shadow-sm hover:shadow-2xl transition-all flex flex-col justify-between group">
                    <div className="relative">
                      <div className="flex justify-between items-start mb-6">
                         <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all"><MapPin size={28} /></div>
                         <div className="flex gap-2">
                            {/* @fix: Ensured all required properties for newLoc state are provided, specifically radius which is not in the Location type */}
                            <button onClick={() => { setNewLoc({ id: loc.id, name: loc.name, address: loc.address || '', document: loc.document || '', radius: 100 }); setSelectedCoords({lat: loc.latitude || 0, lon: loc.longitude || 0}); setShowAddLoc(true); }} className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all border border-transparent hover:border-indigo-100"><Edit2 size={20} /></button>
                            <button onClick={() => setLocationToDelete(loc)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100"><Trash2 size={20} /></button>
                         </div>
                      </div>
                      <h4 className="font-black text-slate-800 dark:text-white text-xl mb-1 truncate">{loc.name}</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{loc.document || 'DOC NÃO INFORMADO'}</p>
                      <p className="text-xs text-slate-500 font-bold italic mb-8 leading-relaxed line-clamp-2"><Navigation size={12} className="inline mr-1" /> {loc.address}</p>
                    </div>
                    <button onClick={() => setViewingQR(loc)} className="w-full py-4.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-[1.8rem] font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
                       <QrCode size={18} /> Ver QR da Unidade
                    </button>
                 </div>
              ))}
           </div>
        </div>
      )}

      {activeTab === 'records' && (
         <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
            <div className="p-5 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
               <div className="relative max-w-sm w-full">
                 <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                 <input type="text" placeholder="Filtrar histórico..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-bold outline-none" />
               </div>
               <button onClick={() => StorageService.exportToCSV(records)} className="px-6 py-3.5 bg-slate-100 dark:bg-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-50 hover:text-indigo-600 transition-all"><Download size={16} /> Exportar CSV</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-white/5">
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Colaborador</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Tipo</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Horário</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Local</th>
                    <th className="px-8 py-5 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                  {filteredRecords.map(record => (
                    <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-8 py-5"><p className="font-black text-sm">{record.userName}</p><p className="text-[10px] text-slate-400 uppercase tracking-wide">ID: {record.employeeId}</p></td>
                      <td className="px-8 py-5"><span className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${record.type === 'entry' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>{record.type === 'entry' ? 'Entrada' : 'Saída'}</span></td>
                      <td className="px-8 py-5"><p className="text-sm font-black tabular-nums">{new Date(record.timestamp).toLocaleTimeString('pt-BR')}</p><p className="text-[10px] text-slate-400 font-bold">{new Date(record.timestamp).toLocaleDateString('pt-BR')}</p></td>
                      <td className="px-8 py-5"><p className="text-[10px] font-bold text-slate-400 truncate max-w-[120px]">{record.locationName.split('(')[0]}</p></td>
                      <td className="px-8 py-5 text-right"><button onClick={() => setSelectedRecord(record)} className="p-2.5 text-slate-400 hover:text-indigo-600 transition-colors"><Plus size={20} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
         </div>
      )}

      {showAddLoc && (
        <div className="fixed inset-0 z-[6000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#0f172a] rounded-[3.5rem] w-full max-w-5xl shadow-2xl overflow-hidden border border-white/5 flex flex-col md:flex-row h-[92vh] md:h-[600px]">
            <div className="w-full md:w-1/2 h-56 md:h-auto bg-slate-900 relative">
              {selectedCoords ? (
                <LocationPickerMap latitude={selectedCoords.lat} longitude={selectedCoords.lon} radius={newLoc.radius} />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 p-8 text-center gap-4">
                  <MapPin size={40} className="opacity-20" />
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] px-10">Pesquise o endereço para visualizar no mapa de controle</p>
                </div>
              )}
            </div>
            <div className="flex-1 p-8 md:p-12 overflow-y-auto">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">{newLoc.id ? 'Editar Unidade' : 'Nova Unidade'}</h3>
                <button onClick={() => setShowAddLoc(false)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><X size={28} /></button>
              </div>
              <form onSubmit={handleAddLocation} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identificação / Apelido</label>
                  <input required value={newLoc.name} onChange={e => setNewLoc({...newLoc, name: e.target.value})} className="w-full p-4.5 bg-slate-50 dark:bg-white/5 border border-slate-100 rounded-2xl font-black text-xs outline-none" placeholder="Ex: Sede Central" />
                </div>
                <div className="space-y-1.5 relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Endereço Completo</label>
                  <div className="relative">
                    <input required value={newLoc.address} onChange={e => { setSelectedCoords(null); setNewLoc({...newLoc, address: e.target.value}); }} className="w-full p-4.5 bg-slate-50 dark:bg-white/5 border border-slate-100 rounded-2xl font-black text-xs outline-none" placeholder="Pesquisar rua, nº, cidade..." />
                    {isSearchingAddress && <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-indigo-500" />}
                  </div>
                  {addressSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-[100] mt-2 bg-white dark:bg-slate-800 border rounded-2xl overflow-hidden shadow-2xl">
                      {addressSuggestions.map((s, i) => (
                        <button key={i} type="button" onClick={() => handleSelectSuggestion(s)} className="w-full p-4 text-left text-[10px] font-bold border-b last:border-none hover:bg-slate-50">
                          {s.display_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Documento (Opcional)</label>
                  <input value={newLoc.document} onChange={e => setNewLoc({...newLoc, document: e.target.value})} className="w-full p-4.5 bg-slate-50 dark:bg-white/5 border border-slate-100 rounded-2xl font-black text-xs outline-none" placeholder="CNPJ ou Identificação" />
                </div>
                <button disabled={isSubmitting || !newLoc.name.trim()} type="submit" className="w-full py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] bg-indigo-600 text-white shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Salvar Unidade'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {showEditUser && (
        <div className="fixed inset-0 z-[6000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white dark:bg-slate-900 rounded-[3rem] w-full max-w-md shadow-2xl p-8 border border-white/5 overflow-hidden">
              <div className="flex justify-between items-center mb-10">
                 <h3 className="text-2xl font-black tracking-tighter text-slate-800 dark:text-white">Editar Perfil</h3>
                 <button onClick={() => setShowEditUser(false)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><X size={28} /></button>
              </div>
              <form onSubmit={handleUpdateUserProfile} className="space-y-6">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                   <input required value={editUserForm.name} onChange={e => setEditUserForm({...editUserForm, name: e.target.value})} className="w-full p-4.5 bg-slate-50 dark:bg-white/5 border border-slate-100 rounded-2xl font-black text-xs outline-none focus:border-indigo-600 transition-all" placeholder="Nome completo" />
                </div>
                <div className="space-y-1.5 opacity-50">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail (Não editável pelo gestor)</label>
                   <input disabled value={editUserForm.email} className="w-full p-4.5 bg-slate-50 rounded-2xl font-bold text-xs cursor-not-allowed" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Matrícula</label>
                    <input required value={editUserForm.employeeId} onChange={e => setEditUserForm({...editUserForm, employeeId: e.target.value})} className="w-full p-4.5 bg-slate-50 rounded-2xl font-black text-xs outline-none" placeholder="Ex: 001" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cargo</label>
                    <select value={editUserForm.role} onChange={e => setEditUserForm({...editUserForm, role: e.target.value as any})} className="w-full p-4.5 bg-slate-50 rounded-2xl font-black text-[10px] uppercase tracking-widest outline-none">
                      <option value="employee">Funcionário</option>
                      <option value="admin">Gestor</option>
                    </select>
                  </div>
                </div>
                <button disabled={isSubmitting} type="submit" className="w-full py-5 mt-2 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] bg-indigo-600 text-white shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Salvar Perfil
                </button>
              </form>
           </div>
        </div>
      )}

      {viewingQR && (
         <div className="fixed inset-0 z-[6000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 max-w-sm w-full text-center space-y-8 shadow-2xl relative">
                <div className="flex justify-between items-center">
                    <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">QR Code Unidade</h4>
                    <button onClick={() => setViewingQR(null)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><X size={24}/></button>
                </div>
                <div>
                   <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">{viewingQR.name}</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Imprima para o local de registro</p>
                </div>
                <div ref={qrRef} className="bg-white p-8 rounded-[2rem] inline-block border-4 border-slate-50 shadow-inner">
                    <QRCodeCanvas value={viewingQR.code} size={200} level="H" />
                </div>
                <div className="space-y-3">
                   <button onClick={() => { const canvas = qrRef.current?.querySelector('canvas'); if(canvas) { const link = document.createElement("a"); link.download = `QR_${viewingQR.name}.png`; link.href = canvas.toDataURL(); link.click(); } }} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-xl hover:scale-105 transition-all"><Save size={18}/> Baixar PNG</button>
                </div>
            </div>
         </div>
      )}

      {locationToDelete && (
        <div className="fixed inset-0 z-[7000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 max-w-sm w-full text-center space-y-8 shadow-2xl">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto shadow-inner"><AlertOctagon size={48} /></div>
              <div>
                <h4 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">Excluir Unidade?</h4>
                <p className="text-slate-400 text-xs font-medium mt-2 leading-relaxed">Isso desativará o QR Code permanentemente.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => setLocationToDelete(null)} className="py-4.5 bg-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Manter</button>
                 <button onClick={async () => { setIsDeleting(true); await StorageService.deleteLocation(locationToDelete.id); setLocationToDelete(null); setIsDeleting(false); loadData(); }} className="py-4.5 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-red-700 active:scale-95 transition-all">Excluir</button>
              </div>
           </div>
        </div>
      )}

      {userToDelete && (
        <div className="fixed inset-0 z-[7000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 max-w-sm w-full text-center space-y-8 shadow-2xl">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto shadow-inner"><Trash2 size={40} /></div>
              <div>
                <h4 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">Remover Membro?</h4>
                <p className="text-slate-400 text-xs font-medium mt-2 leading-relaxed">O colaborador perderá o acesso ao sistema da empresa.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => setUserToDelete(null)} className="py-4.5 bg-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest">Cancelar</button>
                 <button onClick={async () => { setIsDeleting(true); await StorageService.deleteUser(userToDelete.id); setUserToDelete(null); setIsDeleting(false); loadData(); }} className="py-4.5 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">Revogar</button>
              </div>
           </div>
        </div>
      )}

      {selectedRecord && <RecordDetailsModal record={selectedRecord} onClose={() => setSelectedRecord(null)} isPro={true} />}
    </div>
  );
};

export default AdminDashboard;
