// src/services/workers.ts
import api from './api';
import type {
  ApiResponse,
  Worker,
  WorkerForm,
  WorkerSedeHistory,
  Sede,
  Area,
  Regimen,
  Ticket,
  User
} from '@/types';

// ==================== WORKERS ====================
export const workerService = {
  getAll: (params?: { sede_id?: string }): Promise<ApiResponse<Worker[]>> =>
    api.get('/workers', { params }),

  getById: (id: number): Promise<ApiResponse<Worker>> =>
    api.get(`/workers/${id}`),

  create: (data: WorkerForm): Promise<ApiResponse<Worker>> =>
    api.post('/workers', data),

  update: (id: number, data: Partial<WorkerForm>): Promise<ApiResponse<Worker>> =>
    api.put(`/workers/${id}`, data),

  delete: (id: number): Promise<ApiResponse<null>> =>
    api.delete(`/workers/${id}`),

  getSedeHistory: (workerId: number): Promise<ApiResponse<WorkerSedeHistory[]>> =>
    api.get(`/workers/${workerId}/sede-history`),

  changeSede: (
    workerId: number,
    data: { sede_id: string; motivo_cambio?: string }
  ): Promise<ApiResponse<Worker>> =>
    api.post(`/workers/${workerId}/change-sede`, data),
};

// ==================== SEDES ====================
export const sedeService = {
  getAll: (): Promise<ApiResponse<Sede[]>> => api.get('/sedes'),
  getById: (id: string): Promise<ApiResponse<Sede>> => api.get(`/sedes/${id}`),
  create: (data: Partial<Sede>): Promise<ApiResponse<Sede>> => api.post('/sedes', data),
  update: (id: string, data: Partial<Sede>): Promise<ApiResponse<Sede>> => api.put(`/sedes/${id}`, data),
  checkDelete: (id: string): Promise<ApiResponse<any>> => api.get(`/sedes/${id}/check-delete`),
  delete: (id: string): Promise<ApiResponse<null>> => api.delete(`/sedes/${id}`),
};

// ==================== ÁREAS ====================
export const areaService = {
  getAll: (params?: { sede_id?: string }): Promise<ApiResponse<Area[]>> =>
    api.get('/areas', { params }),
  getById: (id: number): Promise<ApiResponse<Area>> => api.get(`/areas/${id}`),
  create: (data: Partial<Area>): Promise<ApiResponse<Area>> => api.post('/areas', data),
  update: (id: number, data: Partial<Area>): Promise<ApiResponse<Area>> => api.put(`/areas/${id}`, data),
  checkDelete: (id: number): Promise<ApiResponse<any>> => api.get(`/areas/${id}/check-delete`),
  delete: (id: number): Promise<ApiResponse<null>> => api.delete(`/areas/${id}`),
};

// ==================== REGÍMENES ====================
export const regimenService = {
  getAll: (): Promise<ApiResponse<Regimen[]>> => api.get('/regimenes'),
  getByCodigo: (codigo: string): Promise<ApiResponse<Regimen>> => api.get(`/regimenes/${codigo}`),
  create: (data: Partial<Regimen>): Promise<ApiResponse<Regimen>> => api.post('/regimenes', data),
  update: (codigo: string, data: Partial<Regimen>): Promise<ApiResponse<Regimen>> =>
    api.put(`/regimenes/${codigo}`, data),
  rename: (codigo: string, newCodigo: string): Promise<ApiResponse<Regimen>> =>
    api.patch(`/regimenes/${codigo}/rename`, { newCodigo }),
  checkDelete: (codigo: string): Promise<ApiResponse<any>> =>
    api.get(`/regimenes/${codigo}/check-delete`),
  delete: (codigo: string): Promise<ApiResponse<null>> => api.delete(`/regimenes/${codigo}`),
};

// ==================== TICKETS ====================
export const ticketService = {
  getAll: (params?: { sede_id?: string; area_id?: number; estado?: string }): Promise<ApiResponse<Ticket[]>> =>
    api.get('/tickets', { params }),

  getById: (id: number): Promise<ApiResponse<Ticket>> => api.get(`/tickets/${id}`),

  create: (form: FormData): Promise<ApiResponse<Ticket>> =>
    api.post('/tickets', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  reenviar: (id: number, form: FormData): Promise<ApiResponse<Ticket>> =>
    api.patch(`/tickets/${id}/reenviar`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  completar: (id: number): Promise<ApiResponse<Ticket>> =>
    api.patch(`/tickets/${id}/completar`),

  observar: (id: number, observacion: string): Promise<ApiResponse<Ticket>> =>
    api.patch(`/tickets/${id}/observar`, { observacion }),

  delete: (id: number): Promise<ApiResponse<null>> => api.delete(`/tickets/${id}`),

  getPdfUrl: (id: number): string =>
    `${import.meta.env.VITE_API_BASE_URL}/tickets/${id}/pdf`,
};

// ==================== USUARIOS (admin) ====================
export const userService = {
  getAll: (): Promise<ApiResponse<User[]>> => api.get('/users'),
  getById: (id: number): Promise<ApiResponse<User>> => api.get(`/users/${id}`),
  create: (data: Partial<User> & { password: string }): Promise<ApiResponse<User>> =>
    api.post('/users', data),
  update: (id: number, data: Partial<User> & { password?: string }): Promise<ApiResponse<User>> =>
    api.put(`/users/${id}`, data),
  delete: (id: number): Promise<ApiResponse<null>> => api.delete(`/users/${id}`),
};