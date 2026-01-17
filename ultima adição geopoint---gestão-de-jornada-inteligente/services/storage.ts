
import { createClient } from '@supabase/supabase-js';
import { User, TimeRecord, Location, PunchType, EmployeeRequest, WorkSchedule, WorkShift } from '../types';

const supabaseUrl = 'https://ytwmspnmjlflzsxlpftd.supabase.co';
const supabaseKey = 'sb_publishable_mzaDAXN1gLVl3Di5iK1_cQ_7FJhxjOI';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export const StorageService = {
  getProfile: async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error || !data) return null;

      return {
        id: data.id,
        name: data.name || 'Usuário',
        email: data.email,
        role: (data.role as any) || 'employee',
        employeeId: data.employee_id || 'N/A',
        workspaceId: data.workspace_id || 'PENDENTE',
        createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
        isPremium: data.is_premium || false,
        scheduleId: data.schedule_id
      } as User;
    } catch (err) { 
      return null; 
    }
  },

  getRecords: async (workspaceId: string, userId?: string): Promise<TimeRecord[]> => {
    try {
      if (!workspaceId || workspaceId === 'PENDENTE') return [];
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
      })) as TimeRecord[];
    } catch (err) { return []; }
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
      photo: record.photo,
      coords_lat: record.coords?.latitude,
      coords_lng: record.coords?.longitude
    };
    const { error } = await supabase.from('time_records').insert(payload);
    if (error) throw error;
  },

  getUsers: async (workspaceId: string): Promise<User[]> => {
    try {
      if (!workspaceId || workspaceId === 'PENDENTE') return [];
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
        isPremium: u.is_premium || false,
        scheduleId: u.schedule_id
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
      is_premium: true,
      schedule_id: user.scheduleId
    });
    if (error) throw error;
  },

  deleteUser: async (userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ workspace_id: 'REMOVIDO', role: 'employee' })
      .eq('id', userId);
    if (error) throw error;
  },

  getLocations: async (workspaceId: string): Promise<Location[]> => {
    try {
      if (!workspaceId || workspaceId === 'PENDENTE') return [];
      const { data, error } = await supabase.from('locations').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false });
      if (error) return [];
      return (data || []).map(l => ({
        id: l.id,
        name: l.name,
        address: l.address,
        code: l.code,
        workspaceId: l.workspace_id,
        latitude: l.latitude,
        longitude: l.longitude
      })) as Location[];
    } catch (e) { return []; }
  },

  updateLocation: async (location: Location) => {
    const { error } = await supabase
      .from('locations')
      .update({
        name: location.name,
        address: location.address,
        latitude: location.latitude,
        longitude: location.longitude
      })
      .eq('id', location.id);
    if (error) throw error;
  },

  deleteLocation: async (id: string) => {
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  getAdminRequests: async (workspaceId: string): Promise<EmployeeRequest[]> => {
    try {
      if (!workspaceId || workspaceId === 'PENDENTE') return [];
      const { data, error } = await supabase
        .from('employee_requests')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(r => ({
        id: r.id,
        user_id: r.user_id,
        user_name: r.user_name,
        workspace_id: r.workspace_id,
        type: r.type,
        date: r.date,
        description: r.description,
        attachment: r.attachment,
        status: r.status,
        created_at: new Date(r.created_at).getTime()
      })) as EmployeeRequest[];
    } catch (e) { 
      console.error("Storage Error:", e);
      throw e; 
    }
  },

  getUserRequests: async (userId: string): Promise<EmployeeRequest[]> => {
    try {
      const { data, error } = await supabase
        .from('employee_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) return [];
      return (data || []).map(r => ({
        id: r.id,
        user_id: r.user_id,
        user_name: r.user_name,
        workspace_id: r.workspace_id,
        type: r.type,
        date: r.date,
        description: r.description,
        attachment: r.attachment,
        status: r.status,
        created_at: new Date(r.created_at).getTime()
      })) as any;
    } catch (e) { return []; }
  },

  uploadDocument: async (userId: string, file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      const filePath = `requests/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (err) {
      console.error("Upload Error:", err);
      throw err;
    }
  },

  submitRequest: async (request: any) => {
    const { error } = await supabase.from('employee_requests').insert({
      user_id: request.user_id,
      user_name: request.user_name,
      workspace_id: request.workspace_id,
      type: request.type,
      date: request.date,
      description: request.description,
      attachment: request.attachment,
      status: 'pending'
    });
    if (error) throw error;
  },

  updateRequestStatus: async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase.from('employee_requests').update({ status }).eq('id', id);
    if (error) throw error;
  },

  // Novos métodos para Escalas e Jornadas
  getShifts: async (workspaceId: string): Promise<WorkShift[]> => {
    const { data, error } = await supabase.from('work_shifts').select('*').eq('workspace_id', workspaceId);
    if (error) return [];
    return data.map(s => ({
       id: s.id,
       name: s.name,
       startTime: s.start_time,
       endTime: s.end_time,
       breakMinutes: s.break_minutes
    }));
  },

  saveShift: async (workspaceId: string, shift: Partial<WorkShift>) => {
    const { error } = await supabase.from('work_shifts').upsert({
      id: shift.id,
      name: shift.name,
      start_time: shift.startTime,
      end_time: shift.endTime,
      break_minutes: shift.breakMinutes,
      workspace_id: workspaceId
    });
    if (error) throw error;
  },

  getSchedules: async (workspaceId: string): Promise<WorkSchedule[]> => {
    const { data, error } = await supabase.from('work_schedules').select('*').eq('workspace_id', workspaceId);
    if (error) return [];
    return data.map(s => ({
      id: s.id,
      name: s.name,
      type: s.type,
      workspaceId: s.workspace_id,
      mondayShiftId: s.monday_shift_id,
      tuesdayShiftId: s.tuesday_shift_id,
      wednesdayShiftId: s.wednesday_shift_id,
      thursdayShiftId: s.thursday_shift_id,
      fridayShiftId: s.friday_shift_id,
      saturdayShiftId: s.saturday_shift_id,
      sundayShiftId: s.sunday_shift_id
    }));
  },

  saveSchedule: async (schedule: WorkSchedule) => {
    const { error } = await supabase.from('work_schedules').upsert({
      id: schedule.id,
      name: schedule.name,
      type: schedule.type,
      workspace_id: schedule.workspaceId,
      monday_shift_id: schedule.mondayShiftId,
      tuesday_shift_id: schedule.tuesdayShiftId,
      wednesday_shift_id: schedule.wednesdayShiftId,
      thursday_shift_id: schedule.thursdayShiftId,
      friday_shift_id: schedule.fridayShiftId,
      saturday_shift_id: schedule.saturdayShiftId,
      sunday_shift_id: schedule.sundayShiftId
    });
    if (error) throw error;
  },

  deleteSchedule: async (id: string) => {
    const { error } = await supabase.from('work_schedules').delete().eq('id', id);
    if (error) throw error;
  }
};
