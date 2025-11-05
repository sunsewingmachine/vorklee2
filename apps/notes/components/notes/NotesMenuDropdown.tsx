'use client';

import React, { useState, memo } from 'react';
import {
  IconButton,
  Menu,
  MenuList,
  MenuItem,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import NoteIcon from '@mui/icons-material/Note';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { useTranslation } from '@/components/i18n/useTranslation';
import { useRouter, usePathname } from 'next/navigation';

export const NotesMenuDropdown = memo(function NotesMenuDropdown() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();

  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNavigate = (path: string) => {
    handleClose();
    // Prevent navigation if already on the target path to avoid unnecessary re-renders
    if (pathname !== path) {
      router.push(path);
    }
  };

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/');
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        aria-label={t('nav.allNotes')}
        aria-haspopup="true"
        aria-expanded={open}
        sx={{ color: 'inherit' }}
      >
        <NoteIcon />
      </IconButton>

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
            mt: 1,
            minWidth: 200,
          },
        }}
        MenuListProps={{
          'aria-label': t('nav.allNotes'),
          role: 'menu',
        }}
      >
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            {t('nav.allNotes')}
          </Typography>
        </Box>

        <Divider />

        <MenuList dense sx={{ py: 0 }}>
          <MenuItem
            onClick={() => handleNavigate('/dashboard')}
            selected={isActive('/dashboard')}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <NoteIcon fontSize="small" />
              <Typography variant="body2">{t('nav.allNotes')}</Typography>
            </Box>
          </MenuItem>
          <MenuItem
            onClick={() => handleNavigate('/dashboard/tags')}
            selected={isActive('/dashboard/tags')}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <LocalOfferIcon fontSize="small" />
              <Typography variant="body2">{t('nav.tags')}</Typography>
            </Box>
          </MenuItem>
        </MenuList>
      </Menu>
    </>
  );
});

