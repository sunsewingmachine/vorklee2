'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  IconButton,
  Menu,
  MenuList,
  Box,
  Typography,
  Divider,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from '@/components/i18n/useTranslation';
import { NotebookTreeItem } from './NotebookTreeItem';
import { CreateNotebookDialog } from './CreateNotebookDialog';
import type { NotebookWithChildren } from '@/services/notebooks.service';
import { useRouter } from 'next/navigation';

interface NotebooksDropdownProps {
  onSelectNotebook?: (notebookId: string) => void;
  onCreateNotebook?: () => void;
}

async function fetchNotebooksHierarchical(): Promise<NotebookWithChildren[]> {
  const response = await fetch('/api/notebooks?hierarchical=true');
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch notebooks (${response.status})`);
  }
  const json = await response.json();
  // Always return an array, even if data is undefined or null
  return Array.isArray(json.data) ? json.data : [];
}

export function NotebooksDropdown({ onSelectNotebook, onCreateNotebook }: NotebooksDropdownProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createSubFolderParentId, setCreateSubFolderParentId] = useState<string | null>(null);
  const router = useRouter();
  const { t } = useTranslation();

  const { data: notebooks, isLoading, error } = useQuery({
    queryKey: ['notebooks', 'hierarchical'],
    queryFn: fetchNotebooksHierarchical,
  });

  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (notebookId: string) => {
    setSelectedId(notebookId);
    onSelectNotebook?.(notebookId);
    router.push(`/dashboard/notebooks/${notebookId}`);
    handleClose();
  };

  const handleCreate = () => {
    handleClose();
    setCreateSubFolderParentId(null);
    setCreateDialogOpen(true);
    onCreateNotebook?.();
  };

  const handleEdit = (notebookId: string) => {
    handleClose();
    router.push(`/dashboard/notebooks/${notebookId}?edit=true`);
  };

  const handleDelete = (notebookId: string) => {
    handleClose();
    // TODO: Implement delete confirmation dialog
    console.log('Delete notebook:', notebookId);
  };

  const handleCreateSubFolder = (parentId: string) => {
    handleClose();
    setCreateSubFolderParentId(parentId);
    setCreateDialogOpen(true);
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        aria-label={t('notebooks.menu.dropdown.label')}
        aria-haspopup="true"
        aria-expanded={open}
        sx={{ color: 'inherit' }}
      >
        <FolderIcon />
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
            maxHeight: 400,
            width: 320,
            mt: 1,
          },
        }}
        MenuListProps={{
          'aria-label': t('notebooks.menu.title'),
          role: 'menu',
        }}
      >
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            {t('notebooks.menu.dropdown.label')}
          </Typography>
        </Box>

        <Divider />

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {error && (
          <Box sx={{ p: 2 }}>
            <Alert severity="error" sx={{ fontSize: '0.875rem', mb: 2 }}>
              {error instanceof Error ? error.message : 'Failed to load notebooks'}
            </Alert>
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={handleCreate}
              >
                {t('notebooks.menu.actions.create')}
              </Button>
            </Box>
          </Box>
        )}

        {!isLoading && !error && (!notebooks || notebooks.length === 0) && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <FolderIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('notebooks.menu.dropdown.empty')}
            </Typography>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={handleCreate}
              sx={{ mt: 1 }}
            >
              {t('notebooks.menu.actions.create')}
            </Button>
          </Box>
        )}

        {!isLoading && !error && notebooks && notebooks.length > 0 && (
          <MenuList
            dense
            sx={{
              maxHeight: 300,
              overflowY: 'auto',
              py: 0,
            }}
          >
            {notebooks.map((notebook) => (
              <NotebookTreeItem
                key={notebook.id}
                notebook={notebook}
                level={0}
                onSelect={handleSelect}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onCreateSubFolder={handleCreateSubFolder}
                selectedId={selectedId}
              />
            ))}
          </MenuList>
        )}

        <Divider />

        <Box sx={{ p: 1 }}>
          <Button
            fullWidth
            startIcon={<AddIcon />}
            onClick={handleCreate}
            size="small"
            sx={{ justifyContent: 'flex-start' }}
          >
            {t('notebooks.menu.actions.create')}
          </Button>
          <Button
            fullWidth
            onClick={() => {
              handleClose();
              router.push('/dashboard/notebooks');
            }}
            size="small"
            sx={{ justifyContent: 'flex-start', mt: 0.5 }}
          >
            {t('notebooks.menu.dropdown.viewAll')}
          </Button>
        </Box>
      </Menu>
      
      <CreateNotebookDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        parentId={createSubFolderParentId}
        notebooks={notebooks || []}
      />
    </>
  );
}

