// src/stores/workerStore.ts
import { defineStore } from 'pinia';
import { workerService } from '@/services/workers';
import type {
  WorkerState,
  Worker,
  WorkerForm
} from '@/types';

export const useWorkerStore = defineStore('workers', {
  state: (): WorkerState => ({
    workers: [],
    currentWorker: null,
    workerHistory: [],
    loading: false,
    error: null
  }),

  getters: {
    activeWorkers: (state): Worker[] =>
      state.workers.filter(w => w.estado === 'activo'),

    workersBySede: (state) => (sedeId: string): Worker[] =>
      state.workers.filter(w => w.sede_id === sedeId),
  },

  actions: {
    async fetchWorkers(params?: { sede_id?: string }) {
      this.loading = true;
      this.error = null;
      try {
        const response = await workerService.getAll(params);
        this.workers = response.data || [];
      } catch (error: any) {
        this.error = error.response?.data?.error || 'Error al obtener trabajadores';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchWorkerById(id: number) {
      this.loading = true;
      this.error = null;
      try {
        const response = await workerService.getById(id);
        this.currentWorker = response.data || null;
        return this.currentWorker;
      } catch (error: any) {
        this.error = error.response?.data?.error || 'Error al obtener trabajador';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async createWorker(data: WorkerForm) {
      this.loading = true;
      this.error = null;
      try {
        const response = await workerService.create(data);
        const newWorker = response.data;
        if (newWorker) this.workers.unshift(newWorker);
        return newWorker;
      } catch (error: any) {
        this.error = error.response?.data?.error || 'Error al crear trabajador';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateWorker(id: number, data: Partial<WorkerForm>) {
      this.loading = true;
      this.error = null;
      try {
        const response = await workerService.update(id, data);
        const updated = response.data;
        if (updated) {
          const index = this.workers.findIndex(w => w.id === id);
          if (index !== -1) this.workers[index] = updated;
          if (this.currentWorker?.id === id) this.currentWorker = updated;
        }
        return updated;
      } catch (error: any) {
        this.error = error.response?.data?.error || 'Error al actualizar trabajador';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteWorker(id: number) {
      this.loading = true;
      this.error = null;
      try {
        await workerService.delete(id);
        this.workers = this.workers.filter(w => w.id !== id);
      } catch (error: any) {
        this.error = error.response?.data?.error || 'Error al eliminar trabajador';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchSedeHistory(workerId: number) {
      this.loading = true;
      this.error = null;
      try {
        const response = await workerService.getSedeHistory(workerId);
        this.workerHistory = response.data || [];
      } catch (error: any) {
        this.error = error.response?.data?.error || 'Error al obtener historial';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async changeSede(
      workerId: number,
      data: { sede_id: string; motivo_cambio?: string }
    ) {
      this.loading = true;
      this.error = null;
      try {
        const response = await workerService.changeSede(workerId, data);
        const updated = response.data;
        if (updated) {
          const index = this.workers.findIndex(w => w.id === workerId);
          if (index !== -1) this.workers[index] = updated;
          if (this.currentWorker?.id === workerId) this.currentWorker = updated;
        }
        return updated;
      } catch (error: any) {
        this.error = error.response?.data?.error || 'Error al cambiar sede';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    reset() {
      this.workers = [];
      this.currentWorker = null;
      this.workerHistory = [];
      this.error = null;
    }
  }
});