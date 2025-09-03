<template>
  <header class="flex items-center gap-4 px-10 py-4 border-b border-zinc-600">
    <!-- Icon -->
    <div
      class="flex items-center justify-center aspect-square w-12 rounded-2xl bg-gradient-to-br from-sky-600 to-sky-400"
    >
      <UIcon name="material-symbols:radar" class="text-4xl" />
    </div>
    <div class="flex-grow">
      <h1 class="text-3xl font-bold">Technology Radar</h1>
      <p class="font-semibold">Enterprise Technology Assessment Platform</p>
    </div>
    <UButton variant="soft" icon="material-symbols:person-add">Register</UButton>
    <UButton icon="material-symbols:login">Login</UButton>
  </header>
</template>
