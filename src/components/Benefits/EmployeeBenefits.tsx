import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Snackbar,
  Alert,
  Dialog,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import BenefitCard from './BenefitCard';
import AssignEmployeeBenefit from './AssignEmployeeBenefit';

interface AssignedBenefit {
  employeeId: string;
  employeeName: string;
  benefitNames: string[];
  benefitType: string;
  startDate: string;
}

const EmployeeBenefits: React.FC = () => {
  const [openForm, setOpenForm] = useState(false);
  const [assignedBenefits, setAssignedBenefits] = useState<AssignedBenefit[]>(
    []
  );
  const [selectedBenefit, setSelectedBenefit] = useState<any | null>(null);
  const [openBenefitDialog, setOpenBenefitDialog] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);

  const handleBenefitClick = (benefitName: string) => {
    const benefit = assignedBenefits
      .flatMap(a => a.benefitNames)
      .find(name => name === benefitName);

    if (benefit) {
      setSelectedBenefit({ name: benefit, type: '', description: '' }); // type/description can be fetched if needed
      setOpenBenefitDialog(true);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
        }}
      >
        <Typography variant='h5' fontWeight={600}>
          Employee Benefit Assignment
        </Typography>
        <Button
          variant='contained'
          startIcon={<AddIcon />}
          onClick={() => setOpenForm(true)}
        >
          Assign Benefit
        </Button>
      </Box>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Benefits</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Start Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assignedBenefits.length > 0 ? (
                assignedBenefits.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.employeeName}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {row.benefitNames.map(b => (
                          <Chip
                            key={b}
                            label={b}
                            color='primary'
                            variant='outlined'
                            size='small'
                            sx={{ cursor: 'pointer' }}
                            onClick={() => handleBenefitClick(b)}
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>{row.benefitType}</TableCell>
                    <TableCell>{row.startDate}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align='center'>
                    No benefits assigned yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <AssignEmployeeBenefit
        open={openForm}
        onClose={() => setOpenForm(false)}
      />

      <Dialog
        open={openBenefitDialog}
        onClose={() => setOpenBenefitDialog(false)}
      >
        {selectedBenefit && (
          <BenefitCard
            name={selectedBenefit.name}
            type={selectedBenefit.type}
            eligibility='All full-time employees'
            description={selectedBenefit.description}
            startDate={new Date().toISOString().split('T')[0]}
          />
        )}
      </Dialog>

      <Snackbar
        open={showSnackbar}
        autoHideDuration={2500}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          severity='success'
          variant='filled'
          onClose={() => setShowSnackbar(false)}
        >
          Benefit(s) assigned successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EmployeeBenefits;
