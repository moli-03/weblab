<script lang="ts" setup>
  import type { Technology } from "~~/shared/types/schema";
  import moment from "moment";
  import { initials } from "~~/shared/utils/initials";

  interface Props {
    technology: Technology;
    editable?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
    editable: false,
  });

  const emit = defineEmits<{
    /** Fired when the edit or delete button is clicked */
    (e: "edit" | "delete", technology: Technology): void;
  }>();

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
  // Delete confirmation dialog state
  const confirmDeleteOpen = ref(false);
  function requestDelete() {
    confirmDeleteOpen.value = true;
  }
  function cancelDelete() {
    confirmDeleteOpen.value = false;
  }
  function confirmDelete() {
    emit("delete", props.technology);
    confirmDeleteOpen.value = false;
  }
</script>

<template>
  <UCard variant="soft">
    <div class="flex items-start gap-3 relative">
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
          <h3 class="font-semibold leading-tight" :title="technology.name">{{ technology.name }}</h3>
          <UTooltip v-if="technology.ring" :text="technology.ringDescription || technology.ring">
            <UBadge
              :color="ringColor"
              size="sm"
              variant="soft"
              :label="technology.ring"
              class="capitalize cursor-help"
            />
          </UTooltip>
          <div v-if="props.editable" class="flex items-center gap-1 ml-auto">
            <UButton
              size="xs"
              variant="ghost"
              color="primary"
              icon="material-symbols:edit"
              aria-label="Edit technology"
              @click="emit('edit', technology)"
            />
            <UButton
              size="xs"
              variant="ghost"
              color="error"
              icon="material-symbols:delete"
              aria-label="Delete technology"
              @click="requestDelete"
            />
          </div>
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
  <!-- Delete confirmation modal -->
  <UModal :open="confirmDeleteOpen" :ui="{ footer: 'justify-end' }">
    <template #header>
      <ModalHeader title="Delete technology" icon="material-symbols:delete" />
    </template>
    <template #body>
      <p class="text-sm text-muted leading-relaxed">
        Are you sure you want to delete <span class="font-bold">{{ technology.name }}</span
        >? This action cannot be undone.
      </p>
    </template>
    <template #footer>
      <UButton variant="ghost" label="Cancel" icon="material-symbols:close" @click="cancelDelete" />
      <UButton variant="solid" color="error" label="Delete" icon="material-symbols:delete" @click="confirmDelete" />
    </template>
  </UModal>
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
