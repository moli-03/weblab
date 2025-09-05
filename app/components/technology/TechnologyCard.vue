<script lang="ts" setup>
  import type { Technology } from "~~/shared/types/schema";
  import moment from "moment";
  import { initials } from "~~/shared/utils/initials";

  interface Props {
    technology: Technology;
  }

  const props = defineProps<Props>();

  const ringColor = computed(() => {
    switch (props.technology.ring) {
      case "adopt":
        return "success";
      case "trial":
        return "primary";
      case "assess":
        return "warning";
      case "hold":
        return "neutral";
      default:
        return "neutral";
    }
  });

  // Track if logo failed to load so we can fallback to initials
  const logoError = ref(false);
  const showLogo = computed(() => props.technology.logoUrl && !logoError.value);

  const createdRelative = computed(() => moment(props.technology.createdAt).fromNow());
  const publishedRelative = computed(() =>
    props.technology.publishedAt ? moment(props.technology.publishedAt).fromNow() : null,
  );
</script>

<template>
  <UCard variant="soft">
    <div class="flex items-start gap-3">
      <div
        :class="[
          'w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden shrink-0',
          showLogo ? 'bg-transparent' : 'bg-zinc-800',
        ]"
      >
        <img
          v-if="showLogo"
          :src="technology.logoUrl || undefined"
          :alt="technology.name"
          class="w-full h-full object-cover"
          @error="logoError = true"
        />
        <span v-else class="text-sm font-semibold uppercase tracking-wide">{{ initials(technology.name) }}</span>
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2 flex-wrap">
          <h3 class="font-semibold leading-tight truncate" :title="technology.name">{{ technology.name }}</h3>
          <UTooltip v-if="technology.ring" :text="technology.ringDescription || technology.ring">
            <UBadge
              :color="ringColor"
              size="sm"
              variant="soft"
              :label="technology.ring"
              class="capitalize cursor-help"
            />
          </UTooltip>
        </div>
        <p class="text-xs text-muted mt-0.5 capitalize flex items-center gap-1">
          {{ technology.category }}
        </p>
      </div>
    </div>
    <p class="text-sm text-muted mt-3 line-clamp-4 leading-relaxed">{{ technology.description }}</p>
    <div class="mt-auto pt-3">
      <div class="flex items-center justify-between text-[11px] text-muted tracking-wide">
        <UBadge
          :color="technology.status === 'draft' ? 'warning' : 'success'"
          size="sm"
          variant="subtle"
          :label="technology.status === 'draft' ? 'Draft' : 'Published'"
          class="flex items-center gap-1 font-medium"
        >
          <template #leading>
            <UIcon :name="technology.status === 'draft' ? 'material-symbols:draft' : 'material-symbols:public'" />
          </template>
        </UBadge>
        <span v-if="publishedRelative" class="inline-flex items-center gap-1 text-xs">
          <UIcon name="material-symbols:av-timer" class="text-base" /> {{ publishedRelative }}
        </span>
        <span v-else class="inline-flex items-center gap-1 text-xs">
          <UIcon name="material-symbols:schedule" class="text-base" /> {{ createdRelative }}
        </span>
      </div>
    </div>
  </UCard>
</template>

<style scoped>
  .line-clamp-4 {
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    line-clamp: 4;
    overflow: hidden;
  }
</style>
