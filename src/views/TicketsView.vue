<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-800">Comisión de Transferencia</h1>
      <p class="text-gray-600 mt-1">
        <span v-if="sedeStore.sedeActiva">{{ sedeStore.sedeActiva.nombre }}</span>
        <span v-else>Todas las sedes</span>
        — Revisión de documentos de entrega de cargo
      </p>
    </div>

    <!-- Resumen global -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
        <p class="text-xs text-gray-500 uppercase">Áreas</p>
        <p class="text-3xl font-bold text-gray-800">{{ areas.length }}</p>
      </div>
      <div class="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
        <p class="text-xs text-gray-500 uppercase">Pendientes</p>
        <p class="text-3xl font-bold text-gray-800">{{ stats.pendientes }}</p>
      </div>
      <div class="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
        <p class="text-xs text-gray-500 uppercase">Observados</p>
        <p class="text-3xl font-bold text-gray-800">{{ stats.observados }}</p>
      </div>
      <div class="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
        <p class="text-xs text-gray-500 uppercase">Completados</p>
        <p class="text-3xl font-bold text-gray-800">{{ stats.completados }}</p>
      </div>
    </div>

    <!-- Vista de Áreas -->
    <div v-if="!selectedArea" class="bg-white rounded-lg shadow">
      <div class="px-6 py-4 border-b">
        <h2 class="text-lg font-semibold text-gray-800">Áreas de la Comisión</h2>
        <p class="text-sm text-gray-500">Haz clic en un área para revisar sus documentos</p>
      </div>

      <div v-if="loading" class="p-8 text-center">
        <i class="fas fa-spinner fa-spin text-blue-500 text-2xl"></i>
      </div>

      <div v-else-if="areasResumen.length === 0" class="p-8 text-center">
        <i class="fas fa-sitemap text-gray-300 text-4xl mb-3"></i>
        <p class="text-gray-500">No hay áreas registradas en esta sede</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
        <button
          v-for="a in areasResumen"
          :key="a.area_id"
          @click="selectedArea = a"
          class="text-left border rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition bg-white"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="bg-blue-100 rounded-lg p-2">
              <i class="fas fa-folder-open text-blue-600"></i>
            </div>
            <span
              v-if="a.pendientes > 0"
              class="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded-full"
            >
              {{ a.pendientes }} pendientes
            </span>
            <span
              v-else-if="a.total > 0"
              class="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full"
            >
              Al día
            </span>
          </div>
          <h3 class="font-semibold text-gray-800">{{ a.area_nombre }}</h3>
          <p class="text-sm text-gray-500 mt-1">
            {{ a.total }} documento{{ a.total !== 1 ? 's' : '' }} enviado{{ a.total !== 1 ? 's' : '' }}
          </p>
          <div class="mt-3 flex gap-2 text-xs">
            <span class="text-yellow-600">
              <i class="fas fa-clock mr-1"></i>{{ a.pendientes }}
            </span>
            <span class="text-orange-600">
              <i class="fas fa-exclamation-triangle mr-1"></i>{{ a.observados }}
            </span>
            <span class="text-green-600">
              <i class="fas fa-check mr-1"></i>{{ a.completados }}
            </span>
          </div>
        </button>
      </div>
    </div>

    <!-- Vista de Documentos de un Área -->
    <div v-else class="bg-white rounded-lg shadow">
      <div class="px-6 py-4 border-b flex justify-between items-center flex-wrap gap-3">
        <div>
          <button @click="selectedArea = null" class="text-blue-600 hover:text-blue-800 text-sm mb-1 flex items-center gap-1">
            <i class="fas fa-arrow-left"></i>Volver a áreas
          </button>
          <h2 class="text-lg font-semibold text-gray-800">
            {{ selectedArea.area_nombre }}
          </h2>
          <p class="text-sm text-gray-500">
            {{ selectedArea.total }} documento{{ selectedArea.total !== 1 ? 's' : '' }} en total
          </p>
        </div>
      </div>

      <!-- Filtros -->
      <div class="p-4 border-b bg-gray-50 flex gap-3 flex-wrap">
        <button
          @click="estadoFiltro = ''"
          :class="estadoFiltro === '' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'"
          class="px-3 py-1 rounded-lg border text-sm"
        >
          Todos ({{ selectedArea.total }})
        </button>
        <button
          @click="estadoFiltro = 'pendiente'"
          :class="estadoFiltro === 'pendiente' ? 'bg-yellow-500 text-white' : 'bg-white text-gray-700'"
          class="px-3 py-1 rounded-lg border text-sm"
        >
          Pendientes ({{ selectedArea.pendientes }})
        </button>
        <button
          @click="estadoFiltro = 'observado'"
          :class="estadoFiltro === 'observado' ? 'bg-orange-500 text-white' : 'bg-white text-gray-700'"
          class="px-3 py-1 rounded-lg border text-sm"
        >
          Observados ({{ selectedArea.observados }})
        </button>
        <button
          @click="estadoFiltro = 'completado'"
          :class="estadoFiltro === 'completado' ? 'bg-green-600 text-white' : 'bg-white text-gray-700'"
          class="px-3 py-1 rounded-lg border text-sm"
        >
          Completados ({{ selectedArea.completados }})
        </button>
      </div>

      <!-- Lista de documentos -->
      <div v-if="documentosFiltrados.length === 0" class="p-8 text-center">
        <i class="fas fa-inbox text-gray-300 text-4xl mb-3"></i>
        <p class="text-gray-500">No hay documentos con este filtro</p>
      </div>

      <div v-else class="divide-y">
        <div v-for="t in documentosFiltrados" :key="t.id" class="p-5 hover:bg-gray-50">
          <div class="flex justify-between items-start gap-4 flex-wrap">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="font-semibold text-gray-800">{{ t.titulo }}</h3>
                <span :class="estadoClass(t.estado)" class="px-2 py-0.5 text-xs rounded-full font-medium">
                  {{ estadoLabel(t.estado) }}
                </span>
              </div>
              <p v-if="t.observaciones" class="text-sm text-gray-600 mt-1 line-clamp-2">
                {{ t.observaciones }}
              </p>
              <div class="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
                <span><i class="fas fa-user mr-1"></i>{{ t.creado_por_nombre }}</span>
                <span><i class="far fa-clock mr-1"></i>{{ formatDate(t.fecha_creacion) }}</span>
                <span v-if="t.pdf_path" class="text-blue-600">
                  <i class="fas fa-file-pdf mr-1"></i>PDF adjunto
                </span>
              </div>
            </div>
            <button
              @click="$router.push(`/tickets/${t.id}`)"
              class="btn-primary whitespace-nowrap"
            >
              <i class="fas fa-eye mr-1"></i>Revisar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { useSedeStore } from '@/stores/sedeStore';
