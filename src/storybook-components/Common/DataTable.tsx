import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useTheme } from '../theme';

// Mock data for the table
const mockData = [
  {
    id: '1',
    name: 'MacBook Pro 16"',
    description: 'Apple MacBook Pro 16-inch with M2 chip',
    category: 'Laptop',
    status: 'Assigned',
    assignedTo: 'John Doe',
    purchaseDate: '2024-01-15',
  },
  {
    id: '2',
    name: 'Dell Monitor 27"',
    description: 'Dell UltraSharp 27-inch 4K monitor',
    category: 'Monitor',
    status: 'Available',
    assignedTo: null,
    purchaseDate: '2024-01-10',
  },
  {
    id: '3',
    name: 'Logitech MX Master 3',
    description: 'Wireless mouse with advanced features',
    category: 'Accessory',
    status: 'Assigned',
    assignedTo: 'Jane Smith',
    purchaseDate: '2024-01-20',
  },
  {
    id: '4',
    name: 'Standing Desk',
    description: 'Adjustable height standing desk',
    category: 'Furniture',
    status: 'Maintenance',
    assignedTo: null,
    purchaseDate: '2024-01-05',
  },
  {
    id: '5',
    name: 'iPhone 15 Pro',
    description: 'Apple iPhone 15 Pro 256GB',
    category: 'Phone',
    status: 'Assigned',
    assignedTo: 'Mike Johnson',
    purchaseDate: '2024-01-25',
  },
];

interface DataTableProps {
  data?: typeof mockData;
  loading?: boolean;
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  onView?: (item: any) => void;
}

const DataTable: React.FC<DataTableProps> = ({
  data = mockData,
  loading = false,
  onEdit,
  onDelete,
  onView,
}) => {
  const { theme } = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, itemId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedItemId(itemId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItemId(null);
  };

  const handleEdit = () => {
    const item = data.find(d => d.id === selectedItemId);
    if (item) {
      console.log('Edit item:', item);
      onEdit?.(item);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    const item = data.find(d => d.id === selectedItemId);
    if (item) {
      console.log('Delete item:', item);
      onDelete?.(item);
    }
    handleMenuClose();
  };

  const handleView = () => {
    const item = data.find(d => d.id === selectedItemId);
    if (item) {
      console.log('View item:', item);
      onView?.(item);
    }
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Assigned':
        return 'success';
      case 'Available':
        return 'info';
      case 'Maintenance':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography>Loading...</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', fontFamily: 'var(--font-family-primary)' }}>
                Asset Name
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontFamily: 'var(--font-family-primary)' }}>
                Category
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontFamily: 'var(--font-family-primary)' }}>
                Status
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontFamily: 'var(--font-family-primary)' }}>
                Assigned To
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontFamily: 'var(--font-family-primary)' }}>
                Purchase Date
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', fontFamily: 'var(--font-family-primary)' }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="var(--text-secondary)">
                    No data found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Box>
                      <Typography 
                        variant="body2" 
                        fontWeight={500}
                        fontFamily="var(--font-family-primary)"
                        color="var(--text-primary)"
                      >
                        {item.name}
                      </Typography>
                      {item.description && (
                        <Typography 
                          variant="caption" 
                          color="var(--text-secondary)"
                          fontFamily="var(--font-family-primary)"
                        >
                          {item.description}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2"
                      fontFamily="var(--font-family-primary)"
                      color="var(--text-primary)"
                    >
                      {item.category}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.status}
                      color={getStatusColor(item.status) as any}
                      size="small"
                      sx={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--font-size-xs)',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    {item.assignedTo ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon fontSize="small" sx={{ color: 'var(--text-secondary)' }} />
                        <Typography 
                          variant="body2"
                          fontFamily="var(--font-family-primary)"
                          color="var(--text-primary)"
                        >
                          {item.assignedTo}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography 
                        variant="body2" 
                        color="var(--text-secondary)"
                        fontFamily="var(--font-family-primary)"
                      >
                        Unassigned
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2"
                      fontFamily="var(--font-family-primary)"
                      color="var(--text-primary)"
                    >
                      {new Date(item.purchaseDate).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={(e) => handleMenuClick(e, item.id)}
                      size="small"
                      sx={{
                        color: 'var(--text-secondary)',
                        '&:hover': {
                          backgroundColor: 'var(--bg-hover)',
                        },
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                    <Menu
                      anchorEl={anchorEl}
                      open={Boolean(anchorEl) && selectedItemId === item.id}
                      onClose={handleMenuClose}
                      sx={{
                        '& .MuiPaper-root': {
                          backgroundColor: 'var(--bg-card)',
                          border: '1px solid var(--border-primary)',
                        },
                      }}
                    >
                      <MenuItem 
                        onClick={handleView}
                        sx={{
                          fontFamily: 'var(--font-family-primary)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        View Details
                      </MenuItem>
                      <MenuItem 
                        onClick={handleEdit}
                        sx={{
                          fontFamily: 'var(--font-family-primary)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        Edit
                      </MenuItem>
                      <MenuItem 
                        onClick={handleDelete}
                        sx={{
                          fontFamily: 'var(--font-family-primary)',
                          color: 'var(--chart-color-6)',
                        }}
                      >
                        Delete
                      </MenuItem>
                    </Menu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default DataTable;
