<script lang="ts" setup>
  import { initials } from "~~/shared/utils/initials";

  interface Props {
    name: string;
    logoUrl?: string | null;
    size?: SizeKey;
  }

  const props = withDefaults(defineProps<Props>(), {
    logoUrl: null,
    size: "md",
  });

  const sizeMap = {
    sm: { placeholder: "size-8", text: "text-xs", rounded: "rounded-md" },
    md: { placeholder: "size-12", text: "text-sm", rounded: "rounded-md" },
    lg: { placeholder: "size-16", text: "text-lg", rounded: "rounded-lg" },
    xl: { placeholder: "size-20", text: "text-2xl", rounded: "rounded-xl" },
  } as const;

  type SizeKey = keyof typeof sizeMap;

  const sizeConf = computed(() => {
    return sizeMap[props.size] ?? sizeMap["md"];
  });

  const placeholderClasses = computed(() =>
    [
      sizeConf.value.placeholder,
      sizeConf.value.rounded,
      "flex items-center justify-center bg-primary-100 bg-primary-900/40",
      "text-primary-600 text-primary-300 font-semibold select-none",
      sizeConf.value.text,
    ].join(" "),
  );

  const imageClasses = computed(() =>
    [sizeConf.value.placeholder, sizeConf.value.rounded, "object-contain object-center"].join(" "),
  );

  const workspaceInitials = computed(() => initials(props.name));
</script>

<template>
  <div>
    <div v-if="!logoUrl" :class="placeholderClasses">{{ workspaceInitials }}</div>
    <img v-else :src="logoUrl" :alt="`${name} logo`" :class="imageClasses" />
  </div>
</template>
