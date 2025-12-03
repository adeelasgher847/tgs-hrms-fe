import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import {
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
import {
  getRoleName,
  isSystemAdmin as isSystemAdminFn,
} from '../../utils/roleUtils';

const itemsPerPage = 25;

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

const ITEMS_PER_PAGE = 10;

const BenefitReport: React.FC = () => {
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);
  const userRoleValue = user?.role;
  const isSystemAdmin = isSystemAdminFn(userRoleValue);

  const { language } = useLanguage();

  const labels = {
    en: {
      pageTitle: 'Benefits Report',
      tenantLabel: 'Tenant',
      totalActiveBenefits: 'Total Active Benefits',
      mostCommonBenefitType: 'Most Common Benefit Type',
      employeesCovered: 'Employees Covered',
      department: 'Department',
      designation: 'Designation',
      all: 'All',
      downloadCsv: 'Download CSV',
      employeeName: 'Employee Name',
      benefitType: 'Benefit Type',
      status: 'Status',
      noData: 'No data available',
      noDataToDownload: 'No data to download.',
      csvFileName: 'BenefitReport',
    },
    ar: {
      pageTitle: 'تقرير المزايا',
      tenantLabel: 'المؤجر',
      totalActiveBenefits: 'إجمالي المزايا النشطة',
      mostCommonBenefitType: 'النوع الأكثر شيوعًا',
      employeesCovered: 'الموظفون المغطون',
      department: 'القسم',
      designation: 'المسمى',
      all: 'الكل',
      downloadCsv: 'تصدير CSV',
      employeeName: 'اسم الموظف',
      benefitType: 'نوع الميزة',
      status: 'الحالة',
      noData: 'لا توجد بيانات',
      noDataToDownload: 'لا توجد بيانات للتنزيل.',
      csvFileName: 'تقرير_المزايا',
    },
  } as const;

  const L = labels[language as keyof typeof labels] || labels.en;

  const [summary, setSummary] = useState({
    tenant_id: 'all' as string,
    totalActiveBenefits: 0,
    mostCommonBenefitType: '-',
    totalEmployeesCovered: 0,
  });

  // using interfaces declared above for BenefitRow, Department, Designation
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
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [paginationLimit, setPaginationLimit] = useState<number | null>(null);

  // ------------------- Fetch Summary -------------------
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

  // ------------------- Fetch Tenants -------------------
  useEffect(() => {
    if (!isSystemAdmin) return;
    const fetchTenants = async () => {
      try {
        const data = await systemEmployeeApiService.getAllTenants(true);
        setTenants(data || []);
        if ((data || []).length > 0)
          setSelectedTenant(prev => prev || data[0].id);
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
      } catch (error) {
        console.error('Error fetching departments:', error);
        setDepartments([]);
      }
    };
    fetchDepartments();
  }, []);

  // ------------------- Fetch Designations -------------------
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

  // ------------------- Fetch Employee Benefits -------------------
  useEffect(() => {
    let isMounted = true;
    const fetchEmployeeBenefits = async () => {
      setTableLoading(true);
      try {
        let flattened: BenefitRow[] = [];
        let backendTotalPages = 1;

        if (isSystemAdmin) {
          const response =
            await employeeBenefitApi.getAllTenantsEmployeeBenefits();
          flattened = (response.items || []).flatMap((tenant: any) =>
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
          backendTotalPages = response.totalPages || 1;
        } else {
          const params: any = { page };
          if (selectedDepartment) params.department = selectedDepartment;
          if (selectedDesignation) params.designation = selectedDesignation;
          if (selectedTenant) params.tenant_id = selectedTenant;

          const response =
            await employeeBenefitApi.getFilteredEmployeeBenefits(params);
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
  const csvEscape = (value: unknown) =>
    value == null ? '' : `"${String(value).replace(/"/g, '""')}"`;
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

  if (tableLoading)
    return (
      <Box display='flex' justifyContent='center' mt={4}>
        <CircularProgress />
      </Box>
    );

  // ------------------- Render -------------------
  return (
    <Box py={3}>
      <Box
        display='flex'
        flexDirection={language === 'ar' ? 'row-reverse' : 'row'}
        justifyContent='space-between'
        gap={3}
        flexWrap='wrap'
        alignItems='center'
        mb={2}
      >
        <Typography
          variant='h4'
          fontSize={{ xs: '25px', sm: '34px' }}
          fontWeight={600}
          gutterBottom
          mb={0}
        >
          {L.pageTitle}
        </Typography>

        {isSystemAdmin && (
          <FormControl size='small' sx={{ minWidth: 220 }}>
            <InputLabel>{L.tenantLabel}</InputLabel>
            <Select
              value={selectedTenant}
              onChange={e => {
                const val = e.target.value as string;
                setSelectedTenant(val);
                // reset dependent filters on tenant change
                setSelectedDepartment('');
                setSelectedDesignation('');
              }}
              label={L.tenantLabel}
            >
              <MenuItem value=''>{L.all}</MenuItem>
              {tenants.map(t => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
            title: L.totalActiveBenefits,
            value: summary.totalActiveBenefits,
            icon: <AccountBalanceWalletIcon color='primary' />,
          },
          {
            title: L.mostCommonBenefitType,
            value: summary.mostCommonBenefitType,
            icon: <CardGiftcardIcon color='secondary' />,
          },
          {
            title: L.employeesCovered,
            value: summary.totalEmployeesCovered,
            icon: <PeopleIcon color='primary' />,
          },
        ].map((card, index) => (
          <Box key={index}>
            <SummaryCard {...card} />
          </Box>
        ))}
      </Box>

      <Box display='flex' justifyContent='space-between' alignItems='center'>
        <Box display='flex' gap={2} mb={2}>
          <FormControl size='small' sx={{ minWidth: 220 }}>
            <InputLabel>{L.department}</InputLabel>
            <Select
              value={selectedDepartment}
              onChange={e => {
                setSelectedDepartment(e.target.value as string);
                setSelectedDesignation('');
              }}
              label={L.department}
            >
              <MenuItem value=''>{L.all}</MenuItem>
              {departments.map(dept => (
                <MenuItem key={dept.id} value={dept.id}>
                  {dept.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size='small' sx={{ minWidth: 220 }}>
            <InputLabel>{L.designation}</InputLabel>
            <Select
              value={selectedDesignation}
              onChange={e => setSelectedDesignation(e.target.value as string)}
              label={L.designation}
              disabled={!designations.length}
            >
              <MenuItem value=''>{L.all}</MenuItem>
              {designations.map(des => (
                <MenuItem key={des.id} value={des.title}>
                  {des.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Tooltip title={L.downloadCsv}>
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

      {/* Table */}
      <Paper sx={{ borderRadius: 1, boxShadow: 'none' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                {isSystemAdmin && (
                  <TableCell sx={{ fontWeight: 600 }}>
                    {L.tenantLabel}
                  </TableCell>
                )}
                <TableCell sx={{ fontWeight: 600 }}>{L.department}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{L.designation}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{L.employeeName}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{L.benefitType}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{L.status}</TableCell>
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
                    {L.noData}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

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

      {filteredData.length > 0 && (
        <Box textAlign='center' mb={2}>
          <Typography variant='body2' color='text.secondary'>
            Showing page {page} of {totalPages} ({filteredData.length} total
            records{paginationLimit ? `, ${paginationLimit} per page` : ''})
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default BenefitReport;
