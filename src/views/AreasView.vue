<template>
  <div class="max-w-5xl mx-auto">
    <div class="bg-white shadow rounded-lg">
      <div class="px-6 py-4 border-b flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">Áreas</h2>
          <p class="text-sm text-gray-500">
            {{ sedeStore.sedeActiva?.nombre || "Selecciona una sede" }}
          </p>
        </div>
        <button
          @click="openForm()"
          :disabled="!sedeStore.sedeActivaId"
          class="btn-primary"
        >
          <i class="fas fa-plus mr-2"></i>Nueva Área
        </button>
      </div>

      <div v-if="!sedeStore.sedeActivaId" class="p-8 text-center text-gray-500">
        Selecciona una sede para ver sus áreas
      </div>

      <div v-else-if="loading" class="p-8 text-center">
        <i class="fas fa-spinner fa-spin text-blue-500 text-2xl"></i>
      </div>

      <div v-else-if="areas.length > 0" class="divide-y">
        <div
          v-for="a in areas"
          :key="a.id"
          class="p-4 flex justify-between items-center hover:bg-gray-50"
        >
          <p class="font-medium text-gray-800">{{ a.nombre }}</p>
          <div>
            <button @click="openForm(a)" class="text-blue-600 hover:text-blue-800 mr-3">
              <i class="fas fa-edit"></i>
            </button>
            <button @click="confirmDelete(a)" class="text-red-600 hover:text-red-800">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>

      <div v-else class="p-8 text-center text-gray-500">
        No hay áreas en esta sede
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div class="px-6 py-4 border-b flex justify-between items-center">
          <h3 class="text-lg font-bold">{{ editing ? "Editar Área" : "Nueva Área" }}</h3>
          <button @click="closeForm" class="text-gray-500"><i class="fas fa-times"></i></button>
        </div>
        <form @submit.prevent="save" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input v-model="form.nombre" type="text" class="input-field" required />
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
import { defineComponent, ref, watch, onMounted } from "vue";
import { useSedeStore } from "@/stores/sedeStore";
import { areaService } from "@/services/workers";
import type { Area } from "@/types";

export default defineComponent({
  name: "AreasView",
  setup() {
    const sedeStore = useSedeStore();
    const areas = ref<Area[]>([]);
    const loading = ref(false);
    const showForm = ref(false);
    const editing = ref(false);
    const saving = ref(false);
    const error = ref("");
    const form = ref<any>({ id: null, nombre: "" });

    const load = async () => {
      if (!sedeStore.sedeActivaId) {
        areas.value = [];
        return;
      }
      loading.value = true;
      try {
        const { data } = await areaService.getAll({ sede_id: sedeStore.sedeActivaId });
        areas.value = data || [];
      } finally {
        loading.value = false;
      }
    };

    const openForm = (a?: Area) => {
      error.value = "";
      if (a) {
        editing.value = true;
        form.value = { id: a.id, nombre: a.nombre };
      } else {
        editing.value = false;
        form.value = { id: null, nombre: "" };
      }
      showForm.value = true;
    };

    const closeForm = () => {
      showForm.value = false;
      error.value = "";
    };

    const save = async () => {
      saving.value = true;
      error.value = "";
      try {
        if (editing.value) {
          if (!form.value.id) throw new Error("ID de área no encontrado");
          await areaService.update(form.value.id, { nombre: form.value.nombre });
        } else {
          await areaService.create({
            sede_id: sedeStore.sedeActivaId!,
            nombre: form.value.nombre
          });
        }
        await load();
        closeForm();
      } catch (err: any) {
        error.value = err.response?.data?.error || err.message || "Error";
      } finally {
        saving.value = false;
      }
    };

    const confirmDelete = async (a: Area) => {
      try {
        const { data } = await areaService.checkDelete(a.id);
        if (!data.canDelete) {
          alert(
            `No se puede eliminar. Tiene ${data.ticketsCount} tickets y ${data.usuariosCount} usuarios vinculados.`
          );
          return;
        }
        if (!confirm(`¿Eliminar "${a.nombre}"?`)) return;
        await areaService.delete(a.id);
        await load();
      } catch (err: any) {
        alert(err.response?.data?.error || "Error");
      }
    };

    onMounted(load);
    watch(() => sedeStore.sedeActivaId, load);

    return {
      sedeStore, areas, loading, showForm, editing, saving, error, form,
      openForm, closeForm, save, confirmDelete
    };
  }
});
</script>

<style scoped>
.input-field { @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500; }
.btn-primary { @apply bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition disabled:opacity-50; }
.btn-secondary { @apply bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg shadow-sm transition; }
</style>