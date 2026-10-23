<template>
  <div class="max-w-6xl mx-auto">
    <div class="bg-white shadow rounded-lg">
      <div class="px-6 py-4 border-b flex justify-between items-center">
        <h2 class="text-2xl font-bold text-gray-800">Usuarios del Sistema</h2>
        <button @click="openForm()" class="btn-primary">
          <i class="fas fa-plus mr-2"></i>Nuevo Usuario
        </button>
      </div>

      <div v-if="loading" class="p-8 text-center">
        <i class="fas fa-spinner fa-spin text-blue-500 text-2xl"></i>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="th">Usuario</th>
              <th class="th">Nombre</th>
              <th class="th">Rol</th>
              <th class="th">Sede</th>
              <th class="th">Área</th>
              <th class="th text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="u in users" :key="u.id" class="hover:bg-gray-50">
              <td class="td font-mono">{{ u.username }}</td>
              <td class="td">{{ u.nombre }}</td>
              <td class="td">
                <span :class="rolBadge(u.rol)" class="px-2 py-1 text-xs rounded-full">
                  {{ rolLabel(u.rol) }}
                </span>
              </td>
              <td class="td">{{ u.sede_nombre || '-' }}</td>
              <td class="td">{{ u.area_nombre || '-' }}</td>
              <td class="td text-right">
                <button @click="openForm(u)" class="text-blue-600 hover:text-blue-800 mr-3">
                  <i class="fas fa-edit"></i>
                </button>
                <button @click="confirmDelete(u)" :disabled="u.username === 'admin'"
                  class="text-red-600 hover:text-red-800 disabled:opacity-30">
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
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div class="px-6 py-4 border-b flex justify-between items-center">
          <h3 class="text-lg font-bold">{{ editing ? 'Editar Usuario' : 'Nuevo Usuario' }}</h3>
          <button @click="closeForm" class="text-gray-500"><i class="fas fa-times"></i></button>
        </div>
        <form @submit.prevent="save" class="p-6 space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Username *</label>
              <input v-model="form.username" type="text" class="input-field" required :disabled="editing" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Password {{ editing ? '(dejar vacío para no cambiar)' : '*' }}
              </label>
              <input v-model="form.password" type="password" class="input-field" :required="!editing" />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
              <input v-model="form.nombre" type="text" class="input-field" required />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
              <select v-model="form.rol" class="input-field" required @change="onRolChange">
                <option value="admin">Admin</option>
                <option value="encargado">Encargado</option>
                <option value="rrhh">RRHH</option>
                <option value="area_user">Área</option>
              </select>
            </div>
            <div v-if="rolRequiereSede">
              <label class="block text-sm font-medium text-gray-700 mb-1">Sede *</label>
              <select v-model="form.sede_id" class="input-field" required @change="onSedeChange">
                <option value="">Seleccione</option>
                <option v-for="s in sedeStore.sedes" :key="s.id" :value="s.id">{{ s.nombre }}</option>
              </select>
            </div>
            <div v-if="rolRequiereArea" class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Área *</label>
              <select v-model="form.area_id" class="input-field" required>
                <option value="">Seleccione un área</option>
                <option v-for="a in areasDisponibles" :key="a.id" :value="a.id">{{ a.nombre }}</option>
              </select>
              <p v-if="form.rol === 'rrhh'" class="text-xs text-gray-500 mt-1">
                El usuario de RRHH pertenece al área RRHH.
              </p>
            </div>
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
import { defineComponent, ref, computed, onMounted } from 'vue';
import { useSedeStore } from '@/stores/sedeStore';
import { userService, areaService } from '@/services/workers';
import type { User, Area } from '@/types';

