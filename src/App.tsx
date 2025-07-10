import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Forget from './components/Forget';
import Dashboard from './components/Dashboard';
import Layout from './components/Layout';
import './App.css';
import Signup from './components/Signup';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/forget" element={<Forget />} />
        <Route path="/Signup" element={<Signup/>} />
        <Route path="/dashboard" element={<Layout />}>
          <Route index element={<Dashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
