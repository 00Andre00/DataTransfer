<template>
  <div class="max-w-5xl mx-auto">
    <div class="bg-white shadow rounded-lg">
      <div class="px-6 py-4 border-b flex justify-between items-center">
        <h2 class="text-2xl font-bold text-gray-800">Sedes</h2>
        <button @click="openForm()" class="btn-primary">
          <i class="fas fa-plus mr-2"></i>Nueva Sede
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="th">ID</th>
              <th class="th">Nombre</th>
              <th class="th">Código</th>
              <th class="th">Estado</th>
              <th class="th text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="s in sedeStore.sedes" :key="s.id" class="hover:bg-gray-50">
              <td class="td font-mono">{{ s.id }}</td>
              <td class="td font-medium">{{ s.nombre }}</td>
              <td class="td">{{ s.codigo || '-' }}</td>
              <td class="td">
                <span :class="s.activa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                  class="px-2 py-1 text-xs rounded-full">
                  {{ s.activa ? 'Activa' : 'Inactiva' }}
                </span>
              </td>
              <td class="td text-right">
                <button @click="openForm(s)" class="text-blue-600 hover:text-blue-800 mr-3">
                  <i class="fas fa-edit"></i>
                </button>
                <button @click="confirmDelete(s)" class="text-red-600 hover:text-red-800">
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
          <h3 class="text-lg font-bold">{{ editing ? 'Editar Sede' : 'Nueva Sede' }}</h3>
          <button @click="closeForm" class="text-gray-500"><i class="fas fa-times"></i></button>
        </div>
        <form @submit.prevent="save" class="p-6 space-y-4">
          <div v-if="!editing">
            <label class="block text-sm font-medium text-gray-700 mb-1">ID *</label>
            <input v-model="form.id" type="text" class="input-field uppercase" required
              placeholder="Ej: GORE, DRTC, OTRO" :disabled="editing" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input v-model="form.nombre" type="text" class="input-field" required />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Código</label>
            <input v-model="form.codigo" type="text" class="input-field uppercase" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input v-model="form.direccion" type="text" class="input-field" />
          </div>
          <div v-if="editing">
            <label class="flex items-center gap-2">
              <input type="checkbox" v-model="form.activa" />
              <span class="text-sm">Sede activa</span>
            </label>
          </div>
          <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {{ error }}
          </div>
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
import { useSedeStore } from '@/stores/sedeStore';
import { sedeService } from '@/services/workers';
import type { Sede } from '@/types';

export default defineComponent({
  name: 'SedesView',
  setup() {
    const sedeStore = useSedeStore();
    const showForm = ref(false);
    const editing = ref(false);
    const saving = ref(false);
    const error = ref('');
    const form = ref<any>({ id: '', nombre: '', codigo: '', direccion: '', activa: true });

    const openForm = (s?: Sede) => {
      error.value = '';
      if (s) {
        editing.value = true;
        form.value = { ...s };
      } else {
        editing.value = false;
        form.value = { id: '', nombre: '', codigo: '', direccion: '', activa: true };
      }
      showForm.value = true;
    };

    const closeForm = () => { showForm.value = false; error.value = ''; };

    const save = async () => {
      saving.value = true;
      error.value = '';
      try {
        if (editing.value) {
          await sedeService.update(form.value.id, form.value);
        } else {
          await sedeService.create(form.value);
        }
        await sedeStore.fetchSedes();
        closeForm();
      } catch (err: any) {
        error.value = err.response?.data?.error || 'Error al guardar';
      } finally {
        saving.value = false;
      }
    };

    const confirmDelete = async (s: Sede) => {
      try {
        const { data } = await sedeService.checkDelete(s.id);
        if (!data.canDelete) {
          const deps = [];
          if (data.workersCount) deps.push(`${data.workersCount} trabajadores`);
          if (data.areasCount) deps.push(`${data.areasCount} áreas`);
          if (data.usuariosCount) deps.push(`${data.usuariosCount} usuarios`);
          if (data.ticketsCount) deps.push(`${data.ticketsCount} tickets`);
          alert(`No se puede eliminar. La sede tiene: ${deps.join(', ')}`);
          return;
        }
        if (!confirm(`¿Eliminar la sede "${s.nombre}"?`)) return;
        await sedeService.delete(s.id);
        await sedeStore.fetchSedes();
      } catch (err: any) {
        alert(err.response?.data?.error || 'Error');
      }
    };

    onMounted(() => { if (!sedeStore.sedes.length) sedeStore.fetchSedes(); });

    return { sedeStore, showForm, editing, saving, error, form, openForm, closeForm, save, confirmDelete };
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