
export type UserRole = 'admin' | 'employee';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  employeeId: string;
  workspaceId: string;
  createdAt: number;
  isPremium?: boolean;
  planType?: string;
  premiumUntil?: number;
  scheduleId?: string; // ID da escala vinculada
}

export type PunchType = 'entry' | 'exit';

export interface TimeRecord {
  id: string;
  userId: string;
  userName: string;
  employeeId: string;
  workspaceId: string;
  type: PunchType;
  timestamp: number;
  locationCode: string;
  locationName: string;
  photo?: string;
  coords?: {
    latitude: number;
    longitude: number;
  };
}

export interface Location {
  id: string;
  name: string;
  address?: string;
  document?: string;
  code: string;
  workspaceId: string;
  latitude?: number;
  longitude?: number;
}

export interface EmployeeRequest {
  id: string;
  user_id: string;
  user_name: string;
  workspace_id: string;
  type: string;
  date: string;
  description: string;
  attachment?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: number;
}

// Novos tipos para Escalas
export interface WorkShift {
  id: string;
  name: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  breakMinutes: number;
}

export interface WorkSchedule {
  id: string;
  name: string;
  type: 'standard' | '12x36' | 'flexible';
  workspaceId: string;
  mondayShiftId?: string;
  tuesdayShiftId?: string;
  wednesdayShiftId?: string;
  thursdayShiftId?: string;
  fridayShiftId?: string;
  saturdayShiftId?: string;
  sundayShiftId?: string;
}

export interface AuthState {
  user: null | User;
  isAuthenticated: boolean;
  loading: boolean;
}
