<script lang="ts">
  interface Props {
    icon?: string;
    title: string;
    description?: string;
  }
</script>

<script lang="ts" setup>
  withDefaults(defineProps<Props>(), {
    icon: "i-heroicons-information-circle",
    description: undefined,
    size: "md",
  });
</script>

<template>
  <UCard variant="soft">
    <template #default>
      <div class="text-center text-base py-4">
        <slot name="icon">
          <UIcon v-if="icon" :name="icon" class="text-5xl text-zinc-400/70" aria-hidden="true" />
        </slot>
        <div class="max-w-md mx-auto space-y-2">
          <h3 class="font-semibold tracking-tight text-xl">{{ title }}</h3>
          <p v-if="description" class="text-muted leading-relaxed text-sm md:text-base">
            {{ description }}
          </p>
        </div>
        <div v-if="$slots.default" class="mt-4 flex flex-wrap gap-2 justify-center">
          <slot />
        </div>
      </div>
    </template>
  </UCard>
</template>
