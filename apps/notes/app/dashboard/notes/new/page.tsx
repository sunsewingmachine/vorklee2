'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Container,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Stack,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import { TagSelector } from '@/components/tags/TagSelector';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function NewNotePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isPinned: false,
    tagIds: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || error.error || 'Failed to create note');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch the notes query
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      router.push('/dashboard');
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
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

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be 200 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const submitData = {
      title: formData.title,
      content: formData.content || undefined,
      isPinned: formData.isPinned,
      tagIds: formData.tagIds.length > 0 ? formData.tagIds : undefined,
    };

    createNoteMutation.mutate(submitData);
  };

  const handleCancel = () => {
    router.push('/dashboard');
  };

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Box mb={3}>
        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
          <Tooltip title="Back to Dashboard">
            <IconButton onClick={handleCancel} sx={{ color: 'text.primary' }}>
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="h4" component="h1">
            Create New Note
          </Typography>
        </Stack>

        <Typography variant="body2" color="text.secondary">
          Write your thoughts, ideas, or important information
        </Typography>
      </Box>

      {createNoteMutation.error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {createNoteMutation.error instanceof Error 
            ? createNoteMutation.error.message 
            : 'Failed to create note'}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent>
            <Stack spacing={3}>
              {/* Title Field */}
              <TextField
                label="Title"
                name="title"
                required
                fullWidth
                value={formData.title}
                onChange={handleChange}
                error={!!errors.title}
                helperText={errors.title}
                autoFocus
                inputProps={{
                  maxLength: 200,
                }}
              />

              {/* Tags Selection */}
              <TagSelector
                value={formData.tagIds}
                onChange={(tagIds) => setFormData((prev) => ({ ...prev, tagIds }))}
              />

              {/* Content Field */}
              <TextField
                label="Content"
                name="content"
                multiline
                rows={12}
                fullWidth
                value={formData.content}
                onChange={handleChange}
                placeholder="Start writing your note here..."
                sx={{
                  '& .MuiInputBase-root': {
                    fontFamily: 'monospace',
                    fontSize: '14px',
                  },
                }}
              />

              {/* Pin Checkbox */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isPinned}
                    onChange={handleChange}
                    name="isPinned"
                  />
                }
                label="Pin this note"
              />

              {/* Action Buttons */}
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  disabled={createNoteMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={
                    createNoteMutation.isPending ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <SaveIcon />
                    )
                  }
                  disabled={createNoteMutation.isPending}
                >
                  {createNoteMutation.isPending ? 'Creating...' : 'Create Note'}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </form>
    </Container>
  );
}

