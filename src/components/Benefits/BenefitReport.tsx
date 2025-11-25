import React, { useEffect, useMemo, useState } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Tooltip,
  IconButton,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SummaryCard from './SummaryCard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import PeopleIcon from '@mui/icons-material/People';
import benefitsApi from '../../api/benefitApi';
import employeeBenefitApi from '../../api/employeeBenefitApi';
import { departmentApiService } from '../../api/departmentApi';
import { designationApiService } from '../../api/designationApi';
import systemEmployeeApiService from '../../api/systemEmployeeApi';
import {
  getRoleName,
  isSystemAdmin as isSystemAdminFn,
} from '../../utils/roleUtils';

const ITEMS_PER_PAGE = 10;

interface Tenant {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
}

interface Designation {
  id: string;
  title: string;
}

interface BenefitRow {
  tenantId?: string;
  tenantName?: string;
  department: string;
  designation: string;
  employeeName: string;
  benefitType: string;
  status: string;
}

const BenefitReport: React.FC = () => {
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);
  const userRoleValue = user?.role;
  const currentRoleName = getRoleName(userRoleValue);
  const isSystemAdmin = isSystemAdminFn(userRoleValue);

  const [summary, setSummary] = useState({
    tenant_id: 'all' as string,
    totalActiveBenefits: 0,
    mostCommonBenefitType: '-',
    totalEmployeesCovered: 0,
  });

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>('');

  const [benefitData, setBenefitData] = useState<BenefitRow[]>([]);
  const [filteredData, setFilteredData] = useState<BenefitRow[]>([]);

  // Two loading states:
  // initialLoading: true while the component's very first data load happens (full page spinner)
  // tableLoading: true when subsequent filter/tenant changes cause table refresh (inline small spinner)
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDesignation, setSelectedDesignation] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Summary fetch (updates when selectedTenant changes for system admin)
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        if (isSystemAdmin) {
          const tenantParam = selectedTenant || 'all';
          const data =
            await employeeBenefitApi.getSystemAdminBenefitSummary(tenantParam);
          setSummary({
            tenant_id: data.tenant_id ?? tenantParam,
            totalActiveBenefits: data.totalActiveBenefits ?? 0,
            mostCommonBenefitType: data.mostCommonBenefitType ?? '-',
            totalEmployeesCovered: data.totalEmployeesCovered ?? 0,
          });
        } else {
          const data = await benefitsApi.getBenefitSummary();
          setSummary({
            tenant_id: 'current',
            totalActiveBenefits: data.totalActiveBenefits ?? 0,
            mostCommonBenefitType: data.mostCommonBenefitType ?? '-',
            totalEmployeesCovered: data.totalEmployeesCovered ?? 0,
          });
        }
      } catch (error) {
        console.error('Error fetching summary data:', error);
      }
    };

    fetchSummary();
  }, [isSystemAdmin, selectedTenant]);

  // Tenants (only for system admin). Set default selectedTenant here.
  useEffect(() => {
    if (!isSystemAdmin) return;

    const fetchTenants = async () => {
      try {
        const data = await systemEmployeeApiService.getAllTenants(true);
        setTenants(data || []);

        if ((data || []).length > 0) {
          // prefer not to trigger redundant fetch if already set to same id
          setSelectedTenant(prev => prev || data[0].id);
        }
      } catch (error) {
        console.error('Error fetching tenants:', error);
        setTenants([]);
      }
    };

    fetchTenants();
  }, [isSystemAdmin]);

  // Departments (one-time)
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await departmentApiService.getAllDepartments();
        setDepartments(data || []);
      } catch (error) {
        console.error('Error fetching departments:', error);
        setDepartments([]);
      }
    };
    fetchDepartments();
  }, []);

  // Designations (changes when selectedDepartment changes)
  useEffect(() => {
    const fetchDesignations = async () => {
      try {
        if (selectedDepartment) {
          const response =
            await designationApiService.getDesignationsByDepartment(
              selectedDepartment,
              null
            );
          setDesignations(response.items || []);
        } else {
          const all = await designationApiService.getAllDesignations();
          setDesignations(all || []);
        }
      } catch (error) {
        console.error('Error fetching designations:', error);
        setDesignations([]);
      }
    };
    fetchDesignations();
  }, [selectedDepartment]);

  // Employee benefits fetch
  // Note: when initialLoading=true (first time), we show full-page loader.
  // For subsequent calls (e.g., user changed tenant/filters), we set tableLoading
  useEffect(() => {
    let isMounted = true;

    const fetchEmployeeBenefits = async () => {
      // If first-time load, keep initialLoading true (already true by default).
      // For subsequent loads, show inline table loading
      if (!initialLoading) {
        setTableLoading(true);
      }

      try {
        const params: any = { page: 1 };
        if (isSystemAdmin) {
          if (selectedTenant) params.tenantId = selectedTenant;
        }

        const response =
          await employeeBenefitApi.getFilteredEmployeeBenefits(params);

        const flattened: BenefitRow[] = (response || []).flatMap((emp: any) =>
          (emp.benefits || []).map((b: any) => ({
            tenantId: emp.tenantId ?? emp.tenant_id ?? undefined,
            tenantName: emp.tenantName ?? emp.tenant_name ?? undefined,
            department: emp.department || '-',
            designation: emp.designation || '-',
            employeeName: emp.employeeName || emp.employee_name || '-',
            benefitType: b.type || b.name || '-',
            status: b.statusOfAssignment || b.status || '-',
          }))
        );

        if (!isMounted) return;
        setBenefitData(flattened);
        setFilteredData(flattened);
        setTotalPages(
          Math.max(1, Math.ceil(flattened.length / ITEMS_PER_PAGE))
        );
        setPage(1);
      } catch (error) {
        console.error('Error fetching employee benefits data:', error);
        if (!isMounted) return;
        setBenefitData([]);
        setFilteredData([]);
        setTotalPages(1);
        setPage(1);
      } finally {
        if (!isMounted) return;
        // If it was the initial load, flip initialLoading -> false
        if (initialLoading) {
          setInitialLoading(false);
        }
        setTableLoading(false);
      }
    };

    fetchEmployeeBenefits();

    return () => {
      isMounted = false;
    };
    // Note: selectedTenant and isSystemAdmin intentionally included so changes re-fetch
  }, [isSystemAdmin, selectedTenant]);

  // local filtering (department / designation / tenant filtering for system admin)
  useEffect(() => {
    let filtered = [...benefitData];

    if (isSystemAdmin && selectedTenant) {
      filtered = filtered.filter(r => r.tenantId === selectedTenant);
    }

    if (selectedDepartment) {
      const selectedDeptName = departments.find(
        d => d.id === selectedDepartment
      )?.name;
      if (selectedDeptName) {
        filtered = filtered.filter(row => row.department === selectedDeptName);
      }
    }

    if (selectedDesignation) {
      filtered = filtered.filter(
        row => row.designation === selectedDesignation
      );
    }

    setFilteredData(filtered);
    setTotalPages(Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE)));
    setPage(1);
  }, [
    selectedDepartment,
    selectedDesignation,
    benefitData,
    departments,
    isSystemAdmin,
    selectedTenant,
  ]);

  const paginatedData = filteredData.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const csvEscape = (value: unknown) => {
    if (value === null || value === undefined) return '';
    const s = String(value).replace(/"/g, '""');
    return `"${s}"`;
  };

  const handleDownload = () => {
    if (filteredData.length === 0) {
      alert('No data to download.');
      return;
    }

    const csvHeader = [
      ...(isSystemAdmin ? ['Tenant'] : []),
      'Department',
      'Designation',
      'Employee Name',
      'Benefit Type',
      'Status',
    ];

    const rows = filteredData.map(row =>
      [
        ...(isSystemAdmin
          ? [csvEscape(row.tenantName ?? row.tenantId ?? '')]
          : []),
        csvEscape(row.department),
        csvEscape(row.designation),
        csvEscape(row.employeeName),
        csvEscape(row.benefitType),
        csvEscape(row.status),
      ].join(',')
    );

    const csvContent = [csvHeader.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', `BenefitReport.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Full-page loader only on initial load
  if (initialLoading) {
    return (
      <Box display='flex' justifyContent='center' mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box py={3}>
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={2}
      >
        <Typography variant='h4' fontWeight={600} gutterBottom>
          Benefits Report
        </Typography>

        {isSystemAdmin && (
          <FormControl size='small' sx={{ minWidth: 220 }}>
            <InputLabel>Tenant</InputLabel>
            <Select
              value={selectedTenant}
              onChange={e => {
                const val = e.target.value as string;
                setSelectedTenant(val);
                // reset dependent filters on tenant change
                setSelectedDepartment('');
                setSelectedDesignation('');
              }}
              label='Tenant'
            >
              <MenuItem value=''>All</MenuItem>
              {tenants.map(t => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      <Grid container spacing={2} mb={3}>
        {[
          {
            title: 'Total Active Benefits',
            value: summary.totalActiveBenefits,
            icon: <AccountBalanceWalletIcon color='primary' />,
          },
          {
            title: 'Most Common Benefit Type',
            value: summary.mostCommonBenefitType,
            icon: <CardGiftcardIcon color='secondary' />,
          },
          {
            title: 'Employees Covered',
            value: summary.totalEmployeesCovered,
            icon: <PeopleIcon color='primary' />,
          },
        ].map((card, index) => (
          <Grid
            item
            key={index}
            xs={12}
            sm={4}
            sx={{
              display: 'flex',
              flex: 1,
            }}
          >
            <Box sx={{ flexGrow: 1 }}>
              <SummaryCard {...card} />
            </Box>
          </Grid>
        ))}
      </Grid>

      <Box display='flex' justifyContent='space-between' alignItems='center'>
        <Grid container spacing={2} mb={2}>
          <Grid item>
            <FormControl size='small' sx={{ minWidth: 220 }}>
              <InputLabel>Department</InputLabel>
              <Select
                value={selectedDepartment}
                onChange={e => {
                  setSelectedDepartment(e.target.value as string);
                  setSelectedDesignation('');
                }}
                label='Department'
              >
                <MenuItem value=''>All</MenuItem>
                {departments.map(dept => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item>
            <FormControl size='small' sx={{ minWidth: 220 }}>
              <InputLabel>Designation</InputLabel>
              <Select
                value={selectedDesignation}
                onChange={e => setSelectedDesignation(e.target.value as string)}
                label='Designation'
                disabled={!designations.length}
              >
                <MenuItem value=''>All</MenuItem>
                {designations.map(des => (
                  <MenuItem key={des.id} value={des.title}>
                    {des.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Tooltip title='Download CSV'>
          <IconButton
            color='primary'
            onClick={handleDownload}
            sx={{
              backgroundColor: 'primary.main',
              color: 'white',
              borderRadius: '6px',
              '&:hover': { backgroundColor: 'primary.dark' },
            }}
          >
            <FileDownloadIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Paper sx={{ borderRadius: 2, mt: 2 }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                {isSystemAdmin && (
                  <TableCell sx={{ fontWeight: 600 }}>Tenant</TableCell>
                )}
                <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Designation</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Employee Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Benefit Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {tableLoading ? (
                <TableRow>
                  <TableCell colSpan={isSystemAdmin ? 6 : 5} align='center'>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((row, index) => (
                  <TableRow key={index}>
                    {isSystemAdmin && (
                      <TableCell>{row.tenantName ?? row.tenantId}</TableCell>
                    )}
                    <TableCell>{row.department}</TableCell>
                    <TableCell>{row.designation}</TableCell>
                    <TableCell>{row.employeeName}</TableCell>
                    <TableCell>{row.benefitType}</TableCell>
                    <TableCell>{row.status}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={isSystemAdmin ? 6 : 5} align='center'>
                    No data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {totalPages > 1 && (
        <Box display='flex' justifyContent='center' my={2}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            color='primary'
          />
        </Box>
      )}

      <Box textAlign='center' mb={2}>
        <Typography variant='body2' color='text.secondary'>
          Showing{' '}
          {filteredData.length === 0
            ? 0
            : Math.min((page - 1) * ITEMS_PER_PAGE + 1, filteredData.length)}
          –{Math.min(page * ITEMS_PER_PAGE, filteredData.length)} of{' '}
          {filteredData.length} records
        </Typography>
      </Box>
    </Box>
  );
};

export default BenefitReport;
