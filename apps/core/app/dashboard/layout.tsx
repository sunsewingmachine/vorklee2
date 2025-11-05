'use client';

import { Box, AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItem, ListItemIcon, ListItemText, ListItemButton, Tooltip, Divider, Collapse } from '@mui/material';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import MenuIcon from '@mui/icons-material/Menu';
import NoteIcon from '@mui/icons-material/Note';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import HomeIcon from '@mui/icons-material/Home';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HistoryIcon from '@mui/icons-material/History';
import AssessmentIcon from '@mui/icons-material/Assessment';
import WorkIcon from '@mui/icons-material/Work';
import PeopleIcon from '@mui/icons-material/People';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { ThemeProvider } from '@/contexts/ThemeProvider';

const drawerWidth = 280;

// App menu structure
// Note: These links point to the notes app (port 3001) or can be proxied through core app
const NOTES_APP_URL = process.env.NEXT_PUBLIC_NOTES_APP_URL || 'http://localhost:3001';

const appMenus = {
  notes: {
    label: 'Notes',
    icon: <NoteIcon />,
    items: [
      { text: 'All Notes', icon: <NoteIcon />, href: `${NOTES_APP_URL}/dashboard` },
      { text: 'Notebooks', icon: <NoteIcon />, href: `${NOTES_APP_URL}/dashboard/notebooks` },
      { text: 'Tags', icon: <LocalOfferIcon />, href: `${NOTES_APP_URL}/dashboard/tags` },
      { text: 'Search', icon: <SearchIcon />, href: `${NOTES_APP_URL}/dashboard/search` },
    ],
  },
  attendance: {
    label: 'Attendance',
    icon: <AccessTimeIcon />,
    items: [
      { text: 'Dashboard', icon: <DashboardIcon />, href: '/dashboard/attendance' },
      { text: 'Records', icon: <HistoryIcon />, href: '/dashboard/attendance/records' },
      { text: 'Reports', icon: <AssessmentIcon />, href: '/dashboard/attendance/reports' },
      { text: 'Shifts', icon: <WorkIcon />, href: '/dashboard/attendance/shifts' },
      { text: 'Employees', icon: <PeopleIcon />, href: '/dashboard/attendance/employees' },
      { text: 'Calendar', icon: <CalendarTodayIcon />, href: '/dashboard/attendance/calendar' },
    ],
  },
};

function UnifiedDashboardLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedApps, setExpandedApps] = useState<Record<string, boolean>>({
    notes: true, // Default to expanded
    attendance: false, // Default to collapsed
  });
  const pathname = usePathname();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const toggleAppExpansion = (appKey: string) => {
    setExpandedApps((prev) => ({
      ...prev,
      [appKey]: !prev[appKey],
    }));
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const drawer = (
    <Box
      sx={{
        bgcolor: '#0f1419',
        height: '100%',
        color: '#fff',
        background: 'linear-gradient(180deg, #0f1419 0%, #1a1f2e 100%)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Toolbar
        sx={{
          bgcolor: 'rgba(25, 118, 210, 0.15)',
          borderBottom: '1px solid rgba(25, 118, 210, 0.2)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', color: '#fff' }}>
          🚀 Vorklee2
        </Typography>
      </Toolbar>

      <List sx={{ flexGrow: 1, pt: 1 }}>
        {/* Home/Dashboard */}
        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            href="/dashboard"
            sx={{
              color: '#e3f2fd',
              bgcolor: pathname === '/dashboard' ? 'rgba(25, 118, 210, 0.2)' : 'transparent',
              '&:hover': {
                bgcolor: 'rgba(25, 118, 210, 0.1)',
                borderLeft: '3px solid #1976d2',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <ListItemIcon sx={{ color: '#90caf9' }}>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary="Dashboard" sx={{ '& .MuiTypography-root': { fontWeight: 500 } }} />
          </ListItemButton>
        </ListItem>

        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 1 }} />

        {/* App Menus */}
        {Object.entries(appMenus).map(([appKey, app]) => (
          <Box key={appKey}>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => toggleAppExpansion(appKey)}
                sx={{
                  color: '#e3f2fd',
                  '&:hover': {
                    bgcolor: 'rgba(25, 118, 210, 0.1)',
                  },
                }}
              >
                <ListItemIcon sx={{ color: '#90caf9' }}>{app.icon}</ListItemIcon>
                <ListItemText primary={app.label} sx={{ '& .MuiTypography-root': { fontWeight: 600 } }} />
                {expandedApps[appKey] ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>
            <Collapse in={expandedApps[appKey]} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {app.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <ListItem key={item.href} disablePadding>
                      <ListItemButton
                        component="a"
                        href={item.href}
                        target={item.href.startsWith('http') ? '_self' : undefined}
                        sx={{
                          pl: 4,
                          color: '#e3f2fd',
                          bgcolor: active ? 'rgba(25, 118, 210, 0.2)' : 'transparent',
                          '&:hover': {
                            bgcolor: 'rgba(25, 118, 210, 0.1)',
                            borderLeft: '3px solid #1976d2',
                          },
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <ListItemIcon sx={{ color: '#90caf9', minWidth: 36 }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText primary={item.text} sx={{ '& .MuiTypography-root': { fontWeight: active ? 600 : 400 } }} />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Collapse>
          </Box>
        ))}

        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 1 }} />

        {/* Settings */}
        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            href="/dashboard/settings"
            sx={{
              color: '#e3f2fd',
              bgcolor: pathname === '/dashboard/settings' ? 'rgba(25, 118, 210, 0.2)' : 'transparent',
              '&:hover': {
                bgcolor: 'rgba(25, 118, 210, 0.1)',
                borderLeft: '3px solid #1976d2',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <ListItemIcon sx={{ color: '#90caf9' }}>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Settings" sx={{ '& .MuiTypography-root': { fontWeight: 500 } }} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: '#1976d2',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
            Vorklee2 Platform
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default function UnifiedDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <UnifiedDashboardLayoutInner>{children}</UnifiedDashboardLayoutInner>
    </ThemeProvider>
  );
}

