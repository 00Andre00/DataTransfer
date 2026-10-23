<template>
  <div class="max-w-7xl mx-auto">
    <div class="bg-white shadow rounded-lg">
      <div class="px-6 py-4 border-b flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">Mis Documentos</h2>
          <p class="text-sm text-gray-500">
            {{ userAreaNombre || 'Sin área' }} — {{ userSedeNombre || 'Sin sede' }}
          </p>
          <p class="text-xs text-gray-400 mt-1">
            Documentos de entrega de cargo enviados a la Comisión de Transferencia
          </p>
        </div>
        <button @click="showForm = true" class="btn-primary">
          <i class="fas fa-plus mr-2"></i>Enviar Documento
        </button>
      </div>

      <!-- Modal crear -->
      <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div class="px-6 py-4 border-b flex justify-between items-center">
            <h3 class="text-lg font-bold">Enviar Documento a la Comisión</h3>
            <button @click="closeForm" class="text-gray-500 hover:text-gray-700">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>

          <form @submit.prevent="crear" class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Título del documento *</label>
              <input v-model="form.titulo" type="text" class="input-field" required
                placeholder="Ej: Entrega de cargo - Administración" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
              <textarea v-model="form.observaciones" rows="4" class="input-field"
                placeholder="Detalles adicionales (opcional)"></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Documento PDF</label>
              <input type="file" accept="application/pdf"
                @change="onFileChange"
                class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              <p class="text-xs text-gray-500 mt-1">Máximo 10 MB</p>
            </div>

            <div v-if="formError" class="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {{ formError }}
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t">
              <button type="button" @click="closeForm" class="btn-secondary">Cancelar</button>
              <button type="submit" :disabled="submitting" class="btn-primary">
                <span v-if="submitting"><i class="fas fa-spinner fa-spin mr-2"></i>Enviando...</span>
                <span v-else><i class="fas fa-paper-plane mr-2"></i>Enviar Documento</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Filtros -->
      <div class="p-6 border-b bg-gray-50">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input v-model="filters.q" placeholder="Buscar por título" class="input-field" />
          <select v-model="filters.estado" class="input-field">
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="observado">Observado</option>
            <option value="completado">Aprobado</option>
          </select>
        </div>
      </div>

      <!-- Lista -->
      <div v-if="loading" class="p-8 text-center">
        <i class="fas fa-spinner fa-spin text-blue-500 text-2xl"></i>
      </div>

      <div v-else-if="filtered.length > 0" class="divide-y">
        <div v-for="t in filtered" :key="t.id" class="p-5 hover:bg-gray-50">
          <div class="flex justify-between items-start gap-3 flex-wrap">
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-gray-800">{{ t.titulo }}</h3>
              <p v-if="t.observaciones" class="text-sm text-gray-600 mt-1 line-clamp-2">
                {{ t.observaciones }}
              </p>
              <div class="flex items-center gap-3 mt-2 text-xs text-gray-500">
                <span><i class="far fa-clock mr-1"></i>{{ formatDate(t.fecha_creacion) }}</span>
                <span v-if="t.pdf_path" class="text-blue-600">
                  <i class="fas fa-file-pdf mr-1"></i>Con PDF
                </span>
              </div>
              <p v-if="t.estado === 'observado' && t.observacion_revision"
                class="text-xs text-orange-700 bg-orange-50 p-2 rounded mt-2">
                <strong>Observación de la comisión:</strong> {{ t.observacion_revision }}
              </p>
            </div>
            <div class="flex flex-col items-end gap-2">
              <span :class="estadoClass(t.estado)" class="px-3 py-1 text-xs rounded-full font-medium">
                {{ estadoLabel(t.estado) }}
              </span>
              <div class="flex gap-2">
                <a v-if="t.pdf_path" :href="pdfUrl(t.id)" target="_blank"
                  class="text-gray-600 hover:text-gray-900 text-sm" title="Ver PDF">
                  <i class="fas fa-file-pdf"></i>
                </a>
                <button v-if="t.estado === 'observado'" @click="openReenviar(t)"
                  class="text-orange-600 hover:text-orange-800 text-sm" title="Reenviar corregido">
                  <i class="fas fa-redo"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="p-8 text-center">
        <i class="fas fa-inbox text-gray-300 text-4xl mb-4"></i>
        <p class="text-gray-500">No has enviado documentos aún</p>
      </div>
    </div>

    <!-- Modal reenviar -->
    <div v-if="reenviarTicket" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div class="px-6 py-4 border-b flex justify-between items-center">
          <h3 class="text-lg font-bold">Reenviar Documento Corregido</h3>
          <button @click="reenviarTicket = null" class="text-gray-500"><i class="fas fa-times"></i></button>
        </div>
        <form @submit.prevent="submitReenviar" class="p-6 space-y-4">
          <div class="p-3 bg-orange-50 border border-orange-200 rounded text-orange-800 text-sm">
            <strong>Observación previa:</strong> {{ reenviarTicket.observacion_revision }}
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input v-model="reenviarForm.titulo" type="text" class="input-field" required />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea v-model="reenviarForm.observaciones" rows="3" class="input-field"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Actualizar PDF (opcional)</label>
            <input type="file" accept="application/pdf" @change="onReenviarFile"
              class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700" />
          </div>
          <div class="flex justify-end gap-3 pt-4 border-t">
            <button type="button" @click="reenviarTicket = null" class="btn-secondary">Cancelar</button>
            <button type="submit" :disabled="submitting" class="btn-primary">
              <i class="fas fa-redo mr-2"></i>Reenviar
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { ticketService } from '@/services/workers';
import type { Ticket } from '@/types';

