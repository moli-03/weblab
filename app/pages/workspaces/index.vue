<script lang="ts" setup>
  const { setActiveRoute } = useNavigation();
  setActiveRoute("your-workspaces");

  const {
    data: workspaces,
    status,
    refresh,
  } = useAuthFetch("/api/workspaces?joined=true", {
    transform: data => data.entries,
  });
</script>

<template>
  <UContainer class="max-w-3xl py-12">
    <div class="mb-6">
      <div class="flex items-center gap-2 flex-wrap">
        <h1 class="text-2xl font-semibold">Your workspaces</h1>
      </div>
      <p class="mt-1 text-sm text-muted">Manage your existing workspaces or create a new one.</p>
    </div>

    <!-- Skeleton loader -->
    <div v-if="status === 'pending'" class="space-y-3">
      <USkeleton v-for="i in 4" :key="i" class="h-20" />
    </div>
    <AppEmptyState
      v-else-if="!workspaces || workspaces.length === 0"
      icon="i-heroicons-rectangle-stack"
      title="No workspaces yet"
      description="Create your first workspace to start tracking technologies and decisions."
    >
      <WorkspaceCreateModal @created="refresh()" />
    </AppEmptyState>
    <div v-else class="space-y-3">
      <WorkspaceCard
        v-for="workspace in workspaces"
        :key="workspace.id"
        :workspace="workspace"
        @workspace-joined="refresh()"
        @workspace-left="refresh()"
      />

      <WorkspaceCreateModal @created="refresh()" />
    </div>
  </UContainer>
</template>
