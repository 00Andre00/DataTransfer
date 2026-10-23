<template>
  <div class="max-w-3xl mx-auto">
    <div class="mb-6">
      <button @click="$router.push('/workers')" class="text-blue-600 hover:text-blue-800 mb-3 flex items-center gap-2 text-sm">
        <i class="fas fa-arrow-left"></i>Volver a la lista
      </button>
      <h1 class="text-2xl font-bold text-gray-800">Editar Trabajador</h1>
    </div>

    <div v-if="loadingData" class="bg-white shadow rounded-lg p-8 text-center">
      <i class="fas fa-spinner fa-spin text-blue-500 text-2xl"></i>
    </div>

    <div v-else-if="form" class="bg-white shadow rounded-lg p-6">
      <form @submit.prevent="handleSubmit" class="space-y-5">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">DNI *</label>
            <input v-model="form.dni" type="text" maxlength="8" class="input-field"
              @input="form.dni = form.dni.replace(/[^0-9]/g, '')" required />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
            <input v-model="form.nombre_completo" type="text" class="input-field" required />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Área</label>
            <select v-model="form.area_id" class="input-field">
              <option :value="null">Sin área</option>
              <option v-for="a in areas" :key="a.id" :value="a.id">{{ a.nombre }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Régimen *</label>
            <select v-model="form.regimen_codigo" class="input-field" required>
              <option v-for="r in regimenStore.regimenes" :key="r.codigo" :value="r.codigo">
                {{ r.nombre }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Fecha de ingreso *</label>
            <input v-model="form.fecha_ingreso" type="date" class="input-field" required />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Fecha de salida
              <span v-if="!tieneFechaSalida" class="text-xs text-gray-500 italic">(indeterminado)</span>
            </label>
            <input v-model="form.fecha_salida" type="date" class="input-field"
              :disabled="!tieneFechaSalida"
              :class="{ 'bg-gray-100 cursor-not-allowed': !tieneFechaSalida }" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
            <select v-model="form.estado" class="input-field" required>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t">
          <button type="button" @click="$router.push('/workers')" class="btn-secondary">Cancelar</button>
          <button type="submit" :disabled="loading" class="btn-primary">
            <span v-if="loading"><i class="fas fa-spinner fa-spin mr-2"></i>Guardando...</span>
            <span v-else><i class="fas fa-save mr-2"></i>Guardar cambios</span>
          </button>
        </div>
      </form>

      <div v-if="error" class="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
        {{ error }}
      </div>
      <div v-if="successMessage" class="mt-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
        {{ successMessage }}
      </div>
    </div>

    <div v-else class="bg-white shadow rounded-lg p-8 text-center">
      <p class="text-red-500">Trabajador no encontrado</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useWorkerStore } from '@/stores/workerStore';
import { useSedeStore } from '@/stores/sedeStore';
import { useRegimenStore } from '@/stores/regimenStore';
import { areaService } from '@/services/workers';
import type { WorkerForm, Area } from '@/types';

export default defineComponent({
  name: 'EditWorkerView',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const workerStore = useWorkerStore();
    const sedeStore = useSedeStore();
    const regimenStore = useRegimenStore();

    const workerId = Number(route.params.id);
    const form = ref<WorkerForm | null>(null);
    const areas = ref<Area[]>([]);
    const loading = ref(false);
    const loadingData = ref(true);
    const error = ref('');
    const successMessage = ref('');

    const tieneFechaSalida = computed(() => {
      if (!form.value?.regimen_codigo) return true;
      return regimenStore.tieneFechaSalida(form.value.regimen_codigo);
    });

    const toDateInput = (v?: string | null) => {
      if (!v) return '';
      return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : v.substring(0, 10);
    };

    const loadAreas = async (sedeId: string) => {
      try {
        const { data } = await areaService.getAll({ sede_id: sedeId });
        areas.value = data || [];
      } catch { areas.value = []; }
    };

    onMounted(async () => {
      try {
        await regimenStore.fetchRegimenes();
        const w = await workerStore.fetchWorkerById(workerId);
        if (!w) return;

        form.value = {
          dni: w.dni,
          nombre_completo: w.nombre_completo,
          area_id: w.area_id ?? null,
          regimen_codigo: w.regimen_codigo,
          fecha_ingreso: toDateInput(w.fecha_ingreso),
          fecha_salida: toDateInput(w.fecha_salida),
          sede_id: w.sede_id,
          estado: w.estado
        };

        await loadAreas(w.sede_id);
      } catch (err) {
        console.error(err);
      } finally {
        loadingData.value = false;
      }
    });

    const handleSubmit = async () => {
      if (!form.value) return;
      loading.value = true;
      error.value = '';
      successMessage.value = '';

      try {
        const payload = { ...form.value };
        if (!tieneFechaSalida.value) payload.fecha_salida = null;
        if (payload.area_id === null || payload.area_id === undefined) payload.area_id = null;

        await workerStore.updateWorker(workerId, payload);
        successMessage.value = '✅ Actualizado correctamente';
        setTimeout(() => router.push('/workers'), 1000);
      } catch (err: any) {
        error.value = err.response?.data?.error || 'Error al actualizar';
      } finally {
        loading.value = false;
      }
    };

    return {
      form, areas, loading, loadingData, error, successMessage,
      tieneFechaSalida, handleSubmit,
      sedeStore, regimenStore
    };
  }
});
</script>

<style scoped>
.input-field { @apply w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition; }
.btn-primary { @apply bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition disabled:opacity-50; }
.btn-secondary { @apply bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg shadow-sm transition; }
</style>