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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Snackbar,
  Alert,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import BenefitCard from './BenefitCard';

const dummyEmployees = [
  { id: '1', first_name: 'Nabeel', last_name: 'Ahmad' },
  { id: '2', first_name: 'Nouman', last_name: 'Rai' },
  { id: '3', first_name: 'Ramish', last_name: 'Munawar' },
];

const dummyBenefits = [
  {
    id: 'b1',
    name: 'Health Insurance',
    description: 'Full coverage for employees and dependents.',
    type: 'Monetary',
  },
  {
    id: 'b2',
    name: 'Fuel Allowance',
    description: 'Monthly fuel reimbursement for commuting.',
    type: 'Monetary',
  },
  {
    id: 'b3',
    name: 'Gym Membership',
    description: 'Free gym access at partnered fitness centers.',
    type: 'Non-Monetary',
  },
];

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
  const [showSnackbar, setShowSnackbar] = useState(false);

  const [selectedBenefit, setSelectedBenefit] = useState<any | null>(null);
  const [openBenefitDialog, setOpenBenefitDialog] = useState(false);

  const [formValues, setFormValues] = useState({
    employeeId: '',
    benefitIds: [] as string[],
    benefitType: '',
    startDate: '',
  });

  const handleChange = (
    e: React.ChangeEvent<{ name?: string; value: any }>
  ) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name!]: value }));
  };

  const handleAssign = () => {
    const { employeeId, benefitIds, benefitType, startDate } = formValues;
    if (!employeeId || benefitIds.length === 0 || !benefitType || !startDate)
      return;

    const employee = dummyEmployees.find(e => e.id === employeeId);
    const selectedBenefits = dummyBenefits.filter(b =>
      benefitIds.includes(b.id)
    );

    const newAssignment: AssignedBenefit = {
      employeeId: employee?.id || '',
      employeeName: `${employee?.first_name} ${employee?.last_name}`,
      benefitNames: selectedBenefits.map(b => b.name),
      benefitType,
      startDate,
    };

    setAssignedBenefits(prev => [...prev, newAssignment]);
    setShowSnackbar(true);
    setOpenForm(false);
    setFormValues({
      employeeId: '',
      benefitIds: [],
      benefitType: '',
      startDate: '',
    });
  };

  const handleBenefitClick = (benefitName: string) => {
    const benefit = dummyBenefits.find(b => b.name === benefitName);
    if (benefit) {
      setSelectedBenefit(benefit);
      setOpenBenefitDialog(true);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
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

      <Dialog
        open={openForm}
        onClose={() => setOpenForm(false)}
        maxWidth='xs'
        fullWidth
      >
        <DialogTitle fontWeight={600}>Assign Benefit</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
        >
          <FormControl fullWidth>
            <InputLabel>Employee</InputLabel>
            <Select
              label='Employee'
              name='employeeId'
              value={formValues.employeeId}
              onChange={handleChange}
            >
              {dummyEmployees.map(emp => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Benefits</InputLabel>
            <Select
              label='Benefits'
              name='benefitIds'
              multiple
              value={formValues.benefitIds}
              onChange={handleChange}
              renderValue={selected =>
                dummyBenefits
                  .filter(b => selected.includes(b.id))
                  .map(b => b.name)
                  .join(', ')
              }
            >
              {dummyBenefits.map(benefit => (
                <MenuItem key={benefit.id} value={benefit.id}>
                  {benefit.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Benefit Type</InputLabel>
            <Select
              label='Benefit Type'
              name='benefitType'
              value={formValues.benefitType}
              onChange={handleChange}
            >
              <MenuItem value='Monetary'>Monetary</MenuItem>
              <MenuItem value='Non-Monetary'>Non-Monetary</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label='Start Date'
            name='startDate'
            type='date'
            InputLabelProps={{ shrink: true }}
            value={formValues.startDate}
            onChange={handleChange}
          />
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenForm(false)}>Cancel</Button>
          <Button variant='contained' onClick={handleAssign}>
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openBenefitDialog}
        onClose={() => setOpenBenefitDialog(false)}
        maxWidth='xs'
        fullWidth
      >
        <DialogTitle>Benefit Details</DialogTitle>
        <DialogContent>
          {selectedBenefit && (
            <BenefitCard
              name={selectedBenefit.name}
              type={selectedBenefit.type}
              eligibility='All full-time employees'
              description={selectedBenefit.description}
              startDate={new Date().toISOString().split('T')[0]}
            />
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenBenefitDialog(false)}>Close</Button>
        </DialogActions>
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
