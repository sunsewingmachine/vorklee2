'use client';

import React from 'react';
import { ToggleButton, ToggleButtonGroup, Box, Tooltip } from '@mui/material';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';

export type ViewMode = 'tree' | 'cards' | 'list';

interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  const handleChange = (_event: React.MouseEvent<HTMLElement>, newValue: ViewMode | null) => {
    if (newValue !== null) {
      onChange(newValue);
    }
  };

  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={handleChange}
      aria-label="view mode"
      size="small"
    >
      <Tooltip title="Tree View">
        <ToggleButton value="tree" aria-label="tree view">
          <AccountTreeIcon fontSize="small" />
        </ToggleButton>
      </Tooltip>
      <Tooltip title="Cards View">
        <ToggleButton value="cards" aria-label="cards view">
          <ViewModuleIcon fontSize="small" />
        </ToggleButton>
      </Tooltip>
      <Tooltip title="List View">
        <ToggleButton value="list" aria-label="list view">
          <ViewListIcon fontSize="small" />
        </ToggleButton>
      </Tooltip>
    </ToggleButtonGroup>
  );
}

