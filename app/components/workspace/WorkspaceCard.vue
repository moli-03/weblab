<script lang="ts">
  import type { WorkspaceWithOwner } from "~~/shared/types/schema";
  import moment from "moment";

  interface Props {
    workspace: WorkspaceWithOwner;
  }

  interface Emits {
    (e: "workspace-joined" | "workspace-left", workspaceId: string): void;
  }
</script>

<script lang="ts" setup>
  const props = defineProps<Props>();
  const emit = defineEmits<Emits>();
  const { user } = useAuth();
  const { $authFetch } = useNuxtApp();

  const creationDate = computed(() => moment(props.workspace.createdAt).fromNow());

  const isOwner = computed(() => {
    return user.value?.id === props.workspace.ownerId;
  });

  const canLeave = computed(() => {
    return props.workspace.isJoined && !isOwner.value;
  });

  const joinWorkspace = async () => {
    try {
      await $authFetch(`/api/workspaces/${props.workspace.id}/join`, {
        method: "POST",
      });

      useToast().add({
        title: "Joined workspace",
        icon: "material-symbols:check-circle",
        description: `You have successfully joined the workspace "${props.workspace.name}".`,
        color: "success",
      });

      // Emit event to parent component to refresh the workspace list
      emit("workspace-joined", props.workspace.id);

      // Navigate to the workspace
      await navigateTo(`/workspaces/${props.workspace.slug}`);
    } catch (error) {
      console.error("Failed to join workspace:", error);
      useToast().add({
        title: "Failed to join workspace",
        icon: "material-symbols:error",
        description: `An error occurred while trying to join the workspace "${props.workspace.name}". Please try again later.`,
        color: "error",
      });
    }
  };

  const leaveWorkspace = async () => {
    try {
      await $authFetch(`/api/workspaces/${props.workspace.id}/leave`, {
        method: "POST",
      });

      // Emit event to parent component to refresh the workspace list
      emit("workspace-left", props.workspace.id);
    } catch (error) {
      console.error("Failed to leave workspace:", error);
      // You could add a toast notification here
    }
  };
</script>

<template>
  <UCard variant="soft">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <!-- Logo -->
        <WorkspaceLogo
          :name="workspace.name"
          :logo-url="workspace.logoUrl"
          size="md"
          image-size-class="size-14"
          rounded="rounded-lg"
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
          <p class="text-sm text-gray-300 mt-2 line-clamp-2">
            {{ workspace.description }}
          </p>
        </div>
      </div>
      <div class="flex flex-col items-end gap-2">
        <span class="text-xs text-muted">Created {{ creationDate }}</span>
        <div class="flex gap-2 order-1 sm:order-2">
          <template v-if="workspace.isJoined">
            <UButton
              size="xs"
              variant="solid"
              icon="material-symbols:open-in-new"
              label="Open"
              :to="`/workspaces/${workspace.slug}`"
            />
            <UButton
              v-if="canLeave"
              size="xs"
              variant="ghost"
              icon="material-symbols:logout"
              label="Leave"
              @click="leaveWorkspace"
            />
          </template>
          <UButton
            v-else
            size="xs"
            variant="subtle"
            icon="material-symbols:login"
            label="Join workspace"
            @click="joinWorkspace"
          />
        </div>
      </div>
    </div>
  </UCard>
</template>
