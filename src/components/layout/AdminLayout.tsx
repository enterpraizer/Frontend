import { Outlet } from 'react-router-dom';

const AdminLayout = () => (
  <div className="admin-layout">
    <aside>Admin Sidebar</aside>
    <main><Outlet /></main>
  </div>
);

export default AdminLayout;
