// Authentication types
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  date_joined: string;
  last_login: string | null;
  is_active: boolean;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
  organization?: Organization;
  organizations?: OrganizationMembership[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
}

// Organization types
export interface Organization {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
  project_count?: number;
  user_role?: 'admin' | 'member' | 'viewer';
}

export interface OrganizationMembership {
  id: number;
  name: string;
  role: 'admin' | 'member' | 'viewer';
}

// Project types
export interface Project {
  id: number;
  name: string;
  description?: string;
  organization: number;
  organization_name: string;
  created_at: string;
  updated_at: string;
  created_by_name: string;
  environment_count: number;
}

// Environment types
export interface Environment {
  id: number;
  name: string;
  project: number;
  project_name: string;
  environment_type: 'development' | 'staging' | 'production';
  description?: string;
  created_at: string;
  updated_at: string;
  created_by_name: string;
  variable_count: number;
}

// Variable types
export interface Variable {
  id: number;
  key: string;
  decrypted_value: string;
  environment: number;
  environment_name: string;
  created_at: string;
  updated_at: string;
  created_by_name: string;
  is_secret?: boolean;
  description?: string;
}

// API Response types
export interface ApiResponse<T> {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
  data?: T;
}

export interface ApiError {
  error?: string;
  detail?: string;
  details?: Record<string, string[]>;
}

// Audit Log types
export interface AuditLog {
  id: number;
  user_name: string;
  user_email: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, any>;
  ip_address: string;
  created_at: string;
}