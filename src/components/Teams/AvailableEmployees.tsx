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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
} from '@mui/material';
import UserAvatar from '../Common/UserAvatar';
import {
  Add as AddIcon,
  Person as PersonIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useLanguage } from '../../hooks/useLanguage';
import { teamApiService } from '../../api/teamApi';
import { COLORS } from '../../constants/appConstants';
import type { TeamMember, Team } from '../../api/teamApi';
import { snackbar } from '../../utils/snackbar';
import AppButton from '../common/AppButton';

type SelectedTeamInfo = Pick<Team, 'id' | 'name' | 'description'>;

interface AvailableEmployeesProps {
  darkMode?: boolean;
  teamId?: string; // Optional team ID - if provided, skip team selection
  teamName?: string;
  teamDescription?: string;
  isEmployeePool?: boolean;
  preselectedTeamId?: string;
}

const AvailableEmployees: React.FC<AvailableEmployeesProps> = ({
  darkMode = false,
  teamId,
  teamName,
  teamDescription,
  isEmployeePool = false,
  preselectedTeamId,
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
  const [selectedTeam, setSelectedTeam] = useState<SelectedTeamInfo | null>(
    null
  );
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

  // Load available employees
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await teamApiService.getAvailableEmployees(
          page + 1,
          rowsPerPage,
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

  useEffect(() => {
    if (!isEmployeePool) {
      return;
    }

    if (preselectedTeamId) {
      setSelectedTeamId(preselectedTeamId);
    } else {
      setSelectedTeamId('');
    }
  }, [isEmployeePool, preselectedTeamId]);

  useEffect(() => {
    if (!selectedTeamId) {
      setSelectedTeam(null);
      return;
    }

    const existingTeam = teams.find(team => team.id === selectedTeamId);
    if (existingTeam) {
      setSelectedTeam({
        id: existingTeam.id,
        name: existingTeam.name,
        description: existingTeam.description,
      });
      return;
    }

    if (teamId && selectedTeamId === teamId && teamName) {
      setSelectedTeam({
        id: teamId,
        name: teamName,
        description: teamDescription ?? '',
      });
      return;
    }

    setSelectedTeam(null);
  }, [selectedTeamId, teams, teamId, teamName, teamDescription]);

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

  // Filter employees based on search term (starts with match for each word)
  const filteredEmployees = employees.filter(employee => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase().trim();
    const fullName =
      `${employee.user?.first_name || ''} ${employee.user?.last_name || ''}`.toLowerCase();
    const email = (employee.user?.email || '').toLowerCase();
    const designation = (employee.designation?.title || '').toLowerCase();
    const department = (employee.department?.name || '').toLowerCase();

    // Check if any word in the field starts with the search term
    const checkStartsWith = (text: string) => {
      const words = text.split(/\s+/);
      return words.some(word => word.startsWith(searchLower));
    };

    return (
      checkStartsWith(fullName) ||
      checkStartsWith(email) ||
      checkStartsWith(designation) ||
      checkStartsWith(department)
    );
  });

  // Load teams for selection
  useEffect(() => {
    const loadTeams = async () => {
      try {
        const response = await teamApiService.getAllTeams(null); // Pass null to get all teams for dropdown
        setTeams(response.items || []);
      } catch {
        setTeams([]);
      }
    };

    if (showTeamDialog || isEmployeePool) {
      loadTeams();
    }
  }, [showTeamDialog, isEmployeePool]);

  const handleTeamDropdownChange = (teamIdValue: string) => {
    setSelectedTeamId(teamIdValue);
    const team = teams.find(t => t.id === teamIdValue);
    if (team) {
      setSelectedTeam({
        id: team.id,
        name: team.name,
        description: team.description,
      });
    }
  };

  const handleAddToTeam = async (employee: TeamMember) => {
    setSelectedEmployee(employee);
    setSelectedEmployeeId(employee.id);

    if (isEmployeePool) {
      if (preselectedTeamId) {
        setSelectedTeamId(preselectedTeamId);
        const matchedTeam = teams.find(t => t.id === preselectedTeamId);
        if (matchedTeam) {
          setSelectedTeam({
            id: matchedTeam.id,
            name: matchedTeam.name,
            description: matchedTeam.description,
          });
        }
      } else {
        setSelectedTeamId('');
        setSelectedTeam(null);
      }
      setShowConfirmDialog(true);
      return;
    }

    if (teamId) {
      // If team ID is provided (admin case), skip team selection and go directly to confirmation
      setSelectedTeamId(teamId);
      if (teamName) {
        setSelectedTeam({
          id: teamId,
          name: teamName,
          description: teamDescription ?? '',
        });
      }
      setShowConfirmDialog(true);
    } else {
      // If no team ID provided (manager case), show team selection dialog
      setShowTeamDialog(true);
    }
  };

  const handleConfirmAddToTeam = async () => {
    if (!selectedTeamId) {
      snackbar.error('Please select a team');
      return;
    }

    // Find the selected team
    const team = teams.find(t => t.id === selectedTeamId);
    if (team) {
      setSelectedTeam({
        id: team.id,
        name: team.name,
        description: team.description,
      });
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
      await teamApiService.addMemberToTeam(selectedTeamId, selectedEmployeeId);

      setEmployees(prev => prev.filter(emp => emp.id !== selectedEmployeeId));
      setTotal(prev => Math.max(prev - 1, 0));

      setShowTeamDialog(false);
      setShowConfirmDialog(false);
      setSelectedEmployeeId('');
      setSelectedTeamId('');
      setSelectedEmployee(null);
      setSelectedTeam(null);

      snackbar.success(lang.employeeAdded);

      window.dispatchEvent(new CustomEvent('teamUpdated'));
    } catch {
      snackbar.error('Failed to add employee to team. Please try again.');
    }
  };

  const handleCloseTeamDialog = () => {
    setShowTeamDialog(false);
    setSelectedEmployeeId('');
    setSelectedTeamId('');
    if (!isEmployeePool) {
      setSelectedTeam(null);
    }
  };

  const handleCloseConfirmDialog = () => {
    setShowConfirmDialog(false);
    setSelectedEmployeeId('');
    setSelectedTeamId('');
    setSelectedEmployee(null);
    setSelectedTeam(null);
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
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              size='small'
              placeholder={lang.search}
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchIcon sx={{ color: darkMode ? '#ccc' : '#666' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                backgroundColor: darkMode ? '#2d2d2d' : '#fff',
                borderRadius: 2,
                '& .MuiOutlinedInput-root': {
                  color: darkMode ? '#fff' : '#000',
                  '& fieldset': {
                    borderColor: darkMode ? '#555' : '#ccc',
                  },
                  '&:hover fieldset': {
                    borderColor: darkMode ? '#888' : '#999',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#484c7f',
                  },
                },
                '& .MuiInputBase-input::placeholder': {
                  color: darkMode ? '#999' : '#999',
                  opacity: 1,
                },
              }}
            />
          </Box>
          <TableContainer
            component={Paper}
            sx={{
              backgroundColor: darkMode ? '#2d2d2d' : '#fff',
              boxShadow: 'none',
            }}
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
                {filteredEmployees
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
                              id: employee.user?.id,
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
            count={searchTerm ? filteredEmployees.length : total}
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
          <AppButton
            variant='outlined'
            text='Cancel'
            onClick={handleCloseTeamDialog}
          />
          <AppButton
            variant='contained'
            text='Add to Team'
            onClick={handleConfirmAddToTeam}
            disabled={!selectedTeamId}
            sx={{ backgroundColor: COLORS.PRIMARY }}
          />
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirmDialog}
        onClose={handleCloseConfirmDialog}
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
          {selectedEmployee && (
            <Box
              sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}
            >
              <Typography variant='body1'>
                {isEmployeePool
                  ? `Select a team to assign ${selectedEmployee.user?.first_name} ${selectedEmployee.user?.last_name}.`
                  : `Are you sure you want to add ${selectedEmployee.user?.first_name} ${selectedEmployee.user?.last_name} to team ${selectedTeam?.name ?? ''}?`}
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
                  <strong>Team:</strong>{' '}
                  {selectedTeam
                    ? `${selectedTeam.name}${
                        selectedTeam.description
                          ? ` - ${selectedTeam.description}`
                          : ''
                      }`
                    : 'Not selected'}
                </Typography>
              </Box>
              {(isEmployeePool || !teamId) && (
                <FormControl fullWidth>
                  <InputLabel>Select Team</InputLabel>
                  <Select
                    value={selectedTeamId}
                    label='Select Team'
                    onChange={event =>
                      handleTeamDropdownChange(event.target.value as string)
                    }
                    disabled={teams.length === 0 && !selectedTeamId}
                  >
                    <MenuItem value='' disabled>
                      Select Team
                    </MenuItem>
                    {teams.length === 0 ? (
                      <MenuItem value='' disabled>
                        No teams available
                      </MenuItem>
                    ) : (
                      teams.map(team => (
                        <MenuItem key={team.id} value={team.id}>
                          {team.name}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <AppButton
            variant='outlined'
            text='Cancel'
            onClick={handleCloseConfirmDialog}
          />
          <AppButton
            variant='contained'
            text='Add to Team'
            onClick={handleConfirmAddToTeamFinal}
            disabled={!selectedTeamId}
            sx={{ backgroundColor: COLORS.PRIMARY }}
          />
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AvailableEmployees;
