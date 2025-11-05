'use client';

import React from 'react';
import {
  Box,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  List,
  ListItem,
} from '@mui/material';
import NoteIcon from '@mui/icons-material/Note';
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

interface ExplorerTreeViewProps {
  notes: Note[];
  viewFilter: ViewFilter;
}

export function ExplorerTreeView({ notes, viewFilter }: ExplorerTreeViewProps) {
  const shouldShowNotes = viewFilter === 'tasks' || viewFilter === 'combined';

  if (!shouldShowNotes) {
    return null;
  }

  return (
    <List component="nav" dense sx={{ py: 0 }}>
      {notes.map((note) => (
        <ListItem key={note.id} disablePadding dense sx={{ py: 0.25 }}>
          <ListItemButton
            component={Link}
            href={`/dashboard/notes/${note.id}`}
            dense
            sx={{
              borderRadius: 1,
              py: 0.5,
              px: 1,
              minHeight: 32,
            }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {note.isPinned && <PushPinIcon fontSize="small" color="primary" sx={{ fontSize: 14 }} />}
                <NoteIcon fontSize="small" sx={{ fontSize: 18 }} />
              </Box>
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                  <span>{note.title || 'Untitled Note'}</span>
                  {note.tags && note.tags.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 0.25, flexWrap: 'wrap' }}>
                      {note.tags.slice(0, 2).map((tag) => (
                        <Box
                          key={tag.id}
                          component="span"
                          sx={{
                            px: 0.5,
                            py: 0.125,
                            borderRadius: 0.5,
                            bgcolor: tag.color || '#1976d2',
                            color: 'white',
                            fontSize: '0.625rem',
                            fontWeight: 500,
                            lineHeight: 1.2,
                          }}
                        >
                          {tag.name}
                        </Box>
                      ))}
                      {note.tags.length > 2 && (
                        <Box
                          component="span"
                          sx={{
                            px: 0.5,
                            py: 0.125,
                            borderRadius: 0.5,
                            bgcolor: 'action.selected',
                            color: 'text.secondary',
                            fontSize: '0.625rem',
                            fontWeight: 500,
                            lineHeight: 1.2,
                          }}
                        >
                          +{note.tags.length - 2}
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              }
              secondary={note.content ? note.content.substring(0, 50) + '...' : 'No content'}
            />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
}
