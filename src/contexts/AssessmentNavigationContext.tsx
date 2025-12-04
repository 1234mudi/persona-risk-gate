import React, { createContext, useContext, useState, ReactNode } from "react";

type TabType = "inherent" | "control" | "residual" | "treatment";

interface AssessmentNavigationContextType {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const AssessmentNavigationContext = createContext<AssessmentNavigationContextType | undefined>(undefined);

export const AssessmentNavigationProvider = ({ children }: { children: ReactNode }) => {
  const [activeTab, setActiveTab] = useState<TabType>("inherent");

  return (
    <AssessmentNavigationContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </AssessmentNavigationContext.Provider>
  );
};

export const useAssessmentNavigation = () => {
  const context = useContext(AssessmentNavigationContext);
  if (!context) {
    return { activeTab: "inherent" as TabType, setActiveTab: () => {} };
  }
  return context;
};
