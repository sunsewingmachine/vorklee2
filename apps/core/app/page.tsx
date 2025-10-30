import Link from 'next/link';
import { Box, Container, Typography, Button, Stack, Card, CardContent, Grid } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SecurityIcon from '@mui/icons-material/Security';
import BusinessIcon from '@mui/icons-material/Business';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import LoginIcon from '@mui/icons-material/Login';

export default function HomePage() {
  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          py: 4,
        }}
      >
        {/* Hero Section */}
        <Box
          sx={{
            textAlign: 'center',
            mb: 8,
          }}
        >
          <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
            🚀 Vorklee2 Core Platform
          </Typography>
          <Typography variant="h5" color="text.secondary" paragraph>
            Multi-App SaaS Platform - Enterprise Core Services
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 700, mx: 'auto' }}>
            The foundation for your multi-app SaaS ecosystem. Providing secure authentication, 
            organization management, billing, analytics, and audit services for all your applications.
          </Typography>

          <Stack direction="row" spacing={2} sx={{ mt: 4, justifyContent: 'center' }}>
            <Button
              variant="contained"
              size="large"
              component={Link}
              href="/login"
              startIcon={<LoginIcon />}
            >
              Login
            </Button>
            <Button
              variant="outlined"
              size="large"
              component={Link}
              href="/dashboard"
              startIcon={<DashboardIcon />}
            >
              Dashboard
            </Button>
          </Stack>
        </Box>

        {/* Features Grid */}
        <Box>
          <Typography variant="h4" component="h2" gutterBottom textAlign="center" mb={4}>
            Core Services
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <SecurityIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Authentication
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Secure JWT-based authentication with session management, SSO support, and multi-factor authentication options.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <BusinessIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Organizations
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Multi-tenant organization management with role-based access control and team collaboration features.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <AccountBalanceIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Billing & Subscriptions
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Flexible subscription management with multiple plans, usage-based billing, and payment processing.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <AnalyticsIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Analytics & Insights
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Track usage patterns, monitor performance, and gain insights into your user base and app usage.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <SecurityIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Audit Logging
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Comprehensive audit trails for compliance, security monitoring, and accountability tracking.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <DashboardIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Shared Utilities
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Rate limiting, caching, logging, and other utilities shared across all platform applications.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ mt: 8, p: 3, bgcolor: 'grey.100', borderRadius: 2, textAlign: 'center' }}>
          <Typography variant="subtitle2" color="text.secondary">
            Powered by Vorklee2 Platform
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Enterprise-ready • Secure • Scalable • Multi-tenant
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}


