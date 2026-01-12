
import { QRCodeCanvas } from 'qrcode.react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  FileText, 
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
  ChevronDown,
  ShieldCheck,
  UserPlus,
  Mail,
  // Added User as UserIcon to fix the "Cannot find name 'UserIcon'" error
  User as UserIcon,
  Fingerprint as FingerprintIcon
} from 'lucide-react';

interface AdminDashboardProps {
  isPro?: boolean;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ isPro }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'locations' | 'records'>('records');
  const [showAddLoc, setShowAddLoc] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newLoc, setNewLoc] = useState({ name: '', address: '', document: '', radius: 100 });
  const [newUser, setNewUser] = useState({ name: '', email: '', employeeId: '', role: 'employee' as 'employee' | 'admin' });
  
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

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (newLoc.address.trim().length >= 5 && !selectedCoords) {
        setIsSearchingAddress(true);
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(newLoc.address)}&limit=5&countrycodes=br&addressdetails=1`, {
            headers: { 'Accept-Language': 'pt-BR', 'User-Agent': 'VeroPonto-Admin' }
          });
          const data = await response.json();
          setAddressSuggestions(Array.isArray(data) ? data : []);
        } catch (err) {
          setAddressSuggestions([]);
        } finally {
          setIsSearchingAddress(false);
        }
      } else if (newLoc.address.trim().length < 5) {
        setAddressSuggestions([]);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [newLoc.address, selectedCoords]);

  const loadData = async () => {
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
  };

  const handleSelectSuggestion = (suggestion: any) => {
    setNewLoc(prev => ({ ...prev, address: suggestion.display_name }));
    setSelectedCoords({ lat: parseFloat(suggestion.lat), lon: parseFloat(suggestion.lon) });
    setAddressSuggestions([]);
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminProfile) return;
    setIsSubmitting(true);
    try {
      await StorageService.saveLocation({
        name: newLoc.name,
        address: newLoc.address,
        document: newLoc.document,
        code: `LOC-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        workspaceId: adminProfile.workspaceId,
        latitude: selectedCoords?.lat,
        longitude: selectedCoords?.lon
      });
      setShowAddLoc(false);
      setNewLoc({ name: '', address: '', document: '', radius: 100 });
      setSelectedCoords(null);
      await loadData();
    } catch (err) {
      alert("Erro ao salvar unidade.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminProfile) return;
    setIsSubmitting(true);
    try {
      // Como estamos usando Supabase Auth simplificado por convite/email, 
      // aqui simulamos a criação do perfil. Em produção, você usaria Edge Functions ou Auth Admin API.
      const tempId = `user-${Math.random().toString(36).substring(2, 9)}`;
      await StorageService.saveUser({
        id: tempId,
        name: newUser.name,
        email: newUser.email,
        employeeId: newUser.employeeId,
        role: newUser.role,
        workspaceId: adminProfile.workspaceId,
        createdAt: Date.now()
      });
      setShowAddUser(false);
      setNewUser({ name: '', email: '', employeeId: '', role: 'employee' });
      await loadData();
    } catch (err) {
      alert("Erro ao cadastrar usuário.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const recordsToday = records.filter(r => new Date(r.timestamp).toDateString() === today);
    return { todayTotal: recordsToday.length, totalStaff: users.length };
  }, [records, users]);

  const filteredRecords = records.filter(r => 
    r.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
      <section className={`${isPro ? 'bg-gradient-to-br from-slate-900 to-indigo-950 border-amber-500/20 shadow-xl' : 'bg-slate-900 border-white/5'} rounded-[2.5rem] p-8 text-white border relative overflow-hidden transition-all`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10 mb-10">
            <div>
                <h2 className="text-3xl font-black tracking-tight italic text-white flex items-center gap-2">VeroPonto {isPro && <span className="text-amber-500">Pro</span>}</h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Gestão de Infraestrutura e Jornada</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-2 border border-white/10">
                <Building2 size={14} className={isPro ? "text-amber-400" : "text-indigo-400"} />
                <span className="text-xs font-bold tracking-wider text-white">{adminProfile?.workspaceId}</span>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
            <div className="bg-white/5 p-5 rounded-3xl border border-white/5 h-32 flex flex-col justify-between">
                <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-300 w-fit"><Clock size={20} /></div>
                <div><h3 className="text-3xl font-black text-white">{stats.todayTotal}</h3><p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Registros Hoje</p></div>
            </div>
            <div className="bg-white/5 p-5 rounded-3xl border border-white/5 h-32 flex flex-col justify-between">
                <div className="p-2 bg-blue-500/20 rounded-xl text-blue-300 w-fit"><Users size={20} /></div>
                <div><h3 className="text-3xl font-black text-white">{stats.totalStaff}</h3><p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Equipe Ativa</p></div>
            </div>
            <div className="bg-white/5 p-5 rounded-3xl border border-white/5 h-32 flex items-center justify-between px-8">
                <div><div className="flex items-center gap-2 mb-1"><TrendingUp size={16} className={isPro ? "text-amber-400" : "text-indigo-400"} /><span className="text-[10px] font-black uppercase tracking-widest text-slate-200">Operação</span></div><p className="text-slate-400 text-[10px] font-medium max-w-[150px]">Sistema em tempo real.</p></div>
                <div className="flex gap-1 items-end h-full pt-8">{[40, 70, 45, 90, 60, 85].map((h, i) => <div key={i} className={`w-2 rounded-t-sm ${isPro ? 'bg-amber-500' : 'bg-indigo-500'}`} style={{ height: `${h}%` }}></div>)}</div>
            </div>
        </div>
      </section>

      <nav className="flex bg-white dark:bg-slate-900 p-2 rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 overflow-x-auto gap-2">
        {[{ id: 'records', label: 'Registros', icon: <Clock size={12}/> }, { id: 'users', label: 'Equipe', icon: <Users size={12}/> }, { id: 'locations', label: 'Unidades', icon: <MapPin size={12}/> }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 min-w-[140px] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === tab.id ? (isPro ? 'bg-amber-500 text-black' : 'bg-indigo-600 text-white shadow-lg') : 'text-slate-400 dark:text-slate-300 hover:bg-slate-50'}`}>
                {tab.icon} {tab.label}
            </button>
        ))}
      </nav>

      {activeTab === 'users' && (
        <div className="animate-in fade-in space-y-6">
          <div className="flex justify-between items-center px-4">
             <div>
               <h3 className="text-xl font-black text-slate-800 dark:text-white">Gestão de Acessos</h3>
               <p className="text-slate-400 dark:text-slate-500 text-xs">Administradores e Colaboradores da unidade.</p>
             </div>
             <button onClick={() => setShowAddUser(true)} className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg ${isPro ? 'bg-amber-500 text-black' : 'bg-indigo-600 text-white'}`}>
               <Plus size={14} /> Adicionar Membro
             </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
             <div className="p-4 border-b border-slate-50 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
               <div className="relative max-w-sm w-full">
                 <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input type="text" placeholder="Buscar por nome ou ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-bold outline-none text-slate-900 dark:text-white border-none" />
               </div>
             </div>
             
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead>
                   <tr className="bg-slate-50/50 dark:bg-white/5">
                     <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Usuário</th>
                     <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Matrícula</th>
                     <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Cargo / Role</th>
                     <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Ações</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                   {filteredUsers.map(u => (
                     <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                       <td className="px-6 py-5">
                         <div className="flex items-center gap-3">
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] ${u.role === 'admin' ? 'bg-amber-500 text-black' : 'bg-indigo-100 text-indigo-600'}`}>
                             {u.name.substring(0, 2).toUpperCase()}
                           </div>
                           <div>
                             <p className="font-black text-sm text-slate-800 dark:text-white">{u.name}</p>
                             <p className="text-[10px] text-slate-400 font-bold">{u.email}</p>
                           </div>
                         </div>
                       </td>
                       <td className="px-6 py-5">
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{u.employeeId || 'S/M'}</p>
                       </td>
                       <td className="px-6 py-5">
                         <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                           {u.role === 'admin' ? 'Gestor / Admin' : 'Colaborador'}
                         </span>
                       </td>
                       <td className="px-6 py-5">
                         <button onClick={() => setUserToDelete(u)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                           <Trash2 size={16} />
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
               {filteredUsers.length === 0 && (
                 <div className="py-20 text-center opacity-30">
                   <Users size={40} className="mx-auto mb-4" />
                   <p className="text-xs font-black uppercase tracking-widest">Nenhum membro encontrado</p>
                 </div>
               )}
             </div>
          </div>
        </div>
      )}

      {activeTab === 'locations' && (
        <div className="p-4 space-y-8 animate-in fade-in">
           <div className="flex justify-between items-center">
              <div><h3 className="text-xl font-black text-slate-800 dark:text-white">Unidades Operacionais</h3><p className="text-slate-400 dark:text-slate-500 text-xs">Locais habilitados para registro.</p></div>
              <button onClick={() => setShowAddLoc(true)} className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg ${isPro ? 'bg-amber-500 text-black' : 'bg-indigo-600 text-white'}`}><Plus size={14} /> Nova Unidade</button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.map(loc => (
                 <div key={loc.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-[2.5rem] p-7 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between h-full relative">
                    <div className="flex justify-between items-start mb-4">
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${isPro ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}><MapPin size={22} /></div>
                       <button onClick={() => setLocationToDelete(loc)} className="p-2.5 text-slate-300 hover:text-red-500 border border-transparent hover:border-red-100 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                    </div>
                    
                    <div className="mb-8">
                       <h4 className="font-black text-slate-800 dark:text-white text-xl mb-1">{loc.name}</h4>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{loc.document || 'DOC NÃO INFORMADO'}</p>
                       <p className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1.5 font-bold italic leading-relaxed"><Navigation size={12} className="shrink-0 mt-0.5" /> {loc.address || 'Localização remota'}</p>
                    </div>

                    <button onClick={() => setViewingQR(loc)} className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all border ${isPro ? 'bg-amber-500 text-black border-amber-500 shadow-lg' : 'bg-indigo-600 text-white border-indigo-600 shadow-lg'}`}>
                       <QrCode size={14} /> Detalhes / QR
                    </button>
                 </div>
              ))}
           </div>
        </div>
      )}

      {activeTab === 'records' && (
         <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
            <div className="p-4 border-b border-slate-50 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
               <div className="relative max-w-sm w-full"><Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" placeholder="Buscar colaborador..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-bold outline-none text-slate-900 dark:text-white border-none" /></div>
               <button onClick={() => StorageService.exportToCSV(records)} className={`px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all ${isPro ? 'bg-amber-500 text-black' : 'bg-slate-100 dark:bg-white/10'}`}><Download size={14} /> Exportar CSV</button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-white/5">
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Colaborador</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Tipo</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Horário</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Unidade</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                  {filteredRecords.map(record => (
                    <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-6 py-5">
                        <p className="font-black text-sm text-slate-800 dark:text-white">{record.userName}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: {record.employeeId}</p>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest ${record.type === 'entry' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                          {record.type === 'entry' ? 'Entrada' : 'Saída'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-black text-slate-800 dark:text-white tabular-nums">{new Date(record.timestamp).toLocaleTimeString('pt-BR')}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{new Date(record.timestamp).toLocaleDateString('pt-BR')}</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate max-w-[150px]">{record.locationName}</p>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button onClick={() => setSelectedRecord(record)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                          <Plus size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredRecords.length === 0 && (
                <div className="py-20 text-center opacity-30">
                  <Search size={40} className="mx-auto mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest">Nenhum registro encontrado</p>
                </div>
              )}
            </div>
         </div>
      )}

      {showAddLoc && (
        <div className="fixed inset-0 z-[6000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#0f172a] rounded-[3.5rem] w-full max-w-4xl shadow-2xl overflow-hidden border border-white/5 flex flex-col md:flex-row max-h-[92vh]">
            <div className="w-full md:w-1/2 h-64 md:h-auto bg-slate-100 dark:bg-slate-900 relative">
              {selectedCoords ? (
                <LocationPickerMap latitude={selectedCoords.lat} longitude={selectedCoords.lon} radius={newLoc.radius} />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-white dark:bg-white/5 rounded-3xl flex items-center justify-center shadow-sm"><MapPin size={32} /></div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">Busque um endereço para validar a posição</p>
                </div>
              )}
            </div>
            <div className="flex-1 p-8 md:p-12 overflow-y-auto">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Nova Unidade</h3>
                <button onClick={() => setShowAddLoc(false)} className="p-2 text-slate-400"><X size={24} /></button>
              </div>
              <form onSubmit={handleAddLocation} className="space-y-6">
                <input required value={newLoc.name} onChange={e => setNewLoc({...newLoc, name: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl font-bold text-xs" placeholder="Nome Fantasia" />
                <div className="relative">
                  <input required value={newLoc.address} onChange={e => { setSelectedCoords(null); setNewLoc({...newLoc, address: e.target.value}); }} className="w-full p-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl font-bold text-xs" placeholder="Buscar endereço completo..." />
                  {isSearchingAddress && <Loader2 size={14} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-indigo-500" />}
                </div>
                {addressSuggestions.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 border rounded-2xl overflow-hidden">
                    {addressSuggestions.map((s, i) => (
                      <button key={i} type="button" onClick={() => handleSelectSuggestion(s)} className="w-full p-4 text-left text-[10px] font-bold border-b last:border-none hover:bg-slate-50">
                        {s.display_name}
                      </button>
                    ))}
                  </div>
                )}
                <button disabled={isSubmitting || !newLoc.name.trim()} type="submit" className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest ${isPro ? 'bg-amber-500 text-black' : 'bg-indigo-600 text-white'} disabled:opacity-50`}>
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Salvar Unidade'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {showAddUser && (
        <div className="fixed inset-0 z-[6000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
           <div className="bg-white dark:bg-slate-900 rounded-[3rem] w-full max-w-md shadow-2xl p-8 border border-white/5">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-2xl font-black text-slate-800 dark:text-white">Novo Membro</h3>
                 <button onClick={() => setShowAddUser(false)} className="p-2 text-slate-400"><X size={24} /></button>
              </div>
              <form onSubmit={handleAddUser} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl font-bold text-xs" placeholder="Artur Silva Grego" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl font-bold text-xs" placeholder="email@empresa.com" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Matrícula</label>
                    <input required value={newUser.employeeId} onChange={e => setNewUser({...newUser, employeeId: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl font-bold text-xs" placeholder="ID-001" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cargo / Role</label>
                    <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as any})} className="w-full p-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl font-bold text-xs outline-none">
                      <option value="employee">Colaborador</option>
                      <option value="admin">Gestor / Admin</option>
                    </select>
                  </div>
                </div>

                <button disabled={isSubmitting} type="submit" className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 ${isPro ? 'bg-amber-500 text-black' : 'bg-indigo-600 text-white'} disabled:opacity-50`}>
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                  Salvar Membro
                </button>
              </form>
           </div>
        </div>
      )}

      {viewingQR && (
         <div className="fixed inset-0 z-[6000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-sm w-full text-center space-y-6 shadow-2xl">
                <div className="flex justify-between items-center"><h4 className="text-[10px] font-black uppercase text-slate-400">Ponto por QR Code</h4><button onClick={() => setViewingQR(null)} className="p-2 text-slate-400"><X size={20}/></button></div>
                <h3 className="text-2xl font-black">{viewingQR.name}</h3>
                <div ref={qrRef} className="bg-white p-6 rounded-3xl inline-block border shadow-md">
                    <QRCodeCanvas value={viewingQR.code} size={180} level="H" />
                </div>
                <button onClick={() => { const canvas = qrRef.current?.querySelector('canvas'); if(canvas) { const link = document.createElement("a"); link.download = `QR_${viewingQR.name}.png`; link.href = canvas.toDataURL(); link.click(); } }} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2"><Save size={16}/> Baixar QR Code</button>
            </div>
         </div>
      )}

      {locationToDelete && (
        <div className="fixed inset-0 z-[7000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-sm w-full text-center space-y-6">
              <AlertOctagon size={48} className="text-red-500 mx-auto" />
              <h4 className="text-xl font-black">Remover Unidade?</h4>
              <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => setLocationToDelete(null)} className="py-4 bg-slate-100 rounded-2xl font-black text-[10px] uppercase">Cancelar</button>
                 <button onClick={async () => { setIsDeleting(true); await StorageService.deleteLocation(locationToDelete.id); setLocationToDelete(null); setIsDeleting(false); loadData(); }} className="py-4 bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase">{isDeleting && <Loader2 size={12} className="animate-spin"/>} Excluir</button>
              </div>
           </div>
        </div>
      )}

      {userToDelete && (
        <div className="fixed inset-0 z-[7000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-sm w-full text-center space-y-6">
              <AlertOctagon size={48} className="text-red-500 mx-auto" />
              <h4 className="text-xl font-black">Remover Membro?</h4>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Revogar acesso de {userToDelete.name}</p>
              <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => setUserToDelete(null)} className="py-4 bg-slate-100 rounded-2xl font-black text-[10px] uppercase">Manter</button>
                 <button onClick={async () => { setIsDeleting(true); await StorageService.deleteUser(userToDelete.id); setUserToDelete(null); setIsDeleting(false); loadData(); }} className="py-4 bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase">{isDeleting && <Loader2 size={12} className="animate-spin"/>} Revogar</button>
              </div>
           </div>
        </div>
      )}

      {selectedRecord && <RecordDetailsModal record={selectedRecord} onClose={() => setSelectedRecord(null)} isPro={isPro} />}
    </div>
  );
};

export default AdminDashboard;
