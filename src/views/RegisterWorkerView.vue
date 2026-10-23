<template>
  <div class="max-w-3xl mx-auto">
    <div class="mb-6">
      <button @click="$router.push('/workers')" class="text-blue-600 hover:text-blue-800 mb-3 flex items-center gap-2 text-sm">
        <i class="fas fa-arrow-left"></i>Volver a la lista
      </button>
      <h1 class="text-2xl font-bold text-gray-800">Registrar Trabajador</h1>
      <p class="text-sm text-gray-500 mt-1">
        <span v-if="sedeStore.sedeActiva">Sede: {{ sedeStore.sedeActiva.nombre }}</span>
      </p>
    </div>

    <div class="bg-white shadow rounded-lg p-6">
      <form @submit.prevent="handleSubmit" class="space-y-5">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <!-- DNI -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">DNI *</label>
            <input v-model="form.dni" type="text" maxlength="8" placeholder="8 dígitos"
              class="input-field" :class="{ 'border-red-500': errors.dni }"
              @input="form.dni = form.dni.replace(/[^0-9]/g, '')" required />
            <p v-if="errors.dni" class="text-sm text-red-600 mt-1">{{ errors.dni }}</p>
          </div>

          <!-- Nombre completo -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
            <input v-model="form.nombre_completo" type="text"
              placeholder="Nombres y apellidos" class="input-field" required />
          </div>

          <!-- Área (select desde areas de la sede) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Área</label>
            <select v-model="form.area_id" class="input-field">
              <option :value="null">Sin área</option>
              <option v-for="a in areas" :key="a.id" :value="a.id">
                {{ a.nombre }}
              </option>
            </select>
          </div>

          <!-- Régimen -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Régimen *</label>
            <select v-model="form.regimen_codigo" class="input-field" required
              @change="onRegimenChange">
              <option value="">Seleccione</option>
              <option v-for="r in regimenStore.regimenes" :key="r.codigo" :value="r.codigo">
                {{ r.nombre }}
              </option>
            </select>
          </div>

          <!-- Fecha ingreso -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Fecha de ingreso *</label>
            <input v-model="form.fecha_ingreso" type="date" class="input-field" required />
          </div>

          <!-- Fecha salida (bloqueada si régimen lo requiere) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Fecha de salida
              <span v-if="!tieneFechaSalida" class="text-xs text-gray-500 italic">
                (indeterminado)
              </span>
            </label>
            <input v-model="form.fecha_salida" type="date" class="input-field"
              :disabled="!tieneFechaSalida"
              :class="{ 'bg-gray-100 cursor-not-allowed': !tieneFechaSalida }" />
            <p v-if="!tieneFechaSalida" class="text-xs text-gray-500 mt-1">
              Este régimen no tiene fecha de fin (contrato indeterminado).
            </p>
          </div>

          <!-- Estado -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
            <select v-model="form.estado" class="input-field" required>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
        </div>

        <!-- Botones -->
        <div class="flex justify-end gap-3 pt-4 border-t">
          <button type="button" @click="$router.push('/workers')" class="btn-secondary">
            Cancelar
          </button>
          <button type="submit" :disabled="loading" class="btn-primary">
            <span v-if="loading"><i class="fas fa-spinner fa-spin mr-2"></i>Guardando...</span>
            <span v-else><i class="fas fa-save mr-2"></i>Registrar</span>
          </button>
        </div>
      </form>

      <!-- Mensajes -->
      <div v-if="error" class="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
        {{ error }}
      </div>
      <div v-if="successMessage" class="mt-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
        {{ successMessage }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useWorkerStore } from '@/stores/workerStore';
import { useSedeStore } from '@/stores/sedeStore';
import { useRegimenStore } from '@/stores/regimenStore';
import { useAuth } from '@/composables/useAuth';
import { areaService } from '@/services/workers';
import type { WorkerForm, Area } from '@/types';

export default defineComponent({
  name: 'RegisterWorkerView',
  setup() {
    const router = useRouter();
    const workerStore = useWorkerStore();
    const sedeStore = useSedeStore();
    const regimenStore = useRegimenStore();
    const { currentUser } = useAuth();

    const areas = ref<Area[]>([]);
    const loading = ref(false);
    const error = ref('');
    const successMessage = ref('');
    const errors = ref<Record<string, string>>({});

    const form = ref<WorkerForm>({
      dni: '',
      nombre_completo: '',
      area_id: null,
      regimen_codigo: '',
      fecha_ingreso: new Date().toISOString().split('T')[0],
      fecha_salida: null,
      sede_id: '',
      estado: 'activo'
    });

    const tieneFechaSalida = computed(() => {
      if (!form.value.regimen_codigo) return true;
      return regimenStore.tieneFechaSalida(form.value.regimen_codigo);
    });

    watch(tieneFechaSalida, (val) => {
      if (!val) form.value.fecha_salida = null;
    });

    const onRegimenChange = () => {
      if (!tieneFechaSalida.value) form.value.fecha_salida = null;
    };

    const getSedeId = (): string => {
      if (currentUser.value?.rol === 'rrhh' && currentUser.value.sede_id) {
        return currentUser.value.sede_id;
      }
      return sedeStore.sedeActivaId || '';
    };

    const loadAreas = async () => {
      const sedeId = getSedeId();
      if (!sedeId) { areas.value = []; return; }
      try {
        const { data } = await areaService.getAll({ sede_id: sedeId });
        areas.value = data || [];
      } catch { areas.value = []; }
    };

    const validate = () => {
      errors.value = {};
      if (!/^\d{8}$/.test(form.value.dni)) errors.value.dni = 'DNI debe tener 8 dígitos';
      return Object.keys(errors.value).length === 0;
    };

    const handleSubmit = async () => {
      if (!validate()) return;
      const sedeId = getSedeId();
      if (!sedeId) {
        error.value = 'Debe seleccionar una sede antes de continuar';
        return;
      }

      loading.value = true;
      error.value = '';
      successMessage.value = '';

      try {
        const payload: WorkerForm = { ...form.value, sede_id: sedeId };
        if (!tieneFechaSalida.value) payload.fecha_salida = null;
        if (payload.area_id === null || payload.area_id === undefined) payload.area_id = null;

        await workerStore.createWorker(payload);
        successMessage.value = '✅ Trabajador registrado correctamente';
        setTimeout(() => router.push('/workers'), 1200);
      } catch (err: any) {
        error.value = err.response?.data?.error || 'Error al registrar';
      } finally {
        loading.value = false;
      }
    };

    onMounted(async () => {
      await Promise.all([
        regimenStore.fetchRegimenes(),
        loadAreas()
      ]);
    });

    watch(() => sedeStore.sedeActivaId, loadAreas);

    return {
      sedeStore, regimenStore,
      form, areas, loading, error, successMessage, errors,
      tieneFechaSalida, onRegimenChange, handleSubmit
    };
  }
});
</script>

<style scoped>
.input-field { @apply w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition; }
.btn-primary { @apply bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition disabled:opacity-50; }
.btn-secondary { @apply bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg shadow-sm transition; }
</style>