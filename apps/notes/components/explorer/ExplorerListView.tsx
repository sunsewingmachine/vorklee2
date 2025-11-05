'use client';

import React from 'react';
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

export function ExplorerListView({ notes, viewFilter }: ExplorerListViewProps) {
  const shouldShowNotes = viewFilter === 'tasks' || viewFilter === 'combined';

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
              <TableRow key={note.id} hover>
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
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

