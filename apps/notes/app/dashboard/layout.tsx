'use client';

import { Box, AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItem, ListItemIcon, ListItemText, ListItemButton, Tooltip } from '@mui/material';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import MenuIcon from '@mui/icons-material/Menu';
import NoteIcon from '@mui/icons-material/Note';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import FolderIcon from '@mui/icons-material/Folder';
import { useTranslation } from '@/components/i18n/useTranslation';
import { NotebooksDropdown } from '@/components/notebooks/NotebooksDropdown';
import { DashboardProvider, useDashboard } from '@/contexts/DashboardContext';
import { ViewModeToggle } from '@/components/explorer/ViewModeToggle';

const drawerWidth = 240;

function DashboardToolbarContent() {
  const pathname = usePathname();
  const isDashboardPage = pathname === '/dashboard';
  const { viewState, setViewState, onCreateNotebook } = useDashboard();
  const [longPressTooltip, setLongPressTooltip] = useState<string | null>(null);

  const handleLongPress = (buttonKey: string, tooltip: string) => {
    setLongPressTooltip(buttonKey);
    setTimeout(() => {
      setLongPressTooltip(null);
    }, 3000);
  };

  if (!isDashboardPage) {
    return null;
  }

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mr: 2 }}>
        <Tooltip
          title="New Notebook"
          open={longPressTooltip === 'notebook' ? true : undefined}
          placement="bottom"
          arrow
          enterDelay={longPressTooltip === 'notebook' ? 0 : 300}
          leaveDelay={longPressTooltip === 'notebook' ? 3000 : 200}
        >
          <IconButton
            color="inherit"
            onClick={onCreateNotebook || undefined}
            onMouseDown={(e) => {
              if (e.button === 0) {
                const startTime = Date.now();
                const timer = setTimeout(() => {
                  if (Date.now() - startTime >= 500) {
                    handleLongPress('notebook', 'New Notebook');
                  }
                }, 500);
                const handleMouseUp = () => {
                  clearTimeout(timer);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                document.addEventListener('mouseup', handleMouseUp);
              }
            }}
            onTouchStart={(e) => {
              const startTime = Date.now();
              const timer = setTimeout(() => {
                if (Date.now() - startTime >= 500) {
                  handleLongPress('notebook', 'New Notebook');
                }
              }, 500);
              const handleTouchEnd = () => {
                clearTimeout(timer);
                document.removeEventListener('touchend', handleTouchEnd);
              };
              document.addEventListener('touchend', handleTouchEnd);
            }}
          >
            <FolderIcon />
          </IconButton>
        </Tooltip>
        <Tooltip
          title="New Note"
          open={longPressTooltip === 'note' ? true : undefined}
          placement="bottom"
          arrow
          enterDelay={longPressTooltip === 'note' ? 0 : 300}
          leaveDelay={longPressTooltip === 'note' ? 3000 : 200}
        >
          <IconButton
            color="inherit"
            component={Link}
            href="/dashboard/notes/new"
            onMouseDown={(e) => {
              if (e.button === 0) {
                const startTime = Date.now();
                const timer = setTimeout(() => {
                  if (Date.now() - startTime >= 500) {
                    handleLongPress('note', 'New Note');
                  }
                }, 500);
                const handleMouseUp = () => {
                  clearTimeout(timer);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                document.addEventListener('mouseup', handleMouseUp);
              }
            }}
            onTouchStart={(e) => {
              const startTime = Date.now();
              const timer = setTimeout(() => {
                if (Date.now() - startTime >= 500) {
                  handleLongPress('note', 'New Note');
                }
              }, 500);
              const handleTouchEnd = () => {
                clearTimeout(timer);
                document.removeEventListener('touchend', handleTouchEnd);
              };
              document.addEventListener('touchend', handleTouchEnd);
            }}
          >
            <AddIcon />
          </IconButton>
        </Tooltip>
      </Box>
      <ViewModeToggle value={viewState} onChange={setViewState} />
    </>
  );
}

function DashboardLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t, isRTL } = useTranslation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: t('nav.allNotes'), icon: <NoteIcon />, href: '/dashboard' },
    { text: t('nav.tags'), icon: <LocalOfferIcon />, href: '/dashboard/tags' },
    { text: t('nav.search'), icon: <SearchIcon />, href: '/dashboard/search' },
    { text: t('nav.settings'), icon: <SettingsIcon />, href: '/dashboard/settings' },
  ];

  const drawer = (
    <Box sx={{ 
      bgcolor: '#0f1419', 
      height: '100%', 
      color: '#fff',
      background: 'linear-gradient(180deg, #0f1419 0%, #1a1f2e 100%)',
    }}>
      <Toolbar sx={{ 
        bgcolor: 'rgba(25, 118, 210, 0.15)', 
        borderBottom: '1px solid rgba(25, 118, 210, 0.2)',
        backdropFilter: 'blur(10px)',
      }}>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', color: '#fff' }}>
          📝 Notes
        </Typography>
      </Toolbar>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton 
              component={Link} 
              href={item.href}
              sx={{
                color: '#e3f2fd',
                '&:hover': {
                  bgcolor: 'rgba(25, 118, 210, 0.1)',
                  borderLeft: isRTL ? 'none' : '3px solid #1976d2',
                  borderRight: isRTL ? '3px solid #1976d2' : 'none',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <ListItemIcon sx={{ color: '#90caf9' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} sx={{ '& .MuiTypography-root': { fontWeight: 500 } }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', direction: isRTL ? 'rtl' : 'ltr' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: isRTL ? 0 : `${drawerWidth}px` },
          mr: { sm: isRTL ? `${drawerWidth}px` : 0 },
          bgcolor: '#1976d2',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: isRTL ? 0 : 2, ml: isRTL ? 2 : 0, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
            {t('nav.notebooks')} Dashboard
          </Typography>
          <DashboardToolbarContent />
          <NotebooksDropdown />
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </DashboardProvider>
  );
}


