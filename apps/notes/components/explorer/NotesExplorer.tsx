'use client';

import React from 'react';
import { Box, Card, CardContent } from '@mui/material';
import { ExplorerTreeView } from './ExplorerTreeView';
import { ExplorerCardView } from './ExplorerCardView';
import { ExplorerListView } from './ExplorerListView';
import type { ViewFilter } from './ViewFilterBar';
import type { ViewMode } from './ViewModeToggle';

interface Note {
  id: string;
  title: string | null;
  content: string | null;
  notebookId: string | null;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
  tags?: Array<{
    id: string;
    name: string;
    color: string | null;
  }>;
}

interface Notebook {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  parentId: string | null;
  isDefault: boolean;
  isArchived: boolean;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
}

interface NotesExplorerProps {
  notes: Note[];
  notebooks: Notebook[];
  viewFilter: ViewFilter;
  viewMode: ViewMode;
}

export function NotesExplorer({
  notes,
  notebooks,
  viewFilter,
  viewMode,
}: NotesExplorerProps) {
  const renderView = () => {
    switch (viewMode) {
      case 'tree':
        return (
          <Card>
            <CardContent sx={{ py: 1 }}>
              <ExplorerTreeView
                notes={notes}
                notebooks={notebooks}
                viewFilter={viewFilter}
              />
            </CardContent>
          </Card>
        );
      case 'cards':
        return <ExplorerCardView notes={notes} viewFilter={viewFilter} />;
      case 'list':
        return <ExplorerListView notes={notes} viewFilter={viewFilter} />;
      default:
        return null;
    }
  };

  return <Box>{renderView()}</Box>;
}

