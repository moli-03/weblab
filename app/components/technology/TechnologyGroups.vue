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
      label: "Techniques",
      slot: "technique",
      icon: "i-heroicons-cog-6-tooth",
      techniques: getTechniquesForCategory("technique"),
    },
    {
      label: "Tools",
      slot: "tool",
      icon: "i-heroicons-wrench",
      techniques: getTechniquesForCategory("tool"),
    },
    {
      label: "Platforms",
      slot: "platform",
      icon: "i-heroicons-server",
      techniques: getTechniquesForCategory("platform"),
    },
    {
      label: "Frameworks",
      slot: "framework",
      icon: "i-heroicons-cube",
      techniques: getTechniquesForCategory("framework"),
    },
  ]);
</script>

<template>
  <UAccordion :multiple="multiple" :items="accordionItems">
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
      <div class="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <TechnologyCard v-for="tech in item.techniques" :key="tech.id" :technology="tech" />
      </div>
    </template>
  </UAccordion>
</template>
