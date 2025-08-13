import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Forget from "./components/Forget";
import ResetPasswordPage from "./components/ResetPasswordPage";
import Dashboard from "./components/Dashboard";
import Layout from "./components/Layout";
import "./App.css";
import Signup from "./components/Signup";
import { DepartmentList } from "./components/department/Department-list";
import { LanguageProvider } from "./context/LanguageContext";
import DesignationManager from "./components/Desigantions/Designation-manager";
import Error404 from "./components/Error404";
import { TenantPage } from "./components/Tenant";
import EmployeeManager from "./components/Employee/EmployeeManager";
import EmployeeProfileView from "./components/Employee/EmployeeProfileView";
import AttendanceCheck from "./components/Attendance/AttendanceCheck";
import Reports from "./components/Attendance/Reports";
import AttendanceTable from "./components/Attendance/AttendanceTable";
import { ThemeProvider } from "./theme";
import UserList from "./components/ManagementUI/UserList";
import UserProfile from "./components/UserProfile/UserProfile";
import LeaveRequestPage from "./components/LeaveRequest/LeaveRequestPage";
import PolicyList from "./components/HRPoliciesModule/PolicyList";
import HolidayList from "../src/components/HolidayCalendar /HolidayList";

function App() {
  return (
    <LanguageProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/forget" element={<Forget />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/Signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <ThemeProvider>
                <Layout />
              </ThemeProvider>
            }
          >
            <Route path="tenant" element={<TenantPage />} />
            <Route index element={<Dashboard />} />
            <Route path="departments" element={<DepartmentList />} />
            <Route path="Designations" element={<DesignationManager />} />
            <Route path="EmployeeManager" element={<EmployeeManager />} />
            <Route path="UserList" element={<UserList />} />
            <Route path="UserProfile" element={<UserProfile />} />
            <Route path="leaves" element={<LeaveRequestPage />} />

            <Route
              path="EmployeeProfileView"
              element={<EmployeeProfileView />}
            />
            <Route path="AttendanceCheck" element={<AttendanceCheck />} />
            <Route path="AttendanceTable" element={<AttendanceTable />} />
            <Route path="Reports" element={<Reports />} />

            <Route path="policies" element={<PolicyList />} />
            <Route path="holidays" element={<HolidayList />} />
          </Route>
          <Route path="*" element={<Error404 />} />
        </Routes>
      </Router>
    </LanguageProvider>
  );
}

export default App;
