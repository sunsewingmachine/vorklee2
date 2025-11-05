'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  List,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FolderIcon from '@mui/icons-material/Folder';
import { useTranslation } from '@/components/i18n/useTranslation';
import { NotebookTreeItem } from '@/components/notebooks/NotebookTreeItem';
import { CreateNotebookDialog } from '@/components/notebooks/CreateNotebookDialog';
import type { NotebookWithChildren } from '@/services/notebooks.service';

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

export default function NotebooksPage() {
  const { t } = useTranslation();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createSubFolderParentId, setCreateSubFolderParentId] = useState<string | null>(null);
  
  const { data: notebooks, isLoading, error } = useQuery({
    queryKey: ['notebooks', 'hierarchical'],
    queryFn: fetchNotebooksHierarchical,
  });

  const handleCreate = () => {
    setCreateSubFolderParentId(null);
    setCreateDialogOpen(true);
  };

  const handleSelect = (notebookId: string) => {
    // TODO: Navigate to notebook detail page
    console.log('Select notebook:', notebookId);
  };

  const handleEdit = (notebookId: string) => {
    // TODO: Open edit notebook dialog
    console.log('Edit notebook:', notebookId);
  };

  const handleDelete = (notebookId: string) => {
    // TODO: Show delete confirmation dialog
    console.log('Delete notebook:', notebookId);
  };

  const handleCreateSubFolder = (parentId: string) => {
    setCreateSubFolderParentId(parentId);
    setCreateDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error instanceof Error ? error.message : 'Failed to load notebooks'}
        </Alert>
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <FolderIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {t('notebooks.menu.empty.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {t('notebooks.menu.empty.description')}
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
              {t('notebooks.menu.actions.create')}
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          {t('notebooks.menu.title')}
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
          {t('notebooks.menu.actions.create')}
        </Button>
      </Box>

      {notebooks && notebooks.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <FolderIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {t('notebooks.menu.empty.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {t('notebooks.menu.empty.description')}
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
              {t('notebooks.menu.actions.create')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent sx={{ py: 1 }}>
            <List 
              component="nav" 
              aria-label={t('notebooks.menu.title')}
              dense
              sx={{ py: 0 }}
            >
              {notebooks?.map((notebook, index) => (
                <NotebookTreeItem
                  key={notebook.id}
                  notebook={notebook}
                  level={0}
                  onSelect={handleSelect}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onCreateSubFolder={handleCreateSubFolder}
                  isLastChild={index === (notebooks.length - 1)}
                />
              ))}
            </List>
          </CardContent>
        </Card>
      )}
      
      <CreateNotebookDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        parentId={createSubFolderParentId}
        notebooks={notebooks || []}
      />
    </Box>
  );
}


