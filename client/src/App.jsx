import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Background from './components/Background';
import AdminDashboard from './components/AdminDashboard';
import StudentCatalog from './components/StudentCatalog';
import Login from './components/Login';
import CheckoutOverview from './components/CheckoutOverview';
import StudentRentals from './components/StudentRentals';
import CartDrawer from './components/CartDrawer';
import Lectures from './components/Lectures';
import { useAppContext } from './context/AppContext';
import { Toaster } from 'react-hot-toast';
import VerifyLabs from './components/VerifyLabs';
import LabsList from './components/LabsList';

function ProtectedRoute({ children, roles }) {
  const { user } = useAppContext();
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

function App() {
  return (
    <div className="min-h-screen font-sans antialiased">
      <Background />
      <Navbar />
      <CartDrawer />
      <main className="container mx-auto p-4 md:p-8">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><StudentCatalog /></ProtectedRoute>} />
          <Route path="/lectures" element={<ProtectedRoute><Lectures /></ProtectedRoute>} />
          <Route path="/rentals" element={<ProtectedRoute><StudentRentals /></ProtectedRoute>} />
          <Route path="/checkout-overview" element={<ProtectedRoute><CheckoutOverview /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute roles={['admin', 'teacher']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/verify-labs" element={<ProtectedRoute><VerifyLabs /></ProtectedRoute>} />
          <Route path="/labs" element={<ProtectedRoute><LabsList /></ProtectedRoute>} />
        </Routes>
      </main>
      <Toaster 
        position="top-right" 
        toastOptions={{
          className: 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/20 dark:border-slate-800/50 text-slate-900 dark:text-slate-100 shadow-2xl rounded-2xl p-4',
          success: {
            iconTheme: {
              primary: 'rgb(16 185 129)',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: 'rgb(239 68 68)',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}

export default App;
