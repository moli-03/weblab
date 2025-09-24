<script lang="ts" setup>
  import moment from "moment";
  import type { WorkspaceMember } from "~~/shared/types/schema";
  import { initials } from "~~/shared/utils/initials";

  interface Props {
    member: WorkspaceMember;
    workspaceId: string;
    canManageMembers?: boolean;
    currentUserId?: string;
  }

  interface Emits {
    (e: "roleChanged", member: WorkspaceMember & { role: string }): void;
  }

  const props = defineProps<Props>();
  const emit = defineEmits<Emits>();

  const showRoleModal = ref(false);

  const roleColor = computed(() => {
    switch (props.member.role) {
      case "admin":
        return "primary";
      case "cto":
        return "warning";
      default:
        return "neutral";
    }
  });

  const joinedRelative = computed(() => moment(props.member.joinedAt).fromNow());

  // Can't change your own role
  const canChangeRole = computed(() => props.canManageMembers && props.currentUserId !== props.member.id);

  const handleRoleChange = (updatedMember: WorkspaceMember & { role: string }) => {
    emit("roleChanged", updatedMember);
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
        <p class="text-sm font-medium truncate" :title="member.name">{{ member.name }}</p>
        <UBadge :color="roleColor" size="xs" variant="subtle" class="uppercase tracking-wide">
          {{ member.role }}
        </UBadge>
      </div>
      <p class="text-[11px] text-muted mt-0.5 flex items-center gap-1">
        <UIcon name="material-symbols:calendar-clock" class="text-sm" /> Joined {{ joinedRelative }}
      </p>
    </div>

    <div v-if="canChangeRole" class="flex items-center">
      <UButton variant="ghost" size="xs" icon="material-symbols:settings" @click="showRoleModal = true" />

      <WorkspaceMemberRoleModal
        v-if="canChangeRole"
        v-model="showRoleModal"
        :member="member"
        :workspace-id="workspaceId"
        @role-changed="handleRoleChange"
      />
    </div>
  </li>
</template>
