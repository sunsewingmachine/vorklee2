'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Link from 'next/link';
import { NotesExplorer } from '@/components/explorer/NotesExplorer';
import { useDashboard } from '@/contexts/DashboardContext';

interface Note {
  id: string;
  title: string | null;
  content: string | null;
  notebookId: string | null;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string | Date | null;
  updatedAt: string | Date | null;
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
  createdAt: string | Date | null;
  updatedAt: string | Date | null;
}

async function fetchNotes(tagIds?: string[]): Promise<Note[]> {
  const url = tagIds && tagIds.length > 0
    ? `/api/notes?tagIds=${tagIds.join(',')}`
    : '/api/notes';
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch notes');
  }
  const json = await response.json();
  return json.data || [];
}

async function fetchNotebooks(): Promise<Notebook[]> {
  const response = await fetch('/api/notebooks');
  if (!response.ok) {
    throw new Error('Failed to fetch notebooks');
  }
  const json = await response.json();
  return json.data || [];
}

export default function DashboardPage() {
  const { viewState, selectedTagIds } = useDashboard();

  const { data: notes, isLoading: notesLoading, error: notesError } = useQuery({
    queryKey: ['notes', selectedTagIds],
    queryFn: () => fetchNotes(selectedTagIds.length > 0 ? selectedTagIds : undefined),
  });

  const { data: notebooks, isLoading: notebooksLoading, error: notebooksError } = useQuery({
    queryKey: ['notebooks'],
    queryFn: fetchNotebooks,
  });

  const isLoading = notesLoading || notebooksLoading;
  const error = notesError || notebooksError;

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
      {!hasContent ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No notes yet
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Create your first note to get started
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
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
          notes={notes || []}
          notebooks={notebooks || []}
          viewFilter={viewState.filter}
          viewMode={viewState.mode}
        />
      )}
    </Box>
  );
}
