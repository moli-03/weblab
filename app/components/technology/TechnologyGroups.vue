<script lang="ts" setup>
  import type { Technology } from "~~/shared/types/schema";
  import type { AccordionItem } from "@nuxt/ui";

  interface Props {
    technologies: Technology[];
    multiple?: boolean; // allow multiple accordion sections open
  }

  interface ExtendedAccordionItem extends AccordionItem {
    techniques: Technology[];
  }

  const props = withDefaults(defineProps<Props>(), {
    multiple: true,
  });

  const getTechniquesForCategory = (category: Technology["category"]) => {
    return props.technologies.filter(tech => tech.category === category);
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
      <div class="flex justify-between w-full">
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
      <div class="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 py-2">
        <TechnologyCard v-for="tech in item.techniques" :key="tech.id" :technology="tech" class="h-fit" />
      </div>
    </template>
  </UAccordion>
</template>
