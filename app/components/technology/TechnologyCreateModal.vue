<script lang="ts">
  import type { FormSubmitEvent } from "@nuxt/ui";
  import z from "zod";
  import type { Technology } from "~~/shared/types/schema";

  interface Emits {
    (e: "created", technology: Technology): void;
  }

  interface CategoryItem {
    label: string;
    value: Technology["category"];
    icon: string;
  }
</script>

<script lang="ts" setup>
  const _emit = defineEmits<Emits>();

  const form = useTemplateRef("form");
  const isOpen = ref(false);
  const isSubmitting = ref(false);

  const schema = z
    .object({
      name: z.string().nonempty("Name is required"),
      description: z.string().nonempty("Description is required"),
      category: z.enum(["framework", "tool", "technique", "platform"]),
      ring: z.enum(["adopt", "trial", "assess", "hold"]).optional(),
      ringDescription: z.string().optional(),
      logoUrl: z.url().optional().or(z.literal("")),
      shouldPublish: z.boolean(),
    })
    .refine(
      data => {
        if (data.shouldPublish && !data.ring) {
          return false;
        }
        return true;
      },
      { error: "Ring is required when publishing", path: ["ring"] },
    );

  type Schema = z.infer<typeof schema>;

  const state = ref<Schema>({
    name: "",
    description: "",
    category: "framework",
    ring: undefined,
    logoUrl: "",
    ringDescription: "",
    shouldPublish: false,
  });

  const categoryOptions: CategoryItem[] = [
    {
      label: "Framework",
      value: "framework",
      icon: "material-symbols:view-in-ar",
    },
    {
      label: "Tool",
      value: "tool",
      icon: "material-symbols:build",
    },
    {
      label: "Technique",
      value: "technique",
      icon: "material-symbols:lightbulb",
    },
    {
      label: "Platform",
      value: "platform",
      icon: "material-symbols:cloud",
    },
  ];

  const selectedCategory = computed(() => {
    return categoryOptions.find(option => option.value === state.value?.category) || null;
  });

  const ringOptions = [
    { label: "Adopt", value: "adopt" },
    { label: "Trial", value: "trial" },
    { label: "Assess", value: "assess" },
    { label: "Hold", value: "hold" },
  ];

  function onSubmit(event: FormSubmitEvent<Schema>) {
    console.log(event);
  }
</script>

<template>
  <UModal :open="isOpen" :ui="{ footer: 'justify-end' }">
    <slot :open="() => (isOpen = true)">
      <UButton
        variant="solid"
        color="primary"
        icon="material-symbols:add"
        label="Add Technology"
        @click="isOpen = true"
      />
    </slot>

    <template #header>
      <ModalHeader
        title="Add a new technology"
        subtitle="Fill in the details below to add a new technology"
        icon="material-symbols:hub"
      />
    </template>

    <template #body>
      <UForm ref="form" class="space-y-2" :schema="schema" :state="state" @submit="onSubmit">
        <UFormField name="name" label="Name" required>
          <UInput v-model="state.name" class="w-full" placeholder="e.g. React, Kubernetes, PostgreSQL" />
        </UFormField>

        <UFormField name="description" label="Description" required>
          <UTextarea
            v-model="state.description"
            class="w-full"
            :rows="3"
            placeholder="e.g. A JavaScript library for building user interfaces"
          />
        </UFormField>

        <UFormField name="category" label="Category" required>
          <USelect v-model="state.category" :items="categoryOptions" :icon="selectedCategory?.icon" class="w-full" />
        </UFormField>

        <UFormField name="ring" label="Ring" :required="state.shouldPublish">
          <USelect v-model="state.ring" :items="ringOptions" class="w-full" />
        </UFormField>

        <UFormField v-if="state.ring" name="ringDescription" label="Ring Description">
          <UTextarea
            v-model="state.ringDescription"
            class="w-full"
            :rows="2"
            placeholder="Describe what this ring means for this technology in your context"
          />
        </UFormField>

        <div class="flex items-center gap-4">
          <UFormField label="Logo URL" name="logoUrl" class="flex-grow">
            <UInput v-model="state.logoUrl" class="w-full" placeholder="https://example.com/logo.png" />
          </UFormField>

          <img
            v-if="state.logoUrl"
            :src="state.logoUrl"
            alt="Logo Preview"
            class="rounded-lg size-14 object-contain object-center"
          />
        </div>

        <UFormField
          name="shouldPublish"
          label="Publish"
          description="If enabled, this technology will be visible to all members of the workspace."
        >
          <USwitch v-model="state.shouldPublish" />
        </UFormField>
      </UForm>
    </template>

    <template #footer>
      <UButton
        variant="ghost"
        label="Cancel"
        icon="material-symbols:close"
        :disabled="isSubmitting"
        @click="isOpen = false"
      />
      <UButton
        variant="solid"
        color="primary"
        label="Create Technology"
        icon="material-symbols:check"
        :loading="isSubmitting"
        :disabled="isSubmitting"
        @click="form?.submit()"
      />
    </template>
  </UModal>
</template>
