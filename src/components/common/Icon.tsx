import React from 'react';
import { Box, type SxProps, type Theme } from '@mui/material';
import { getIcon, type IconName } from '../../assets/icons';

export interface IconProps {
  name: IconName;
  size?: number | string;
  alt?: string;
  sx?: SxProps<Theme>;
}

/**
 * Renders an app icon from `src/assets/icons.ts` by name.
 * Uses an <img> so it works for SVG/PNG assets exposed by Vite.
 */
export default function Icon({ name, size = 18, alt = '', sx }: IconProps) {
  return (
    <Box
      component='img'
      src={getIcon(name)}
      alt={alt}
      sx={{
        width: size,
        height: size,
        display: 'inline-block',
        flexShrink: 0,
        ...sx,
      }}
    />
  );
}


