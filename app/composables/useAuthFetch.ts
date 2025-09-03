export const useAuthFetch: typeof useFetch = (request, options?) => {
  const { getAuthHeader } = useAuth();

  const customFetch = $fetch.create({
    onRequest({ options }) {
      options.headers = {
        ...options.headers,
        ...getAuthHeader(),
      };
    },
  });

  return useFetch(request, {
    ...options,
    $fetch: customFetch,
  });
};
