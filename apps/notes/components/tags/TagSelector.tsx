'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  OutlinedInput,
  CircularProgress,
  Alert,
} from '@mui/material';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

interface Tag {
  id: string;
  name: string;
  color: string | null;
}

interface TagSelectorProps {
  value: string[];
  onChange: (tagIds: string[]) => void;
  error?: boolean;
  helperText?: string;
}

async function fetchTags(): Promise<Tag[]> {
  const response = await fetch('/api/tags');
  if (!response.ok) {
    throw new Error('Failed to fetch tags');
  }
  const json = await response.json();
  return json.data || [];
}

export function TagSelector({ value, onChange, error, helperText }: TagSelectorProps) {
  const { data: tags = [], isLoading, error: fetchError } = useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
  });

  const handleChange = (event: any) => {
    const selectedTagIds = event.target.value as string[];
    onChange(typeof selectedTagIds === 'string' ? [selectedTagIds] : selectedTagIds);
  };

  if (fetchError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load tags: {fetchError instanceof Error ? fetchError.message : 'Unknown error'}
      </Alert>
    );
  }

  return (
    <FormControl fullWidth error={error}>
      <InputLabel id="tags-label">Tags (Optional)</InputLabel>
      <Select
        labelId="tags-label"
        id="tags-select"
        multiple
        value={value}
        onChange={handleChange}
        input={<OutlinedInput label="Tags (Optional)" />}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {(selected as string[]).map((tagId) => {
              const tag = tags.find((t) => t.id === tagId);
              if (!tag) return null;
              return (
                <Chip
                  key={tagId}
                  label={tag.name}
                  size="small"
                  sx={{
                    bgcolor: tag.color || '#1976d2',
                    color: 'white',
                    fontWeight: 500,
                  }}
                  icon={<LocalOfferIcon sx={{ color: 'white !important', fontSize: 16 }} />}
                />
              );
            })}
          </Box>
        )}
        disabled={isLoading}
      >
        {isLoading ? (
          <MenuItem disabled>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            Loading tags...
          </MenuItem>
        ) : tags.length === 0 ? (
          <MenuItem disabled>No tags available. Create tags first.</MenuItem>
        ) : (
          tags.map((tag) => (
            <MenuItem key={tag.id} value={tag.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '4px',
                    bgcolor: tag.color || '#1976d2',
                    flexShrink: 0,
                  }}
                />
                <Box sx={{ flexGrow: 1 }}>{tag.name}</Box>
                {value.includes(tag.id) && (
                  <Box sx={{ color: 'primary.main', fontWeight: 'bold' }}>✓</Box>
                )}
              </Box>
            </MenuItem>
          ))
        )}
      </Select>
      {helperText && (
        <Box sx={{ mt: 0.5, fontSize: '0.75rem', color: error ? 'error.main' : 'text.secondary' }}>
          {helperText}
        </Box>
      )}
    </FormControl>
  );
}

