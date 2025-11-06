'use client';

import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import LinkIcon from '@mui/icons-material/Link';
import { AttachFileDialog } from './AttachFileDialog';
import { AttachLinkDialog } from './AttachLinkDialog';

interface AttachButtonProps {
  noteId: string;
  onSuccess?: () => void;
}

export function AttachButton({ noteId, onSuccess }: AttachButtonProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [fileDialogOpen, setFileDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleFileClick = () => {
    setFileDialogOpen(true);
    handleClose();
  };

  const handleLinkClick = () => {
    setLinkDialogOpen(true);
    handleClose();
  };

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    onSuccess?.();
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<AttachFileIcon />}
        onClick={handleClick}
        size="small"
        sx={{
          color: 'text.primary',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'action.hover',
          },
        }}
      >
        Attach
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <MenuItem onClick={handleFileClick}>
          <ListItemIcon>
            <AttachFileIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>File</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleLinkClick}>
          <ListItemIcon>
            <LinkIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Link</ListItemText>
        </MenuItem>
      </Menu>

      <AttachFileDialog
        open={fileDialogOpen}
        onClose={() => setFileDialogOpen(false)}
        noteId={noteId}
        onSuccess={handleSuccess}
      />
      <AttachLinkDialog
        open={linkDialogOpen}
        onClose={() => setLinkDialogOpen(false)}
        noteId={noteId}
        onSuccess={handleSuccess}
      />
    </>
  );
}
