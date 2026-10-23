<template>
  <div class="max-w-4xl mx-auto">
    <div class="mb-6">
      <button @click="$router.back()" class="text-blue-600 hover:text-blue-800 mb-3 flex items-center gap-2 text-sm">
        <i class="fas fa-arrow-left"></i>Volver
      </button>
    </div>

    <div v-if="loading" class="bg-white shadow rounded-lg p-8 text-center">
      <i class="fas fa-spinner fa-spin text-blue-500 text-2xl"></i>
    </div>

    <div v-else-if="ticket" class="space-y-5">
      <!-- Header -->
      <div class="bg-white shadow rounded-lg p-6">
        <div class="flex justify-between items-start flex-wrap gap-3">
          <div>
            <h1 class="text-2xl font-bold text-gray-800">{{ ticket.titulo }}</h1>
            <p class="text-sm text-gray-500 mt-1">
              Documento enviado por <strong>{{ ticket.creado_por_nombre }}</strong>
              el {{ formatDate(ticket.fecha_creacion) }}
            </p>
            <div class="flex gap-2 mt-3 flex-wrap">
              <span :class="estadoClass(ticket.estado)" class="px-3 py-1 text-xs rounded-full font-medium">
                {{ estadoLabel(ticket.estado) }}
              </span>
              <span class="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                {{ ticket.area_nombre }}
              </span>
              <span class="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                {{ ticket.sede_nombre }}
              </span>
            </div>
          </div>
          <a v-if="ticket.pdf_path" :href="pdfUrl" target="_blank" class="btn-secondary">
            <i class="fas fa-file-pdf mr-2"></i>Ver PDF
          </a>
        </div>
      </div>

      <!-- Observaciones del área -->
      <div v-if="ticket.observaciones" class="bg-white shadow rounded-lg p-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-3">Observaciones del área</h2>
        <p class="text-gray-700 whitespace-pre-line">{{ ticket.observaciones }}</p>
      </div>

      <!-- Observación de la comisión -->
      <div v-if="ticket.estado === 'observado' && ticket.observacion_revision"
        class="bg-orange-50 border border-orange-200 rounded-lg p-6">
        <h2 class="text-lg font-semibold text-orange-800 mb-3">
          <i class="fas fa-exclamation-circle mr-2"></i>Observación de la comisión
        </h2>
        <p class="text-orange-900 whitespace-pre-line">{{ ticket.observacion_revision }}</p>
        <p class="text-xs text-orange-600 mt-3">
          Revisado por {{ ticket.revisado_por_nombre }} el {{ formatDate(ticket.fecha_revision) }}
        </p>
      </div>

      <!-- Acciones de revisión (admin/encargado) -->
      <div v-if="canReview && ticket.estado === 'pendiente'"
        class="bg-white shadow rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold text-gray-800">Revisión del documento</h2>

        <div class="border border-green-200 rounded-lg p-4 bg-green-50">
          <p class="text-sm text-green-800 mb-3">
            Si el documento está conforme, márcalo como <strong>Aprobado</strong>.
          </p>
          <button @click="completar" :disabled="processing" class="btn-success">
            <i class="fas fa-check mr-2"></i>Aprobar Documento
          </button>
        </div>

        <div class="border border-orange-200 rounded-lg p-4 bg-orange-50">
          <p class="text-sm text-orange-800 mb-3">
            Si necesita correcciones, describe el motivo y márcalo como <strong>Observado</strong>.
          </p>
          <textarea v-model="observacion" rows="3" class="input-field mb-3"
            placeholder="Escribe la observación para el área..."></textarea>
          <button @click="observar" :disabled="processing || !observacion.trim()" class="btn-warning">
            <i class="fas fa-exclamation-triangle mr-2"></i>Observar Documento
          </button>
        </div>

        <div v-if="error" class="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
          {{ error }}
        </div>
      </div>

      <!-- Aprobado -->
      <div v-if="ticket.estado === 'completado'" class="bg-green-50 border border-green-200 rounded-lg p-6">
        <p class="text-green-800">
          <i class="fas fa-check-circle mr-2"></i>
          Aprobado por <strong>{{ ticket.revisado_por_nombre }}</strong>
          el {{ formatDate(ticket.fecha_revision) }}
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ticketService } from '@/services/workers';
import { useAuth } from '@/composables/useAuth';
import type { Ticket } from '@/types';

export default defineComponent({
  name: 'TicketDetailView',
  setup() {
    const route = useRoute();
    const { canReviewTickets } = useAuth();

    const ticket = ref<Ticket | null>(null);
    const loading = ref(true);
    const processing = ref(false);
    const observacion = ref('');
    const error = ref('');

    const ticketId = Number(route.params.id);
    const canReview = computed(() => canReviewTickets.value);
    const pdfUrl = computed(() => ticketService.getPdfUrl(ticketId));

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

    const formatDate = (d?: string | null) =>
      d ? new Date(d).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : '-';

    const load = async () => {
      loading.value = true;
      try {
        const { data } = await ticketService.getById(ticketId);
        ticket.value = data || null;
      } finally {
        loading.value = false;
      }
    };

    const completar = async () => {
      if (!confirm('¿Aprobar este documento?')) return;
      processing.value = true;
      error.value = '';
      try {
        const { data } = await ticketService.completar(ticketId);
        ticket.value = data || null;
      } catch (err: any) {
        error.value = err.response?.data?.error || 'Error';
      } finally {
        processing.value = false;
      }
    };

    const observar = async () => {
      if (!observacion.value.trim()) return;
      processing.value = true;
      error.value = '';
      try {
        const { data } = await ticketService.observar(ticketId, observacion.value.trim());
        ticket.value = data || null;
        observacion.value = '';
      } catch (err: any) {
        error.value = err.response?.data?.error || 'Error';
      } finally {
        processing.value = false;
      }
    };

    onMounted(load);

    return {
      ticket, loading, processing, observacion, error,
      canReview, pdfUrl, estadoClass, estadoLabel, formatDate,
      completar, observar
    };
  }
});
</script>

<style scoped>
.btn-success { @apply bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition disabled:opacity-50; }
.btn-warning { @apply bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition disabled:opacity-50; }
.btn-secondary { @apply bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg shadow-sm transition; }
.input-field { @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500; }
</style>