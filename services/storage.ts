
import { createClient } from '@supabase/supabase-js';
import { User, TimeRecord, Location, PunchType } from '../types';

export const SETUP_SQL = `-- RESET TOTAL E CRIAÇÃO
DROP TABLE IF EXISTS public.time_records;
DROP TABLE IF EXISTS public.locations;
DROP TABLE IF EXISTS public.profiles;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  employee_id TEXT,
  role TEXT DEFAULT 'employee',
  workspace_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  workspace_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.time_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT,
  employee_id TEXT,
  workspace_id TEXT NOT NULL,
  type TEXT,
  timestamp BIGINT NOT NULL,
  location_code TEXT,
  location_name TEXT,
  photo TEXT,
  coords_lat DOUBLE PRECISION,
  coords_lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow All" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON public.locations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON public.time_records FOR ALL USING (true) WITH CHECK (true);`;

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
    if (error && isTableMissingError(error)) throw new Error("DB_NOT_READY");
  },

  getLocations: async (workspaceId: string): Promise<Location[]> => {
    const { data, error } = await supabase.from('locations').select('*').eq('workspace_id', workspaceId);
    if (error && isTableMissingError(error)) throw new Error("DB_NOT_READY");
    return (data || []) as Location[];
  },
  
  saveLocation: async (loc: Location) => {
    const { error } = await supabase.from('locations').insert({ 
      name: loc.name, 
      code: loc.code,
      workspace_id: loc.workspaceId
    });
    if (error && isTableMissingError(error)) throw new Error("DB_NOT_READY");
  },

  deleteLocation: async (id: string) => {
    await supabase.from('locations').delete().eq('id', id);
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
      coords: r.coords_lat ? { latitude: r.coords_lat, longitude: r.coords_lng } : undefined
    })) as TimeRecord[];
  },
  
  addRecord: async (record: TimeRecord) => {
    const { error } = await supabase.from('time_records').insert({
      user_id: record.userId,
      user_name: record.userName,
      employee_id: record.employeeId,
      workspace_id: record.workspaceId,
      type: record.type,
      timestamp: record.timestamp,
      location_code: record.locationCode,
      location_name: record.locationName,
      photo: record.photo,
      coords_lat: record.coords?.latitude,
      coords_lng: record.coords?.longitude
    });
    if (error && isTableMissingError(error)) throw new Error("DB_NOT_READY");
  },

  getLastRecord: async (workspaceId: string, userId: string): Promise<TimeRecord | undefined> => {
    const records = await StorageService.getRecords(workspaceId, userId);
    return records[0];
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
    link.download = `ponto_export_${Date.now()}.csv`;
    link.click();
  }
};
