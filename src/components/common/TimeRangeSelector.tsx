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
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 'var(--border-radius-lg)',
              px: 2,
              py: 1,
              cursor: 'pointer',
              minWidth: '120px',
              transition: 'background-color 0.2s',
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
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
                color: theme.palette.text.primary,
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
                transform: open ? 'rotate(0deg)' : 'rotate(180deg)',
                transition: 'transform 0.2s',
                filter:
                  theme.palette.mode === 'dark'
                    ? 'brightness(0) saturate(100%) invert(56%)'
                    : 'brightness(0) saturate(100%) invert(48%) sepia(95%) saturate(2476%) hue-rotate(195deg) brightness(98%) contrast(101%)',
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
              minWidth: '120px',
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
                        : 'var(--primary-dark-color)',
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
                      fontSize: 'var(--body-font-size)',
                      fontWeight: 500,
                      color: isSelected
                        ? 'var(--white-color)'
                        : theme.palette.mode === 'dark'
                          ? 'var(--primary-light-color)'
                          : 'var(--primary-dark-color)',
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
