'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  List,
  ListItem,
  Collapse,
  Typography,
} from '@mui/material';
import NoteIcon from '@mui/icons-material/Note';
import PushPinIcon from '@mui/icons-material/PushPin';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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
  description: string | null;
  color: string | null;
  icon: string | null;
  parentId: string | null;
  isDefault: boolean;
  isArchived: boolean;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
}

interface ExplorerTreeViewProps {
  notes: Note[];
  notebooks: Notebook[];
  viewFilter: ViewFilter;
}

interface TreeNode {
  notebook: Notebook;
  children: TreeNode[];
  notes: Note[];
}

function buildTree(
  notebooks: Notebook[],
  notes: Note[],
  parentId: string | null = null
): TreeNode[] {
  const children = notebooks
    .filter((nb) => nb.parentId === parentId)
    .map((nb) => ({
      notebook: nb,
      children: buildTree(notebooks, notes, nb.id),
      notes: notes.filter((note) => note.notebookId === nb.id),
    }));
  return children;
}

function FolderItem({
  node,
  level,
  expandedFolders,
  onToggleFolder,
  viewFilter,
  onRename,
  onDelete,
  onAddTask,
  onDragOver,
  onDrop,
  dragOverFolderId,
  allNotebooks,
  onDragStart,
  onDragEnd,
}: {
  node: TreeNode;
  level: number;
  expandedFolders: Set<string>;
  onToggleFolder: (id: string) => void;
  viewFilter: ViewFilter;
  onRename?: (id: string, newName: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onAddTask?: (notebookId: string) => void;
  onDragOver?: (e: React.DragEvent, folderId: string) => void;
  onDrop?: (e: React.DragEvent, targetFolderId: string) => void;
  dragOverFolderId?: string | null;
  allNotebooks?: Notebook[];
  onDragStart?: (data: { type: 'folder'; id: string }) => void;
  onDragEnd?: () => void;
}) {
  const isExpanded = expandedFolders.has(node.notebook.id);
  const hasChildren = node.children.length > 0 || node.notes.length > 0;
  const shouldShowNotes = viewFilter === 'tasks' || viewFilter === 'combined';
  const [contextMenuAnchor, setContextMenuAnchor] = useState<HTMLElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isDragOver = dragOverFolderId === node.notebook.id;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onToggleFolder(node.notebook.id);
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuAnchor(e.currentTarget);
  };

  const handleRename = async (newName: string) => {
    if (onRename) {
      await onRename(node.notebook.id, newName);
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      await onDelete(node.notebook.id);
    }
  };

  const handleAddTask = () => {
    if (onAddTask) {
      onAddTask(node.notebook.id);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    const dragData = {
      type: 'folder' as const,
      id: node.notebook.id,
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    // Also set in parent component state (handled via callback)
    if (onDragStart) {
      onDragStart(dragData);
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.stopPropagation();
    setIsDragging(false);
    if (onDragEnd) {
      onDragEnd();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (onDragOver) {
      onDragOver(e, node.notebook.id);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDrop) {
      onDrop(e, node.notebook.id);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      <ListItem disablePadding dense sx={{ py: 0.25 }}>
        <ListItemButton
          onClick={handleClick}
          onContextMenu={handleContextMenu}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragLeave={handleDragLeave}
          draggable
          dense
          sx={{
            borderRadius: 1,
            py: 0.5,
            px: 1,
            minHeight: 32,
            pl: 1 + level * 2,
            opacity: isDragging ? 0.5 : 1,
            bgcolor: isDragOver ? 'action.hover' : 'transparent',
            border: isDragOver ? '2px dashed' : '2px solid transparent',
            borderColor: isDragOver ? 'primary.main' : 'transparent',
            cursor: isDragging ? 'grabbing' : 'grab',
            '&:hover': {
              bgcolor: isDragOver ? 'action.hover' : 'action.hover',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {hasChildren ? (
                isExpanded ? (
                  <ExpandLessIcon fontSize="small" sx={{ fontSize: 16 }} />
                ) : (
                  <ExpandMoreIcon fontSize="small" sx={{ fontSize: 16 }} />
                )
              ) : (
                <Box sx={{ width: 16 }} />
              )}
              {isExpanded ? (
                <FolderOpenIcon
                  fontSize="small"
                  sx={{
                    fontSize: 18,
                    color: node.notebook.color || 'primary.main',
                  }}
                />
              ) : (
                <FolderIcon
                  fontSize="small"
                  sx={{
                    fontSize: 18,
                    color: node.notebook.color || 'primary.main',
                  }}
                />
              )}
            </Box>
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {node.notebook.name}
              </Typography>
            }
            secondary={
              node.notebook.description ? (
                <Typography variant="caption" color="text.secondary" noWrap>
                  {node.notebook.description}
                </Typography>
              ) : null
            }
          />
        </ListItemButton>
      </ListItem>

      <ContextMenu
        anchorEl={contextMenuAnchor}
        open={Boolean(contextMenuAnchor)}
        onClose={() => setContextMenuAnchor(null)}
        type="folder"
        itemId={node.notebook.id}
        itemName={node.notebook.name}
        onRename={onRename ? handleRename : undefined}
        onDelete={onDelete ? handleDelete : undefined}
        onAddTask={onAddTask ? handleAddTask : undefined}
      />

      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
        <List component="div" disablePadding dense>
          {/* Render child folders */}
          {node.children.map((child) => (
            <FolderItem
              key={child.notebook.id}
              node={child}
              level={level + 1}
              expandedFolders={expandedFolders}
              onToggleFolder={onToggleFolder}
              viewFilter={viewFilter}
              onRename={onRename}
              onDelete={onDelete}
              onAddTask={onAddTask}
              onDragOver={onDragOver}
              onDrop={onDrop}
              dragOverFolderId={dragOverFolderId}
              allNotebooks={allNotebooks}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))}

          {/* Render notes in this folder */}
          {shouldShowNotes &&
            node.notes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                level={level + 1}
                onRename={onRename}
                onDelete={onDelete}
                onDragOver={onDragOver}
                onDrop={onDrop}
                dragOverFolderId={dragOverFolderId}
                allNotebooks={allNotebooks}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
              />
            ))}
        </List>
      </Collapse>
    </>
  );
}

function NoteItem({
  note,
  level,
  onRename,
  onDelete,
  onDragOver,
  onDrop,
  dragOverFolderId,
  allNotebooks,
  onDragStart,
  onDragEnd,
}: {
  note: Note;
  level: number;
  onRename?: (id: string, newName: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onDragOver?: (e: React.DragEvent, folderId: string) => void;
  onDrop?: (e: React.DragEvent, targetFolderId: string) => void;
  dragOverFolderId?: string | null;
  allNotebooks?: Notebook[];
  onDragStart?: (data: { type: 'note'; id: string }) => void;
  onDragEnd?: () => void;
}) {
  const [contextMenuAnchor, setContextMenuAnchor] = useState<HTMLElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const router = useRouter();

  const handleContextMenu = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuAnchor(e.currentTarget);
  };

  const handleRename = async (newName: string) => {
    if (onRename) {
      await onRename(note.id, newName);
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      await onDelete(note.id);
    }
  };

  const handleEdit = () => {
    router.push(`/dashboard/notes/${note.id}`);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    const dragData = {
      type: 'note' as const,
      id: note.id,
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    if (onDragStart) {
      onDragStart(dragData);
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.stopPropagation();
    setIsDragging(false);
    if (onDragEnd) {
      onDragEnd();
    }
  };

  return (
    <>
      <ListItem disablePadding dense sx={{ py: 0.25 }}>
        <ListItemButton
          component={Link}
          href={`/dashboard/notes/${note.id}`}
          onContextMenu={handleContextMenu}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          draggable
          dense
          sx={{
            borderRadius: 1,
            py: 0.5,
            px: 1,
            minHeight: 32,
            pl: 2 + level * 2,
            opacity: isDragging ? 0.5 : 1,
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {note.isPinned && (
                <PushPinIcon fontSize="small" color="primary" sx={{ fontSize: 14 }} />
              )}
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
            secondary={
              note.content ? (
                <Typography variant="caption" color="text.secondary" noWrap>
                  {note.content.substring(0, 50)}...
                </Typography>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  No content
                </Typography>
              )
            }
          />
        </ListItemButton>
      </ListItem>

      <ContextMenu
        anchorEl={contextMenuAnchor}
        open={Boolean(contextMenuAnchor)}
        onClose={() => setContextMenuAnchor(null)}
        type="task"
        itemId={note.id}
        itemName={note.title || 'Untitled Note'}
        onRename={onRename ? handleRename : undefined}
        onDelete={onDelete ? handleDelete : undefined}
        onEdit={handleEdit}
      />
    </>
  );
}

export function ExplorerTreeView({ notes, notebooks, viewFilter }: ExplorerTreeViewProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<{ type: 'note' | 'folder'; id: string } | null>(null);
  const shouldShowFolders = viewFilter === 'folders' || viewFilter === 'combined';
  const shouldShowNotes = viewFilter === 'tasks' || viewFilter === 'combined';
  const queryClient = useQueryClient();
  const router = useRouter();

  const tree = useMemo(() => buildTree(notebooks, notes), [notebooks, notes]);
  const rootNotes = useMemo(
    () => notes.filter((note) => !note.notebookId),
    [notes]
  );

  const handleToggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Mutations for notebooks
  const renameNotebookMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const response = await fetch(`/api/notebooks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to rename notebook');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
    },
  });

  const deleteNotebookMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/notebooks/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete notebook');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  const handleRenameNotebook = async (id: string, newName: string) => {
    await renameNotebookMutation.mutateAsync({ id, name: newName });
  };

  const handleDeleteNotebook = async (id: string) => {
    await deleteNotebookMutation.mutateAsync(id);
  };

  const handleAddTask = (notebookId: string) => {
    router.push(`/dashboard/notes/new?notebookId=${notebookId}`);
  };

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

  // Helper function to check if a folder is a descendant of another folder
  const isDescendant = useCallback((folderId: string, ancestorId: string): boolean => {
    const folder = notebooks.find((nb) => nb.id === folderId);
    if (!folder || !folder.parentId) return false;
    if (folder.parentId === ancestorId) return true;
    return isDescendant(folder.parentId, ancestorId);
  }, [notebooks]);

  // Mutations for moving items
  const moveNoteMutation = useMutation({
    mutationFn: async ({ id, notebookId }: { id: string; notebookId: string | null }) => {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notebookId }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to move note');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
    },
  });

  const moveFolderMutation = useMutation({
    mutationFn: async ({ id, parentId }: { id: string; parentId: string | null }) => {
      const response = await fetch(`/api/notebooks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to move folder');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  const handleDragOver = useCallback((e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedItem) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }
    
    // Prevent dropping folder into itself or its descendants
    if (draggedItem.type === 'folder' && draggedItem.id === folderId) {
      e.dataTransfer.dropEffect = 'none';
      setDragOverFolderId(null);
      return;
    }
    
    if (draggedItem.type === 'folder' && isDescendant(folderId, draggedItem.id)) {
      e.dataTransfer.dropEffect = 'none';
      setDragOverFolderId(null);
      return;
    }
    
    e.dataTransfer.dropEffect = 'move';
    setDragOverFolderId(folderId);
  }, [isDescendant, draggedItem]);

  const handleDrop = useCallback((e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderId(null);
    
    if (!draggedItem) return;
    
    try {
      if (draggedItem.type === 'note') {
        // Move note to folder (null means root)
        const notebookId = targetFolderId || null;
        moveNoteMutation.mutate({ id: draggedItem.id, notebookId });
      } else if (draggedItem.type === 'folder') {
        // Prevent moving folder into itself or its descendants
        if (draggedItem.id === targetFolderId || isDescendant(targetFolderId, draggedItem.id)) {
          return;
        }
        // Move folder (null means root)
        const parentId = targetFolderId || null;
        moveFolderMutation.mutate({ id: draggedItem.id, parentId });
      }
    } catch (error) {
      console.error('Drop error:', error);
    } finally {
      setDraggedItem(null);
    }
  }, [moveNoteMutation, moveFolderMutation, isDescendant, draggedItem]);

  // Handle dropping on root level (empty space)
  const handleRootDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOverFolderId(null);
    
    if (!draggedItem) return;
    
    try {
      if (draggedItem.type === 'note') {
        moveNoteMutation.mutate({ id: draggedItem.id, notebookId: null });
      } else if (draggedItem.type === 'folder') {
        moveFolderMutation.mutate({ id: draggedItem.id, parentId: null });
      }
    } catch (error) {
      console.error('Root drop error:', error);
    } finally {
      setDraggedItem(null);
    }
  }, [moveNoteMutation, moveFolderMutation, draggedItem]);

  // Handle drag end globally
  const handleGlobalDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDragOverFolderId(null);
  }, []);

  const handleRootDragOver = useCallback((e: React.DragEvent) => {
    // Only allow root drop if we're not over a folder
    if (!dragOverFolderId && draggedItem) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  }, [dragOverFolderId, draggedItem]);

  if (!shouldShowFolders && !shouldShowNotes) {
    return null;
  }

  return (
    <List 
      component="nav" 
      dense 
      sx={{ py: 0 }}
      onDragOver={handleRootDragOver}
      onDrop={handleRootDrop}
    >
      {/* Render folders */}
      {shouldShowFolders &&
        tree.map((node) => (
          <FolderItem
            key={node.notebook.id}
            node={node}
            level={0}
            expandedFolders={expandedFolders}
            onToggleFolder={handleToggleFolder}
            viewFilter={viewFilter}
            onRename={handleRenameNotebook}
            onDelete={handleDeleteNotebook}
            onAddTask={handleAddTask}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            dragOverFolderId={dragOverFolderId}
            allNotebooks={notebooks}
            onDragStart={(data) => setDraggedItem(data)}
            onDragEnd={handleGlobalDragEnd}
          />
        ))}

      {/* Render notes without folders */}
      {shouldShowNotes &&
        rootNotes.map((note) => (
          <NoteItem
            key={note.id}
            note={note}
            level={0}
            onRename={handleRenameNote}
            onDelete={handleDeleteNote}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            dragOverFolderId={dragOverFolderId}
            allNotebooks={notebooks}
            onDragStart={(data) => setDraggedItem(data)}
            onDragEnd={handleGlobalDragEnd}
          />
        ))}
    </List>
  );
}
