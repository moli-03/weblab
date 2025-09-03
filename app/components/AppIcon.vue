<script lang="ts">
  type Size = "sm" | "md" | "lg" | "xl";

  interface Props {
    size?: Size;
  }
</script>

<script lang="ts" setup>
  const props = withDefaults(defineProps<Props>(), {
    size: "md",
  });

  const sizeClasses = {
    sm: "w-8 text-2xl rounded-xl",
    md: "w-12 text-4xl rounded-2xl",
    lg: "w-16 text-5xl rounded-2xl",
    xl: "w-24 text-7xl rounded-3xl",
  };
</script>

<template>
  <div
    :class="[
      'flex items-center justify-center aspect-square bg-gradient-to-br from-sky-700 to-sky-400 shadow-lg',
      sizeClasses[props.size],
    ]"
  >
    <UIcon name="material-symbols:radar" class="text-white" />
  </div>
</template>
