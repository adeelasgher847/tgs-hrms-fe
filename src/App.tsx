import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Box, CircularProgress } from '@mui/material';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Common/ProtectedRoute';
import RouteErrorBoundary from './components/Common/RouteErrorBoundary';
import NotificationToast from './components/AssetManagement/NotificationToast';
import { LanguageProvider } from './context/LanguageContext';
import { UserProvider } from './context/UserContext';
import { ProfilePictureProvider } from './context/ProfilePictureContext';
import { CompanyProvider } from './context/CompanyContext';
import { ThemeProvider } from './theme';
import './App.css';

const LoadingFallback = () => (
  <Box
    display='flex'
    justifyContent='center'
    alignItems='center'
    minHeight='100vh'
  >
    <CircularProgress />
  </Box>
);

const Login = lazy(() => import('./components/Auth/Login'));
const Forget = lazy(() => import('./components/Auth/Forget'));
const ResetPassword = lazy(() => import('./components/Auth/ResetPassword'));
const Signup = lazy(() => import('./components/Auth/Signup'));
const ConfirmPassword = lazy(() => import('./components/Auth/ConfirmPassword'));
const CompanyDetails = lazy(
  () => import('./components/Company/CompanyDetails')
);
const SelectPlan = lazy(() => import('./components/Company/SelectPlan'));
const ConfirmPayment = lazy(
  () => import('./components/Company/ConfirmPayment')
);
const SignupSuccess = lazy(() => import('./components/Auth/SignupSuccess'));
const Error404 = lazy(() => import('./components/Common/Error404'));

const Dashboard = lazy(() => import('./components/DashboardContent/Dashboard'));
const DepartmentList = lazy(() =>
  import('./components/Department/Department-list').then(module => ({
    default: module.DepartmentList,
  }))
);
const DesignationManager = lazy(
  () => import('./components/Designations/DesignationManager')
);
const TenantPage = lazy(() =>
  import('./components/Tenant/Tenant').then(module => ({
    default: module.TenantPage,
  }))
);
const EmployeeManager = lazy(
  () => import('./components/Employee/EmployeeManager')
);
const EmployeeProfileView = lazy(
  () => import('./components/Employee/EmployeeProfileView')
);
const AttendanceCheck = lazy(
  () => import('./components/Attendance/AttendanceCheck')
);
const Reports = lazy(() => import('./components/Attendance/Reports'));
const AttendanceTable = lazy(
  () => import('./components/Attendance/AttendanceTable')
);
const AttendanceSummaryReport = lazy(
  () => import('./components/Attendance/AttendanceSummaryReport')
);
const SettingsPage = lazy(() => import('./components/Settings/SettingsPage'));
const UserList = lazy(() => import('./components/ManagementUI/UserList'));
const UserProfileComponent = lazy(
  () => import('./components/UserProfile/UserProfile')
);
const LeaveRequestPage = lazy(
  () => import('./components/LeaveRequest/LeaveRequestPage')
);
const CrossTenantLeaveManagement = lazy(
  () => import('./components/LeaveRequest/CrossTenantLeaveManagement')
);
const PolicyList = lazy(
  () => import('./components/HRPoliciesModule/PolicyList')
);
const HolidayList = lazy(
  () => import('./components/HolidayCalendar/HolidayList')
);
const TimesheetLayout = lazy(
  () => import('./components/TimerTracker/TimesheetLayout')
);
const TeamManager = lazy(() => import('./components/Teams/TeamManager'));
const AssetInventory = lazy(
  () => import('./components/AssetManagement/AssetInventory')
);
const AssetRequests = lazy(
  () => import('./components/AssetManagement/AssetRequests')
);
const RequestManagement = lazy(
  () => import('./components/AssetManagement/RequestManagement')
);
const SystemAdminAssets = lazy(
  () => import('./components/AssetManagement/SystemAdminAssets')
);
const BenefitList = lazy(() => import('./components/Benefits/BenefitList'));
const EmployeeBenefits = lazy(
  () => import('./components/Benefits/EmployeeBenefits')
);
const BenefitDetails = lazy(
  () => import('./components/Employee/BenefitDetails')
);
const BenefitReport = lazy(() => import('./components/Benefits/BenefitReport'));
const TenantBasedEmployeeManager = lazy(
  () => import('./components/Employee/TenantBasedEmployeeManager')
);
const AuditLogs = lazy(() => import('./components/Audits/AuditLogs'));
const PerformanceDashboard = lazy(
  () => import('./components/Performance/PerformanceManager')
);
const PayrollConfiguration = lazy(
  () => import('./components/Payroll/PayrollConfiguration')
);
const EmployeeSalaryPage = lazy(
  () => import('./components/Payroll/EmployeeSalary')
);
const PayrollRecords = lazy(
  () => import('./components/Payroll/PayrollRecords')
);
const MySalary = lazy(() => import('./components/Payroll/MySalary'));
const PayrollReports = lazy(
  () => import('./components/Payroll/PayrollReports')
);

