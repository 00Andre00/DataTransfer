<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">Directorio de Personal</h1>
      <p class="text-gray-600">Huánuco - {{ currentDate }}</p>
    </div>

    <!-- Selector de sede -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Sede</label>
          <select v-model="selectedSede" class="input-field">
            <option value="">Todas las sedes</option>
            <option v-for="sede in sedes" :key="sede.id" :value="sede.id">
              {{ sede.nombre }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Buscar por nombre</label>
          <input v-model="searchName" placeholder="Nombre o apellido" class="input-field" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Cargo</label>
          <input v-model="searchCargo" placeholder="Cargo" class="input-field" />
        </div>
      </div>
    </div>

    <!-- Tabla -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trabajador</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">DNI</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cargo</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sede</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Área</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ingreso</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="worker in paginatedWorkers" :key="worker.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">
                  {{ worker.apellido_paterno }} {{ worker.apellido_materno }}, {{ worker.nombres }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{{ worker.dni }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ worker.cargo }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ worker.sede_nombre || '-' }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ worker.area || '-' }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatDate(worker.fecha_ingreso) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginación -->
      <div class="px-6 py-4 bg-gray-50 border-t">
        <div class="flex justify-between items-center text-sm">
          <span>Mostrando {{ startIndex + 1 }} a {{ endIndex }} de {{ filteredCount }}</span>
          <div class="flex gap-2">
            <button @click="currentPage--" :disabled="currentPage === 1" class="px-3 py-1 border rounded disabled:opacity-50">Anterior</button>
            <span class="px-3 py-1">{{ currentPage }} / {{ totalPages }}</span>
            <button @click="currentPage++" :disabled="currentPage === totalPages" class="px-3 py-1 border rounded disabled:opacity-50">Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { useWorkerStore } from '@/stores/workerStore';

export default defineComponent({
  name: 'DirectoryView',
  setup() {
    const workerStore = useWorkerStore();
    const selectedSede = ref('');
    const searchName = ref('');
    const searchCargo = ref('');
    const currentPage = ref(1);
    const itemsPerPage = ref(25);

    const currentDate = ref(new Date().toLocaleDateString('es-PE', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }));

    const sedes = computed(() => workerStore.sedes);

    const filteredWorkers = computed(() => {
      return workerStore.publicWorkers.filter(w => {
        if (selectedSede.value && w.sede_id !== selectedSede.value) return false;
        if (searchName.value) {
          const full = `${w.nombres} ${w.apellido_paterno} ${w.apellido_materno}`.toLowerCase();
          if (!full.includes(searchName.value.toLowerCase())) return false;
        }
        if (searchCargo.value && !w.cargo.toLowerCase().includes(searchCargo.value.toLowerCase())) return false;
        return true;
      });
    });

    const filteredCount = computed(() => filteredWorkers.value.length);
    const totalPages = computed(() => Math.ceil(filteredCount.value / itemsPerPage.value) || 1);
    const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value);
    const endIndex = computed(() => Math.min(startIndex.value + itemsPerPage.value, filteredCount.value));
    const paginatedWorkers = computed(() => filteredWorkers.value.slice(startIndex.value, endIndex.value));

    watch([selectedSede, searchName, searchCargo], () => { currentPage.value = 1; });

    const formatDate = (date: string): string => {
      if (!date) return '-';
      return new Date(date).toLocaleDateString('es-PE');
    };

    onMounted(async () => {
      await Promise.all([
        workerStore.fetchPublicWorkers(),
        workerStore.fetchSedes()
      ]);
    });

    return {
      selectedSede, searchName, searchCargo, currentDate, sedes,
      paginatedWorkers, filteredCount, currentPage, itemsPerPage,
      totalPages, startIndex, endIndex, formatDate
    };
  }
});
</script>