'use client';

import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
} from '@mui/material';
import PushPinIcon from '@mui/icons-material/PushPin';
import NoteIcon from '@mui/icons-material/Note';
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

interface ExplorerListViewProps {
  notes: Note[];
  viewFilter: ViewFilter;
}

function NoteRow({
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

  const handleContextMenu = (e: React.MouseEvent<HTMLTableRowElement>) => {
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
      <TableRow 
        hover 
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        draggable
        sx={{ 
          cursor: isDragging ? 'grabbing' : 'grab',
          opacity: isDragging ? 0.5 : 1,
        }}
      >
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {note.isPinned && <PushPinIcon fontSize="small" color="primary" sx={{ fontSize: 16 }} />}
            <NoteIcon fontSize="small" sx={{ fontSize: 18 }} />
          </Box>
        </TableCell>
        <TableCell>
          <Typography variant="body2" fontWeight={500}>
            {note.title || 'Untitled Note'}
          </Typography>
        </TableCell>
        <TableCell>
          {note.tags && note.tags.length > 0 ? (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {note.tags.map((tag) => (
                <Chip
                  key={tag.id}
                  label={tag.name}
                  size="small"
                  sx={{
                    bgcolor: tag.color || '#1976d2',
                    color: 'white',
                    fontSize: '0.7rem',
                    height: 20,
                  }}
                />
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              -
            </Typography>
          )}
        </TableCell>
        <TableCell>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              maxWidth: 300,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {note.content || 'No content'}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2" color="text.secondary">
            {note.updatedAt || note.createdAt
              ? new Date(note.updatedAt || note.createdAt!).toLocaleDateString()
              : '-'}
          </Typography>
        </TableCell>
        <TableCell align="right">
          <Box component={Link} href={`/dashboard/notes/${note.id}`} sx={{ textDecoration: 'none' }}>
            <Typography variant="body2" color="primary">
              Open
            </Typography>
          </Box>
        </TableCell>
      </TableRow>
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

export function ExplorerListView({ notes, viewFilter }: ExplorerListViewProps) {
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
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width="40px"></TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Tags</TableCell>
              <TableCell>Preview</TableCell>
              <TableCell>Updated</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {notes.map((note) => (
              <NoteRow
                key={note.id}
                note={note}
                onRename={handleRenameNote}
                onDelete={handleDeleteNote}
                onEdit={handleEdit}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

