'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box } from '@mui/material';

interface ResizableSplitPaneProps {
  left: React.ReactNode;
  right: React.ReactNode;
  defaultLeftWidth?: number; // Percentage (0-100)
  minLeftWidth?: number;
  minRightWidth?: number;
  onResize?: (leftWidth: number) => void;
}

export function ResizableSplitPane({
  left,
  right,
  defaultLeftWidth = 50,
  minLeftWidth = 20,
  minRightWidth = 20,
  onResize,
}: ResizableSplitPaneProps) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

      // Constrain to min/max widths
      const constrainedWidth = Math.max(
        minLeftWidth,
        Math.min(100 - minRightWidth, newLeftWidth)
      );

      setLeftWidth(constrainedWidth);
      if (onResize) {
        onResize(constrainedWidth);
      }
    },
    [isDragging, minLeftWidth, minRightWidth, onResize]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <Box
      ref={containerRef}
      sx={{
        display: 'flex',
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Left pane */}
      <Box
        sx={{
          width: `${leftWidth}%`,
          height: '100%',
          overflow: 'auto',
          flexShrink: 0,
        }}
      >
        {left}
      </Box>

      {/* Divider */}
      <Box
        ref={dividerRef}
        onMouseDown={handleMouseDown}
        sx={{
          width: '4px',
          height: '100%',
          cursor: 'col-resize',
          bgcolor: 'divider',
          flexShrink: 0,
          position: 'relative',
          '&:hover': {
            bgcolor: 'primary.main',
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '-2px',
            right: '-2px',
            bottom: 0,
            cursor: 'col-resize',
          },
        }}
      />

      {/* Right pane */}
      <Box
        sx={{
          width: `${100 - leftWidth}%`,
          height: '100%',
          overflow: 'auto',
          flexShrink: 0,
        }}
      >
        {right}
      </Box>
    </Box>
  );
}




