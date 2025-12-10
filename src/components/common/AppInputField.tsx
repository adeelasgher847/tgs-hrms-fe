import React from 'react';
import { TextField, Typography, Box, type TextFieldProps } from '@mui/material';

interface AppInputFieldProps extends Omit<TextFieldProps, 'label'> {
  label: string;
  labelClassName?: string;
  containerSx?: object;
}

const AppInputField = React.forwardRef<HTMLDivElement, AppInputFieldProps>(
  ({ label, labelClassName = 'label', containerSx, sx, ...rest }, ref) => {
    // Check if this is a phone input (has PhoneInput in InputProps)
    const isPhoneInput = rest.InputProps?.startAdornment !== undefined;

    return (
      <Box sx={containerSx}>
        <Typography
          component='label'
          htmlFor={rest.id || (rest.name ? `input-${rest.name}` : undefined)}
          className={labelClassName}
          sx={{
            display: 'block',
            mb: 0.5,
            fontWeight: 700,
            color: 'var(--text-color)',
          }}
        >
          {label}
        </Typography>
        <TextField
          ref={ref}
          {...rest}
          id={rest.id || (rest.name ? `input-${rest.name}` : undefined)}
          variant='outlined'
          InputProps={rest.InputProps}
          sx={{
            position: isPhoneInput ? 'relative' : 'static',
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              height: '44px',
              padding: isPhoneInput ? '0px' : undefined,
              '& fieldset': {
                borderColor: 'var(--light-grey-200-color)',
                borderWidth: '1px',
              },
              '&:hover fieldset': {
                borderColor: 'var(--light-grey-color)',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'var(--primary-dark-color)',
                borderWidth: '2px',
              },
            },
            '& .MuiOutlinedInput-input': {
              color: 'var(--text-color)',
              fontSize: 'var(--body-font-size)',
              display: isPhoneInput ? 'none' : undefined,
              '&::placeholder': {
                color: 'var(--dark-grey-color)',
                opacity: 1,
              },
            },
            '& .MuiInputLabel-root': {
              display: 'none',
            },
            '& .MuiInputAdornment-root': isPhoneInput
              ? {
                  width: '100%',
                  margin: 0,
                }
              : {},
            '& .MuiInputAdornment-positionStart': isPhoneInput
              ? {
                  marginRight: 0,
                }
              : {},
            ...sx,
          }}
        />
      </Box>
    );
  }
);

AppInputField.displayName = 'AppInputField';

export default AppInputField;
