<script lang="ts">
  import type { FormSubmitEvent } from "@nuxt/ui";
  import z from "zod";
  import type { Technology } from "~~/shared/types/schema";

  interface Props {
    technology: Technology;
    open: boolean;
  }

  interface Emits {
    (e: "updated", technology: Technology): void;
    (e: "close"): void;
  }

  interface CategoryItem {
    label: string;
    value: Technology["category"];
    icon: string;
  }
</script>

<script lang="ts" setup>
  const props = defineProps<Props>();
  const emit = defineEmits<Emits>();

  const { $authFetch } = useNuxtApp();
  const toast = useToast();

  const form = useTemplateRef("form");
  const isSubmitting = ref(false);

  const schema = z
    .object({
      name: z.string().nonempty("Name is required"),
      description: z.string().nonempty("Description is required"),
      category: z.enum(["framework", "tool", "technique", "platform"]),
      ring: z.enum(["adopt", "trial", "assess", "hold"]).optional(),
      ringDescription: z.string().optional(),
      logoUrl: z.url().optional().or(z.literal("")),
      publish: z.boolean(),
    })
    .refine(
      data => {
        if (data.publish && !data.ring) {
          return false;
        }
        return true;
      },
      { message: "Ring is required when publishing", path: ["ring"] },
    );

  type Schema = z.infer<typeof schema>;

  // Initialize state with technology data
  const state = ref<Schema>({
    name: props.technology.name,
    description: props.technology.description,
    category: props.technology.category,
    ring: props.technology.ring || undefined,
    logoUrl: props.technology.logoUrl || "",
    ringDescription: props.technology.ringDescription || "",
    publish: props.technology.status === "published",
  });

  // Reset state when technology prop changes
  watch(
    () => props.technology,
    newTech => {
      state.value = {
        name: newTech.name,
        description: newTech.description,
        category: newTech.category,
        ring: newTech.ring || undefined,
        logoUrl: newTech.logoUrl || "",
        ringDescription: newTech.ringDescription || "",
        publish: newTech.status === "published",
      };
    },
    { deep: true },
  );

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

  async function onSubmit(event: FormSubmitEvent<Schema>) {
    isSubmitting.value = true;
    try {
      const updatedTechnology = await $authFetch<Technology>(
        `/api/workspaces/${props.technology.workspaceId}/technologies/${props.technology.id}`,
        {
          method: "PUT",
          body: {
            ...event.data,
          },
        },
      );

      toast.add({
        title: "Technology updated",
        icon: "material-symbols:check-circle",
        color: "success",
      });

      emit("updated", updatedTechnology);
      emit("close");
    } catch (error) {
      console.error("Failed to update technology", error);
      toast.add({
        title: "Failed to update technology",
        icon: "material-symbols:error",
        color: "error",
      });
    } finally {
      isSubmitting.value = false;
    }
  }

  function close() {
    emit("close");
  }
</script>

<template>
  <UModal :open="open" :ui="{ footer: 'justify-end' }">
    <template #header>
      <ModalHeader title="Edit technology" subtitle="Update the technology details" icon="material-symbols:edit" />
    </template>

    <template #body>
      <UForm ref="form" class="space-y-3" :schema="schema" :state="state" @submit="onSubmit">
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

        <LogoUrlField v-model="state.logoUrl" />

        <UFormField name="category" label="Category" required>
          <USelect v-model="state.category" :items="categoryOptions" :icon="selectedCategory?.icon" class="w-full" />
        </UFormField>

        <UFormField name="ring" label="Ring" :required="state.publish">
          <USelect v-model="state.ring" :items="ringOptions" class="w-full" placeholder="Select a ring" />
        </UFormField>

        <UFormField v-if="state.ring" name="ringDescription" label="Ring Description">
          <UTextarea
            v-model="state.ringDescription"
            class="w-full"
            :rows="2"
            placeholder="Describe what this ring means for this technology in your context"
          />
        </UFormField>

        <UFormField
          name="publish"
          label="Publish"
          description="If enabled, this technology will be visible to all members of the workspace."
        >
          <USwitch v-model="state.publish" />
        </UFormField>
      </UForm>
    </template>

    <template #footer>
      <UButton variant="ghost" label="Cancel" icon="material-symbols:close" :disabled="isSubmitting" @click="close" />
      <UButton
        variant="solid"
        color="primary"
        label="Update Technology"
        icon="material-symbols:check"
        :loading="isSubmitting"
        :disabled="isSubmitting"
        @click="form?.submit()"
      />
    </template>
  </UModal>
</template>
