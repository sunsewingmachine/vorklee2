'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FolderIcon from '@mui/icons-material/Folder';

interface Notebook {
  id: string;
  name: string;
  description: string | null;
  color: string;
  createdAt: string;
}

async function fetchNotebooks(): Promise<Notebook[]> {
  const response = await fetch('/api/notebooks');
  if (!response.ok) {
    throw new Error('Failed to fetch notebooks');
  }
  const data = await response.json();
  return data.notebooks;
}

export default function NotebooksPage() {
  const { data: notebooks, isLoading, error } = useQuery({
    queryKey: ['notebooks'],
    queryFn: fetchNotebooks,
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
        Failed to load notebooks: {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Notebooks
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          New Notebook
        </Button>
      </Box>

      {notebooks && notebooks.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <FolderIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No notebooks yet
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Create a notebook to organize your notes
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />}>
              Create Notebook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {notebooks?.map((notebook) => (
            <Grid item xs={12} sm={6} md={4} key={notebook.id}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <FolderIcon sx={{ color: notebook.color, mr: 1 }} />
                    <Typography variant="h6" component="h2">
                      {notebook.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {notebook.description || 'No description'}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small">Open</Button>
                  <Button size="small">Edit</Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}


