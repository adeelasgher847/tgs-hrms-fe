import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  Grid,
  Box,
  Typography,
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
import { getRoleName, isSystemAdmin as isSystemAdminFn } from '../../utils/roleUtils';

const itemsPerPage = 25;
const ITEMS_PER_PAGE= 25;

interface Tenant { id: string; name: string; }
interface Department { id: string; name: string; }
interface Designation { id: string; title: string; }
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
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } 
    catch { return {}; }
  }, []);
  const userRoleValue = user?.role;
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
  const [tableLoading, setTableLoading] = useState(false);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDesignation, setSelectedDesignation] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ------------------- Fetch Summary -------------------
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        if (isSystemAdmin) {
          const tenantParam = selectedTenant || 'all';
          const data = await employeeBenefitApi.getSystemAdminBenefitSummary(tenantParam);
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
      } catch (error) { console.error('Error fetching summary data:', error); }
    };
    fetchSummary();
  }, [isSystemAdmin, selectedTenant]);

  // ------------------- Fetch Tenants -------------------
  useEffect(() => {
    if (!isSystemAdmin) return;
    const fetchTenants = async () => {
      try {
        const data = await systemEmployeeApiService.getAllTenants(true);
        setTenants(data || []);
        if ((data || []).length > 0) setSelectedTenant(prev => prev || data[0].id);
      } catch (error) {
        console.error('Error fetching tenants:', error);
        setTenants([]);
      }
    };
    fetchTenants();
  }, [isSystemAdmin]);

  // ------------------- Fetch Departments -------------------
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await departmentApiService.getAllDepartments();
        setDepartments(data || []);
      } catch (error) { console.error('Error fetching departments:', error); setDepartments([]); }
    };
    fetchDepartments();
  }, []);

  // ------------------- Fetch Designations -------------------
  useEffect(() => {
    const fetchDesignations = async () => {
      try {
        if (selectedDepartment) {
          const response = await designationApiService.getDesignationsByDepartment(selectedDepartment, null);
          setDesignations(response.items || []);
        } else {
          const all = await designationApiService.getAllDesignations();
          setDesignations(all || []);
        }
      } catch (error) { console.error('Error fetching designations:', error); setDesignations([]); }
    };
    fetchDesignations();
  }, [selectedDepartment]);

  // ------------------- Fetch Employee Benefits -------------------
  useEffect(() => {
    let isMounted = true;
    const fetchEmployeeBenefits = async () => {
      setTableLoading(true);
      try {
        let flattened: BenefitRow[] = [];
        let backendTotalPages = 1;

        if (isSystemAdmin) {
          const response = await employeeBenefitApi.getAllTenantsEmployeeBenefits({
            tenant_id: selectedTenant || undefined,
            page,
            limit: ITEMS_PER_PAGE,
          } as any);

          const items: any[] = (response as any)?.items || (response as any)?.tenants || [];

          flattened = items.flatMap((tenant: any) =>
            (tenant.employees || []).flatMap((emp: any) =>
              (emp.benefits || []).map((b: any) => ({
                tenantId: tenant.tenant_id,
                tenantName: tenant.tenant_name,
                department: emp.department || '-',
                designation: emp.designation || '-',
                employeeName: emp.employeeName || '-',
                benefitType: b.type || b.name || '-',
                status: b.statusOfAssignment || b.status || '-',
              }))
            )
          );
          backendTotalPages = (response as any)?.totalPages || 1;
        } else {
          const params: any = { page };
          if (selectedDepartment) params.department = selectedDepartment;
          if (selectedDesignation) params.designation = selectedDesignation;
          if (selectedTenant) params.tenant_id = selectedTenant;

          const response = await employeeBenefitApi.getFilteredEmployeeBenefits(params);
          flattened = (response || []).flatMap((emp: any) =>
            (emp.benefits || []).map((b: any) => ({
              tenantId: emp.tenantId ?? emp.tenant_id,
              tenantName: emp.tenantName ?? emp.tenant_name,
              department: emp.department || '-',
              designation: emp.designation || '-',
              employeeName: emp.employeeName || emp.employee_name || '-',
              benefitType: b.type || b.name || '-',
              status: b.statusOfAssignment || b.status || '-',
            }))
          );
        }

        if (!isMounted) return;
        setBenefitData(flattened);
        setFilteredData(flattened);
        setTotalPages(backendTotalPages);
      } catch (error) {
        console.error('Error fetching employee benefits:', error);
        if (!isMounted) return;
        setBenefitData([]);
        setFilteredData([]);
        setTotalPages(1);
      } finally { if (isMounted) setTableLoading(false); }
    };

    fetchEmployeeBenefits();
    return () => { isMounted = false; };
  }, [isSystemAdmin, selectedTenant, page, selectedDepartment, selectedDesignation]);

  // ------------------- Local Filtering for Admin -------------------
  useEffect(() => {
    if (!isSystemAdmin) return;
    let filtered = [...benefitData];
    if (selectedTenant) filtered = filtered.filter(r => r.tenantId === selectedTenant);
    setFilteredData(filtered);
    setTotalPages(Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE)));
  }, [benefitData, selectedTenant, isSystemAdmin]);

  // ------------------- Pagination Slice -------------------
  const paginatedData = filteredData.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // ------------------- CSV Export -------------------
  const csvEscape = (value: unknown) => value == null ? '' : `"${String(value).replace(/"/g, '""')}"`;
  const handleDownload = () => {
    if (!filteredData.length) { alert('No data to download.'); return; }
    const csvHeader = [...(isSystemAdmin ? ['Tenant'] : []), 'Department','Designation','Employee Name','Benefit Type','Status'];
    const rows = filteredData.map(row => [
      ...(isSystemAdmin ? [csvEscape(row.tenantName ?? row.tenantId ?? '')] : []),
      csvEscape(row.department),
      csvEscape(row.designation),
      csvEscape(row.employeeName),
      csvEscape(row.benefitType),
      csvEscape(row.status),
    ].join(','));
    const csvContent = [csvHeader.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.setAttribute('download', `BenefitReport.csv`);
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  if (tableLoading) return (<Box display='flex' justifyContent='center' mt={4}><CircularProgress /></Box>);

  // ------------------- Render -------------------
  return (
    <Box py={3}>
      {/* Header */}
      <Box display='flex' justifyContent='space-between' gap={3} flexWrap='wrap' alignItems='center' mb={2}>
        <Typography variant='h4' fontSize={{ xs: '25px', sm: '34px' }} fontWeight={600} gutterBottom mb={0}>
          Benefits Report
        </Typography>
        {isSystemAdmin && (
          <FormControl size='small' sx={{ minWidth: 220 }}>
            <InputLabel>Tenant</InputLabel>
            <Select value={selectedTenant} onChange={e => { setSelectedTenant(e.target.value as string); setPage(1); }} label='Tenant'>
              <MenuItem value=''>All</MenuItem>
              {tenants.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
            </Select>
          </FormControl>
        )}
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
        {[
          { title: 'Total Active Benefits', value: summary.totalActiveBenefits, icon: <AccountBalanceWalletIcon color='primary' /> },
          { title: 'Most Common Benefit Type', value: summary.mostCommonBenefitType, icon: <CardGiftcardIcon color='secondary' /> },
          { title: 'Employees Covered', value: summary.totalEmployeesCovered, icon: <PeopleIcon color='primary' /> },
        ].map((card, index) => <Box key={index}><SummaryCard {...card} /></Box>)}
      </Box>

      {/* Filters & CSV */}
      <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl size='small' sx={{ minWidth: 220 }}>
              <InputLabel>Department</InputLabel>
              <Select value={selectedDepartment} onChange={e => { setSelectedDepartment(e.target.value as string); setPage(1); }} label='Department'>
                <MenuItem value=''>All</MenuItem>
                {departments.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl size='small' sx={{ minWidth: 220 }}>
              <InputLabel>Designation</InputLabel>
              <Select value={selectedDesignation} onChange={e => { setSelectedDesignation(e.target.value as string); setPage(1); }} label='Designation' disabled={!designations.length}>
                <MenuItem value=''>All</MenuItem>
                {designations.map(d => <MenuItem key={d.id} value={d.title}>{d.title}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <Tooltip title='Download CSV'>
          <IconButton color='primary' onClick={handleDownload} sx={{ backgroundColor: 'primary.main', color: 'white', borderRadius: '6px', '&:hover': { backgroundColor: 'primary.dark' } }}>
            <FileDownloadIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Table */}
      <Paper sx={{ borderRadius: 1, boxShadow: 'none' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                {isSystemAdmin && <TableCell sx={{ fontWeight: 600 }}>Tenant</TableCell>}
                <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Designation</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Employee Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Benefit Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow><TableCell colSpan={isSystemAdmin ? 6 : 5} align='center'>No data available</TableCell></TableRow>
              ) : paginatedData.map((row, i) => (
                <TableRow key={i}>
                  {isSystemAdmin && <TableCell>{row.tenantName ?? row.tenantId}</TableCell>}
                  <TableCell>{row.department}</TableCell>
                  <TableCell>{row.designation}</TableCell>
                  <TableCell>{row.employeeName}</TableCell>
                  <TableCell>{row.benefitType}</TableCell>
                  <TableCell>{row.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box display='flex' justifyContent='center' my={2}>
          <Pagination count={totalPages} page={page} onChange={(_, newPage) => setPage(newPage)} color='primary' />
        </Box>
      )}

      <Box textAlign='center' mb={2}>
        <Typography variant='body2' color='text.secondary'>
          Showing {filteredData.length === 0 ? 0 : Math.min((page - 1) * ITEMS_PER_PAGE + 1, filteredData.length)}–{Math.min(page * ITEMS_PER_PAGE, filteredData.length)} of {filteredData.length} records
        </Typography>
      </Box>
    </Box>
  );
};

export default BenefitReport;
