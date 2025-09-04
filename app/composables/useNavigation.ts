import type { NavigationMenuItem } from "@nuxt/ui";

type Route = "home" | "discover";

export const useNavigation = () => {
  const activeRoute = useState<Route>("activeRoute", () => "home");

  const navigation = computed<NavigationMenuItem[]>(() => [
    {
      label: "Home",
      icon: "material-symbols:home-outline",
      to: "/workspaces",
      active: activeRoute.value === "home",
    },
    {
      label: "Discover",
      icon: "material-symbols:explore-outline",
      to: "/workspaces/discover",
      active: activeRoute.value === "discover",
    },
  ]);

  const setActiveRoute = (route: Route) => {
    activeRoute.value = route;
  };

  return {
    navigation,
    activeRoute: readonly(activeRoute),
    setActiveRoute,
  };
};
