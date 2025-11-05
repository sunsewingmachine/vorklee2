'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Toolbar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FolderIcon from '@mui/icons-material/Folder';
import Link from 'next/link';
import { NotesExplorer } from '@/components/explorer/NotesExplorer';
import { ViewFilterBar, type ViewFilter } from '@/components/explorer/ViewFilterBar';
import { ViewModeToggle, type ViewMode } from '@/components/explorer/ViewModeToggle';
import { CreateNotebookDialog } from '@/components/notebooks/CreateNotebookDialog';
import type { NotebookWithChildren } from '@/services/notebooks.service';

interface Note {
  id: string;
  title: string | null;
  content: string | null;
  notebookId: string | null;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string | Date | null;
  updatedAt: string | Date | null;
}

async function fetchNotes(): Promise<Note[]> {
  const response = await fetch('/api/notes');
  if (!response.ok) {
    throw new Error('Failed to fetch notes');
  }
  const json = await response.json();
  return json.data || [];
}

async function fetchNotebooksHierarchical(): Promise<NotebookWithChildren[]> {
  const response = await fetch('/api/notebooks?hierarchical=true');
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch notebooks (${response.status})`);
  }
  const json = await response.json();
  return Array.isArray(json.data) ? json.data : [];
}

export default function DashboardPage() {
  const [viewFilter, setViewFilter] = useState<ViewFilter>('combined');
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createSubFolderParentId, setCreateSubFolderParentId] = useState<string | null>(null);
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | undefined>();

  const { data: notes, isLoading: notesLoading, error: notesError } = useQuery({
    queryKey: ['notes'],
    queryFn: fetchNotes,
  });

  const { data: notebooks, isLoading: notebooksLoading, error: notebooksError } = useQuery({
    queryKey: ['notebooks', 'hierarchical'],
    queryFn: fetchNotebooksHierarchical,
  });

  const isLoading = notesLoading || notebooksLoading;
  const error = notesError || notebooksError;

  const handleCreateNotebook = () => {
    setCreateSubFolderParentId(null);
    setCreateDialogOpen(true);
  };

  const handleCreateSubFolder = (parentId: string) => {
    setCreateSubFolderParentId(parentId);
    setCreateDialogOpen(true);
  };

  const handleSelectNotebook = (notebookId: string) => {
    setSelectedNotebookId(notebookId);
    // TODO: Navigate to notebook detail page or filter notes
  };

  const handleEditNotebook = (notebookId: string) => {
    // TODO: Open edit notebook dialog
    console.log('Edit notebook:', notebookId);
  };

  const handleDeleteNotebook = (notebookId: string) => {
    // TODO: Show delete confirmation dialog
    console.log('Delete notebook:', notebookId);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load: {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    );
  }

  const hasContent = (notes && notes.length > 0) || (notebooks && notebooks.length > 0);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          All Notes
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FolderIcon />}
            onClick={handleCreateNotebook}
          >
            New Notebook
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            component={Link}
            href="/dashboard/notes/new"
          >
            New Note
          </Button>
        </Box>
      </Box>

      <Toolbar
        variant="dense"
        sx={{
          px: 0,
          minHeight: 48,
          display: 'flex',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <ViewFilterBar value={viewFilter} onChange={setViewFilter} />
        <ViewModeToggle value={viewMode} onChange={setViewMode} />
      </Toolbar>

      {!hasContent ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No notes or notebooks yet
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Create your first note or notebook to get started
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<FolderIcon />}
                onClick={handleCreateNotebook}
              >
                Create Notebook
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                component={Link}
                href="/dashboard/notes/new"
              >
                Create Note
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <NotesExplorer
          notebooks={notebooks || []}
          notes={notes || []}
          viewFilter={viewFilter}
          viewMode={viewMode}
          onSelect={handleSelectNotebook}
          onEdit={handleEditNotebook}
          onDelete={handleDeleteNotebook}
          onCreateSubFolder={handleCreateSubFolder}
          selectedId={selectedNotebookId}
        />
      )}

      <CreateNotebookDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        parentId={createSubFolderParentId}
        notebooks={notebooks || []}
      />
    </Box>
  );
}


