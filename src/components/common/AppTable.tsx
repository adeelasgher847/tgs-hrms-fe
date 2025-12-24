import React from 'react';
import {
  TableContainer,
  Table,
  Paper,
  useTheme,
  type TableContainerProps,
  type SxProps,
  type Theme,
} from '@mui/material';

interface AppTableProps extends TableContainerProps {
  children: React.ReactNode;
}

export function AppTable({ children, sx, ...rest }: AppTableProps) {
  const theme = useTheme();

  const baseSx: SxProps<Theme> = {
    border: 'none',
    borderRadius: '12px',
    boxShadow:
      theme.palette.mode === 'dark'
        ? '0 1px 3px rgba(0,0,0,0.3)'
        : '0 1px 3px rgba(0,0,0,0.1)',
    overflowX: 'auto',
    overflowY: 'hidden',
    backgroundColor: theme.palette.background.paper,
    '& .MuiTableHead-root .MuiTableRow-root': {
      backgroundColor:
        theme.palette.mode === 'dark'
          ? 'var(--primary-light-color)'
          : 'var(--primary-color)',
      '& .MuiTableCell-root': {
        borderBottom: 'none',
        padding: { xs: '8px 12px', sm: '16px' },
        fontWeight: 700,
        fontSize: { xs: '12px', sm: '18px' },
        lineHeight: { xs: '16px', sm: 'var(--subheading2-line-height)' },
        letterSpacing: 'var(--subheading2-letter-spacing)',
        color:
          theme.palette.mode === 'dark'
            ? '#ffffff'
            : '#2C2C2C',
        backgroundColor:
          theme.palette.mode === 'dark'
            ? 'var(--primary-light-color)'
            : 'var(--primary-color)',
        whiteSpace: { xs: 'nowrap', sm: 'normal' },
      },
    },
    '& .MuiTableBody-root .MuiTableRow-root': {
      backgroundColor: theme.palette.background.paper,
      // '&:hover': {
      //   backgroundColor:
      //     theme.palette.mode === 'dark'
      //       ? theme.palette.action.hover
      //       : 'rgba(224, 236, 250, 0.3)',
      // },
      '& .MuiTableCell-root': {
        borderBottom: `0.5px solid ${theme.palette.divider}`,
        padding: { xs: '8px 12px', sm: '16px' },
        fontSize: { xs: '12px', sm: 'var(--body-font-size)' },
        lineHeight: { xs: '16px', sm: 'var(--body-line-height)' },
        color: theme.palette.text.primary,
        whiteSpace: { xs: 'nowrap', sm: 'normal' },
        backgroundColor: theme.palette.background.paper,
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
