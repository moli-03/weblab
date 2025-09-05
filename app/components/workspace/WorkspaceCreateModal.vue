<script lang="ts">
  import { z } from "zod";
  import type { Workspace } from "~~/shared/types/schema";
  import { slugify } from "~~/shared/utils/slugify";

  interface Emits {
    (e: "created", workspace: Workspace): void;
  }

  interface VisibilityOption {
    value: boolean;
    label: string;
    description: string;
    icon: string;
  }
</script>

<script lang="ts" setup>
  const emit = defineEmits<Emits>();

  const { $authFetch } = useNuxtApp();

  const form = useTemplateRef("form");

  const schema = z.object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters long")
      .max(255, "Name must be at most 255 characters long"),
    description: z
      .string()
      .min(1, "The description is required")
      .max(1024, "Description must be at most 1024 characters long"),
    slug: z
      .string()
      .min(2, "Slug is required")
      .max(255)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Only lowercase letters, numbers and hyphens"),
    logoUrl: z.string().url().optional().or(z.literal("")),
    isPublic: z.boolean(),
  });

  type Schema = z.infer<typeof schema>;

  const state = ref<Schema>({
    name: "",
    slug: "",
    description: "",
    logoUrl: "",
    isPublic: false,
  });

  const isOpen = ref(false);
  const isSubmitting = ref(false);

  const visibilityOptions: VisibilityOption[] = [
    {
      value: false,
      label: "Private",
      description: "Only you and invited members can access this workspace.",
      icon: "i-heroicons-lock-closed",
    },
    {
      value: true,
      label: "Public",
      description: "Anyone can join and view this workspace.",
      icon: "i-heroicons-globe-alt",
    },
  ];

  const selectedVisibility = computed<VisibilityOption>(() => {
    return visibilityOptions.find(o => o.value === state.value.isPublic) || visibilityOptions[0]!;
  });

  // Form submission
  async function onSubmit() {
    try {
      isSubmitting.value = true;

      const payload = {
        ...state.value,
        logoUrl: state.value.logoUrl || undefined,
      };

      const workspace = await $authFetch("/api/workspaces", {
        method: "POST",
        body: payload,
      });

      if (workspace) {
        emit("created", workspace);
        isOpen.value = false;

        // Reset form
        state.value = {
          name: "",
          slug: "",
          description: "",
          logoUrl: "",
          isPublic: false,
        };
      }
    } catch (error) {
      console.error("Failed to create workspace:", error);
    } finally {
      isSubmitting.value = false;
    }
  }
</script>

<template>
  <UModal :open="isOpen" :ui="{ footer: 'justify-end' }" :close="false">
    <UButton icon="i-heroicons-plus" @click="isOpen = true"> Create workspace </UButton>

    <template #header>
      <ModalHeader
        title="Create a new workspace"
        subtitle="Set up a workspace to track technologies and decisions"
        icon="i-heroicons-rectangle-stack"
        />
    </template>

    <template #body>
      <UForm ref="form" class="space-y-4" :schema="schema" :state="state" @submit="onSubmit">
        <div class="grid gap-4 md:grid-cols-2">
          <UFormField label="Workspace Name" name="name" required>
            <UInput v-model="state.name" class="w-full" placeholder="My Awesome Workspace" :disabled="isSubmitting" />
          </UFormField>

          <UFormField label="URL Slug" name="slug" required>
            <template #help>
              <span class="text-xs">Will be used in the workspace URL</span>
            </template>
            <div class="flex gap-2 items-center">
              <UInput
                v-model="state.slug"
                placeholder="my-awesome-workspace"
                class="flex-1 font-mono text-sm"
                :disabled="isSubmitting"
              />
              <UTooltip text="Regenerate from name">
                <UButton
                  variant="ghost"
                  icon="i-heroicons-arrow-path"
                  size="sm"
                  :disabled="!state.name || isSubmitting"
                  @click="state.slug = slugify(state.name)"
                />
              </UTooltip>
            </div>
          </UFormField>
        </div>

        <UFormField label="Description" name="description" required>
          <UTextarea
            v-model="state.description"
            class="w-full"
            :rows="3"
            placeholder="A brief description of what this workspace will be used for..."
            :disabled="isSubmitting"
          />
        </UFormField>

        <div class="flex items-center gap-4">
          <UFormField label="Logo URL" name="logoUrl" class="flex-grow">
            <UInput
              v-model="state.logoUrl"
              class="w-full"
              placeholder="https://example.com/logo.png"
              :disabled="isSubmitting"
            />
          </UFormField>

          <img
            v-if="state.logoUrl"
            :src="state.logoUrl"
            alt="Logo Preview"
            class="rounded-lg size-14 object-contain object-center"
          >
        </div>

        <UFormField label="Visibility" name="isPublic">
          <USelect v-model="state.isPublic" :items="visibilityOptions" class="w-full">
            <template #default>
              <div class="flex items-center text-left gap-2">
                <UIcon :name="selectedVisibility.icon" class="text-xl" />
                <div>
                  <p class="font-semibold">{{ selectedVisibility.label }}</p>
                  <p class="text-xs text-zinc-400">{{ selectedVisibility.description }}</p>
                </div>
              </div>
            </template>
            <template #item="{ item }">
              <div class="flex items-center gap-2">
                <UIcon :name="item.icon" class="text-xl" />
                <div>
                  <p class="font-semibold">{{ item.label }}</p>
                  <p class="text-xs text-zinc-400">{{ item.description }}</p>
                </div>
              </div>
            </template>
          </USelect>
        </UFormField>
      </UForm>
    </template>

    <template #footer>
      <UButton
        type="button"
        variant="ghost"
        label="Cancel"
        icon="material-symbols:close"
        :disabled="isSubmitting"
        @click="isOpen = false"
      />
      <UButton
        type="submit"
        color="primary"
        label="Create Workspace"
        icon="material-symbols:check"
        :loading="isSubmitting"
        :disabled="isSubmitting"
        @click="form?.submit()"
      />
    </template>
  </UModal>
</template>
