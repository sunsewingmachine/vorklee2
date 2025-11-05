'use client';

import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  List,
  ListItem,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import NoteIcon from '@mui/icons-material/Note';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PushPinIcon from '@mui/icons-material/PushPin';
import Link from 'next/link';
import { SimpleTreeView, TreeItem } from '@mui/x-tree-view';
import { useTranslation } from '@/components/i18n/useTranslation';
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

interface NotebookTreeItemContentProps {
  notebook: NotebookWithChildren;
  notes: Note[];
  isExpanded: boolean;
  isSelected: boolean;
  viewFilter: ViewFilter;
  onSelect?: (notebookId: string) => void;
  onEdit?: (notebookId: string) => void;
  onDelete?: (notebookId: string) => void;
  onCreateSubFolder?: (parentId: string) => void;
}

function NotebookTreeItemContent({
  notebook,
  notes,
  isExpanded,
  isSelected,
  viewFilter,
  onSelect,
  onEdit,
  onDelete,
  onCreateSubFolder,
}: NotebookTreeItemContentProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { t } = useTranslation();
  const isMenuOpen = Boolean(anchorEl);

  const handleClick = () => {
    onSelect?.(notebook.id);
  };

  const handleMenuOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget as HTMLElement);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    onEdit?.(notebook.id);
  };

  const handleDelete = () => {
    handleMenuClose();
    onDelete?.(notebook.id);
  };

  const handleCreateSubFolder = () => {
    handleMenuClose();
    onCreateSubFolder?.(notebook.id);
  };

  return (
    <>
      <Box
        onClick={handleClick}
        sx={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          px: 1,
          py: 0.25,
          borderRadius: 1,
          bgcolor: isSelected || isMenuOpen ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
          '&:hover': {
            bgcolor: isSelected || isMenuOpen ? 'rgba(25, 118, 210, 0.12)' : 'rgba(0, 0, 0, 0.04)',
          },
          cursor: 'pointer',
          minHeight: 28,
        }}
      >
        <ListItemIcon sx={{ minWidth: 28, mr: 1 }}>
          {isExpanded ? (
            <FolderOpenIcon sx={{ color: notebook.color || 'primary.main', fontSize: 18 }} />
          ) : (
            <FolderIcon sx={{ color: notebook.color || 'primary.main', fontSize: 18 }} />
          )}
        </ListItemIcon>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: isSelected ? 600 : 400,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: '0.875rem',
              lineHeight: 1.4,
            }}
          >
            {notebook.name}
          </Typography>
          {notebook.description && (
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.75rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
                color: 'text.secondary',
                mt: 0.125,
              }}
            >
              {notebook.description}
            </Typography>
          )}
        </Box>

        <IconButton
          size="small"
          onClick={handleMenuOpen}
          sx={{ ml: 0.5, p: 0.25, minWidth: 24, width: 24, height: 24 }}
          aria-label="More options"
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={handleClick}>Open</MenuItem>
        <MenuItem onClick={handleEdit}>Edit</MenuItem>
        <MenuItem onClick={handleCreateSubFolder}>Create Subfolder</MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>Delete</MenuItem>
      </Menu>
    </>
  );
}

interface NoteTreeItemContentProps {
  note: Note;
}