export default defineComponent({
  name: 'UsersView',
  setup() {
    const sedeStore = useSedeStore();
    const users = ref<User[]>([]);
    const areasDisponibles = ref<Area[]>([]);
    const loading = ref(false);
    const showForm = ref(false);
    const editing = ref(false);
    const saving = ref(false);
    const error = ref('');
    const form = ref<any>({
      id: null,
      username: '',
      password: '',
      nombre: '',
      rol: 'area_user',
      sede_id: '',
      area_id: ''
    });

    // rrhh y area_user SIEMPRE tienen sede
    const rolRequiereSede = computed(() =>
      ['rrhh', 'area_user'].includes(form.value.rol)
    );

    // rrhh y area_user SIEMPRE tienen área
    const rolRequiereArea = computed(() =>
      ['rrhh', 'area_user'].includes(form.value.rol)
    );

    const rolBadge = (rol: string) => ({
      admin: 'bg-purple-100 text-purple-800',
      encargado: 'bg-indigo-100 text-indigo-800',
      rrhh: 'bg-blue-100 text-blue-800',
      area_user: 'bg-green-100 text-green-800'
    }[rol] || 'bg-gray-100');

    const rolLabel = (rol: string) => ({
      admin: 'Admin',
      encargado: 'Encargado',
      rrhh: 'RRHH',
      area_user: 'Área'
    }[rol] || rol);

    const load = async () => {
      loading.value = true;
      try {
        const { data } = await userService.getAll();
        users.value = data || [];
      } finally {
        loading.value = false;
      }
    };

    const loadAreas = async () => {
      if (!form.value.sede_id) { areasDisponibles.value = []; return; }
      const { data } = await areaService.getAll({ sede_id: form.value.sede_id });
      areasDisponibles.value = data || [];
    };

    const onRolChange = () => {
      if (!rolRequiereSede.value) {
        // admin y encargado no tienen sede ni área
        form.value.sede_id = '';
        form.value.area_id = '';
        areasDisponibles.value = [];
      }
    };

    const onSedeChange = () => {
      form.value.area_id = '';
      loadAreas();
    };

    const openForm = async (u?: User) => {
      error.value = '';
      if (u) {
        editing.value = true;
        form.value = {
          id: u.id,
          username: u.username,
          password: '',
          nombre: u.nombre,
          rol: u.rol,
          sede_id: u.sede_id || '',
          area_id: u.area_id || ''
        };
        if (u.sede_id) await loadAreas();
      } else {
        editing.value = false;
        form.value = {
          id: null,
          username: '',
          password: '',
          nombre: '',
          rol: 'area_user',
          sede_id: '',
          area_id: ''
        };
        areasDisponibles.value = [];
      }
      showForm.value = true;
    };

    const closeForm = () => { showForm.value = false; error.value = ''; };

    const save = async () => {
      saving.value = true;
      error.value = '';
      try {
        const payload: any = { ...form.value };
        delete payload.id;

        if (editing.value && !payload.password) delete payload.password;

        // admin y encargado no tienen sede ni área
        if (payload.rol === 'admin' || payload.rol === 'encargado') {
          payload.sede_id = null;
          payload.area_id = null;
        }

        // rrhh y area_user SIEMPRE tienen sede y área
        if (payload.rol === 'rrhh' || payload.rol === 'area_user') {
          if (!payload.sede_id) throw new Error('Debe seleccionar una sede');
          if (!payload.area_id) throw new Error('Debe seleccionar un área');
        }

        if (editing.value) {
          await userService.update(form.value.id, payload);
        } else {
          await userService.create(payload);
        }
        await load();
        closeForm();
      } catch (err: any) {
        error.value = err.response?.data?.error || err.message || 'Error';
      } finally {
        saving.value = false;
      }
    };

    const confirmDelete = async (u: User) => {
      if (!confirm(`¿Eliminar al usuario "${u.username}"?`)) return;
      try {
        await userService.delete(u.id);
        await load();
      } catch (err: any) {
        alert(err.response?.data?.error || 'Error');
      }
    };

    onMounted(async () => {
      await Promise.all([sedeStore.fetchSedes(), load()]);
    });

    return {
      sedeStore, users, areasDisponibles, loading, showForm, editing, saving, error,
      form, rolRequiereSede, rolRequiereArea, rolBadge, rolLabel,
      onRolChange, onSedeChange,
      openForm, closeForm, save, confirmDelete
    };
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