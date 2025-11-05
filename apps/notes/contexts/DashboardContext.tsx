'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ViewModeToggle, type ViewState } from '@/components/explorer/ViewModeToggle';

interface DashboardContextValue {
  viewState: ViewState;
  setViewState: (state: ViewState) => void;
  selectedTagIds: string[];
  setSelectedTagIds: (ids: string[]) => void;
  handleTagToggle: (tagId: string) => void;
  handleClearTagFilters: () => void;
}

const DashboardContext = createContext<DashboardContextValue | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [viewState, setViewState] = useState<ViewState>({
    mode: 'tree',
    filter: 'combined',
  });
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const handleTagToggle = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleClearTagFilters = () => {
    setSelectedTagIds([]);
  };

  return (
    <DashboardContext.Provider
      value={{
        viewState,
        setViewState,
        selectedTagIds,
        setSelectedTagIds,
        handleTagToggle,
        handleClearTagFilters,
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