function App() {
  return (
    <LanguageProvider>
      <UserProvider>
        <ProfilePictureProvider>
          <Router>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path='/' element={<Login />} />
                <Route path='/forget' element={<Forget />} />
                <Route path='/reset-password' element={<ResetPassword />} />
                <Route path='/confirm-password' element={<ConfirmPassword />} />
                <Route path='/Signup' element={<Signup />} />
                <Route
                  path='/signup/company-details'
                  element={<CompanyDetails />}
                />
                <Route path='/signup/select-plan' element={<SelectPlan />} />
                <Route
                  path='/signup/confirm-payment'
                  element={<ConfirmPayment />}
                />
                <Route path='/signup/success' element={<SignupSuccess />} />

                <Route
                  path='/dashboard/*'
                  element={
                    <ProtectedRoute>
                      <CompanyProvider>
                        <ThemeProvider>
                          <Layout />
                        </ThemeProvider>
                      </CompanyProvider>
                    </ProtectedRoute>
                  }
                >
                  <Route
                    index
                    element={
                      <RouteErrorBoundary>
                        <Dashboard />
                      </RouteErrorBoundary>
                    }
                  />
                  <Route
                    path='tenant'
                    element={
                      <RouteErrorBoundary>
                        <TenantPage />
                      </RouteErrorBoundary>
                    }
                  />
                  <Route path='departments' element={<DepartmentList />} />
                  <Route path='Designations' element={<DesignationManager />} />
                  <Route path='EmployeeManager' element={<EmployeeManager />} />
                  <Route path='UserList' element={<UserList />} />
                  <Route
                    path='UserProfile'
                    element={<UserProfileComponent />}
                  />
                  <Route path='leaves' element={<LeaveRequestPage />} />
                  <Route
                    path='cross-tenant-leaves'
                    element={<CrossTenantLeaveManagement />}
                  />
                  <Route
                    path='attendance-summary'
                    element={<AttendanceSummaryReport />}
                  />
                  <Route
                    path='EmployeeProfileView'
                    element={<EmployeeProfileView />}
                  />
                  <Route
                    path='TenantEmployees'
                    element={<TenantBasedEmployeeManager />}
                  />
                  <Route path='AttendanceCheck' element={<AttendanceCheck />} />
                  <Route path='AttendanceTable' element={<AttendanceTable />} />
                  <Route path='Reports' element={<Reports />} />
                  <Route path='policies' element={<PolicyList />} />
                  <Route path='holidays' element={<HolidayList />} />
                  <Route
                    path='AttendanceCheck/TimesheetLayout'
                    element={<TimesheetLayout />}
                  />
                  <Route path='teams' element={<TeamManager />} />
                  <Route path='settings' element={<SettingsPage />} />
                  <Route path='assets' element={<AssetInventory />} />
                  <Route path='assets/inventory' element={<AssetInventory />} />
                  <Route path='assets/requests' element={<AssetRequests />} />
                  <Route
                    path='assets/request-management'
                    element={<RequestManagement />}
                  />
                  <Route
                    path='assets/system-admin'
                    element={<SystemAdminAssets />}
                  />
                  <Route path='benefits-list' element={<BenefitList />} />
                  <Route
                    path='employee-benefit'
                    element={<EmployeeBenefits />}
                  />
                  <Route path='benefit-details' element={<BenefitDetails />} />
                  <Route path='benefit-report' element={<BenefitReport />} />

                  <Route
                    path='performance-dashboard'
                    element={<PerformanceDashboard />}
                  />
                  <Route path='audit-logs' element={<AuditLogs />} />

                  <Route
                    path='payroll-configuration'
                    element={<PayrollConfiguration />}
                  />
                  <Route path='payroll-records' element={<PayrollRecords />} />
                  <Route path='payroll-reports' element={<PayrollReports />} />
                  <Route
                    path='employee-salary'
                    element={<EmployeeSalaryPage />}
                  />
                  <Route path='my-salary' element={<MySalary />} />
                </Route>
                <Route path='/company-details' element={<CompanyDetails />} />
                <Route path='*' element={<Error404 />} />
              </Routes>
            </Suspense>
          </Router>
          <NotificationToast />
        </ProfilePictureProvider>
      </UserProvider>
    </LanguageProvider>
  );
}
export default App;
