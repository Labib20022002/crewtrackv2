export type UserRole = 'admin' | 'viewer';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: any;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  salary: number;
  hireDate: any; // Timestamp
  status: 'active' | 'on-leave' | 'terminated';
  photoUrl?: string;
  bio?: string;
  createdAt: any;
  updatedAt: any;
}

export type EmployeeInput = Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>;

export interface ActivityLog {
  id: string;
  actionType: 'CREATE' | 'UPDATE' | 'DELETE';
  entityId: string;
  entityType: string;
  description: string;
  userId: string;
  userName: string;
  timestamp: any;
  details?: any;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}
