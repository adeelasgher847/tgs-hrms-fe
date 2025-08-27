import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  IconButton,
  Chip,
  Skeleton,
  Alert,
  TablePagination,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import UserAvatar from '../common/UserAvatar';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useLanguage } from '../../context/LanguageContext';
import { teamApiService } from '../../api/teamApi';
import type { TeamMember, Team } from '../../api/teamApi';
import { snackbar } from '../../utils/snackbar';

interface AvailableEmployeesProps {
  darkMode?: boolean;
}

const AvailableEmployees: React.FC<AvailableEmployeesProps> = ({
  darkMode = false,
}) => {
  const [employees, setEmployees] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTeamDialog, setShowTeamDialog] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<TeamMember | null>(
    null
  );
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const { language } = useLanguage();

  const labels = {
    en: {
      name: 'Name',
      email: 'Email',
      designation: 'Designation',
      department: 'Department',
      actions: 'Actions',
      addToTeam: 'Add to Team',
      noEmployees: 'No available employees found',
      loading: 'Loading employees...',
      error: 'Failed to load employees',
      search: 'Search employees...',
      employeeAdded: 'Employee added to team successfully',
    },
    ar: {
      name: 'الاسم',
      email: 'البريد الإلكتروني',
      designation: 'المسمى الوظيفي',
      department: 'القسم',
      actions: 'الإجراءات',
      addToTeam: 'إضافة للفريق',
      noEmployees: 'لم يتم العثور على موظفين متاحين',
      loading: 'جاري تحميل الموظفين...',
      error: 'فشل في تحميل الموظفين',
      search: 'البحث عن الموظفين...',
      employeeAdded: 'تم إضافة الموظف للفريق بنجاح',
    },
  };

  const lang = labels[language];

  // Generate initials for avatar
  const generateInitials = (firstName: string, lastName: string): string => {
    try {
      const first = firstName?.charAt(0)?.toUpperCase() || '';
      const last = lastName?.charAt(0)?.toUpperCase() || '';
      return `${first}${last}` || 'U';
    } catch (error) {
      console.error('Error generating initials:', error);
      return 'U';
    }
  };

  // Generate avatar color
  const generateAvatarColor = (name: string): string => {
    try {
      const colors = [
        '#1976d2',
        '#388e3c',
        '#f57c00',
        '#d32f2f',
        '#7b1fa2',
        '#303f9f',
        '#ff6f00',
        '#388e3c',
        '#c2185b',
        '#0097a7',
      ];
      const index = (name || 'Unknown').charCodeAt(0) % colors.length;
      return colors[index];
    } catch (error) {
      console.error('Error generating avatar color:', error);
      return '#1976d2';
    }
  };

  // Load available employees
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await teamApiService.getAvailableEmployees(
          page + 1,
          searchTerm
        );
        setEmployees(response.items || []);
        setTotal(response.total || 0);
      } catch {
        setError(lang.error);
        setEmployees([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
  }, [page, rowsPerPage, searchTerm, lang.error]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    setPage(0);
  };

  // Load teams for selection
  useEffect(() => {
    const loadTeams = async () => {
      try {
        const response = await teamApiService.getAllTeams(1);
        setTeams(response.items || []);
      } catch (error) {
        console.error('Error loading teams:', error);
        setTeams([]);
      }
    };

    if (showTeamDialog) {
      loadTeams();
    }
  }, [showTeamDialog]);

  const handleAddToTeam = async (employee: TeamMember) => {
    setSelectedEmployee(employee);
    setSelectedEmployeeId(employee.id);
    setShowTeamDialog(true);
  };

  const handleConfirmAddToTeam = async () => {
    if (!selectedTeamId) {
      snackbar.error('Please select a team');
      return;
    }

    // Find the selected team
    const team = teams.find(t => t.id === selectedTeamId);
    if (team) {
      setSelectedTeam(team);
      setShowConfirmDialog(true);
      setShowTeamDialog(false);
    }
  };

  const handleConfirmAddToTeamFinal = async () => {
    if (!selectedTeamId || !selectedEmployeeId) {
      snackbar.error('Missing required data');
      return;
    }

    try {
      // Call the actual API
      await teamApiService.addMemberToTeam(selectedTeamId, selectedEmployeeId);

      // Remove the employee from the available list
      setEmployees(prev => prev.filter(emp => emp.id !== selectedEmployeeId));
      setTotal(prev => prev - 1);

      // Close dialogs and reset
      setShowConfirmDialog(false);
      setShowTeamDialog(false);
      setSelectedEmployeeId('');
      setSelectedTeamId('');
      setSelectedEmployee(null);
      setSelectedTeam(null);

      snackbar.success(lang.employeeAdded);

      // Trigger auto-render for other components
      window.dispatchEvent(new CustomEvent('teamUpdated'));
    } catch (error) {
      console.error('Error adding employee to team:', error);
      snackbar.error('Failed to add employee to team. Please try again.');
    }
  };

  const handleCloseTeamDialog = () => {
    setShowTeamDialog(false);
    setSelectedEmployeeId('');
    setSelectedTeamId('');
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant='rectangular' height={400} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity='error' sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder={lang.search}
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: darkMode ? '#2d2d2d' : '#fff',
              color: darkMode ? '#fff' : '#000',
            },
          }}
        />
      </Box>

      {employees.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 4,
            color: darkMode ? '#ccc' : '#666',
          }}
        >
          <PersonIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
          <Typography variant='h6'>{lang.noEmployees}</Typography>
        </Box>
      ) : (
        <>
          <TableContainer
            component={Paper}
            sx={{ backgroundColor: darkMode ? '#2d2d2d' : '#fff' }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{ color: darkMode ? '#fff' : '#000', fontWeight: 600 }}
                  >
                    {lang.name}
                  </TableCell>
                  <TableCell
                    sx={{ color: darkMode ? '#fff' : '#000', fontWeight: 600 }}
                  >
                    {lang.email}
                  </TableCell>
                  <TableCell
                    sx={{ color: darkMode ? '#fff' : '#000', fontWeight: 600 }}
                  >
                    {lang.designation}
                  </TableCell>
                  <TableCell
                    sx={{ color: darkMode ? '#fff' : '#000', fontWeight: 600 }}
                  >
                    {lang.department}
                  </TableCell>
                  <TableCell
                    sx={{ color: darkMode ? '#fff' : '#000', fontWeight: 600 }}
                  >
                    {lang.actions}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees
                  .filter(
                    employee =>
                      employee?.user?.first_name && employee?.user?.last_name
                  )
                  .map(employee => (
                    <TableRow key={employee.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <UserAvatar
                            user={{
                              first_name: employee.user?.first_name || '',
                              last_name: employee.user?.last_name || '',
                              profile_pic: employee.user?.profile_pic,
                            }}
                            size={32}
                            clickable={false}
                            sx={{ mr: 2 }}
                          />
                          <Typography
                            sx={{ color: darkMode ? '#fff' : '#000' }}
                          >
                            {employee.user?.first_name || 'Unknown'}{' '}
                            {employee.user?.last_name || 'User'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: darkMode ? '#ccc' : '#666' }}>
                        {employee.user?.email || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={employee.designation?.title || 'N/A'}
                          size='small'
                          sx={{
                            backgroundColor: '#484c7f',
                            color: 'white',
                            fontSize: '0.75rem',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: darkMode ? '#ccc' : '#666' }}>
                        {employee.department?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size='small'
                          onClick={() => handleAddToTeam(employee)}
                          sx={{ color: '#484c7f' }}
                          title={lang.addToTeam}
                        >
                          <AddIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component='div'
            count={total}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
            sx={{
              color: darkMode ? '#fff' : '#000',
              '& .MuiTablePagination-selectIcon': {
                color: darkMode ? '#fff' : '#000',
              },
            }}
          />
        </>
      )}

      {/* Team Selection Dialog */}
      <Dialog
        open={showTeamDialog}
        onClose={handleCloseTeamDialog}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle sx={{ color: darkMode ? '#fff' : '#000' }}>
          Select Team to Add Employee
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel sx={{ color: darkMode ? '#ccc' : '#666' }}>
              Select Team
            </InputLabel>
            <Select
              value={selectedTeamId}
              onChange={e => setSelectedTeamId(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: darkMode ? '#555' : '#ccc',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: darkMode ? '#888' : '#999',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#484c7f',
                },
                '& .MuiSelect-select': { color: darkMode ? '#fff' : '#000' },
              }}
            >
              <MenuItem value='' disabled>
                Select a team
              </MenuItem>
              {teams.map(team => (
                <MenuItem key={team.id} value={team.id}>
                  {team.name} - {team.description}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTeamDialog}>Cancel</Button>
          <Button
            onClick={handleConfirmAddToTeam}
            variant='contained'
            disabled={!selectedTeamId}
            sx={{ backgroundColor: '#484c7f' }}
          >
            Add to Team
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        maxWidth='sm'
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: darkMode ? '#2d2d2d' : '#fff',
            color: darkMode ? '#fff' : '#000',
          },
        }}
      >
        <DialogTitle sx={{ color: darkMode ? '#fff' : '#000' }}>
          Confirm Add to Team
        </DialogTitle>
        <DialogContent>
          {selectedEmployee && selectedTeam && (
            <Box sx={{ mt: 2 }}>
              <Typography variant='body1' sx={{ mb: 2 }}>
                Are you sure you want to add{' '}
                <strong>
                  {selectedEmployee.user?.first_name}{' '}
                  {selectedEmployee.user?.last_name}
                </strong>{' '}
                to team <strong>{selectedTeam.name}</strong>?
              </Typography>
              <Box
                sx={{
                  p: 2,
                  backgroundColor: darkMode ? '#444' : '#f5f5f5',
                  borderRadius: 1,
                }}
              >
                <Typography
                  variant='body2'
                  sx={{ color: darkMode ? '#ccc' : '#666' }}
                >
                  <strong>Employee:</strong> {selectedEmployee.user?.first_name}{' '}
                  {selectedEmployee.user?.last_name}
                </Typography>
                <Typography
                  variant='body2'
                  sx={{ color: darkMode ? '#ccc' : '#666' }}
                >
                  <strong>Email:</strong> {selectedEmployee.user?.email}
                </Typography>
                <Typography
                  variant='body2'
                  sx={{ color: darkMode ? '#ccc' : '#666' }}
                >
                  <strong>Designation:</strong>{' '}
                  {selectedEmployee.designation?.title}
                </Typography>
                <Typography
                  variant='body2'
                  sx={{ color: darkMode ? '#ccc' : '#666' }}
                >
                  <strong>Team:</strong> {selectedTeam.name} -{' '}
                  {selectedTeam.description}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmAddToTeamFinal}
            variant='contained'
            sx={{ backgroundColor: '#484c7f' }}
          >
            Add to Team
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AvailableEmployees;
