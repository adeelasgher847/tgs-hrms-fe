
import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    useTheme,
    CircularProgress,
} from '@mui/material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { payrollApi, type PayrollRecord } from '../../api/payrollApi';
import {
    departmentApiService,
    type BackendDepartment,
} from '../../api/departmentApi';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import AppDropdown from '../common/AppDropdown';
import { useLanguage } from '../../hooks/useLanguage';
import AppCard from '../common/AppCard';

interface SalaryChartItem {
    id?: string;
    name: string; // Employee Name or Department Name
    paid: number;
    unpaid: number;
    total: number;
    departmentId?: string;
    departmentName?: string;
}

// Type matching the API response structure for Salary Items
interface SalaryStructureItem {
    employee: {
        id: string;
        user: {
            id: string;
            first_name: string;
            last_name: string;
        };
        department: {
            id: string;
            name: string;
        };
    };
    salary: {
        baseSalary: string | number;
    } | null;
}

const SalaryOverviewChart: React.FC = () => {
    const theme = useTheme();
    const { language } = useLanguage();
    const { showError } = useErrorHandler();

    // Data State
    const [chartData, setChartData] = useState<SalaryChartItem[]>([]);
    const [departments, setDepartments] = useState<BackendDepartment[]>([]);

    // Loading States
    const [loading, setLoading] = useState(true);

    // Filter State
    const [selectedDeptId, setSelectedDeptId] = useState('all');

    // Cache data
    const [dataCache, setDataCache] = useState<{
        items: SalaryStructureItem[],
        depts: BackendDepartment[],
        payrollMap: Map<string, string> // employeeId -> status
    } | null>(null);

    // Helper to format currency
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'SAR',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const processData = (
        items: SalaryStructureItem[],
        depts: BackendDepartment[],
        payrollMap: Map<string, string>,
        filterDeptId: string
    ) => {
        if (filterDeptId === 'all') {
            // Aggregate by Department
            // Map<DeptID, { paid: number, unpaid: number, name: string }>
            const deptStats = new Map<string, { paid: number, unpaid: number, name: string }>();

            // Pre-fill from departments list to ensure all depts are present
            depts.forEach(d => {
                deptStats.set(d.id, { paid: 0, unpaid: 0, name: d.name });
            });

            items.forEach(item => {
                const dId = item.employee?.department?.id;
                const dName = item.employee?.department?.name;
                const empId = item.employee?.id;

                if (!dId) return;

                // Parse salary
                const salVal = item.salary?.baseSalary ? Number(item.salary.baseSalary) : 0;

                // Ensure entry exists for this department
                if (!deptStats.has(dId)) {
                    // Use optional assertion or default for name
                    const name = dName || 'Unknown Department';
                    deptStats.set(dId, { paid: 0, unpaid: 0, name });
                }

                const stat = deptStats.get(dId);
                if (stat) {
                    const status = (payrollMap.get(empId) || 'pending').toLowerCase();
                    const isPaid = status === 'paid';

                    if (isPaid) {
                        stat.paid += salVal;
                    } else {
                        stat.unpaid += salVal;
                    }

                    // Update name if we just initialized it from depts logic or if missing
                    if (!stat.name && dName) stat.name = dName;
                }
            });

            const data: SalaryChartItem[] = [];
            deptStats.forEach((val, key) => {
                // Determine total to possibly filter out empty rows if needed (optional)
                // For now, we show all departments found or from the list
                if (val.name) {
                    data.push({
                        id: key,
                        name: val.name,
                        departmentId: key,
                        departmentName: val.name,
                        paid: val.paid,
                        unpaid: val.unpaid,
                        total: val.paid + val.unpaid
                    });
                }
            });
            setChartData(data);

        } else {
            // Filter by Specific Department -> Show Employees
            const data: SalaryChartItem[] = [];

            const targetItems = items.filter(item => item.employee?.department?.id === filterDeptId);

            targetItems.forEach(item => {
                const u = item.employee?.user;
                const fullName = (u?.first_name && u?.last_name)
                    ? `${u.first_name} ${u.last_name} `
                    : (u?.first_name || 'Unknown');

                const salVal = item.salary?.baseSalary ? Number(item.salary.baseSalary) : 0;
                const dName = item.employee?.department?.name || 'Unknown';
                const empId = item.employee.id;

                const status = (payrollMap.get(empId) || 'pending').toLowerCase();
                const isPaid = status === 'paid';

                data.push({
                    id: item.employee.id,
                    name: fullName,
                    departmentName: dName,
                    departmentId: filterDeptId,
                    paid: isPaid ? salVal : 0,
                    unpaid: isPaid ? 0 : salVal,
                    total: salVal
                });
            });
            setChartData(data);
        }
    };

    useEffect(() => {
        if (dataCache) {
            processData(dataCache.items, dataCache.depts, dataCache.payrollMap, selectedDeptId);
        }
    }, [selectedDeptId, dataCache]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                // 1. Fetch Departments (for Dropdown)
                const depts = await departmentApiService.getAllDepartments();

                // 2. Fetch All Salary Structures
                // Using pagination loop
                let page = 1;
                const allItems: SalaryStructureItem[] = [];
                let hasMore = true;
                const MAX_PAGES = 50; // Safety limit to prevent infinite loops

                while (hasMore && page <= MAX_PAGES) {
                    const res = await payrollApi.getAllEmployeeSalaries({ page, limit: 50 });

                    // Normalize items from response
                    const pageItems = res.items || [];

                    if (pageItems.length === 0) {
                        hasMore = false;
                    } else {
                        // Cast to our interface
                        allItems.push(...(pageItems as unknown as SalaryStructureItem[]));

                        if (res.totalPages && page < res.totalPages) {
                            page++;
                        } else {
                            hasMore = false;
                        }
                    }
                }

                // 3. Fetch Payroll Records for Current Month
                const today = new Date();
                const currentMonth = today.getMonth() + 1;
                const currentYear = today.getFullYear();

                // We'll fetch all pages of payroll records for current month
                page = 1;
                hasMore = true;
                const payrollStatusMap = new Map<string, string>();

                while (hasMore && page <= MAX_PAGES) {
                    const payrollRes = await payrollApi.getPayrollRecords({
                        month: currentMonth,
                        year: currentYear,
                        page,
                        limit: 50
                    });

                    const pItems = payrollRes.items || [];
                    if (pItems.length === 0) {
                        hasMore = false;
                    } else {
                        pItems.forEach((rec: PayrollRecord) => {
                            payrollStatusMap.set(rec.employee_id, rec.status);
                        });

                        if (payrollRes.totalPages && page < payrollRes.totalPages) {
                            page++;
                        } else {
                            hasMore = false;
                        }
                    }
                }

                // Sort depts for dropdown consistency
                depts.sort((a, b) => a.name.localeCompare(b.name));

                setDataCache({ items: allItems, depts: depts, payrollMap: payrollStatusMap });
                setDepartments(depts);

            } catch (e) {
                showError(e);
            }
            finally {
                setLoading(false);
            }
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Derive department options
    const departmentOptions = [
        {
            value: 'all',
            label: language === 'ar' ? 'كل الأقسام' : 'All Departments',
        },
        ...departments.map(d => ({
            value: d.id,
            label: d.name,
        })),
    ];

    if (loading) {
        return (
            <Box display='flex' justifyContent='center' p={3}>
                <CircularProgress />
            </Box>
        );
    }

    const getTitle = () => {
        if (selectedDeptId === 'all') return language === 'ar' ? 'نظرة عامة على الرواتب الشهرية' : 'Monthly Salary Overview';
        const d = departments.find(x => x.id === selectedDeptId);
        return language === 'ar' ? `الرواتب: ${d?.name || ''} ` : `Salary: ${d?.name || ''} `;
    };

    return (
        <AppCard
            padding={3}
            sx={{
                height: '400px',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                    flexWrap: 'wrap',
                    gap: 2,
                }}
            >
                <Typography
                    fontWeight={500}
                    fontSize={{ xs: '20px', lg: '28px' }}
                    sx={{ color: theme.palette.text.primary }}
                >
                    {getTitle()}
                </Typography>

                <Box sx={{ minWidth: 200 }}>
                    <AppDropdown
                        label={language === 'ar' ? 'القسم' : 'Department'}
                        value={selectedDeptId}
                        onChange={e => setSelectedDeptId(e.target.value as string)}
                        options={departmentOptions}
                        showLabel={false}
                        sx={{
                            height: 40,
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: theme.palette.divider,
                            },
                        }}
                    />
                </Box>
            </Box>

            {chartData.length > 0 ? (
                <Box sx={{ flexGrow: 1, minHeight: 0, width: '100%' }}>
                    <ResponsiveContainer width='100%' height='100%'>
                        <BarChart
                            data={chartData}
                            margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray='3 3' />
                            <XAxis dataKey='name' hide={chartData.length > 15} />
                            <YAxis />
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            <Legend />
                            <Bar
                                dataKey='paid'
                                stackId="a"
                                fill='#2462A5'
                                name={language === 'ar' ? 'مدفوع' : 'Paid'}
                                onClick={(data) => {
                                    if (selectedDeptId === 'all' && data.departmentId) {
                                        setSelectedDeptId(data.departmentId);
                                    }
                                }}
                                cursor={selectedDeptId === 'all' ? 'pointer' : 'default'}
                            />
                            <Bar
                                dataKey='unpaid'
                                stackId="a"
                                fill='#D32F2F'
                                name={language === 'ar' ? 'غير مدفوع' : 'Unpaid'}
                                onClick={(data) => {
                                    if (selectedDeptId === 'all' && data.departmentId) {
                                        setSelectedDeptId(data.departmentId);
                                    }
                                }}
                                cursor={selectedDeptId === 'all' ? 'pointer' : 'default'}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </Box>
            ) : (
                <Box
                    display='flex'
                    justifyContent='center'
                    alignItems='center'
                    height='100%'
                >
                    <Typography color='textSecondary'>
                        {language === 'ar' ? 'لا توجد بيانات' : 'No data available'}
                    </Typography>
                </Box>
            )}
        </AppCard>
    );
};

export default SalaryOverviewChart;
