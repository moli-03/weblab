export default defineNuxtRouteMiddleware(to => {
  const { user } = useAuth();

  if (to.meta.requiresAuth !== undefined && !to.meta.requiresAuth) {
    return;
  }

  if (!user.value) {
    return navigateTo("/auth/login");
  }
});
