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

interface ExplorerCardViewProps {
  notes: Note[];
  viewFilter: ViewFilter;
}

function NoteCard({
  note,
  onRename,
  onDelete,
  onEdit,
}: {
  note: Note;
  onRename: (id: string, newName: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEdit: (id: string) => void;
}) {
  const [contextMenuAnchor, setContextMenuAnchor] = useState<HTMLElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'note',
      id: note.id,
    }));
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.stopPropagation();
    setIsDragging(false);
  };

  return (
    <>
      <Card
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          cursor: isDragging ? 'grabbing' : 'grab',
          opacity: isDragging ? 0.5 : 1,
        }}
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        draggable
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Box display="flex" alignItems="center" mb={1}>
            <Typography variant="h6" component="h2" flexGrow={1}>
              {note.title || 'Untitled Note'}
            </Typography>
            {note.isPinned && <PushPinIcon fontSize="small" color="primary" />}
          </Box>
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
          <Box component={Link} href={`/dashboard/notes/${note.id}`} sx={{ textDecoration: 'none' }}>
            <Typography variant="body2" color="primary">
              Open
            </Typography>
          </Box>
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

export function ExplorerCardView({ notes, viewFilter }: ExplorerCardViewProps) {
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
    router.push(`/dashboard/notes/${id}`);
  };

  if (!shouldShowNotes) {
    return null;
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Notes
      </Typography>
      <Grid container spacing={3}>
        {notes.map((note) => (
          <Grid item xs={12} sm={6} md={4} key={note.id}>
            <NoteCard
              note={note}
              onRename={handleRenameNote}
              onDelete={handleDeleteNote}
              onEdit={handleEdit}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

