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
    '& .MuiTableCell-root': {
      borderColor: 'divider',
    },
    '& .MuiTableHead-root .MuiTableCell-root': {
      backgroundColor: 'action.hover',
      fontWeight: 700,
    },
  };

  return (
    <TableContainer component={Paper} {...rest} sx={[baseSx, sx]}>
      <Table>{children}</Table>
    </TableContainer>
  );
}

export default AppTable;

