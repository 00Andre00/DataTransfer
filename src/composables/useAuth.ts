// src/composables/useAuth.ts
import { ref, computed } from 'vue';
import authService from '../services/authService';
import type { User } from '../types';

const isAuthenticated = ref<boolean>(authService.isAuthenticated());
const currentUser = ref<User | null>(authService.getUser());

authService.onAuthChange(() => {
  isAuthenticated.value = authService.isAuthenticated();
  currentUser.value = authService.getUser();
});

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e: StorageEvent) => {
    if (e.key === 'auth_token' || e.key === 'auth_user') {
      isAuthenticated.value = authService.isAuthenticated();
      currentUser.value = authService.getUser();
    }
  });
}

export function useAuth() {
  return {
    isAuthenticated: computed(() => isAuthenticated.value),
    currentUser: computed(() => currentUser.value),

    // ============ ROLES ============
    isAdmin: computed(() => currentUser.value?.rol === 'admin'),
    isEncargado: computed(() => currentUser.value?.rol === 'encargado'),
    isRRHH: computed(() => currentUser.value?.rol === 'rrhh'),
    isAreaUser: computed(() => currentUser.value?.rol === 'area_user'),

    // ============ PERMISOS ============
    /** Puede gestionar personal (crear/editar/eliminar trabajadores) */
    canManageWorkers: computed(() => {
      const rol = currentUser.value?.rol;
      return rol === 'admin' || rol === 'rrhh';
    }),

    /** Puede revisar tickets (aprobar/observar) */
    canReviewTickets: computed(() => {
      const rol = currentUser.value?.rol;
      return rol === 'admin' || rol === 'encargado';
    }),

    /** Puede crear tickets (rrhh y area_user) */
    canCreateTickets: computed(() => {
      const rol = currentUser.value?.rol;
      return rol === 'rrhh' || rol === 'area_user';
    }),

    /** Puede ver todas las sedes (admin y encargado) */
    canViewAllSedes: computed(() => {
      const rol = currentUser.value?.rol;
      return rol === 'admin' || rol === 'encargado';
    }),

    /** Es super admin (gestiona sedes, áreas, usuarios, regímenes) */
    isSuperAdmin: computed(() => currentUser.value?.rol === 'admin'),

    // ============ HELPERS ============
    userSedeId: computed(() => currentUser.value?.sede_id ?? null),
    userSedeNombre: computed(() => currentUser.value?.sede_nombre ?? null),
    userAreaId: computed(() => currentUser.value?.area_id ?? null),
    userAreaNombre: computed(() => currentUser.value?.area_nombre ?? null),

    logout: () => authService.logout(),
  };
}