import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tooltip,
  IconButton,
  Chip,
  Dialog,
  Button,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import employeeBenefitApi from '../../api/employeeBenefitApi';
import { useUser } from '../../hooks/useUser';
import BenefitCard from '../Benefits/BenefitCard';

const BenefitDetails: React.FC = () => {
  const [benefits, setBenefits] = useState<any[]>([]);
  const [selectedBenefit, setSelectedBenefit] = useState<any | null>(null);
  const { user } = useUser();

  useEffect(() => {
    const fetchBenefits = async () => {
      try {
        if (!user?.id) return;
        const data = await employeeBenefitApi.getEmployeeBenefits(user.id);
        setBenefits(data || []);
      } catch (err) {
        console.error('Error fetching employee benefits:', err);
      }
    };
    fetchBenefits();
  }, [user]);

  const formatDate = (date: string) =>
    date ? new Date(date).toLocaleDateString() : '-';

  return (
    <Box>
      <Typography variant='h4' gutterBottom>
        My Benefits
      </Typography>

      <Paper sx={{ mt: 2, overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Benefit Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Eligibility</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align='center'>Details</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {benefits.length > 0 ? (
              benefits.map(b => (
                <TableRow key={b.id}>
                  <TableCell>{b.benefit?.name || '-'}</TableCell>
                  <TableCell>{b.benefit?.type || '-'}</TableCell>
                  <TableCell>{b.benefit?.description || '-'}</TableCell>
                  <TableCell>{b.benefit?.eligibilityCriteria || '-'}</TableCell>
                  <TableCell>{formatDate(b.startDate)}</TableCell>
                  <TableCell>{formatDate(b.endDate)}</TableCell>
                  <TableCell>
                    <Chip
                      label={b.status}
                      color={b.status === 'active' ? 'success' : 'default'}
                      size='small'
                    />
                  </TableCell>
                  <TableCell align='center'>
                    <Tooltip title='View Details'>
                      <IconButton
                        color='primary'
                        onClick={() => setSelectedBenefit(b)}
                      >
                        <InfoIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align='center'>
                  No assigned benefits found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Dialog
        open={!!selectedBenefit}
        onClose={() => setSelectedBenefit(null)}
        fullWidth
        maxWidth='sm'
      >
        {selectedBenefit && (
          <Box p={3}>
            <BenefitCard
              name={selectedBenefit.benefit?.name}
              type={selectedBenefit.benefit?.type}
              eligibility={selectedBenefit.benefit?.eligibilityCriteria}
              description={selectedBenefit.benefit?.description}
              startDate={formatDate(selectedBenefit.startDate)}
              endDate={formatDate(selectedBenefit.endDate)}
            />
            <Box textAlign='right' mt={2}>
              <Button onClick={() => setSelectedBenefit(null)}>Close</Button>
            </Box>
          </Box>
        )}
      </Dialog>
    </Box>
  );
};

export default BenefitDetails;
