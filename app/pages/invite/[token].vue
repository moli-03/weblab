<script lang="ts" setup>
  import z from "zod";
  import type { PublicUser } from "~~/server/utils/response-sanitizer";

  interface InviteInfo {
    id: string;
    workspace: {
      id: string;
      name: string;
      slug: string;
      description: string;
      logoUrl: string | null;
    };
    inviter: PublicUser;
    email: string | null;
    expiresAt: string;
    isExpired: boolean;
    isUsed: boolean;
    usedAt: string | null;
    createdAt: string;
  }

  interface AcceptResponse {
    success: boolean;
    workspace: {
      id: string;
      name: string;
      slug: string;
    };
    message: string;
  }

  const { $authFetch } = useNuxtApp();
  const { user } = useAuth();
  const toast = useToast();
  const route = useRoute();

  // Validate route param
  const tokenSchema = z.object({ token: z.string() });
  const tokenParams = tokenSchema.safeParse(route.params);

  if (!tokenParams.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid invite link",
    });
  }

  const token = tokenParams.data.token;
  const isAccepting = ref(false);
  const acceptanceResult = ref<AcceptResponse | null>(null);

  // Fetch invite information
  const {
    data: inviteInfo,
    error,
    pending,
  } = await useAsyncData<InviteInfo>(`invite-${token}`, async () => {
    try {
      return await $authFetch(`/api/invite/${token}`);
    } catch (error) {
      console.error("Failed to fetch invite info:", error);
      throw error;
    }
  });

  // Set page title
  useHead(() => ({
    title: inviteInfo.value ? `Join ${inviteInfo.value.workspace.name} – Workspace Invite` : "Workspace Invite",
  }));

  // Handle invite acceptance
  async function acceptInvite() {
    if (!inviteInfo.value || isAccepting.value) return;

    isAccepting.value = true;
    try {
      const result = await $authFetch<AcceptResponse>(`/api/invite/${token}`, {
        method: "POST",
      });

      acceptanceResult.value = result;
      toast.add({
        title: "Success!",
        description: result.message,
        icon: "material-symbols:check-circle",
        color: "success",
      });

      // Redirect to workspace after a short delay
      setTimeout(() => {
        navigateTo(`/workspaces/${result.workspace.slug}`);
      }, 2000);
    } catch (error: unknown) {
      console.error("Failed to accept invite:", error);

      let errorMessage = "Failed to join workspace";
      if (
        error &&
        typeof error === "object" &&
        "data" in error &&
        error.data &&
        typeof error.data === "object" &&
        "message" in error.data
      ) {
        errorMessage = String(error.data.message);
      }

      toast.add({
        title: "Error",
        description: errorMessage,
        icon: "material-symbols:error",
        color: "error",
      });
    } finally {
      isAccepting.value = false;
    }
  }

  // Format date
  const formattedExpiry = computed(() => {
    if (!inviteInfo.value) return "";
    return new Date(inviteInfo.value.expiresAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  });

  // Check if user needs to log in
  const needsLogin = computed(() => !user.value);
</script>

<template>
  <UContainer class="max-w-2xl py-16">
    <!-- Loading State -->
    <div v-if="pending" class="text-center">
      <USkeleton class="h-8 w-64 mx-auto mb-4" />
      <USkeleton class="h-4 w-96 mx-auto mb-2" />
      <USkeleton class="h-4 w-80 mx-auto" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="max-w-xl mx-auto">
      <UAlert
        color="error"
        variant="soft"
        icon="material-symbols:error"
        title="Invalid Invite"
        description="This invite link is invalid or has been removed. Please contact the person who sent you this invite."
        class="mb-4"
      />
      <div class="text-center">
        <UButton to="/workspaces" icon="material-symbols:arrow-back" label="Browse Workspaces" variant="outline" />
      </div>
    </div>

    <!-- Success State -->
    <div v-else-if="acceptanceResult" class="max-w-xl mx-auto">
      <UAlert
        color="success"
        variant="soft"
        icon="material-symbols:check-circle"
        title="Welcome!"
        :description="acceptanceResult.message"
        class="mb-4"
      />
      <p class="text-center text-sm text-green-500 mb-4">Redirecting you to the workspace...</p>
      <div class="text-center">
        <UButton
          :to="`/workspaces/${acceptanceResult.workspace.slug}`"
          icon="material-symbols:arrow-forward"
          label="Go to Workspace"
          color="success"
        />
      </div>
    </div>

    <!-- Main Invite Content -->
    <div v-else-if="inviteInfo" class="text-center">
      <!-- Workspace Logo/Avatar -->
      <div class="mb-6">
        <div
          v-if="inviteInfo.workspace.logoUrl"
          class="w-16 h-16 mx-auto rounded-lg bg-zinc-800 overflow-hidden ring-1 ring-white/10"
        >
          <img
            :src="inviteInfo.workspace.logoUrl"
            :alt="inviteInfo.workspace.name"
            class="w-full h-full object-cover"
          />
        </div>
        <div
          v-else
          class="w-16 h-16 mx-auto rounded-lg bg-primary-900/30 flex items-center justify-center ring-1 ring-white/10"
        >
          <span class="text-primary-400 font-bold text-xl">
            {{ inviteInfo.workspace.name.charAt(0).toUpperCase() }}
          </span>
        </div>
      </div>

      <!-- Title and Description -->
      <h1 class="text-3xl font-bold text-gray-100 mb-2">Join {{ inviteInfo.workspace.name }}</h1>

      <p v-if="inviteInfo.workspace.description" class="text-gray-400 mb-6 max-w-md mx-auto">
        {{ inviteInfo.workspace.description }}
      </p>

      <!-- Inviter Info -->
      <UCard class="mb-6 max-w-sm mx-auto text-left" :ui="{ body: 'p-4' }">
        <p class="text-sm text-gray-400 mb-1">Invited by</p>
        <p class="font-medium text-gray-100">{{ inviteInfo.inviter.name }}</p>
        <p class="text-sm text-gray-400">{{ inviteInfo.inviter.email }}</p>
      </UCard>

      <!-- Invite Status -->
      <div v-if="inviteInfo.isExpired || inviteInfo.isUsed" class="mb-6">
        <UAlert
          v-if="inviteInfo.isExpired"
          color="warning"
          variant="soft"
          icon="material-symbols:schedule"
          title="Invite Expired"
          :description="`This invite expired on ${formattedExpiry}. Please ask for a new invite.`"
          class="max-w-md mx-auto"
        />

        <UAlert
          v-else-if="inviteInfo.isUsed"
          color="neutral"
          variant="soft"
          icon="material-symbols:check-circle"
          title="Invite Already Used"
          description="This invite has already been used and cannot be used again."
          class="max-w-md mx-auto"
        />
      </div>

      <!-- Action Buttons -->
      <div v-else class="space-y-4">
        <!-- Login Required -->
        <div v-if="needsLogin" class="space-y-4">
          <UAlert
            color="info"
            variant="soft"
            icon="material-symbols:info"
            description="You need to be logged in to accept this invite."
            class="max-w-md mx-auto"
          />

          <div class="flex gap-3 justify-center">
            <UButton to="/auth/login" icon="material-symbols:login" label="Log In" color="primary" />
            <UButton to="/auth/register" icon="material-symbols:person-add" label="Sign Up" variant="outline" />
          </div>
        </div>

        <!-- Accept Invite -->
        <div v-else class="space-y-4">
          <UButton
            icon="material-symbols:check"
            label="Accept Invite"
            size="lg"
            color="primary"
            :loading="isAccepting"
            :disabled="isAccepting"
            @click="acceptInvite"
          />

          <p class="text-xs text-gray-400">
            By accepting, you'll be added as a member of this workspace.
          </p>
        </div>

        <!-- Expiry Information -->
        <div class="text-xs text-gray-500 pt-4">
          <p>This invite expires on {{ formattedExpiry }}</p>
        </div>
      </div>
    </div>
  </UContainer>
</template>

<style scoped>
  /* Add any additional styling if needed */
</style>
