<script lang="ts">
  import type { FormSubmitEvent } from "@nuxt/ui";
  import z from "zod";

  interface Props {
    workspaceId: string;
  }

  interface Emits {
    (e: "invited"): void;
  }

  interface InviteResponse {
    id: string;
    token: string;
    inviteUrl: string;
    email: string | null;
    expiresAt: string;
    createdAt: string;
  }
</script>

<script lang="ts" setup>
  const props = defineProps<Props>();
  const emit = defineEmits<Emits>();

  const { $authFetch } = useNuxtApp();
  const toast = useToast();

  const form = useTemplateRef("form");
  const isOpen = ref(false);
  const isSubmitting = ref(false);
  const generatedInvite = ref<InviteResponse | null>(null);

  const schema = z.object({
    email: z.email().optional().or(z.literal("")),
  });

  type Schema = z.infer<typeof schema>;

  const defaultState: Schema = {
    email: "",
  };

  const state = ref<Schema>({ ...defaultState });

  const reset = () => {
    state.value = { ...defaultState };
    generatedInvite.value = null;
  };

  async function onSubmit(event: FormSubmitEvent<Schema>) {
    isSubmitting.value = true;
    try {
      const invite = await $authFetch<InviteResponse>(`/api/workspaces/${props.workspaceId}/invite`, {
        method: "POST",
        body: {
          email: event.data.email || undefined,
        },
      });

      generatedInvite.value = invite;

      toast.add({
        title: "Invite created",
        icon: "material-symbols:check-circle",
        color: "success",
      });

      emit("invited");
    } catch (error) {
      console.error("Failed to create invite", error);
      toast.add({
        title: "Failed to create invite",
        icon: "material-symbols:error",
        color: "error",
      });
    } finally {
      isSubmitting.value = false;
    }
  }

  async function copyInviteLink() {
    if (!generatedInvite.value) return;

    try {
      await navigator.clipboard.writeText(generatedInvite.value.inviteUrl);
      toast.add({
        title: "Invite link copied",
        icon: "material-symbols:content-copy",
        color: "success",
      });
    } catch (error) {
      console.error("Failed to copy to clipboard", error);
      toast.add({
        title: "Failed to copy link",
        icon: "material-symbols:error",
        color: "error",
      });
    }
  }

  function close() {
    isOpen.value = false;
    reset();
  }

  const expiresAtFormatted = computed(() => {
    if (!generatedInvite.value) return "";
    return new Date(generatedInvite.value.expiresAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  });
</script>

<template>
  <UModal :open="isOpen" :ui="{ footer: 'justify-end' }">
    <slot :open="() => (isOpen = true)">
      <UButton
        variant="ghost"
        color="primary"
        icon="material-symbols:person-add"
        label="Invite"
        size="xs"
        @click="isOpen = true"
      />
    </slot>

    <template #header>
      <ModalHeader
        title="Invite members"
        subtitle="Generate an invite link to add new members to the workspace"
        icon="material-symbols:person-add"
      />
    </template>

    <template #body>
      <div v-if="!generatedInvite">
        <UForm ref="form" class="space-y-6" :schema="schema" :state="state" @submit="onSubmit">
          <UFormField
            name="email"
            label="Email (Optional)"
            help="If provided, the invite will be associated with this email address"
          >
            <UInput v-model="state.email" class="w-full" placeholder="user@example.com" type="email" />
          </UFormField>
        </UForm>
      </div>

      <div v-else class="space-y-5">
        <UAlert
          color="success"
          variant="soft"
          icon="material-symbols:check-circle"
          title="Invite link generated!"
          :description="`Share this link with the person you want to invite. The link will expire on ${expiresAtFormatted}.`"
        />

        <div class="space-y-2">
          <label class="block text-xs font-medium text-gray-400">Invite link</label>
          <UInput
            :model-value="generatedInvite.inviteUrl"
            readonly
            size="md"
            class="w-full"
            @focus="$event.target?.select?.()"
          >
            <template #trailing>
              <UButton
                color="primary"
                variant="soft"
                icon="material-symbols:content-copy"
                size="xs"
                aria-label="Copy invite link"
                @click.stop="copyInviteLink"
              />
            </template>
          </UInput>
        </div>

        <div v-if="generatedInvite.email" class="text-sm text-gray-400">
          <UBadge color="neutral" variant="soft" size="xs" class="mr-2">Associated email</UBadge>
          {{ generatedInvite.email }}
        </div>

        <UAlert color="neutral" variant="subtle" icon="material-symbols:info">
          <template #description>
            <ul class="list-disc pl-5 space-y-1 text-xs text-gray-400">
              <li>This link can only be used once</li>
              <li>The link will expire in 24 hours</li>
              <li>The person will be added as a regular member (customer role)</li>
            </ul>
          </template>
        </UAlert>
      </div>
    </template>

    <template #footer>
      <UButton
        v-if="!generatedInvite"
        variant="ghost"
        label="Cancel"
        icon="material-symbols:close"
        :disabled="isSubmitting"
        @click="close"
      />
      <UButton
        v-if="!generatedInvite"
        variant="solid"
        color="primary"
        label="Generate Invite"
        icon="material-symbols:link"
        :loading="isSubmitting"
        :disabled="isSubmitting"
        @click="form?.submit()"
      />

      <UButton
        v-if="generatedInvite"
        variant="solid"
        color="primary"
        label="Done"
        icon="material-symbols:check"
        @click="close"
      />
    </template>
  </UModal>
</template>
