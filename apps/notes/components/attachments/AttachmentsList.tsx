'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardMedia,
  CardContent,
  IconButton,
  Grid,
  Link as MuiLink,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import LinkIcon from '@mui/icons-material/Link';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
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
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

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
                {isImage(file.fileType) && file.fileUrl && !imageErrors.has(file.id) && (
                  <CardMedia
                    component="img"
                    height="200"
                    image={file.fileUrl}
                    alt={file.fileName}
                    sx={{ 
                      objectFit: 'cover',
                      cursor: 'pointer',
                      width: '100%',
                      '&:hover': {
                        opacity: 0.8,
                      },
                    }}
                    onClick={() => window.open(file.fileUrl, '_blank')}
                    onError={() => {
                      setImageErrors((prev) => new Set(prev).add(file.id));
                    }}
                  />
                )}
                {isImage(file.fileType) && imageErrors.has(file.id) && (
                  <Box
                    sx={{
                      height: 200,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'grey.100',
                      gap: 1,
                    }}
                  >
                    <ImageIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      Preview unavailable
                    </Typography>
                  </Box>
                )}
                {isPdf(file.fileType) && (
                  <Box
                    sx={{
                      height: 200,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'grey.100',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'grey.200',
                      },
                    }}
                    onClick={() => window.open(file.fileUrl, '_blank')}
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
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Link Attachments */}
      {links.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {links.map((link) => (
            <Card key={link.id} variant="outlined" sx={{ cursor: 'pointer', '&:hover': { boxShadow: 2 } }}>
              <CardContent>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {/* Preview Image if available */}
                  {link.imageUrl && (
                    <Box
                      sx={{
                        width: 120,
                        height: 80,
                        flexShrink: 0,
                        borderRadius: 1,
                        overflow: 'hidden',
                        bgcolor: 'grey.100',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(link.url, '_blank');
                      }}
                    >
                      <CardMedia
                        component="img"
                        image={link.imageUrl}
                        alt={link.title || 'Link preview'}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Box>
                  )}
                  
                  {/* Link Content */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <MuiLink
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1, 
                            mb: 0.5,
                            textDecoration: 'none',
                            '&:hover': {
                              textDecoration: 'underline',
                            },
                          }}
                        >
                          <LinkIcon fontSize="small" />
                          <Typography variant="body2" fontWeight={600} noWrap>
                            {link.title || link.url}
                          </Typography>
                          <OpenInNewIcon fontSize="small" sx={{ fontSize: 14 }} />
                        </MuiLink>
                        {link.description && (
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                            {link.description}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {link.url}
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLink(link.id);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}

