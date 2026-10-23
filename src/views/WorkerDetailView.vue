<template>
  <div class="max-w-4xl mx-auto">
    <div class="mb-6">
      <button @click="$router.push('/workers')" class="text-blue-600 hover:text-blue-800 mb-3 flex items-center gap-2 text-sm">
        <i class="fas fa-arrow-left"></i>Volver
      </button>
    </div>

    <div v-if="loading" class="bg-white shadow rounded-lg p-8 text-center">
      <i class="fas fa-spinner fa-spin text-blue-500 text-2xl"></i>
    </div>

    <div v-else-if="worker" class="space-y-5">
      <!-- Header -->
      <div class="bg-white shadow rounded-lg p-6">
        <div class="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-800">{{ worker.nombre_completo }}</h1>
            <p class="text-gray-600 font-mono mt-1">DNI: {{ worker.dni }}</p>
            <div class="flex gap-2 mt-2 flex-wrap">
              <span :class="estadoClass(worker.estado)" class="px-3 py-1 text-xs rounded-full font-medium">
                {{ worker.estado }}
              </span>
              <span class="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                {{ worker.regimen_nombre || worker.regimen_codigo }}
              </span>
            </div>
          </div>
          <button v-if="canManage" @click="$router.push(`/workers/${worker.id}/edit`)"
            class="btn-primary">
            <i class="fas fa-edit mr-2"></i>Editar
          </button>
        </div>
      </div>

      <!-- Datos -->
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Datos del trabajador</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span class="text-sm text-gray-500">Sede:</span>
            <p class="font-medium">{{ worker.sede_nombre || worker.sede_id }}</p>
          </div>
          <div>
            <span class="text-sm text-gray-500">Área:</span>
            <p class="font-medium">{{ worker.area_nombre || '-' }}</p>
          </div>
          <div>
            <span class="text-sm text-gray-500">Fecha de ingreso:</span>
            <p class="font-medium">{{ formatDate(worker.fecha_ingreso) }}</p>
          </div>
          <div>
            <span class="text-sm text-gray-500">Fecha de salida:</span>
            <p class="font-medium">
              <span v-if="worker.tiene_fecha_salida">
                {{ worker.fecha_salida ? formatDate(worker.fecha_salida) : 'No registrada' }}
              </span>
              <span v-else class="text-gray-400 italic">Indeterminado</span>
            </p>
          </div>
        </div>
      </div>

      <!-- Historial de sedes -->
      <div v-if="workerHistory.length > 0" class="bg-white shadow rounded-lg p-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Historial de sedes</h2>
        <div class="space-y-3">
          <div v-for="h in workerHistory" :key="h.id" class="border-l-4 border-blue-500 pl-4 py-2">
            <div class="flex justify-between items-start flex-wrap gap-2">
              <div>
                <p class="font-medium">{{ h.sede_nombre || h.sede_id }}</p>
                <p v-if="h.motivo_cambio" class="text-sm text-gray-500">{{ h.motivo_cambio }}</p>
              </div>
              <div class="text-right text-sm text-gray-500">
                <p>{{ formatDate(h.fecha_inicio) }}</p>
                <p v-if="h.fecha_fin">hasta {{ formatDate(h.fecha_fin) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="bg-white shadow rounded-lg p-8 text-center">
      <p class="text-gray-600">Trabajador no encontrado</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useWorkerStore } from '@/stores/workerStore';
import { useAuth } from '@/composables/useAuth';
import type { Worker } from '@/types';

export default defineComponent({
  name: 'WorkerDetailView',
  setup() {
    const route = useRoute();
    const workerStore = useWorkerStore();
    const { canManageWorkers } = useAuth();

    const worker = ref<Worker | null>(null);
    const loading = ref(true);
    const canManage = computed(() => canManageWorkers.value);
    const workerHistory = computed(() => workerStore.workerHistory);

    const estadoClass = (e: string) =>
      e === 'activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';

    const formatDate = (d?: string | null) => {
      if (!d) return '-';
      return new Date(d).toLocaleDateString('es-PE');
    };

    onMounted(async () => {
      try {
        worker.value = await workerStore.fetchWorkerById(Number(route.params.id));
        await workerStore.fetchSedeHistory(Number(route.params.id));
      } finally {
        loading.value = false;
      }
    });

    return { worker, loading, canManage, workerHistory, estadoClass, formatDate };
  }
});
</script>

<style scoped>
.btn-primary { @apply bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition; }
</style>