import { ticketService, areaService } from '@/services/workers';
import type { Ticket, Area } from '@/types';

interface AreaResumen {
  area_id: number;
  area_nombre: string;
  total: number;
  pendientes: number;
  observados: number;
  completados: number;
}

export default defineComponent({
  name: 'TicketsView',
  setup() {
    const sedeStore = useSedeStore();
    const tickets = ref<Ticket[]>([]);
    const areas = ref<Area[]>([]);
    const loading = ref(false);
    const selectedArea = ref<AreaResumen | null>(null);
    const estadoFiltro = ref('');

    // Resumen por área
    const areasResumen = computed<AreaResumen[]>(() => {
      return areas.value.map(a => {
        const ts = tickets.value.filter(t => t.area_id === a.id);
        return {
          area_id: a.id,
          area_nombre: a.nombre,
          total: ts.length,
          pendientes: ts.filter(t => t.estado === 'pendiente').length,
          observados: ts.filter(t => t.estado === 'observado').length,
          completados: ts.filter(t => t.estado === 'completado').length
        };
      });
    });

    const stats = computed(() => ({
      pendientes: tickets.value.filter(t => t.estado === 'pendiente').length,
      observados: tickets.value.filter(t => t.estado === 'observado').length,
      completados: tickets.value.filter(t => t.estado === 'completado').length
    }));

    // Documentos del área seleccionada, filtrados por estado
    const documentosFiltrados = computed(() => {
      if (!selectedArea.value) return [];
      const list = tickets.value.filter(t => t.area_id === selectedArea.value!.area_id);
      if (!estadoFiltro.value) return list;
      return list.filter(t => t.estado === estadoFiltro.value);
    });

    const estadoClass = (e: string) => ({
      pendiente: 'bg-yellow-100 text-yellow-800',
      observado: 'bg-orange-100 text-orange-800',
      completado: 'bg-green-100 text-green-800'
    }[e] || 'bg-gray-100 text-gray-800');

    const estadoLabel = (e: string) => ({
      pendiente: 'Pendiente',
      observado: 'Observado',
      completado: 'Aprobado'
    }[e] || e);

    const formatDate = (d: string) =>
      new Date(d).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });

    const load = async () => {
      loading.value = true;
      try {
        const params: any = {};
        if (sedeStore.sedeActivaId) params.sede_id = sedeStore.sedeActivaId;

        const [t, a] = await Promise.all([
          ticketService.getAll(params),
          areaService.getAll({ sede_id: sedeStore.sedeActivaId || undefined })
        ]);
        tickets.value = t.data || [];
        areas.value = a.data || [];

        // Si hay un área seleccionada, refrescar su resumen
        if (selectedArea.value) {
          selectedArea.value = areasResumen.value.find(
            a => a.area_id === selectedArea.value!.area_id
          ) || null;
        }
      } finally {
        loading.value = false;
      }
    };

    onMounted(load);
    watch(() => sedeStore.sedeActivaId, () => {
      selectedArea.value = null;
      estadoFiltro.value = '';
      load();
    });

    return {
      sedeStore, areas, loading, stats, selectedArea, estadoFiltro,
      areasResumen, documentosFiltrados,
      estadoClass, estadoLabel, formatDate
    };
  }
});
</script>

<style scoped>
.btn-primary { @apply bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-lg shadow-sm transition text-sm; }
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
</style>