<script lang="ts" setup>
  import moment from "moment";
  import type { WorkspaceMember } from "~~/shared/types/schema";
  import { initials } from "~~/shared/utils/initials";

  interface Props {
    member: WorkspaceMember;
    workspaceId: string;
    canManageMembers?: boolean;
    currentUserId?: string;
    workspaceOwnerId?: string;
  }

  interface Emits {
    (e: "roleChanged", member: WorkspaceMember & { role: string }): void;
    (e: "memberRemoved", member: WorkspaceMember): void;
  }

  const props = defineProps<Props>();
  const emit = defineEmits<Emits>();

  const toast = useToast();

  const showRoleModal = ref(false);
  const showDeleteModal = ref(false);
  const isDeleting = ref(false);

  const roleColor = computed(() => {
    switch (props.member.role) {
      case "cto":
        return "primary";
      case "tech-lead":
        return "warning";
      default:
        return "neutral";
    }
  });

  const joinedRelative = computed(() => moment(props.member.joinedAt).fromNow());

  // Can't change your own role
  const canChangeRole = computed(() => props.canManageMembers && props.currentUserId !== props.member.id && props.workspaceOwnerId !== props.member.id);

  // Can delete if CTO and not the current user and not the workspace owner
  const canDeleteMember = computed(() => 
    props.canManageMembers && 
    props.currentUserId !== props.member.id && 
    props.workspaceOwnerId !== props.member.id
  );

  const handleRoleChange = (updatedMember: WorkspaceMember & { role: string }) => {
    emit("roleChanged", updatedMember);
  };

  const handleDeleteMember = async () => {
    isDeleting.value = true;
    try {
      const { $authFetch } = useNuxtApp();
      await $authFetch(`/api/workspaces/${props.workspaceId}/members/${props.member.id}`, { method: "delete" });
      
      emit("memberRemoved", props.member);
      showDeleteModal.value = false;
      
      // Show success toast
      toast.add({
        title: "Member removed",
        description: `${props.member.name} has been removed from the workspace`,
        color: "success",
        icon: "material-symbols:check-circle",
      });
    } catch (error: unknown) {
      console.error("Failed to remove member:", error);
      
      // Show error toast
      toast.add({
        title: "Failed to remove member",
        icon: "material-symbols:error",
        color: "error",
      });
    } finally {
      isDeleting.value = false;
    }
  };
</script>

<template>
  <li class="flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-900/60 backdrop-blur-sm p-2">
    <!-- Avatar / Initials -->
    <div
      class="size-9 rounded-md bg-primary-900/40 flex items-center justify-center text-primary-300 font-semibold text-xs select-none"
    >
      {{ initials(member.name) }}
    </div>

    <!-- Content -->
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2">
        <p class="text-sm font-medium" :title="member.name">{{ member.name }}</p>
        <UBadge :color="roleColor" size="xs" variant="subtle" class="uppercase tracking-wide">
          {{ member.role }}
        </UBadge>
      </div>
      <p class="text-[11px] text-muted mt-0.5 flex items-center gap-1">
        <UIcon name="material-symbols:calendar-clock" class="text-sm" /> Joined {{ joinedRelative }}
      </p>
    </div>

    <div v-if="canChangeRole || canDeleteMember" class="flex items-center gap-1">
      <UButton
        v-if="canChangeRole"
        variant="ghost"
        size="xs"
        icon="material-symbols:settings"
        @click="showRoleModal = true"
      />
      
      <UButton
        v-if="canDeleteMember"
        variant="ghost"
        size="xs"
        icon="material-symbols:delete-outline"
        color="error"
        @click="showDeleteModal = true"
      />

      <WorkspaceMemberRoleModal
        v-if="canChangeRole"
        v-model="showRoleModal"
        :member="member"
        :workspace-id="workspaceId"
        @role-changed="handleRoleChange"
      />
      
      <!-- Delete Confirmation Modal -->
      <UModal :open="showDeleteModal">

        <template #header>
          <ModalHeader
            title="Remove Member"
            icon="material-symbols:warning"
          />
        </template>

        <template #body>
          <div class="space-y-4">
            <p>
              Are you sure you want to remove <strong>{{ member.name }}</strong> from this workspace?
            </p>
            <p class="text-sm text-gray-600">
              This action cannot be undone. The member will lose access to all workspace content and technologies.
            </p>
          </div>
        </template>

        <template #footer>
          <div class="flex justify-end gap-2 w-full">
            <UButton
              variant="ghost"
              color="primary"
              icon="material-symbols:close"
              :disabled="isDeleting"
              @click="showDeleteModal = false"
              >
                Cancel
              </UButton>
              <UButton
                color="error"
                :loading="isDeleting"
                icon="material-symbols:delete"
                @click="handleDeleteMember"
              >
                Remove
              </UButton>
            </div>
        </template>
      </UModal>
    </div>
  </li>
</template>
