<template>
  <div>
    <!-- Header móvil -->
    <header class="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40 h-16 flex items-center px-4">
      <button @click="openMobileMenu" class="bg-white border border-gray-200 rounded-lg p-2 mr-3">
        <i class="fas fa-bars text-xl"></i>
      </button>
      <img :src="'/gore.png'" alt="GORE" class="h-8 object-contain" />

      <div v-if="isAuthenticated && currentUser" class="ml-auto flex items-center">
        <span class="text-sm text-gray-600 mr-2 hidden sm:block">{{ currentUser.nombre }}</span>
        <span :class="roleBadgeClass" class="text-xs px-2 py-1 rounded-full capitalize">{{ rolLabel }}</span>
      </div>
    </header>

    <!-- Sidebar desktop -->
    <aside v-if="isAuthenticated"
      class="hidden lg:flex w-64 bg-white border-r border-gray-200 flex-shrink-0 fixed left-0 top-0 h-full flex-col">

      <div class="px-4 pt-4 pb-3 border-b border-gray-100">
        <img :src="'/gore.png'" alt="Gobierno Regional Huánuco" class="w-full h-14 object-contain" />
        <p class="text-[10px] text-center text-gray-500 mt-1">Sistema de Transferencia</p>
      </div>

      <div v-if="currentUser" class="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <p class="text-sm font-medium text-gray-800 truncate">{{ currentUser.nombre }}</p>
        <div class="flex items-center gap-2 mt-1 flex-wrap">
          <span :class="roleBadgeClass" class="text-[10px] px-2 py-0.5 rounded-full font-medium">
            {{ rolLabel }}
          </span>
          <span v-if="currentUser.sede_nombre" class="text-[10px] text-gray-500">
            {{ currentUser.sede_nombre }}
          </span>
        </div>
        <p v-if="currentUser.area_nombre" class="text-[10px] text-gray-500 mt-1">
          {{ currentUser.area_nombre }}
        </p>
      </div>

      <nav class="flex-1 overflow-y-auto py-3">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 transition-colors mx-2 rounded-lg text-sm"
          :class="{ 'bg-blue-50 text-blue-600 font-medium': isActive(item.path) }"
        >
          <i :class="item.icon" class="mr-3 text-base w-5 text-center"></i>
          {{ item.title }}
        </router-link>
      </nav>

      <div v-if="canSwitchSede" class="border-t border-gray-200 px-3 py-3 bg-gray-50">
        <label class="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Sede activa</label>
        <select :value="sedeActivaId || ''" @change="onSedeChange"
          class="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:ring-2 focus:ring-blue-500">
          <option v-for="sede in sedes" :key="sede.id" :value="sede.id">{{ sede.nombre }}</option>
        </select>
      </div>

      <div class="border-t border-gray-200 p-3">
        <button @click="handleLogout"
          class="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm transition-colors">
          <i class="fas fa-sign-out-alt mr-3 text-base w-5 text-center"></i>
          Cerrar Sesión
        </button>
      </div>
    </aside>

    <!-- Mobile menu -->
    <div v-if="isMobileMenuOpen" class="fixed inset-0 z-40 lg:hidden">
      <div class="fixed inset-0 bg-black/50" @click="closeMobileMenu" />

      <div class="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-xl overflow-y-auto">
        <div class="flex flex-col h-full">
          <div class="flex items-center justify-between p-4 border-b border-gray-200">
            <img :src="'/gore.png'" alt="GORE" class="h-10 object-contain" />
            <button class="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100" @click="closeMobileMenu">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>

          <div v-if="currentUser" class="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p class="text-sm font-medium text-gray-800">{{ currentUser.nombre }}</p>
            <div class="flex items-center gap-2 mt-1 flex-wrap">
              <span :class="roleBadgeClass" class="text-[10px] px-2 py-0.5 rounded-full">{{ rolLabel }}</span>
              <span v-if="currentUser.sede_nombre" class="text-[10px] text-gray-500">
                {{ currentUser.sede_nombre }}
              </span>
            </div>
            <p v-if="currentUser.area_nombre" class="text-[10px] text-gray-500 mt-1">
              {{ currentUser.area_nombre }}
            </p>
          </div>

          <div class="flex-1 overflow-y-auto py-3">
            <div class="space-y-1 px-2">
              <router-link
                v-for="item in menuItems"
                :key="item.path"
                :to="item.path"
                @click="closeMobileMenu"
                class="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg text-sm"
                :class="{ 'bg-blue-50 text-blue-600 font-medium': isActive(item.path) }"
              >
                <i :class="item.icon" class="mr-3 text-base w-5 text-center"></i>
                <div>
                  <div class="font-medium">{{ item.title }}</div>
                  <div class="text-xs text-gray-500">{{ item.description }}</div>
                </div>
              </router-link>
            </div>
          </div>

          <div v-if="canSwitchSede" class="border-t border-gray-200 px-3 py-3 bg-gray-50">
            <label class="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Sede activa</label>
            <select :value="sedeActivaId || ''" @change="onSedeChange"
              class="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5">
              <option v-for="sede in sedes" :key="sede.id" :value="sede.id">{{ sede.nombre }}</option>
            </select>
          </div>

          <div class="border-t border-gray-200 p-3">
            <button @click="handleLogoutMobile"
              class="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm">
              <i class="fas fa-sign-out-alt mr-3 text-base w-5 text-center"></i>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, watch, onMounted, onUnmounted } from 'vue';
