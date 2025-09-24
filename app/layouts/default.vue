<script lang="ts" setup></script>

<template>
  <div class="grid grid-rows-[auto_1fr_auto] min-h-screen">
    <AppHeader />
    <div class="flex-grow">
      <slot />
    </div>
    <AppFooter />
  </div>
</template>
