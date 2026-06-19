import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './Sidebar.css';
import logo from '../logo.png';

const Sidebar = ({ onLogout }) => {
  const location = useLocation();
  const [isBookingOpen, setIsBookingOpen] = useState(location.pathname.startsWith('/bookings'));

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo-container">
          <img src={logo} alt="Broom Boom Logo" className="brand-logo-img" />
        </div>
        <div className="brand-text">
          <div className="brand-title">Broom</div>
          <div className="brand-subtitle">Boom<span className="brand-admin">Admin</span></div>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">📊</span>
          <span className="nav-text">Dashboard</span>
        </NavLink>

        <div className={`nav-dropdown ${isBookingOpen ? 'open' : ''}`}>
          <div className="nav-item" onClick={() => setIsBookingOpen(!isBookingOpen)}>
            <span className="nav-icon">📅</span>
            <span className="nav-text">Booking</span>
            <span className={`dropdown-arrow ${isBookingOpen ? 'up' : 'down'}`}>▼</span>
          </div>
          
          <div className="nav-submenu">
            <NavLink to="/bookings/new" className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`}>
              <span className="submenu-dot">•</span>
              <span className="nav-text">New Booking</span>
            </NavLink>
            <NavLink to="/bookings/create" className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`}>
              <span className="submenu-dot">•</span>
              <span className="nav-text">Create Booking</span>
            </NavLink>
          </div>
        </div>
        
        <NavLink to="/tickets" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">🎫</span>
          <span className="nav-text">Tickets</span>
        </NavLink>

        <NavLink to="/wallet" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">💳</span>
          <span className="nav-text">Wallet</span>
        </NavLink>
        
        <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">⚙️</span>
          <span className="nav-text">Settings</span>
        </NavLink>
      </nav>
      
      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">A</div>
          <div className="user-info">
            <span className="user-name">Admin User</span>
            <span className="user-role">Super Admin</span>
          </div>
        </div>
        <button className="sidebar-logout-btn" onClick={onLogout}>
          <span className="nav-icon">🚪</span>
          <span className="nav-text">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
