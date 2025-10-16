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
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import BenefitCard from '../Benefits/BenefitCard';
import employeeBenefitApi from '../../api/employeeBenefitApi';
import { useUser } from '../../hooks/useUser'; // Assuming hook for current user

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

  return (
    <Box>
      <Typography variant='h4' gutterBottom>
        My Benefits
      </Typography>

      <Paper sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Benefit Name</TableCell>
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
                  <TableCell>{b.benefitName}</TableCell>
                  <TableCell>{b.startDate}</TableCell>
                  <TableCell>{b.endDate}</TableCell>
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
                <TableCell colSpan={5} align='center'>
                  No assigned benefits found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={!!selectedBenefit} onClose={() => setSelectedBenefit(null)}>
        {selectedBenefit && (
          <BenefitCard
            name={selectedBenefit.benefitName}
            type={selectedBenefit.type}
            eligibility={selectedBenefit.eligibility}
            description={selectedBenefit.description}
            startDate={selectedBenefit.startDate}
          />
        )}
      </Dialog>
    </Box>
  );
};

export default BenefitDetails;
