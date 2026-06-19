import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './components/Login';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Tickets from './pages/Tickets';
import CreateBooking from './pages/CreateBooking';
import BookingsList from './pages/BookingsList';
import Wallet from './pages/Wallet';
import { isAuthenticated, logout } from './api/authService';

function App() {
  const [isAuth, setIsAuth] = useState(isAuthenticated());

  useEffect(() => {
    // Check auth status on load
    setIsAuth(isAuthenticated());
  }, []);

  const handleLoginSuccess = () => {
    setIsAuth(true);
  };

  const handleLogout = () => {
    logout();
    setIsAuth(false);
  };

  if (!isAuth) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminLayout onLogout={handleLogout} />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="settings" element={<Settings />} />
          <Route path="bookings/new" element={<BookingsList />} />
          <Route path="bookings/create" element={<CreateBooking />} />
          <Route path="wallet" element={<Wallet />} />
        </Route>
        {/* Redirect any unknown route to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
