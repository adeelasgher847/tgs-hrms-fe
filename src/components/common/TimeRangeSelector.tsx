import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  ClickAwayListener,
  useTheme,
  type SxProps,
  type Theme,
} from '@mui/material';
import { Icons } from '../../assets/icons';

interface TimeRangeSelectorProps {
  value: string | number | null;
  options: (string | number)[];
  onChange: (value: string | number | null) => void;
  allTimeLabel?: string;
  language?: 'en' | 'ar';
  /** Optional style overrides to match legacy/original designs in specific charts */
  buttonSx?: SxProps<Theme>;
  labelSx?: SxProps<Theme>;
  iconSx?: SxProps<Theme>;
}

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  value,
  options,
  onChange,
  allTimeLabel = 'All Time',
  language = 'en',
  buttonSx,
  labelSx,
  iconSx,
}) => {
  // language parameter is reserved for future use
  void language;
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    setOpen(prev => !prev);
  };

  const handleClose = (event: Event | React.SyntheticEvent) => {
    if (
      anchorRef.current &&
      anchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }
    setOpen(false);
  };

  const handleSelect = (option: string | number) => {
    onChange(option);
    setOpen(false);
  };

  const displayValue =
    value === 'all-time' || value === null ? allTimeLabel : value.toString();

  // CSS filter for #2462A5 (var(--primary-light-color)) to tint image icons in light mode.
  // We keep filter approach because `Icons.arrowUp` is an image, not an SVG we can recolor directly.
  const iconFilterPrimaryLight =
    'brightness(0) saturate(100%) invert(32%) sepia(98%) saturate(1495%) hue-rotate(190deg) brightness(92%) contrast(92%)';

  const sxArray = (sx?: SxProps<Theme>) =>
    Array.isArray(sx) ? sx : sx ? [sx] : [];

  return (
    <ClickAwayListener onClickAway={handleClose}>
      <Box sx={{ position: 'relative' }}>
        {/* Selected Button */}
        <Box
          ref={anchorRef}
          onClick={handleToggle}
          sx={[
            {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              // Figma (light): bg #E0ECFA (var(--primary-color)), text/icon #2462A5 (var(--primary-light-color))
              backgroundColor:
                theme.palette.mode === 'dark'
                  ? theme.palette.action.hover
                  : 'var(--primary-color)',
              border:
                theme.palette.mode === 'dark'
                  ? `1px solid ${theme.palette.divider}`
                  : 'none',
              borderRadius: '8px',
              px: { xs: 1.5, sm: 2 },
              py: 1,
              cursor: 'pointer',
              // On small screens, this control should be able to stretch to full width.
              width: { xs: '100%', sm: 'auto' },
              minWidth: { xs: '100%', sm: '120px' },
              height: '36px',
              transition: 'background-color 0.2s',
              '&:hover': {
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? theme.palette.action.hover
                    : 'var(--primary-color)',
                opacity: theme.palette.mode === 'dark' ? 1 : 0.95,
              },
            },
            ...sxArray(buttonSx),
          ]}
        >
          <Typography
            sx={[
              {
                fontSize: { xs: '12px', lg: 'var(--body-font-size)' },
                fontWeight: 500,
                color:
                  theme.palette.mode === 'dark'
                    ? theme.palette.text.primary
                    : 'var(--primary-light-color)',
              },
              ...sxArray(labelSx),
            ]}
          >
            {displayValue}
          </Typography>
          <Box
            component='img'
            src={Icons.arrowUp}
            alt=''
            sx={[
              {
                width: 16,
                height: 16,
                // Show "down" chevron when closed (matches original UI); rotate up when open
                transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
                filter:
                  theme.palette.mode === 'dark'
                    ? 'brightness(0) saturate(100%) invert(56%)'
                    : iconFilterPrimaryLight,
              },
              ...sxArray(iconSx),
            ]}
          />
        </Box>

        {/* Dropdown Menu */}
        {open && (
          <Paper
            elevation={4}
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              mt: 1,
              // Match button width (important on small screens)
              width: '100%',
              minWidth: { xs: '100%', sm: '120px' },
              backgroundColor: theme.palette.background.paper,
              borderRadius: 'var(--border-radius-lg)',
              overflow: 'hidden',
              zIndex: 1000,
              boxShadow:
                theme.palette.mode === 'dark'
                  ? '0 4px 6px rgba(0, 0, 0, 0.3)'
                  : '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* All Time Option */}
            <Box
              onClick={() => handleSelect('all-time')}
              sx={{
                px: 2,
                py: 1.5,
                cursor: 'pointer',
                backgroundColor:
                  value === 'all-time' || value === null
                    ? theme.palette.mode === 'dark'
                      ? 'var(--primary-light-color)'
                      : 'var(--primary-dark-color)'
                    : 'transparent',
                // '&:hover': {
                //   backgroundColor:
                //     value === 'all-time' || value === null
                //       ? 'var(--primary-dark-color)'
                //       : 'rgba(48, 131, 220, 0.1)',
                // },
              }}
            >
              <Typography
                sx={{
                  fontSize: { xs: '12px', lg: 'var(--body-font-size)' },
                  fontWeight: 500,
                  color:
                    value === 'all-time' || value === null
                      ? 'var(--white-color)'
                      : theme.palette.mode === 'dark'
                        ? 'var(--primary-light-color)'
                        : 'var(--primary-light-color)',
                }}
              >
                {allTimeLabel}
              </Typography>
            </Box>

            {/* Year Options */}
            {options.map((option, index) => {
              const optionValue = typeof option === 'number' ? option : option;
              const isSelected = value === optionValue;

              return (
                <Box
                  key={optionValue}
                  onClick={() => handleSelect(optionValue)}
                  sx={{
                    px: 2,
                    py: 1.5,
                    cursor: 'pointer',
                    backgroundColor: isSelected
                      ? theme.palette.mode === 'dark'
                        ? 'var(--primary-light-color)'
                        : 'var(--primary-dark-color)'
                      : 'transparent',
                    borderTop:
                      index === 0
                        ? 'none'
                        : `1px solid ${theme.palette.divider}`,
                    // '&:hover': {
                    //   backgroundColor: isSelected
                    //     ? 'var(--primary-dark-color)'
                    //     : 'rgba(48, 131, 220, 0.1)',
                    // },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: { xs: '12px', lg: 'var(--body-font-size)' },
                      fontWeight: 500,
                      color: isSelected
                        ? 'var(--white-color)'
                        : theme.palette.mode === 'dark'
                          ? 'var(--primary-light-color)'
                          : 'var(--primary-light-color)',
                    }}
                  >
                    {optionValue.toString()}
                  </Typography>
                </Box>
              );
            })}
          </Paper>
        )}
      </Box>
    </ClickAwayListener>
  );
};

export default TimeRangeSelector;
