import { createContext, FC, PropsWithChildren, useContext } from "react";
import { SharedValue, useSharedValue } from "react-native-reanimated";

// app-store-header-animation 🔽

// Centralized scroll state for header/screen coordination.
// Keeping a single SharedValue avoids desync between headerBackground and in-screen fades.
type ContextValue = {
  scrollY: SharedValue<number>;
};

const ScrollContext = createContext<ContextValue>({} as ContextValue);

export const ScrollProvider: FC<PropsWithChildren> = ({ children }) => {
  // Shared scroll position driving all header-related interpolations.
  // Using useSharedValue keeps updates on the UI thread for 60fps animations.
  const scrollY = useSharedValue(0);

  const value = { scrollY };

  // Context lets both the layout header and the route screen read the same source of truth.
  return <ScrollContext.Provider value={value}>{children}</ScrollContext.Provider>;
};

export const useScrollContext = () => {
  const context = useContext(ScrollContext);

  if (!context) {
    throw new Error("useScrollContext must be used within ScrollProvider");
  }
  return context;
};

// app-store-header-animation 🔼
