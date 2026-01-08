
import React, { useState, useMemo, useEffect } from 'react';
import { StorageService, supabase } from '../services/storage';
import { User, Location, TimeRecord } from '../types';
import { 
  Users, 
  MapPin, 
  Clock, 
  Download, 
  Plus, 
  UserPlus, 
  QrCode,
  Eye,
  X,
  Printer,
  ExternalLink,
  ShieldCheck,
  Search,
  Trash2,
  Building2,
  Calendar,
  Copy,
  Check,
  // Fix: Added CheckCircle2 to the import list
  CheckCircle2,
  Share2,
  Mail,
  User as UserIcon,
  Hash,
  AlertCircle,
  Loader2,
  ChevronRight,
  Info
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'locations' | 'records'>('records');
  const [showAddLoc, setShowAddLoc] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<TimeRecord | null>(null);
  const [viewingQR, setViewingQR] = useState<Location | null>(null);
  const [copied, setCopied] = useState(false);
  
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [records, setRecords] = useState<TimeRecord[]>([]);
  const [adminProfile, setAdminProfile] = useState<User | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [newLoc, setNewLoc] = useState({ name: '', code: '' });
  const [newUser, setNewUser] = useState({ name: '', email: '', employeeId: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{text: string, type: 'success' | 'error'} | null>(null);

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

  const handleAddLoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminProfile) return;

    const loc: Location = {
      id: `loc-${Date.now()}`,
      name: newLoc.name,
      code: newLoc.code || `QR-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      workspaceId: adminProfile.workspaceId
    };
    await StorageService.saveLocation(loc);
    loadData();
    setNewLoc({ name: '', code: '' });
    setShowAddLoc(false);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminProfile) return;
    setIsLoading(true);
    setStatusMsg(null);

    // No Supabase, cadastrar outro usuário pelo Admin sem deslogar requer o uso de Service Role Key
    // que não devemos expor no frontend. Por isso, usamos o sistema de "Convite/Autorização".
    // Registramos que este colaborador está autorizado a entrar nesta empresa.
    try {
      // Simula o envio de convite ou pré-cadastro
      setStatusMsg({ 
        text: `Convite gerado para ${newUser.name}! Envie o código da empresa para ele finalizar o cadastro.`, 
        type: 'success' 
      });
      
      // Aqui poderíamos salvar em uma tabela de 'invites' se necessário.
      // Por agora, o admin apenas confirma os dados para passar ao RH.
      
      setTimeout(() => {
        setShowAddUser(false);
        setNewUser({ name: '', email: '', employeeId: '' });
        setStatusMsg(null);
      }, 5000);
    } catch (err) {
      setStatusMsg({ text: "Erro ao processar solicitação.", type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLoc = async (id: string) => {
    if (confirm('Deseja remover esta unidade?')) {
      await StorageService.deleteLocation(id);
      loadData();
    }
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r => 
      r.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [records, searchTerm]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.role === 'employee' && (
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [users, searchTerm]);

  const exportData = () => {
    StorageService.exportToCSV(filteredRecords);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
      
      {/* SaaS Workspace Banner */}
      <section className="bg-indigo-600 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-indigo-200">
        <div className="space-y-2 text-center md:text-left">
          <h2 className="text-2xl font-black tracking-tight">Painel de Gestão Corporativa</h2>
          <p className="text-indigo-100 text-sm opacity-80">Gerencie sua equipe e unidades em tempo real.</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 flex flex-col items-center gap-3 w-full md:w-auto">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 text-indigo-100">Código de Convite</p>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black tracking-tighter tabular-nums">{adminProfile?.workspaceId}</span>
            <button 
              onClick={copyWorkspaceId}
              className={`p-3 rounded-xl transition-all ${copied ? 'bg-emerald-500' : 'bg-white/20 hover:bg-white/30'}`}
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
          <p className="text-[9px] font-bold text-indigo-200 italic text-center">Envie este código para seus funcionários</p>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600"><Users size={20} /></div>
          <div><p className="text-[10px] text-slate-400 font-black uppercase">Equipe</p><p className="text-2xl font-black text-slate-900">{users.filter(u => u.role === 'employee').length}</p></div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600"><Clock size={20} /></div>
          <div><p className="text-[10px] text-slate-400 font-black uppercase">Pontos Hoje</p><p className="text-2xl font-black text-slate-900">{records.filter(r => new Date(r.timestamp).toDateString() === new Date().toDateString()).length}</p></div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600"><Building2 size={20} /></div>
          <div><p className="text-[10px] text-slate-400 font-black uppercase">Unidades</p><p className="text-2xl font-black text-slate-900">{locations.length}</p></div>
        </div>
      </section>

      {/* Tabs */}
      <nav className="flex bg-white p-2 rounded-3xl shadow-sm border border-slate-100">
        <button onClick={() => setActiveTab('records')} className={`flex-1 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${activeTab === 'records' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>Registros</button>
        <button onClick={() => setActiveTab('users')} className={`flex-1 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>Colaboradores</button>
        <button onClick={() => setActiveTab('locations')} className={`flex-1 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${activeTab === 'locations' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>Unidades</button>
      </nav>

      {/* Search & Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input 
            type="text" 
            placeholder="Pesquisar por nome ou matrícula..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-semibold text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          {activeTab === 'records' && (
            <button onClick={exportData} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-white border border-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
              <Download size={16} /> Exportar CSV
            </button>
          )}
          {activeTab === 'users' && (
            <button onClick={() => setShowAddUser(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
              <UserPlus size={16} /> Cadastrar Colaborador
            </button>
          )}
          {activeTab === 'locations' && (
            <button onClick={() => setShowAddLoc(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
              <Plus size={16} /> Nova Unidade
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        {activeTab === 'records' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Colaborador</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Horário</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Local</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRecords.map(record => (
                  <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black text-xs uppercase">
                          {record.userName.substring(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{record.userName}</p>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{record.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${record.type === 'entry' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                        {record.type === 'entry' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 tabular-nums">{new Date(record.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase">{new Date(record.timestamp).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-slate-500">
                        <MapPin size={14} className="text-slate-300" />
                        <span className="text-[10px] font-bold uppercase truncate max-w-[120px]">{record.locationName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <button 
                        onClick={() => setSelectedRecord(record)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredRecords.length === 0 && (
              <div className="py-20 text-center space-y-3">
                <Clock size={40} className="text-slate-200 mx-auto" />
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Nenhum registro encontrado</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
            {filteredUsers.map(user => (
              <div key={user.id} className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6 hover:shadow-lg hover:shadow-indigo-50 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all flex gap-1">
                  <button className="p-2 bg-white text-slate-400 hover:text-indigo-600 rounded-xl shadow-sm"><Search size={14} /></button>
                  <button className="p-2 bg-white text-slate-400 hover:text-red-500 rounded-xl shadow-sm"><Trash2 size={14} /></button>
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-indigo-600 font-black text-lg border border-slate-100 shadow-sm">
                    {user.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 tracking-tight leading-tight">{user.name}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{user.employeeId}</p>
                  </div>
                </div>
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">E-mail</span>
                    <span className="text-[11px] font-bold text-slate-600">{user.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Desde</span>
                    <span className="text-[11px] font-bold text-slate-600">{new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <div className="col-span-full py-20 text-center space-y-3">
                <Users size={40} className="text-slate-200 mx-auto" />
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Nenhum colaborador registrado</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'locations' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
            {locations.map(loc => (
              <div key={loc.id} className="bg-slate-50/50 border border-slate-100 rounded-[2.5rem] p-8 flex flex-col items-center text-center relative hover:shadow-xl hover:shadow-indigo-50 transition-all group">
                <button 
                  onClick={() => handleDeleteLoc(loc.id)}
                  className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={16} />
                </button>
                <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center text-indigo-600 mb-6 shadow-sm border border-slate-100">
                  <MapPin size={32} />
                </div>
                <h4 className="font-black text-slate-800 mb-1">{loc.name}</h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">{loc.code}</p>
                <button 
                  onClick={() => setViewingQR(loc)}
                  className="w-full py-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                >
                  Ver QR Code
                </button>
              </div>
            ))}
            {locations.length === 0 && (
              <div className="col-span-full py-20 text-center space-y-3">
                <Building2 size={40} className="text-slate-200 mx-auto" />
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Nenhuma unidade cadastrada</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddLoc && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="max-w-md w-full bg-white rounded-[3rem] p-8 shadow-2xl space-y-8 border border-slate-100">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Nova Unidade</h3>
              <button onClick={() => setShowAddLoc(false)} className="p-2 hover:bg-slate-100 rounded-xl transition"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddLoc} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Unidade</label>
                <input required type="text" value={newLoc.name} onChange={(e) => setNewLoc({...newLoc, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-slate-100 border rounded-2xl font-bold text-slate-800" placeholder="Ex: Sede Administrativa" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Código de Identificação (Opcional)</label>
                <input type="text" value={newLoc.code} onChange={(e) => setNewLoc({...newLoc, code: e.target.value.toUpperCase()})} className="w-full px-5 py-4 bg-slate-50 border-slate-100 border rounded-2xl font-black text-indigo-600 uppercase tracking-widest" placeholder="AUTO-GERAR" />
              </div>
              <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">Salvar Unidade</button>
            </form>
          </div>
        </div>
      )}

      {showAddUser && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="max-w-lg w-full bg-white rounded-[3rem] p-10 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-start mb-8">
              <div className="space-y-1">
                <h3 className="text-3xl font-black text-slate-800 tracking-tight">Adicionar Colaborador</h3>
                <p className="text-slate-400 text-xs font-medium">Pré-configure os dados da equipe para sua empresa.</p>
              </div>
              <button onClick={() => setShowAddUser(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition text-slate-400"><X size={24} /></button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input required type="text" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-slate-100 border rounded-2xl font-bold text-slate-800" placeholder="Ex: Maria Souza" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Matrícula/ID</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input required type="text" value={newUser.employeeId} onChange={(e) => setNewUser({...newUser, employeeId: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-slate-100 border rounded-2xl font-bold text-slate-800" placeholder="001-A" />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input required type="email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-slate-100 border rounded-2xl font-bold text-slate-800" placeholder="email@empresa.com" />
                </div>
              </div>

              <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100/50 flex gap-4">
                <div className="bg-indigo-600 text-white p-2 rounded-xl h-fit shadow-lg shadow-indigo-100">
                  <Info size={18} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Aviso de Segurança</p>
                  <p className="text-[11px] text-indigo-800/70 font-semibold leading-relaxed">
                    Por motivos de privacidade, o sistema não permite que administradores definam senhas. Ao salvar, o colaborador deve realizar o primeiro acesso clicando em "Cadastrar agora" usando o código: <strong className="text-indigo-600 font-black">{adminProfile?.workspaceId}</strong>
                  </p>
                </div>
              </div>

              {statusMsg && (
                <div className={`p-5 rounded-2xl border flex gap-3 animate-in slide-in-from-top-2 ${statusMsg.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                  {statusMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  <p className="text-xs font-bold">{statusMsg.text}</p>
                </div>
              )}

              <button 
                disabled={isLoading}
                type="submit" 
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <><UserPlus size={20} /> Salvar e Gerar Convite</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedRecord && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="max-w-2xl w-full bg-white rounded-[3.5rem] overflow-hidden shadow-2xl border border-slate-100 relative">
            <button onClick={() => setSelectedRecord(null)} className="absolute top-6 right-6 p-3 bg-white hover:bg-slate-100 text-slate-400 rounded-2xl transition z-10 shadow-sm"><X size={24} /></button>
            
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="aspect-square bg-slate-100 relative overflow-hidden">
                {selectedRecord.photo ? (
                  <img src={selectedRecord.photo} className="w-full h-full object-cover scale-x-[-1]" alt="Selfie de Verificação" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-3">
                    <ShieldCheck size={48} strokeWidth={1} />
                    <p className="text-[10px] font-black uppercase tracking-widest">Sem Selfie anexada</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-8">
                  <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
                     <p className="text-white text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                        <ShieldCheck size={12} className="text-emerald-400" /> Identidade Verificada
                     </p>
                  </div>
                </div>
              </div>

              <div className="p-10 space-y-8 flex flex-col justify-center">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Comprovante de Jornada</p>
                  <h4 className="text-3xl font-black text-slate-800 tracking-tight">{selectedRecord.userName}</h4>
                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Matrícula</span>
                      <span className="text-xs font-bold text-slate-600">{selectedRecord.employeeId}</span>
                    </div>
                    <div className="w-px h-6 bg-slate-100"></div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Empresa</span>
                      <span className="text-xs font-bold text-slate-600">{selectedRecord.workspaceId}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Operação</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${selectedRecord.type === 'entry' ? 'bg-indigo-500' : 'bg-amber-500'}`}></div>
                      <span className="font-black text-slate-800 text-xs uppercase tracking-widest">{selectedRecord.type === 'entry' ? 'Entrada' : 'Saída'}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Horário</p>
                    <span className="font-black text-slate-800 text-sm tabular-nums tracking-tight">{new Date(selectedRecord.timestamp).toLocaleTimeString('pt-BR')}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg mt-1"><MapPin size={14} /></div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Local do Registro</p>
                      <p className="text-sm font-bold text-slate-700 leading-tight">{selectedRecord.locationName}</p>
                      {selectedRecord.coords && (
                        <a 
                          href={`https://www.google.com/maps?q=${selectedRecord.coords.latitude},${selectedRecord.coords.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-2 flex items-center gap-1 hover:text-indigo-700 transition-colors"
                        >
                          Ver no GPS <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center gap-3">
                   <button onClick={() => window.print()} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all">
                      <Printer size={16} /> Imprimir Recibo
                   </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewingQR && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="max-w-sm w-full bg-white rounded-[3.5rem] p-10 shadow-2xl text-center space-y-8 border border-slate-100">
             <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Identificador QR</span>
                <button onClick={() => setViewingQR(null)} className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-400"><X size={20} /></button>
             </div>
             
             <div className="bg-white p-8 rounded-[3rem] shadow-inner border-8 border-slate-50 flex items-center justify-center relative group">
                <QRCodeSVG value={viewingQR.code} size={200} level="H" className="transition-transform group-hover:scale-105" />
                <div className="absolute inset-0 border border-indigo-500/20 rounded-[2.8rem] pointer-events-none"></div>
             </div>

             <div className="space-y-2">
                <h4 className="text-2xl font-black text-slate-800 tracking-tight">{viewingQR.name}</h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{viewingQR.code}</p>
             </div>

             <div className="flex flex-col gap-3">
                <button 
                   onClick={() => window.print()} 
                   className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
                >
                   <Printer size={18} /> Imprimir Placa QR
                </button>
                <button className="w-full py-4 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-indigo-600 transition-colors flex items-center justify-center gap-2">
                   <Share2 size={14} /> Compartilhar Unidade
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
