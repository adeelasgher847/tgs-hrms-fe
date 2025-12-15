import React from 'react';
import {
  TextField,
  Typography,
  Box,
  FormHelperText,
  type TextFieldProps,
} from '@mui/material';

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
            fontSize: { xs: '10px', sm: '14px', lg: '20px' },
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
            border: {
              xs: `0.5px solid ${rest.error ? '#d32f2f' : '#BDBDBD'}`,
              sm: `1px solid ${rest.error ? '#d32f2f' : '#BDBDBD'}`,
            },
            backgroundColor: { xs: '#EFEFEF', sm: '#FFFFFF' },
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
            helperText={undefined}
            sx={{
              position: isPhoneInput ? 'relative' : 'static',
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                height: rest.multiline ? 'auto' : { xs: 40, sm: 44 },
                minHeight: rest.multiline ? 'auto' : { xs: 40, sm: 44 },
                padding: isPhoneInput ? '0px' : undefined,
                backgroundColor: 'transparent',
                '& fieldset': {
                  border: 'none',
                  display: 'none',
                },
              },
              '& .MuiOutlinedInput-input': {
                color: 'var(--text-color)',
                fontSize: { xs: '12px', sm: 'var(--body-font-size)' },
                display: isPhoneInput ? 'none' : undefined,
                padding: rest.multiline
                  ? undefined
                  : { xs: '8px 12px', sm: '10px 16px' },
                '&::placeholder': {
                  color: '#A3A3A3',
                  opacity: 1,
                },
              },
              '& .MuiOutlinedInput-input:-webkit-autofill': {
                padding: rest.multiline ? undefined : '10px 16px !important',
                WebkitBoxShadow: '0 0 0 1000px #EFEFEF inset',
                WebkitTextFillColor: 'var(--text-color)',
              },
              '& .MuiInputLabel-root': {
                display: 'none',
              },
              '& .MuiFormHelperText-root': {
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
        {rest.helperText && (
          <FormHelperText
            error={rest.error}
            sx={{
              margin: '4px 0 0 0',
              fontSize: { xs: '10px', sm: 'var(--label-font-size)' },
              lineHeight: 'var(--label-line-height)',
              color: rest.error ? '#d32f2f' : 'rgba(0, 0, 0, 0.6)',
            }}
          >
            {rest.helperText}
          </FormHelperText>
        )}
      </Box>
    );
  }
);

AppInputField.displayName = 'AppInputField';

export default AppInputField;
