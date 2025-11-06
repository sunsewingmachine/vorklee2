'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Chip,
  Typography,
  Button,
  CircularProgress,
  Stack,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

interface Tag {
  id: string;
  name: string;
  color: string | null;
}

interface TagFilterBarProps {
  selectedTagIds: string[];
  onTagToggle: (tagId: string) => void;
  onClearFilters: () => void;
}

async function fetchTags(): Promise<Tag[]> {
  const response = await fetch('/api/tags');
  if (!response.ok) {
    throw new Error('Failed to fetch tags');
  }
  const json = await response.json();
  return json.data || [];
}

export function TagFilterBar({ selectedTagIds, onTagToggle, onClearFilters }: TagFilterBarProps) {
  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <CircularProgress size={16} />
        <Typography variant="body2" color="text.secondary">
          Loading tags...
        </Typography>
      </Box>
    );
  }

  if (tags.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
          Filter by tags:
        </Typography>
        {tags.map((tag) => {
          const isSelected = selectedTagIds.includes(tag.id);
          return (
            <Chip
              key={tag.id}
              label={tag.name}
              onClick={() => onTagToggle(tag.id)}
              sx={{
                bgcolor: isSelected ? (tag.color || '#1976d2') : 'action.selected',
                color: isSelected ? 'white' : 'text.primary',
                fontWeight: isSelected ? 600 : 400,
                border: isSelected ? 'none' : `1px solid ${tag.color || '#1976d2'}`,
                '&:hover': {
                  opacity: 0.8,
                  cursor: 'pointer',
                },
              }}
              icon={isSelected ? <LocalOfferIcon sx={{ color: 'white !important', fontSize: 16 }} /> : undefined}
            />
          );
        })}
        {selectedTagIds.length > 0 && (
          <Button
            size="small"
            startIcon={<ClearIcon />}
            onClick={onClearFilters}
            sx={{ ml: 'auto' }}
          >
            Clear Filters
          </Button>
        )}
      </Stack>
    </Box>
  );
}



