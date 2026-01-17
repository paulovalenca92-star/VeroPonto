
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { StorageService, supabase } from '../services/storage';
import { Location, TimeRecord, User, EmployeeRequest, WorkSchedule } from '../types';
import RecordDetailsModal from './RecordDetailsModal';
import AdminRequestsManager from './AdminRequestsManager';
import AdminReportsView from './AdminReportsView';
import AdminOvertimeView from './AdminOvertimeView';
import AdminSchedulesView from './AdminSchedulesView';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Building2, 
  Clock, 
  MapPin, 
  Plus, 
  Search, 
  Trash2, 
  Users,
  RefreshCw,
  ChevronRight,
  Zap,
  ShieldCheck,
  LayoutDashboard,
  FileSpreadsheet,
  Bell,
  Fingerprint,
  ArrowDownLeft,
  ArrowUpRight,
  Shield,
  Loader2,
  X,
  Save,
  ClipboardList,
  Copy,
  LogOut,
  ExternalLink,
  Navigation,
  CheckCircle2,
  Map as MapIcon,
  Locate,
  QrCode,
  Printer,
  Download,
  Edit3,
  UserX,
  UserCheck,
  MoreVertical,
  Mail,
  CalendarDays,
  UserCog,
  AlertTriangle,
  Activity,
  TrendingUp,
  BarChart3,
  Layers,
  TrendingDown,
  History,
  Calendar,
  ChevronDown,
  Info
} from 'lucide-react';

declare const L: any; // Leaflet Global

