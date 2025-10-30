'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Container,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

interface Notebook {
  id: string;
  name: string;
  color: string;
}

interface Note {
  id: string;
  title: string;
  content: string | null;
  notebookId: string | null;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

async function fetchNote(id: string): Promise<Note> {
  const response = await fetch(`/api/notes/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch note');
  }
  const data = await response.json();
  return data.note;
}

async function fetchNotebooks(): Promise<Notebook[]> {
  const response = await fetch('/api/notebooks');
  if (!response.ok) {
    throw new Error('Failed to fetch notebooks');
  }
  const data = await response.json();
  return data.notebooks;
}

export default function NoteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const noteId = params.id as string;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    notebookId: '',
    isPinned: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch note data
  const { data: note, isLoading, error } = useQuery({
    queryKey: ['note', noteId],
    queryFn: () => fetchNote(noteId),
  });

  // Fetch notebooks
  const { data: notebooks = [] } = useQuery({
    queryKey: ['notebooks'],
    queryFn: fetchNotebooks,
  });

  // Update form when note loads
  useEffect(() => {
    if (note) {
      setFormData({
        title: note.title,
        content: note.content || '',
        notebookId: note.notebookId || '',
        isPinned: note.isPinned,
      });
    }
  }, [note]);

  // Update mutation
  const updateNoteMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update note');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note', noteId] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setIsEditing(false);
    },
  });

  // Delete mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete note');
      }

      return response.json();
    },
    onSuccess: () => {
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
      notebookId: e.target.value,
    }));
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
      notebookId: formData.notebookId || null,
      isPinned: formData.isPinned,
    };

    updateNoteMutation.mutate(submitData);
  };

  const handleCancel = () => {
    if (note) {
      setFormData({
        title: note.title,
        content: note.content || '',
        notebookId: note.notebookId || '',
        isPinned: note.isPinned,
      });
    }
    setIsEditing(false);
    setErrors({});
  };

  const handleDelete = () => {
    deleteNoteMutation.mutate();
  };

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Alert severity="error">
          {error instanceof Error ? error.message : 'Failed to load note'}
        </Alert>
      </Container>
    );
  }

  if (!note) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Alert severity="warning">Note not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Box mb={3}>
        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
          <Tooltip title="Back to Dashboard">
            <IconButton onClick={() => router.push('/dashboard')} sx={{ color: 'text.primary' }}>
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="h4" component="h1" flexGrow={1}>
            {isEditing ? 'Edit Note' : note.title}
          </Typography>
          {!isEditing && (
            <Stack direction="row" spacing={1}>
              <Tooltip title="Edit Note">
                <IconButton
                  onClick={() => setIsEditing(true)}
                  sx={{ color: 'primary.main' }}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete Note">
                <IconButton
                  onClick={() => setDeleteDialogOpen(true)}
                  sx={{ color: 'error.main' }}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          )}
        </Stack>
      </Box>

      {updateNoteMutation.error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {updateNoteMutation.error instanceof Error
            ? updateNoteMutation.error.message
            : 'Failed to update note'}
        </Alert>
      )}

      {deleteNoteMutation.error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {deleteNoteMutation.error instanceof Error
            ? deleteNoteMutation.error.message
            : 'Failed to delete note'}
        </Alert>
      )}

      <Card>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
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
                />

                <FormControl fullWidth>
                  <InputLabel id="notebook-label">Notebook (Optional)</InputLabel>
                  <Select
                    labelId="notebook-label"
                    id="notebook-select"
                    value={formData.notebookId}
                    label="Notebook (Optional)"
                    onChange={handleSelectChange}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {notebooks.map((notebook) => (
                      <MenuItem key={notebook.id} value={notebook.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              borderRadius: '4px',
                              bgcolor: notebook.color,
                            }}
                          />
                          {notebook.name}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Content"
                  name="content"
                  multiline
                  rows={12}
                  fullWidth
                  value={formData.content}
                  onChange={handleChange}
                  sx={{
                    '& .MuiInputBase-root': {
                      fontFamily: 'monospace',
                      fontSize: '14px',
                    },
                  }}
                />

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

                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={handleCancel}
                    disabled={updateNoteMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={
                      updateNoteMutation.isPending ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <SaveIcon />
                      )
                    }
                    disabled={updateNoteMutation.isPending}
                  >
                    {updateNoteMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Stack>
              </Stack>
            </form>
          ) : (
            <Stack spacing={2}>
              <Box display="flex" alignItems="center" gap={2}>
                {note.notebookId && (
                  <Box
                    sx={{
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      bgcolor: 'primary.50',
                      color: 'primary.main',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }}
                  >
                    {notebooks.find((n) => n.id === note.notebookId)?.name || 'Notebook'}
                  </Box>
                )}
                {note.isPinned && (
                  <Typography variant="body2" color="primary.main" fontWeight={600}>
                    📌 Pinned
                  </Typography>
                )}
              </Box>

              <Typography
                variant="body1"
                sx={{
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  lineHeight: 1.8,
                }}
              >
                {note.content || <em style={{ color: '#999' }}>No content</em>}
              </Typography>

              <Box mt={2} pt={2} borderTop="1px solid #eee">
                <Typography variant="caption" color="text.secondary">
                  Created: {new Date(note.createdAt).toLocaleString()}
                </Typography>
                <br />
                <Typography variant="caption" color="text.secondary">
                  Updated: {new Date(note.updatedAt).toLocaleString()}
                </Typography>
              </Box>
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Note</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this note? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleteNoteMutation.isPending}
          >
            {deleteNoteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

