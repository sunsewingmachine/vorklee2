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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Link from 'next/link';
import { TagFilterBar } from '@/components/explorer/TagFilterBar';
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

export default function DashboardPage() {
  const { viewState } = useDashboard();
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const { data: notes, isLoading: notesLoading, error: notesError } = useQuery({
    queryKey: ['notes', selectedTagIds],
    queryFn: () => fetchNotes(selectedTagIds.length > 0 ? selectedTagIds : undefined),
  });

  const isLoading = notesLoading;
  const error = notesError;

  const handleTagToggle = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleClearFilters = () => {
    setSelectedTagIds([]);
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

  const hasContent = notes && notes.length > 0;

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
        <>
          <TagFilterBar
            selectedTagIds={selectedTagIds}
            onTagToggle={handleTagToggle}
            onClearFilters={handleClearFilters}
          />
          <NotesExplorer
            notes={notes || []}
            viewFilter={viewState.filter}
            viewMode={viewState.mode}
          />
        </>
      )}
    </Box>
  );
}
