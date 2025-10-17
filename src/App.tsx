import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Alerts from './pages/Alerts';
import Maps from './pages/Maps';
import Cameras from './pages/Cameras';
import Analytics from './pages/Analytics';
import Setting from './pages/Settings';
import Users from './pages/Users';
import Help from './pages/Help';
import ResponseTeams from './pages/ResponseTeams';
import Patrols from './pages/Patrols';
import Issues from './pages/Issues';
import AdminLogin from './pages/AdminLogin';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { useAutoAssignTeams } from './hooks/useAutoAssignTeams';

function AppContent() {
  // Auto-assign teams to new alerts
  useAutoAssignTeams();

  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<AdminLogin />} />
      
      {/* Protected Routes with Layout */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/maps" element={<Maps />} />
        <Route path="/cameras" element={<Cameras />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/response-teams" element={<ResponseTeams />} />
            <Route path="/patrols" element={<Patrols />} />
            <Route path="/issues" element={<Issues />} />
            <Route path="/users" element={<Users />} />
        <Route path="/settings" element={<Setting />} />
        <Route path="/help" element={<Help />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;