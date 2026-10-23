<template>
  <div class="max-w-7xl mx-auto">
    <div class="bg-white shadow rounded-lg">
      <!-- Header -->
      <div class="px-6 py-4 border-b">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 class="text-2xl font-bold text-gray-800">Trabajadores</h2>
            <p class="text-sm text-gray-500">
              <span v-if="sedeStore.sedeActiva">{{ sedeStore.sedeActiva.nombre }}</span>
              <span v-else>Todas las sedes</span>
            </p>
          </div>
          <div class="flex gap-2 w-full sm:w-auto">
            <button @click="exportPdf" :disabled="filteredCount === 0" class="btn-secondary">
              <i class="fas fa-file-pdf mr-2"></i>PDF
            </button>
            <button v-if="canManage" @click="$router.push('/workers/new')" class="btn-primary">
              <i class="fas fa-plus mr-2"></i>Nuevo
            </button>
          </div>
        </div>
      </div>

      <!-- Filtros -->
      <div class="p-6 border-b bg-gray-50">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
            <input v-model="filters.q" placeholder="DNI o nombre" class="input-field" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Área</label>
            <select v-model="filters.area_id" class="input-field">
              <option value="">Todas</option>
              <option v-for="a in areas" :key="a.id" :value="a.id">{{ a.nombre }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Régimen</label>
            <select v-model="filters.regimen" class="input-field">
              <option value="">Todos</option>
              <option v-for="r in regimenStore.regimenes" :key="r.codigo" :value="r.codigo">
                {{ r.nombre }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <select v-model="filters.estado" class="input-field">
              <option value="">Todos</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="p-6 bg-gray-50 border-b">
        <div class="grid grid-cols-3 gap-4">
          <div class="bg-white rounded-lg shadow p-4 text-center">
            <div class="text-2xl font-bold text-blue-600">{{ stats.total }}</div>
            <div class="text-xs text-gray-600">Total</div>
          </div>
          <div class="bg-white rounded-lg shadow p-4 text-center">
            <div class="text-2xl font-bold text-green-600">{{ stats.activos }}</div>
            <div class="text-xs text-gray-600">Activos</div>
          </div>
          <div class="bg-white rounded-lg shadow p-4 text-center">
            <div class="text-2xl font-bold text-red-600">{{ stats.inactivos }}</div>
            <div class="text-xs text-gray-600">Inactivos</div>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="p-8 text-center">
        <i class="fas fa-spinner fa-spin text-blue-500 text-2xl mb-2"></i>
        <p class="text-gray-600">Cargando...</p>
      </div>

      <!-- Tabla -->
      <div v-else-if="filteredCount > 0" class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="th">DNI</th>
              <th class="th">Nombre completo</th>
              <th class="th">Área</th>
              <th class="th">Régimen</th>
              <th class="th">Ingreso</th>
              <th class="th">Salida</th>
              <th class="th">Estado</th>
              <th class="th text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="w in paginatedWorkers" :key="w.id" class="hover:bg-gray-50">
              <td class="td font-mono">{{ w.dni }}</td>
              <td class="td font-medium text-gray-900">{{ w.nombre_completo }}</td>
              <td class="td">{{ w.area_nombre || '-' }}</td>
              <td class="td">
                <span class="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">
                  {{ w.regimen_nombre || w.regimen_codigo }}
                </span>
              </td>
              <td class="td">{{ formatDate(w.fecha_ingreso) }}</td>
              <td class="td">
                <template v-if="!w.tiene_fecha_salida">
                  <span class="text-xs text-gray-400 italic">Indeterminado</span>
                </template>
                <template v-else-if="w.fecha_salida">
                  {{ formatDate(w.fecha_salida) }}
                </template>
                <template v-else>
                  <span class="text-xs text-amber-600">Sin fecha</span>
                </template>
              </td>
              <td class="td">
                <span :class="estadoClass(w.estado)" class="px-2 py-1 text-xs rounded-full font-medium">
                  {{ w.estado }}
                </span>
              </td>
              <td class="td text-right whitespace-nowrap">
                <button @click="$router.push(`/workers/${w.id}`)" class="text-gray-600 hover:text-gray-900 mr-3" title="Ver">
                  <i class="fas fa-eye"></i>
                </button>
                <template v-if="canManage">
                  <button @click="$router.push(`/workers/${w.id}/edit`)" class="text-blue-600 hover:text-blue-800 mr-3" title="Editar">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button @click="confirmDelete(w)" class="text-red-600 hover:text-red-800" title="Eliminar">
                    <i class="fas fa-trash"></i>
                  </button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty -->
      <div v-else class="p-8 text-center">
        <i class="fas fa-users text-gray-300 text-4xl mb-4"></i>
        <h3 class="text-lg font-medium text-gray-600 mb-2">No hay trabajadores</h3>
        <p class="text-gray-500">No se encontraron trabajadores con los filtros aplicados</p>
      </div>

      <!-- Paginación -->
      <div v-if="filteredCount > 0" class="px-6 py-4 bg-gray-50 border-t">
        <div class="flex justify-between items-center flex-wrap gap-3">
          <div class="text-sm text-gray-700">
            Mostrando {{ startIndex + 1 }} a {{ endIndex }} de {{ filteredCount }}
          </div>
          <div class="flex items-center gap-2">
            <select v-model="itemsPerPage" class="border border-gray-300 rounded px-2 py-1 text-sm">
              <option :value="10">10</option>
              <option :value="25">25</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
            <button @click="currentPage--" :disabled="currentPage === 1" class="pg-btn">‹</button>
            <span class="px-3 py-1 text-sm">{{ currentPage }} / {{ totalPages }}</span>
            <button @click="currentPage++" :disabled="currentPage === totalPages" class="pg-btn">›</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { useWorkerStore } from '@/stores/workerStore';
import { useSedeStore } from '@/stores/sedeStore';
import { useRegimenStore } from '@/stores/regimenStore';
import { useAuth } from '@/composables/useAuth';
import { areaService } from '@/services/workers';
import { exportWorkersPdf } from '@/utils/pdf';
import type { Worker, Area } from '@/types';

export default defineComponent({
  name: 'WorkersListView',
  setup() {
    const workerStore = useWorkerStore();
    const sedeStore = useSedeStore();
    const regimenStore = useRegimenStore();
    const { canManageWorkers } = useAuth();

    const areas = ref<Area[]>([]);
    const filters = ref({ q: '', area_id: '', regimen: '', estado: '' });
    const currentPage = ref(1);
    const itemsPerPage = ref(25);

    const canManage = computed(() => canManageWorkers.value);
    const loading = computed(() => workerStore.loading);

    const filteredWorkers = computed<Worker[]>(() => {
      let list = workerStore.workers;
      const sedeId = sedeStore.sedeActivaId;
      if (sedeId) list = list.filter(w => w.sede_id === sedeId);

      return list.filter(w => {
        if (filters.value.q) {
          const q = filters.value.q.toLowerCase();
          if (!w.dni.includes(q) && !w.nombre_completo.toLowerCase().includes(q)) return false;
        }
        if (filters.value.area_id && String(w.area_id) !== String(filters.value.area_id)) return false;
        if (filters.value.regimen && w.regimen_codigo !== filters.value.regimen) return false;
        if (filters.value.estado && w.estado !== filters.value.estado) return false;
        return true;
      });
    });

    const filteredCount = computed(() => filteredWorkers.value.length);
    const totalPages = computed(() => Math.ceil(filteredCount.value / itemsPerPage.value) || 1);
    const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value);
    const endIndex = computed(() => Math.min(startIndex.value + itemsPerPage.value, filteredCount.value));
    const paginatedWorkers = computed(() => filteredWorkers.value.slice(startIndex.value, endIndex.value));

    const stats = computed(() => ({
      total: filteredWorkers.value.length,
      activos: filteredWorkers.value.filter(w => w.estado === 'activo').length,
      inactivos: filteredWorkers.value.filter(w => w.estado === 'inactivo').length
    }));

    watch(filters, () => { currentPage.value = 1; }, { deep: true });
    watch(() => sedeStore.sedeActivaId, () => { currentPage.value = 1; });

    const estadoClass = (e: string) => ({
      activo: 'bg-green-100 text-green-800',
      inactivo: 'bg-red-100 text-red-800'
    }[e] || 'bg-gray-100 text-gray-800');

    const formatDate = (d?: string | null): string => {
      if (!d) return '-';
      return new Date(d).toLocaleDateString('es-PE');
    };

    const confirmDelete = async (w: Worker) => {
      if (!confirm(`¿Eliminar a ${w.nombre_completo}?`)) return;
      try {
        await workerStore.deleteWorker(w.id);
      } catch {
        alert('Error al eliminar');
      }
    };

    const exportPdf = () => {
      if (filteredWorkers.value.length === 0) return;
      const sedeNombre = sedeStore.sedeActiva?.nombre;
      const filtros: string[] = [];
      if (filters.value.q) filtros.push(`Búsqueda: ${filters.value.q}`);
      if (filters.value.area_id) {
        const a = areas.value.find(a => String(a.id) === String(filters.value.area_id));
        if (a) filtros.push(`Área: ${a.nombre}`);
      }
      if (filters.value.regimen) filtros.push(`Régimen: ${filters.value.regimen}`);
      if (filters.value.estado) filtros.push(`Estado: ${filters.value.estado}`);

      exportWorkersPdf(filteredWorkers.value, {
        sedeNombre,
        filtros: filtros.length ? filtros.join(' | ') : undefined
      });
    };

    const loadAreas = async () => {
      if (!sedeStore.sedeActivaId) { areas.value = []; return; }
      const { data } = await areaService.getAll({ sede_id: sedeStore.sedeActivaId });
      areas.value = data || [];
    };

    const loadAll = async () => {
      const params = sedeStore.sedeActivaId ? { sede_id: sedeStore.sedeActivaId } : undefined;
      await Promise.all([
        workerStore.fetchWorkers(params),
        regimenStore.fetchRegimenes(),
        loadAreas()
      ]);
    };

    onMounted(loadAll);
    watch(() => sedeStore.sedeActivaId, loadAll);

    return {
      sedeStore, regimenStore, areas,
      filters, currentPage, itemsPerPage,
      canManage, loading,
      filteredWorkers, filteredCount, paginatedWorkers,
      totalPages, startIndex, endIndex, stats,
      estadoClass, formatDate, confirmDelete, exportPdf
    };
  }
});
</script>

<style scoped>
.th { @apply px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider; }
.td { @apply px-4 py-3 text-sm text-gray-700; }
.input-field { @apply w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500; }
.btn-primary { @apply bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition disabled:opacity-50; }
.btn-secondary { @apply bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg shadow-sm transition disabled:opacity-50; }
.pg-btn { @apply px-3 py-1 rounded bg-white border border-gray-300 text-sm disabled:opacity-50 hover:bg-gray-50; }
</style>