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
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { NotesExplorer } from '@/components/explorer/NotesExplorer';
import { ResizableSplitPane } from '@/components/explorer/ResizableSplitPane';
import { NoteContentViewer } from '@/components/explorer/NoteContentViewer';
import { useDashboard } from '@/contexts/DashboardContext';
import { useState, useEffect } from 'react';

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

function DashboardPageContent() {
  const { viewState, selectedTagIds } = useDashboard();
  const searchParams = useSearchParams();
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const [highlightedItemType, setHighlightedItemType] = useState<'note' | 'folder' | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  // Get highlight params from URL
  useEffect(() => {
    const highlightId = searchParams.get('highlight');
    const highlightType = searchParams.get('highlightType') as 'note' | 'folder' | null;
    
    if (highlightId && highlightType) {
      setHighlightedItemId(highlightId);
      setHighlightedItemType(highlightType);
      
      // If it's a note, also select it
      if (highlightType === 'note') {
        setSelectedNoteId(highlightId);
      }
      
      // Clear highlight after 3 seconds
      const timer = setTimeout(() => {
        setHighlightedItemId(null);
        setHighlightedItemType(null);
        // Remove from URL without page reload
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.delete('highlight');
          url.searchParams.delete('highlightType');
          window.history.replaceState({}, '', url.toString());
        }
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

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

  const selectedNote = notes?.find((note) => note.id === selectedNoteId) || null;

  const hasContent = (notes && notes.length > 0) || (notebooks && notebooks.length > 0);

  return (
    <Box sx={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column', margin: -3 }}>
      {!hasContent ? (
        <Card sx={{ textAlign: 'center', py: 8, m: 3 }}>
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
        <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <ResizableSplitPane
            defaultLeftWidth={50}
            minLeftWidth={30}
            minRightWidth={30}
            left={
              <Box sx={{ height: '100%', overflow: 'auto', p: 2 }}>
                <NotesExplorer
                  notes={notes || []}
                  notebooks={notebooks || []}
                  viewFilter={viewState.filter}
                  viewMode={viewState.mode}
                  highlightedItemId={highlightedItemId}
                  highlightedItemType={highlightedItemType}
                  selectedNoteId={selectedNoteId}
                  onNoteSelect={setSelectedNoteId}
                />
              </Box>
            }
            right={
              <NoteContentViewer
                note={selectedNote}
                notebooks={notebooks || []}
                onClose={() => setSelectedNoteId(null)}
              />
            }
          />
        </Box>
      )}
    </Box>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    }>
      <DashboardPageContent />
    </Suspense>
  );
}
