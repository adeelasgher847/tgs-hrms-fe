import React from 'react';
import { Search as SearchIcon } from '@mui/icons-material';
import { InputAdornment } from '@mui/material';
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
  return (
    <AppTextField
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      variantType='default'
      InputProps={{
        startAdornment: (
          <InputAdornment position='start'>
            <SearchIcon sx={{ color: '#2C2C2C' }} />
          </InputAdornment>
        ),
      }}
      fullWidth
      sx={[
        {
          width: '100%',
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            minHeight: '48px',
            padding: '0 !important',
            '& fieldset': {
              borderColor: '#BDBDBD',
              borderWidth: '1px',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#BDBDBD',
              borderWidth: '1px',
            },
          },
          '& .MuiInputBase-input': {
            padding: '12px 16px !important',
          },
          '& .MuiInputAdornment-root': {
            marginRight: 0,
          },
        },
        sx,
      ]}
      {...rest}
    />
  );
};

export default AppSearch;
