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
  /** Optional style overrides */
  buttonSx?: SxProps<Theme>;
  labelSx?: SxProps<Theme>;
  iconSx?: SxProps<Theme>;
  /** Optional container style overrides (matches AppDropdown `containerSx`) */
  containerSx?: SxProps<Theme>;
  /** Control minimum height to match AppDropdown sizing (e.g. '48px' or responsive object) */
  minHeight?: string | number | { [key: string]: string | number };
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
  containerSx,
  minHeight,
}) => {
  // Reserved for future use
  void language;

  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  const defaultContainerSx: SxProps<Theme> = {
    position: 'relative',
    width: { xs: '100%', sm: 'auto' },
  };

  const resolvedContainerSx: SxProps<Theme> = [
    defaultContainerSx,
    ...(Array.isArray(containerSx)
      ? containerSx
      : containerSx
        ? [containerSx]
        : []),
  ];

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

  // Filter for primary-light color icon (image-based icon)
  const iconFilterPrimaryLight =
    'brightness(0) saturate(100%) invert(32%) sepia(98%) saturate(1495%) hue-rotate(190deg) brightness(92%) contrast(92%)';

  const sxArray = (sx?: SxProps<Theme>) =>
    Array.isArray(sx) ? sx : sx ? [sx] : [];

  return (
    <ClickAwayListener onClickAway={handleClose}>
      <Box sx={resolvedContainerSx}>
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
              width: { xs: '100%', sm: 'auto' },
              minWidth: { xs: '100%', sm: '120px' },
              height: minHeight || { xs: '40px', sm: '44px' },
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
            {/* All Time */}
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
              }}
            >
              <Typography
                sx={{
                  fontSize: { xs: '12px', lg: 'var(--body-font-size)' },
                  fontWeight: 500,
                  color:
                    value === 'all-time' || value === null
                      ? 'var(--white-color)'
                      : 'var(--primary-light-color)',
                }}
              >
                {allTimeLabel}
              </Typography>
            </Box>

            {/* Options */}
            {options.map((option, index) => {
              const isSelected = value === option;

              return (
                <Box
                  key={option}
                  onClick={() => handleSelect(option)}
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
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: { xs: '12px', lg: 'var(--body-font-size)' },
                      fontWeight: 500,
                      color: isSelected
                        ? 'var(--white-color)'
                        : 'var(--primary-light-color)',
                    }}
                  >
                    {option.toString()}
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
