<script lang="ts" setup>
  const { isLoggedIn, user, logout } = useAuth();
</script>

<template>
  <header class="border-b border-zinc-700 bg-elevated shadow-sm">
    <div class="mx-auto flex flex-wrap md:flex-nowrap items-center gap-5 px-5 py-3">
      <AppIcon size="md" />

      <div class="flex-grow min-w-[240px] leading-tight">
        <NuxtLink to="/"><h1 class="text-2xl md:text-3xl font-bold tracking-tight">Technology Radar</h1></NuxtLink>
        <p class="text-sm md:text-base text-zinc-400 font-medium">Enterprise Technology Assessment Platform</p>
      </div>

      <div v-if="!isLoggedIn" class="flex items-center gap-2 ml-auto">
        <UButton variant="ghost" size="lg" icon="material-symbols:person-add" to="/auth/register">Sign up</UButton>
        <UButton size="lg" icon="material-symbols:login" to="/auth/login">Sign in</UButton>
      </div>
      <div v-else-if="user" class="grid grid-cols-[auto_auto] gap-2 items-center">
        <div class="text-right">
          <div class="font-semibold">{{ user.name }}</div>
          <div class="text-muted text-sm">{{ user.email }}</div>
        </div>
        <div>
          <UButton variant="soft" icon="material-symbols:logout" @click="logout" />
        </div>
      </div>
    </div>
  </header>
</template>
