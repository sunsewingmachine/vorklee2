'use client';

import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { useTranslation } from '@/components/i18n/useTranslation';
import FolderIcon from '@mui/icons-material/Folder';
import type { NotebookWithChildren } from '@/services/notebooks.service';

interface CreateNotebookDialogProps {
  open: boolean;
  onClose: () => void;
  parentId?: string | null;
  notebooks?: NotebookWithChildren[];
}

export function CreateNotebookDialog({
  open,
  onClose,
  parentId = null,
  notebooks = [],
}: CreateNotebookDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  // Predefined color options - ordered by relevance (main colors first, then shades)
  const colorOptions = [
    { value: '#1976d2', label: 'Blue' },
    { value: '#0288d1', label: 'Light Blue' },
    { value: '#2e7d32', label: 'Green' },
    { value: '#388e3c', label: 'Dark Green' },
    { value: '#00796b', label: 'Teal' },
    { value: '#dc004e', label: 'Red' },
    { value: '#d32f2f', label: 'Dark Red' },
    { value: '#ed6c02', label: 'Orange' },
    { value: '#f57c00', label: 'Deep Orange' },
    { value: '#ffc107', label: 'Yellow' },
    { value: '#9c27b0', label: 'Purple' },
    { value: '#7b1fa2', label: 'Dark Purple' },
    { value: '#c2185b', label: 'Pink' },
    { value: '#000000', label: 'Black' },
    { value: '#ffffff', label: 'White' },
  ];

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#1976d2',
    parentId: parentId || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update formData when parentId prop changes (when dialog opens with different parent)
  useEffect(() => {
    if (open) {
      setFormData((prev) => ({
        ...prev,
        parentId: parentId || '',
        // Reset name and description when opening dialog
        name: '',
        description: '',
      }));
    }
  }, [parentId, open]);


  const createNotebookMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      color?: string;
      parentId?: string | null;
    }) => {
      const response = await fetch('/api/notebooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          description: data.description || undefined,
          color: data.color || undefined,
          parentId: data.parentId || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create notebook');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch notebooks
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
      queryClient.invalidateQueries({ queryKey: ['notebooks', 'hierarchical'] });
      handleClose();
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };


  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      color: '#1976d2',
      parentId: '',
    });
    setErrors({});
    createNotebookMutation.reset();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = t('notebooks.menu.actions.create') + ' name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Use parentId prop if provided (for subfolder creation), otherwise create at root level
    const finalParentId = parentId || null;

    createNotebookMutation.mutate({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      color: formData.color || undefined,
      parentId: finalParentId,
    });
  };

  // Get parent folder path when creating subfolder
  const getParentPath = (): string[] => {
    if (!parentId || !notebooks || notebooks.length === 0) {
      return [];
    }

    const findParentPath = (
      items: NotebookWithChildren[],
      targetId: string,
      path: string[] = []
    ): string[] | null => {
      for (const item of items) {
        const currentPath = [...path, item.name];
        
        if (item.id === targetId) {
          return currentPath;
        }

        if (item.children && item.children.length > 0) {
          const found = findParentPath(item.children, targetId, currentPath);
          if (found) {
            return found;
          }
        }
      }
      return null;
    };

    const path = findParentPath(notebooks, parentId);
    return path || [];
  };

  const parentPath = getParentPath();

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {parentId
            ? t('notebooks.menu.actions.createSubFolder')
            : t('notebooks.menu.actions.create')}
        </DialogTitle>
        {parentPath.length > 0 && (
          <Box sx={{ px: 3, pt: 0, pb: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <FolderIcon sx={{ fontSize: 16 }} />
              {parentPath.join(' / ')}
            </Typography>
          </Box>
        )}
        <DialogContent>
          {createNotebookMutation.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {createNotebookMutation.error instanceof Error
                ? createNotebookMutation.error.message
                : 'Failed to create notebook'}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Notebook Name"
              name="name"
              required
              fullWidth
              value={formData.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
              autoFocus
              inputProps={{ maxLength: 100 }}
            />

            <TextField
              label="Description"
              name="description"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={handleChange}
              inputProps={{ maxLength: 500 }}
            />


            <FormControl fullWidth>
              <InputLabel id="color-label">Color</InputLabel>
              <Select
                labelId="color-label"
                id="color-select"
                value={formData.color}
                label="Color"
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, color: e.target.value }));
                  if (errors.color) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.color;
                      return newErrors;
                    });
                  }
                }}
                renderValue={(value) => {
                  const selectedColor = colorOptions.find((opt) => opt.value === value);
                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: '4px',
                          bgcolor: value,
                          border: value === '#ffffff' ? '1px solid rgba(0,0,0,0.2)' : 'none',
                        }}
                      />
                      <Typography variant="body2">{selectedColor?.label || 'Select color'}</Typography>
                    </Box>
                  );
                }}
              >
                {colorOptions.map((colorOption) => (
                  <MenuItem key={colorOption.value} value={colorOption.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '4px',
                          bgcolor: colorOption.value,
                          border: colorOption.value === '#ffffff' ? '1px solid rgba(0,0,0,0.2)' : 'none',
                          flexShrink: 0,
                        }}
                      />
                      <Typography variant="body2">{colorOption.label}</Typography>
                      {formData.color === colorOption.value && (
                        <Box sx={{ ml: 'auto' }}>
                          <Typography variant="body2" color="primary">
                            ✓
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={createNotebookMutation.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={createNotebookMutation.isPending || !formData.name.trim()}
            startIcon={
              createNotebookMutation.isPending ? (
                <CircularProgress size={16} />
              ) : null
            }
          >
            {createNotebookMutation.isPending ? 'Creating...' : t('notebooks.menu.actions.create')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

