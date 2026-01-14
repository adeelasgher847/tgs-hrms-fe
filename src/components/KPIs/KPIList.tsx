import React, { useState } from 'react';
import {
    Box,
    Typography,
    Tabs,
    Tab,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import { isAdmin, isHRAdmin } from '../../utils/auth';
import KPIOverview from './KPIOverview';
import AllEmployeeKPIs from './AllEmployeeKPIs';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role='tabpanel'
            hidden={value !== index}
            id={`kpi-tabpanel-${index}`}
            aria-labelledby={`kpi-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

const KPIList: React.FC = () => {
    const [tabValue, setTabValue] = useState(0);
    const hasAdminAccess = isAdmin() || isHRAdmin();

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    if (!hasAdminAccess) {
        return (
            <Box p={3}>
                <Typography variant="h5" color="error">
                    Access Denied. You do not have permission to view this page.
                </Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Box display='flex' alignItems='center' gap={1} mb={2}>
                <Typography
                    variant='h4'
                    fontWeight={600}
                    fontSize={{ xs: '32px', lg: '48px' }}
                >
                    KPI Management
                </Typography>
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    aria-label='kpi management tabs'
                    variant='standard'
                >
                    <Tab
                        label="KPI Overview"
                        icon={<BusinessIcon />}
                        iconPosition='start'
                    />
                    <Tab
                        label="Employee KPIs"
                        icon={<PeopleIcon />}
                        iconPosition='start'
                    />
                </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
                <KPIOverview />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
                <AllEmployeeKPIs />
            </TabPanel>
        </Box>
    );
};

export default KPIList;
