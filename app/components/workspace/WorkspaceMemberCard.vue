<script lang="ts" setup>
  import moment from "moment";
  import type { WorkspaceMember } from "~~/shared/types/schema";
  import { initials } from "~~/shared/utils/initials";

  interface Props {
    member: WorkspaceMember;
  }

  const props = defineProps<Props>();

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

  const joinedRelative = computed(() => moment(props.member.createdAt).fromNow());

  const containerClasses = computed(() =>
    ["flex items-center gap-3 rounded-lg border border-gray-800", "bg-gray-900/60 backdrop-blur-sm", "p-2"].join(" "),
  );
</script>

<template>
  <li :class="containerClasses">
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
  </li>
</template>
