'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Button,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
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
  const { data: tags, isLoading, error } = useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
  });

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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Tags
        </Typography>
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
            <Chip
              key={tag.id}
              label={tag.name}
              sx={{ 
                bgcolor: tag.color || '#1976d2', 
                color: 'white', 
                fontWeight: 500,
                '&:hover': {
                  opacity: 0.8,
                  cursor: 'pointer',
                },
              }}
              onClick={() => {
                // Navigate to notes with this tag
              }}
            />
          ))}
        </Stack>
      )}

      <CreateTagDialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)} 
      />
    </Box>
  );
}


