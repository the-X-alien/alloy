import React, { createContext, useContext } from "react";
import type { PluginRuntime } from "../../plugin/runtime.js";

interface PluginContextType {
  runtime: PluginRuntime | null;
}

const PluginContext = createContext<PluginContextType>({ runtime: null });

export function PluginProvider({ children, runtime }: { children: React.ReactNode; runtime: PluginRuntime | null }) {
  return (
    <PluginContext.Provider value={{ runtime }}>
      {children}
    </PluginContext.Provider>
  );
}

export function usePlugin() {
  return useContext(PluginContext);
}
