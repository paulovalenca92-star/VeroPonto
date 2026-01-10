import React, { useState, useMemo, useEffect } from 'react';
import { StorageService, supabase, SETUP_SQL } from '../services/storage';
import { User, Location, TimeRecord } from '../types';
import { GoogleGenAI } from "@google/genai";
import { 
  Users, 
  MapPin, 
  Clock, 
  Download, 
  Plus, 
  QrCode,
  Eye,
  X,
  Printer,
  Search,
  Trash2,
  Building2,
  Copy,
  Check,
  CheckCircle2,
  User as UserIcon,
  Loader2,
  Navigation,
  Sparkles,
  Info,
  Pencil,
  UserCog,
  Ban,
  Fingerprint,
  FileCheck,
  Share2,
  Map as MapIcon,
  ArrowDownCircle,
  ArrowUpCircle,
  ShieldCheck,
  Smartphone,
  Database,
  Globe,
  Crosshair,
  AlertTriangle,
  ImageDown,
  ChevronRight,
  History
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'locations' | 'records'>('records');
  const [showAddLoc, setShowAddLoc] = useState(false);
  const [showSql, setShowSql] = useState(false);
  
  const [selectedRecord, setSelectedRecord] = useState<TimeRecord | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [viewingQR, setViewingQR] = useState<Location | null>(null);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);
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
      printWindow.document.write(`
        <html><body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">
          <div style="border:2px solid #eee;padding:40px;border-radius:20px;text-align:center;">
            <h1 style="color:#6366f1;font-size:12px;letter-spacing:4px;">PLACA DE PONTO</h1>
            <img src="${svgBase64}" style="width:250px;margin:20px 0;"/>
            <h2 style="margin:0;">${viewingQR.name}</h2>
            <p style="color:#94a3b8;font-size:10px;">${viewingQR.code}</p>
          </div>
          <script>window.onload=()=>{setTimeout(()=>{window.print();window.close();},500);};</script>
        </body></html>
      `);
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
    canvas.width = 500; canvas.height = 650;
    img.onload = () => {
      if (!ctx) return;
      ctx.fillStyle = "white"; ctx.fillRect(0, 0, 500, 650);
      ctx.drawImage(img, 100, 100, 300, 300);
      ctx.textAlign = "center"; ctx.fillStyle = "#1e293b"; ctx.font = "bold 24px sans-serif";
      ctx.fillText(viewingQR.name, 250, 480);
      const link = document.createElement("a"); link.href = canvas.toDataURL(); link.download = "qrcode.png"; link.click();
    };
    img.src = svgToBase64(svgData);
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r => 
      r.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [records, searchTerm]);

  const executeDeleteLocation = async () => {
    if (!locationToDelete) return;
    setIsDeleting(true);
    try {
      await StorageService.deleteLocation(locationToDelete.id);
      setLocationToDelete(null);
      await loadData();
    } catch (err) { alert("Erro ao excluir."); }
    finally { setIsDeleting(false); }
  };

  const getRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'agora mesmo';
    if (hours === 1) return 'há 1 hora';
    return `há ${hours} horas`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
      {/* Banner Superior */}
      <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border border-white/5">
        <div className="space-y-2 text-center md:text-left">
          <h2 className="text-3xl font-black tracking-tight">VeroPonto <span className="text-indigo-500">Gestão</span></h2>
          <p className="text-slate-400 text-sm font-medium">Controle de unidades e registros em tempo real.</p>
        </div>
        <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 flex flex-col items-center gap-3">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 text-slate-300">Workspace ID</p>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black tracking-tighter tabular-nums">{adminProfile?.workspaceId}</span>
            <button onClick={copyWorkspaceId} className={`p-3 rounded-xl transition-all ${copied ? 'bg-emerald-500' : 'bg-white/10 hover:bg-white/20'}`}>
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
        </div>
      </section>

      {/* Abas */}
      <nav className="flex bg-white p-2 rounded-3xl shadow-sm border border-slate-100 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <button onClick={() => setActiveTab('records')} className={`flex-1 min-w-[120px] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'records' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>Registros</button>
        <button onClick={() => setActiveTab('users')} className={`flex-1 min-w-[120px] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>Equipe</button>
        <button onClick={() => setActiveTab('locations')} className={`flex-1 min-w-[120px] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'locations' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>Unidades</button>
      </nav>

      {/* Área de Conteúdo */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 min-h-[400px]">
        {activeTab === 'records' && (
          <div className="overflow-x-auto">
             <div className="p-4 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative max-w-sm w-full">
                   <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                   <input type="text" placeholder="Buscar registro..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-2xl text-xs font-bold text-slate-700 outline-none" />
                </div>
                <button onClick={() => StorageService.exportToCSV(filteredRecords)} className="w-full md:w-auto px-6 py-3 bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                   <Download size={16} /> Baixar Relatório (CSV)
                </button>
             </div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Colaborador</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Horário</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Local</th>
                  <th className="px-6 py-5 text-right px-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRecords.map(record => (
                  <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => setSelectedRecord(record)}>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black text-xs uppercase">{record.userName.substring(0, 2)}</div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{record.userName}</p>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{record.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-[10px] font-black uppercase tracking-widest">
                       <span className={record.type === 'entry' ? 'text-indigo-600' : 'text-slate-400'}>{record.type === 'entry' ? 'Entrada' : 'Saída'}</span>
                    </td>
                    <td className="px-6 py-5 font-bold text-slate-800 text-xs">{new Date(record.timestamp).toLocaleString()}</td>
                    <td className="px-6 py-5 text-slate-500 font-semibold text-xs truncate max-w-[200px]">{record.locationName}</td>
                    <td className="px-6 py-5 text-right px-10">
                      <button className="p-2 text-slate-300 hover:text-indigo-600 transition-all opacity-0 group-hover:opacity-100"><Eye size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'locations' && (
          <div className="p-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Unidades Ativas</h3>
                <p className="text-slate-400 text-xs font-semibold">Locais autorizados.</p>
              </div>
              <button onClick={() => setShowAddLoc(true)} className="w-full md:w-auto px-8 py-5 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-700 shadow-xl">
                <Plus size={18} /> Nova Unidade
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.map(loc => (
                <div key={loc.id} className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8 flex flex-col relative group hover:shadow-xl transition-all">
                  <div className="absolute top-4 right-4 flex gap-1 z-30">
                    <button onClick={() => setViewingQR(loc)} className="p-3 bg-white text-indigo-500 rounded-2xl shadow-sm hover:bg-indigo-50 border border-slate-100"><QrCode size={18} /></button>
                    <button onClick={() => setLocationToDelete(loc)} className="p-3 bg-white text-slate-300 rounded-2xl shadow-sm hover:text-red-500 border border-slate-100"><Trash2 size={18} /></button>
                  </div>
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-600 mb-6 shadow-sm border border-slate-100"><MapPin size={28} /></div>
                  <h4 className="font-black text-slate-800 text-lg">{loc.name}</h4>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{loc.code}</p>
                  <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed italic">{loc.address || 'Sem endereço'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE DETALHES DO REGISTRO (COMPROVANTE) */}
      {selectedRecord && (
        <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#18181b] rounded-[3rem] w-full max-w-[420px] overflow-hidden relative border border-white/5 shadow-2xl flex flex-col max-h-[90vh]">
                
                {/* Cabeçalho */}
                <div className="p-8 pb-6">
                    <div className="flex justify-between items-center mb-6">
                         <div className="flex items-center gap-2">
                             <Fingerprint size={16} className="text-indigo-400" />
                             <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">Comprovante de Registro</span>
                         </div>
                         <button onClick={() => setSelectedRecord(null)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 transition">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex items-start gap-5">
                        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shrink-0 shadow-lg ${
                            selectedRecord.type === 'entry' ? 'bg-[#ccff00] text-black' : 'bg-[#ff4400] text-white'
                        }`}>
                            {selectedRecord.type === 'entry' ? <ArrowDownCircle size={32} /> : <ArrowUpCircle size={32} />}
                        </div>
                        <div>
                            <h2 className="text-white font-black text-2xl leading-tight">
                                {selectedRecord.type === 'entry' ? 'Entrada' : 'Saída'}
                            </h2>
                            <p className="text-gray-400 text-xs mt-1 font-bold">
                                {new Date(selectedRecord.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})} • {new Date(selectedRecord.timestamp).toLocaleDateString('pt-BR')}
                            </p>
                            <p className="text-indigo-400/60 text-[10px] mt-1 font-black uppercase tracking-widest">
                                {getRelativeTime(selectedRecord.timestamp)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-white/5 w-full"></div>

                {/* Conteúdo com Scroll */}
                <div className="overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                            <div className="col-span-2">
                                <p className="text-white font-black text-[10px] uppercase tracking-widest opacity-40 mb-2">Colaborador</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white font-bold text-xs">{selectedRecord.userName.charAt(0)}</div>
                                    <p className="text-white font-bold text-sm truncate">{selectedRecord.userName}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-white font-black text-[10px] uppercase tracking-widest opacity-40 mb-1">Matrícula</p>
                                <p className="text-gray-300 text-xs font-bold">{selectedRecord.employeeId}</p>
                            </div>
                            <div>
                                <p className="text-white font-black text-[10px] uppercase tracking-widest opacity-40 mb-1">Localização</p>
                                <p className="text-gray-300 text-xs font-bold truncate">{selectedRecord.locationName}</p>
                            </div>

                            <div className="col-span-2">
                                <p className="text-white font-black text-[10px] uppercase tracking-widest opacity-40 mb-2">Protocolo de Segurança (ID)</p>
                                <div className="p-3 bg-white/5 rounded-xl flex items-center justify-between group">
                                    <code className="text-indigo-300 text-[10px] font-mono break-all leading-tight pr-4">
                                        {selectedRecord.id}
                                    </code>
                                    <button onClick={() => {navigator.clipboard.writeText(selectedRecord.id); alert('ID Copiado!');}} className="text-white/20 hover:text-white transition">
                                        <Copy size={14} />
                                    </button>
                                </div>
                            </div>

                            {selectedRecord.photo && (
                                <div className="col-span-2">
                                    <p className="text-white font-black text-[10px] uppercase tracking-widest opacity-40 mb-3">Evidência Biométrica</p>
                                    <div className="relative group">
                                        <img 
                                            src={selectedRecord.photo} 
                                            className="w-full aspect-square object-cover rounded-[2rem] border-2 border-white/5 shadow-2xl transition-transform hover:scale-[1.02]" 
                                            alt="Selfie" 
                                        />
                                        <div className="absolute inset-0 bg-indigo-600/20 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                            <ShieldCheck size={40} className="text-white" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sessão de Mapa */}
                    <div className="space-y-4">
                         <p className="text-white font-black text-[10px] uppercase tracking-widest opacity-40">Geolocalização</p>
                         <div className="w-full aspect-video bg-zinc-800 rounded-3xl overflow-hidden relative border border-white/5 group shadow-inner">
                            <div className="absolute inset-0 opacity-10" style={{
                                 backgroundImage: `linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)`,
                                 backgroundSize: '20px 20px'
                            }}></div>
                             <div className="absolute inset-0 flex items-center justify-center">
                                <MapPin size={40} className="text-indigo-500 drop-shadow-2xl z-10" fill="currentColor" />
                                <div className="w-8 h-8 bg-indigo-500/30 blur-xl rounded-full absolute"></div>
                             </div>

                            {selectedRecord.coords ? (
                                 <a 
                                    href={`https://www.google.com/maps/search/?api=1&query=${selectedRecord.coords.latitude},${selectedRecord.coords.longitude}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[2px]"
                                 >
                                    <span className="bg-white text-black text-[10px] font-black px-4 py-2 rounded-xl shadow-lg flex items-center gap-2">
                                        ABRIR MAPA <Navigation size={10} />
                                    </span>
                                 </a>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
                                    <span className="text-gray-500 text-[10px] font-black uppercase flex items-center gap-2"><Ban size={14} /> GPS não capturado</span>
                                </div>
                            )}
                         </div>
                    </div>

                    <div className="pt-4 flex flex-col items-center gap-4">
                        <p className="text-zinc-600 text-[8px] font-black text-center uppercase tracking-[0.3em]">Certificação Digital VeroPonto v2.0</p>
                        <button 
                            onClick={() => window.print()}
                            className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/5 transition flex items-center justify-center gap-2"
                        >
                            <Printer size={16} /> Imprimir Comprovante
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Visualizador de QR */}
      {viewingQR && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="max-w-sm w-full bg-white rounded-[3.5rem] p-10 shadow-2xl text-center space-y-8 border border-slate-100">
             <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Placa de Ponto</span>
                <button onClick={() => setViewingQR(null)} className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-400"><X size={20} /></button>
             </div>
             <div className="bg-white p-8 rounded-[3rem] shadow-inner border-8 border-slate-50 flex items-center justify-center qr-container">
                <QRCodeSVG value={viewingQR.code} size={200} level="H" />
             </div>
             <div className="space-y-2">
                <h4 className="text-2xl font-black text-slate-800 tracking-tight">{viewingQR.name}</h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{viewingQR.code}</p>
             </div>
             <div className="grid grid-cols-2 gap-3">
                 <button onClick={handlePrintQRCode} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all">
                    <Printer size={18} /> Imprimir
                 </button>
                 <button onClick={handleDownloadImage} className="w-full py-5 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
                    <ImageDown size={18} /> Baixar PNG
                 </button>
             </div>
          </div>
        </div>
      )}

      {/* Confirmação de Exclusão */}
      {locationToDelete && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="max-w-sm w-full bg-white rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 text-center">
             <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6"><Trash2 size={32} /></div>
             <h3 className="text-xl font-black text-slate-800 mb-2">Excluir Unidade?</h3>
             <p className="text-slate-500 text-sm mb-8">Deseja remover <strong>{locationToDelete.name}</strong>?</p>
             <div className="flex flex-col gap-3">
               <button onClick={executeDeleteLocation} disabled={isDeleting} className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest">{isDeleting ? <Loader2 size={16} className="animate-spin" /> : "Confirmar Exclusão"}</button>
               <button onClick={() => setLocationToDelete(null)} className="w-full py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest">Cancelar</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;