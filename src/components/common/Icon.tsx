import React from 'react';
import { Box, type SxProps, type Theme } from '@mui/material';
import { getIcon, type IconName } from '../../assets/icons';

export interface IconProps {
  name: IconName;
  size?: number | string;
  alt?: string;
  /**
   * Optional tint color (works best for SVG icons).
   * When provided and the icon is an SVG, the icon is rendered using CSS mask so it can be tinted.
   */
  color?: string;
  sx?: SxProps<Theme>;
}

/**
 * Renders an app icon from `src/assets/icons.ts` by name.
 * Uses an <img> so it works for SVG/PNG assets exposed by Vite.
 */
export default function Icon({
  name,
  size = 18,
  alt = '',
  color,
  sx,
}: IconProps) {
  const src = getIcon(name);
  const isSvg = typeof src === 'string' && src.toLowerCase().endsWith('.svg');

  // If caller provided a color and the icon is an SVG, render with a mask so we can tint it.
  if (color && isSvg) {
    return (
      <Box
        aria-label={alt || name}
        role={alt ? 'img' : undefined}
        sx={{
          width: size,
          height: size,
          display: 'inline-block',
          flexShrink: 0,
          backgroundColor: color,
          WebkitMask: `url(${src}) no-repeat center / contain`,
          mask: `url(${src}) no-repeat center / contain`,
          ...sx,
        }}
      />
    );
  }

  return (
    <Box
      component='img'
      src={src}
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


