'use client';

import React, { useState } from 'react';
import { ToggleButton, ToggleButtonGroup, Tooltip, IconButton } from '@mui/material';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ChecklistIcon from '@mui/icons-material/Checklist';

export type ViewMode = 'tree' | 'cards' | 'list';
export type ViewFilter = 'tasks' | 'folders' | 'combined';

export interface ViewState {
  mode: ViewMode;
  filter: ViewFilter;
}

interface ViewModeToggleProps {
  value: ViewState;
  onChange: (state: ViewState) => void;
}

export function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  const [longPressTooltip, setLongPressTooltip] = useState<string | null>(null);

  const views = [
    {
      key: 'tree',
      mode: 'tree' as ViewMode,
      filter: 'combined' as ViewFilter,
      icon: AccountTreeIcon,
      tooltip: 'Tree View (Folder+Task)',
    },
    {
      key: 'list',
      mode: 'list' as ViewMode,
      filter: 'tasks' as ViewFilter,
      icon: ChecklistIcon,
      tooltip: 'List View (Task Only)',
    },
    {
      key: 'cards',
      mode: 'cards' as ViewMode,
      filter: 'tasks' as ViewFilter,
      icon: ViewModuleIcon,
      tooltip: 'Card View (Task Only)',
    },
  ];

  const isActive = (view: typeof views[0]) => {
    return value.mode === view.mode && value.filter === view.filter;
  };

  const handleClick = (view: typeof views[0]) => {
    onChange({ mode: view.mode, filter: view.filter });
  };

  const handleLongPress = (viewKey: string) => {
    setLongPressTooltip(viewKey);
    setTimeout(() => {
      setLongPressTooltip(null);
    }, 3000);
  };

  return (
    <ToggleButtonGroup
      value={`${value.mode}-${value.filter}`}
      exclusive
      aria-label="view mode"
      size="small"
      sx={{
        '& .MuiToggleButton-root': {
          border: 'none',
          padding: '4px 8px',
          '&.Mui-selected': {
            backgroundColor: 'rgba(255, 255, 255, 0.16)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.24)',
            },
          },
        },
      }}
    >
      {views.map((view) => {
        const Icon = view.icon;
        const active = isActive(view);
        const showLongPressTooltip = longPressTooltip === view.key;
        return (
          <Tooltip
            key={view.key}
            title={view.tooltip}
            open={showLongPressTooltip ? true : undefined}
            placement="bottom"
            arrow
            enterDelay={showLongPressTooltip ? 0 : 300}
            leaveDelay={showLongPressTooltip ? 3000 : 200}
          >
            <ToggleButton
              value={`${view.mode}-${view.filter}`}
              aria-label={view.tooltip}
              selected={active}
              onClick={() => handleClick(view)}
              onContextMenu={(e) => {
                e.preventDefault();
                handleLongPress(view.key);
              }}
              onMouseDown={(e) => {
                if (e.button === 0) {
                  const startTime = Date.now();
                  const timer = setTimeout(() => {
                    if (Date.now() - startTime >= 500) {
                      handleLongPress(view.key);
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
                    handleLongPress(view.key);
                  }
                }, 500);
                const handleTouchEnd = () => {
                  clearTimeout(timer);
                  document.removeEventListener('touchend', handleTouchEnd);
                };
                document.addEventListener('touchend', handleTouchEnd);
              }}
            >
              <Icon sx={{ color: 'inherit' }} />
            </ToggleButton>
          </Tooltip>
        );
      })}
    </ToggleButtonGroup>
  );
}

