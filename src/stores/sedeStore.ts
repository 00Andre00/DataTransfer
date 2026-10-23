// src/stores/sedeStore.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/services/api';
import type { Sede } from '@/types';

export const useSedeStore = defineStore('sede', () => {
  // Lista completa de sedes
  const sedes = ref<Sede[]>([]);
  // Sede activa (contexto global)
  const sedeActivaId = ref<string | null>(null);
  const loading = ref(false);

  const sedeActiva = computed<Sede | null>(() => {
    if (!sedeActivaId.value) return null;
    return sedes.value.find(s => s.id === sedeActivaId.value) || null;
  });

  async function fetchSedes() {
    loading.value = true;
    try {
      const { data } = await api.get<Sede[]>('/sedes');
      sedes.value = data;
      // Si no hay sede activa, usar la primera
      if (!sedeActivaId.value && sedes.value.length > 0) {
        sedeActivaId.value = sedes.value[0].id;
      }
    } catch (err) {
      console.error('Error cargando sedes:', err);
    } finally {
      loading.value = false;
    }
  }

  function setSedeActiva(sedeId: string) {
    sedeActivaId.value = sedeId;
    // Persistir en localStorage para mantener al recargar
    localStorage.setItem('sede_activa', sedeId);
  }

  function initSedeActiva() {
    const saved = localStorage.getItem('sede_activa');
    if (saved) sedeActivaId.value = saved;
  }

  return {
    sedes,
    sedeActivaId,
    sedeActiva,
    loading,
    fetchSedes,
    setSedeActiva,
    initSedeActiva
  };
});