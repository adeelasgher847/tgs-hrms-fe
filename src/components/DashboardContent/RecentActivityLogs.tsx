import React from 'react';
import {
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useOutletContext } from 'react-router-dom';
import type { RecentLog } from '../../api/systemDashboardApi';

const timeAgo = (dateString: string) => {
  const now = new Date();
  const then = new Date(dateString);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const getLogIcon = (action: string, method: string) => {
  if (action?.toLowerCase().includes('add') || method === 'POST')
    return <PersonAddIcon color='success' />;
  if (action?.toLowerCase().includes('delete') || method === 'DELETE')
    return <DeleteIcon color='error' />;
  if (action?.toLowerCase().includes('update') || method === 'PUT')
    return <EditIcon color='warning' />;
  return <AccessTimeIcon color='info' />;
};

interface RecentActivityLogsProps {
  logs: RecentLog[];
}

const RecentActivityLogs: React.FC<RecentActivityLogsProps> = ({ logs }) => {
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();

  const bgColor = darkMode ? '#111' : '#fff';
  const textColor = darkMode ? '#8f8f8f' : '#000';

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 1,
        backgroundColor: bgColor,
        boxShadow: 'none',
        height: 420,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      elevation={3}
    >
      <Typography
        variant='h6'
        fontWeight='bold'
        color={textColor}
        mb={2}
        sx={{ flexShrink: 0 }}
      >
        Recent Activity Logs
      </Typography>

      {logs && logs.length > 0 ? (
        <List
          dense
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            pr: 1.5,
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: darkMode ? '#444' : '#ccc',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: darkMode ? '#111' : '#f5f5f5',
              borderRadius: '4px',
            },
          }}
        >
          {logs.map(log => (
            <ListItem
              key={log.id}
              sx={{
                mb: 1,
                borderBottom: '1px solid',
                borderColor: darkMode ? '#333' : '#eee',
              }}
            >
              <ListItemIcon>{getLogIcon(log.action, log.method)}</ListItemIcon>
              <ListItemText
                primary={log.action || 'System Activity'}
                secondary={timeAgo(log.createdAt)}
                primaryTypographyProps={{ color: textColor }}
                secondaryTypographyProps={{
                  color: darkMode ? '#666' : '#999',
                }}
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography color={textColor} textAlign='center' mt={5}>
          No recent activity logs found
        </Typography>
      )}
    </Paper>
  );
};

export default RecentActivityLogs;
