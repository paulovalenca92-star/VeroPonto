
import { QRCodeCanvas } from 'qrcode.react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StorageService, supabase } from '../services/storage';
import { Location, TimeRecord, User } from '../types';
import { 
  AlertOctagon, 
  Building2, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Download, 
  ExternalLink, 
  FileText, 
  Loader2, 
  Locate, 
  Mail, 
  MapPin, 
  Navigation, 
  Plus, 
  Printer, 
  QrCode, 
  Save, 
  Search, 
  ShieldCheck, 
  Trash2, 
  TrendingUp, 
  User as UserIcon, 
  Users,
  X 
} from 'lucide-react';

interface AdminDashboardProps {
  isPro?: boolean;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ isPro }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'locations' | 'records'>('records');
  const [showAddLoc, setShowAddLoc] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newLoc, setNewLoc] = useState({ name: '', address: '', code: '', document: '' });
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{lat: number, lon: number} | null>(null);
  
  const [selectedRecord, setSelectedRecord] = useState<TimeRecord | null>(null);
  const [viewingQR, setViewingQR] = useState<Location | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);
  
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [records, setRecords] = useState<TimeRecord[]>([]);
  const [adminProfile, setAdminProfile] = useState<User | null>(null);
  const [copied, setCopied] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (newLoc.address.trim().length >= 3) {
        setIsSearchingAddress(true);
        try {
          // Em produção (Netlify), o Nominatim exige um User-Agent identificado para evitar bloqueio 403
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(newLoc.address)}&limit=5&countrycodes=br&addressdetails=1`, {
            headers: {
              'Accept-Language': 'pt-BR',
              'User-Agent': 'VeroPonto-Web-App-Production'
            }
          });
          
          if (!response.ok) throw new Error("API Limit or Block");
          const data = await response.json();
          setAddressSuggestions(Array.isArray(data) ? data : []);
        } catch (err) {
          console.error("Erro na busca Nominatim:", err);
          setAddressSuggestions([]);
        } finally {
          setIsSearchingAddress(false);
        }
      } else {
        setAddressSuggestions([]);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [newLoc.address]);

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
      const coords = selectedCoords ? { latitude: selectedCoords.lat, longitude: selectedCoords.lon } : { latitude: 0, longitude: 0 };
      await StorageService.saveLocation({
        name: newLoc.name,
        address: newLoc.address,
        document: newLoc.document,
        code: newLoc.code || `LOC-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        workspaceId: adminProfile.workspaceId,
        latitude: coords.latitude,
        longitude: coords.longitude
      });
      setShowAddLoc(false);
      setNewLoc({ name: '', address: '', code: '', document: '' });
      setSelectedCoords(null);
      await loadData();
    } catch (err) {
      alert("Erro ao salvar. Verifique se o banco de dados está pronto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await StorageService.deleteUser(userToDelete.id);
      setUserToDelete(null);
      await loadData();
    } catch (err) { alert("Erro ao excluir usuário."); }
    finally { setIsDeleting(false); }
  };

  const handleDeleteLocation = async () => {
    if (!locationToDelete) return;
    setIsDeleting(true);
    try {
      await StorageService.deleteLocation(locationToDelete.id);
      setLocationToDelete(null);
      await loadData();
    } catch (err) { alert("Erro ao excluir unidade."); }
    finally { setIsDeleting(false); }
  };

  const downloadQRCode = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `QR_Code_${viewingQR?.name || 'Unidade'}.png`;
      link.href = url;
      link.click();
    }
  };

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const recordsToday = records.filter(r => new Date(r.timestamp).toDateString() === today);
    return { todayTotal: recordsToday.length, totalStaff: users.length, locations: locations.length };
  }, [records, locations, users]);

  const filteredRecords = useMemo(() => {
    return records.filter(r => r.userName.toLowerCase().includes(searchTerm.toLowerCase()) || r.employeeId.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [records, searchTerm]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) || u.employeeId.toLowerCase().includes(userSearchTerm.toLowerCase()));
  }, [users, userSearchTerm]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
      <section className={`${isPro ? 'bg-gradient-to-br from-slate-900 to-indigo-950 border-amber-500/20' : 'bg-slate-900 border-white/5'} rounded-[2.5rem] p-8 text-white shadow-2xl border relative overflow-hidden transition-all`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10 mb-10">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-3xl font-black tracking-tight italic text-white">VeroPonto {isPro && <span className="text-amber-500">Pro</span>}</h2>
                    {isPro && <ShieldCheck size={20} className="text-amber-500" />}
                </div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Painel de Gestão Empresarial</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-2 border border-white/10">
                <Building2 size={14} className={isPro ? "text-amber-400" : "text-indigo-400"} />
                <span className="text-xs font-bold tracking-wider text-white">{adminProfile?.workspaceId}</span>
                <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(adminProfile?.workspaceId || ''); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="hover:text-white text-white/50 transition">
                    {copied ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Copy size={12} />}
                </button>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
            <div className="bg-white/5 p-5 rounded-3xl border border-white/5 h-32 flex flex-col justify-between hover:bg-white/10 transition">
                <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-300 w-fit"><Clock size={20} /></div>
                <div><h3 className="text-3xl font-black text-white">{stats.todayTotal}</h3><p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Registros Hoje</p></div>
            </div>
            <div className="bg-white/5 p-5 rounded-3xl border border-white/5 h-32 flex flex-col justify-between hover:bg-white/10 transition">
                <div className="p-2 bg-blue-500/20 rounded-xl text-blue-300 w-fit"><Users size={20} /></div>
                <div><h3 className="text-3xl font-black text-white">{stats.totalStaff}</h3><p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Membros Ativos</p></div>
            </div>
            <div className="col-span-1 md:col-span-2 bg-white/5 p-5 rounded-3xl border border-white/5 h-32 flex items-center justify-between px-8">
                <div><div className="flex items-center gap-2 mb-1"><TrendingUp size={16} className={isPro ? "text-amber-400" : "text-indigo-400"} /><span className="text-[10px] font-black uppercase tracking-widest text-slate-200">Produtividade</span></div><p className="text-slate-400 text-[10px] font-medium max-w-[150px]">Atividade da jornada em tempo real.</p></div>
                <div className="flex gap-1 items-end h-full pt-8">{[40, 70, 45, 90, 60, 85].map((h, i) => <div key={i} className={`w-2 rounded-t-sm ${isPro ? 'bg-amber-500' : 'bg-indigo-500'}`} style={{ height: `${h}%` }}></div>)}</div>
            </div>
        </div>
      </section>

      <nav className="flex bg-white dark:bg-slate-900 p-2 rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 overflow-x-auto">
        {[{ id: 'records', label: 'Registros', icon: <Clock size={12}/> }, { id: 'users', label: 'Equipe', icon: <Users size={12}/> }, { id: 'locations', label: 'Unidades', icon: <MapPin size={12}/> }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 min-w-[120px] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === tab.id ? (isPro ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-indigo-600 text-white shadow-lg') : 'text-slate-400 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'}`}>
                {tab.icon} {tab.label}
            </button>
        ))}
      </nav>

      <div className="min-h-[400px]">
        {activeTab === 'records' && (
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
             <div className="p-4 border-b border-slate-50 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative max-w-sm w-full"><Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" placeholder="Buscar colaborador..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-bold outline-none text-slate-900 dark:text-white border-none" /></div>
                <button onClick={() => StorageService.exportToCSV(filteredRecords)} className={`px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all ${isPro ? 'bg-amber-500 text-black hover:bg-amber-400' : 'bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 text-slate-600 dark:text-slate-300'}`}><Download size={14} /> Exportar CSV</button>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead><tr className="bg-slate-50/50 dark:bg-white/5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><th className="px-6 py-5">Colaborador</th><th className="px-6 py-5">Status</th><th className="px-6 py-5">Horário</th><th className="px-6 py-5">Local</th></tr></thead>
                 <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                   {filteredRecords.map(record => (
                     <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => setSelectedRecord(record)}>
                       <td className="px-6 py-4"><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${isPro ? 'bg-amber-500/10 text-amber-600' : 'bg-slate-100 dark:bg-white/10 text-slate-500'}`}>{record.userName.substring(0, 2)}</div><div><p className="font-bold text-slate-800 dark:text-white text-xs">{record.userName}</p><p className="text-[9px] font-medium text-slate-400">{record.employeeId}</p></div></div></td>
                       <td className="px-6 py-4"><span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wide border ${record.type === 'entry' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{record.type === 'entry' ? 'Entrada' : 'Saída'}</span></td>
                       <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200 text-xs tabular-nums">{new Date(record.timestamp).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                       <td className="px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400">{record.locationName?.split('(')[0]}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        )}

        {activeTab === 'users' && (
           <div className="p-4 space-y-6">
              <div className="relative max-w-sm w-full"><Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" placeholder="Filtrar equipe..." value={userSearchTerm} onChange={(e) => setUserSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/10 rounded-xl text-xs font-bold outline-none text-slate-900 dark:text-white" /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {filteredUsers.map(user => (
                    <div key={user.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl transition-all">
                       <div className="flex justify-between items-start mb-6"><div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isPro ? 'bg-amber-500/10 text-amber-600' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600'}`}><UserIcon size={28} /></div><span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${user.role === 'admin' ? 'bg-slate-800 text-white' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20'}`}>{user.role === 'admin' ? 'Gestor' : 'Equipe'}</span></div>
                       <div className="space-y-4"><div><h4 className="font-black text-slate-800 dark:text-white text-lg">{user.name}</h4><p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1"><Mail size={12} className="inline mr-1"/> {user.email}</p></div><div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-white/5"><div><p className="text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase">Matrícula</p><p className="text-xs font-black text-slate-600 dark:text-slate-300">{user.employeeId}</p></div><button onClick={() => setUserToDelete(user)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={16} /></button></div></div>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {activeTab === 'locations' && (
           <div className="p-4 space-y-8">
              <div className="flex justify-between items-center"><div><h3 className="text-xl font-black text-slate-800 dark:text-white">Unidades</h3><p className="text-slate-400 dark:text-slate-500 text-xs">Locais físicos cadastrados.</p></div><button onClick={() => setShowAddLoc(true)} className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg ${isPro ? 'bg-amber-500 text-black' : 'bg-indigo-600 text-white'}`}><Plus size={14} /> Nova Unidade</button></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {locations.map(loc => (
                    <div key={loc.id} onClick={() => setViewingQR(loc)} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl transition-all cursor-pointer group relative">
                       <div className="flex justify-between items-start mb-4"><div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${isPro ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20' : 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/20'}`}><MapPin size={20} /></div><button onClick={(e) => { e.stopPropagation(); setLocationToDelete(loc); }} className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500"><Trash2 size={16} /></button></div>
                       <h4 className="font-black text-slate-800 dark:text-white text-lg mb-1">{loc.name}</h4>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{loc.document ? `Doc: ${loc.document}` : 'Doc. oculto'}</p>
                       <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 flex items-center gap-1 font-bold italic line-clamp-2"><Navigation size={10} className="shrink-0" /> {loc.address || 'Sem endereço'}</p>
                       <div className="w-full py-3 bg-slate-50 dark:bg-white/10 rounded-xl text-[10px] font-black uppercase text-slate-800 dark:text-white flex items-center justify-center gap-2 group-hover:bg-indigo-600 group-hover:text-white transition-all"><QrCode size={12} /> Ver Detalhes / QR</div>
                    </div>
                 ))}
              </div>
           </div>
        )}
      </div>

      {showAddLoc && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-sm w-full space-y-6 max-h-[90vh] overflow-visible relative border border-white/5 shadow-2xl">
              <div className="flex justify-between items-center"><h4 className="font-black text-sm uppercase tracking-widest text-slate-900 dark:text-white">Nova Unidade</h4><button type="button" onClick={() => setShowAddLoc(false)} className="p-2 text-slate-400"><X size={20}/></button></div>
              
              <form onSubmit={handleAddLocation} className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-400 tracking-widest ml-1">Nome da Unidade</label>
                    <input required value={newLoc.name} onChange={e => setNewLoc({...newLoc, name: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-slate-100 dark:border-slate-700 font-bold text-slate-900 dark:text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600" placeholder="Ex: Matriz Centro" />
                 </div>

                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-400 tracking-widest ml-1">Documento (Opcional)</label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={16} />
                      <input value={newLoc.document} onChange={e => setNewLoc({...newLoc, document: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-slate-100 dark:border-slate-700 font-bold text-slate-900 dark:text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600" placeholder="00.000.000/0000-00" />
                    </div>
                 </div>

                 <div className="space-y-1 relative">
                    <label className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-400 tracking-widest ml-1">Endereço (Mín. 3 letras)</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={16} />
                      <input 
                        value={newLoc.address} 
                        onChange={e => setNewLoc({...newLoc, address: e.target.value})} 
                        className="w-full pl-12 pr-10 py-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-slate-100 dark:border-slate-700 font-bold text-slate-900 dark:text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600" 
                        placeholder="Pesquisar rua, cidade..." 
                      />
                      {isSearchingAddress && <Loader2 size={14} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-indigo-500" />}
                    </div>
                    
                    {addressSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-[110] mt-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {addressSuggestions.map((s, i) => (
                          <button key={i} type="button" onClick={() => handleSelectSuggestion(s)} className="w-full p-4 text-left text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-50 dark:border-slate-700 last:border-none flex items-start gap-3">
                             <MapPin size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                             <span className="truncate">{s.display_name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                 </div>

                 <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-900/40 text-[10px] text-amber-800 dark:text-amber-400 font-bold flex gap-2">
                    <Locate size={16} className="shrink-0" /> 
                    {selectedCoords ? "GPS Vinculado: Localização validada." : "Selecione um endereço para capturar o GPS."}
                 </div>

                 <button disabled={isSubmitting} type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all">
                    {isSubmitting ? <Loader2 className="animate-spin"/> : 'Cadastrar Unidade'}
                 </button>
              </form>
           </div>
        </div>
      )}

      {viewingQR && (
         <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-sm w-full text-center space-y-6 border border-white/5 shadow-2xl overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center"><h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Detalhes da Unidade</h4><button onClick={() => setViewingQR(null)} className="p-2 text-slate-400"><X size={20}/></button></div>
                
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">{viewingQR.name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{viewingQR.document || 'DOC NÃO INFORMADO'}</p>
                </div>

                <div ref={qrRef} className="bg-white p-6 rounded-3xl inline-block border border-slate-100 shadow-md">
                    <QRCodeCanvas 
                      value={viewingQR.code} 
                      size={180} 
                      level="H" 
                      includeMargin={false}
                      className="mx-auto"
                    />
                </div>

                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl text-left space-y-3">
                   <div>
                      <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1 flex items-center gap-1"><MapPin size={8}/> Endereço Completo</p>
                      <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-relaxed italic">{viewingQR.address || 'Não cadastrado'}</p>
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">ID Unidade</p>
                        <p className="text-[11px] font-black text-indigo-600 dark:text-indigo-400">{viewingQR.code}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Status GPS</p>
                        <p className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">{viewingQR.latitude ? 'Ativo' : 'Pendente'}</p>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <button onClick={downloadQRCode} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"><Save size={16}/> Baixar QR Code</button>
                  <button onClick={() => window.print()} className="w-full py-4 bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all"><Printer size={16}/> Imprimir Ficha</button>
                </div>
            </div>
         </div>
      )}

      {userToDelete && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-sm w-full text-center space-y-6 border border-white/5">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-3xl flex items-center justify-center mx-auto shadow-xl"><AlertOctagon size={32}/></div>
              <div><h4 className="text-xl font-black text-slate-800 dark:text-white">Remover Colaborador?</h4><p className="text-xs text-slate-400 font-medium">Esta ação não pode ser desfeita.</p></div>
              <div className="grid grid-cols-2 gap-3"><button onClick={() => setUserToDelete(null)} className="py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-800 dark:text-white">Cancelar</button><button onClick={handleDeleteUser} disabled={isDeleting} className="py-4 bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">{isDeleting && <Loader2 size={12} className="animate-spin"/>} Excluir</button></div>
           </div>
        </div>
      )}

      {locationToDelete && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-sm w-full text-center space-y-6 border border-white/5">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-3xl flex items-center justify-center mx-auto shadow-xl"><AlertOctagon size={32}/></div>
              <div><h4 className="text-xl font-black text-slate-800 dark:text-white">Remover Unidade?</h4><p className="text-xs text-slate-400 font-medium">O QR Code desta unidade deixará de funcionar.</p></div>
              <div className="grid grid-cols-2 gap-3"><button onClick={() => setLocationToDelete(null)} className="py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-800 dark:text-white">Cancelar</button><button onClick={handleDeleteLocation} disabled={isDeleting} className="py-4 bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">{isDeleting && <Loader2 size={12} className="animate-spin"/>} Excluir</button></div>
           </div>
        </div>
      )}

      {selectedRecord && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-[400px] overflow-hidden shadow-2xl relative flex flex-col border border-white/5">
              <div className="p-6 border-b border-slate-50 dark:border-white/5 flex justify-between items-center"><h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Comprovante de Ponto</h4><button onClick={() => setSelectedRecord(null)} className="p-2 text-slate-400"><X size={20}/></button></div>
              <div className="p-8 text-center space-y-6">
                 <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-3xl mx-auto flex items-center justify-center overflow-hidden border-2 border-white dark:border-slate-700 shadow-lg">{selectedRecord.photo ? <img src={selectedRecord.photo} className="w-full h-full object-cover" /> : <UserIcon className="text-slate-300 dark:text-slate-600" size={32} />}</div>
                 <div><h2 className="text-3xl font-black text-slate-800 dark:text-white">{new Date(selectedRecord.timestamp).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</h2><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{new Date(selectedRecord.timestamp).toLocaleDateString('pt-BR', {day:'2-digit', month:'long'})}</p></div>
                 <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-5 text-left space-y-3">
                    <div><p className="text-[8px] font-black uppercase text-slate-400 dark:text-slate-600 tracking-widest mb-1">Colaborador</p><p className="text-sm font-black text-slate-700 dark:text-slate-200">{selectedRecord.userName}</p></div>
                    <div><p className="text-[8px] font-black uppercase text-slate-400 dark:text-slate-600 tracking-widest mb-1">Localização</p><p className="text-sm font-black text-slate-700 dark:text-slate-200">{selectedRecord.locationName}</p></div>
                 </div>
                 {selectedRecord.coords && <a href={`https://www.google.com/maps?q=${selectedRecord.coords.latitude},${selectedRecord.coords.longitude}`} target="_blank" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">Ver Mapa <ExternalLink size={14}/></a>}
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
