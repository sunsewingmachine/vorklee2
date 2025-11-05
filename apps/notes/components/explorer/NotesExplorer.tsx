'use client';

import React, { useState } from 'react';
import { Box, Card, CardContent } from '@mui/material';
import { ExplorerTreeView } from './ExplorerTreeView';
import { ExplorerCardView } from './ExplorerCardView';
import { ExplorerListView } from './ExplorerListView';
import type { ViewFilter } from './ViewFilterBar';
import type { ViewMode } from './ViewModeToggle';
import type { NotebookWithChildren } from '@/services/notebooks.service';

interface Note {
  id: string;
  title: string | null;
  content: string | null;
  notebookId: string | null;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
}

interface NotesExplorerProps {
  notebooks: NotebookWithChildren[];
  notes: Note[];
  viewFilter: ViewFilter;
  viewMode: ViewMode;
  onSelect?: (notebookId: string) => void;
  onEdit?: (notebookId: string) => void;
  onDelete?: (notebookId: string) => void;
  onCreateSubFolder?: (parentId: string) => void;
  selectedId?: string;
}

export function NotesExplorer({
  notebooks,
  notes,
  viewFilter,
  viewMode,
  onSelect,
  onEdit,
  onDelete,
  onCreateSubFolder,
  selectedId,
}: NotesExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const handleToggleExpand = (notebookId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(notebookId)) {
        newSet.delete(notebookId);
      } else {
        newSet.add(notebookId);
      }
      return newSet;
    });
  };

  const renderView = () => {
    switch (viewMode) {
      case 'tree':
        return (
          <Card>
            <CardContent sx={{ py: 1 }}>
              <ExplorerTreeView
                notebooks={notebooks}
                notes={notes}
                viewFilter={viewFilter}
                onSelect={onSelect}
                onEdit={onEdit}
                onDelete={onDelete}
                onCreateSubFolder={onCreateSubFolder}
                selectedId={selectedId}
                expandedFolders={expandedFolders}
                onToggleExpand={handleToggleExpand}
              />
            </CardContent>
          </Card>
        );
      case 'cards':
        return <ExplorerCardView notebooks={notebooks} notes={notes} viewFilter={viewFilter} />;
      case 'list':
        return <ExplorerListView notebooks={notebooks} notes={notes} viewFilter={viewFilter} />;
      default:
        return null;
    }
  };

  return <Box>{renderView()}</Box>;
}

