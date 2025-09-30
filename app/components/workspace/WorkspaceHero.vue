<script lang="ts" setup>
  import moment from "moment";
  import type { WorkspaceWithOwner } from "~~/shared/types/schema";

  interface Props {
    workspace: WorkspaceWithOwner;
    isOwner?: boolean;
  }

  const props = defineProps<Props>();
  const emit = defineEmits<{
    (e: "joined" | "left"): void;
  }>();

  const { $authFetch } = useNuxtApp();
  const toast = useToast();

  const creationDate = computed(() => moment(props.workspace.createdAt).fromNow());

  const joining = ref(false);
  const leaving = ref(false);

  const joinWorkspace = async () => {
    if (props.workspace.isJoined) {
      return;
    }

    joining.value = true;
    try {
      await $authFetch(`/api/workspaces/${props.workspace.id}/join`, { method: "POST" });
      toast.add({
        title: "Joined workspace",
        icon: "material-symbols:check-circle",
        description: `You have joined "${props.workspace.name}"`,
        color: "success",
      });
      emit("joined");
    } catch (error) {
      console.error("Failed to join workspace:", error);
      toast.add({
        title: "Failed to join workspace",
        icon: "material-symbols:error",
        description: "An error occurred. Please try again later.",
        color: "error",
      });
    } finally {
      joining.value = false;
    }
  };

  const leaveWorkspace = async () => {
    if (!props.workspace.isJoined || props.isOwner) return;
    leaving.value = true;
    try {
      await $authFetch(`/api/workspaces/${props.workspace.id}/leave`, { method: "POST" });
      toast.add({
        title: "Left workspace",
        icon: "material-symbols:logout",
        description: `You have left "${props.workspace.name}"`,
        color: "success",
      });
      emit("left");
    } catch (error) {
      console.error("Failed to leave workspace:", error);
    } finally {
      leaving.value = false;
    }
  };
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-start gap-6">
    <!-- Logo -->
    <div class="shrink-0">
      <WorkspaceLogo :name="workspace.name" :logo-url="workspace.logoUrl" size="xl" />
    </div>

    <!-- Title / Meta -->
    <div class="flex-1 min-w-0">
      <div class="flex flex-wrap items-center gap-3">
        <h1 class="font-semibold text-2xl leading-tight">{{ workspace.name }}</h1>
        <UBadge :color="workspace.isPublic ? 'primary' : 'neutral'" variant="subtle" size="sm">
          {{ workspace.isPublic ? "Public" : "Private" }}
        </UBadge>
      </div>
      <p class="text-sm text-muted mt-1">Created {{ creationDate }}</p>
      <p class="mt-4 text-base leading-relaxed whitespace-pre-line">{{ workspace.description }}</p>
    </div>

    <!-- Actions -->
    <div class="flex flex-row sm:flex-col gap-2 self-start">
      <UButton
        v-if="!workspace.isJoined"
        icon="material-symbols:login"
        label="Join"
        size="sm"
        variant="solid"
        :loading="joining"
        @click="joinWorkspace"
      />
      <UButton
        v-if="workspace.isJoined && !isOwner"
        icon="material-symbols:logout"
        label="Leave"
        size="sm"
        variant="ghost"
        color="primary"
        :loading="leaving"
        @click="leaveWorkspace"
      />
    </div>
  </div>
</template>
