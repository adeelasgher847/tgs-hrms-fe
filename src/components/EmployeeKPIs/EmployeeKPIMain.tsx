import React from 'react';
import {
    Box,
    Typography,
} from '@mui/material';
import { isManager } from '../../utils/auth';
import MyKPIs from './MyKPIs';
import TeamKPIs from './TeamKPIs';


const EmployeeKPIMain: React.FC = () => {
    const isMgr = isManager();

    return (
        <Box>
            <Box mb={2}>
                <Typography
                    variant='h4'
                    fontWeight={600}
                    fontSize={{ xs: '32px', lg: '48px' }}
                >
                    Employee KPIs
                </Typography>
            </Box>

            {isMgr ? (
                <TeamKPIs />
            ) : (
                <MyKPIs />
            )}
        </Box>
    );
};

export default EmployeeKPIMain;
