<script lang="ts" setup>
  const { isLoggedIn, user, logout } = useAuth();
</script>

<template>
  <header class="border-b border-zinc-700 bg-elevated shadow-sm">
    <div class="mx-auto px-3 sm:px-5 py-3">
      <!-- Main header row -->
      <div class="flex items-center justify-between gap-3 sm:gap-5">
        <!-- Logo and title section -->
        <div class="flex items-center gap-3 sm:gap-5 min-w-0 flex-shrink">
          <AppIcon size="md" class="flex-shrink-0" />
          <div class="leading-tight min-w-0">
            <NuxtLink to="/">
              <h1 class="text-lg sm:text-2xl md:text-3xl font-bold tracking-tight">
                <span class="hidden sm:inline">Technology Radar</span>
                <span class="sm:hidden">Tech Radar</span>
              </h1>
            </NuxtLink>
            <p class="text-xs sm:text-sm md:text-base text-zinc-400 font-medium hidden sm:block">
              Enterprise Technology Assessment Platform
            </p>
            <p class="text-xs text-zinc-400 font-medium sm:hidden">Tech Assessment</p>
          </div>
        </div>

        <!-- Desktop navigation (centered) -->
        <div v-if="isLoggedIn" class="hidden lg:flex flex-grow justify-center">
          <AppNavigation />
        </div>

        <!-- Auth buttons for non-logged-in users -->
        <div v-if="!isLoggedIn" class="flex flex-col md:flex-row items-center gap-1 sm:gap-2 flex-shrink-0">
          <UButton variant="ghost" size="lg" icon="material-symbols:person-add" to="/auth/register"> Sign up </UButton>
          <UButton size="lg" icon="material-symbols:login" to="/auth/login"> Sign in </UButton>
        </div>

        <!-- User info for logged-in users -->
        <div v-else-if="user" class="flex items-center gap-2 flex-shrink-0">
          <!-- Desktop user info -->
          <div class="hidden sm:grid grid-cols-[auto_auto] gap-2 items-center">
            <div class="text-right">
              <div class="font-semibold">{{ user.name }}</div>
              <div class="text-muted text-sm">{{ user.email }}</div>
            </div>
            <div>
              <UButton variant="soft" icon="material-symbols:logout" @click="logout" />
            </div>
          </div>
          <!-- Mobile user info -->
          <div class="sm:hidden flex items-center gap-2">
            <div class="text-right">
              <div class="font-semibold text-sm">{{ user.name }}</div>
            </div>
            <UButton variant="soft" size="sm" icon="material-symbols:logout" @click="logout" />
          </div>
        </div>
      </div>

      <!-- Mobile navigation (below main header on smaller screens) -->
      <div v-if="isLoggedIn" class="lg:hidden mt-3 pt-3 border-t border-zinc-700/50">
        <AppNavigation />
      </div>
    </div>
  </header>
</template>
