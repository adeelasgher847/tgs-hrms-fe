import React from 'react';
import {
  TextField,
  Pagination,
  TablePagination,
  Box,
  Typography,
  useMediaQuery,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';

export interface DateSelectionProps {
  value: string;
  onChange: (date: string) => void;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  responsive?: boolean;
  size?: 'small' | 'medium';
}

export interface PaginationProps {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  rowsPerPageOptions?: number[];
  labelRowsPerPage?: string;
  labelDisplayedRows?: (from: number, to: number, count: number) => string;
  responsive?: boolean;
  variant?: 'pagination' | 'table-pagination';
  color?: 'primary' | 'secondary' | 'standard';
  disabled?: boolean;
}

const DateSelectionComponent: React.FC<DateSelectionProps> = ({
  value,
  onChange,
  label = 'Select Date',
  disabled = false,
  required = false,
  error = false,
  helperText,
  responsive = false,
  size = 'medium',
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  const getResponsiveSize = () => {
    if (size) return size;
    if (responsive) {
      return isMobile ? 'small' : 'medium';
    }
    return 'medium';
  };

  return (
    <TextField
      type="date"
      label={label}
      value={value}
      onChange={handleChange}
      disabled={disabled}
      required={required}
      error={error}
      helperText={helperText}
      size={getResponsiveSize()}
      InputLabelProps={{
        shrink: true,
      }}
      sx={responsive ? {
        '& .MuiOutlinedInput-root': {
          fontSize: { xs: '0.875rem', sm: '1rem' },
        },
        '& .MuiInputLabel-root': {
          fontSize: { xs: '0.875rem', sm: '1rem' },
        },
        '& .MuiFormHelperText-root': {
          fontSize: { xs: '0.75rem', sm: '0.875rem' },
        },
      } : undefined}
    />
  );
};

const PaginationComponent: React.FC<PaginationProps> = ({
  count,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [5, 10, 25, 50],
  labelRowsPerPage = 'Rows per page:',
  labelDisplayedRows = (from, to, count) =>
    `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`,
  responsive = false,
  variant = 'pagination',
  color = 'primary',
  disabled = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const getResponsiveRowsPerPageOptions = () => {
    if (responsive) {
      return isMobile ? [5, 10] : rowsPerPageOptions;
    }
    return rowsPerPageOptions;
  };

  const getResponsiveSize = () => {
    if (responsive) {
      return isMobile ? 'small' : 'medium';
    }
    return 'medium';
  };

  if (variant === 'table-pagination') {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          mt: 2,
          '& .MuiTablePagination-root': {
            color: theme.palette.text.primary,
          },
          '& .MuiTablePagination-select': {
            color: theme.palette.text.primary,
          },
          '& .MuiTablePagination-selectIcon': {
            color: theme.palette.text.primary,
          },
          '& .MuiIconButton-root': {
            color: theme.palette.text.primary,
          },
          '& .MuiIconButton-root.Mui-disabled': {
            color: theme.palette.text.disabled,
          },
        }}
      >
        <TablePagination
          component="div"
          count={count}
          page={page}
          onPageChange={onPageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={onRowsPerPageChange}
          rowsPerPageOptions={getResponsiveRowsPerPageOptions()}
          labelRowsPerPage={labelRowsPerPage}
          labelDisplayedRows={paginationInfo =>
            labelDisplayedRows(
              paginationInfo.from,
              paginationInfo.to,
              paginationInfo.count
            )
          }
          showFirstButton={responsive ? !isMobile : true}
          showLastButton={responsive ? !isMobile : true}
          size={getResponsiveSize()}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
      <Pagination
        count={Math.ceil(count / rowsPerPage)}
        page={page + 1}
        onChange={(event, newPage) => onPageChange(event, newPage - 1)}
        color={color}
        disabled={disabled}
        size={getResponsiveSize()}
        showFirstButton={responsive ? !isMobile : true}
        showLastButton={responsive ? !isMobile : true}
        siblingCount={responsive ? (isMobile ? 0 : 1) : 1}
        boundaryCount={responsive ? (isMobile ? 1 : 1) : 1}
      />
    </Box>
  );
};

export { DateSelectionComponent, PaginationComponent };
