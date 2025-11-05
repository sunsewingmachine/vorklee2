'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import AddTaskIcon from '@mui/icons-material/AddTask';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import CloseIcon from '@mui/icons-material/Close';
import { useRouter } from 'next/navigation';

interface ContextMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  type: 'folder' | 'task';
  itemId: string;
  itemName: string;
  onRename?: (newName: string) => Promise<void>;
  onDelete?: () => Promise<void>;
  onAddTask?: () => void;
  onEdit?: () => void;
  onCreateSubfolder?: () => void;
}

export function ContextMenu({
  anchorEl,
  open,
  onClose,
  type,
  itemId,
  itemName,
  onRename,
  onDelete,
  onAddTask,
  onEdit,
  onCreateSubfolder,
}: ContextMenuProps) {
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(itemName);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setRenameValue(itemName);
  }, [itemName]);

  const handleRenameClick = () => {
    setRenameDialogOpen(true);
    onClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    onClose();
  };

  const handleAddTaskClick = () => {
    if (onAddTask) {
      onAddTask();
    }
    onClose();
  };

  const handleCreateSubfolderClick = () => {
    if (onCreateSubfolder) {
      onCreateSubfolder();
    }
    onClose();
  };

  const handleEditClick = () => {
    if (onEdit) {
      onEdit();
    } else if (type === 'task') {
      router.push(`/dashboard/notes/${itemId}`);
    }
    onClose();
  };

  const handleRenameSubmit = async () => {
    if (!onRename || !renameValue.trim()) return;
    
    setIsProcessing(true);
    try {
      await onRename(renameValue.trim());
      setRenameDialogOpen(false);
    } catch (error) {
      console.error('Failed to rename:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!onDelete) return;
    
    setIsProcessing(true);
    try {
      await onDelete();
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const menuItems = [];

  if (type === 'folder') {
    if (onAddTask) {
      menuItems.push({
        label: 'Add Task',
        icon: <AddTaskIcon fontSize="small" />,
        onClick: handleAddTaskClick,
      });
    }
    if (onCreateSubfolder) {
      menuItems.push({
        label: 'Create Subfolder',
        icon: <CreateNewFolderIcon fontSize="small" />,
        onClick: handleCreateSubfolderClick,
      });
    }
    if (onRename) {
      menuItems.push({
        label: 'Rename',
        icon: <DriveFileRenameOutlineIcon fontSize="small" />,
        onClick: handleRenameClick,
      });
    }
    if (onDelete) {
      menuItems.push({
        label: 'Delete',
        icon: <DeleteIcon fontSize="small" />,
        onClick: handleDeleteClick,
        color: 'error' as const,
      });
    }
  } else if (type === 'task') {
    if (onEdit) {
      menuItems.push({
        label: 'Edit',
        icon: <EditIcon fontSize="small" />,
        onClick: handleEditClick,
      });
    }
    if (onRename) {
      menuItems.push({
        label: 'Rename',
        icon: <DriveFileRenameOutlineIcon fontSize="small" />,
        onClick: handleRenameClick,
      });
    }
    if (onDelete) {
      menuItems.push({
        label: 'Delete',
        icon: <DeleteIcon fontSize="small" />,
        onClick: handleDeleteClick,
        color: 'error' as const,
      });
    }
  }

  return (
    <>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={onClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        {menuItems.map((item) => (
          <MenuItem
            key={item.label}
            onClick={item.onClick}
            sx={{
              color: item.color === 'error' ? 'error.main' : 'inherit',
            }}
          >
            <ListItemIcon sx={{ color: item.color === 'error' ? 'error.main' : 'inherit' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText>{item.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onClose={() => !isProcessing && setRenameDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Rename {type === 'folder' ? 'Folder' : 'Task'}
          <IconButton
            aria-label="close"
            onClick={() => setRenameDialogOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
            disabled={isProcessing}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={`${type === 'folder' ? 'Folder' : 'Task'} Name`}
            fullWidth
            variant="outlined"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isProcessing) {
                handleRenameSubmit();
              }
            }}
            disabled={isProcessing}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleRenameSubmit} variant="contained" disabled={isProcessing || !renameValue.trim()}>
            Rename
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => !isProcessing && setDeleteDialogOpen(false)}>
        <DialogTitle>
          Delete {type === 'folder' ? 'Folder' : 'Task'}
          <IconButton
            aria-label="close"
            onClick={() => setDeleteDialogOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
            disabled={isProcessing}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          Are you sure you want to delete &quot;{itemName}&quot;? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error" disabled={isProcessing}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

