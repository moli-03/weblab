<script setup lang="ts">
  const year = new Date().getFullYear();
</script>

<template>
  <footer class="border-t border-zinc-700 bg-elevated text-sm">
    <!-- Main content row -->
    <div class="px-4 py-4 grid gap-4 md:grid-cols-3 items-center">
      <!-- Left / Brand -->
      <div class="flex items-center gap-2">
        <span class="font-semibold tracking-wide">HSLU HS25</span>
      </div>

      <!-- Center / Title -->
      <div class="md:text-center">
        <p class="font-medium">WEBALB</p>
        <p class="text-xs text-zinc-400 mt-0.5">Technology Radar</p>
      </div>

      <!-- Right / Links -->
      <div class="flex md:justify-end justify-center gap-5 text-zinc-400">© {{ year }} HSLU by Robin Venetz</div>
    </div>
  </footer>
</template>
