import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Forget from "./components/Forget";
import Dashboard from "./components/Dashboard";
import Layout from "./components/Layout";
import "./App.css";
import Signup from "./components/Signup";
import { DepartmentList } from "./components/department/Department-list";
import { LanguageProvider } from "./context/LanguageContext";
import DesignationManager from "./components/Desigantions/Designation-manager";
import Error404 from "./components/Error404";
import { TenantPage } from "./components/Tenant";
function App() {
  return (
    <LanguageProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/forget" element={<Forget />} />
          <Route path="/Signup" element={<Signup />} />
          <Route path="/dashboard" element={<Layout />}>
            <Route path="tenant" element={<TenantPage />} />
            <Route index element={<Dashboard />} />
            <Route path="departments" element={<DepartmentList />} />
            <Route path="Designations" element={<DesignationManager />} />
          </Route>
          <Route path="*" element={<Error404 />} />
        </Routes>
      </Router>
    </LanguageProvider>
  );
}

export default App;
