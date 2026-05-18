import { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import OwnerSidebar from './components/layout/OwnerSidebar';
import MobileTopBar from './components/layout/MobileTopBar';
import OwnerNavbar from './components/layout/OwnerNavbar';

// Public Pages
import Login from './pages/Login';

// Owner/Staff Pages
import Dashboard from './pages/owner/Dashboard';
import ActiveBills from './pages/owner/ActiveBills';
import ManageMenus from './pages/owner/ManageMenus';
import AddMenu from './pages/owner/AddMenu';
import EditMenu from './pages/owner/EditMenu';
import OrderHistory from './pages/owner/OrderHistory';
import StockBeverage from './pages/owner/StockBeverage';
import StockHistory from './pages/owner/StockHistory';
import ManageEmployees from './pages/owner/ManageEmployees';
import TableManagement from './pages/owner/TableManagement';


// Customer Page
import MenuCustomer from './pages/customer/MenuCustomer';

const getDefaultRoute = (role) => {
  if (role === 'owner') return '/';
  return '/manage-tables';
};

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDefaultRoute(user.role)} replace />;
  }

  return children;
};

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Check if current route is customer page to hide owner layout
  const isCustomerPage = location.pathname.startsWith('/customer');
  const isLoginPage = location.pathname === '/login';

  if (isCustomerPage) {
    return (
      <main className="min-h-screen bg-slate-50">
        <Routes>
          <Route path="/customer" element={<MenuCustomer />} />
        </Routes>
      </main>
    );
  }

  if (isLoginPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <OwnerSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="flex-1 flex flex-col">
        {/* Desktop Navbar */}
        <OwnerNavbar />
        
        {/* Mobile TopBar */}
        <MobileTopBar toggleSidebar={toggleSidebar} />
        
        <main className="main-content lg:pt-[94px]">
          <Routes>
            <Route path="/" element={<ProtectedRoute allowedRoles={['owner']}><Dashboard /></ProtectedRoute>} />
            <Route path="/manage-tables" element={<ProtectedRoute><TableManagement /></ProtectedRoute>} />
            <Route path="/active-bills" element={<ProtectedRoute><ActiveBills /></ProtectedRoute>} />
            <Route path="/manage-menus" element={<ProtectedRoute allowedRoles={['owner']}><ManageMenus /></ProtectedRoute>} />
            <Route path="/add-menu" element={<ProtectedRoute allowedRoles={['owner']}><AddMenu /></ProtectedRoute>} />
            <Route path="/edit-menu/:id" element={<ProtectedRoute allowedRoles={['owner']}><EditMenu /></ProtectedRoute>} />
            <Route path="/order-history" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
            <Route path="/stock-beverage" element={<ProtectedRoute><StockBeverage /></ProtectedRoute>} />
            <Route path="/stock-history" element={<ProtectedRoute><StockHistory /></ProtectedRoute>} />
            <Route path="/manage-employees" element={<ProtectedRoute allowedRoles={['owner']}><ManageEmployees /></ProtectedRoute>} />
            
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
