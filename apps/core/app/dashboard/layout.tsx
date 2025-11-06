'use client';

import { Box, AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItem, ListItemIcon, ListItemText, ListItemButton, Divider, Collapse } from '@mui/material';
import { useState, createContext, useContext } from 'react';
import MenuIcon from '@mui/icons-material/Menu';
import ListAltIcon from '@mui/icons-material/ListAlt';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import SettingsIcon from '@mui/icons-material/Settings';
import DashboardIcon from '@mui/icons-material/Dashboard';
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

type MenuItem = {
  text: string;
  icon: React.ReactNode;
  href: string;
  isExternal?: boolean;
};

type AppMenu = {
  label: string;
  icon: React.ReactNode;
  mainHref?: string;
  items: MenuItem[];
};

const appMenus: Record<string, AppMenu> = {
  notes: {
    label: 'Notes',
    icon: <ListAltIcon />,
    mainHref: `${NOTES_APP_URL}/dashboard`,
    items: [
      { text: 'Tags', icon: <LocalOfferIcon />, href: `${NOTES_APP_URL}/dashboard/tags`, isExternal: true },
    ],
  },
  attendance: {
    label: 'Attendance',
    icon: <AccessTimeIcon />,
    items: [
      { text: 'Dashboard', icon: <DashboardIcon />, href: 'attendance/dashboard' },
      { text: 'Records', icon: <HistoryIcon />, href: 'attendance/records' },
      { text: 'Reports', icon: <AssessmentIcon />, href: 'attendance/reports' },
      { text: 'Shifts', icon: <WorkIcon />, href: 'attendance/shifts' },
      { text: 'Employees', icon: <PeopleIcon />, href: 'attendance/employees' },
      { text: 'Calendar', icon: <CalendarTodayIcon />, href: 'attendance/calendar' },
    ],
  },
};

// Context for managing current view
type ViewContextType = {
  currentView: string;
  setCurrentView: (view: string) => void;
};

const ViewContext = createContext<ViewContextType>({
  currentView: 'dashboard',
  setCurrentView: () => {},
});

export const useViewContext = () => useContext(ViewContext);

// Component to render content based on current view
function ViewContent({ view }: { view: string }) {
  if (view.startsWith('http')) {
    // External URL - use iframe
    // Height is full viewport since we hide the top bar for external views
    return (
      <Box
        sx={{
          width: '100%',
          height: '100vh',
          position: 'relative',
        }}
      >
        <Box
          component="iframe"
          src={view}
          sx={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        />
      </Box>
    );
  }

  // Internal views
  switch (view) {
    case 'dashboard':
      return (
        <Box>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Welcome to Vorklee2 Platform
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
            Your unified workspace for all applications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Select an option from the menu to get started.
          </Typography>
        </Box>
      );
    case 'settings':
      return (
        <Box>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Settings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Settings page content goes here.
          </Typography>
        </Box>
      );
    default:
      // Attendance views and other internal views
      const viewName = view.split('/').pop() || view;
      return (
        <Box>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            {viewName.charAt(0).toUpperCase() + viewName.slice(1)}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Content for {view} will be displayed here.
          </Typography>
        </Box>
      );
  }
}

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
  const [currentView, setCurrentView] = useState<string>('dashboard');

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const toggleAppExpansion = (appKey: string) => {
    setExpandedApps((prev) => ({
      ...prev,
      [appKey]: !prev[appKey],
    }));
  };

  const handleMenuItemClick = (href: string, isExternal?: boolean) => {
    if (isExternal) {
      setCurrentView(href);
    } else {
      setCurrentView(href);
    }
  };

  const isActive = (href: string) => {
    return currentView === href;
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
            onClick={() => handleMenuItemClick('dashboard')}
            sx={{
              color: '#e3f2fd',
              bgcolor: currentView === 'dashboard' ? 'rgba(25, 118, 210, 0.2)' : 'transparent',
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
        {Object.entries(appMenus).map(([appKey, app]) => {
          const mainHref = app.mainHref;
          const handleMainClick = (e: React.MouseEvent) => {
            e.preventDefault();
            // For Notes menu with mainHref, navigate to dashboard AND ensure submenu is expanded
            if (mainHref) {
              // Always ensure submenu is expanded when clicking main menu
              if (!expandedApps[appKey]) {
                toggleAppExpansion(appKey);
              }
              // Navigate to the main href
              handleMenuItemClick(mainHref, true);
            } else {
              // For menus without mainHref, just toggle expansion
              toggleAppExpansion(appKey);
            }
          };

          const handleToggleClick = (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            toggleAppExpansion(appKey);
          };
          
          return (
            <Box key={appKey}>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={handleMainClick}
                  sx={{
                    color: '#e3f2fd',
                    bgcolor: mainHref && isActive(mainHref) ? 'rgba(25, 118, 210, 0.2)' : 'transparent',
                    '&:hover': {
                      bgcolor: 'rgba(25, 118, 210, 0.1)',
                      borderLeft: '3px solid #1976d2',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <ListItemIcon sx={{ color: '#90caf9' }}>{app.icon}</ListItemIcon>
                  <ListItemText primary={app.label} sx={{ '& .MuiTypography-root': { fontWeight: mainHref && isActive(mainHref) ? 600 : 600 } }} />
                  <Typography 
                    onClick={handleToggleClick}
                    sx={{ 
                      color: '#90caf9', 
                      fontSize: '1.2rem', 
                      fontWeight: 'bold', 
                      ml: 1,
                      cursor: 'pointer',
                      userSelect: 'none',
                      '&:hover': {
                        opacity: 0.8,
                      }
                    }}
                  >
                    {expandedApps[appKey] ? '−' : '+'}
                  </Typography>
                </ListItemButton>
              </ListItem>
            <Collapse in={expandedApps[appKey]} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {app.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <ListItem key={item.href} disablePadding>
                      <ListItemButton
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleMenuItemClick(item.href, item.isExternal);
                        }}
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
        );
        })}

        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 1 }} />

        {/* Settings */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleMenuItemClick('settings')}
            sx={{
              color: '#e3f2fd',
              bgcolor: currentView === 'settings' ? 'rgba(25, 118, 210, 0.2)' : 'transparent',
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

  // Hide top bar when showing external content (iframe) - let the embedded app show its own top bar
  const isExternalView = currentView.startsWith('http');

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Always render AppBar - use CSS to hide/show, never unmounts */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: '#1976d2',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          display: isExternalView ? 'none' : 'block', // Hide with CSS instead of unmounting
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
          onClose={(event, reason) => {
            // Only close drawer on backdrop click or ESC key, not on menu item clicks
            // Menu items will handle their own navigation without closing drawer
            if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
              handleDrawerToggle();
            }
          }}
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
          p: currentView.startsWith('http') ? 0 : 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: isExternalView ? 0 : 8,
          overflow: 'auto',
        }}
      >
        <ViewContent view={currentView} />
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

