
import { createClient } from '@supabase/supabase-js';
import { User, TimeRecord, Location, PunchType } from '../types';

const supabaseUrl = 'https://ytwmspnmjlflzsxlpftd.supabase.co';
const supabaseKey = 'sb_publishable_mzaDAXN1gLVl3Di5iK1_cQ_7FJhxjOI';

export const supabase = createClient(supabaseUrl, supabaseKey);

const isTableMissingError = (error: any) => {
  return error?.message?.includes('schema cache') || 
         error?.message?.includes('does not exist') || 
         error?.code === '42P01' ||
         error?.message?.includes('column "workspace_id" does not exist');
};

export const StorageService = {
  getProfile: async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (error) {
        if (isTableMissingError(error)) throw new Error("DB_NOT_READY");
        return null;
      }
      if (!data) return null;
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role as any,
        employeeId: data.employee_id || '',
        workspaceId: data.workspace_id,
        createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now()
      } as User;
    } catch (err: any) {
      if (err.message === "DB_NOT_READY") throw err;
      return null;
    }
  },

  getUsers: async (workspaceId: string): Promise<User[]> => {
    const { data, error } = await supabase.from('profiles').select('*').eq('workspace_id', workspaceId);
    if (error && isTableMissingError(error)) throw new Error("DB_NOT_READY");
    return (data || []).map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      employeeId: u.employee_id,
      workspaceId: u.workspace_id,
      createdAt: u.created_at ? new Date(u.created_at).getTime() : Date.now()
    })) as User[];
  },

  saveUser: async (user: User) => {
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      employee_id: user.employeeId,
      workspace_id: user.workspaceId
    });
    if (error) {
      if (isTableMissingError(error)) throw new Error("DB_NOT_READY");
      throw error;
    }
  },

  deleteUser: async (id: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) throw error;
  },

  getLocations: async (workspaceId: string): Promise<Location[]> => {
    const { data, error } = await supabase.from('locations').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false });
    if (error && isTableMissingError(error)) throw new Error("DB_NOT_READY");
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
  },
  
  saveLocation: async (loc: Omit<Location, 'id'>) => {
    const payload: any = {
      name: loc.name,
      code: loc.code,
      workspace_id: loc.workspaceId,
      address: loc.address,
      document: loc.document,
      latitude: loc.latitude,
      longitude: loc.longitude
    };

    const { error } = await supabase.from('locations').insert(payload);
    
    if (error) {
      console.error("Erro ao salvar localização:", error);
      throw error; 
    }
  },

  deleteLocation: async (id: string) => {
    const { error, count } = await supabase.from('locations').delete({ count: 'exact' }).eq('id', id);
    if (error) throw error;
    if (count === 0 || count === null) throw new Error("DELETE_FAILED_NO_ROWS");
  },

  getRecords: async (workspaceId: string, userId?: string): Promise<TimeRecord[]> => {
    let query = supabase.from('time_records').select('*').eq('workspace_id', workspaceId).order('timestamp', { ascending: false });
    if (userId) query = query.eq('user_id', userId);
    
    const { data, error } = await query;
    if (error && isTableMissingError(error)) throw new Error("DB_NOT_READY");
    
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
    })) as TimeRecord[];
  },

  getLastRecord: async (workspaceId: string, userId: string): Promise<TimeRecord | null> => {
    const records = await StorageService.getRecords(workspaceId, userId);
    return records.length > 0 ? records[0] : null;
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

    if (error) {
      if (isTableMissingError(error)) throw new Error("DB_NOT_READY");
      throw error;
    }
  },

  exportToCSV: (records: TimeRecord[]) => {
    const headers = ['Nome', 'Matrícula', 'Tipo', 'Data', 'Hora', 'Local', 'Latitude', 'Longitude'];
    const rows = records.map(r => {
      const date = new Date(r.timestamp);
      return [
          r.userName, 
          r.employeeId, 
          r.type === 'entry' ? 'Entrada' : 'Saída', 
          date.toLocaleDateString(), 
          date.toLocaleTimeString(), 
          r.locationName,
          r.coords?.latitude || '',
          r.coords?.longitude || ''
      ];
    });
    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `ponto_export_${Date.now()}.csv`;
    link.click();
  }
};
