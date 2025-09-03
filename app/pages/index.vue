<script lang="ts" setup>
  const { isLoggedIn } = useAuth();
</script>

<template>
  <!-- Hero Section -->
  <section class="bg-gradient-to-br h-full from-sky-900/20 to-sky-600/5 flex items-center">
    <UContainer class="max-w-4xl mx-auto py-24">
      <div class="flex mb-6">
        <AppIcon size="xl" />
      </div>

      <h1
        class="text-5xl lg:text-7xl font-bold mb-4 bg-gradient-to-r from-sky-400 to-sky-600 bg-clip-text text-transparent leading-normal"
      >
        Technology Radar
      </h1>

      <p class="text-xl lg:text-2xl text-gray-300 mb-8 leading-relaxed">
        Navigate the evolving technology landscape with confidence. Make informed decisions about technology adoption
        with expert insights and comprehensive assessments.
      </p>

      <div class="flex flex-col sm:flex-row gap-4 mb-16">
        <UButton size="xl" class="px-8 py-4" icon="material-symbols:explore"> Explore Workspaces </UButton>
        <UButton
          v-if="!isLoggedIn"
          variant="outline"
          size="xl"
          class="px-8 py-4"
          icon="material-symbols:login"
          to="/auth/register"
        >
          Login / Register
        </UButton>
      </div>
    </UContainer>
  </section>
</template>
