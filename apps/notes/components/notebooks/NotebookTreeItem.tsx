'use client';

import React, { useState } from 'react';
import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Box,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useTranslation } from '@/components/i18n/useTranslation';
import type { NotebookWithChildren } from '@/services/notebooks.service';

interface NotebookTreeItemProps {
  notebook: NotebookWithChildren;
  level?: number;
  onSelect?: (notebookId: string) => void;
  onEdit?: (notebookId: string) => void;
  onDelete?: (notebookId: string) => void;
  onCreateSubFolder?: (parentId: string) => void;
  selectedId?: string;
}

export function NotebookTreeItem({
  notebook,
  level = 0,
  onSelect,
  onEdit,
  onDelete,
  onCreateSubFolder,
  selectedId,
}: NotebookTreeItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { t, isRTL } = useTranslation();

  const hasChildren = notebook.children && notebook.children.length > 0;
  const isSelected = selectedId === notebook.id;
  const indentSize = 20; // pixels per level

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      setExpanded(!expanded);
    }
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

  return (
    <>
      <ListItem
        disablePadding
        sx={{
          pl: isRTL ? 0 : `${level * indentSize}px`,
          pr: isRTL ? `${level * indentSize}px` : 0,
        }}
      >
        <ListItemButton
          onClick={handleClick}
          selected={isSelected}
          sx={{
            borderRadius: 1,
            '&.Mui-selected': {
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            },
          }}
        >
          {hasChildren && (
            <IconButton
              size="small"
              onClick={handleToggle}
              sx={{ mr: 1, minWidth: 24 }}
              aria-label={expanded ? t('notebooks.menu.actions.collapse') : t('notebooks.menu.actions.expand')}
              aria-expanded={expanded}
            >
              {expanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
            </IconButton>
          )}
          {!hasChildren && <Box sx={{ width: 24, mr: 1 }} />}

          <ListItemIcon sx={{ minWidth: 40 }}>
            {expanded ? (
              <FolderOpenIcon sx={{ color: notebook.color || 'primary.main' }} />
            ) : (
              <FolderIcon sx={{ color: notebook.color || 'primary.main' }} />
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
              },
            }}
          />

          <IconButton
            size="small"
            onClick={handleMenuOpen}
            sx={{ ml: 1 }}
            aria-label={t('notebooks.menu.actions.open')}
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
        <MenuItem onClick={handleClick}>
          {t('notebooks.menu.actions.open')}
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          {t('notebooks.menu.actions.edit')}
        </MenuItem>
        <MenuItem onClick={handleCreateSubFolder}>
          {t('notebooks.menu.actions.createSubFolder')}
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          {t('notebooks.menu.actions.delete')}
        </MenuItem>
      </Menu>

      {hasChildren && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box component="div" role="group" aria-label={`${notebook.name} ${t('notebooks.menu.hierarchy.subFolder')}`}>
            {notebook.children!.map((child) => (
              <NotebookTreeItem
                key={child.id}
                notebook={child}
                level={level + 1}
                onSelect={onSelect}
                onEdit={onEdit}
                onDelete={onDelete}
                onCreateSubFolder={onCreateSubFolder}
                selectedId={selectedId}
              />
            ))}
          </Box>
        </Collapse>
      )}
    </>
  );
}

