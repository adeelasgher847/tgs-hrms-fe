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

const ITEMS_PER_PAGE = 10;

const BenefitReport = () => {
  const [summary, setSummary] = useState({
    totalActiveBenefits: 0,
    mostCommonBenefitType: '-',
    totalEmployeesCovered: 0,
  });

  const [benefitData, setBenefitData] = useState<unknown[]>([]);
  const [filteredData, setFilteredData] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  const [departments, setDepartments] = useState<unknown[]>([]);
  const [designations, setDesignations] = useState<unknown[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDesignation, setSelectedDesignation] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  useEffect(() => {
    const fetchBenefitSummary = async () => {
      try {
        const data = await benefitsApi.getBenefitSummary();
        setSummary({
          totalActiveBenefits: data.totalActiveBenefits,
          mostCommonBenefitType: data.mostCommonBenefitType,
          totalEmployeesCovered: data.totalEmployeesCovered,
        });
      } catch (error) {
        console.error('Error fetching benefit summary data:', error);
      }
    };
    fetchBenefitSummary();
  }, []);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await departmentApiService.getAllDepartments();
        setDepartments(data);
      } catch (error) {
        console.error('Error fetching departments:', error);
      }
    };
    fetchDepartments();
  }, []);

  useEffect(() => {
    const fetchDesignations = async () => {
      try {
        if (selectedDepartment) {
          const response =
            await designationApiService.getDesignationsByDepartment(
              selectedDepartment,
              null // Pass null to get all designations for dropdown
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

  useEffect(() => {
    const fetchEmployeeBenefits = async () => {
      setLoading(true);
      try {
        const response = await employeeBenefitApi.getFilteredEmployeeBenefits({
          page: 1,
        });

        const flattened = response.flatMap(
          (emp: {
            benefits: unknown[];
            department?: string;
            designation?: string;
            employeeName?: string;
          }) =>
            emp.benefits.map(
              (b: {
                type?: string;
                statusOfAssignment?: string;
                status?: string;
              }) => ({
                department: emp.department || '-',
                designation: emp.designation || '-',
                employeeName: emp.employeeName || '-',
                benefitType: b.type || '-',
                status: b.statusOfAssignment || b.status || '-',
              })
            )
        );

        setBenefitData(flattened);
        setFilteredData(flattened);
        setTotalPages(
          Math.max(1, Math.ceil(flattened.length / ITEMS_PER_PAGE))
        );
      } catch (error) {
        console.error('Error fetching employee benefits data:', error);
        setBenefitData([]);
        setFilteredData([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeBenefits();
  }, []);

  useEffect(() => {
    let filtered = [...benefitData];

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
  }, [selectedDepartment, selectedDesignation, benefitData, departments]);

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
      'Department',
      'Designation',
      'Employee Name',
      'Benefit Type',
      'Status',
    ];

    const rows = filteredData.map(
      (row: {
        department?: string;
        designation?: string;
        employeeName?: string;
        benefitType?: string;
        status?: string;
      }) =>
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

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box py={3}>
      <Box display='flex' justifyContent='space-between' alignItems='center'>
        <Typography variant='h4' fontWeight={600} gutterBottom>
          Benefits Report
        </Typography>
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
                  setSelectedDepartment(e.target.value);
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
                onChange={e => setSelectedDesignation(e.target.value)}
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

      <Paper sx={{ borderRadius: 2 }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Designation</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Employee Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Benefit Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map(
                  (
                    row: {
                      department?: string;
                      designation?: string;
                      employeeName?: string;
                      benefitType?: string;
                      status?: string;
                    },
                    index
                  ) => (
                    <TableRow key={index}>
                      <TableCell>{row.department}</TableCell>
                      <TableCell>{row.designation}</TableCell>
                      <TableCell>{row.employeeName}</TableCell>
                      <TableCell>{row.benefitType}</TableCell>
                      <TableCell>{row.status}</TableCell>
                    </TableRow>
                  )
                )
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
      </Paper>
      <Box display='flex' justifyContent='center' my={2}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, newPage) => setPage(newPage)}
          color='primary'
        />
      </Box>

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
