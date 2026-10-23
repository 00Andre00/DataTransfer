<template>
  <div class="flex items-center justify-center py-20">
    <i class="fas fa-spinner fa-spin text-blue-500 text-3xl"></i>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export default defineComponent({
  name: 'RedirectView',
  setup() {
    const route = useRoute();
    const router = useRouter();

    onMounted(() => {
      const to = route.query.to as string || '/dashboard';
      router.replace(to);
    });

    return {};
  }
});
</script>