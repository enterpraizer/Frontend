import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminRoute from '../components/AdminRoute';
import AppLayout from '../components/layout/AppLayout';
import AdminLayout from '../components/layout/AdminLayout';
import PageSkeleton from '../components/ui/PageSkeleton';

// Public pages (eager)
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ConfirmEmailPage from '../pages/ConfirmEmailPage';
import OnboardingPage from '../pages/OnboardingPage';
import NotFoundPage from '../pages/NotFoundPage';

// Client pages (lazy)
const DashboardPage       = lazy(() => import('../pages/DashboardPage'));
const VMListPage          = lazy(() => import('../pages/VMListPage'));
const VMDetailPage        = lazy(() => import('../pages/VMDetailPage'));
const NetworkListPage     = lazy(() => import('../pages/NetworkListPage'));
const ProfilePage         = lazy(() => import('../pages/ProfilePage'));

// Admin pages (lazy)
const AdminPage               = lazy(() => import('../pages/AdminPage'));
const AdminTenantsPage        = lazy(() => import('../pages/AdminTenantsPage'));
const AdminTenantDetailPage   = lazy(() => import('../pages/AdminTenantDetailPage'));
const AdminVMsPage            = lazy(() => import('../pages/AdminVMsPage'));
const AdminAuditPage          = lazy(() => import('../pages/AdminAuditPage'));

const wrap = (Page: React.ComponentType) => (
  <Suspense fallback={<PageSkeleton />}>
    <Page />
  </Suspense>
);

const router = createBrowserRouter([
  // Redirect root
  { path: '/', element: <Navigate to="/dashboard" replace /> },

  // Public routes
  { path: '/login',             element: <LoginPage /> },
  { path: '/register',          element: <RegisterPage /> },
  { path: '/register/confirm',  element: <ConfirmEmailPage /> },

  // Onboarding (auth required, but no tenant yet)
  {
    element: <ProtectedRoute />,
    children: [{ path: '/onboarding', element: <OnboardingPage /> }],
  },

  // Client routes (protected + has tenant) — wrapped in AppLayout
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard',  element: wrap(DashboardPage) },
          { path: '/vms',        element: wrap(VMListPage) },
          { path: '/vms/:id',    element: wrap(VMDetailPage) },
          { path: '/networks',   element: wrap(NetworkListPage) },
          { path: '/profile',    element: wrap(ProfilePage) },
        ],
      },
    ],
  },

  // Admin routes — wrapped in AdminLayout
  {
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/admin',                element: wrap(AdminPage) },
          { path: '/admin/tenants',        element: wrap(AdminTenantsPage) },
          { path: '/admin/tenants/:id',    element: wrap(AdminTenantDetailPage) },
          { path: '/admin/vms',            element: wrap(AdminVMsPage) },
          { path: '/admin/audit',          element: wrap(AdminAuditPage) },
        ],
      },
    ],
  },

  // Catch-all
  { path: '*', element: <NotFoundPage /> },
]);

export default router;
