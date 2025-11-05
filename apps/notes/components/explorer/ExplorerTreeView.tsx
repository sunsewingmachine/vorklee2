'use client';

import React, { useState } from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import NoteIcon from '@mui/icons-material/Note';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PushPinIcon from '@mui/icons-material/PushPin';
import Link from 'next/link';
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

interface ExplorerTreeItemProps {
  notebook: NotebookWithChildren;
  notes: Note[];
  level?: number;
  viewFilter: ViewFilter;
  onSelect?: (notebookId: string) => void;
  onEdit?: (notebookId: string) => void;
  onDelete?: (notebookId: string) => void;
  onCreateSubFolder?: (parentId: string) => void;
  selectedId?: string;
  isLastChild?: boolean;
  expandedFolders: Set<string>;
  onToggleExpand: (notebookId: string) => void;
}

function ExplorerTreeItem({
  notebook,
  notes,
  level = 0,
  viewFilter,
  onSelect,
  onEdit,
  onDelete,
  onCreateSubFolder,
  selectedId,
  isLastChild = false,
  expandedFolders,
  onToggleExpand,
}: ExplorerTreeItemProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { t, isRTL } = useTranslation();

  const hasChildren = notebook.children && notebook.children.length > 0;
  const folderNotes = notes.filter(note => note.notebookId === notebook.id);
  const hasNotes = folderNotes.length > 0;
  const isExpanded = expandedFolders.has(notebook.id);
  const isSelected = selectedId === notebook.id;
  const isMenuOpen = Boolean(anchorEl);
  const indentSize = 20;
  const iconButtonSize = 24;
  const iconButtonCenter = iconButtonSize / 2;
  const listItemButtonPaddingX = 8;
  const spacerWidth = 24;
  const spacerMargin = 8;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand(notebook.id);
  };

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

  const shouldShowFolder = viewFilter === 'folders' || viewFilter === 'combined';
  const shouldShowNotes = viewFilter === 'tasks' || viewFilter === 'combined';

  if (!shouldShowFolder) {
    return null;
  }

  return (
    <>
      <ListItem
        disablePadding
        dense
        sx={{
          pl: isRTL ? 0 : `${level * indentSize}px`,
          pr: isRTL ? `${level * indentSize}px` : 0,
          py: 0.25,
          position: 'relative',
        }}
      >
        {/* Tree lines */}
        {level > 0 && (
          <>
            <Box
              sx={{
                position: 'absolute',
                left: isRTL ? 'auto' : `${(level - 1) * indentSize + listItemButtonPaddingX + iconButtonCenter - 0.5}px`,
                right: isRTL ? `${(level - 1) * indentSize + listItemButtonPaddingX + iconButtonCenter - 0.5}px` : 'auto',
                top: 0,
                bottom: isLastChild ? '50%' : 0,
                width: '1px',
                bgcolor: 'rgba(0, 0, 0, 0.25)',
                zIndex: 0,
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                left: isRTL ? 'auto' : `${(level - 1) * indentSize + listItemButtonPaddingX + iconButtonCenter - 0.5}px`,
                right: isRTL ? `${(level - 1) * indentSize + listItemButtonPaddingX + iconButtonCenter - 0.5}px` : 'auto',
                top: '50%',
                width: hasChildren || hasNotes
                  ? `${indentSize - iconButtonCenter + 0.5}px`
                  : `${indentSize - iconButtonCenter + spacerWidth + spacerMargin}px`,
                height: '1px',
                bgcolor: 'rgba(0, 0, 0, 0.25)',
                zIndex: 0,
              }}
            />
          </>
        )}
        {(hasChildren || hasNotes) && (
          <Box
            sx={{
              position: 'absolute',
              left: isRTL ? 'auto' : `${level * indentSize + listItemButtonPaddingX + iconButtonCenter - 0.5}px`,
              right: isRTL ? `${level * indentSize + listItemButtonPaddingX + iconButtonCenter - 0.5}px` : 'auto',
              top: '50%',
              bottom: isLastChild ? '50%' : 0,
              width: '1px',
              bgcolor: 'rgba(0, 0, 0, 0.25)',
              zIndex: 0,
            }}
          />
        )}
        <ListItemButton
          onClick={handleClick}
          selected={isSelected || isMenuOpen}
          dense
          sx={{
            borderRadius: 1,
            py: 0.5,
            px: 1,
            position: 'relative',
            zIndex: 1,
            minHeight: 36,
            '&.Mui-selected': {
              bgcolor: 'rgba(25, 118, 210, 0.08)',
              color: 'text.primary',
              '&:hover': {
                bgcolor: 'rgba(25, 118, 210, 0.12)',
              },
            },
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          {(hasChildren || hasNotes) && (
            <IconButton
              size="small"
              onClick={handleToggle}
              sx={{
                mr: 1,
                minWidth: 24,
                width: 24,
                height: 24,
                p: 0.5,
                border: '1px solid rgba(0, 0, 0, 0.12)',
                borderRadius: '4px',
                bgcolor: 'background.paper',
                '&:hover': {
                  bgcolor: 'action.hover',
                  borderColor: 'rgba(0, 0, 0, 0.23)',
                },
              }}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
              aria-expanded={isExpanded}
            >
              {isExpanded ? <RemoveIcon fontSize="small" /> : <AddIcon fontSize="small" />}
            </IconButton>
          )}
          {!(hasChildren || hasNotes) && <Box sx={{ width: 24, mr: 1 }} />}

          <ListItemIcon sx={{ minWidth: 36 }}>
            {isExpanded ? (
              <FolderOpenIcon sx={{ color: notebook.color || 'primary.main', fontSize: 20 }} />
            ) : (
              <FolderIcon sx={{ color: notebook.color || 'primary.main', fontSize: 20 }} />
            )}
          </ListItemIcon>

          <ListItemText
            primary={notebook.name}
            secondary={notebook.description}
            primaryTypographyProps={{
              sx: {
                fontWeight: isSelected ? 600 : 400,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontSize: '0.95rem',
                lineHeight: 1.4,
              },
            }}
            secondaryTypographyProps={{
              sx: {
                fontSize: '0.75rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                mt: 0.25,
              },
            }}
          />

          <IconButton
            size="small"
            onClick={handleMenuOpen}
            sx={{ ml: 1, p: 0.5 }}
            aria-label="More options"
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </ListItemButton>
      </ListItem>

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

      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
        <Box component="div" role="group" sx={{ pl: isRTL ? 0 : `${(level + 1) * indentSize}px`, pr: isRTL ? `${(level + 1) * indentSize}px` : 0 }}>
          {/* Render notes within this folder */}
          {shouldShowNotes && folderNotes.map((note) => (
            <ListItem
              key={note.id}
              disablePadding
              dense
              sx={{ py: 0.25 }}
            >
              <ListItemButton
                component={Link}
                href={`/dashboard/notes/${note.id}`}
                dense
                sx={{
                  borderRadius: 1,
                  py: 0.5,
                  px: 1,
                  minHeight: 32,
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.04)',
                  },
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
                  primaryTypographyProps={{
                    sx: {
                      fontSize: '0.875rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    },
                  }}
                  secondaryTypographyProps={{
                    sx: {
                      fontSize: '0.75rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
          
          {/* Render child notebooks */}
          {notebook.children?.map((child, index) => (
            <ExplorerTreeItem
              key={child.id}
              notebook={child}
              notes={notes}
              level={level + 1}
              viewFilter={viewFilter}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              onCreateSubFolder={onCreateSubFolder}
              selectedId={selectedId}
              isLastChild={index === notebook.children!.length - 1}
              expandedFolders={expandedFolders}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </Box>
      </Collapse>
    </>
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

  return (
    <List component="nav" dense sx={{ py: 0 }}>
      {/* Show root-level notes if no notebook */}
      {shouldShowNotes && rootNotes.map((note) => (
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
      
      {/* Render notebook tree */}
      {notebooks.map((notebook, index) => (
        <ExplorerTreeItem
          key={notebook.id}
          notebook={notebook}
          notes={notes}
          level={0}
          viewFilter={viewFilter}
          onSelect={onSelect}
          onEdit={onEdit}
          onDelete={onDelete}
          onCreateSubFolder={onCreateSubFolder}
          selectedId={selectedId}
          isLastChild={index === notebooks.length - 1}
          expandedFolders={expandedFolders}
          onToggleExpand={onToggleExpand}
        />
      ))}
    </List>
  );
}

