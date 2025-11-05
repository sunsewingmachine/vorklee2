'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ViewModeToggle, type ViewState } from '@/components/explorer/ViewModeToggle';

const VIEW_STATE_STORAGE_KEY = 'notes-dashboard-view-state';

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
  // Load view state from localStorage on mount
  const [viewState, setViewState] = useState<ViewState>(() => {
    if (typeof window === 'undefined') {
      return { mode: 'tree', filter: 'combined' };
    }
    
    try {
      const stored = localStorage.getItem(VIEW_STATE_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as ViewState;
      }
    } catch (error) {
      console.error('Failed to load view state from localStorage:', error);
    }
    
    return { mode: 'tree', filter: 'combined' };
  });
  
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  // Save view state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(VIEW_STATE_STORAGE_KEY, JSON.stringify(viewState));
    } catch (error) {
      console.error('Failed to save view state to localStorage:', error);
    }
  }, [viewState]);

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