interface AdminDashboardProps {
  isPro?: boolean;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ isPro = true }) => {
  const [activeMenu, setActiveMenu] = useState<'jornada' | 'overtime' | 'equipe' | 'locais' | 'escalas' | 'relatorios' | 'solicitacoes'>('jornada');
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [copySuccess, setCopySuccess] = useState(false);
  
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [records, setRecords] = useState<TimeRecord[]>([]);
  const [requests, setRequests] = useState<EmployeeRequest[]>([]);
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [adminProfile, setAdminProfile] = useState<User | null>(null);
  
  const [showAddLoc, setShowAddLoc] = useState(false);
  const [showQrModal, setShowQrModal] = useState<Location | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<TimeRecord | null>(null);
  
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const [locationToEdit, setLocationToEdit] = useState<Location | null>(null);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);

  const [newLoc, setNewLoc] = useState({ 
    name: '', 
    address: '', 
    lat: -23.5505, 
    lng: -46.6333 
  });
  const [isSearchingLoc, setIsSearchingLoc] = useState(false);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const profile = await StorageService.getProfile(user.id);
      if (!profile) return;
      setAdminProfile(profile);
      
      if (profile.workspaceId && profile.workspaceId !== 'PENDENTE') {
        const [u, l, r, reqs, sch] = await Promise.all([
          StorageService.getUsers(profile.workspaceId),
          StorageService.getLocations(profile.workspaceId),
          StorageService.getRecords(profile.workspaceId),
          StorageService.getAdminRequests(profile.workspaceId).catch(() => []),
          StorageService.getSchedules(profile.workspaceId).catch(() => [])
        ]);
        setUsers(u);
        setLocations(l);
        setRecords(r);
        setRequests(reqs || []);
        setSchedules(sch || []);
      }
    } catch (err) {
      console.error("Erro ao sincronizar dados:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [loadData]);

  const searchAddress = async () => {
    const address = locationToEdit ? locationToEdit.address : newLoc.address;
    if (!address) return;
    setIsSearchingLoc(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        if (locationToEdit) {
          setLocationToEdit({ ...locationToEdit, latitude, longitude });
        } else {
          setNewLoc({ ...newLoc, lat: latitude, lng: longitude });
        }
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 16);
          if (markerRef.current) {
            markerRef.current.setLatLng([latitude, longitude]);
          }
        }
      }
    } catch (err) {
      console.error("Erro ao buscar endereço:", err);
    } finally {
      setIsSearchingLoc(false);
    }
  };

  const handleSaveLocation = async () => {
    if (!adminProfile?.workspaceId) return;
    setIsLoading(true);
    try {
      if (locationToEdit) {
        await StorageService.updateLocation(locationToEdit);
      } else {
        const payload = {
          id: `loc-${Date.now()}`,
          name: newLoc.name,
          address: newLoc.address,
          code: `QR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          workspace_id: adminProfile.workspaceId,
          latitude: newLoc.lat,
          longitude: newLoc.lng
        };
        const { error } = await supabase.from('locations').insert(payload);
        if (error) throw error;
      }
      await loadData();
      setShowAddLoc(false);
      setLocationToEdit(null);
      setNewLoc({ name: '', address: '', lat: -23.5505, lng: -46.6333 });
    } catch (err) {
      console.error("Erro ao salvar local:", err);
      alert("Erro ao salvar local.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    setIsLoading(true);
    try {
      await StorageService.saveUser(editingUser);
      await loadData();
      setEditingUser(null);
    } catch (err) {
      console.error("Erro ao atualizar usuário:", err);
      alert("Erro ao atualizar usuário.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if ((showAddLoc || locationToEdit) && mapContainerRef.current && !mapRef.current) {
      const timer = setTimeout(() => {
        if (!mapContainerRef.current) return;
        const initialLat = locationToEdit ? locationToEdit.latitude || -23.5505 : newLoc.lat;
        const initialLng = locationToEdit ? locationToEdit.longitude || -46.6333 : newLoc.lng;

        mapRef.current = L.map(mapContainerRef.current, {
          zoomControl: false,
          attributionControl: false
        }).setView([initialLat, initialLng], 16);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);

        markerRef.current = L.marker([initialLat, initialLng], { draggable: true }).addTo(mapRef.current);

        markerRef.current.on('dragend', (e: any) => {
          const { lat, lng } = e.target.getLatLng();
          if (locationToEdit) {
            setLocationToEdit(prev => prev ? { ...prev, latitude: lat, longitude: lng } : null);
          } else {
            setNewLoc(prev => ({ ...prev, lat, lng }));
          }
        });
      }, 500);
      return () => clearTimeout(timer);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [showAddLoc, !!locationToEdit]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().slice(0, 7); 

    const dailyPunches = records.filter(r => new Date(r.timestamp).toISOString().split('T')[0] === today).length;
    const monthlyPunches = records.filter(r => new Date(r.timestamp).toISOString().slice(0, 7) === thisMonth).length;
    const pendingAudits = requests.filter(r => r.status === 'pending').length;

    return {
      dailyPunches,
      monthlyPunches,
      pendingAudits,
      activeMembers: users.length
    };
  }, [records, requests, users]);

  const menuGroups = [
    {
      title: 'Monitoramento',
      items: [
        { id: 'jornada', label: 'Painel de Jornada', icon: <Clock size={18} /> },
        { id: 'overtime', label: 'Banco de Horas', icon: <TrendingUp size={18} /> },
      ]
    },
    {
      title: 'Cadastros',
      items: [
        { id: 'equipe', label: 'Colaboradores', icon: <Users size={18} /> },
        { id: 'escalas', label: 'Escalas & Horários', icon: <Calendar size={18} /> },
        { id: 'locais', label: 'Unidades de Trabalho', icon: <Building2 size={18} /> },
      ]
    },
    {
      title: 'Inteligência',
      items: [
        { id: 'relatorios', label: 'Relatórios Fiscais', icon: <FileSpreadsheet size={18} /> },
        { 
          id: 'solicitacoes', 
          label: 'Solicitações', 
          icon: <Bell size={18} />, 
          badge: requests.filter(r => r.status === 'pending').length || undefined 
        },
      ]
    }
  ];

  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-[#050505] text-white -m-4 md:-m-8">
      <aside className="w-64 border-r border-white/5 bg-[#080808] flex flex-col shrink-0 hidden lg:flex">
        <nav className="flex-1 px-4 py-8 space-y-10">
          {menuGroups.map((group, idx) => (
            <div key={idx} className="space-y-3">
              <p className="px-4 text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">{group.title}</p>
              <div className="space-y-1">
                {group.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveMenu(item.id as any)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all group ${
                      activeMenu === item.id 
                      ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                       {item.icon} {item.label}
                    </div>
                    {item.badge ? (
                      <span className="bg-red-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    ) : (
                      activeMenu === item.id && <ChevronRight size={14} className="opacity-50" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5 space-y-4 bg-black/20">
           <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Empresa</p>
              <div className="flex items-center justify-between">
                 <p className="text-xs font-black text-teal-400 font-mono">{adminProfile?.workspaceId}</p>
                 <button onClick={() => {
                   if (adminProfile?.workspaceId) {
                     navigator.clipboard.writeText(adminProfile.workspaceId);
                     setCopySuccess(true);
                     setTimeout(() => setCopySuccess(false), 2000);
                   }
                 }} className="p-2 text-slate-500 hover:text-white transition-colors">
                    {copySuccess ? <ShieldCheck size={14} className="text-emerald-500" /> : <Copy size={14} />}
                 </button>
              </div>
           </div>
           <button onClick={() => supabase.auth.signOut()} className="w-full py-3.5 flex items-center justify-center gap-2 text-red-500/80 font-black text-[9px] uppercase tracking-widest hover:bg-red-500/5 rounded-xl transition-all">
              <LogOut size={16} /> Encerrar Sessão
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col max-h-screen overflow-hidden relative">
        <div className="h-20 border-b border-white/5 flex items-center justify-between px-10 shrink-0 bg-[#050505]/30 backdrop-blur-md">
          <div className="flex flex-col">
            <h2 className="text-lg font-black tracking-tight text-white uppercase italic">
              {menuGroups.flatMap(g => g.items).find(i => i.id === activeMenu)?.label || 'Painel'}
            </h2>
          </div>
          <button onClick={() => loadData()} className="p-3 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all border border-white/5">
            <RefreshCw size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
           {activeMenu === 'jornada' && (
              <div className="space-y-10 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-[#0A0A0A] rounded-[3.5rem] p-12 border border-white/5 relative overflow-hidden flex flex-col justify-center shadow-2xl min-h-[350px]">
                     <div className="absolute -right-10 -top-10 opacity-[0.03] pointer-events-none scale-150">
                       <Shield size={400} />
                     </div>
                     <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                          <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">Auditoria em Tempo Real</p>
                        </div>
                        <h2 className="text-9xl font-black tracking-tighter tabular-nums text-white leading-none">
                          {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </h2>
                        <p className="text-slate-400 font-black text-lg uppercase tracking-[0.4em] mt-8 flex items-center gap-4">
                          {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        </p>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div className="bg-gradient-to-br from-[#121212] to-[#0A0A0A] rounded-[2.5rem] p-8 border border-white/5 flex items-center justify-between shadow-xl group hover:border-indigo-600/30 transition-all relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                         <Activity size={80} />
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-500 border border-indigo-600/10">
                              <Zap size={20} />
                           </div>
                           <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Ponto Batido Hoje</p>
                        </div>
                        <h3 className="text-4xl font-black italic text-white leading-none">{stats.dailyPunches}</h3>
                        <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1">
                          <TrendingUp size={10} className="text-emerald-500" /> Volume Diário Consolidado
                        </p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-[#121212] to-[#0A0A0A] rounded-[2.5rem] p-8 border border-white/5 flex items-center justify-between shadow-xl group hover:border-teal-500/30 transition-all relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                         <BarChart3 size={80} />
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-400 border border-teal-500/10">
                              <Layers size={20} />
                           </div>
                           <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Ponto Batido no Mês</p>
                        </div>
                        <h3 className="text-4xl font-black italic text-white leading-none">{stats.monthlyPunches}</h3>
                        <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1">
                           <CheckCircle2 size={10} className="text-teal-500" /> Acumulado do período atual
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                   <div className="bg-[#0A0A0A] rounded-3xl p-6 border border-white/5 flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400">
                         <Users size={24} />
                      </div>
                      <div>
                         <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Equipe Ativa</p>
                         <p className="text-xl font-black">{stats.activeMembers} Pessoas</p>
                      </div>
                   </div>
                   <div className="bg-[#0A0A0A] rounded-3xl p-6 border border-white/5 flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
                         <ClipboardList size={24} />
                      </div>
                      <div>
                         <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Auditoria</p>
                         <p className="text-xl font-black text-amber-500">{stats.pendingAudits} Pendentes</p>
                      </div>
                   </div>
                </div>

                <div className="bg-[#0A0A0A] rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
                  <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-500">
                           <Activity size={20} />
                        </div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Fluxo de Jornada Recente</h3>
                     </div>
                     <span className="text-[8px] font-black text-indigo-400 bg-indigo-500/10 px-4 py-1.5 rounded-full border border-indigo-500/20 uppercase tracking-widest">Sincronização Ativa</span>
                  </div>
                  <div className="divide-y divide-white/5">
                    {records.slice(0, 10).map(record => (
                      <div key={record.id} className="p-8 flex items-center justify-between hover:bg-white/[0.03] transition-colors cursor-pointer group" onClick={() => setSelectedRecord(record)}>
                        <div className="flex items-center gap-8">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${record.type === 'entry' ? 'bg-teal-500/10 text-teal-500 border-teal-500/10' : 'bg-white/5 text-slate-600 border-white/5'}`}>
                            {record.type === 'entry' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                          </div>
                          <div>
                            <h4 className="font-black text-lg uppercase text-white group-hover:text-indigo-400 transition-colors tracking-tight">{record.userName}</h4>
                            <div className="flex items-center gap-3 mt-1.5">
                               <MapPin size={10} className="text-slate-600" />
                               <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{record.locationName}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black tabular-nums text-white group-hover:text-indigo-500 transition-colors">
                            {new Date(record.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-[9px] font-black text-slate-700 uppercase mt-1 tracking-widest">{new Date(record.timestamp).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
           )}

           {activeMenu === 'overtime' && <AdminOvertimeView records={records} users={users} />}
           {activeMenu === 'escalas' && <AdminSchedulesView workspaceId={adminProfile?.workspaceId || ''} />}
           
           {activeMenu === 'locais' && (
              <div className="animate-in fade-in space-y-10">
                 <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-3xl font-black italic text-white">Unidades Operacionais</h2>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Configuração de perímetros de ponto</p>
                    </div>
                    <button onClick={() => setShowAddLoc(true)} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">
                       Adicionar Unidade
                    </button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {locations.map(loc => (
                      <div key={loc.id} className="bg-[#0A0A0A] rounded-[2.5rem] border border-white/5 p-8 shadow-xl flex flex-col group hover:border-indigo-600/30 transition-all relative">
                         <div className="flex justify-between items-start mb-6">
                           <div className="w-14 h-14 bg-indigo-600/10 text-indigo-500 rounded-2xl flex items-center justify-center border border-indigo-600/10 shrink-0">
                              <Building2 size={28} />
                           </div>
                           <div className="flex gap-2 relative z-30">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setLocationToEdit(loc); }} 
                                className="p-3 bg-white/5 rounded-xl text-slate-400 hover:text-indigo-400 border border-white/10 opacity-40 hover:opacity-100 transition-all pointer-events-auto"
                                title="Editar"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setLocationToDelete(loc); }} 
                                className="p-3 bg-white/5 rounded-xl text-slate-400 hover:text-red-500 border border-white/10 opacity-40 hover:opacity-100 transition-all pointer-events-auto"
                                title="Excluir"
                              >
                                <Trash2 size={16} />
                              </button>
                           </div>
                         </div>
                         <h3 className="text-xl font-black text-white mb-2">{loc.name}</h3>
                         <p className="text-xs text-slate-500 mb-6 flex items-start gap-2 flex-1 leading-relaxed">
                           <MapPin size={14} className="mt-0.5 shrink-0 text-indigo-500" /> 
                           {loc.address || 'Localização sem endereço definido'}
                         </p>
                         
                         <div className="pt-6 border-t border-white/5 space-y-4">
                            <div className="flex items-center justify-between">
                               <p className="text-[9px] font-black uppercase text-slate-600 tracking-widest">Código Único</p>
                               <p className="text-xs font-black text-indigo-400 font-mono">{loc.code}</p>
                            </div>
                            
                            <button 
                              onClick={() => setShowQrModal(loc)}
                              className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                            >
                               <QrCode size={18} /> QR Code de Acesso
                            </button>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           )}

           {activeMenu === 'equipe' && (
             <div className="animate-in fade-in space-y-10">
               <h2 className="text-3xl font-black italic text-white">Colaboradores</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {users.map(u => (
                   <div key={u.id} className="bg-[#0A0A0A] rounded-[2.5rem] border border-white/5 p-8 shadow-xl flex flex-col group hover:border-indigo-600/30 transition-all relative">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
                           <Users size={28} />
                        </div>
                        <div className="flex gap-2 relative z-30">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setEditingUser(u); }} 
                            className="p-3 bg-white/5 rounded-xl text-slate-400 hover:text-indigo-400 border border-white/10 opacity-40 hover:opacity-100 transition-all pointer-events-auto"
                            title="Editar"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setUserToDelete(u); }} 
                            className="p-3 bg-white/5 rounded-xl text-slate-400 hover:text-red-500 border border-white/10 opacity-40 hover:opacity-100 transition-all pointer-events-auto"
                            title="Remover"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-xl font-black text-white mb-1">{u.name}</h3>
                      <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-6">{u.role === 'admin' ? 'Gestor Master' : 'Colaborador'}</p>
                      
                      <div className="space-y-3 pt-6 border-t border-white/5">
                        <div className="flex items-center justify-between">
                          <p className="text-[9px] font-black uppercase text-slate-600">Matrícula</p>
                          <p className="text-xs font-black text-white">{u.employeeId}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-[9px] font-black uppercase text-slate-600">E-mail</p>
                          <p className="text-xs font-black text-white truncate max-w-[150px]">{u.email}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-[9px] font-black uppercase text-slate-600">Escala</p>
                          <p className="text-[10px] font-black text-indigo-400">{schedules.find(s => s.id === u.scheduleId)?.name || 'NÃO ATRIBUÍDA'}</p>
                        </div>
                      </div>
                   </div>
                 ))}
               </div>
             </div>
           )}

           {activeMenu === 'relatorios' && <AdminReportsView workspaceId={adminProfile?.workspaceId || ''} users={users} />}
           {activeMenu === 'solicitacoes' && <AdminRequestsManager workspaceId={adminProfile?.workspaceId || ''} />}
        </div>
      </main>

      {/* MODAL DE QR CODE (RESTAURADO) */}
      {showQrModal && (
        <div className="fixed inset-0 z-[8000] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-in zoom-in-95 duration-300">
           <div className="bg-[#0D0D0D] w-full max-w-lg rounded-[4rem] border border-white/10 shadow-2xl p-12 space-y-10 relative overflow-hidden flex flex-col items-center">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 to-indigo-700"></div>
              <div className="w-full flex justify-between items-center mb-4">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-indigo-500 border border-white/10"><QrCode size={24} /></div>
                    <h3 className="text-2xl font-black italic text-white uppercase leading-none">QR Code Unidade</h3>
                 </div>
                 <button onClick={() => setShowQrModal(null)} className="p-4 bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-all"><X size={24} /></button>
              </div>

              <div className="p-8 bg-white rounded-[3rem] shadow-2xl relative">
                 <QRCodeSVG value={showQrModal.code} size={250} level="H" />
                 <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                    <Shield size={100} className="text-black" />
                 </div>
              </div>

              <div className="text-center space-y-3">
                 <h4 className="text-xl font-black text-white uppercase tracking-tighter italic">{showQrModal.name}</h4>
                 <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-4">Identificador: {showQrModal.code}</p>
                 <div className="w-12 h-1 bg-white/5 mx-auto rounded-full"></div>
                 <p className="text-[10px] text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
                    Fixe este código em um local visível na unidade. O colaborador deve escanear para validar a presença física.
                 </p>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full pt-4">
                 <button onClick={() => window.print()} className="flex-1 py-5 bg-white/5 border border-white/10 text-white rounded-3xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all">
                    <Printer size={16} /> Imprimir Tag
                 </button>
                 <button onClick={() => setShowQrModal(null)} className="flex-1 py-5 bg-indigo-600 text-white rounded-3xl font-black text-[9px] uppercase tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">
                    Finalizar
                 </button>
              </div>
           </div>
        </div>
      )}

      {(showAddLoc || locationToEdit) && (
        <div className="fixed inset-0 z-[5000] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="bg-[#0A0A0A] w-full max-w-5xl rounded-[4rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden flex flex-col lg:flex-row max-h-[90vh]">
            <div className="flex-1 p-10 lg:p-14 space-y-10 overflow-y-auto custom-scrollbar border-b lg:border-b-0 lg:border-r border-white/5">
               <div>
                  <h3 className="text-3xl font-black italic text-white flex items-center gap-3">
                    <div className="p-3 bg-indigo-600/10 rounded-2xl text-indigo-500">
                      {locationToEdit ? <Edit3 size={24} /> : <Plus size={24} />}
                    </div>
                    {locationToEdit ? 'Editar Unidade' : 'Nova Unidade'}
                  </h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-3">Configuração de Auditoria Geográfica</p>
               </div>

               <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-4">Nome Operacional</label>
                    <input 
                      value={locationToEdit ? locationToEdit.name : newLoc.name} 
                      onChange={e => locationToEdit ? setLocationToEdit({...locationToEdit, name: e.target.value}) : setNewLoc({...newLoc, name: e.target.value})} 
                      className="w-full p-6 bg-[#1A1A1A] border border-white/10 rounded-3xl text-sm font-black text-white outline-none focus:border-indigo-600 transition-all placeholder:text-slate-800" 
                      placeholder="Ex: Sede Administrativa" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-4">Endereço Completo</label>
                    <div className="relative group">
                      <input 
                        value={locationToEdit ? locationToEdit.address : newLoc.address} 
                        onChange={e => locationToEdit ? setLocationToEdit({...locationToEdit, address: e.target.value}) : setNewLoc({...newLoc, address: e.target.value})} 
                        onKeyDown={e => e.key === 'Enter' && searchAddress()}
                        className="w-full p-6 bg-[#1A1A1A] border border-white/10 rounded-3xl text-sm font-black text-white outline-none focus:border-indigo-600 transition-all pr-20 placeholder:text-slate-800" 
                        placeholder="Rua, Número, Bairro, Cidade..." 
                      />
                      <button 
                        type="button"
                        onClick={(e) => { e.preventDefault(); searchAddress(); }}
                        disabled={isSearchingLoc}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-3.5 bg-indigo-600 text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg z-[100] cursor-pointer"
                      >
                        {isSearchingLoc ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-white/5 p-5 rounded-3xl border border-white/5 text-center">
                        <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Latitude</p>
                        <p className="text-xs font-black text-indigo-400 font-mono">{(locationToEdit?.latitude || newLoc.lat).toFixed(6)}</p>
                     </div>
                     <div className="bg-white/5 p-5 rounded-3xl border border-white/5 text-center">
                        <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Longitude</p>
                        <p className="text-xs font-black text-indigo-400 font-mono">{(locationToEdit?.longitude || newLoc.lng).toFixed(6)}</p>
                     </div>
                  </div>
               </div>

               <div className="flex gap-4 pt-6">
                  <button onClick={() => { setShowAddLoc(false); setLocationToEdit(null); }} className="flex-1 py-6 bg-white/5 text-slate-400 rounded-3xl font-black text-[10px] uppercase tracking-widest">Cancelar</button>
                  <button onClick={handleSaveLocation} className="flex-[2] py-6 bg-indigo-600 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all">
                    {locationToEdit ? 'Atualizar Unidade' : 'Salvar Unidade'}
                  </button>
               </div>
            </div>

            <div className="flex-1 bg-[#050505] relative min-h-[400px]">
               <div ref={mapContainerRef} className="w-full h-full grayscale opacity-80 contrast-125"></div>
               <div className="absolute top-10 left-10 z-[1000] bg-black/60 backdrop-blur-xl p-5 rounded-[2rem] border border-white/10 shadow-2xl">
                 <div className="flex items-center gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                   <p className="text-[9px] font-black text-white uppercase tracking-[0.3em]">GPS Auditor</p>
                 </div>
               </div>
               <div className="absolute inset-0 pointer-events-none border-l border-white/5 bg-[radial-gradient(circle_at_center,_transparent_0%,_#000_150%)]"></div>
            </div>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-[7000] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-[#0D0D0D] w-full max-w-xl rounded-[4rem] border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.8)] p-12 space-y-10 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 to-indigo-700"></div>
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-600/10 text-indigo-500 rounded-2xl flex items-center justify-center border border-indigo-600/20"><UserCog size={28} /></div>
                    <div>
                       <h3 className="text-3xl font-black italic text-white leading-none">Ajustar Membro</h3>
                       <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2">Perfil e Acesso</p>
                    </div>
                 </div>
                 <button onClick={() => setEditingUser(null)} className="p-4 bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-all border border-white/5"><X size={24} /></button>
              </div>
              
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-4">Nome Completo</label>
                    <input value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className="w-full p-6 bg-[#1A1A1A] border border-white/10 rounded-3xl text-sm font-black text-white outline-none focus:border-indigo-600 transition-all" />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-4">Matrícula</label>
                       <input value={editingUser.employeeId} onChange={e => setEditingUser({...editingUser, employeeId: e.target.value})} className="w-full p-6 bg-[#1A1A1A] border border-white/10 rounded-3xl text-sm font-black text-white outline-none focus:border-indigo-600 transition-all" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-4">Cargo</label>
                       <div className="relative">
                          <select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as any})} className="w-full p-6 bg-[#1A1A1A] border border-white/10 rounded-3xl text-sm font-black text-white outline-none focus:border-indigo-600 transition-all appearance-none cursor-pointer">
                              <option value="employee" className="bg-[#1A1A1A] text-white">Funcionário</option>
                              <option value="admin" className="bg-[#1A1A1A] text-white">Administrador</option>
                          </select>
                          <ChevronDown size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                       </div>
                    </div>
                 </div>

                 <div className="space-y-2 relative">
                    <div className="flex items-center justify-between ml-4 mb-2">
                       <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Escala de Trabalho</label>
                       <div className="flex items-center gap-1.5 text-indigo-400 group cursor-help">
                          <Info size={12} />
                          <span className="text-[8px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Configure em Escalas & Horários</span>
                       </div>
                    </div>
                    <div className="relative">
                      <select 
                        value={editingUser.scheduleId || ''} 
                        onChange={e => setEditingUser({...editingUser, scheduleId: e.target.value})} 
                        className="w-full p-6 bg-[#1A1A1A] border-2 border-indigo-600/30 hover:border-indigo-600/60 rounded-3xl text-xs font-black text-white outline-none focus:border-indigo-600 transition-all appearance-none cursor-pointer shadow-[0_0_15px_rgba(79,70,229,0.1)]"
                      >
                        <option value="" className="bg-[#1A1A1A] text-white">NÃO ATRIBUÍDA</option>
                        {schedules.map(sch => (
                          <option key={sch.id} value={sch.id} className="bg-[#1A1A1A] text-white">
                            {sch.name.toUpperCase()} ({sch.type === 'standard' ? '8H' : '12X36'})
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none" />
                    </div>
                 </div>
              </div>

              <div className="flex gap-4 pt-4">
                 <button onClick={() => setEditingUser(null)} className="flex-1 py-6 bg-white/5 hover:bg-white/10 text-slate-400 rounded-3xl font-black text-[10px] uppercase tracking-widest border border-white/5 transition-all">Cancelar</button>
                 <button onClick={handleUpdateUser} className="flex-[2] py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/20 flex items-center justify-center gap-3 active:scale-95 transition-all">
                   <Save size={18} /> Salvar Alterações
                 </button>
              </div>
           </div>
        </div>
      )}

      {selectedRecord && <RecordDetailsModal record={selectedRecord} onClose={() => setSelectedRecord(null)} isPro={true} />}
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }`}</style>
    </div>
  );
};

export default AdminDashboard;
