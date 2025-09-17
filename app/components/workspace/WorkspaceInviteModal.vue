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
    email: z.string().email().optional().or(z.literal("")),
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
        <UForm ref="form" class="space-y-4" :schema="schema" :state="state" @submit="onSubmit">
          <UFormField 
            name="email" 
            label="Email (Optional)" 
            help="If provided, the invite will be associated with this email address"
          >
            <UInput 
              v-model="state.email" 
              class="w-full" 
              placeholder="user@example.com"
              type="email"
            />
          </UFormField>
        </UForm>
      </div>

      <div v-else class="space-y-4">
        <div class="rounded-lg border border-green-200 bg-green-50 p-4">
          <div class="flex items-center gap-2 mb-2">
            <UIcon name="material-symbols:check-circle" class="text-green-600" />
            <h3 class="font-medium text-green-800">Invite link generated!</h3>
          </div>
          <p class="text-sm text-green-700 mb-3">
            Share this link with the person you want to invite. The link will expire on {{ expiresAtFormatted }}.
          </p>
          
          <div class="flex items-center gap-2">
            <UInput
              :value="generatedInvite.inviteUrl"
              readonly
              class="flex-1"
              size="sm"
            />
            <UButton
              icon="material-symbols:content-copy"
              variant="outline"
              size="sm"
              @click="copyInviteLink"
            />
          </div>
        </div>

        <div v-if="generatedInvite.email" class="text-sm text-gray-600">
          <strong>Associated email:</strong> {{ generatedInvite.email }}
        </div>

        <div class="text-xs text-gray-500 space-y-1">
          <p>• This link can only be used once</p>
          <p>• The link will expire in 24 hours</p>
          <p>• The person will be added as a regular member (customer role)</p>
        </div>
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