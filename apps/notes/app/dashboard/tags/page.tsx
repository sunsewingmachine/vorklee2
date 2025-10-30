'use client';

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

interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

async function fetchTags(): Promise<Tag[]> {
  const response = await fetch('/api/tags');
  if (!response.ok) {
    throw new Error('Failed to fetch tags');
  }
  const data = await response.json();
  return data.tags;
}

export default function TagsPage() {
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
        <Button variant="contained" startIcon={<AddIcon />}>
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
          <Button variant="contained" startIcon={<AddIcon />}>
            Create Tag
          </Button>
        </Paper>
      ) : (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {tags?.map((tag) => (
            <Chip
              key={tag.id}
              label={tag.name}
              sx={{ bgcolor: tag.color, color: 'white', fontWeight: 500 }}
              onClick={() => {
                // Navigate to notes with this tag
              }}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}

