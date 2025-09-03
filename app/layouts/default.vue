<script lang="ts" setup></script>

<template>
  <div class="grid grid-rows-[auto_1fr_auto] min-h-screen">
    <PageHeader />
    <div class="flex-grow">
      <slot />
    </div>
    <PageFooter />
  </div>
</template>
