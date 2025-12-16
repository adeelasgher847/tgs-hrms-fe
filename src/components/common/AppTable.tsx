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
    overflow: 'hidden',
    '& .MuiTableHead-root .MuiTableRow-root': {
      backgroundColor: 'var(--primary-color) !important',
      '& .MuiTableCell-root': {
        borderBottom: 'none',
        padding: '16px',
        fontWeight: 700,
        fontSize: 'var(--subheading2-font-size)',
        lineHeight: 'var(--subheading2-line-height)',
        letterSpacing: 'var(--subheading2-letter-spacing)',
        color: '#2C2C2C',
        backgroundColor: 'var(--primary-color) !important',
      },
    },
    '& .MuiTableBody-root .MuiTableRow-root': {
      backgroundColor: '#FFFFFF',
      '&:hover': {
        backgroundColor: 'rgba(224, 236, 250, 0.3)',
      },
      '& .MuiTableCell-root': {
        borderBottom: '0.5px solid #E0E0E0',
        padding: '16px',
        fontSize: 'var(--body-font-size)',
        lineHeight: 'var(--body-line-height)',
        color: 'var(--text-color)',
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
