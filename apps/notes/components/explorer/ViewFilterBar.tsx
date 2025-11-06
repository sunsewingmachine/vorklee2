'use client';

import React from 'react';
import { ToggleButton, ToggleButtonGroup, Box, Typography } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ViewListIcon from '@mui/icons-material/ViewList';

export type ViewFilter = 'tasks' | 'folders' | 'combined';

interface ViewFilterBarProps {
  value: ViewFilter;
  onChange: (filter: ViewFilter) => void;
}

export function ViewFilterBar({ value, onChange }: ViewFilterBarProps) {
  const handleChange = (_event: React.MouseEvent<HTMLElement>, newValue: ViewFilter | null) => {
    if (newValue !== null) {
      onChange(newValue);
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Typography variant="body2" color="text.secondary">
        View:
      </Typography>
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={handleChange}
        aria-label="view filter"
        size="small"
      >
        <ToggleButton value="tasks" aria-label="tasks only">
          <ListAltIcon sx={{ mr: 0.5, fontSize: 18 }} />
          Tasks Only
        </ToggleButton>
        <ToggleButton value="folders" aria-label="folders only">
          <FolderIcon sx={{ mr: 0.5, fontSize: 18 }} />
          Folders Only
        </ToggleButton>
        <ToggleButton value="combined" aria-label="combined">
          <ViewListIcon sx={{ mr: 0.5, fontSize: 18 }} />
          Combined
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}

