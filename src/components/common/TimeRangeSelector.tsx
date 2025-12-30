import React, { useState, useRef } from 'react';
import { Box, Typography, Paper, ClickAwayListener } from '@mui/material';
import { Icons } from '../../assets/icons';

interface TimeRangeSelectorProps {
  value: string | number | null;
  options: (string | number)[];
  onChange: (value: string | number | null) => void;
  allTimeLabel?: string;
  language?: 'en' | 'ar';
  containerSx?: object;
  minHeight?: number | string;
}

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  value,
  options,
  onChange,
  allTimeLabel = 'All Time',
  language = 'en',
  containerSx,
  minHeight = '48px',
}) => {
  // language parameter is reserved for future use
  void language;
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

  return (
    <ClickAwayListener onClickAway={handleClose}>
      <Box sx={{ position: 'relative', ...containerSx }}>
        {/* Selected Button */}
        <Box
          ref={anchorRef}
          onClick={handleToggle}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            backgroundColor: 'var(--primary-color)',
            borderRadius: '12px',
            px: 2,
            cursor: 'pointer',
            minWidth: '120px',
            minHeight: minHeight,
            height: minHeight,
            transition: 'background-color 0.2s',
            // '&:hover': {
            //   backgroundColor: 'var(--primary-color)',
            // },
          }}
        >
          <Typography
            sx={{
              fontSize: { xs: '12px', lg: 'var(--body-font-size)' },
              fontWeight: 500,
              color: 'var(--primary-dark-color)',
            }}
          >
            {displayValue}
          </Typography>
          <Box
            component='img'
            src={Icons.arrowUp}
            alt=''
            sx={{
              width: 16,
              height: 16,
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              filter:
                'brightness(0) saturate(100%) invert(48%) sepia(95%) saturate(2476%) hue-rotate(195deg) brightness(98%) contrast(101%)',
            }}
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
              backgroundColor: 'var(--primary-color)',
              borderRadius: '12px',
              overflow: 'hidden',
              zIndex: 1000,
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
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
                    ? 'var(--primary-dark-color)'
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
                      ? 'var(--primary-dark-color)'
                      : 'transparent',
                    borderTop:
                      index === 0
                        ? 'none'
                        : '1px solid rgba(48, 131, 220, 0.2)',
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
