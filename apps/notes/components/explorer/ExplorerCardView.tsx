'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Grid,
  Typography,
} from '@mui/material';
import PushPinIcon from '@mui/icons-material/PushPin';
import FolderIcon from '@mui/icons-material/Folder';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ContextMenu } from './ContextMenu';
import type { ViewFilter } from './ViewFilterBar';

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
}

interface ExplorerCardViewProps {
  notes: Note[];
  notebooks: Notebook[];
  viewFilter: ViewFilter;
  selectedNoteId?: string | null;
  onNoteSelect?: (noteId: string | null) => void;
}

function NoteCard({
  note,
  notebooks,
  onRename,
  onDelete,
  onEdit,
  selectedNoteId,
  onNoteSelect,
}: {
  note: Note;
  notebooks: Notebook[];
  onRename: (id: string, newName: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEdit: (id: string) => void;
  selectedNoteId?: string | null;
  onNoteSelect?: (noteId: string | null) => void;
}) {
  const getNotebookName = (notebookId: string | null): string | null => {
    if (!notebookId) return null;
    const notebook = notebooks.find((nb) => nb.id === notebookId);
    return notebook ? notebook.name : null;
  };
  const [contextMenuAnchor, setContextMenuAnchor] = useState<HTMLElement | null>(null);

  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuAnchor(e.currentTarget);
  };

  const handleRename = async (newName: string) => {
    await onRename(note.id, newName);
  };

  const handleDelete = async () => {
    await onDelete(note.id);
  };

  const handleClick = () => {
    if (onNoteSelect) {
      onNoteSelect(note.id === selectedNoteId ? null : note.id);
    }
  };

  return (
    <>
      <Card
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          cursor: onNoteSelect ? 'pointer' : 'default',
          border: selectedNoteId === note.id ? 2 : 1,
          borderColor: selectedNoteId === note.id ? 'primary.main' : 'divider',
          '&:hover': {
            boxShadow: selectedNoteId === note.id ? 4 : 2,
          },
        }}
        onContextMenu={handleContextMenu}
        onClick={onNoteSelect ? handleClick : undefined}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Box display="flex" alignItems="center" mb={1}>
            <Typography 
              variant="h6" 
              component="h2" 
              flexGrow={1}
              sx={{
                bgcolor: note.tags && note.tags.length > 0 && note.tags[0].color 
                  ? note.tags[0].color 
                  : 'action.selected',
                color: note.tags && note.tags.length > 0 && note.tags[0].color 
                  ? 'white' 
                  : 'text.primary',
                px: 1,
                py: 0.5,
                borderRadius: 1,
              }}
            >
              {note.title || 'Untitled Note'}
            </Typography>
            {note.isPinned && <PushPinIcon fontSize="small" color="primary" />}
          </Box>
          {getNotebookName(note.notebookId) && (
            <Box mb={1} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <FolderIcon fontSize="small" sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                {getNotebookName(note.notebookId)}
              </Typography>
            </Box>
          )}
          {note.tags && note.tags.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
              {note.tags.slice(0, 3).map((tag) => (
                <Box
                  key={tag.id}
                  component="span"
                  sx={{
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 0.5,
                    bgcolor: tag.color || '#1976d2',
                    color: 'white',
                    fontSize: '0.7rem',
                    fontWeight: 500,
                  }}
                >
                  {tag.name}
                </Box>
              ))}
              {note.tags.length > 3 && (
                <Box
                  component="span"
                  sx={{
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 0.5,
                    bgcolor: 'action.selected',
                    color: 'text.secondary',
                    fontSize: '0.7rem',
                    fontWeight: 500,
                  }}
                >
                  +{note.tags.length - 3} more
                </Box>
              )}
            </Box>
          )}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {note.content || 'No content'}
          </Typography>
          <Box mt={2}>
            <Typography variant="caption" color="text.secondary">
              Updated: {new Date(note.updatedAt || note.createdAt || '').toLocaleDateString()}
            </Typography>
          </Box>
        </CardContent>
        <CardActions>
          {onNoteSelect ? (
            <Typography variant="body2" color="primary">
              View
            </Typography>
          ) : (
            <Box component={Link} href={`/dashboard/notes/${note.id}`} sx={{ textDecoration: 'none' }}>
              <Typography variant="body2" color="primary">
                Open
              </Typography>
            </Box>
          )}
        </CardActions>
      </Card>
      <ContextMenu
        anchorEl={contextMenuAnchor}
        open={Boolean(contextMenuAnchor)}
        onClose={() => setContextMenuAnchor(null)}
        type="task"
        itemId={note.id}
        itemName={note.title || 'Untitled Note'}
        onRename={handleRename}
        onDelete={handleDelete}
        onEdit={() => onEdit(note.id)}
      />
    </>
  );
}

export function ExplorerCardView({ notes, notebooks, viewFilter, selectedNoteId, onNoteSelect }: ExplorerCardViewProps) {
  const shouldShowNotes = viewFilter === 'tasks' || viewFilter === 'combined';
  const queryClient = useQueryClient();
  const router = useRouter();

  // Mutations for notes
  const renameNoteMutation = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to rename note');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete note');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  const handleRenameNote = async (id: string, newName: string) => {
    await renameNoteMutation.mutateAsync({ id, title: newName });
  };

  const handleDeleteNote = async (id: string) => {
    await deleteNoteMutation.mutateAsync(id);
  };

  const handleEdit = (id: string) => {
    router.push(`/dashboard/notes/${id}?edit=true`);
  };

  if (!shouldShowNotes) {
    return null;
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {notes.map((note) => (
          <Grid item xs={12} sm={6} md={4} key={note.id}>
            <NoteCard
              note={note}
              notebooks={notebooks}
              onRename={handleRenameNote}
              onDelete={handleDeleteNote}
              onEdit={handleEdit}
              selectedNoteId={selectedNoteId}
              onNoteSelect={onNoteSelect}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

