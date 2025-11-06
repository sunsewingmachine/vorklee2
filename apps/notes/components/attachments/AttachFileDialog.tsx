'use client';

import React, { useState, useRef } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Typography,
  LinearProgress,
  Alert,
} from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import UploadIcon from '@mui/icons-material/Upload';

interface AttachFileDialogProps {
  open: boolean;
  onClose: () => void;
  noteId: string;
  onSuccess?: () => void;
}

export function AttachFileDialog({ open, onClose, noteId, onSuccess }: AttachFileDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', 'note');
      formData.append('entityId', noteId);

      const response = await fetch('/api/attachments/files', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Upload failed');
      }

      onSuccess?.();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setError(null);
    setLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Attach File</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <Button
            variant="outlined"
            component="label"
            startIcon={<AttachFileIcon />}
            fullWidth
            sx={{ mb: 2 }}
          >
            {file ? file.name : 'Select File'}
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileSelect}
              hidden
            />
          </Button>

          {file && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                File: {file.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Size: {(file.size / 1024).toFixed(2)} KB
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Type: {file.type || 'Unknown'}
              </Typography>
            </Box>
          )}

          {loading && <LinearProgress sx={{ mb: 2 }} />}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          startIcon={<UploadIcon />}
          disabled={!file || loading}
        >
          Upload
        </Button>
      </DialogActions>
    </Dialog>
  );
}

