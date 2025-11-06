'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Button,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { CreateTagDialog } from '@/components/tags/CreateTagDialog';

interface Tag {
  id: string;
  name: string;
  color: string | null;
  createdAt: string;
}

async function fetchTags(): Promise<Tag[]> {
  const response = await fetch('/api/tags');
  if (!response.ok) {
    throw new Error('Failed to fetch tags');
  }
  const json = await response.json();
  return json.data;
}

export default function TagsPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const queryClient = useQueryClient();

  const { data: tags, isLoading, error } = useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
  });

  const deleteTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete tag');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setDeleteDialogOpen(false);
      setSelectedTag(null);
    },
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, tag: Tag) => {
    setAnchorEl(event.currentTarget);
    setSelectedTag(tag);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = () => {
    if (selectedTag) {
      deleteTagMutation.mutate(selectedTag.id);
    }
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
      <Alert severity="error">
        Failed to load tags: {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" alignItems="center" mb={3}>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          New Tag
        </Button>
      </Box>

      {tags && tags.length === 0 ? (
        <Paper sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No tags yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Create tags to categorize your notes
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Tag
          </Button>
        </Paper>
      ) : (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {tags?.map((tag) => (
            <Box
              key={tag.id}
              sx={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              <Chip
                label={tag.name}
                sx={{ 
                  bgcolor: tag.color || '#1976d2', 
                  color: 'white', 
                  fontWeight: 500,
                  pr: 4,
                  '&:hover': {
                    opacity: 0.8,
                    cursor: 'pointer',
                  },
                }}
                onClick={() => {
                  // Navigate to notes with this tag
                }}
              />
              <IconButton
                size="small"
                sx={{
                  position: 'absolute',
                  right: 2,
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                  },
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleMenuOpen(e, tag);
                }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Stack>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1, fontSize: 18 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <DeleteIcon sx={{ mr: 1, fontSize: 18 }} />
          Delete
        </MenuItem>
      </Menu>

      <CreateTagDialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)} 
      />

      <CreateTagDialog 
        open={editDialogOpen} 
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedTag(null);
        }}
        tag={selectedTag}
      />

      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedTag(null);
        }}
      >
        <DialogTitle>Delete Tag</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the tag "{selectedTag?.name}"? This action cannot be undone.
          </DialogContentText>
          {deleteTagMutation.error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteTagMutation.error instanceof Error
                ? deleteTagMutation.error.message
                : 'Failed to delete tag'}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setDeleteDialogOpen(false);
              setSelectedTag(null);
            }}
            disabled={deleteTagMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleteTagMutation.isPending}
            startIcon={
              deleteTagMutation.isPending ? (
                <CircularProgress size={16} />
              ) : (
                <DeleteIcon />
              )
            }
          >
            {deleteTagMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


