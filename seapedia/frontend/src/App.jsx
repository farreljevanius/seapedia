import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import RoleSelection from './pages/RoleSelection';
import ProductCatalog from './pages/ProductCatalog';

// Dashboards
import AdminDashboard from './dashboards/AdminDashboard';
import SellerDashboard from './dashboards/SellerDashboard';
import BuyerDashboard from './dashboards/BuyerDashboard';
import DriverDashboard from './dashboards/DriverDashboard';

// Custom Private Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { token, activeRole } = useAuthStore();
  
  if (!token) return <Navigate to="/login" replace />;
  if (activeRole !== requiredRole) return <Navigate to="/role-selection" replace />;
  
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public & Guest Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/catalog" element={<ProductCatalog />} />
        <Route path="/login" element={<Login />} />
        <Route path="/role-selection" element={<RoleSelection />} />

        {/* Protected Dashboard Routes */}
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/seller/*" 
          element={
            <ProtectedRoute requiredRole="SELLER">
              <SellerDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/buyer/*" 
          element={
            <ProtectedRoute requiredRole="BUYER">
              <BuyerDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/driver/*" 
          element={
            <ProtectedRoute requiredRole="DRIVER">
              <DriverDashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;