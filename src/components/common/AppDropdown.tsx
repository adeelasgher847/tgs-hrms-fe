import React, { useState } from 'react';
import {
  FormControl,
  Select,
  MenuItem,
  Typography,
  Box,
  useTheme,
  type SelectProps,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { Icons } from '../../assets/icons';

interface AppDropdownOption {
  value: string | number;
  label: string;
}

interface AppDropdownProps
  extends Omit<
    SelectProps<string | number>,
    'label' | 'onChange' | 'variant' | 'open' | 'onOpen' | 'onClose'
  > {
  label: string;
  options: AppDropdownOption[];
  value: string | number;
  onChange: (event: SelectChangeEvent<string | number>) => void;
  labelClassName?: string;
  containerSx?: object;
  placeholder?: string;
  error?: boolean;
  helperText?: string;
  inputBackgroundColor?: string;
  showLabel?: boolean;
}

const ArrowIcon = ({ open }: { open: boolean }) => {
  const theme = useTheme();

  return (
    <Box
      component='img'
      src={Icons.arrowUp}
      alt=''
      sx={{
        width: { xs: 14, sm: 16 },
        height: { xs: 14, sm: 16 },
        pointerEvents: 'none',
        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.2s ease-in-out',
        marginRight: { xs: '12px', sm: '16px' },
        filter:
          theme.palette.mode === 'dark'
            ? 'brightness(0) saturate(100%) invert(56%)'
            : 'none',
      }}
    />
  );
};

const AppDropdown = React.forwardRef<HTMLDivElement, AppDropdownProps>(
  (
    {
      label,
      options,
      value,
      onChange,
      labelClassName = 'subheading2',
      containerSx,
      placeholder = 'Select...',
      error = false,
      helperText,
      inputBackgroundColor,
      showLabel = true,
      sx,
      ...rest
    },
    ref
  ) => {
    const theme = useTheme();
    const [open, setOpen] = useState(false);

    return (
      <Box
        sx={{
          ...containerSx,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {showLabel && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <Typography
              component='label'
              htmlFor={
                rest.id || (rest.name ? `dropdown-${rest.name}` : undefined)
              }
              className={labelClassName}
              sx={{
                fontWeight: 500,
                fontSize: 'var(--subheading3-font-size)',
                lineHeight: 'var(--subheading2-line-height)',
                letterSpacing: 'var(--subheading2-letter-spacing)',
                color: 'text.primary',
              }}
            >
              {label}
            </Typography>

            {error && helperText && (
              <Typography
                sx={{
                  fontSize: 'var(--label-font-size)',
                  lineHeight: 'var(--label-line-height)',
                  color: theme.palette.error.main,
                  fontWeight: 400,
                  textAlign: 'right',
                  ml: 2,
                }}
              >
                {helperText}
              </Typography>
            )}
          </Box>
        )}

        <FormControl
          ref={ref}
          fullWidth
          error={error}
          sx={[
            {
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'transparent',
                borderRadius: '12px',
                minHeight: { xs: '40px', sm: '44px' },

                '& fieldset': {
                  borderColor: error
                    ? theme.palette.error.main
                    : theme.palette.divider,
                },

                '&:hover fieldset': {
                  borderColor: error
                    ? theme.palette.error.main
                    : theme.palette.divider,
                },

                '&.Mui-focused fieldset': {
                  borderColor: error
                    ? theme.palette.error.main
                    : theme.palette.primary.main,
                },
              },
              '& .MuiInputBase-input': {
                backgroundColor: 'transparent !important',
              },

              '& .MuiSelect-select': {
                backgroundColor: 'transparent !important',
                color: theme.palette.text.primary,
                fontSize: 'var(--label-font-size)',
                lineHeight: 'var(--label-line-height)',
                letterSpacing: 'var(--label-letter-spacing)',
                padding: { xs: '8px 12px', sm: '10px 16px' },
                paddingRight: { xs: '36px', sm: '40px' },
                display: 'flex',
                alignItems: 'center',
              },
              '& .MuiSelect-icon': {
                color: theme.palette.text.secondary,
                right: { xs: '12px', sm: '16px' },
              },
            },
            ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
          ]}
        >
          <Select
            {...rest}
            variant='outlined'
            value={value === 'all' ? '' : value}
            onChange={onChange}
            displayEmpty
            open={open}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            IconComponent={() => <ArrowIcon open={open} />}
            renderValue={selected => {
              if (!selected) {
                const allOption = options.find(opt => opt.value === 'all');
                return (
                  <Typography color='text.secondary'>
                    {allOption?.label || placeholder}
                  </Typography>
                );
              }

              const selectedOption = options.find(
                opt => opt.value === selected
              );

              return (
                <Typography color='text.primary'>
                  {selectedOption?.label}
                </Typography>
              );
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  borderRadius: '12px',
                  mt: 1,
                  // backgroundColor: theme.palette.background.paper,

                  '& .MuiMenuItem-root': {
                    fontSize: 'var(--label-font-size)',
                    minHeight: { xs: 40, sm: 44 },
                    color: theme.palette.text.primary,
                  },
                },
              },
            }}
          >
            {options.map(option => (
              <MenuItem
                key={option.value}
                value={option.value === 'all' ? '' : option.value}
              >
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    );
  }
);

AppDropdown.displayName = 'AppDropdown';

export default AppDropdown;
