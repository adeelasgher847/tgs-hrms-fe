import React from 'react';
import { Search as SearchIcon } from '@mui/icons-material';
import { InputAdornment, useTheme } from '@mui/material';
import AppTextField from './AppTextField';
import type { TextFieldProps } from '@mui/material';

interface AppSearchProps extends Omit<TextFieldProps, 'onChange'> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

const AppSearch: React.FC<AppSearchProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  sx,
  ...rest
}) => {
  const theme = useTheme();
  return (
    <AppTextField
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      variantType='default'
      InputProps={{
        startAdornment: (
          <InputAdornment position='start'>
            <SearchIcon sx={{ color: theme.palette.text.secondary }} />
          </InputAdornment>
        ),
      }}
      fullWidth
      sx={[
        {
          width: '100%',
          '& .MuiOutlinedInput-root': {
            backgroundColor: theme.palette.background.paper,
            borderRadius: '12px',
            minHeight: '48px',
            padding: '0 !important',
            marginLeft: '4px !important',
            '& fieldset': {
              borderColor: theme.palette.divider,
              borderWidth: '1px',
              marginLeft: '-8px !important',
            },
            '&.Mui-focused fieldset': {
              borderColor: theme.palette.primary.main,
              borderWidth: '1px',
            },
          },
          '& .MuiOutlinedInput-input': {
            color: theme.palette.text.primary,
            '&::placeholder': {
              color: theme.palette.text.secondary,
              opacity: 1,
            },
          },
          '& .MuiInputBase-input': {
            padding: '12px 16px !important',
          },
          '& .MuiInputAdornment-root': {
            marginRight: 0,
          },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...rest}
    />
  );
};

export default AppSearch;
