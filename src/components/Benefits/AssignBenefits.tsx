import { useEffect, useState } from 'react';
import { assignBenefits, listBenefits, listEmployeeBenefits } from '../../api/benefits';
import type { Benefit, EmployeeBenefitAssignment } from '../../types/benefits';
import { Button, Card, CardContent, Chip, CircularProgress, FormControl, InputLabel, MenuItem, OutlinedInput, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography, Box } from '@mui/material';
import { toast } from 'react-toastify';
import { mockEmployees, getEmployeeById } from '../../data/employees.ts';

interface AssignBenefitsProps {
  employeeId?: string;
  onAssignmentChange?: () => void;
}

export default function AssignBenefits({ employeeId: propEmployeeId, onAssignmentChange }: AssignBenefitsProps) {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [assignedBenefits, setAssignedBenefits] = useState<EmployeeBenefitAssignment[]>([]);
  const [selectedBenefitIds, setSelectedBenefitIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(propEmployeeId || '');
  const [loading, setLoading] = useState(false);
  const [loadingAssigned, setLoadingAssigned] = useState(false);

  useEffect(() => {
    listBenefits({ page: 1, pageSize: 100 }).then((res) => setBenefits(res.items));
  }, []);

  useEffect(() => {
    if (selectedEmployeeId) {
      setLoadingAssigned(true);
      listEmployeeBenefits(selectedEmployeeId)
        .then((res) => setAssignedBenefits(res))
        .finally(() => setLoadingAssigned(false));
    } else {
      setAssignedBenefits([]);
    }
  }, [selectedEmployeeId]);

  const handleAssign = async () => {
    if (!selectedEmployeeId) {
      toast.error('Please select an employee');
      return;
    }
    
    setLoading(true);
    try {
      if (!selectedBenefitIds.length || !startDate) {
        toast.error('Select at least one benefit and a start date');
      } else {
        await assignBenefits(selectedEmployeeId, selectedBenefitIds, startDate);
        toast.success('Benefits assigned successfully');
        // Refresh assigned benefits
        const res = await listEmployeeBenefits(selectedEmployeeId);
        setAssignedBenefits(res);
        // Clear selection
        setSelectedBenefitIds([]);
        setStartDate('');
        // Notify parent component about assignment change
        onAssignmentChange?.();
        // Dispatch custom event for other components to listen
        window.dispatchEvent(new CustomEvent('benefitsAssigned', { 
          detail: { employeeId: selectedEmployeeId, benefitIds: selectedBenefitIds } 
        }));
      }
    } catch (e: unknown) {
      toast.error((e as Record<string, unknown>)?.message as string || 'Failed to assign benefits');
    } finally {
      setLoading(false);
    }
  };

  const getBenefitDetails = (benefitId: string) => {
    return benefits.find(b => b.id === benefitId);
  };

  const getEmployeeDetails = (employeeId: string) => {
    return getEmployeeById(employeeId);
  };

  const selectedEmployee = getEmployeeDetails(selectedEmployeeId);

  return (
    <Stack spacing={3}>
      <Typography variant="h5" fontWeight="bold">Assign Benefits</Typography>
      
      {/* Employee Selection and Benefit Assignment Side by Side */}
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
        {/* Employee Selection - Left Side */}
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6">Select Employee</Typography>
              <FormControl fullWidth>
                <InputLabel>Employee</InputLabel>
                <Select
                  value={selectedEmployeeId}
                  label="Employee"
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                >
                  {mockEmployees.map((emp) => (
                    <MenuItem key={emp.id} value={emp.id}>
                      {emp.name} - {emp.designation} ({emp.department})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {selectedEmployee && (
                <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold">{selectedEmployee.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedEmployee.designation} • {selectedEmployee.department}
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* Benefit Assignment - Right Side */}
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6">Assign New Benefits</Typography>
              <TextField 
                label="Start Date" 
                type="date" 
                InputLabelProps={{ shrink: true }} 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Select Benefits</InputLabel>
                <Select
                  multiple
                  value={selectedBenefitIds}
                  onChange={(e) => setSelectedBenefitIds(e.target.value as string[])}
                  input={<OutlinedInput label="Select Benefits" />}
                  renderValue={(selected) => (
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {selected.map((value) => {
                        const benefit = benefits.find(b => b.id === value);
                        return (
                          <Chip 
                            key={value} 
                            label={benefit?.name || value} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        );
                      })}
                    </Stack>
                  )}
                >
                  {benefits.map((benefit) => (
                    <MenuItem key={benefit.id} value={benefit.id}>
                      <Stack>
                        <Typography variant="body2" fontWeight="medium">
                          {benefit.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {benefit.type} • {benefit.status} • {benefit.description}
                        </Typography>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Stack direction="row" justifyContent="flex-end">
                <Button 
                  variant="contained" 
                  onClick={handleAssign} 
                  disabled={loading || !selectedEmployeeId}
                  fullWidth
                >
                  {loading ? <CircularProgress size={20} /> : 'Assign Benefits'}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      {/* Currently Assigned Benefits */}
      {selectedEmployeeId && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Currently Assigned Benefits</Typography>
            {loadingAssigned ? (
              <Stack alignItems="center" py={4}>
                <CircularProgress />
              </Stack>
            ) : assignedBenefits.length > 0 ? (
              <Box sx={{ overflowX: 'auto', width: '100%' }}>
                <Table size="small" sx={{ minWidth: 600 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Benefit Name</strong></TableCell>
                      <TableCell><strong>Type</strong></TableCell>
                      <TableCell><strong>Start Date</strong></TableCell>
                      <TableCell><strong>End Date</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assignedBenefits.map((assignment) => {
                      const benefit = getBenefitDetails(assignment.benefitId);
                      return (
                        <TableRow key={assignment.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {benefit?.name || assignment.benefitId}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={benefit?.type || '-'} 
                              size="small" 
                              color="primary" 
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>{assignment.startDate}</TableCell>
                          <TableCell>{assignment.endDate || '-'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={assignment.status} 
                              size="small" 
                              color={assignment.status === 'active' ? 'success' : 'default'}
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            ) : (
              <Stack alignItems="center" py={4}>
                <Typography color="text.secondary">No benefits assigned yet</Typography>
              </Stack>
            )}
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}


