'use client';

import { Box, AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItem, ListItemIcon, ListItemText, ListItemButton } from '@mui/material';
import { useState } from 'react';
import Link from 'next/link';
import MenuIcon from '@mui/icons-material/Menu';
import NoteIcon from '@mui/icons-material/Note';
import FolderIcon from '@mui/icons-material/Folder';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import { useTranslation } from '@/components/i18n/useTranslation';
import { NotebooksDropdown } from '@/components/notebooks/NotebooksDropdown';

const drawerWidth = 240;

export default function DashboardLayout({
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
    { text: t('nav.notebooks'), icon: <FolderIcon />, href: '/dashboard/notebooks' },
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


