import { createClient } from '@supabase/supabase-js';
import { User, TimeRecord, Location, PunchType, EmployeeRequest } from '../types';

const supabaseUrl = 'https://ytwmspnmjlflzsxlpftd.supabase.co';
const supabaseKey = 'sb_publishable_mzaDAXN1gLVl3Di5iK1_cQ_7FJhxjOI';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  }
});

export const StorageService = {
  getProfile: async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (error || !data) return null;
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role as any,
        employeeId: data.employee_id || '',
        workspaceId: data.workspace_id,
        createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
        isPremium: data.is_premium || false
      } as User;
    } catch (err) { return null; }
  },

  getRecords: async (workspaceId: string, userId?: string): Promise<TimeRecord[]> => {
    try {
      let query = supabase.from('time_records').select('*').eq('workspace_id', workspaceId).order('timestamp', { ascending: false });
      if (userId) query = query.eq('user_id', userId);
      const { data, error } = await query;
      if (error) return [];
      return (data || []).map(r => ({
        id: r.id,
        userId: r.user_id,
        userName: r.user_name,
        employeeId: r.employee_id,
        workspaceId: r.workspace_id,
        type: r.type,
        timestamp: Number(r.timestamp),
        locationCode: r.location_code,
        locationName: r.location_name,
        photo: r.photo,
        coords: (r.coords_lat && r.coords_lng) ? { latitude: r.coords_lat, longitude: r.coords_lng } : undefined
      })) as any[];
    } catch (err) { return []; }
  },

  addRecord: async (record: TimeRecord) => {
    const payload: any = {
      user_id: record.userId,
      user_name: record.userName,
      employee_id: record.employeeId,
      workspace_id: record.workspaceId,
      type: record.type,
      timestamp: record.timestamp,
      location_code: record.locationCode,
      location_name: record.locationName,
      photo: record.photo
    };
    if (record.coords) {
        payload.coords_lat = record.coords.latitude;
        payload.coords_lng = record.coords.longitude;
    }
    const { error } = await supabase.from('time_records').insert(payload);
    if (error) throw error;
  },

  getLastRecord: async (workspaceId: string, userId: string): Promise<TimeRecord | null> => {
    try {
      const { data, error } = await supabase.from('time_records').select('*').eq('workspace_id', workspaceId).eq('user_id', userId).order('timestamp', { ascending: false }).limit(1).maybeSingle();
      if (error || !data) return null;
      return { type: data.type, timestamp: Number(data.timestamp) } as any;
    } catch (e) { return null; }
  },

  getUsers: async (workspaceId: string): Promise<User[]> => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('workspace_id', workspaceId);
      if (error) return [];
      return (data || []).map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        employeeId: u.employee_id,
        workspaceId: u.workspace_id,
        createdAt: u.created_at ? new Date(u.created_at).getTime() : Date.now(),
        isPremium: u.is_premium || false
      })) as User[];
    } catch (e) { return []; }
  },

  saveUser: async (user: User) => {
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      employee_id: user.employeeId,
      workspace_id: user.workspaceId,
      is_premium: true
    });
    if (error) throw error;
  },

  deleteUser: async (id: string) => {
    await supabase.from('profiles').delete().eq('id', id);
  },

  getLocations: async (workspaceId: string): Promise<Location[]> => {
    try {
      const { data, error } = await supabase.from('locations').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false });
      if (error) return [];
      return (data || []).map(l => ({
        id: l.id,
        name: l.name,
        address: l.address,
        document: l.document,
        code: l.code,
        workspaceId: l.workspace_id,
        latitude: l.latitude,
        longitude: l.longitude
      })) as Location[];
    } catch (e) { return []; }
  },
  
  saveLocation: async (loc: Omit<Location, 'id'>) => {
    const { error } = await supabase.from('locations').insert({
      name: loc.name,
      code: loc.code,
      workspace_id: loc.workspaceId,
      address: loc.address,
      document: loc.document,
      latitude: loc.latitude,
      longitude: loc.longitude
    });
    if (error) throw error; 
  },

  updateLocation: async (id: string, loc: Partial<Location>) => {
    const { error } = await supabase.from('locations').update({
      name: loc.name,
      address: loc.address,
      document: loc.document,
      latitude: loc.latitude,
      longitude: loc.longitude
    }).eq('id', id);
    if (error) throw error;
  },

  deleteLocation: async (id: string) => {
    await supabase.from('locations').delete().eq('id', id);
  },

  getUserRequests: async (userId: string): Promise<EmployeeRequest[]> => {
    try {
      const { data, error } = await supabase.from('employee_requests').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (error) return [];
      return (data || []).map(r => ({ ...r, created_at: new Date(r.created_at).getTime() })) as any;
    } catch (e) { return []; }
  },

  getAdminRequests: async (workspaceId: string): Promise<EmployeeRequest[]> => {
    try {
      const { data, error } = await supabase.from('employee_requests').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false });
      if (error) return [];
      return (data || []).map(r => ({ ...r, created_at: new Date(r.created_at).getTime() })) as any;
    } catch (e) { return []; }
  },

  uploadDocument: async (userId: string, file: File): Promise<string> => {
    const fileName = `${userId}/${Date.now()}_${file.name}`;
    await supabase.storage.from('documents').upload(fileName, file);
    const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(fileName);
    return publicUrl;
  },

  submitRequest: async (request: any) => {
    await supabase.from('employee_requests').insert({
      user_id: request.user_id,
      user_name: request.user_name,
      workspace_id: request.workspace_id,
      type: request.type,
      date: request.date,
      description: request.description,
      attachment: request.arquivo_url,
      status: 'pending'
    });
  },

  updateRequestStatus: async (id: string, status: 'approved' | 'rejected') => {
    await supabase.from('employee_requests').update({ status }).eq('id', id);
  },

  exportToCSV: (records: TimeRecord[]) => {
    const headers = ['Nome', 'Matrícula', 'Tipo', 'Data', 'Hora', 'Local'];
    const rows = records.map(r => {
      const date = new Date(r.timestamp);
      return [r.userName, r.employeeId, r.type === 'entry' ? 'Entrada' : 'Saída', date.toLocaleDateString(), date.toLocaleTimeString(), r.locationName];
    });
    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `ponto_${Date.now()}.csv`;
    link.click();
  }
};