import React from 'react';
import {
  TableContainer,
  Table,
  Paper,
  type TableContainerProps,
  type SxProps,
  type Theme,
} from '@mui/material';

interface AppTableProps extends TableContainerProps {
  children: React.ReactNode;
}

export function AppTable({ children, sx, ...rest }: AppTableProps) {
  const baseSx: SxProps<Theme> = {
    border: 'none',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflowX: 'auto',
    overflowY: 'hidden',
    '& .MuiTableHead-root .MuiTableRow-root': {
      backgroundColor: 'var(--primary-color) !important',
      '& .MuiTableCell-root': {
        borderBottom: 'none',
        padding: { xs: '8px 12px', sm: '16px' },
        fontWeight: 700,
        fontSize: { xs: '12px', sm: 'var(--subheading2-font-size)' },
        lineHeight: { xs: '16px', sm: 'var(--subheading2-line-height)' },
        letterSpacing: 'var(--subheading2-letter-spacing)',
        color: '#2C2C2C',
        backgroundColor: 'var(--primary-color) !important',
        whiteSpace: { xs: 'nowrap', sm: 'normal' },
      },
    },
    '& .MuiTableBody-root .MuiTableRow-root': {
      backgroundColor: '#FFFFFF',
      '&:hover': {
        backgroundColor: 'rgba(224, 236, 250, 0.3)',
      },
      '& .MuiTableCell-root': {
        borderBottom: '0.5px solid #E0E0E0',
        padding: { xs: '8px 12px', sm: '16px' },
        fontSize: { xs: '12px', sm: 'var(--body-font-size)' },
        lineHeight: { xs: '16px', sm: 'var(--body-line-height)' },
        color: 'var(--text-color)',
        whiteSpace: { xs: 'nowrap', sm: 'normal' },
      },
    },
  };

  return (
    <TableContainer
      component={Paper}
      {...rest}
      sx={{ ...baseSx, ...(sx as object) }}
    >
      <Table>{children}</Table>
    </TableContainer>
  );
}

export default AppTable;
