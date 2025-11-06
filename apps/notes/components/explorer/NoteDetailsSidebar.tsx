'use client';

import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Divider,
  Paper,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

interface Note {
  id: string;
  title: string | null;
  content: string | null;
  notebookId: string | null;
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

interface NoteDetailsSidebarProps {
  note: Note | null;
  notebooks: Notebook[];
}

export function NoteDetailsSidebar({ note, notebooks }: NoteDetailsSidebarProps) {
  if (!note) {
    return (
      <Paper
        sx={{
          height: '100%',
          p: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Select a note to view details
        </Typography>
      </Paper>
    );
  }

  const notebook = note.notebookId
    ? notebooks.find((nb) => nb.id === note.notebookId)
    : null;

  return (
    <Paper
      sx={{
        height: '100%',
        p: 3,
        overflow: 'auto',
        bgcolor: 'background.default',
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}
        >
          Folder path
        </Typography>
        <Box sx={{ mt: 1 }}>
          {notebook ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <FolderIcon fontSize="small" sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2">{notebook.name}</Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No folder
            </Typography>
          )}
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ mb: 3 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}
        >
          Tags
        </Typography>
        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {note.tags && note.tags.length > 0 ? (
            note.tags.map((tag) => (
              <Chip
                key={tag.id}
                label={tag.name}
                size="small"
                sx={{
                  bgcolor: tag.color || '#1976d2',
                  color: 'white',
                  fontSize: '0.75rem',
                  height: 24,
                }}
              />
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              No tags
            </Typography>
          )}
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ mb: 3 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}
        >
          Created
        </Typography>
        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <AccessTimeIcon fontSize="small" sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="body2">
            {note.createdAt
              ? new Date(note.createdAt).toLocaleString()
              : 'Unknown'}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ mb: 3 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}
        >
          Note title
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, fontWeight: 500 }}>
          {note.title || 'Untitled Note'}
        </Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}
        >
          Note details
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary" paragraph>
            <strong>Updated:</strong>{' '}
            {note.updatedAt
              ? new Date(note.updatedAt).toLocaleString()
              : 'Never'}
          </Typography>
          {note.content && (
            <Typography variant="body2" color="text.secondary">
              <strong>Preview:</strong> {note.content.substring(0, 200)}
              {note.content.length > 200 ? '...' : ''}
            </Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );
}

