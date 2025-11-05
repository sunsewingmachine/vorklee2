'use client';

import { Box, AppBar, Toolbar, Typography, IconButton, Tooltip } from '@mui/material';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from '@/components/i18n/useTranslation';
import { NotesMenuDropdown } from '@/components/notes/NotesMenuDropdown';
import { DashboardProvider, useDashboard } from '@/contexts/DashboardContext';
import { ViewModeToggle } from '@/components/explorer/ViewModeToggle';
import { useState, memo, useMemo } from 'react';

const DashboardToolbarContent = memo(function DashboardToolbarContent({ isDashboardPage }: { isDashboardPage: boolean }) {
  const { viewState, setViewState } = useDashboard();
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
});

// Memoized toolbar title component - only updates text content, not structure
const ToolbarTitle = memo(function ToolbarTitle({ isTagsPage }: { isTagsPage: boolean }) {
  const { t } = useTranslation();
  const title = isTagsPage ? t('nav.tags') || 'Tags' : t('nav.allNotes') || 'Notes';
  
  return (
    <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
      {title}
    </Typography>
  );
});

// Memoized toolbar actions - only updates content, not structure
const ToolbarActions = memo(function ToolbarActions({ isNotesPage, isDashboardPage }: { isNotesPage: boolean; isDashboardPage: boolean }) {
  if (!isNotesPage) {
    return (
      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
        <NotesMenuDropdown />
      </Box>
    );
  }

  return (
    <>
      <DashboardToolbarContent isDashboardPage={isDashboardPage} />
      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
        <NotesMenuDropdown />
      </Box>
    </>
  );
});

// Memoized AppBar wrapper - prevents re-renders when navigating between note pages
const StableAppBar = memo(function StableAppBar({
  isNotesPage,
  isTagsPage,
  isDashboardPage,
}: {
  isNotesPage: boolean;
  isTagsPage: boolean;
  isDashboardPage: boolean;
}) {
  const showTopBar = isNotesPage || isTagsPage;

  return (
    <AppBar
      position="static"
      sx={{
        bgcolor: '#1976d2',
        display: showTopBar ? 'block' : 'none', // Hide with CSS instead of unmounting
      }}
    >
      <Toolbar>
        {/* Only these children update, AppBar structure stays stable */}
        <ToolbarTitle isTagsPage={isTagsPage} />
        <ToolbarActions isNotesPage={isNotesPage} isDashboardPage={isDashboardPage} />
      </Toolbar>
    </AppBar>
  );
}, (prevProps, nextProps) => {
  // Only re-render if page type changes (Notes ↔ Tags), not when navigating between individual pages
  // This keeps the AppBar stable when clicking between /dashboard/notes/1 and /dashboard/notes/2
  return (
    prevProps.isNotesPage === nextProps.isNotesPage &&
    prevProps.isTagsPage === nextProps.isTagsPage &&
    prevProps.isDashboardPage === nextProps.isDashboardPage
  );
});

function DashboardLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Memoize page type detection to prevent unnecessary recalculations
  const { isNotesPage, isTagsPage, isDashboardPage } = useMemo(() => {
    const notesPage = pathname === '/dashboard' || pathname.startsWith('/dashboard/notes');
    const tagsPage = pathname === '/dashboard/tags';
    const dashboardPage = pathname === '/dashboard';
    return { isNotesPage: notesPage, isTagsPage: tagsPage, isDashboardPage: dashboardPage };
  }, [pathname]);

  return (
    <Box>
      {/* Always render AppBar - use CSS to hide/show, never unmounts */}
      <StableAppBar 
        isNotesPage={isNotesPage} 
        isTagsPage={isTagsPage} 
        isDashboardPage={isDashboardPage} 
      />
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


