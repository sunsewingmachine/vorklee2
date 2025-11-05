'use client';

import React from 'react';
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

export function ExplorerCardView({ notes, viewFilter }: ExplorerCardViewProps) {
  const shouldShowNotes = viewFilter === 'tasks' || viewFilter === 'combined';

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
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" alignItems="center" mb={1}>
                  <Typography variant="h6" component="h2" flexGrow={1}>
                    {note.title || 'Untitled Note'}
                  </Typography>
                  {note.isPinned && (
                    <PushPinIcon fontSize="small" color="primary" />
                  )}
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
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

