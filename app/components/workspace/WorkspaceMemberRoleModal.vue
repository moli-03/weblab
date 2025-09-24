<script lang="ts" setup>
  import type { WorkspaceMember } from "~~/shared/types/schema";

  interface Props {
    member: WorkspaceMember;
    workspaceId: string;
  }

  interface Emits {
    (e: "roleChanged", member: WorkspaceMember & { role: string }): void;
  }

  const props = defineProps<Props>();
  const emit = defineEmits<Emits>();
  const isOpen = defineModel<boolean>();

  const { $authFetch } = useNuxtApp();
  const toast = useToast();

  const selectedRole = ref<"admin" | "cto" | "customer">(props.member.role);
  const isLoading = ref(false);

  const roleOptions = [
    {
      value: "customer" as const,
      label: "Customer",
      description: "Can view workspace content",
      color: "neutral" as const,
    },
    {
      value: "cto" as const,
      label: "CTO",
      description: "Can manage technologies and view workspace content",
      color: "warning" as const,
    },
    {
      value: "admin" as const,
      label: "Admin",
      description: "Full access to manage workspace, members, and technologies",
      color: "primary" as const,
    },
  ];

  const currentRoleLabel = computed(() => {
    const role = roleOptions.find(r => r.value === props.member.role);
    return role ? role.label : props.member.role;
  });

  const hasChanges = computed(() => selectedRole.value !== props.member.role);

  const handleSubmit = async () => {
    if (!hasChanges.value) {
      isOpen.value = false;
      return;
    }

    isLoading.value = true;

    try {
      const response = await $authFetch(`/api/workspaces/${props.workspaceId}/members/${props.member.id}`, {
        method: "PATCH",
        body: {
          role: selectedRole.value,
        },
      });

      toast.add({
        title: "Role updated",
        description: response.message,
        icon: "material-symbols:check-circle",
        color: "success",
      });

      // Emit the updated member data
      emit("roleChanged", {
        ...props.member,
        role: selectedRole.value,
      });

      isOpen.value = false;
    } catch (error: unknown) {
      console.error("Failed to update role:", error);

      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error.data as { message?: string })?.message || "An unexpected error occurred"
          : "An unexpected error occurred";

      toast.add({
        title: "Failed to update role",
        description: errorMessage,
        icon: "material-symbols:error",
        color: "error",
      });
    } finally {
      isLoading.value = false;
    }
  };

  const handleCancel = () => {
    selectedRole.value = props.member.role;
    isOpen.value = false;
  };
</script>

<template>
  <UModal :open="isOpen">
    <template #header>
      <ModalHeader
        title="Change Member Role"
        :subtitle="`Update the role for ${member.name}`"
        icon="material-symbols:manage-accounts"
      />
    </template>

    <template #body>
      <div class="space-y-4">
        <!-- Current Role Info -->
        <div class="rounded-lg bg-gray-900/60 p-3 border border-gray-800">
          <div class="flex items-center gap-3">
            <div
              class="size-9 rounded-md bg-primary-900/40 flex items-center justify-center text-primary-300 font-semibold text-xs"
            >
              {{ initials(member.name) }}
            </div>
            <div>
              <p class="font-medium text-sm">{{ member.name }}</p>
              <p class="text-xs text-muted">
                Current role: <span class="text-white">{{ currentRoleLabel }}</span>
              </p>
            </div>
          </div>
        </div>

        <!-- Role Selection -->
        <div class="space-y-3">
          <label class="block text-sm font-medium">New Role</label>
          <div class="space-y-2">
            <div
              v-for="option in roleOptions"
              :key="option.value"
              class="flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer hover:border-gray-700"
              :class="[
                selectedRole === option.value ? 'border-primary bg-primary/5' : 'border-gray-800 bg-gray-900/40',
              ]"
              @click="selectedRole = option.value"
            >
              <input
                v-model="selectedRole"
                type="radio"
                name="role"
                :value="option.value"
                :color="option.color"
                class="mt-0.5"
              />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-sm">{{ option.label }}</span>
                  <UBadge :color="option.color" size="xs" variant="subtle" class="uppercase tracking-wide">
                    {{ option.value }}
                  </UBadge>
                </div>
                <p class="text-xs text-muted mt-1">{{ option.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Warning for role changes -->
        <div
          v-if="hasChanges && selectedRole === 'admin'"
          class="rounded-lg bg-warning-500/10 border border-warning-500/20 p-3"
        >
          <div class="flex gap-2">
            <UIcon name="material-symbols:warning" class="text-warning-500 text-sm mt-0.5 flex-shrink-0" />
            <div class="text-xs">
              <p class="font-medium text-warning-400">Granting Admin Access</p>
              <p class="text-warning-500/80 mt-1">
                This user will have full access to manage the workspace, including adding/removing members and changing
                roles.
              </p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3 w-full">
        <UButton variant="ghost" :disabled="isLoading" icon="material-symbols:close" @click="handleCancel">
          Cancel
        </UButton>
        <UButton
          :loading="isLoading"
          :disabled="!hasChanges"
          :icon="hasChanges ? 'material-symbols:check' : undefined"
          @click="handleSubmit"
        >
          {{ hasChanges ? "Update Role" : "No Changes" }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
