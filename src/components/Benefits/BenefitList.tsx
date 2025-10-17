import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Benefit, BenefitFilters, EmployeeBenefitAssignment } from '../../types/benefits';
import { createBenefit, deactivateBenefit, listBenefits, updateBenefit, listAllBenefitAssignments } from '../../api/benefits';
import { Button, Card, CardContent, CircularProgress, FormControl, InputLabel, MenuItem, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography, Box } from '@mui/material';
import BenefitFormModal from './BenefitFormModal';
import { toast } from 'react-toastify';
import { getEmployeeById, getEmployeeName } from '../../data/employees.ts';
export default function BenefitList() {
  const [items, setItems] = useState<Benefit[]>([]);
  const [assignments, setAssignments] = useState<EmployeeBenefitAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [type, setType] = useState<'all' | Benefit['type']>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Benefit | null>(null);

  const filters: BenefitFilters = useMemo(() => ({ search, status, type }), [search, status, type]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load both benefits and assignments in parallel
      const [benefitsRes, assignmentsRes] = await Promise.all([
        listBenefits(filters),
        listAllBenefitAssignments()
      ]);
      setItems(benefitsRes.items);
      setAssignments(assignmentsRes);
    } catch (e: unknown) {
      setError((e as Error)?.message || 'Failed to load benefits');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listen for benefit assignment events to refresh data
  useEffect(() => {
    const handleBenefitsAssigned = () => {
      loadData();
    };

    window.addEventListener('benefitsAssigned', handleBenefitsAssigned);
    
    return () => {
      window.removeEventListener('benefitsAssigned', handleBenefitsAssigned);
    };
  }, [loadData]);

  // const handleDeactivate = async (id: string) => {
  //   setLoading(true);
  //   try {
  //     await deactivateBenefit(id);
  //     await loadData();
  //     toast.success('Benefit deactivated');
  //   } catch (e: unknown) {
  //     const msg = (e as Error)?.message || 'Failed to deactivate';
  //     setError(msg);
  //     toast.error(msg);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleToggleActive = async (b: Benefit) => {
    setLoading(true);
    try {
      if (b.status === 'active') {
        await deactivateBenefit(b.id);
        toast.success('Benefit deactivated');
      } else {
        await updateBenefit(b.id, { status: 'active' });
        toast.success('Benefit activated');
      }
      await loadData();
    } catch (e: unknown) {
      toast.error((e as Error)?.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (benefit: Benefit) => {
    setEditing(benefit);
    setFormOpen(true);
  };

  const handleSubmit = async (data: Omit<Benefit, 'id'>) => {
    try {
      if (editing) {
        await updateBenefit(editing.id, data);
        toast.success('Benefit updated');
      } else {
        await createBenefit(data);
        toast.success('Benefit created');
      }
      await loadData();
    } catch (e: unknown) {
      toast.error((e as Error)?.message || 'Operation failed');
    }
  };

  // Helper function to get assigned employees for a benefit
  const getAssignedEmployees = (benefitId: string) => {
    return assignments
      .filter(assignment => assignment.benefitId === benefitId && assignment.status === 'active')
      .map(assignment => ({
        employeeId: assignment.employeeId,
        employeeName: getEmployeeName(assignment.employeeId),
        startDate: assignment.startDate
      }));
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h5">Benefits</Typography>

      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between">
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
              <TextField label="Search" value={search} onChange={(e) => setSearch(e.target.value)} size="small" />
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Status</InputLabel>
                <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as 'all' | 'active' | 'inactive')}>
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Type</InputLabel>
                <Select label="Type" value={type} onChange={(e) => setType(e.target.value as 'all' | Benefit['type'])}>
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="health">Health</MenuItem>
                  <MenuItem value="dental">Dental</MenuItem>
                  <MenuItem value="vision">Vision</MenuItem>
                  <MenuItem value="life">Life</MenuItem>
                  <MenuItem value="retirement">Retirement</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <Button variant="contained" onClick={openCreate}>Create</Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {loading ? (
            <Stack alignItems="center" py={4}><CircularProgress /></Stack>
          ) : error ? (
            <Typography color="error">{error}</Typography>
          ) : (
            <>
              <Box sx={{ overflowX: 'auto', width: '100%' }}>
                <Table size="small" sx={{ minWidth: 800 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Eligibility</TableCell>
                      <TableCell>Assigned Employees</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                <TableBody>
                  {items.map((b) => {
                    const assignedEmployees = getAssignedEmployees(b.id);
                    return (
                      <TableRow key={b.id} hover>
                        <TableCell>{b.name}</TableCell>
                        <TableCell>{b.type}</TableCell>
                        <TableCell>{b.description}</TableCell>
                        <TableCell>{b.eligibility}</TableCell>
                        <TableCell>
                          {assignedEmployees.length > 0 ? (
                            <Stack spacing={1}>
                              {assignedEmployees.map((emp) => {
                                const employee = getEmployeeById(emp.employeeId);
                                return (
                                  <Box key={emp.employeeId}>
                                    <Typography variant="body2" fontWeight="medium">
                                      {emp.employeeName}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {employee?.designation} • {employee?.department}
                                    </Typography>
                                  </Box>
                                );
                              })}
                            </Stack>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No assignments
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{b.status}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button size="small" variant="outlined" onClick={() => openEdit(b)}>Edit</Button>
                            {b.status === 'active' ? (
                              <Button size="small" color="warning" onClick={() => handleToggleActive(b)}>Deactivate</Button>
                            ) : (
                              <Button size="small" color="success" onClick={() => handleToggleActive(b)}>Activate</Button>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      <BenefitFormModal
        open={formOpen}
        initial={editing || undefined}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </Stack>
  );
}


