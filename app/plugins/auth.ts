export default defineNuxtPlugin(() => {

  const { initializeAuth, setupTokenRefresh } = useAuth();

  initializeAuth();
  setupTokenRefresh();
})