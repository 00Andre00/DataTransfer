<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-800">Dashboard</h1>
      <p class="text-gray-600 mt-1">
        <span v-if="sedeStore.sedeActiva">{{ sedeStore.sedeActiva.nombre }}</span>
        <span v-else>Todas las sedes</span>
        — {{ currentDate }}
      </p>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-lg shadow p-5 border-l-4 border-blue-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-600 uppercase">Trabajadores</p>
            <p class="text-3xl font-bold text-gray-800">{{ stats.totalWorkers }}</p>
          </div>
          <i class="fas fa-users text-blue-500 text-3xl opacity-30"></i>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-5 border-l-4 border-green-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-600 uppercase">Activos</p>
            <p class="text-3xl font-bold text-gray-800">{{ stats.activos }}</p>
          </div>
          <i class="fas fa-user-check text-green-500 text-3xl opacity-30"></i>
        </div>
      </div>

      <div v-if="canReview" class="bg-white rounded-lg shadow p-5 border-l-4 border-yellow-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-600 uppercase">Tickets pendientes</p>
            <p class="text-3xl font-bold text-gray-800">{{ stats.ticketsPendientes }}</p>
          </div>
          <i class="fas fa-file-invoice text-yellow-500 text-3xl opacity-30"></i>
        </div>
      </div>

      <div v-if="canReview" class="bg-white rounded-lg shadow p-5 border-l-4 border-orange-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-600 uppercase">Tickets observados</p>
            <p class="text-3xl font-bold text-gray-800">{{ stats.ticketsObservados }}</p>
          </div>
          <i class="fas fa-exclamation-triangle text-orange-500 text-3xl opacity-30"></i>
        </div>
      </div>
    </div>

    <!-- Resumen por régimen -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">Trabajadores por Régimen</h2>
      <div v-if="stats.byRegimen.length === 0" class="text-gray-500 text-sm">
        No hay datos disponibles
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <div v-for="r in stats.byRegimen" :key="r.codigo"
          class="border rounded-lg p-4 flex justify-between items-center">
          <p class="font-medium text-gray-800">{{ r.nombre }}</p>
          <p class="text-2xl font-bold text-blue-600">{{ r.count }}</p>
        </div>
      </div>
    </div>

    <!-- Sedes (solo admin/encargado) -->
    <div v-if="canViewAll" class="bg-white rounded-lg shadow p-6">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">Resumen por Sede</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div v-for="s in sedeStats" :key="s.id" class="border rounded-lg p-4">
          <p class="font-medium text-gray-800">{{ s.nombre }}</p>
          <p class="text-2xl font-bold text-blue-600 mt-1">{{ s.total }}</p>
          <p class="text-xs text-gray-500">trabajadores</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { useSedeStore } from '@/stores/sedeStore';
import { useWorkerStore } from '@/stores/workerStore';
import { useRegimenStore } from '@/stores/regimenStore';
import { useAuth } from '@/composables/useAuth';
import { ticketService } from '@/services/workers';
import type { Ticket, Worker } from '@/types';

export default defineComponent({
  name: 'DashboardView',
  setup() {
    const sedeStore = useSedeStore();
    const workerStore = useWorkerStore();
    const regimenStore = useRegimenStore();
    const { canReviewTickets, canViewAllSedes } = useAuth();

    const tickets = ref<Ticket[]>([]);
    const currentDate = ref(new Date().toLocaleDateString('es-PE', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }));

    const canReview = computed(() => canReviewTickets.value);
    const canViewAll = computed(() => canViewAllSedes.value);

    const workersBySede = computed<Worker[]>(() => {
      const sedeId = sedeStore.sedeActivaId;
      if (!sedeId) return workerStore.workers;
      return workerStore.workers.filter(w => w.sede_id === sedeId);
    });

    const stats = computed(() => {
      const list = workersBySede.value;
      const regimenMap: Record<string, { codigo: string; nombre: string; count: number }> = {};

      list.forEach(w => {
        const reg = regimenStore.regimenByCodigo[w.regimen_codigo];
        const key = w.regimen_codigo;
        if (!regimenMap[key]) {
          regimenMap[key] = {
            codigo: key,
            nombre: reg?.nombre || key,
            count: 0
          };
        }
        regimenMap[key].count++;
      });

      return {
        totalWorkers: list.length,
        activos: list.filter(w => w.estado === 'activo').length,
        ticketsPendientes: tickets.value.filter(t => t.estado === 'pendiente').length,
        ticketsObservados: tickets.value.filter(t => t.estado === 'observado').length,
        byRegimen: Object.values(regimenMap).sort((a, b) => b.count - a.count)
      };
    });

    const sedeStats = computed(() => {
      return sedeStore.sedes.map(s => ({
        id: s.id,
        nombre: s.nombre,
        total: workerStore.workers.filter(w => w.sede_id === s.id).length
      }));
    });

    const load = async () => {
      const params = sedeStore.sedeActivaId ? { sede_id: sedeStore.sedeActivaId } : undefined;

      await Promise.all([
        workerStore.fetchWorkers(params),
        regimenStore.fetchRegimenes(),
        canReview.value ? loadTickets() : Promise.resolve()
      ]);
    };

    const loadTickets = async () => {
      try {
        const params: any = {};
        if (sedeStore.sedeActivaId) params.sede_id = sedeStore.sedeActivaId;
        const { data } = await ticketService.getAll(params);
        tickets.value = data || [];
      } catch { tickets.value = []; }
    };

    onMounted(load);
    watch(() => sedeStore.sedeActivaId, load);

    return { sedeStore, canReview, canViewAll, currentDate, stats, sedeStats };
  }
});
</script>