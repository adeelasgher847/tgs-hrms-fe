import React from 'react';
import {
  TextField,
  type TextFieldProps,
  type SxProps,
  type Theme,
} from '@mui/material';

type AppTextFieldVariant = 'auth' | 'default';

type AppTextFieldProps = TextFieldProps & {
  variantType?: AppTextFieldVariant;
};

const variantStyles: Record<AppTextFieldVariant, SxProps<Theme>> = {
  auth: {
    '& .MuiOutlinedInput-root': {
      backgroundColor: 'background.paper',
      borderRadius: 1,
      '& fieldset': {
        borderColor: 'divider',
      },
      // '&:hover fieldset': {
      //   borderColor: 'primary.main',
      // },
      '&.Mui-focused fieldset': {
        borderColor: 'primary.main',
      },
    },
    '& .MuiInputLabel-root': {
      color: 'text.secondary',
    },
  },
  default: {},
};

export const AppTextField = React.forwardRef<HTMLDivElement, AppTextFieldProps>(
  ({ variantType = 'default', sx, ...rest }, ref) => {
    const baseSx = variantStyles[variantType] || {};
    const mergedSx = Array.isArray(sx)
      ? ([baseSx, ...sx] as SxProps<Theme>)
      : ([baseSx, sx] as SxProps<Theme>);

    return <TextField ref={ref} {...rest} sx={mergedSx} />;
  }
);

AppTextField.displayName = 'AppTextField';

export default AppTextField;
