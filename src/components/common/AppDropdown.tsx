import React, { useState } from 'react';
import {
  FormControl,
  Select,
  MenuItem,
  Typography,
  Box,
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
}

const ArrowIcon = ({ open }: { open: boolean }) => (
  <Box
    component='img'
    src={Icons.arrowUp}
    alt=''
    sx={{
      width: '16px',
      height: '16px',
      pointerEvents: 'none',
      transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
      transition: 'transform 0.2s ease-in-out',
      marginRight: '16px',
    }}
  />
);

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
      sx,
      ...rest
    },
    ref
  ) => {
    const [open, setOpen] = useState(false);

    return (
      <Box sx={containerSx}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 0.5,
          }}
        >
          <Typography
            component='label'
            htmlFor={rest.id || (rest.name ? `dropdown-${rest.name}` : undefined)}
            className={labelClassName}
            sx={{
              fontWeight: 500,
              fontSize: 'var(--subheading2-font-size)',
              lineHeight: 'var(--subheading2-line-height)',
              letterSpacing: 'var(--subheading2-letter-spacing)',
              color: '#2C2C2C',
            }}
          >
            {label}
          </Typography>
          {error && helperText && (
            <Typography
              sx={{
                fontSize: { xs: '12px', sm: '14px' },
                lineHeight: 'var(--label-line-height)',
                color: '#d32f2f',
                fontWeight: 400,
                textAlign: 'right',
                ml: 2,
              }}
            >
              {helperText}
            </Typography>
          )}
        </Box>
        <FormControl
          ref={ref}
          fullWidth
          error={error}
          sx={{
            width: '100%',
            '& .MuiOutlinedInput-root': {
              backgroundColor: inputBackgroundColor || '#FFFFFF',
              borderRadius: '12px',
              minHeight: '48px',
              width: '100%',
              padding: '0 !important',
              '& fieldset': {
                borderColor: error ? '#d32f2f' : '#BDBDBD',
                borderWidth: '1px',
              },
              // '&:hover fieldset': {
              //   borderColor: error ? '#d32f2f' : '#BDBDBD',
              // },
              '&.Mui-focused fieldset': {
                borderColor: error ? '#d32f2f' : '#BDBDBD',
                borderWidth: '1px',
              },
            },
            '& .MuiInputBase-input': {
              padding: '12px 16px !important',
            },
            '& .MuiSelect-select': {
              color: '#2C2C2C',
              fontSize: 'var(--label-font-size)',
              lineHeight: 'var(--label-line-height)',
              letterSpacing: 'var(--label-letter-spacing)',
              fontWeight: 400,
              padding: '12px 16px !important',
              paddingRight: '40px !important',
              display: 'flex',
              alignItems: 'center',
            },
            '& .MuiSelect-icon': {
              color: '#2C2C2C',
              right: '16px',
            },
            ...sx,
          }}
        >
          <Select
            {...rest}
            variant='outlined'
            id={rest.id || (rest.name ? `dropdown-${rest.name}` : undefined)}
            value={value === 'all' ? '' : value}
            onChange={onChange}
            displayEmpty
            open={open}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            IconComponent={() => <ArrowIcon open={open} />}
            renderValue={selected => {
              if (!selected || selected === '') {
                const allOption = options.find(opt => opt.value === 'all');
                return allOption ? allOption.label : placeholder || '';
              }
              const selectedOption = options.find(
                opt => opt.value === selected
              );
              return selectedOption ? selectedOption.label : '';
            }}
            sx={{
              '& .MuiOutlinedInput-notchedOutline': {
                border: error ? '1px solid #d32f2f' : '1px solid #BDBDBD',
              },
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  borderRadius: '12px',
                  mt: 1,
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  '& .MuiMenuItem-root': {
                    fontSize: 'var(--label-font-size)',
                    lineHeight: 'var(--label-line-height)',
                    letterSpacing: 'var(--label-letter-spacing)',
                    color: '#2C2C2C',
                    // '&:hover': {
                    //   backgroundColor: 'var(--primary-color)',
                    // },
                    '&.Mui-selected': {
                      backgroundColor: 'var(--primary-dark-color)',
                      color: '#FFFFFF',
                      // '&:hover': {
                      //   backgroundColor: 'var(--primary-dark-color)',
                      // },
                    },
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
