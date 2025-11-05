'use client';

import { Box, AppBar, Toolbar, Typography, IconButton, TextField, InputAdornment, Chip, Stack, Button, CircularProgress, Divider } from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import ClearIcon from '@mui/icons-material/Clear';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { useTranslation } from '@/components/i18n/useTranslation';
import { DashboardProvider, useDashboard } from '@/contexts/DashboardContext';
import { ViewModeToggle } from '@/components/explorer/ViewModeToggle';
import { CreateDropdown } from '@/components/CreateDropdown';
import { useState, memo, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

const DashboardToolbarContent = memo(function DashboardToolbarContent({ isDashboardPage }: { isDashboardPage: boolean }) {
  const { viewState, setViewState } = useDashboard();

  if (!isDashboardPage) {
    return null;
  }

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mr: 2 }}>
        <CreateDropdown />
      </Box>
      <ViewModeToggle value={viewState} onChange={setViewState} />
    </>
  );
});

interface Tag {
  id: string;
  name: string;
  color: string | null;
}

async function fetchTags(): Promise<Tag[]> {
  const response = await fetch('/api/tags');
  if (!response.ok) {
    throw new Error('Failed to fetch tags');
  }
  const json = await response.json();
  return json.data || [];
}

// Expandable search component
const ExpandableSearch = memo(function ExpandableSearch({ 
  isNotesPage, 
  isExpanded, 
  onToggle 
}: { 
  isNotesPage: boolean; 
  isExpanded: boolean; 
  onToggle: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const { selectedTagIds, handleTagToggle, handleClearTagFilters } = useDashboard();
  const { data: tags = [], isLoading: tagsLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
  });

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      onToggle();
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    onToggle();
  };

  if (!isNotesPage) {
    return null;
  }

  return (
    <>
      {!isExpanded ? (
        <IconButton color="inherit" onClick={onToggle} sx={{ mr: 1 }}>
          <SearchIcon />
        </IconButton>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, gap: 1 }}>
          <Box 
            component="form"
            onSubmit={handleSearch}
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <TextField
              inputRef={inputRef}
              fullWidth
              size="small"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  handleClose();
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={handleClose}
                      sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
                sx: {
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: 1,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.7)',
                  },
                  '& .MuiInputBase-input': {
                    color: '#fff',
                    '&::placeholder': {
                      color: 'rgba(255, 255, 255, 0.7)',
                      opacity: 1,
                    },
                  },
                },
              }}
            />
          </Box>
          {tags.length > 0 && (
            <>
              <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', my: 0.5 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500 }}>
                  Filter by tags:
                </Typography>
                {tagsLoading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Loading tags...
                    </Typography>
                  </Box>
                ) : (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {tags.map((tag) => {
                      const isSelected = selectedTagIds.includes(tag.id);
                      return (
                        <Chip
                          key={tag.id}
                          label={tag.name}
                          onClick={() => handleTagToggle(tag.id)}
                          size="small"
                          sx={{
                            bgcolor: isSelected ? (tag.color || '#1976d2') : 'rgba(255, 255, 255, 0.15)',
                            color: isSelected ? 'white' : 'rgba(255, 255, 255, 0.9)',
                            fontWeight: isSelected ? 600 : 400,
                            border: isSelected ? 'none' : `1px solid ${tag.color || '#1976d2'}`,
                            '&:hover': {
                              opacity: 0.8,
                              cursor: 'pointer',
                            },
                          }}
                          icon={isSelected ? <LocalOfferIcon sx={{ color: 'white !important', fontSize: 14 }} /> : undefined}
                        />
                      );
                    })}
                    {selectedTagIds.length > 0 && (
                      <Button
                        size="small"
                        startIcon={<ClearIcon />}
                        onClick={handleClearTagFilters}
                        sx={{ 
                          color: 'rgba(255, 255, 255, 0.9)',
                          '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                          },
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </Stack>
                )}
              </Box>
            </>
          )}
        </Box>
      )}
    </>
  );
});

// Memoized toolbar title component - only updates text content, not structure
const ToolbarTitle = memo(function ToolbarTitle({ 
  isTagsPage, 
  isSearchExpanded 
}: { 
  isTagsPage: boolean; 
  isSearchExpanded: boolean;
}) {
  const { t } = useTranslation();
  const title = isTagsPage ? t('nav.tags') || 'Tags' : t('nav.allNotes') || 'Notes';
  
  if (isSearchExpanded) {
    return null;
  }
  
  return (
    <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
      {title}
    </Typography>
  );
});

// Memoized toolbar actions - only updates content, not structure
const ToolbarActions = memo(function ToolbarActions({ isNotesPage, isDashboardPage }: { isNotesPage: boolean; isDashboardPage: boolean }) {
  if (!isNotesPage) {
    return null;
  }

  return (
    <>
      <DashboardToolbarContent isDashboardPage={isDashboardPage} />
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
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const toggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded);
  };

  return (
    <AppBar
      position="static"
      sx={{
        bgcolor: '#1976d2',
        display: showTopBar ? 'block' : 'none', // Hide with CSS instead of unmounting
      }}
    >
      <Toolbar
        sx={{
          flexDirection: isSearchExpanded ? 'column' : 'row',
          alignItems: isSearchExpanded ? 'stretch' : 'center',
          py: isSearchExpanded ? 1.5 : 1,
          gap: isSearchExpanded ? 1 : 0,
        }}
      >
        {/* Search icon or expanded search field */}
        <ExpandableSearch 
          isNotesPage={isNotesPage} 
          isExpanded={isSearchExpanded} 
          onToggle={toggleSearch} 
        />
        {/* Only these children update, AppBar structure stays stable */}
        {!isSearchExpanded && (
          <>
            <ToolbarTitle isTagsPage={isTagsPage} isSearchExpanded={isSearchExpanded} />
            <ToolbarActions isNotesPage={isNotesPage} isDashboardPage={isDashboardPage} />
          </>
        )}
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
  const prevPageTypeRef = useRef<{ isNotesPage: boolean; isTagsPage: boolean; isDashboardPage: boolean } | null>(null);

  // Memoize page type detection to prevent unnecessary recalculations
  const pageType = useMemo(() => {
    const notesPage = pathname === '/dashboard' || pathname.startsWith('/dashboard/notes');
    const tagsPage = pathname === '/dashboard/tags';
    const dashboardPage = pathname === '/dashboard';
    return { isNotesPage: notesPage, isTagsPage: tagsPage, isDashboardPage: dashboardPage };
  }, [pathname]);

  // Only update StableAppBar props when page type actually changes
  // This prevents re-renders when navigating to the same route (e.g., clicking "All Notes" while already on /dashboard)
  const stablePageType = useMemo(() => {
    if (
      prevPageTypeRef.current &&
      prevPageTypeRef.current.isNotesPage === pageType.isNotesPage &&
      prevPageTypeRef.current.isTagsPage === pageType.isTagsPage &&
      prevPageTypeRef.current.isDashboardPage === pageType.isDashboardPage
    ) {
      // Page type hasn't changed, return previous values to prevent re-render
      return prevPageTypeRef.current;
    }
    // Page type changed, update ref and return new values
    prevPageTypeRef.current = pageType;
    return pageType;
  }, [pageType]);

  return (
    <Box>
      {/* Always render AppBar - use CSS to hide/show, never unmounts */}
      <StableAppBar 
        isNotesPage={stablePageType.isNotesPage} 
        isTagsPage={stablePageType.isTagsPage} 
        isDashboardPage={stablePageType.isDashboardPage} 
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


