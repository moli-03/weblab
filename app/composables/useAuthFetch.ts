export const useAuthFetch: typeof useFetch = (request, options?) => {
  const { $authFetch } = useNuxtApp();

  return useFetch(request, {
    ...options,
    $fetch: $authFetch,
  });
};