export default defineComponent({
  name: 'MyTicketsView',
  setup() {
    const { userAreaNombre, userSedeNombre } = useAuth();

    const tickets = ref<Ticket[]>([]);
    const loading = ref(false);
    const showForm = ref(false);
    const submitting = ref(false);
    const formError = ref('');
    const filters = ref({ q: '', estado: '' });

    const form = ref<{ titulo: string; observaciones: string; pdf: File | null }>({
      titulo: '', observaciones: '', pdf: null
    });

    const reenviarTicket = ref<Ticket | null>(null);
    const reenviarForm = ref<{ titulo: string; observaciones: string; pdf: File | null }>({
      titulo: '', observaciones: '', pdf: null
    });

    const filtered = computed(() => {
      return tickets.value.filter(t => {
        if (filters.value.q && !t.titulo.toLowerCase().includes(filters.value.q.toLowerCase())) return false;
        if (filters.value.estado && t.estado !== filters.value.estado) return false;
        return true;
      });
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

    const pdfUrl = (id: number) => ticketService.getPdfUrl(id);

    const onFileChange = (e: Event) => {
      const input = e.target as HTMLInputElement;
      form.value.pdf = input.files?.[0] || null;
    };

    const onReenviarFile = (e: Event) => {
      const input = e.target as HTMLInputElement;
      reenviarForm.value.pdf = input.files?.[0] || null;
    };

    const load = async () => {
      loading.value = true;
      try {
        const { data } = await ticketService.getAll();
        tickets.value = data || [];
      } finally {
        loading.value = false;
      }
    };

    const crear = async () => {
      submitting.value = true;
      formError.value = '';
      try {
        const fd = new FormData();
        fd.append('titulo', form.value.titulo);
        if (form.value.observaciones) fd.append('observaciones', form.value.observaciones);
        if (form.value.pdf) fd.append('pdf', form.value.pdf);

        await ticketService.create(fd);
        closeForm();
        await load();
      } catch (err: any) {
        formError.value = err.response?.data?.error || 'Error al enviar documento';
      } finally {
        submitting.value = false;
      }
    };

    const closeForm = () => {
      showForm.value = false;
      form.value = { titulo: '', observaciones: '', pdf: null };
      formError.value = '';
    };

    const openReenviar = (t: Ticket) => {
      reenviarTicket.value = t;
      reenviarForm.value = {
        titulo: t.titulo,
        observaciones: t.observaciones || '',
        pdf: null
      };
    };

    const submitReenviar = async () => {
      if (!reenviarTicket.value) return;
      submitting.value = true;
      try {
        const fd = new FormData();
        fd.append('titulo', reenviarForm.value.titulo);
        if (reenviarForm.value.observaciones) fd.append('observaciones', reenviarForm.value.observaciones);
        if (reenviarForm.value.pdf) fd.append('pdf', reenviarForm.value.pdf);

        await ticketService.reenviar(reenviarTicket.value.id, fd);
        reenviarTicket.value = null;
        await load();
      } catch (err: any) {
        alert(err.response?.data?.error || 'Error al reenviar');
      } finally {
        submitting.value = false;
      }
    };

    onMounted(load);

    return {
      userAreaNombre, userSedeNombre,
      tickets, loading, showForm, submitting, formError,
      form, filters, filtered, reenviarTicket, reenviarForm,
      estadoClass, estadoLabel, formatDate, pdfUrl,
      onFileChange, onReenviarFile, crear, closeForm, openReenviar, submitReenviar
    };
  }
});
</script>

<style scoped>
.input-field { @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500; }
.btn-primary { @apply bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition disabled:opacity-50; }
.btn-secondary { @apply bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg shadow-sm transition; }
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
</style>