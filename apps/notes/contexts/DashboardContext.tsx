'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ViewModeToggle, type ViewState } from '@/components/explorer/ViewModeToggle';

interface DashboardContextValue {
  viewState: ViewState;
  setViewState: (state: ViewState) => void;
}

const DashboardContext = createContext<DashboardContextValue | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [viewState, setViewState] = useState<ViewState>({
    mode: 'tree',
    filter: 'combined',
  });

  return (
    <DashboardContext.Provider
      value={{
        viewState,
        setViewState,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}

