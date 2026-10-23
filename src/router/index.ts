// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import authService from '@/services/authService';

import DashboardView from '@/views/DashboardView.vue';
import LoginView from '@/views/LoginView.vue';
import WorkersListView from '@/views/WorkersListView.vue';
import RegisterWorkerView from '@/views/RegisterWorkerView.vue';
import EditWorkerView from '@/views/EditWorkerView.vue';
import WorkerDetailView from '@/views/WorkerDetailView.vue';
import TicketsView from '@/views/TicketsView.vue';
import TicketDetailView from '@/views/TicketDetailView.vue';
import MyTicketsView from '@/views/MyTicketsView.vue';
import SedesView from '@/views/SedesView.vue';
import AreasView from '@/views/AreasView.vue';
import UsersView from '@/views/UsersView.vue';
import RegimenesView from '@/views/RegimenesView.vue';
import RedirectView from '@/views/RedirectView.vue';

const routes: Array<RouteRecordRaw> = [
  { path: '/', redirect: '/dashboard' },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { public: true, requiresGuest: true }
  },
  {
    path: '/redirect',
    name: 'Redirect',
    component: RedirectView,
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }
  },

  // ==================== WORKERS ====================
  {
    path: '/workers',
    name: 'WorkersList',
    component: WorkersListView,
    meta: { requiresAuth: true, roles: ['admin', 'encargado', 'rrhh'] }
  },
  {
    path: '/workers/new',
    name: 'RegisterWorker',
    component: RegisterWorkerView,
    meta: { requiresAuth: true, roles: ['admin', 'rrhh'] }
  },
  {
    path: '/workers/:id/edit',
    name: 'EditWorker',
    component: EditWorkerView,
    meta: { requiresAuth: true, roles: ['admin', 'rrhh'] },
    props: true
  },
  {
    path: '/workers/:id',
    name: 'WorkerDetail',
    component: WorkerDetailView,
    meta: { requiresAuth: true, roles: ['admin', 'encargado', 'rrhh'] },
    props: true
  },

  // ==================== TICKETS ====================
  {
    path: '/tickets',
    name: 'Tickets',
    component: TicketsView,
    meta: { requiresAuth: true, roles: ['admin', 'encargado'] }
  },
  {
    path: '/tickets/:id',
    name: 'TicketDetail',
    component: TicketDetailView,
    meta: { requiresAuth: true, roles: ['admin', 'encargado', 'rrhh', 'area_user'] },
    props: true
  },
  {
    path: '/my-tickets',
    name: 'MyTickets',
    component: MyTicketsView,
    meta: { requiresAuth: true, roles: ['rrhh', 'area_user'] }
  },

  // ==================== ADMIN ====================
  {
    path: '/sedes',
    name: 'Sedes',
    component: SedesView,
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  {
    path: '/areas',
    name: 'Areas',
    component: AreasView,
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  {
    path: '/users',
    name: 'Users',
    component: UsersView,
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  {
    path: '/regimenes',
    name: 'Regimenes',
    component: RegimenesView,
    meta: { requiresAuth: true, roles: ['admin'] }
  },

  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to, _from, next) => {
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getUser();

  if (to.meta.public) {
    if (to.meta.requiresGuest && isAuthenticated) return next('/dashboard');
    return next();
  }

  if (to.meta.requiresAuth && !isAuthenticated) return next('/login');

  if (to.meta.roles && user) {
    const userRole = user.rol;
    const requiredRoles = to.meta.roles as string[];
    if (!requiredRoles.includes(userRole)) {
      alert('No tiene permisos para acceder a esta página');
      return next('/dashboard');
    }
  }

  if (isAuthenticated && !sessionStorage.getItem('token_verified')) {
    const tokenValid = await authService.verifyToken();
    if (!tokenValid) {
      sessionStorage.removeItem('token_verified');
      return next('/login');
    }
    sessionStorage.setItem('token_verified', '1');
  }

  next();
});

export default router;