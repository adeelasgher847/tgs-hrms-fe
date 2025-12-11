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
            fontWeight: 500,
            fontSize: 'var(--subheading2-font-size)',
            lineHeight: 'var(--subheading2-line-height)',
            letterSpacing: 'var(--subheading2-letter-spacing)',
            color: '#2C2C2C',
          }}
        >
          {label}
        </Typography>
        <Box
          sx={{
            position: 'relative',
            borderRadius: '12px',
            border: `1px solid ${rest.error ? '#d32f2f' : '#BDBDBD'}`,
            backgroundColor: '#FFFFFF',
            overflow: 'visible',
          }}
        >
          <TextField
            ref={ref}
            {...rest}
            fullWidth
            id={rest.id || (rest.name ? `input-${rest.name}` : undefined)}
            variant='outlined'
            InputProps={rest.InputProps}
            sx={{
              position: isPhoneInput ? 'relative' : 'static',
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                height: rest.multiline ? 'auto' : '44px',
                minHeight: rest.multiline ? 'auto' : '44px',
                padding: isPhoneInput ? '0px' : undefined,
                backgroundColor: 'transparent',
                '& fieldset': {
                  border: 'none',
                  display: 'none',
                },
              },
              '& .MuiOutlinedInput-input': {
                color: 'var(--text-color)',
                fontSize: 'var(--body-font-size)',
                display: isPhoneInput ? 'none' : undefined,
                padding: rest.multiline ? undefined : '10px 16px',
                '&::placeholder': {
                  color: 'var(--dark-grey-color)',
                  opacity: 1,
                },
              },
              '& .MuiOutlinedInput-input:-webkit-autofill': {
                padding: rest.multiline ? undefined : '10px 16px !important',
                WebkitBoxShadow: '0 0 0 1000px #FFFFFF inset',
                WebkitTextFillColor: 'var(--text-color)',
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
      </Box>
    );
  }
);

AppInputField.displayName = 'AppInputField';

export default AppInputField;
