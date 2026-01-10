import React, { useState, useMemo, useEffect } from 'react';
import { StorageService, supabase } from '../services/storage';
import { User, Location, TimeRecord } from '../types';
import { GoogleGenAI } from "@google/genai";
import { 
  Users, 
  MapPin, 
  Clock, 
  Download, 
  Plus, 
  QrCode,
  X,
  Printer,
  Search,
  Trash2,
  Building2,
  Copy,
  CheckCircle2,
  User as UserIcon,
  Loader2,
  TrendingUp,
  AlertOctagon,
  ImageDown,
  Mail,
  Navigation,
  Sparkles,
  ExternalLink,
  Info
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'locations' | 'records'>('records');
  const [showAddLoc, setShowAddLoc] = useState(false);
  
  const [selectedRecord, setSelectedRecord] = useState<TimeRecord | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null); // Novo estado para detalhes da unidade
  const [viewingQR, setViewingQR] = useState<Location | null>(null);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [copied, setCopied] = useState(false);
  
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [records, setRecords] = useState<TimeRecord[]>([]);
  const [adminProfile, setAdminProfile] = useState<User | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  
  const [newLoc, setNewLoc] = useState<{name: string, address: string, code: string, lat?: number, lng?: number}>({ 
    name: '', 
    address: '', 
    code: '' 
  });
  
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Busca automática de GPS
  useEffect(() => {
    if (!showAddLoc || !newLoc.address || newLoc.address.length < 10) return;
    const timer = setTimeout(() => {
      handleSearchAddressWithAI(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, [newLoc.address, showAddLoc]);

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

  const copyWorkspaceId = () => {
    if (adminProfile) {
      navigator.clipboard.writeText(adminProfile.workspaceId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const recordsToday = records.filter(r => new Date(r.timestamp).toDateString() === today);
    const uniquePeopleToday = new Set(recordsToday.map(r => r.userId)).size;
    const chartData = Array.from({length: 12}, (_, i) => {
        const hour = new Date().getHours() - (11 - i);
        const count = recordsToday.filter(r => new Date(r.timestamp).getHours() === hour).length;
        return { hour, count };
    });
    const maxCount = Math.max(...chartData.map(d => d.count), 1);

    return {
        todayTotal: recordsToday.length,
        uniquePeople: uniquePeopleToday,
        locations: locations.length,
        chartData,
        maxCount,
        totalUsers: users.length,
        admins: users.filter(u => u.role === 'admin').length,
        employees: users.filter(u => u.role === 'employee').length
    };
  }, [records, locations, users]);

  const filteredRecords = useMemo(() => {
    return records.filter(r => 
      r.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [records, searchTerm]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.employeeId.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchTerm.toLowerCase())
    );
  }, [users, userSearchTerm]);

  const handleSearchAddressWithAI = async (isAuto = false) => {
    if (!newLoc.address.trim() || !process.env.API_KEY || isSearchingAddress) return;
    if (isAuto && newLoc.lat && newLoc.lng) return;

    setIsSearchingAddress(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Analise o endereço brasileiro e retorne as coordenadas geográficas para GPS.
      Endereço: "${newLoc.address}"
      Retorne APENAS um JSON: {"formatted_address": "string", "latitude": number, "longitude": number}`;
      
      const response = await ai.models.generateContent({ 
        model: 'gemini-3-flash-preview', 
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      
      const text = response.text;
      if (text) {
        const data = JSON.parse(text);
        if (data.latitude && data.longitude) {
          setNewLoc(prev => ({ 
            ...prev, 
            lat: data.latitude,
            lng: data.longitude,
            address: isAuto ? prev.address : (data.formatted_address || prev.address)
          }));
        }
      }
    } catch (err) { 
      console.error("AI GPS Error:", err); 
    } finally { 
      setIsSearchingAddress(false); 
    }
  };

  const handleAddLoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminProfile || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await StorageService.saveLocation({
        name: newLoc.name.trim(),
        address: newLoc.address.trim(),
        code: newLoc.code.trim() || `QR-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        workspaceId: adminProfile.workspaceId,
        latitude: newLoc.lat,
        longitude: newLoc.lng
      });
      setShowAddLoc(false);
      setNewLoc({ name: '', address: '', code: '' });
      await loadData();
    } catch (err) { 
      alert("Erro ao salvar unidade."); 
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
    } catch (err) { alert("Erro ao remover colaborador."); } finally { setIsDeleting(false); }
  };

  const handleDeleteLocation = async () => {
    if (!locationToDelete) return;
    setIsDeleting(true);
    try {
      await StorageService.deleteLocation(locationToDelete.id);
      setLocationToDelete(null);
      await loadData();
    } catch (err) { 
      alert("Erro ao remover unidade. Verifique se existem registros vinculados."); 
    } finally { 
      setIsDeleting(false); 
    }
  };

  const svgToBase64 = (svgString: string) => {
    return `data:image/svg+xml;base64,${window.btoa(unescape(encodeURIComponent(svgString)))}`;
  };

  const handlePrintQRCode = () => {
    if (!viewingQR) return;
    const svgElement = document.querySelector('.qr-container svg');
    if (!svgElement) return;
    try {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBase64 = svgToBase64(svgData);
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;
      printWindow.document.write(`<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;"><div style="text-align:center;"><img src="${svgBase64}" style="width:300px;"/><h1>${viewingQR.name}</h1><p>${viewingQR.code}</p></div><script>window.onload=()=>{window.print();window.close();}</script></body></html>`);
      printWindow.document.close();
    } catch (e) { console.error(e); }
  };

  const handleDownloadImage = () => {
    if (!viewingQR) return;
    const svgElement = document.querySelector('.qr-container svg');
    if (!svgElement) return;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    const size = 600; 
    canvas.width = size;
    canvas.height = size + 150;
    img.onload = () => {
        if (!ctx) return;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, (size - 300) / 2, 80, 300, 300);
        ctx.font = "bold 32px sans-serif";
        ctx.fillStyle = "#1e293b";
        ctx.textAlign = "center";
        ctx.fillText(viewingQR.name, 300, 480);
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = `ponto-${viewingQR.code}.png`;
        link.click();
    };
    img.src = svgToBase64(svgData);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
      
      {/* Header com KPIs */}
      <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 bg-indigo-600/20 blur-[100px] rounded-full"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10 mb-10">
            <div>
                 <h2 className="text-3xl font-black tracking-tight mb-1">Painel <span className="text-indigo-400">Gestor</span></h2>
                 <p className="text-slate-400 text-xs font-medium">Visão geral da operação em tempo real.</p>
            </div>
            <div className="flex items-center gap-3">
                 <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-2 border border-white/10">
                    <Building2 size={14} className="text-indigo-400" />
                    <span className="text-xs font-bold tracking-wider">{adminProfile?.workspaceId}</span>
                    <button onClick={copyWorkspaceId} className="hover:text-white text-white/50 transition">
                        {copied ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    </button>
                 </div>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/5 backdrop-blur-sm p-5 rounded-3xl border border-white/5 flex flex-col justify-between h-32">
                <div className="flex justify-between items-start">
                    <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-300"><Clock size={20} /></div>
                </div>
                <div>
                    <h3 className="text-3xl font-black">{stats.todayTotal}</h3>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Registros Hoje</p>
                </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm p-5 rounded-3xl border border-white/5 flex flex-col justify-between h-32">
                <div className="flex justify-between items-start">
                    <div className="p-2 bg-purple-500/20 rounded-xl text-purple-300"><Users size={20} /></div>
                </div>
                <div>
                    <h3 className="text-3xl font-black">{stats.uniquePeople} <span className="text-sm text-slate-500 font-medium">/ {users.length}</span></h3>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Presentes Agora</p>
                </div>
            </div>
            <div className="col-span-1 md:col-span-2 bg-white/5 backdrop-blur-sm p-5 rounded-3xl border border-white/5 flex flex-col justify-between h-32 relative overflow-hidden">
                <div className="absolute inset-0 flex items-end justify-between px-4 pb-0 opacity-30">
                    {stats.chartData.map((d, i) => (
                        <div key={i} className="w-full mx-1 bg-indigo-400 rounded-t-sm" style={{ height: `${(d.count / stats.maxCount) * 80}%` }}></div>
                    ))}
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingUp size={16} className="text-indigo-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Atividade (12h)</span>
                    </div>
                </div>
            </div>
        </div>
      </section>

      <nav className="flex bg-white p-2 rounded-3xl shadow-sm border border-slate-100 overflow-x-auto whitespace-nowrap scrollbar-hide">
        {['records', 'users', 'locations'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 min-w-[120px] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:bg-slate-50'}`}>
                {tab === 'records' ? 'Registros' : tab === 'users' ? 'Equipe' : 'Unidades'}
            </button>
        ))}
      </nav>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 min-h-[400px]">
        {activeTab === 'records' && (
          <div className="overflow-x-auto">
             <div className="p-4 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative max-w-sm w-full">
                   <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                   <input type="text" placeholder="Buscar colaborador..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 transition-all" />
                </div>
                <button onClick={() => StorageService.exportToCSV(filteredRecords)} className="px-5 py-3 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all">
                   <Download size={14} /> CSV
                </button>
             </div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Colaborador</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Horário</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Local</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRecords.map(record => (
                  <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => setSelectedRecord(record)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 font-bold text-xs">{record.userName.substring(0, 2)}</div>
                        <div>
                          <p className="font-bold text-slate-800 text-xs">{record.userName}</p>
                          <p className="text-[9px] font-medium text-slate-400">{record.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wide border ${record.type === 'entry' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                           {record.type === 'entry' ? 'Entrada' : 'Saída'}
                        </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700 text-xs tabular-nums">
                        {new Date(record.timestamp).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                            <span className="text-slate-500 font-medium text-xs truncate max-w-[150px]">{record.locationName?.split('(')[0] || 'Local'}</span>
                            {record.locationName?.includes('Fora') && <AlertOctagon size={14} className="text-amber-500" title="Registro fora do perímetro" />}
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="flex flex-col p-6">
             <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
                <div>
                    <h3 className="text-xl font-black text-slate-800">Equipe Corporativa</h3>
                    <p className="text-slate-400 text-xs font-medium">Gestão de acessos e cargos da unidade.</p>
                </div>
                <div className="relative max-w-sm w-full">
                   <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                   <input type="text" placeholder="Buscar..." value={userSearchTerm} onChange={(e) => setUserSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl text-xs font-bold text-slate-700 outline-none border border-slate-100 focus:border-indigo-200 transition-all" />
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map(user => (
                    <div key={user.id} className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 bg-slate-50 rounded-bl-[4rem] opacity-40"></div>
                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                                <UserIcon size={28} />
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${user.role === 'admin' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                {user.role === 'admin' ? 'Gestor' : 'Colaborador'}
                            </span>
                        </div>
                        <div className="space-y-4 relative z-10">
                            <div>
                                <h4 className="font-black text-slate-800 text-lg leading-tight group-hover:text-indigo-600 transition-colors">{user.name}</h4>
                                <p className="text-[10px] font-bold text-slate-400 truncate mt-1 flex items-center gap-1"><Mail size={12} /> {user.email}</p>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                <div><p className="text-[8px] font-black text-slate-300 uppercase">Matrícula</p><p className="text-xs font-black text-slate-600">{user.employeeId}</p></div>
                                <button onClick={() => setUserToDelete(user)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'locations' && (
          <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-800">Unidades</h3>
                <p className="text-slate-400 text-xs font-medium">Gestão de locais físicos para validação de ponto.</p>
              </div>
              <button onClick={() => setShowAddLoc(true)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">
                <Plus size={14} /> Nova Unidade
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.map(loc => (
                <div key={loc.id} onClick={() => setSelectedLocation(loc)} className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden cursor-pointer">
                   <div className="absolute top-0 right-0 p-10 bg-gradient-to-bl from-slate-100 to-transparent rounded-bl-[4rem] opacity-50"></div>
                   <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm">
                            <MapPin size={20} />
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setLocationToDelete(loc); }} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <h4 className="font-black text-slate-800 text-lg leading-tight mb-1">{loc.name}</h4>
                      <p className="text-xs text-slate-500 line-clamp-1 mb-6 flex items-center gap-1"><Navigation size={10} className="text-slate-300" /> {loc.address || 'Sem endereço'}</p>
                      <button onClick={(e) => { e.stopPropagation(); setViewingQR(loc); }} className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-indigo-100 transition-all shadow-sm">
                          <QrCode size={12} /> QR Code Gerencial
                      </button>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: DETALHES DA UNIDADE (RESTAURADO/ADICIONADO) */}
      {selectedLocation && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
           <div className="bg-white rounded-[3rem] max-w-sm w-full p-8 shadow-2xl relative">
               <button onClick={() => setSelectedLocation(null)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition"><X size={20} /></button>
               <div className="text-center mb-8">
                   <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-4 border border-indigo-100 shadow-lg shadow-indigo-50">
                      <MapPin size={32} />
                   </div>
                   <h3 className="text-2xl font-black text-slate-800">{selectedLocation.name}</h3>
                   <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-1">CÓDIGO: {selectedLocation.code}</p>
               </div>
               <div className="space-y-4">
                   <div className="bg-slate-50 p-4 rounded-2xl">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Info size={10} /> Endereço Completo</p>
                      <p className="text-xs font-bold text-slate-700 leading-relaxed">{selectedLocation.address || 'Nenhum endereço cadastrado para esta unidade.'}</p>
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 p-4 rounded-2xl">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Latitude</p>
                          <p className="text-xs font-black text-slate-800 tabular-nums">{selectedLocation.latitude?.toFixed(6) || 'N/D'}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Longitude</p>
                          <p className="text-xs font-black text-slate-800 tabular-nums">{selectedLocation.longitude?.toFixed(6) || 'N/D'}</p>
                      </div>
                   </div>
                   {selectedLocation.latitude && selectedLocation.longitude && (
                     <a href={`https://www.google.com/maps/search/?api=1&query=${selectedLocation.latitude},${selectedLocation.longitude}`} target="_blank" className="block w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest text-center hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 flex items-center justify-center gap-2">
                        <ExternalLink size={14} /> Abrir no Google Maps
                     </a>
                   )}
               </div>
           </div>
        </div>
      )}

      {/* Outros Modais (QR, Deletar, etc) - Mantidos e verificados */}
      {viewingQR && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
          <div className="max-w-sm w-full bg-white rounded-[3rem] p-8 shadow-2xl text-center space-y-6 relative">
             <button onClick={() => setViewingQR(null)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100"><X size={20} /></button>
             <div className="pt-4">
                <h4 className="text-2xl font-black text-slate-800">{viewingQR.name}</h4>
                <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mt-1">QR Code Identificador</p>
             </div>
             <div className="bg-white p-4 rounded-3xl shadow-inner border border-slate-100 inline-block qr-container">
                <QRCodeSVG value={viewingQR.code} size={200} level="H" />
             </div>
             <div className="grid grid-cols-2 gap-3">
                 <button onClick={handlePrintQRCode} className="py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition">
                    <Printer size={16} /> Imprimir
                 </button>
                 <button onClick={handleDownloadImage} className="py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-200 transition">
                    <ImageDown size={16} /> Salvar
                 </button>
             </div>
          </div>
        </div>
      )}

      {locationToDelete && (
          <div className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
              <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl space-y-6">
                  <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto border border-red-100 shadow-lg shadow-red-50">
                      <AlertOctagon size={32} />
                  </div>
                  <div className="text-center space-y-2">
                      <h3 className="text-xl font-black text-slate-800">Remover Unidade?</h3>
                      <p className="text-slate-400 text-xs font-medium leading-relaxed px-4">Esta ação pode afetar relatórios de presença vinculados a <strong>{locationToDelete.name}</strong>.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setLocationToDelete(null)} className="py-4 bg-slate-50 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100">Cancelar</button>
                      <button onClick={handleDeleteLocation} disabled={isDeleting} className="py-4 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                          {isDeleting ? <Loader2 size={12} className="animate-spin" /> : 'Confirmar'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {userToDelete && (
          <div className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
              <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl space-y-6">
                  <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto border border-red-100 shadow-lg shadow-red-50">
                      <AlertOctagon size={32} />
                  </div>
                  <div className="text-center space-y-2">
                      <h3 className="text-xl font-black text-slate-800">Remover Acesso?</h3>
                      <p className="text-slate-400 text-xs font-medium leading-relaxed px-4">O colaborador <strong>{userToDelete.name}</strong> não poderá mais registrar ponto no workspace.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setUserToDelete(null)} className="py-4 bg-slate-50 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition">Cancelar</button>
                      <button onClick={handleDeleteUser} disabled={isDeleting} className="py-4 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2 transition">
                          {isDeleting ? <Loader2 size={12} className="animate-spin" /> : 'Confirmar'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Modal Nova Unidade (GPS Detectado Restaurado) */}
      {showAddLoc && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl space-y-6 overflow-hidden relative">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-2xl font-black text-slate-800">Nova Unidade</h3>
                    <button onClick={() => setShowAddLoc(false)} className="p-2 hover:bg-slate-50 rounded-full transition"><X size={24} className="text-slate-400" /></button>
                </div>
                <form onSubmit={handleAddLoc} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 mb-1 block">Identificação</label>
                        <input required value={newLoc.name} onChange={e => setNewLoc({...newLoc, name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl font-bold text-sm outline-none border border-slate-100 focus:border-indigo-200 transition-all" placeholder="Ex: Matriz Administrativa" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 mb-1 block">Localização (GPS Automático)</label>
                        <div className="relative">
                            <input 
                              required 
                              value={newLoc.address} 
                              onChange={e => setNewLoc({...newLoc, address: e.target.value})} 
                              className="w-full p-4 bg-slate-50 rounded-xl font-bold text-sm outline-none border border-slate-100 focus:border-indigo-200 transition-all pr-12" 
                              placeholder="Digite o endereço completo..." 
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                {isSearchingAddress ? <Loader2 size={18} className="animate-spin text-indigo-500" /> : <Navigation size={18} className="text-slate-300" />}
                            </div>
                        </div>
                        
                        {/* BOX DE GPS DETECTADO (AESTHETICS RESTORED) */}
                        {newLoc.lat && newLoc.lng && (
                            <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-4 animate-in slide-in-from-top-2">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-100 shrink-0">
                                    <CheckCircle2 size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Localização Fixada</p>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600/70">
                                        <span>Lat: {newLoc.lat.toFixed(6)}</span>
                                        <span className="opacity-30">|</span>
                                        <span>Lng: {newLoc.lng.toFixed(6)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        {!newLoc.lat && !isSearchingAddress && newLoc.address.length > 5 && (
                          <p className="mt-2 text-[9px] font-bold text-slate-400 flex items-center gap-1 pl-2 italic">
                            <Sparkles size={10} className="text-indigo-400" /> Verificando coordenadas geográficas...
                          </p>
                        )}
                    </div>
                    <button disabled={isSubmitting} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 mt-4 active:scale-95 disabled:opacity-50">
                        {isSubmitting ? 'Cadastrando...' : 'Confirmar Cadastro'}
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* Detalhes Registro Ponto */}
      {selectedRecord && (
          <div className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
             <div className="bg-white rounded-[3rem] max-w-sm w-full p-8 shadow-2xl relative">
                 <button onClick={() => setSelectedRecord(null)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition"><X size={20} /></button>
                 <div className="text-center mb-6">
                     <div className="w-24 h-24 rounded-3xl bg-slate-50 mx-auto mb-4 overflow-hidden shadow-inner border border-slate-100 flex items-center justify-center">
                        {selectedRecord.photo ? <img src={selectedRecord.photo} className="w-full h-full object-cover" /> : <UserIcon size={40} className="text-slate-200" />}
                     </div>
                     <h3 className="text-xl font-black text-slate-800 tracking-tight">{selectedRecord.userName}</h3>
                     <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">{selectedRecord.employeeId}</p>
                 </div>
                 <div className="space-y-3">
                     <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Horário</span><span className="text-sm font-black text-slate-800 tabular-nums">{new Date(selectedRecord.timestamp).toLocaleTimeString()}</span></div>
                     <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unidade</span><span className="text-xs font-black text-slate-800">{selectedRecord.locationName?.split('(')[0] || 'Unidade'}</span></div>
                     {selectedRecord.coords && (
                       <a href={`https://www.google.com/maps/search/?api=1&query=${selectedRecord.coords.latitude},${selectedRecord.coords.longitude}`} target="_blank" className="block w-full py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest text-center hover:bg-indigo-100 transition shadow-sm">
                          Ver Localização de Registro
                       </a>
                     )}
                 </div>
             </div>
          </div>
      )}
    </div>
  );
};

export default AdminDashboard;