<script lang="ts">

  interface Props {
    title: string;
    subtitle?: string;
    icon?: string;
  }

</script>

<script lang="ts" setup>
  defineProps<Props>();
</script>

<template>
    <div class="flex gap-3 items-center">
      <div v-if="icon" class="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
        <UIcon :name="icon" class="text-lg text-primary" />
      </div>
      <div>
        <h3 class="font-semibold text-lg">{{ title }}</h3>
        <p class="text-sm text-gray-500">{{ subtitle }}</p>
      </div>
    </div>
</template>