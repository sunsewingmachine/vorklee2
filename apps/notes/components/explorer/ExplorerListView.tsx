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
import ListAltIcon from '@mui/icons-material/ListAlt';
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

interface ExplorerListViewProps {
  notes: Note[];
  notebooks: Notebook[];
  viewFilter: ViewFilter;
  selectedNoteId?: string | null;
  onNoteSelect?: (noteId: string | null) => void;
}

function NoteRow({
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

  const handleClick = () => {
    if (onNoteSelect) {
      onNoteSelect(note.id === selectedNoteId ? null : note.id);
    }
  };

  return (
    <>
      <TableRow 
        hover 
        onContextMenu={handleContextMenu}
        onClick={onNoteSelect ? handleClick : undefined}
        selected={selectedNoteId === note.id}
        sx={{
          cursor: onNoteSelect ? 'pointer' : 'default',
          bgcolor: selectedNoteId === note.id ? 'action.selected' : 'transparent',
          '&:hover': {
            bgcolor: selectedNoteId === note.id ? 'action.selected' : 'action.hover',
          },
        }}
      >
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {note.isPinned && <PushPinIcon fontSize="small" color="primary" sx={{ fontSize: 16 }} />}
            <ListAltIcon fontSize="small" sx={{ fontSize: 18 }} />
          </Box>
        </TableCell>
        <TableCell>
          <Typography variant="body2" fontWeight={500}>
            {note.title || 'Untitled Note'}
          </Typography>
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {getNotebookName(note.notebookId) ? (
              <>
                <FolderIcon fontSize="small" sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {getNotebookName(note.notebookId)}
                </Typography>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                -
              </Typography>
            )}
          </Box>
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

export function ExplorerListView({ notes, notebooks, viewFilter, selectedNoteId, onNoteSelect }: ExplorerListViewProps) {
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
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width="40px"></TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Folder</TableCell>
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
                notebooks={notebooks}
                onRename={handleRenameNote}
                onDelete={handleDeleteNote}
                onEdit={handleEdit}
                selectedNoteId={selectedNoteId}
                onNoteSelect={onNoteSelect}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