import type { PropType } from 'vue';
import { useRoute } from 'vue-router';
import type { User, MenuItem } from '@/types';
import { useSedeStore } from '@/stores/sedeStore';

export default defineComponent({
  name: 'ResponsiveSidebar',
  props: {
    isMobileMenuOpen: { type: Boolean, required: true },
    isAuthenticated: { type: Boolean, required: true },
    currentUser: {
      type: Object as PropType<User | null>,
      default: null,
      required: false
    }
  },
  emits: ['close-mobile-menu', 'open-mobile-menu', 'logout', 'sede-changed'],
  setup(props, { emit }) {
    const route = useRoute();
    const sedeStore = useSedeStore();

    const currentRoute = computed(() => route.path);
    const userRole = computed(() => props.currentUser?.rol || '');

    const sedes = computed(() => sedeStore.sedes);
    const sedeActivaId = computed(() => sedeStore.sedeActivaId);

    const canSwitchSede = computed(() => {
      const rol = props.currentUser?.rol;
      return rol === 'admin' || rol === 'encargado';
    });

    const rolLabel = computed(() => {
      const map: Record<string, string> = {
        admin: 'Admin',
        encargado: 'Encargado',
        rrhh: 'RRHH',
        area_user: 'Área'
      };
      return map[userRole.value] || userRole.value;
    });

    const roleBadgeClass = computed(() => {
      const map: Record<string, string> = {
        admin: 'bg-purple-100 text-purple-800',
        encargado: 'bg-indigo-100 text-indigo-800',
        rrhh: 'bg-blue-100 text-blue-800',
        area_user: 'bg-green-100 text-green-800'
      };
      return map[userRole.value] || 'bg-gray-100 text-gray-800';
    });

    const allMenuItems: MenuItem[] = [
      {
        title: 'Dashboard',
        path: '/dashboard',
        icon: 'fas fa-chart-line',
        description: 'Resumen general',
        roles: ['admin', 'encargado', 'rrhh', 'area_user']
      },
      {
        title: 'Trabajadores',
        path: '/workers',
        icon: 'fas fa-users',
        description: 'Lista de personal',
        roles: ['admin', 'encargado', 'rrhh']
      },
      {
        title: 'Registrar Trabajador',
        path: '/workers/new',
        icon: 'fas fa-user-plus',
        description: 'Añadir personal',
        roles: ['admin', 'rrhh']
      },
      {
        title: 'Comisión',
        path: '/tickets',
        icon: 'fas fa-clipboard-check',
        description: 'Revisar documentos de entrega',
        roles: ['admin', 'encargado']
      },
      {
        title: 'Mis Documentos',
        path: '/my-tickets',
        icon: 'fas fa-paper-plane',
        description: 'Enviar documentos a la comisión',
        roles: ['rrhh', 'area_user']
      },
      {
        title: 'Sedes',
        path: '/sedes',
        icon: 'fas fa-building',
        description: 'Gestión de sedes',
        roles: ['admin']
      },
      {
        title: 'Áreas',
        path: '/areas',
        icon: 'fas fa-sitemap',
        description: 'Áreas por sede',
        roles: ['admin']
      },
      {
        title: 'Usuarios',
        path: '/users',
        icon: 'fas fa-user-shield',
        description: 'Cuentas del sistema',
        roles: ['admin']
      },
      {
        title: 'Regímenes',
        path: '/regimenes',
        icon: 'fas fa-file-contract',
        description: 'Tipos de contrato',
        roles: ['admin']
      }
    ];

    const menuItems = computed(() =>
      allMenuItems.filter(item => item.roles.includes(userRole.value as any))
    );

    const isActive = (path: string): boolean => {
      if (path === '/workers') {
        return currentRoute.value === '/workers' ||
          (currentRoute.value.startsWith('/workers/') &&
            !currentRoute.value.startsWith('/workers/new'));
      }
      return currentRoute.value === path || currentRoute.value.startsWith(path + '/');
    };

    const closeMobileMenu = () => emit('close-mobile-menu');
    const openMobileMenu = () => emit('open-mobile-menu');
    const handleLogout = () => emit('logout');
    const handleLogoutMobile = () => {
      closeMobileMenu();
      handleLogout();
    };

    const onSedeChange = (e: Event) => {
      const target = e.target as HTMLSelectElement;
      sedeStore.setSedeActiva(target.value);
      emit('sede-changed', target.value);
    };

    watch(currentRoute, () => {
      if (props.isMobileMenuOpen) closeMobileMenu();
    });

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && props.isMobileMenuOpen) {
        closeMobileMenu();
      }
    };

    onMounted(() => {
      if (typeof window !== 'undefined') {
        window.addEventListener('keydown', handleKeydown);
      }
    });

    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeydown);
    });

    return {
      currentRoute, roleBadgeClass, rolLabel, menuItems, isActive,
      sedes, sedeActivaId, canSwitchSede,
      closeMobileMenu, openMobileMenu, handleLogout, handleLogoutMobile, onSedeChange
    };
  }
});
</script>

<style scoped>
@media (max-width: 1023px) {
  body.mobile-menu-open { overflow: hidden; }
}
</style>