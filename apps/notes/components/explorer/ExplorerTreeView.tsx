'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
import ListAltIcon from '@mui/icons-material/ListAlt';
import PushPinIcon from '@mui/icons-material/PushPin';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import AddBoxIcon from '@mui/icons-material/AddBox';
import IndeterminateCheckBoxIcon from '@mui/icons-material/IndeterminateCheckBox';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ContextMenu } from './ContextMenu';
import { CreateFolderDialog } from '@/components/notebooks/CreateFolderDialog';
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
  highlightedItemId?: string | null;
  highlightedItemType?: 'note' | 'folder' | null;
  selectedNoteId?: string | null;
  onNoteSelect?: (noteId: string | null) => void;
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
  onCreateSubfolder,
  onDragOver,
  onDrop,
  dragOverFolderId,
  allNotebooks,
  onDragStart,
  onDragEnd,
  isHighlighted,
  itemRef,
  highlightedItemId,
  highlightedItemType,
  highlightedItemRef,
  isLastChild = false,
}: {
  node: TreeNode;
  level: number;
  expandedFolders: Set<string>;
  onToggleFolder: (id: string) => void;
  viewFilter: ViewFilter;
  onRename?: (id: string, newName: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onAddTask?: (notebookId: string) => void;
  onCreateSubfolder?: (parentId: string) => void;
  onDragOver?: (e: React.DragEvent, folderId: string) => void;
  onDrop?: (e: React.DragEvent, targetFolderId: string) => void;
  dragOverFolderId?: string | null;
  allNotebooks?: Notebook[];
  onDragStart?: (data: { type: 'folder'; id: string }) => void;
  onDragEnd?: () => void;
  isHighlighted?: boolean;
  itemRef?: React.RefObject<HTMLDivElement>;
  highlightedItemId?: string | null;
  highlightedItemType?: 'note' | 'folder' | null;
  highlightedItemRef?: React.RefObject<HTMLDivElement>;
  isLastChild?: boolean;
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

  const handleCreateSubfolder = () => {
    if (onCreateSubfolder) {
      onCreateSubfolder(node.notebook.id);
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
      <ListItem
        disablePadding
        dense
        sx={{
          py: 0.125,
          position: 'relative',
          '&::before': level > 0 ? {
            content: '""',
            position: 'absolute',
            left: 0.75 + (level - 1) * 1.5 + 0.5,
            top: 0,
            bottom: isLastChild ? '50%' : 0,
            width: '1px',
            bgcolor: 'divider',
          } : {},
          '&::after': level > 0 ? {
            content: '""',
            position: 'absolute',
            left: 0.75 + (level - 1) * 1.5 + 0.5,
            top: '50%',
            width: '0.75rem',
            height: '1px',
            bgcolor: 'divider',
          } : {},
        }}
        ref={itemRef}
      >
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
            py: 0.25,
            px: 0.75,
            minHeight: 28,
            pl: 0.75 + level * 1.5,
            opacity: isDragging ? 0.5 : 1,
            bgcolor: isHighlighted
              ? 'primary.light'
              : isDragOver
                ? 'action.hover'
                : 'transparent',
            border: isHighlighted
              ? '2px solid'
              : isDragOver
                ? '2px dashed'
                : '2px solid transparent',
            borderColor: isHighlighted
              ? 'primary.main'
              : isDragOver
                ? 'primary.main'
                : 'transparent',
            cursor: isDragging ? 'grabbing' : 'grab',
            animation: isHighlighted ? 'pulse 2s ease-in-out 3' : 'none',
            '@keyframes pulse': {
              '0%, 100%': { backgroundColor: 'primary.light' },
              '50%': { backgroundColor: 'primary.main', opacity: 0.7 },
            },
            '&:hover': {
              bgcolor: isHighlighted
                ? 'primary.light'
                : isDragOver
                  ? 'action.hover'
                  : 'action.hover',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
              <DragIndicatorIcon
                fontSize="small"
                sx={{
                  fontSize: 16,
                  color: 'text.secondary',
                  cursor: 'grab',
                  opacity: 0.6,
                  '&:hover': {
                    opacity: 1,
                  },
                }}
              />
              {hasChildren ? (
                isExpanded ? (
                  <IndeterminateCheckBoxIcon
                    fontSize="small"
                    sx={{
                      fontSize: 18,
                      color: 'primary.main',
                      cursor: 'pointer'
                    }}
                  />
                ) : (
                  <AddBoxIcon
                    fontSize="small"
                    sx={{
                      fontSize: 18,
                      color: 'primary.main',
                      cursor: 'pointer'
                    }}
                  />
                )
              ) : (
                <Box sx={{ width: 18 }} />
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
        onCreateSubfolder={onCreateSubfolder ? handleCreateSubfolder : undefined}
      />

      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
        <List
          component="div"
          disablePadding
          dense
        >
          {/* Render child folders */}
          {node.children.map((child, index) => {
            const childRef = highlightedItemId === child.notebook.id && highlightedItemType === 'folder'
              ? highlightedItemRef
              : undefined;
            const isLast = index === node.children.length - 1 && (!shouldShowNotes || node.notes.length === 0);
            return (
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
                onCreateSubfolder={onCreateSubfolder}
                onDragOver={onDragOver}
                onDrop={onDrop}
                dragOverFolderId={dragOverFolderId}
                allNotebooks={allNotebooks}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                isHighlighted={highlightedItemId === child.notebook.id && highlightedItemType === 'folder'}
                itemRef={childRef}
                highlightedItemId={highlightedItemId}
                highlightedItemType={highlightedItemType}
                highlightedItemRef={highlightedItemRef}
                isLastChild={isLast}
              />
            );
          })}

          {/* Render notes in this folder */}
          {shouldShowNotes &&
            node.notes.map((note, index) => {
              const noteRef = highlightedItemId === note.id && highlightedItemType === 'note'
                ? highlightedItemRef
                : undefined;
              const isLast = index === node.notes.length - 1;
              return (
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
                  isHighlighted={highlightedItemId === note.id && highlightedItemType === 'note'}
                  itemRef={noteRef}
                  isLastChild={isLast}
                  selectedNoteId={selectedNoteId}
                  onNoteSelect={onNoteSelect}
                />
              );
            })}
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
  isHighlighted,
  itemRef,
  isLastChild = false,
  selectedNoteId,
  onNoteSelect,
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
  isHighlighted?: boolean;
  itemRef?: React.RefObject<HTMLDivElement>;
  isLastChild?: boolean;
  selectedNoteId?: string | null;
  onNoteSelect?: (noteId: string | null) => void;
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

  const handleClick = (e: React.MouseEvent) => {
    // Don't navigate if there's a select handler - let the parent handle it
    if (onNoteSelect) {
      e.preventDefault();
      e.stopPropagation();
      onNoteSelect(note.id === selectedNoteId ? null : note.id);
    }
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
      <ListItem
        disablePadding
        dense
        sx={{
          py: 0.125,
          position: 'relative',
          '&::before': level > 0 ? {
            content: '""',
            position: 'absolute',
            left: 0.75 + (level - 1) * 1.5 + 0.5,
            top: 0,
            bottom: isLastChild ? '50%' : 0,
            width: '1px',
            bgcolor: 'divider',
          } : {},
          '&::after': level > 0 ? {
            content: '""',
            position: 'absolute',
            left: 0.75 + (level - 1) * 1.5 + 0.5,
            top: '50%',
            width: '0.75rem',
            height: '1px',
            bgcolor: 'divider',
          } : {},
        }}
        ref={itemRef}
      >
        <ListItemButton
          component={onNoteSelect ? 'div' : Link}
          href={onNoteSelect ? undefined : `/dashboard/notes/${note.id}`}
          onClick={handleClick}
          onContextMenu={handleContextMenu}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          draggable
          dense
          sx={{
            borderRadius: 1,
            py: 0.25,
            px: 0.75,
            minHeight: 28,
            pl: 1.5 + level * 1.5,
            opacity: isDragging ? 0.5 : 1,
            cursor: isDragging ? 'grabbing' : 'grab',
            bgcolor: isHighlighted
              ? 'primary.light'
              : selectedNoteId === note.id
                ? 'action.selected'
                : 'transparent',
            border: isHighlighted ? '2px solid' : '2px solid transparent',
            borderColor: isHighlighted ? 'primary.main' : 'transparent',
            animation: isHighlighted ? 'pulse 2s ease-in-out 3' : 'none',
            '@keyframes pulse': {
              '0%, 100%': { backgroundColor: 'primary.light' },
              '50%': { backgroundColor: 'primary.main', opacity: 0.7 },
            },
            '&:hover': {
              bgcolor: isHighlighted
                ? 'primary.light'
                : selectedNoteId === note.id
                  ? 'action.selected'
                  : 'action.hover',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
              <DragIndicatorIcon
                fontSize="small"
                sx={{
                  fontSize: 16,
                  color: 'text.secondary',
                  cursor: 'grab',
                  opacity: 0.6,
                  '&:hover': {
                    opacity: 1,
                  },
                }}
              />
              {note.isPinned && (
                <PushPinIcon fontSize="small" color="primary" sx={{ fontSize: 12 }} />
              )}
              <ListAltIcon fontSize="small" sx={{ fontSize: 16 }} />
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

const EXPANDED_FOLDERS_STORAGE_KEY = 'notes-explorer-expanded-folders';

// Helper function to get all ancestor folder IDs for a given folder ID
function getAncestorFolderIds(notebookId: string, notebooks: Notebook[]): string[] {
  const notebook = notebooks.find(nb => nb.id === notebookId);
  if (!notebook || !notebook.parentId) return [];
  
  const ancestors: string[] = [];
  let currentParentId: string | null = notebook.parentId;
  
  while (currentParentId) {
    const parentNotebook = notebooks.find(nb => nb.id === currentParentId);
    if (!parentNotebook) break;
    
    ancestors.push(parentNotebook.id);
    currentParentId = parentNotebook.parentId;
  }
  
  return ancestors;
}

export function ExplorerTreeView({ notes, notebooks, viewFilter, highlightedItemId, highlightedItemType, selectedNoteId, onNoteSelect }: ExplorerTreeViewProps) {
  // Load expanded folders from localStorage on mount
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    
    try {
      const stored = localStorage.getItem(EXPANDED_FOLDERS_STORAGE_KEY);
      if (stored) {
        const array = JSON.parse(stored) as string[];
        return new Set(array);
      }
    } catch (error) {
      console.error('Failed to load expanded folders from localStorage:', error);
    }
    
    return new Set();
  });
  
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<{ type: 'note' | 'folder'; id: string } | null>(null);
  const [createSubfolderDialogOpen, setCreateSubfolderDialogOpen] = useState(false);
  const [subfolderParentId, setSubfolderParentId] = useState<string | null>(null);
  const highlightedItemRef = React.useRef<HTMLDivElement | null>(null);
  const shouldShowFolders = viewFilter === 'folders' || viewFilter === 'combined';
  const shouldShowNotes = viewFilter === 'tasks' || viewFilter === 'combined';
  const queryClient = useQueryClient();
  const router = useRouter();

  const tree = useMemo(() => buildTree(notebooks, notes), [notebooks, notes]);
  const rootNotes = useMemo(
    () => notes.filter((note) => !note.notebookId),
    [notes]
  );

  // Save expanded folders to localStorage whenever they change
  useEffect(() => {
    try {
      const array = Array.from(expandedFolders);
      localStorage.setItem(EXPANDED_FOLDERS_STORAGE_KEY, JSON.stringify(array));
    } catch (error) {
      console.error('Failed to save expanded folders to localStorage:', error);
    }
  }, [expandedFolders]);

  // Function to expand folders and their ancestors
  const expandFolders = useCallback((folderIds: string[]) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      folderIds.forEach(id => next.add(id));
      
      // Also expand all ancestors of each folder
      folderIds.forEach(folderId => {
        const ancestors = getAncestorFolderIds(folderId, notebooks);
        ancestors.forEach(ancestorId => next.add(ancestorId));
      });
      
      return next;
    });
  }, [notebooks]);

  // Expose function to expand parent folders for a given notebook ID
  useEffect(() => {
    // Listen for custom event to expand folders
    const handleExpandFolders = ((e: CustomEvent<{ folderIds: string[] }>) => {
      expandFolders(e.detail.folderIds);
    }) as EventListener;
    
    window.addEventListener('expand-folders' as any, handleExpandFolders);
    return () => {
      window.removeEventListener('expand-folders' as any, handleExpandFolders);
    };
  }, [expandFolders]);

  // Scroll to highlighted item when it becomes available
  useEffect(() => {
    if (highlightedItemId && highlightedItemRef.current) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        highlightedItemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [highlightedItemId, notes, notebooks]);

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

  const handleCreateSubfolder = (parentId: string) => {
    setSubfolderParentId(parentId);
    setCreateSubfolderDialogOpen(true);
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
    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['notes'] });
      await queryClient.invalidateQueries({ queryKey: ['notebooks'] });

      // Expand parent folder if note was moved to a folder
      if (variables.notebookId) {
        const ancestorIds = getAncestorFolderIds(variables.notebookId, notebooks);
        const foldersToExpand = [variables.notebookId, ...ancestorIds];
        window.dispatchEvent(new CustomEvent('expand-folders', { detail: { folderIds: foldersToExpand } }));
      }

      // Navigate with highlight
      router.push(`/dashboard?highlight=${variables.id}&highlightType=note`);
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
    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['notebooks'] });
      await queryClient.invalidateQueries({ queryKey: ['notes'] });

      // Expand parent folder if folder was moved to another folder
      if (variables.parentId) {
        const ancestorIds = getAncestorFolderIds(variables.parentId, notebooks);
        const foldersToExpand = [variables.parentId, ...ancestorIds];
        window.dispatchEvent(new CustomEvent('expand-folders', { detail: { folderIds: foldersToExpand } }));
      }

      // Navigate with highlight
      router.push(`/dashboard?highlight=${variables.id}&highlightType=folder`);
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
    <>
      <List 
        component="nav" 
        dense 
        sx={{ py: 0 }}
        onDragOver={handleRootDragOver}
        onDrop={handleRootDrop}
      >
        {/* Render folders */}
        {shouldShowFolders &&
          tree.map((node, index) => {
            const folderRef = highlightedItemId === node.notebook.id && highlightedItemType === 'folder'
              ? highlightedItemRef
              : undefined;
            const isLast = index === tree.length - 1 && (!shouldShowNotes || rootNotes.length === 0);
            return (
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
                onCreateSubfolder={handleCreateSubfolder}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                dragOverFolderId={dragOverFolderId}
                allNotebooks={notebooks}
                onDragStart={(data) => setDraggedItem(data)}
                onDragEnd={handleGlobalDragEnd}
                isHighlighted={highlightedItemId === node.notebook.id && highlightedItemType === 'folder'}
                itemRef={folderRef}
                highlightedItemId={highlightedItemId}
                highlightedItemType={highlightedItemType}
                highlightedItemRef={highlightedItemRef}
                isLastChild={isLast}
              />
            );
          })}

        {/* Render notes without folders */}
        {shouldShowNotes &&
          rootNotes.map((note, index) => {
            const noteRef = highlightedItemId === note.id && highlightedItemType === 'note'
              ? highlightedItemRef
              : undefined;
            const isLast = index === rootNotes.length - 1;
              return (
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
                isHighlighted={highlightedItemId === note.id && highlightedItemType === 'note'}
                itemRef={noteRef}
                isLastChild={isLast}
                selectedNoteId={selectedNoteId}
                onNoteSelect={onNoteSelect}
              />
            );
          })}
      </List>
      <CreateFolderDialog
        open={createSubfolderDialogOpen}
        onClose={() => {
          setCreateSubfolderDialogOpen(false);
          setSubfolderParentId(null);
        }}
        parentId={subfolderParentId}
      />
    </>
  );
}
