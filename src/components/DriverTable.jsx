import React, { useState, useEffect, useCallback } from 'react';
import './DriverTable.css';
import DriverEditPage from './DriverEditPage';
import { getDrivers, updateDriver, getDriverDetails, deleteDriver } from '../api/driverService';

const DriverTable = () => {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  
  // Filters state
  const [filters, setFilters] = useState({
    category: '',
    state: '',
    city: '',
    status: '',
    dutyStatus: '',
    plan: '',
    search: '',
    page: 1,
    limit: 10
  });

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getDrivers(filters);
      setData(result.drivers || []);
      setTotal(result.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to fetch drivers');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value, page: 1 }));
  };

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }));
  };

  // ✅ Fetch full driver details and navigate to edit page
  const handleViewDriver = async (driver) => {
    setLoading(true);
    setError(null);
    try {
      const fullDriver = await getDriverDetails(driver.id);
      setSelectedDriver(fullDriver);
    } catch (err) {
      setError(err.message || 'Failed to fetch driver details');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Save all changes and go back to list
  const handleSaveDriver = (updatedDriver) => {
    // Re-fetch to get latest data
    fetchDrivers();
    setSelectedDriver(null);
  };

  // ✅ Go back without saving
  const handleBack = () => {
    setSelectedDriver(null);
  };

  const handleStatusChangeInline = async (driverId, newStatus) => {
    try {
      await updateDriver(driverId, { status: newStatus });
      setData((prev) =>
        prev.map((d) => (d.id === driverId ? { ...d, status: newStatus } : d))
      );
    } catch (err) {
      alert('Failed to update status: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDeleteDriver = async (driverId) => {
    const isConfirmed = window.confirm('Are you sure you want to delete this driver? This action cannot be undone.');
    if (!isConfirmed) return;

    try {
      await deleteDriver(driverId);
      setData((prev) => prev.filter((d) => d.id !== driverId));
      setTotal((prev) => prev - 1);
    } catch (err) {
      alert('Failed to delete driver: ' + (err.message || 'Unknown error'));
    }
  };

  // ✅ If a driver is selected, show the edit page instead of the table
  if (selectedDriver) {
    return (
      <DriverEditPage
        driver={selectedDriver}
        onBack={handleBack}
        onSave={handleSaveDriver}
      />
    );
  }

  return (
    <div className="admin-dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Driver Verification Management</h1>
        <p className="dashboard-subtitle">Manage and verify registered drivers, their KYC, and vehicle documents.</p>
      </div>

      <div className="filters-container">
        <div className="filters-row">
          <select 
            className="filter-select"
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <option value="">Category</option>
            <option value="Mini">Mini</option>
            <option value="Sedan">Sedan</option>
            <option value="SUV">SUV</option>
            <option value="SUV+">SUV+</option>
            <option value="Tempo Traveller">Tempo Traveller</option>
          </select>
          <select 
            className="filter-select"
            value={filters.state}
            onChange={(e) => handleFilterChange('state', e.target.value)}
          >
            <option value="">Select State</option>
            <option value="Andhra Pradesh">Andhra Pradesh</option>
            <option value="Arunachal Pradesh">Arunachal Pradesh</option>
            <option value="Assam">Assam</option>
            <option value="Bihar">Bihar</option>
            <option value="Chhattisgarh">Chhattisgarh</option>
            <option value="Goa">Goa</option>
            <option value="Gujarat">Gujarat</option>
            <option value="Haryana">Haryana</option>
            <option value="Himachal Pradesh">Himachal Pradesh</option>
            <option value="Jharkhand">Jharkhand</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Kerala">Kerala</option>
            <option value="Madhya Pradesh">Madhya Pradesh</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="Manipur">Manipur</option>
            <option value="Meghalaya">Meghalaya</option>
            <option value="Mizoram">Mizoram</option>
            <option value="Nagaland">Nagaland</option>
            <option value="Odisha">Odisha</option>
            <option value="Punjab">Punjab</option>
            <option value="Rajasthan">Rajasthan</option>
            <option value="Sikkim">Sikkim</option>
            <option value="Tamil Nadu">Tamil Nadu</option>
            <option value="Telangana">Telangana</option>
            <option value="Tripura">Tripura</option>
            <option value="Uttar Pradesh">Uttar Pradesh</option>
            <option value="Uttarakhand">Uttarakhand</option>
            <option value="West Bengal">West Bengal</option>
          </select>
          <select 
            className="filter-select"
            value={filters.dutyStatus}
            onChange={(e) => handleFilterChange('dutyStatus', e.target.value)}
          >
            <option value="">Driver Status</option>
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
            <option value="On Ride">On Ride</option>
          </select>
          <input 
            type="text" 
            className="filter-input" 
            placeholder="Search City" 
            value={filters.city}
            onChange={(e) => handleFilterChange('city', e.target.value)}
          />
          <select 
            className="filter-select"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">Select Status</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Blocked">Blocked</option>
          </select>
          <select 
            className="filter-select"
            value={filters.plan}
            onChange={(e) => handleFilterChange('plan', e.target.value)}
          >
            <option value="">Select Plan</option>
            <option value="None">None</option>
            <option value="Regular">Regular</option>
            <option value="Prime">Prime</option>
          </select>
          <div className="search-input-wrapper">
            <label>Search:</label>
            <input 
              type="text" 
              className="search-input" 
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-state">Loading drivers...</div>
        ) : error ? (
          <div className="error-state">{error}</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Pincode</th>
                <th>State</th>
                <th>City</th>
                <th>Mobile</th>
                <th>Vehicle Type / RC</th>
                <th>Registered at</th>
                <th>Plan</th>
                <th>Driver Status</th>
                <th>Verify At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '2rem' }}>No drivers found.</td>
                </tr>
              ) : (
                data.map((driver) => (
                  <tr key={driver.id}>
                    <td>
                      <span className="user-name">{driver.fullName || '(New Driver)'}</span>
                      <span className="sub-text">{driver.email || 'No email provided'}</span>
                    </td>
                    <td>{driver.pincode}</td>
                    <td>{driver.state || 'N/A'}</td>
                    <td>{driver.city || 'N/A'}</td>
                    <td>{driver.mobile}</td>
                    <td>
                      <span className="user-name">{driver.vehicleType}</span>
                      <span className="sub-text">{driver.rcNumber}</span>
                    </td>
                    <td>
                      <span className="user-name">{driver.registeredAt?.split(' ')[0]}</span>
                      <span className="sub-text">{driver.registeredAt?.split(' ')[1]}</span>
                    </td>
                    <td>
                      <span className={`plan-badge ${(driver.subscriptionPlan || 'none').toLowerCase()}`}>
                        {driver.subscriptionPlan || 'Regular'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${(driver.dutyStatus || 'offline').toLowerCase().replace(' ', '-')}`}>
                        {driver.dutyStatus || 'Offline'}
                      </span>
                    </td>
                    <td>
                      {!driver.verifyAt || driver.verifyAt === 'Pending' ? (
                        <span style={{ color: '#b45309', fontWeight: 500 }}>Pending</span>
                      ) : (
                        <>
                          <span className="user-name">{driver.verifyAt?.split(' ')[0]}</span>
                          <span className="sub-text">{driver.verifyAt?.split(' ')[1]}</span>
                        </>
                      )}
                    </td>
                    <td>
                      <div className="action-cell">
                        <button 
                          className="btn-action-view" 
                          title="Inspect Driver"
                          onClick={() => handleViewDriver(driver)}
                        >
                          👁️
                        </button>
                        <button 
                          className="btn-action-delete" 
                          title="Delete Driver"
                          onClick={() => handleDeleteDriver(driver.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '16px',
                            marginLeft: '4px',
                            marginRight: '8px',
                            color: '#ef4444'
                          }}
                        >
                          🗑️
                        </button>
                        <select
                          className="status-dropdown"
                          value={driver.status}
                          onChange={(e) => handleStatusChangeInline(driver.id, e.target.value)}
                        >
                          <option value="Active">Active</option>
                          <option value="Pending">Pending</option>
                          <option value="Blocked">Blocked</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        <div className="table-footer">
          <div className="entries-info">
            Show 
            <select 
              className="entries-select" 
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select> entries
          </div>
          <div className="entries-info">
            Showing {(filters.page - 1) * filters.limit + 1} to {Math.min(filters.page * filters.limit, total)} of {total} entries
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverTable;