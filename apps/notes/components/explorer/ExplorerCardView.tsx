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
import NoteIcon from '@mui/icons-material/Note';
import PushPinIcon from '@mui/icons-material/PushPin';
import FolderIcon from '@mui/icons-material/Folder';
import Link from 'next/link';
import type { NotebookWithChildren } from '@/services/notebooks.service';
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
}

interface ExplorerCardViewProps {
  notebooks: NotebookWithChildren[];
  notes: Note[];
  viewFilter: ViewFilter;
}

function getFolderPath(notebookId: string | null, notebooks: NotebookWithChildren[]): string[] {
  if (!notebookId) return [];
  
  // Build a map of all notebooks (flattened)
  const notebookMap = new Map<string, NotebookWithChildren>();
  const flattenNotebooks = (notebooks: NotebookWithChildren[]) => {
    notebooks.forEach(notebook => {
      notebookMap.set(notebook.id, notebook);
      if (notebook.children && notebook.children.length > 0) {
        flattenNotebooks(notebook.children);
      }
    });
  };
  flattenNotebooks(notebooks);
  
  // Build path from notebook to root
  const path: string[] = [];
  let currentId: string | null = notebookId;
  const visited = new Set<string>();
  
  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const notebook = notebookMap.get(currentId);
    if (!notebook) break;
    
    path.unshift(notebook.name);
    currentId = notebook.parentId;
  }
  
  return path;
}

export function ExplorerCardView({ notebooks, notes, viewFilter }: ExplorerCardViewProps) {
  const shouldShowFolders = viewFilter === 'folders' || viewFilter === 'combined';
  const shouldShowNotes = viewFilter === 'tasks' || viewFilter === 'combined';

  // Group notes by notebook
  const notesByNotebook = new Map<string | null, Note[]>();
  notes.forEach(note => {
    const notebookId = note.notebookId || null;
    if (!notesByNotebook.has(notebookId)) {
      notesByNotebook.set(notebookId, []);
    }
    notesByNotebook.get(notebookId)!.push(note);
  });

  // Flatten notebooks recursively
  const flattenNotebooks = (notebooks: NotebookWithChildren[]): NotebookWithChildren[] => {
    const result: NotebookWithChildren[] = [];
    notebooks.forEach(notebook => {
      result.push(notebook);
      if (notebook.children && notebook.children.length > 0) {
        result.push(...flattenNotebooks(notebook.children));
      }
    });
    return result;
  };

  const allNotebooks = flattenNotebooks(notebooks);

  return (
    <Box>
      {shouldShowFolders && (
        <Box mb={4}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Folders
          </Typography>
          <Grid container spacing={2}>
            {allNotebooks.map((notebook) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={notebook.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <FolderIcon sx={{ color: notebook.color || 'primary.main', mr: 1 }} />
                      <Typography variant="h6" component="h2">
                        {notebook.name}
                      </Typography>
                    </Box>
                    {notebook.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {notebook.description}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    <Box component={Link} href={`/dashboard/notebooks/${notebook.id}`} sx={{ textDecoration: 'none' }}>
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
      )}

      {shouldShowNotes && (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Notes
          </Typography>
          <Grid container spacing={3}>
            {notes.map((note) => {
              const folderPath = getFolderPath(note.notebookId, notebooks);
              return (
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
                      {folderPath.length > 0 && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          {folderPath.join(' / ')}
                        </Typography>
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
              );
            })}
          </Grid>
        </Box>
      )}
    </Box>
  );
}

