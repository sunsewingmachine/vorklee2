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
  IconButton,
  Chip,
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

interface ExplorerListViewProps {
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

export function ExplorerListView({ notebooks, notes, viewFilter }: ExplorerListViewProps) {
  const shouldShowFolders = viewFilter === 'folders' || viewFilter === 'combined';
  const shouldShowNotes = viewFilter === 'tasks' || viewFilter === 'combined';

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
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allNotebooks.map((notebook) => {
                  const folderPath = getFolderPath(notebook.id, notebooks);
                  return (
                    <TableRow key={notebook.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FolderIcon sx={{ color: notebook.color || 'primary.main', fontSize: 20 }} />
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {notebook.name}
                            </Typography>
                            {folderPath.length > 1 && (
                              <Typography variant="caption" color="text.secondary">
                                {folderPath.slice(0, -1).join(' / ')}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {notebook.description || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {notebook.createdAt ? new Date(notebook.createdAt).toLocaleDateString() : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box component={Link} href={`/dashboard/notebooks/${notebook.id}`} sx={{ textDecoration: 'none' }}>
                          <Typography variant="body2" color="primary">
                            Open
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {shouldShowNotes && (
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
                  <TableCell>Folder</TableCell>
                  <TableCell>Preview</TableCell>
                  <TableCell>Updated</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {notes.map((note) => {
                  const folderPath = getFolderPath(note.notebookId, notebooks);
                  return (
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
                        {folderPath.length > 0 ? (
                          <Chip
                            label={folderPath.join(' / ')}
                            size="small"
                            icon={<FolderIcon sx={{ fontSize: 16 }} />}
                            sx={{ maxWidth: 200 }}
                          />
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
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
}

