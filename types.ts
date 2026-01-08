
export type UserRole = 'admin' | 'employee';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  employeeId: string;
  workspaceId: string; // Vínculo com a empresa
  createdAt: number;
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
  code: string;
  workspaceId: string;
  latitude?: number;
  longitude?: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}
