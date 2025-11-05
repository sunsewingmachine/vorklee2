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
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
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
  isLastChild?: boolean; // Indicates if this is the last child in its parent's children array
}

export function NotebookTreeItem({
  notebook,
  level = 0,
  onSelect,
  onEdit,
  onDelete,
  onCreateSubFolder,
  selectedId,
  isLastChild = false,
}: NotebookTreeItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { t, isRTL } = useTranslation();

  const hasChildren = notebook.children && notebook.children.length > 0;
  const isSelected = selectedId === notebook.id;
  const isMenuOpen = Boolean(anchorEl);
  const indentSize = 20; // pixels per level
  const iconButtonSize = 24; // size of the expand/collapse button box
  const iconButtonCenter = iconButtonSize / 2; // center point of the button (12px)
  const listItemButtonPaddingX = 8; // px: 1 = 8px padding on ListItemButton
  const spacerWidth = 24; // width of spacer box when no children
  const spacerMargin = 8; // mr: 1 = 8px margin
  const folderIconOffset = spacerWidth + spacerMargin; // Distance from button start to folder icon

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
        dense
        sx={{
          pl: isRTL ? 0 : `${level * indentSize}px`,
          pr: isRTL ? `${level * indentSize}px` : 0,
          py: 0.25,
          position: 'relative',
        }}
      >
        {/* Vertical line connecting to parent and continuing through siblings */}
        {level > 0 && (
          <>
            {/* Vertical line from top to center of parent's button box - continues through all siblings */}
            <Box
              sx={{
                position: 'absolute',
                left: isRTL ? 'auto' : `${(level - 1) * indentSize + listItemButtonPaddingX + iconButtonCenter - 0.5}px`,
                right: isRTL ? `${(level - 1) * indentSize + listItemButtonPaddingX + iconButtonCenter - 0.5}px` : 'auto',
                top: 0,
                bottom: isLastChild ? '50%' : 0, // Stop at 50% for last child, otherwise continue to bottom
                width: '1px',
                bgcolor: 'rgba(0, 0, 0, 0.25)',
                zIndex: 0,
              }}
            />
            {/* Horizontal line connecting from parent's vertical line center to current item */}
            {/* This line connects to the button box if folder has children, or extends to folder icon if no children */}
            <Box
              sx={{
                position: 'absolute',
                left: isRTL ? 'auto' : `${(level - 1) * indentSize + listItemButtonPaddingX + iconButtonCenter - 0.5}px`,
                right: isRTL ? `${(level - 1) * indentSize + listItemButtonPaddingX + iconButtonCenter - 0.5}px` : 'auto',
                top: '50%',
                width: hasChildren 
                  ? `${indentSize - iconButtonCenter + 0.5}px` // To button box left edge (touching the box)
                  : `${indentSize - iconButtonCenter + folderIconOffset}px`, // Extends to folder icon area (no gap)
                height: '1px',
                bgcolor: 'rgba(0, 0, 0, 0.25)',
                zIndex: 0,
              }}
            />
          </>
        )}
        {/* Vertical line continuing down from current item's button box center (only if has children) */}
        {hasChildren && (
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
              '& .MuiListItemIcon-root': {
                color: 'primary.main',
              },
            },
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          {hasChildren && (
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
              aria-label={expanded ? t('notebooks.menu.actions.collapse') : t('notebooks.menu.actions.expand')}
              aria-expanded={expanded}
            >
              {expanded ? <RemoveIcon fontSize="small" /> : <AddIcon fontSize="small" />}
            </IconButton>
          )}
          {!hasChildren && <Box sx={{ width: 24, mr: 1 }} />}

          <ListItemIcon sx={{ minWidth: 36 }}>
            {expanded ? (
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
            {notebook.children!.map((child, index) => (
              <NotebookTreeItem
                key={child.id}
                notebook={child}
                level={level + 1}
                onSelect={onSelect}
                onEdit={onEdit}
                onDelete={onDelete}
                onCreateSubFolder={onCreateSubFolder}
                selectedId={selectedId}
                isLastChild={index === notebook.children!.length - 1}
              />
            ))}
          </Box>
        </Collapse>
      )}
    </>
  );
}

