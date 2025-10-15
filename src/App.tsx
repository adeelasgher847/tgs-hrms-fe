import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Forget from './components/Forget';
import ResetPassword from './components/ResetPassword';
import Signup from './components/Signup';
import ConfirmPassword from './components/ConfirmPassword';
import CompanyDetails from './components/CompanyDetails';
import SelectPlan from './components/SelectPlan';
import ConfirmPayment from './components/ConfirmPayment';
import SignupSuccess from './components/SignupSuccess';
import Dashboard from './components/Dashboard';
import Layout from './components/Layout';
import { DepartmentList } from './components/department/Department-list';
import DesignationManager from './components/Desigantions/Designation-manager';
import Error404 from './components/Error404';
import { TenantPage } from './components/Tenant';
import EmployeeManager from './components/Employee/EmployeeManager';
import EmployeeProfileView from './components/Employee/EmployeeProfileView';
import AttendanceCheck from './components/Attendance/AttendanceCheck';
import Reports from './components/Attendance/Reports';
import AttendanceTable from './components/Attendance/AttendanceTable';
import AttendanceSummaryReport from './components/Attendance/AttendanceSummaryReport';
import SettingsPage from './components/Settings/SettingsPage';
import UserList from './components/ManagementUI/UserList';
import UserProfileComponent from './components/UserProfile/UserProfile';
import LeaveRequestPage from './components/LeaveRequest/LeaveRequestPage';
import PolicyList from './components/HRPoliciesModule/PolicyList';
import HolidayList from './components/HolidayCalendar/HolidayList';
import TimesheetLayout from './components/TimerTracker/TimesheetLayout';
import TeamManager from './components/Teams/TeamManager';
import AssetInventory from './components/AssetManagement/AssetInventory';
import AssetRequests from './components/AssetManagement/AssetRequests';
import RequestManagement from './components/AssetManagement/RequestManagement';
import NotificationToast from './components/AssetManagement/NotificationToast';
import BenefitList from './components/Benefits/BenefitList';
import ReportingView from './components/Benefits/ReportingView';
import MyBenefits from './components/Benefits/MyBenefits';
import AssignBenefits from './components/Benefits/AssignBenefits';
import { LanguageProvider } from './context/LanguageContext';
import { UserProvider } from './context/UserContext';
import { ProfilePictureProvider } from './context/ProfilePictureContext';
import { CompanyProvider } from './context/CompanyContext';
import { ThemeProvider } from './theme';
import './App.css';

function App() {
  return (
    <LanguageProvider>
      <UserProvider>
        <ProfilePictureProvider>
          <Router>
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
                  <CompanyProvider>
                    <ThemeProvider>
                      <Layout />
                    </ThemeProvider>
                  </CompanyProvider>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path='tenant' element={<TenantPage />} />
                <Route path='departments' element={<DepartmentList />} />
                <Route path='Designations' element={<DesignationManager />} />
                <Route path='EmployeeManager' element={<EmployeeManager />} />
                <Route path='UserList' element={<UserList />} />
                <Route path='UserProfile' element={<UserProfileComponent />} />
                <Route path='leaves' element={<LeaveRequestPage />} />
                <Route
                  path='attendance-summary'
                  element={<AttendanceSummaryReport />}
                />
                <Route
                  path='EmployeeProfileView'
                  element={<EmployeeProfileView />}
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
                <Route path='assets/requests' element={<AssetRequests />} />
                <Route path='assets/request-management'  element={<RequestManagement />}/>
                 <Route path='benefits' element={<BenefitList />} />
                <Route path='benefits/reporting' element={<ReportingView />} />
                <Route path='benefits/assign' element={<AssignBenefits employeeId={'e1'} />} />
                <Route path='my-benefits' element={<MyBenefits employeeId={'e1'} />} />

              </Route>
                <Route path='/company-details' element={<CompanyDetails />} />
                <Route path='*' element={<Error404 />} />
              </Routes>
            </Router>   
             <NotificationToast />
        </ProfilePictureProvider>
      </UserProvider>
    </LanguageProvider>
  );
}

export default App;
