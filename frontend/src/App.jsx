import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { fetchMe } from './store/authSlice';

import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import NotFound from './pages/NotFound';
import Dashboard from './pages/Dashboard';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyEmail from './pages/auth/VerifyEmail';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import OAuthSuccess from './pages/auth/OAuthSuccess';

import EditProfile from './pages/profile/EditProfile';
import FreelancerProfileView from './pages/profile/FreelancerProfileView';
import ClientProfileView from './pages/profile/ClientProfileView';

import GigMarketplace from './pages/gigs/GigMarketplace';
import GigDetail from './pages/gigs/GigDetail';
import CreateGig from './pages/gigs/CreateGig';
import MyGigs from './pages/gigs/MyGigs';
import SearchTalent from './pages/gigs/SearchTalent';

import MyProposals from './pages/proposals/MyProposals';

import Messages from './pages/messages/Messages';
import NotificationsPage from './pages/notifications/NotificationsPage';
import PaymentHistory from './pages/payments/PaymentHistory';

import AdminUsers from './pages/admin/AdminUsers';
import AdminGigs from './pages/admin/AdminGigs';
import AdminDisputes from './pages/admin/AdminDisputes';
import AdminPayments from './pages/admin/AdminPayments';
import AdminReviewModeration from './pages/admin/AdminReviewModeration';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { fontFamily: 'Inter, sans-serif', fontSize: '14px' },
        }}
      />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />

        {/* Auth */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>
        <Route path="/oauth-success" element={<OAuthSuccess />} />

        {/* Public profile views (no auth required to browse) */}
        <Route path="/freelancers/:id" element={<FreelancerProfileView />} />
        <Route path="/clients/:id" element={<ClientProfileView />} />

        {/* App (protected) */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<EditProfile />} />

          <Route path="/gigs" element={<GigMarketplace />} />
          <Route path="/gigs/:id" element={<GigDetail />} />
          <Route
            path="/gigs/create"
            element={
              <ProtectedRoute roles={['client']}>
                <CreateGig />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gigs/mine"
            element={
              <ProtectedRoute roles={['client']}>
                <MyGigs />
              </ProtectedRoute>
            }
          />

          <Route path="/search" element={<SearchTalent />} />

          <Route
            path="/proposals/mine"
            element={
              <ProtectedRoute roles={['freelancer']}>
                <MyProposals />
              </ProtectedRoute>
            }
          />

          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:userId" element={<Messages />} />

          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/payments" element={<PaymentHistory />} />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/gigs"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminGigs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/disputes"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminDisputes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminPayments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reviews"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminReviewModeration />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
