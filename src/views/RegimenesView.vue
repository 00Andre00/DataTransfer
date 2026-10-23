<template>
  <div class="max-w-5xl mx-auto">
    <div class="bg-white shadow rounded-lg">
      <div class="px-6 py-4 border-b flex justify-between items-center">
        <h2 class="text-2xl font-bold text-gray-800">Regímenes Laborales</h2>
        <button @click="openForm()" class="btn-primary">
          <i class="fas fa-plus mr-2"></i>Nuevo Régimen
        </button>
      </div>

      <div v-if="loading" class="p-8 text-center">
        <i class="fas fa-spinner fa-spin text-blue-500 text-2xl"></i>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="th">Código</th>
              <th class="th">Nombre</th>
              <th class="th">Fecha salida</th>
              <th class="th text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="r in regimenStore.regimenes" :key="r.codigo" class="hover:bg-gray-50">
              <td class="td font-mono text-xs">{{ r.codigo }}</td>
              <td class="td">{{ r.nombre }}</td>
              <td class="td">
                <span :class="r.tiene_fecha_salida ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-700'"
                  class="px-2 py-1 text-xs rounded-full">
                  {{ r.tiene_fecha_salida ? 'Requerida' : 'Indeterminado' }}
                </span>
              </td>
              <td class="td text-right">
                <button @click="openForm(r)" class="text-blue-600 hover:text-blue-800 mr-3" title="Editar">
                  <i class="fas fa-edit"></i>
                </button>
                <button @click="confirmDelete(r)" class="text-red-600 hover:text-red-800" title="Eliminar">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div class="px-6 py-4 border-b flex justify-between items-center">
          <h3 class="text-lg font-bold">{{ editing ? 'Editar Régimen' : 'Nuevo Régimen' }}</h3>
          <button @click="closeForm" class="text-gray-500"><i class="fas fa-times"></i></button>
        </div>
        <form @submit.prevent="save" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Código *</label>
            <input v-model="form.codigo" type="text" class="input-field uppercase" required />
            <p v-if="editing" class="text-xs text-amber-600 mt-1">
              <i class="fas fa-exclamation-triangle mr-1"></i>
              Al cambiar el código se actualizarán automáticamente los trabajadores que lo usan.
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input v-model="form.nombre" type="text" class="input-field" required />
          </div>
          <div>
            <label class="flex items-center gap-2">
              <input type="checkbox" v-model="form.tiene_fecha_salida" />
              <span class="text-sm">Requiere fecha de salida</span>
            </label>
            <p class="text-xs text-gray-500 mt-1">
              Los regímenes indeterminados (276, 728, CAS indefinido) NO llevan fecha de fin.
            </p>
          </div>
          <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{{ error }}</div>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" @click="closeForm" class="btn-secondary">Cancelar</button>
            <button type="submit" :disabled="saving" class="btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { useRegimenStore } from '@/stores/regimenStore';
import { regimenService } from '@/services/workers';
import type { Regimen } from '@/types';

export default defineComponent({
  name: 'RegimenesView',
  setup() {
    const regimenStore = useRegimenStore();
    const loading = ref(false);
    const showForm = ref(false);
    const editing = ref(false);
    const saving = ref(false);
    const error = ref('');
    const originalCodigo = ref('');
    const form = ref<any>({ codigo: '', nombre: '', tiene_fecha_salida: false });

    const load = async () => {
      loading.value = true;
      try { await regimenStore.fetchRegimenes(); }
      finally { loading.value = false; }
    };

    const openForm = (r?: Regimen) => {
      error.value = '';
      if (r) {
        editing.value = true;
        originalCodigo.value = r.codigo;
        form.value = {
          codigo: r.codigo,
          nombre: r.nombre,
          tiene_fecha_salida: r.tiene_fecha_salida
        };
      } else {
        editing.value = false;
        originalCodigo.value = '';
        form.value = { codigo: '', nombre: '', tiene_fecha_salida: false };
      }
      showForm.value = true;
    };

    const closeForm = () => { showForm.value = false; error.value = ''; };

    const save = async () => {
      saving.value = true;
      error.value = '';
      try {
        if (editing.value) {
          const codigoActual = originalCodigo.value;
          const codigoNuevo = form.value.codigo.toUpperCase().trim();

          // 1) Si cambió el código → rename (con FK ON UPDATE CASCADE)
          if (codigoNuevo !== codigoActual) {
            await regimenService.rename(codigoActual, codigoNuevo);
          }

          // 2) Actualizar resto de campos con el código final
          await regimenService.update(codigoNuevo, {
            nombre: form.value.nombre,
            tiene_fecha_salida: form.value.tiene_fecha_salida
          });
        } else {
          await regimenService.create({
            codigo: form.value.codigo.toUpperCase().trim(),
            nombre: form.value.nombre,
            tiene_fecha_salida: form.value.tiene_fecha_salida
          });
        }
        await load();
        closeForm();
      } catch (err: any) {
        error.value = err.response?.data?.error || 'Error al guardar';
      } finally {
        saving.value = false;
      }
    };

    const confirmDelete = async (r: Regimen) => {
      try {
        const { data } = await regimenService.checkDelete(r.codigo);
        if (!data.canDelete) {
          alert(`No se puede eliminar. Hay ${data.workersCount} trabajadores con este régimen.`);
          return;
        }
        if (!confirm(`¿Eliminar el régimen "${r.nombre}"?`)) return;
        await regimenService.delete(r.codigo);
        await load();
      } catch (err: any) {
        alert(err.response?.data?.error || 'Error');
      }
    };

    onMounted(load);

    return { regimenStore, loading, showForm, editing, saving, error, form, openForm, closeForm, save, confirmDelete };
  }
});
</script>

<style scoped>
.th { @apply px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase; }
.td { @apply px-4 py-3 text-sm text-gray-700; }
.input-field { @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500; }
.btn-primary { @apply bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition disabled:opacity-50; }
.btn-secondary { @apply bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg shadow-sm transition; }
</style>