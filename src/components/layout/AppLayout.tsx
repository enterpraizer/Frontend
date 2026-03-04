import { Outlet } from 'react-router-dom';

const AppLayout = () => (
  <div className="app-layout">
    <aside>Sidebar</aside>
    <main><Outlet /></main>
  </div>
);

export default AppLayout;
