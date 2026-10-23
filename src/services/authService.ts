// src/services/authService.ts
import axios from 'axios';
import type { LoginResponse, User } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

class AuthService {
  private tokenKey = 'auth_token';
  private userKey = 'auth_user';
  private listeners: Set<() => void> = new Set();

  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username,
        password
      });

      const { token, user } = response.data;

      this.setToken(token);
      this.setUser(user);
      sessionStorage.setItem('token_verified', '1');
      this.notifyListeners();

      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Error al iniciar sesión');
    }
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    sessionStorage.removeItem('token_verified');
    this.notifyListeners();
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUser(): User | null {
    const userStr = localStorage.getItem(this.userKey);
    return userStr ? JSON.parse(userStr) : null;
  }

  // ==================== ROLES ====================
  isAdmin(): boolean {
    return this.getUser()?.rol === 'admin';
  }

  isEncargado(): boolean {
    return this.getUser()?.rol === 'encargado';
  }

  isRRHH(): boolean {
    return this.getUser()?.rol === 'rrhh';
  }

  isAreaUser(): boolean {
    return this.getUser()?.rol === 'area_user';
  }

  // ==================== PERMISOS ====================
  /** Puede gestionar personal (crear/editar/eliminar trabajadores) */
  canManageWorkers(): boolean {
    const rol = this.getUser()?.rol;
    return rol === 'admin' || rol === 'rrhh';
  }

  /** Puede revisar tickets (aprobar/observar) */
  canReviewTickets(): boolean {
    const rol = this.getUser()?.rol;
    return rol === 'admin' || rol === 'encargado';
  }

  /** Puede crear tickets (rrhh y area_user) */
  canCreateTickets(): boolean {
    const rol = this.getUser()?.rol;
    return rol === 'rrhh' || rol === 'area_user';
  }

  /** Puede ver todas las sedes (admin y encargado) */
  canViewAllSedes(): boolean {
    const rol = this.getUser()?.rol;
    return rol === 'admin' || rol === 'encargado';
  }

  /** Es super admin (gestiona sedes, áreas, usuarios, regímenes) */
  isSuperAdmin(): boolean {
    return this.getUser()?.rol === 'admin';
  }

  getUserSedeId(): string | null {
    return this.getUser()?.sede_id ?? null;
  }

  getUserAreaId(): number | null {
    return this.getUser()?.area_id ?? null;
  }

  // ==================== TOKEN VERIFY ====================
  async verifyToken(): Promise<boolean> {
    try {
      const token = this.getToken();
      if (!token) return false;

      await axios.get(`${API_BASE_URL}/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      return true;
    } catch (error) {
      this.logout();
      return false;
    }
  }

  // ==================== LISTENERS ====================
  onAuthChange(callback: () => void): void {
    this.listeners.add(callback);
  }

  offAuthChange(callback: () => void): void {
    this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback());
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  private setUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  init(): void {}
}

export default new AuthService();