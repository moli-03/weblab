<script lang="ts" setup>
  import type { BreadcrumbItem, ToastProps } from "@nuxt/ui";
  import z from "zod";
  import type { WorkspaceWithOwner } from "~~/shared/types/schema";
  import type { PublicUser } from "~~/server/utils/response-sanitizer";
  import type { WorkspaceMember } from "~~/server/database/schema";

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

  const { data: technologies, status: techStatus } = useAsyncData(
    async () => {
      if (workspace.value) {
        return await $authFetch(`/api/workspaces/${workspace.value.id}/technologies`);
      }
      return [];
    },
    { immediate: false, watch: [workspace] },
  );

  const { data: members, status: membersStatus } = useAsyncData(
    async () => {
      if (workspace.value) {
        try {
          return await $authFetch(`/api/workspaces/${workspace.value.id}/members`);
        } catch (e) {
          console.error("Failed to load members", e);
        }
      }
      return [];
    },
    { immediate: false, watch: [workspace] },
  );

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
  <UContainer class="max-w-6xl py-10">
    <!-- Breadcrumbs -->
    <div class="mb-6">
      <UBreadcrumb :items="breadcrumbs" />
    </div>
    <!-- Loading State -->
    <div v-if="status === 'pending'" class="space-y-6 animate-pulse">
      <USkeleton class="h-10 w-2/3" />
      <USkeleton class="h-4 w-full" />
      <USkeleton class="h-4 w-5/6" />
      <USkeleton class="h-64 w-full" />
      <USkeleton class="h-32 w-full" />
    </div>

    <template v-else-if="status === 'success' && workspace">
      <div class="flex flex-col gap-8">
        <!-- Header / Hero extracted to component -->
        <WorkspaceHero :workspace="workspace" :is-owner="Boolean(isOwner)" @updated="handleHeroUpdated" />

        <!-- Main Content Grid -->
        <div class="mt-2 grid gap-10 border-t border-gray-800 pt-8">
          <!-- Radar & Technologies Side by Side (stack on small) -->
          <div class="grid gap-8 lg:grid-cols-3">
            <!-- Radar Section -->
            <section class="lg:col-span-1 flex flex-col gap-4">
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold tracking-tight flex items-center gap-2">
                  <UIcon name="material-symbols:radar" class="text-xl text-primary" /> Radar
                </h2>
                <UPopover>
                  <UButton
                    size="xs"
                    variant="ghost"
                    icon="material-symbols:help"
                    :title="'Technology distribution by ring'"
                  />

                  <template #content>
                    <UCard class="max-w-xs">
                      <template #header>
                        <h3 class="font-medium text-base flex items-center gap-2">
                          <UIcon name="material-symbols:radar" class="text-xl text-primary" />
                          Technology Radar
                        </h3>
                      </template>
                      <p class="text-sm text-muted">
                        The radar visualization will display the distribution of published technologies across different
                      </p>
                    </UCard>
                  </template>
                </UPopover>
              </div>
              <div
                class="relative rounded-xl border border-gray-800 p-4 bg-gradient-to-b from-gray-900 to-gray-950 min-h-64 flex items-center justify-center"
              >
                <div class="text-center space-y-2">
                  <p class="text-sm font-medium">Radar visualization coming soon</p>
                  <p class="text-xs text-muted max-w-[14rem] mx-auto">
                    Will display ring/category distribution of published technologies.
                  </p>
                </div>
              </div>
            </section>

            <!-- Technologies Section -->
            <section class="lg:col-span-2 flex flex-col gap-4">
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold tracking-tight flex items-center gap-2">
                  <UIcon name="material-symbols:hub" class="text-xl text-primary" /> Technologies
                </h2>
                <UButton v-if="isOwner" size="xs" icon="material-symbols:add" variant="subtle" label="Add" disabled />
              </div>
              <div>
                <!-- Loading -->
                <div
                  v-if="techStatus === 'pending'"
                  class="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                >
                  <div v-for="n in 6" :key="n" class="h-40 rounded-lg bg-gray-900 animate-pulse" />
                </div>
                <!-- Empty -->
                <div v-else-if="techStatus === 'success' && technologies && technologies.length === 0">
                  <AppEmptyState
                    icon="material-symbols:hub"
                    title="No technologies yet"
                    description="Once added, technologies will appear here organized in groups."
                  >
                    <UButton v-if="isOwner" icon="material-symbols:add" label="Add technology" size="sm" disabled />
                  </AppEmptyState>
                </div>
                <!-- Content -->
                <div v-else-if="!!technologies">
                  <TechnologyGroups :technologies="technologies" />
                </div>
              </div>
            </section>
          </div>

          <!-- Members Section -->
          <section class="flex flex-col gap-4">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold tracking-tight flex items-center gap-2">
                <UIcon name="material-symbols:group" class="text-xl text-primary" /> Members
              </h2>
              <UButton
                v-if="isOwner"
                size="xs"
                icon="material-symbols:person-add"
                variant="ghost"
                label="Invite"
                disabled
              />
            </div>
            <div v-if="membersStatus === 'pending'" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <USkeleton v-for="n in 3" :key="n" class="h-14" />
            </div>
            <div v-else-if="members && members.length === 0" class="text-sm text-muted italic py-2">
              No members yet.
            </div>
            <ul v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <WorkspaceMemberCard v-for="m in members" :key="m.id" :member="m" />
            </ul>
          </section>
        </div>
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
