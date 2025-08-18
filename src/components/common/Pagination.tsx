import React from 'react';
import { Box, TablePagination, useTheme, useMediaQuery } from '@mui/material';

interface PaginationProps {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  rowsPerPageOptions?: number[];
  labelRowsPerPage?: string;
  labelDisplayedRows?: (from: number, to: number, count: number) => string;
}

const Pagination: React.FC<PaginationProps> = ({
  count,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [5, 10, 25, 50],
  labelRowsPerPage = 'Rows per page:',
  labelDisplayedRows = (from, to, count) =>
    `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
        component='div'
        count={count}
        page={page}
        onPageChange={onPageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={onRowsPerPageChange}
        rowsPerPageOptions={isMobile ? [5, 10] : rowsPerPageOptions}
        labelRowsPerPage={labelRowsPerPage}
        labelDisplayedRows={labelDisplayedRows}
        showFirstButton={!isMobile}
        showLastButton={!isMobile}
        size={isMobile ? 'small' : 'medium'}
      />
    </Box>
  );
};

export default Pagination;
