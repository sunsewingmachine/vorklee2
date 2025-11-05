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
import FolderIcon from '@mui/icons-material/Folder';

interface CreateFolderDialogProps {
  open: boolean;
  onClose: () => void;
  parentId?: string | null; // Optional parent folder ID for creating subfolders
}

export function CreateFolderDialog({ open, onClose, parentId }: CreateFolderDialogProps) {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#1976d2',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Predefined color options
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

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setFormData({
        name: '',
        description: '',
        color: '#1976d2',
      });
      setErrors({});
    }
  }, [open]);

  const createFolderMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; color?: string; parentId?: string | null }) => {
      const response = await fetch('/api/notebooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          description: data.description || undefined,
          color: data.color || undefined,
          parentId: data.parentId || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create folder');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch notebooks
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
      
      // Expand the created folder and its parent folders
      const createdFolder = data?.data;
      if (createdFolder) {
        // Get all ancestor folder IDs by traversing up the parent chain
        const folderIdsToExpand: string[] = [createdFolder.id];
        let currentParentId: string | null = createdFolder.parentId || parentId || null;
        
        // We'll expand all ancestors by fetching notebooks and traversing
        // For now, we'll expand the created folder and its immediate parent
        // The tree view will handle expanding further ancestors if needed
        if (currentParentId) {
          folderIdsToExpand.push(currentParentId);
        }
        
        // Dispatch custom event to expand folders
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('expand-folders', {
            detail: { folderIds: folderIdsToExpand }
          }));
        }
      }
      
      handleClose();
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    });
    setErrors({});
    createFolderMutation.reset();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Folder name is required';
    }
    if (formData.name.trim().length > 100) {
      newErrors.name = 'Folder name must be 100 characters or less';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    createFolderMutation.mutate({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      color: formData.color || undefined,
      parentId: parentId || undefined,
    });
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FolderIcon />
            {parentId ? 'New Subfolder' : 'New Folder'}
          </Box>
        </DialogTitle>
        <DialogContent>
          {createFolderMutation.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {createFolderMutation.error instanceof Error
                ? createFolderMutation.error.message
                : 'Failed to create folder'}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Folder Name"
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
          <Button onClick={handleClose} disabled={createFolderMutation.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={createFolderMutation.isPending || !formData.name.trim()}
            startIcon={
              createFolderMutation.isPending ? (
                <CircularProgress size={16} />
              ) : null
            }
          >
            {createFolderMutation.isPending ? 'Creating...' : 'New Folder'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

