<script lang="ts">
  import type { WorkspaceWithOwner } from "~~/shared/types/schema";
  import moment from "moment";

  interface Props {
    workspace: WorkspaceWithOwner;
  }
</script>

<script lang="ts" setup>
  const props = defineProps<Props>();

  const creationDate = computed(() => moment(props.workspace.createdAt).fromNow());
</script>

<template>
  <UCard variant="soft">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <!-- Logo -->
        <div
          v-if="!workspace.logoUrl"
          class="size-12 flex items-center justify-center rounded-md bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-300 font-semibold text-sm"
        >
          {{ workspace.name.slice(0, 2).toUpperCase() }}
        </div>
        <img
          v-else
          :src="workspace.logoUrl"
          alt="Workspace Logo"
          class="rounded-lg size-14 object-contain object-center"
        />

        <!-- Title and stuff -->
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <h2 class="font-medium truncate text-base">{{ workspace.name }}</h2>
            <UBadge :color="workspace.isPublic ? 'primary' : 'neutral'" size="sm" variant="subtle">
              {{ workspace.isPublic ? "Public" : "Private" }}
            </UBadge>
          </div>
          <p class="text-xs text-muted truncate">Owned by {{ workspace.owner.name }}</p>
          <p class="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
            {{ workspace.description }}
          </p>
        </div>
      </div>
      <div class="flex flex-col items-end gap-2">
        <span class="text-xs text-muted">Created {{ creationDate }}</span>
        <div class="flex gap-2 order-1 sm:order-2">
          <UButton size="xs" variant="subtle" icon="material-symbols:login" label="Join workspace" />
        </div>
      </div>
    </div>
  </UCard>
</template>
