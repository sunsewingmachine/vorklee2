'use client';

import { Box, AppBar, Toolbar, Typography, IconButton, Tooltip } from '@mui/material';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import AddIcon from '@mui/icons-material/Add';
import FolderIcon from '@mui/icons-material/Folder';
import { useTranslation } from '@/components/i18n/useTranslation';
import { NotebooksDropdown } from '@/components/notebooks/NotebooksDropdown';
import { DashboardProvider, useDashboard } from '@/contexts/DashboardContext';
import { ViewModeToggle } from '@/components/explorer/ViewModeToggle';
import { useState } from 'react';

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
  const { t } = useTranslation();

  return (
    <Box>
      <AppBar
        position="static"
        sx={{
          bgcolor: '#1976d2',
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
            {t('nav.notebooks')}
          </Typography>
          <DashboardToolbarContent />
          <NotebooksDropdown />
        </Toolbar>
      </AppBar>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
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


