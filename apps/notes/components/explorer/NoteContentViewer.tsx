'use client';

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import FolderIcon from '@mui/icons-material/Folder';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

interface Note {
  id: string;
  title: string | null;
  content: string | null;
  notebookId: string | null;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
  tags?: Array<{
    id: string;
    name: string;
    color: string | null;
  }>;
}

interface Notebook {
  id: string;
  name: string;
}

interface NoteContentViewerProps {
  note: Note | null;
  notebooks: Notebook[];
  onClose?: () => void;
}

export function NoteContentViewer({ note, notebooks, onClose }: NoteContentViewerProps) {
  const router = useRouter();

  if (!note) {
    return (
      <Paper
        sx={{
          height: '100%',
          p: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Select a note to view content
        </Typography>
      </Paper>
    );
  }

  const handleEdit = () => {
    router.push(`/dashboard/notes/${note.id}?edit=true`);
  };

  const notebook = note.notebookId
    ? notebooks.find((nb) => nb.id === note.notebookId)
    : null;

  return (
    <Paper
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {/* Title and Actions */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            bgcolor: note.tags && note.tags.length > 0 && note.tags[0].color 
              ? note.tags[0].color 
              : 'transparent',
            color: note.tags && note.tags.length > 0 && note.tags[0].color 
              ? 'white' 
              : 'text.primary',
            px: 1.5,
            py: 1,
            borderRadius: 1,
            mb: 1,
          }}
        >
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            {note.title || 'Untitled Note'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Edit note">
              <IconButton 
                size="small" 
                onClick={handleEdit}
                sx={{
                  color: note.tags && note.tags.length > 0 && note.tags[0].color 
                    ? 'white' 
                    : 'inherit',
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {onClose && (
              <Tooltip title="Close">
                <IconButton 
                  size="small" 
                  onClick={onClose}
                  sx={{
                    color: note.tags && note.tags.length > 0 && note.tags[0].color 
                      ? 'white' 
                      : 'inherit',
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Compact Info Bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flexWrap: 'wrap',
            fontSize: '0.75rem',
            color: 'text.secondary',
          }}
        >
          {/* Folder Path */}
          {notebook && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <FolderIcon sx={{ fontSize: 14 }} />
              <Typography variant="caption">{notebook.name}</Typography>
            </Box>
          )}

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
              {note.tags.map((tag) => (
                <Chip
                  key={tag.id}
                  label={tag.name}
                  size="small"
                  sx={{
                    bgcolor: tag.color || '#1976d2',
                    color: 'white',
                    fontSize: '0.7rem',
                    height: 20,
                    '& .MuiChip-label': {
                      px: 0.75,
                    },
                  }}
                />
              ))}
            </Box>
          )}

          {/* Updated Info */}
          {note.updatedAt && (
            <Typography variant="caption">
              Updated: {new Date(note.updatedAt).toLocaleDateString()}{' '}
              {new Date(note.updatedAt).toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Content */}
      <Box
        sx={{
          flex: 1,
          p: 3,
          overflow: 'auto',
        }}
      >
        {note.content ? (
          <Box
            sx={{
              '& p': {
                mb: 2,
              },
              '& h1, & h2, & h3, & h4, & h5, & h6': {
                mt: 3,
                mb: 2,
                fontWeight: 600,
              },
              '& ul, & ol': {
                mb: 2,
                pl: 3,
              },
              '& code': {
                bgcolor: 'action.selected',
                px: 0.5,
                py: 0.25,
                borderRadius: 0.5,
                fontSize: '0.9em',
              },
              '& pre': {
                bgcolor: 'action.selected',
                p: 2,
                borderRadius: 1,
                overflow: 'auto',
                mb: 2,
              },
              '& blockquote': {
                borderLeft: 3,
                borderColor: 'primary.main',
                pl: 2,
                ml: 0,
                fontStyle: 'italic',
                color: 'text.secondary',
              },
            }}
          >
            <ReactMarkdown>{note.content}</ReactMarkdown>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No content
          </Typography>
        )}

      </Box>
    </Paper>
  );
}

