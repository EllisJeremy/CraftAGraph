import { createContext, useContext } from "react";

export type GraphSettingsContextType = {
  showWeights: boolean;
  showDirection: boolean;
};

export const GraphSettingsContext = createContext<GraphSettingsContextType>({
  showWeights: false,
  showDirection: false,
});

export const useGraphSettings = () => useContext(GraphSettingsContext);
