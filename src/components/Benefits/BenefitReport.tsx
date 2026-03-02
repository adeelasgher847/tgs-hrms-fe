import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  CircularProgress,
  Pagination,
  Tooltip,
  IconButton,
} from '@mui/material';
// No-op placeholder to ensure file is touched if needed
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SummaryCard from './SummaryCard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import PeopleIcon from '@mui/icons-material/People';
import benefitsApi from '../../api/benefitApi';
import employeeBenefitApi, {
  type EmployeeWithBenefits,
  type TenantEmployeeWithBenefits,
} from '../../api/employeeBenefitApi';
import { departmentApiService } from '../../api/departmentApi';
import { designationApiService } from '../../api/designationApi';
import systemEmployeeApiService from '../../api/systemEmployeeApi';
import { isSystemAdmin as isSystemAdminFn } from '../../utils/roleUtils';
import AppDropdown from '../common/AppDropdown';
import AppTable from '../common/AppTable';

import { PAGINATION } from '../../constants/appConstants';
import { getUserRole } from '../../utils/auth';
import { normalizeRole } from '../../utils/permissions';
import AppButton from '../common/AppButton';

const itemsPerPage = PAGINATION.DEFAULT_PAGE_SIZE;
const ITEMS_PER_PAGE = PAGINATION.DEFAULT_PAGE_SIZE;

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
  const role = normalizeRole(getUserRole());
  const isManager = role === 'manager';
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
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

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        if (isSystemAdmin) {
          const data = await employeeBenefitApi.getSystemAdminBenefitSummary(
            selectedTenant || undefined
          );
          setSummary({
            tenant_id: data.tenant_id ?? selectedTenant ?? 'all',
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

  // ------------------- Fetch Tenants -------------------
  useEffect(() => {
    if (!isSystemAdmin) return;
    const fetchTenants = async () => {
      try {
        const data = await systemEmployeeApiService.getAllTenants(true);
        setTenants(data || []);
        // Keep initial selection as "All" (''); do not auto-select first tenant
      } catch (error) {
        console.error('Error fetching tenants:', error);
        setTenants([]);
      }
    };
    fetchTenants();
  }, [isSystemAdmin]);

  // When tenant changes, clear department and designation filters (system admin)
  useEffect(() => {
    if (isSystemAdmin) {
      setSelectedDepartment('');
      setSelectedDesignation('');
    }
  }, [isSystemAdmin, selectedTenant]);

  // ------------------- Fetch Departments -------------------
  useEffect(() => {
    if (isSystemAdmin && !selectedTenant) {
      setDepartments([]);
      return;
    }
    const fetchDepartments = async () => {
      try {
        if (isSystemAdmin) {
          const res = await departmentApiService.getAllTenantsWithDepartments(
            selectedTenant || undefined
          );
          const list = res?.tenants ?? [];
          const tenantEntry = selectedTenant
            ? list.find(t => t.tenant_id === selectedTenant)
            : list[0];
          const depts = tenantEntry?.departments ?? [];
          setDepartments(
            depts.map((d: { id: string; name: string }) => ({ id: d.id, name: d.name }))
          );
        } else {
          const data = await departmentApiService.getAllDepartments();
          setDepartments(data || []);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
        setDepartments([]);
      }
    };
    fetchDepartments();
  }, [isSystemAdmin, selectedTenant]);

  // ------------------- Fetch Designations -------------------
  useEffect(() => {
    if (isSystemAdmin && !selectedTenant) {
      setDesignations([]);
      return;
    }
    const fetchDesignations = async () => {
      try {
        if (isSystemAdmin) {
          const res =
            await designationApiService.getAllTenantsWithDesignations(
              selectedTenant || undefined
            );
          const list = res?.tenants ?? [];
          const tenantEntry = selectedTenant
            ? list.find(t => t.tenant_id === selectedTenant)
            : list[0];
          const deptList = tenantEntry?.departments ?? [];
          let items: Designation[] = [];
          for (const dept of deptList) {
            const designations = dept.designations ?? [];
            for (const des of designations) {
              items.push({ id: des.id, title: des.title });
            }
          }
          if (selectedDepartment) {
            const deptMatch = deptList.find(
              (d: { department_id: string }) => d.department_id === selectedDepartment
            );
            const fromDept = (deptMatch?.designations ?? []).map(
              (des: { id: string; title: string }) => ({ id: des.id, title: des.title })
            );
            if (fromDept.length > 0) items = fromDept;
          }
          setDesignations(items);
        } else {
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
        }
      } catch (error) {
        console.error('Error fetching designations:', error);
        setDesignations([]);
      }
    };
    fetchDesignations();
  }, [isSystemAdmin, selectedTenant, selectedDepartment]);

  // ------------------- Fetch Employee Benefits -------------------
  useEffect(() => {
    let isMounted = true;

    // helper functions removed — not needed for current processing

    const fetchEmployeeBenefits = async () => {
      setTableLoading(true);
      try {
        let flattened: BenefitRow[] = [];
        let backendTotalPages = 1;

        if (isSystemAdmin) {
          const response =
            await employeeBenefitApi.getAllTenantsEmployeeBenefits({
              tenant_id: selectedTenant || undefined,
              page,
              limit: ITEMS_PER_PAGE,
              department_id: selectedDepartment || undefined,
              designation_id: selectedDesignation || undefined,
            });

          const tenants: TenantEmployeeWithBenefits[] =
            'items' in response ? response.items : (response.tenants ?? []);

          flattened = tenants.flatMap(tenant =>
            (tenant.employees ?? []).flatMap(emp =>
              (emp.benefits ?? []).map(b => ({
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

          backendTotalPages =
            ('totalPages' in response && response.totalPages) || 1;
        } else {
          const params: {
            page: number;
            department?: string;
            designation?: string;
            tenant_id?: string;
          } = { page };
          if (selectedDepartment) params.department = selectedDepartment;
          if (selectedDesignation) params.designation = selectedDesignation;
          if (selectedTenant) params.tenant_id = selectedTenant;

          const response =
            await employeeBenefitApi.getFilteredEmployeeBenefits(params) as EmployeeWithBenefits[];
          flattened = (response || []).flatMap(emp =>
            (emp.benefits || []).map(b => ({
              tenantId: emp.tenantId ?? emp.tenant_id,
              tenantName: emp.tenantName ?? emp.tenant_name,
              department: emp.department || '-',
              designation: emp.designation || '-',
              employeeName: emp.employeeName || '-',
              benefitType: b.type || b.name || '-',
              status: b.statusOfAssignment || b.status || '-',
            }))
          );
        }

        if (!isMounted) return;
        setBenefitData(flattened);
        setFilteredData(flattened);
        setTotalPages(backendTotalPages);
      } catch {
        if (!isMounted) return;
        setBenefitData([]);
        setFilteredData([]);
        setTotalPages(1);
      } finally {
        if (isMounted) setTableLoading(false);
      }
    };

    fetchEmployeeBenefits();
    return () => {
      isMounted = false;
    };
  }, [
    isSystemAdmin,
    selectedTenant,
    page,
    selectedDepartment,
    selectedDesignation,
  ]);

  // ------------------- Local Filtering for Admin -------------------
  useEffect(() => {
    if (!isSystemAdmin) return;
    let filtered = [...benefitData];
    if (selectedTenant)
      filtered = filtered.filter(r => r.tenantId === selectedTenant);
    setFilteredData(filtered);
    setTotalPages(Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE)));
  }, [benefitData, selectedTenant, isSystemAdmin]);

  // ------------------- Pagination Slice -------------------
  const paginatedData = filteredData.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // ------------------- CSV Export -------------------
  const [exportLoading, setExportLoading] = useState(false);
  const csvEscape = (value: unknown) =>
    value == null ? '' : `"${String(value).replace(/"/g, '""')}"`;
  const handleDownload = async () => {
    if (isSystemAdmin) {
      setExportLoading(true);
      try {
        const blob = await employeeBenefitApi.exportAllTenantsEmployeeBenefits({
          tenant_id: selectedTenant || undefined,
          department_id: selectedDepartment || undefined,
          designation_id: selectedDesignation || undefined,
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.setAttribute('download', 'BenefitReport_AllTenants.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch {
        alert('Export failed. Please try again.');
      } finally {
        setExportLoading(false);
      }
      return;
    }
    if (!filteredData.length) {
      alert('No data to download.');
      return;
    }
    const csvHeader = [
      'Department',
      'Designation',
      'Employee Name',
      'Benefit Type',
      'Status',
    ];
    const rows = filteredData.map(row =>
      [
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

  // ------------------- Render -------------------
  return (
    <Box py={3}>
      {/* Header */}
      <Box
        display='flex'
        justifyContent='space-between'
        gap={3}
        flexWrap='wrap'
        alignItems='center'
        mb={2}
      >
        <Typography
          variant='h4'
          fontSize={{ xs: '32px', lg: '48px' }}
          fontWeight={600}
          gutterBottom
          mb={0}
        >
          Benefits Report
        </Typography>
        {isSystemAdmin && (
          <AppDropdown
            label='Tenant'
            options={[
              { value: '', label: 'All' },
              ...tenants.map(t => ({ value: t.id, label: t.name })),
            ]}
            value={selectedTenant}
            onChange={e => {
              setSelectedTenant(e.target.value as string);
              setPage(1);
            }}
            containerSx={{ minWidth: { xs: '100%', sm: 220 }, maxWidth: 420 }}
            size='small'
          />
        )}
      </Box>

      {/* Summary Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: '1fr 1fr',
            md: 'repeat(3, 1fr)',
          },
          gap: 2,
          mb: 3,
        }}
      >
        {[
          {
            title: 'Total Active Benefits',
            value: summary.totalActiveBenefits,
            icon: <AccountBalanceWalletIcon color='primary' />,
          },
          {
            title: 'Most Common Benefit Type',
            value: summary.mostCommonBenefitType,
            icon: <CardGiftcardIcon color='primary' />,
          },
          {
            title: 'Employees Covered',
            value: summary.totalEmployeesCovered,
            icon: <PeopleIcon color='primary' />,
          },
        ].map((card, index) => (
          <Box key={index}>
            <SummaryCard {...card} />
          </Box>
        ))}
      </Box>

      {/* Filters & CSV */}
      <Box
        mb={2}
        sx={{
          display: 'flex',
          gap: 2,
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'start' },
          justifyContent: 'space-between',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'start' },
          }}
        >
          <AppDropdown
            label='Department'
            options={[
              { value: '', label: 'All' },
              ...departments.map(d => ({ value: d.id, label: d.name })),
            ]}
            value={selectedDepartment}
            onChange={e => {
              setSelectedDepartment(e.target.value as string);
              setPage(1);
            }}
            disabled={isSystemAdmin && !selectedTenant}
            containerSx={{ width: { xs: '100%', sm: 220 }, maxWidth: 420 }}
            sx={{ width: '100%' }}
            size='small'
          />

          <AppDropdown
            label='Designation'
            options={[
              { value: '', label: 'All' },
              ...designations.map(d => ({ value: d.id, label: d.title })),
            ]}
            value={selectedDesignation}
            onChange={e => {
              setSelectedDesignation(e.target.value as string);
              setPage(1);
            }}
            disabled={!designations.length || (isSystemAdmin && !selectedTenant)}
            containerSx={{ width: { xs: '100%', sm: 220 }, maxWidth: 420 }}
            sx={{ width: '100%' }}
            size='small'
          />
        </Box>
        <Box
          display='flex'
          justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}
          sx={{ width: { xs: 'auto', sm: 'auto' } }}
        >
          {isManager ? (
            <AppButton
              variant='contained'
              variantType='primary'
              onClick={handleDownload}
              disabled={exportLoading}
              sx={{
                borderRadius: '6px',
                minWidth: 0,
                padding: '6px',
                height: 'auto',
              }}
              aria-label='Download CSV'
            >
              {exportLoading ? (
                <CircularProgress size={20} color='inherit' />
              ) : (
                <FileDownloadIcon aria-hidden='true' />
              )}
            </AppButton>
          ) : (
            <Tooltip title='Download CSV'>
              <span>
                <IconButton
                  color='primary'
                  onClick={handleDownload}
                  disabled={exportLoading}
                  sx={{
                  backgroundColor: 'primary.main',
                  color: 'white',
                  borderRadius: '6px',
                  padding: '6px',
                  '&:hover': { backgroundColor: 'primary.dark' },
                }}
              >
                {exportLoading ? (
                  <CircularProgress size={20} color='inherit' />
                ) : (
                  <FileDownloadIcon />
                )}
              </IconButton>
              </span>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Table */}
      <AppTable>
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
                <CircularProgress sx={{ color: 'var(--primary-dark-color)' }} />
              </TableCell>
            </TableRow>
          ) : paginatedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={isSystemAdmin ? 6 : 5} align='center'>
                No data available
              </TableCell>
            </TableRow>
          ) : (
            paginatedData.map((row, i) => (
              <TableRow key={i}>
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
          )}
        </TableBody>
      </AppTable>

      {/* Pagination */}
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
          Showing page {page} of {totalPages} ({paginatedData.length} records)
        </Typography>
      </Box>
    </Box>
  );
};

export default BenefitReport;
