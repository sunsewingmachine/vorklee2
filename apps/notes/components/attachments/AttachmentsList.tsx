'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardMedia,
  CardContent,
  IconButton,
  Chip,
  Link as MuiLink,
  Grid,
  Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import LinkIcon from '@mui/icons-material/Link';
import type { FileAttachment, LinkAttachment } from '@vorklee2/core-attachments';

interface AttachmentsListProps {
  noteId: string;
  onDelete?: () => void;
  refreshTrigger?: number;
}

export function AttachmentsList({ noteId, onDelete, refreshTrigger }: AttachmentsListProps) {
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [links, setLinks] = useState<LinkAttachment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAttachments = async () => {
    try {
      const [filesRes, linksRes] = await Promise.all([
        fetch(`/api/attachments/files?entityType=note&entityId=${noteId}`),
        fetch(`/api/attachments/links?entityType=note&entityId=${noteId}`),
      ]);

      if (filesRes.ok) {
        const filesData = await filesRes.json();
        setFiles(filesData.data || []);
      }

      if (linksRes.ok) {
        const linksData = await linksRes.json();
        setLinks(linksData.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch attachments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (noteId) {
      fetchAttachments();
    }
  }, [noteId, refreshTrigger]);

  const handleDeleteFile = async (id: string) => {
    try {
      const response = await fetch(`/api/attachments/files/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFiles(files.filter((f) => f.id !== id));
        onDelete?.();
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  const handleDeleteLink = async (id: string) => {
    try {
      const response = await fetch(`/api/attachments/links/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setLinks(links.filter((l) => l.id !== id));
        onDelete?.();
      }
    } catch (error) {
      console.error('Failed to delete link:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const isImage = (mimeType: string) => mimeType.startsWith('image/');
  const isPdf = (mimeType: string) => mimeType === 'application/pdf';

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Loading attachments...
        </Typography>
      </Box>
    );
  }

  if (files.length === 0 && links.length === 0) {
    return null;
  }

  return (
    <Box sx={{ p: 2 }}>
      {(files.length > 0 || links.length > 0) && (
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
          Attachments
        </Typography>
      )}

      {/* File Attachments */}
      {files.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {files.map((file) => (
            <Grid item xs={12} sm={6} md={4} key={file.id}>
              <Card>
                {isImage(file.fileType) && file.fileUrl && (
                  <CardMedia
                    component="img"
                    height="140"
                    image={file.fileUrl}
                    alt={file.fileName}
                    sx={{ objectFit: 'cover' }}
                  />
                )}
                {isPdf(file.fileType) && (
                  <Box
                    sx={{
                      height: 140,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'grey.100',
                    }}
                  >
                    <PictureAsPdfIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                  </Box>
                )}
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" noWrap title={file.fileName}>
                        {file.fileName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatFileSize(file.fileSize)}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteFile(file.id)}
                      sx={{ ml: 1 }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  {file.fileUrl && (
                    <MuiLink
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ mt: 1, display: 'block' }}
                    >
                      View
                    </MuiLink>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Link Attachments */}
      {links.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {links.map((link) => (
            <Card key={link.id} variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <MuiLink
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}
                    >
                      <LinkIcon fontSize="small" />
                      <Typography variant="body2" noWrap>
                        {link.title || link.url}
                      </Typography>
                    </MuiLink>
                    {link.description && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {link.description}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      {link.url}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteLink(link.id)}
                    sx={{ ml: 1 }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}

