import { Box, Card, CardContent, Chip, CircularProgress, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { listBenefits } from '../../api/benefits';
import type { Benefit } from '../../types/benefits';

export default function ReportingView() {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listBenefits({ page: 1, pageSize: 100 })
      .then((res) => setBenefits(res.items))
      .finally(() => setLoading(false));
  }, []);

  const totalActive = useMemo(() => benefits.filter((b) => b.status === 'active').length, [benefits]);
  const mostCommonType = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of benefits) map.set(b.type, (map.get(b.type) || 0) + 1);
    let max = 0; let key = 'n/a';
    for (const [k, v] of map) { if (v > max) { max = v; key = k; } }
    return key;
  }, [benefits]);

  // Mock data for department/designation assignments
  const departmentAssignments = useMemo(() => [
    { department: 'Engineering', designation: 'Software Engineer', benefitType: 'Health', employeesCount: 15, totalCost: '$2,500' },
    { department: 'Engineering', designation: 'Senior Engineer', benefitType: 'Health', employeesCount: 8, totalCost: '$1,800' },
    { department: 'Engineering', designation: 'Software Engineer', benefitType: 'Dental', employeesCount: 12, totalCost: '$800' },
    { department: 'HR', designation: 'HR Manager', benefitType: 'Health', employeesCount: 3, totalCost: '$600' },
    { department: 'HR', designation: 'HR Specialist', benefitType: 'Vision', employeesCount: 5, totalCost: '$400' },
    { department: 'Finance', designation: 'Accountant', benefitType: 'Health', employeesCount: 6, totalCost: '$1,200' },
    { department: 'Finance', designation: 'Financial Analyst', benefitType: 'Retirement', employeesCount: 4, totalCost: '$1,000' },
  ], []);

  const totalEmployeesCovered = useMemo(() => 
    departmentAssignments.reduce((sum, dept) => sum + dept.employeesCount, 0), 
    [departmentAssignments]
  );

  return (
    <Stack spacing={3}>
      <Typography variant="h5" fontWeight="bold">Benefits Reporting</Typography>
      
      {/* Summary Cards */}
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
        }}
      >
        <Card sx={{ color: 'black' }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>Total Active Benefits</Typography>
            <Typography variant="h3" fontWeight="bold">{totalActive}</Typography>
          </CardContent>
        </Card>
        
        <Card sx={{color: 'black' }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>Most Common Benefit Type</Typography>
            <Typography variant="h3" fontWeight="bold" sx={{ textTransform: 'capitalize' }}>{mostCommonType}</Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ color: 'black' }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>Total Employees Covered</Typography>
            <Typography variant="h3" fontWeight="bold">{totalEmployeesCovered}</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Department/Designation Assignments Table */}
      <Typography variant="h6" gutterBottom>Benefits by Department & Designation</Typography>
      <Card>
        <CardContent>
          {loading ? (
            <Stack alignItems="center" py={4}>
              <CircularProgress />
            </Stack>
          ) : (
            <Box sx={{ overflowX: 'auto', width: '100%' }}>
              <Table size="small" sx={{ minWidth: 500 }}>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Department</strong></TableCell>
                    <TableCell><strong>Designation</strong></TableCell>
                    <TableCell><strong>Benefit Type</strong></TableCell>
                    <TableCell align="right"><strong>Employees</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {departmentAssignments.map((assignment, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {assignment.department}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {assignment.designation}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={assignment.benefitType} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {assignment.employeesCount}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}


