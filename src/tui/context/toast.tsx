import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { Text, Box } from "ink";
import { COLORS } from "../theme.js";

interface ToastMessage {
  id: number;
  text: string;
  type: "info" | "error" | "success" | "warning";
}

interface ToastContextType {
  showToast: (text: string, type?: ToastMessage["type"]) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => { },
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const idRef = useRef(0);

  const showToast = useCallback((text: string, type: ToastMessage["type"] = "info") => {
    const id = ++idRef.current;
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const colorMap: Record<string, string> = {
    info: COLORS.info,
    error: COLORS.error,
    success: COLORS.success,
    warning: COLORS.warning,
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      <Box flexDirection="column" width="100%" height="100%">
        {toasts.length > 0 && (
          <Box flexDirection="column" flexShrink={0}>
            {toasts.map(t => (
              <Box key={t.id} backgroundColor={COLORS.bgElement} paddingX={1} paddingY={0}>
                <Text color={colorMap[t.type] ?? COLORS.text}>{t.text}</Text>
              </Box>
            ))}
          </Box>
        )}
        {children}
      </Box>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
