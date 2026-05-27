import React, { createContext, useContext, useState, useCallback } from "react";
import type { Route } from "../routes/index.js";

interface RouteContextType {
  currentRoute: Route;
  navigate: (route: Route) => void;
}

const RouteContext = createContext<RouteContextType>({
  currentRoute: "home",
  navigate: () => { },
});

export function RouteProvider({ children }: { children: React.ReactNode }) {
  const [currentRoute, setCurrentRoute] = useState<Route>("home");

  const navigate = useCallback((route: Route) => {
    setCurrentRoute(route);
  }, []);

  return (
    <RouteContext.Provider value={{ currentRoute, navigate }}>
      {children}
    </RouteContext.Provider>
  );
}

export function useRoute() {
  return useContext(RouteContext);
}