function NoteTreeItemContent({ note }: NoteTreeItemContentProps) {
  return (
    <ListItemButton
      component={Link}
      href={`/dashboard/notes/${note.id}`}
      dense
      sx={{
        borderRadius: 1,
        py: 0.25,
        px: 1,
        minHeight: 24,
        '&:hover': {
          bgcolor: 'rgba(0, 0, 0, 0.04)',
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: 28 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {note.isPinned && <PushPinIcon fontSize="small" color="primary" sx={{ fontSize: 12 }} />}
          <NoteIcon fontSize="small" sx={{ fontSize: 16 }} />
        </Box>
      </ListItemIcon>
      <ListItemText
        primary={note.title || 'Untitled Note'}
        secondary={note.content ? note.content.substring(0, 40) + '...' : 'No content'}
        primaryTypographyProps={{
          sx: {
            fontSize: '0.8125rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          },
        }}
        secondaryTypographyProps={{
          sx: {
            fontSize: '0.6875rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          },
        }}
      />
    </ListItemButton>
  );
}

interface ExplorerTreeItemProps {
  notebook: NotebookWithChildren;
  notes: Note[];
  viewFilter: ViewFilter;
  onSelect?: (notebookId: string) => void;
  onEdit?: (notebookId: string) => void;
  onDelete?: (notebookId: string) => void;
  onCreateSubFolder?: (parentId: string) => void;
  selectedId?: string;
  expandedItems: string[];
}

function ExplorerTreeItem({
  notebook,
  notes,
  viewFilter,
  onSelect,
  onEdit,
  onDelete,
  onCreateSubFolder,
  selectedId,
  expandedItems,
}: ExplorerTreeItemProps) {
  const folderNotes = notes.filter(note => note.notebookId === notebook.id);
  const isExpanded = expandedItems.includes(notebook.id);
  const isSelected = selectedId === notebook.id;
  const shouldShowFolder = viewFilter === 'folders' || viewFilter === 'combined';
  const shouldShowNotes = viewFilter === 'tasks' || viewFilter === 'combined';

  if (!shouldShowFolder) {
    return null;
  }

  return (
    <TreeItem
      itemId={notebook.id}
      label={
        <NotebookTreeItemContent
          notebook={notebook}
          notes={notes}
          isExpanded={isExpanded}
          isSelected={isSelected}
          viewFilter={viewFilter}
          onSelect={onSelect}
          onEdit={onEdit}
          onDelete={onDelete}
          onCreateSubFolder={onCreateSubFolder}
        />
      }
    >
      {/* Render notes within this folder */}
      {shouldShowNotes && folderNotes.map((note) => (
        <TreeItem
          key={`note-${note.id}`}
          itemId={`note-${note.id}`}
          label={<NoteTreeItemContent note={note} />}
        />
      ))}
      
      {/* Render child notebooks */}
      {notebook.children?.map((child) => (
        <ExplorerTreeItem
          key={child.id}
          notebook={child}
          notes={notes}
          viewFilter={viewFilter}
          onSelect={onSelect}
          onEdit={onEdit}
          onDelete={onDelete}
          onCreateSubFolder={onCreateSubFolder}
          selectedId={selectedId}
          expandedItems={expandedItems}
        />
      ))}
    </TreeItem>
  );
}

interface ExplorerTreeViewProps {
  notebooks: NotebookWithChildren[];
  notes: Note[];
  viewFilter: ViewFilter;
  onSelect?: (notebookId: string) => void;
  onEdit?: (notebookId: string) => void;
  onDelete?: (notebookId: string) => void;
  onCreateSubFolder?: (parentId: string) => void;
  selectedId?: string;
  expandedFolders: Set<string>;
  onToggleExpand: (notebookId: string) => void;
}

export function ExplorerTreeView({
  notebooks,
  notes,
  viewFilter,
  onSelect,
  onEdit,
  onDelete,
  onCreateSubFolder,
  selectedId,
  expandedFolders,
  onToggleExpand,
}: ExplorerTreeViewProps) {
  const rootNotes = notes.filter(note => !note.notebookId);
  const shouldShowNotes = viewFilter === 'tasks' || viewFilter === 'combined';
  const expandedItems = Array.from(expandedFolders);

  const handleExpandedItemsChange = (
    event: React.SyntheticEvent | null,
    itemIds: string[]
  ) => {
    // Filter out note items (they start with 'note-')
    const notebookIds = itemIds.filter(id => !id.startsWith('note-'));
    const newExpandedSet = new Set(notebookIds);
    
    // Find items that were expanded or collapsed
    const currentExpandedSet = new Set(expandedFolders);
    
    // Items that were collapsed
    currentExpandedSet.forEach((id) => {
      if (!newExpandedSet.has(id)) {
        onToggleExpand(id);
      }
    });
    
    // Items that were expanded
    newExpandedSet.forEach((id) => {
      if (!currentExpandedSet.has(id)) {
        onToggleExpand(id);
      }
    });
  };

  return (
    <>
      {/* Show root-level notes if no notebook */}
      {shouldShowNotes && rootNotes.length > 0 && (
        <List component="nav" dense sx={{ py: 0 }}>
          {rootNotes.map((note) => (
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
                  primary={note.title || 'Untitled Note'}
                  secondary={note.content ? note.content.substring(0, 50) + '...' : 'No content'}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}
      
      {/* Render notebook tree using SimpleTreeView */}
      <SimpleTreeView
        expandedItems={expandedItems}
        onExpandedItemsChange={handleExpandedItemsChange}
        sx={{
          flexGrow: 1,
          py: 0,
          // Compact styling
          '& .MuiTreeItem-content': {
            padding: '2px 4px',
            minHeight: 28,
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
            '&.Mui-selected': {
              backgroundColor: 'rgba(25, 118, 210, 0.08)',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.12)',
              },
            },
          },
          '& .MuiTreeItem-label': {
            fontSize: '0.875rem',
            padding: 0,
          },
          '& .MuiTreeItem-iconContainer': {
            width: 20,
            marginRight: 1,
            '& svg': {
              fontSize: '1rem',
            },
          },
          '& .MuiTreeItem-group': {
            marginLeft: '16px',
            paddingLeft: '8px',
            borderLeft: '1px solid rgba(0, 0, 0, 0.12)',
          },
        }}
      >
        {notebooks.map((notebook) => (
          <ExplorerTreeItem
            key={notebook.id}
            notebook={notebook}
            notes={notes}
            viewFilter={viewFilter}
            onSelect={onSelect}
            onEdit={onEdit}
            onDelete={onDelete}
            onCreateSubFolder={onCreateSubFolder}
            selectedId={selectedId}
            expandedItems={expandedItems}
          />
        ))}
      </SimpleTreeView>
    </>
  );
}
