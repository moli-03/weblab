<script lang="ts" setup>
  import type { BreadcrumbItem, ToastProps } from "@nuxt/ui";
  import z from "zod";
  import type { WorkspaceWithOwner } from "~~/shared/types/schema";

  const { $authFetch } = useNuxtApp();
  const { user } = useAuth();
  const toast = useToast();

  // Validate route param which can be UUID (id) or slug
  const uuidSchema = z.object({ id: z.uuid() });
  const slugSchema = z.object({ id: z.string() });

  const route = useRoute();
  const uuidParams = uuidSchema.safeParse(route.params);
  const slugParams = slugSchema.safeParse(route.params);

  let fetchType: "id" | "slug" | null = null;

  const notFoundToast: ToastProps = {
    title: "Workspace not found",
    icon: "material-symbols:error",
    description: "The requested workspace does not exist.",
    color: "error",
  };

  if (uuidParams.success) {
    fetchType = "id";
  } else if (slugParams.success) {
    fetchType = "slug";
  } else {
    toast.add(notFoundToast);
    await navigateTo("/workspaces");
    throw new Error("Invalid workspace identifier");
  }

  const getWorkspaceIdBySlug = async (slug: string) => {
    try {
      const response = await $authFetch(`/api/workspaces?slug=${slug}`);
      if (response.entries.length === 0) {
        throw new Error("Workspace not found");
      }
      return response.entries.at(0)!.id;
    } catch (error) {
      console.error("Failed to fetch workspace by slug:", error);
      toast.add(notFoundToast);
      await navigateTo("/workspaces");
      throw new Error("Workspace not found");
    }
  };

  const {
    data: workspace,
    status,
    refresh,
  } = useAsyncData<WorkspaceWithOwner>("workspace-detail", async () => {
    let id: string | null = null;
    if (fetchType === "id" && uuidParams.success) {
      id = uuidParams.data.id;
    } else if (fetchType === "slug" && slugParams.success) {
      const { id: slug } = slugParams.data;
      id = await getWorkspaceIdBySlug(slug);
    }
    return await $authFetch(`/api/workspaces/${id}`);
  });

  // SEO Title
  const pageTitle = computed(() => (workspace.value ? `${workspace.value.name} – Workspace` : "Workspace"));
  useHead(() => ({ title: pageTitle.value }));

  // Derived state
  const isOwner = computed(() => workspace.value && user.value?.id === workspace.value.ownerId);

  // Breadcrumbs for UBreadcrumb (Nuxt UI expects label + optional to)
  const breadcrumbs = computed<BreadcrumbItem[]>(() => [
    { label: "Workspaces", to: "/workspaces" },
    { label: workspace.value ? workspace.value.name : "Loading" },
  ]);

  // Refresh after hero join/leave
  const handleHeroUpdated = () => refresh();
</script>

<template>
  <UContainer class="max-w-4xl py-10">
    <!-- Breadcrumbs -->
    <div class="mb-6">
      <UBreadcrumb :items="breadcrumbs" />
    </div>
    <!-- Loading State -->
    <div v-if="status === 'pending'" class="space-y-6 animate-pulse">
      <div class="h-10 w-2/3 bg-gray-200 dark:bg-gray-800 rounded" />
      <div class="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded" />
      <div class="h-4 w-5/6 bg-gray-200 dark:bg-gray-800 rounded" />
      <div class="h-64 w-full bg-gray-100 dark:bg-gray-900 rounded" />
    </div>

    <template v-else-if="status === 'success' && workspace">
      <div class="flex flex-col gap-8">
        <!-- Header / Hero extracted to component -->
        <WorkspaceHero :workspace="workspace" :is-owner="Boolean(isOwner)" @updated="handleHeroUpdated" />

        <!-- Placeholder for future content -->
        <section
          class="mt-2 pt-8 border-t border-gray-200 dark:border-gray-800 min-h-40"
          aria-label="Workspace extended content"
        >
          <p class="text-sm text-muted mb-4">More workspace content will appear here.</p>
          <!-- Intentionally left space for future modules (e.g., technologies, members, activity) -->
        </section>
      </div>
    </template>

    <template v-else>
      <div class="text-center py-20">
        <p class="text-lg font-medium">Workspace not available.</p>
        <UButton to="/workspaces" class="mt-6" label="Back to workspaces" icon="material-symbols:arrow-back" />
      </div>
    </template>
  </UContainer>
</template>
