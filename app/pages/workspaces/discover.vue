<script lang="ts" setup>
  const {
    data: workspaces,
    error,
    refresh: execute,
    status,
  } = useAuthFetch("/api/workspaces", {
    transform: data => data.entries,
    deep: false,
  });
</script>

<template>
  <UContainer class="max-w-xl py-12">
    <header class="mb-6">
      <div class="flex items-center gap-2 flex-wrap">
        <h1 class="text-2xl font-semibold">Discover workspaces</h1>
      </div>
      <p class="mt-1 text-sm text-muted">Public workspaces from the community.</p>
    </header>

    <UAlert
      v-if="error"
      icon="i-heroicons-exclamation-triangle"
      title="Failed to load workspaces."
      description="Workspaces could not be loaded. Please try again later."
      color="error"
      orientation="horizontal"
      variant="subtle"
      :actions="[
        {
          icon: 'material-symbols:refresh',
          loading: status === 'pending',
          label: 'Retry',
          size: 'xs',
          color: 'error',
          variant: 'solid',
          onClick: () => execute(),
        },
      ]"
    />

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
      <UButton size="lg" icon="i-heroicons-plus">Create a workspace</UButton>
    </AppEmptyState>

    <ul v-else class="space-y-4">
      <li v-for="workspace in workspaces" :key="workspace.id">
        <WorkspaceCard :workspace="workspace" />
      </li>
    </ul>
  </UContainer>
</template>

<style scoped></style>
