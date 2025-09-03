<script setup lang="ts"></script>

<template>
  <header class="border-b border-zinc-700 bg-elevated shadow-sm">
    <div class="mx-auto flex flex-wrap md:flex-nowrap items-center gap-5 px-5 py-3">
      <AppIcon size="md" />

      <div class="flex-grow min-w-[240px] leading-tight">
        <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Technology Radar</h1>
        <p class="text-sm md:text-base text-zinc-400 font-medium">Enterprise Technology Assessment Platform</p>
      </div>

      <div class="flex items-center gap-2 ml-auto">
        <UButton variant="ghost" size="lg" icon="material-symbols:person-add">Register</UButton>
        <UButton size="lg" icon="material-symbols:login">Login</UButton>
      </div>
    </div>
  </header>
</template>
