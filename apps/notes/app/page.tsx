import Link from 'next/link';
import { Box, Container, Typography, Button, Stack } from '@mui/material';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import DashboardIcon from '@mui/icons-material/Dashboard';

export default function HomePage() {
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          py: 4,
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
          📝 Notes App
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Collaborative note-taking for teams
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 600 }}>
          Capture, organize, and collaborate on knowledge securely. Built on the Vorklee2
          Multi-App SaaS Platform with enterprise-grade features.
        </Typography>

        <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
          <Button
            variant="contained"
            size="large"
            component={Link}
            href="/dashboard"
            startIcon={<DashboardIcon />}
          >
            Go to Dashboard
          </Button>
          <Button
            variant="outlined"
            size="large"
            component={Link}
            href="/dashboard/notes/new"
            startIcon={<NoteAddIcon />}
          >
            Create Note
          </Button>
        </Stack>

        <Box sx={{ mt: 6 }}>
          <Typography variant="h6" gutterBottom>
            ✨ Features
          </Typography>
          <Stack spacing={1} sx={{ textAlign: 'left', maxWidth: 500 }}>
            <Typography>• Rich text editor with Markdown support</Typography>
            <Typography>• Organize notes into notebooks</Typography>
            <Typography>• Tag and categorize your content</Typography>
            <Typography>• Attach files and media</Typography>
            <Typography>• Real-time collaboration (Pro+)</Typography>
            <Typography>• AI-powered summaries (Pro+)</Typography>
            <Typography>• Offline mode and sync</Typography>
          </Stack>
        </Box>

        <Box sx={{ mt: 6, p: 3, bgcolor: 'grey.100', borderRadius: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Powered by Vorklee2 Platform
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Enterprise-ready • Secure • Scalable
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}

