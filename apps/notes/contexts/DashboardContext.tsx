'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ViewModeToggle, type ViewState } from '@/components/explorer/ViewModeToggle';

interface DashboardContextValue {
  viewState: ViewState;
  setViewState: (state: ViewState) => void;
  onCreateNotebook: (() => void) | null;
  setOnCreateNotebook: (handler: (() => void) | null) => void;
}

const DashboardContext = createContext<DashboardContextValue | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [viewState, setViewState] = useState<ViewState>({
    mode: 'tree',
    filter: 'combined',
  });
  const [onCreateNotebook, setOnCreateNotebook] = useState<(() => void) | null>(null);

  return (
    <DashboardContext.Provider
      value={{
        viewState,
        setViewState,
        onCreateNotebook,
        setOnCreateNotebook,
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

