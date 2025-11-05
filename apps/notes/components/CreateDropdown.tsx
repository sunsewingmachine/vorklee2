'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Menu,
  MenuItem,
  Box,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import FolderIcon from '@mui/icons-material/Folder';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { CreateTagDialog } from './tags/CreateTagDialog';
import { CreateFolderDialog } from './notebooks/CreateFolderDialog';

export function CreateDropdown() {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleCreateNote = () => {
    handleClose();
    router.push('/dashboard/notes/new');
  };

  const handleCreateFolder = () => {
    handleClose();
    setFolderDialogOpen(true);
  };

  const handleCreateTag = () => {
    handleClose();
    setTagDialogOpen(true);
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        endIcon={<ArrowDropDownIcon />}
        onClick={handleClick}
        sx={{
          textTransform: 'none',
          fontWeight: 500,
        }}
      >
        New
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            mt: 0.5,
            minWidth: 200,
          },
        }}
      >
        <MenuItem onClick={handleCreateNote}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
            <NoteAddIcon fontSize="small" />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              New Note
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem onClick={handleCreateFolder}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
            <FolderIcon fontSize="small" />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              New Folder
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem onClick={handleCreateTag}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
            <LocalOfferIcon fontSize="small" />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              New Tag
            </Typography>
          </Box>
        </MenuItem>
      </Menu>
      <CreateTagDialog open={tagDialogOpen} onClose={() => setTagDialogOpen(false)} />
      <CreateFolderDialog open={folderDialogOpen} onClose={() => setFolderDialogOpen(false)} />
    </>
  );
}

