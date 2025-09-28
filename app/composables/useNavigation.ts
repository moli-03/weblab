import type { NavigationMenuItem } from "@nuxt/ui";

type Route = "your-workspaces" | "discover-workspaces";

export const useNavigation = () => {
  const activeRoute = useState<Route>("activeRoute", () => "your-workspaces");

  const navigation = computed<NavigationMenuItem[]>(() => [
    {
      label: "Your Workspaces",
      icon: "material-symbols:home-outline",
      to: "/workspaces",
      active: activeRoute.value === "your-workspaces",
    },
    {
      label: "Discover Workspaces",
      icon: "material-symbols:explore-outline",
      to: "/workspaces/discover",
      active: activeRoute.value === "discover-workspaces",
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
