import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import './AdminLayout.css';

const AdminLayout = ({ onLogout }) => {
  return (
    <div className="admin-layout">
      <Sidebar onLogout={onLogout} />
      <div className="admin-main">
        <header className="admin-header">
          <div className="header-search">
            <h2 className="header-page-title">Management Dashboard</h2>
          </div>
          <div className="header-actions">
            {/* Action icons could go here */}
          </div>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
