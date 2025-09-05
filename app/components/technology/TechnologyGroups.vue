<script lang="ts" setup>
  import type { Technology } from "~~/shared/types/schema";
  import type { AccordionItem } from "@nuxt/ui";

  interface Props {
    technologies: Technology[];
    multiple?: boolean; // allow multiple accordion sections open
    editable?: boolean;
  }

  interface Emits {
    (e: "deleted", technologyId: string): void;
  }

  interface ExtendedAccordionItem extends AccordionItem {
    techniques: Technology[];
  }

  const props = withDefaults(defineProps<Props>(), {
    multiple: true,
    editable: false,
  });
  const emit = defineEmits<Emits>();

  // Maintain a local shallow copy so we can optimistically update on delete
  const localTechnologies = ref<Technology[]>([...props.technologies]);
  watch(
    () => props.technologies,
    newVal => {
      localTechnologies.value = [...newVal];
    },
  );

  const getTechniquesForCategory = (category: Technology["category"]) => {
    return localTechnologies.value.filter(tech => tech.category === category);
  };

  const accordionItems = computed<ExtendedAccordionItem[]>(() => [
    {
      label: "Frameworks",
      slot: "framework",
      icon: "material-symbols:view-in-ar",
      techniques: getTechniquesForCategory("framework"),
    },
    {
      label: "Tools",
      slot: "tool",
      icon: "material-symbols:build",
      techniques: getTechniquesForCategory("tool"),
    },
    {
      label: "Techniques",
      slot: "technique",
      icon: "material-symbols:lightbulb",
      techniques: getTechniquesForCategory("technique"),
    },
    {
      label: "Platforms",
      slot: "platform",
      icon: "material-symbols:cloud",
      techniques: getTechniquesForCategory("platform"),
    },
  ]);

  const { $authFetch } = useNuxtApp();
  const toast = useToast();
  const deletingIds = ref<Set<string>>(new Set());

  async function handleDelete(tech: Technology) {
    if (deletingIds.value.has(tech.id)) return;
    deletingIds.value.add(tech.id);
    const prev = [...localTechnologies.value];
    // Optimistic removal
    localTechnologies.value = localTechnologies.value.filter(t => t.id !== tech.id);
    try {
      await $authFetch(`/api/workspaces/${tech.workspaceId}/technologies/${tech.id}`, { method: "DELETE" });
      toast.add({
        title: "Technology deleted",
        icon: "material-symbols:check-circle",
        color: "success",
      });
      emit("deleted", tech.id);
    } catch (error) {
      console.error("Failed to delete technology", error);
      // Revert
      localTechnologies.value = prev;
      toast.add({
        title: "Failed to delete technology",
        icon: "material-symbols:error",
        color: "error",
      });
    } finally {
      deletingIds.value.delete(tech.id);
    }
  }
</script>

<template>
  <UAccordion
    :multiple="multiple"
    :items="accordionItems"
    :ui="{
      label: 'text-xl font-semibold',
    }"
  >
    <template #trailing="{ open, item }">
      <div
        class="flex w-full"
        :class="{ 'justify-between': item.techniques.length > 0, 'justify-end': item.techniques.length === 0 }"
      >
        <UBadge
          v-if="item.techniques.length > 0"
          :label="item.techniques.length"
          size="sm"
          color="primary"
          variant="subtle"
        />
        <UIcon
          :name="open ? 'material-symbols:expand-less' : 'material-symbols:expand-more'"
          class="text-muted text-xl"
        />
      </div>
    </template>
    <template v-for="item in accordionItems" :key="item.slot" #[item.slot]>
      <div v-if="item.techniques.length === 0" class="py-3">
        <AppEmptyState
          icon="material-symbols:folder-open"
          title="Nothing here yet"
          :description="`No ${(item.label || 'items').toString().toLowerCase()} added yet.`"
        />
      </div>
      <div v-else class="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 py-2">
        <div v-for="tech in item.techniques" :key="tech.id" class="h-fit">
          <TechnologyCard :technology="tech" :editable="editable" @delete="handleDelete(tech)" />
        </div>
      </div>
    </template>
  </UAccordion>
</template>
