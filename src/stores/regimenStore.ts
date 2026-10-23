// src/stores/regimenStore.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { regimenService } from '@/services/workers';
import type { Regimen } from '@/types';

export const useRegimenStore = defineStore('regimen', () => {
  const regimenes = ref<Regimen[]>([]);
  const loading = ref(false);

  const regimenByCodigo = computed(() => {
    const map: Record<string, Regimen> = {};
    regimenes.value.forEach(r => { map[r.codigo] = r; });
    return map;
  });

  function tieneFechaSalida(codigo: string): boolean {
    return regimenByCodigo.value[codigo]?.tiene_fecha_salida ?? true;
  }

  async function fetchRegimenes() {
    loading.value = true;
    try {
      const { data } = await regimenService.getAll();
      regimenes.value = data || [];
    } catch (err) {
      console.error('Error cargando regímenes:', err);
    } finally {
      loading.value = false;
    }
  }

  return {
    regimenes,
    regimenByCodigo,
    loading,
    tieneFechaSalida,
    fetchRegimenes
  };
});