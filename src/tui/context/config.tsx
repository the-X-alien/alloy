import React, { createContext, useContext, useState } from "react";
import { ConfigLoader } from "../../config/loader.js";
import { DEFAULT_CONFIG } from "../../config/defaults.js";
import type { AlloyConfig } from "../../config/schema.js";

interface ConfigContextType {
  config: AlloyConfig;
  updateConfig: (partial: Partial<AlloyConfig>) => void;
}

const ConfigContext = createContext<ConfigContextType>({
  config: DEFAULT_CONFIG,
  updateConfig: () => { },
});

export function ConfigProvider({ children, loader }: { children: React.ReactNode; loader?: ConfigLoader }) {
  const [config, setConfig] = useState(() => loader?.get() ?? DEFAULT_CONFIG);

  const updateConfig = (partial: Partial<AlloyConfig>) => {
    if (loader) loader.update(partial);
    setConfig(prev => ({ ...prev, ...partial }));
  };

  return (
    <ConfigContext.Provider value={{ config, updateConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  return useContext(ConfigContext);
}
