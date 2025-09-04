<script lang="ts" setup>
  const { navigation } = useNavigation();
</script>

<template>
  <UNavigationMenu :items="navigation" orientation="horizontal" />
</template>
