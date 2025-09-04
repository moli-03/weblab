export default defineNuxtPlugin(() => {
  const { initializeAuth, setupTokenRefresh, getAuthHeader } = useAuth();

  initializeAuth();
  setupTokenRefresh();

  return {
    provide: {
      authFetch: $fetch.create({
        onRequest({ options }) {
          options.headers = {
            ...options.headers,
            ...getAuthHeader(),
          };
        },
      }),
    },
  };
});
