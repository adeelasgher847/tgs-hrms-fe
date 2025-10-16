import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  TableContainer,
  Paper,
  CircularProgress,
} from '@mui/material';
import axios from 'axios';
import SummaryCard from './SummaryCard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import PeopleIcon from '@mui/icons-material/People';

const BenefitReport = () => {
  const [summary, setSummary] = useState({
    totalActiveBenefits: 0,
    mostCommonType: '-',
    totalEmployeesCovered: 0,
  });
  const [benefitData, setBenefitData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBenefitReport = async () => {
      try {
        const response = await axios.get('/api/benefits/reporting');
        const data = response.data;
        setSummary({
          totalActiveBenefits: data.totalActiveBenefits,
          mostCommonType: data.mostCommonType,
          totalEmployeesCovered: data.totalEmployeesCovered,
        });
        setBenefitData(data.table || []);
      } catch (error) {
        console.error('Error fetching benefit reporting data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBenefitReport();
  }, []);

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant='h5' fontWeight={600} gutterBottom>
        Benefits Reporting
      </Typography>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={4}>
          <SummaryCard
            title='Total Active Benefits'
            value={summary.totalActiveBenefits}
            icon={<AccountBalanceWalletIcon color='primary' />}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <SummaryCard
            title='Most Common Benefit Type'
            value={summary.mostCommonType}
            icon={<CardGiftcardIcon color='secondary' />}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <SummaryCard
            title='Total Employees Covered'
            value={summary.totalEmployeesCovered}
            icon={<PeopleIcon color='primary' />}
          />
        </Grid>
      </Grid>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Designation</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Benefit Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Employees Covered</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {benefitData.length > 0 ? (
              benefitData.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row.department}</TableCell>
                  <TableCell>{row.designation}</TableCell>
                  <TableCell>{row.benefitType}</TableCell>
                  <TableCell>{row.employeesCovered}</TableCell>
                  <TableCell>{row.status}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align='center'>
                  No data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default BenefitReport;
