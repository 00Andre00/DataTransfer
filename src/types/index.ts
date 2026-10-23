// ==================== AUTENTICACIÓN ====================

export type UserRole = 'admin' | 'encargado' | 'rrhh' | 'area_user';

export interface User {
  id: number;
  username: string;
  nombre: string;
  rol: UserRole;
  sede_id?: string | null;
  sede_nombre?: string | null;
  area_id?: number | null;
  area_nombre?: string | null;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// ==================== SEDES ====================

export interface Sede {
  id: string;
  nombre: string;
  codigo?: string;
  direccion?: string;
  activa: boolean;
  created_at?: string;
}

// ==================== ÁREAS ====================

export interface Area {
  id: number;
  sede_id: string;
  sede_nombre?: string;
  nombre: string;
  descripcion?: string;
  activa: boolean;
  created_at?: string;
}

// ==================== REGÍMENES ====================

export interface Regimen {
  codigo: string;
  nombre: string;
  tiene_fecha_salida: boolean;
  descripcion?: string;
  activo: boolean;
  orden: number;
}

// ==================== TRABAJADORES ====================

export type WorkerEstado = 'activo' | 'inactivo';

export interface Worker {
  id: number;
  dni: string;
  nombre_completo: string;
  area_id?: number | null;
  area_nombre?: string | null;      // ← viene del join
  regimen_codigo: string;
  regimen_nombre?: string;
  tiene_fecha_salida?: boolean;
  fecha_ingreso: string;
  fecha_salida?: string | null;
  sede_id: string;
  sede_nombre?: string;
  estado: WorkerEstado;
  created_at?: string;
  updated_at?: string;
}

export interface WorkerForm {
  dni: string;
  nombre_completo: string;
  area_id?: number | null;
  regimen_codigo: string;
  fecha_ingreso: string;
  fecha_salida?: string | null;
  sede_id: string;
  estado: WorkerEstado;
}

// ==================== TICKETS ====================

export type TicketEstado = 'pendiente' | 'observado' | 'completado';

export interface Ticket {
  id: number;
  titulo: string;
  observaciones?: string;
  pdf_path?: string;
  pdf_nombre_original?: string;
  area_id: number;
  area_nombre?: string;
  sede_id: string;
  sede_nombre?: string;
  creado_por: number;
  creado_por_nombre?: string;
  revisado_por?: number | null;
  revisado_por_nombre?: string | null;
  estado: TicketEstado;
  observacion_revision?: string | null;
  fecha_creacion: string;
  fecha_revision?: string | null;
}

export interface TicketForm {
  titulo: string;
  observaciones?: string;
  pdf?: File | null;
}

// ==================== HISTORIAL DE SEDES ====================

export interface WorkerSedeHistory {
  id: number;
  worker_id: number;
  sede_id: string;
  sede_nombre?: string;
  fecha_inicio: string;
  fecha_fin?: string | null;
  motivo_cambio?: string;
  registrado_por?: number;
  created_at?: string;
}

// ==================== API ====================

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ==================== STORES STATE ====================

export interface WorkerState {
  workers: Worker[];
  currentWorker: Worker | null;
  workerHistory: WorkerSedeHistory[];
  loading: boolean;
  error: string | null;
}

// ==================== UI / NAVEGACIÓN ====================

export interface MenuItem {
  title: string;
  path: string;
  icon: string;
  description: string;
  roles: UserRole[];
}