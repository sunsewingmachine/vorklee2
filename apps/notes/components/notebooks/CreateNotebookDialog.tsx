'use client';

import React, { useState } from 'react';
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
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#1976d2',
    parentId: parentId || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Flatten notebooks for parent selection
  const flattenNotebooks = (
    notebooks: NotebookWithChildren[],
    level = 0
  ): Array<NotebookWithChildren & { displayName: string }> => {
    const result: Array<NotebookWithChildren & { displayName: string }> = [];
    notebooks.forEach((notebook) => {
      const indent = '  '.repeat(level);
      result.push({
        ...notebook,
        displayName: `${indent}${notebook.name}`,
      });
      if (notebook.children && notebook.children.length > 0) {
        result.push(...flattenNotebooks(notebook.children, level + 1));
      }
    });
    return result;
  };

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

  const handleSelectChange = (e: any) => {
    setFormData((prev) => ({
      ...prev,
      parentId: e.target.value || null,
    }));
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      color: '#1976d2',
      parentId: parentId || '',
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

    createNotebookMutation.mutate({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      color: formData.color || undefined,
      parentId: formData.parentId || null,
    });
  };

  const flatNotebooks = flattenNotebooks(notebooks);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {parentId
            ? t('notebooks.menu.actions.createSubFolder')
            : t('notebooks.menu.actions.create')}
        </DialogTitle>
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

            {!parentId && flatNotebooks.length > 0 && (
              <FormControl fullWidth>
                <InputLabel id="parent-label">
                  {t('notebooks.menu.hierarchy.parent')} (Optional)
                </InputLabel>
                <Select
                  labelId="parent-label"
                  id="parent-select"
                  value={formData.parentId}
                  label={t('notebooks.menu.hierarchy.parent') + ' (Optional)'}
                  onChange={handleSelectChange}
                >
                  <MenuItem value="">
                    <em>None (Root level)</em>
                  </MenuItem>
                  {flatNotebooks.map((notebook) => (
                    <MenuItem key={notebook.id} value={notebook.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '2px',
                            bgcolor: notebook.color || '#1976d2',
                          }}
                        />
                        <Typography variant="body2">{notebook.displayName}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <TextField
              label="Color"
              name="color"
              type="color"
              fullWidth
              value={formData.color}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              inputProps={{
                style: { height: '50px' },
              }}
            />
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

