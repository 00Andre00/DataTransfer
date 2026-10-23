<template>
  <!-- Login sin layout -->
  <div v-if="$route.name === 'Login'" class="min-h-screen bg-gray-50">
    <router-view />
  </div>

  <!-- Layout Normal -->
  <div v-else class="min-h-screen flex flex-col bg-gray-50">
    <ResponsiveSidebar
      :is-mobile-menu-open="isMobileMenuOpen"
      @close-mobile-menu="isMobileMenuOpen = false"
      @open-mobile-menu="isMobileMenuOpen = true"
      :is-authenticated="isAuthenticated"
      :current-user="currentUser || null"
      @logout="handleLogout"
      @sede-changed="handleSedeChanged"
    />

    <main
      class="flex-1 transition-all duration-300"
      :class="{ 'lg:ml-64 pt-16 lg:pt-0': isAuthenticated }"
    >
      <div class="container mx-auto p-4 lg:p-6">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import ResponsiveSidebar from './components/Layout/Sidebar.vue';
import { useAuth } from './composables/useAuth';
import { useSedeStore } from './stores/sedeStore';
import authService from './services/authService';

export default defineComponent({
  name: 'App',
  components: { ResponsiveSidebar },
  setup() {
    const router = useRouter();
    const { isAuthenticated, currentUser } = useAuth();
    const sedeStore = useSedeStore();
    const isMobileMenuOpen = ref(false);

    const handleLogout = () => {
      if (confirm('¿Está seguro que desea cerrar sesión?')) {
        authService.logout();
        localStorage.removeItem('sede_activa');
        router.push('/login');
      }
    };

    const handleSedeChanged = (sedeId: string) => {
      console.log('Sede cambiada a:', sedeId);
      // Forzar recarga de la vista actual para que refresque datos
      const current = router.currentRoute.value.fullPath;
      router.replace({ path: '/redirect', query: { to: current } });
    };

    const handleAuthChange = () => {};

    onMounted(async () => {
      authService.onAuthChange(handleAuthChange);
      sedeStore.initSedeActiva();
      if (isAuthenticated.value) {
        await sedeStore.fetchSedes();
      }
    });

    onUnmounted(() => authService.offAuthChange(handleAuthChange));

    return { isMobileMenuOpen, isAuthenticated, currentUser, handleLogout, handleSedeChanged };
  }
});
</script>

<style>
.mobile-menu-open { overflow: hidden; }
</style>