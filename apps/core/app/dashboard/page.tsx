'use client';

import { Box, Typography, Grid, Card, CardContent, Button } from '@mui/material';
import Link from 'next/link';
import NoteIcon from '@mui/icons-material/Note';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

export default function DashboardPage() {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Welcome to Vorklee2 Platform
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
        Your unified workspace for all applications
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <NoteIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Notes App
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Create, organize, and manage your notes with notebooks, tags, and search.
              </Typography>
              <Button
                variant="contained"
                component={Link}
                href="/dashboard/notes"
                fullWidth
              >
                Open Notes
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <AccessTimeIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Attendance App
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Track attendance, manage schedules, and generate reports.
              </Typography>
              <Button
                variant="contained"
                component={Link}
                href="/dashboard/attendance"
                fullWidth
              >
                Open Attendance
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

