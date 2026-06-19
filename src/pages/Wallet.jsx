import React, { useState, useEffect, useCallback } from 'react';
import './Wallet.css';
import { getDrivers } from '../api/driverService';
import { 
/* getWalletSummary removed - not used after UI update */
  getTransactions, 
  getWithdrawals, 
  processWithdrawal, 
  adjustWallet 
} from '../api/walletService';

const Wallet = () => {
  // Data State
  const [drivers, setDrivers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, transactions, withdrawals
  
  // Modal State
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [adjustmentData, setAdjustmentData] = useState({
    mode: 'adjust', // 'adjust' or 'set'
    amount: '',
    category: 'Adjustment',
    description: ''
  });

  // Filter State
  const [filters, setFilters] = useState({
    search: '',
    isNegative: false,
    page: 1
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const driverData = await getDrivers({
          ...filters,
          limit: 100,
          isNegative: filters.isNegative ? 'true' : undefined
        });
        setDrivers(driverData.drivers || []);
      } else if (activeTab === 'transactions') {
        const logs = await getTransactions({ limit: 50 });
        setTransactions(logs.transactions || []);
      } else if (activeTab === 'withdrawals') {
        const requests = await getWithdrawals('Pending');
        setWithdrawals(Array.isArray(requests) ? requests : (requests.withdrawals || []));
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching wallet data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value, page: 1 }));
  };

  const openAdjustModal = (driver) => {
    setSelectedDriver(driver);
    setAdjustmentData({ 
      mode: 'adjust',
      amount: '', 
      category: 'Adjustment', 
      description: '' 
    });
    setShowAdjustModal(true);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDriver) return;
    
    let finalAmount = parseFloat(adjustmentData.amount);

    // If mode is 'set', calculate the difference needed
    if (adjustmentData.mode === 'set') {
      finalAmount = finalAmount - (selectedDriver.walletBalance || 0);
    }

    if (isNaN(finalAmount)) {
      alert('Please enter a valid number');
      return;
    }

    setActionLoading(true);
    try {
      await adjustWallet({
        userId: selectedDriver._id,
        userType: 'Driver',
        amount: finalAmount,
        category: adjustmentData.category,
        description: adjustmentData.description || `Admin ${adjustmentData.mode === 'set' ? 'set balance' : 'adjustment'}`
      });
      setShowAdjustModal(false);
      fetchData(); // Refresh overview
      alert('Wallet updated successfully');
    } catch (err) {
      alert(err.message || 'Failed to update wallet');
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcessWithdrawal = async (id, status) => {
    const reason = prompt(`Enter reason for ${status}:`, status === 'Processed' ? 'Paid via UPI' : 'Insufficient documents');
    if (reason === null) return;

    setActionLoading(true);
    try {
      await processWithdrawal(id, { status, reason });
      fetchData(); // Refresh withdrawals
      alert(`Withdrawal ${status.toLowerCase()} successfully`);
    } catch (err) {
      alert(err.message || 'Failed to process withdrawal');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const filteredDrivers = drivers.filter(driver => {
    const searchMatch = (driver.fullName && driver.fullName.toLowerCase().includes(filters.search.toLowerCase())) ||
                        (driver.mobile && driver.mobile.includes(filters.search));
    const negativeMatch = filters.isNegative ? (driver.walletBalance < 0) : true;
    return searchMatch && negativeMatch;
  });

  return (
    <div className="wallet-page anim-fade-in">
      <div className="page-header-refined">
        <div className="title-group-refined">
          <h1 className="page-title-refined">Financial & Wallet</h1>
          <p className="page-subtitle-refined">Manage system-wide balances, driver adjustments, and payouts.</p>
        </div>
        <button className="btn-refresh-wallet" onClick={fetchData} disabled={loading}>
          {loading ? 'Syncing...' : '↻ Refresh Data'}
        </button>
      </div>

      {/* Tabs Header */}
      <div className="wallet-tabs-container">
        <button 
          className={`wallet-tab-item ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <span className="tab-icon">📊</span>
          Overview
        </button>
        <button 
          className={`wallet-tab-item ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          <span className="tab-icon">📜</span>
          Logs
        </button>
        <button 
          className={`wallet-tab-item ${activeTab === 'withdrawals' ? 'active' : ''}`}
          onClick={() => setActiveTab('withdrawals')}
        >
          <span className="tab-icon">💸</span>
          Withdrawals
          {withdrawals.length > 0 && <span className="tab-badge">{withdrawals.length}</span>}
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="filters-container-wallet">
            <div className="search-control">
              <input 
                type="text" 
                placeholder="Search Name or Mobile..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            <div className="checkbox-item">
              <label>
                <input 
                  type="checkbox" 
                  checked={filters.isNegative}
                  onChange={(e) => handleFilterChange('isNegative', e.target.checked)}
                />
                Show Negative Only
              </label>
            </div>
          </div>

          <div className="wallet-table-container">
            <div className="scrollable-table-wrapper">
              <table className="wallet-data-table simplified">
                <thead>
                  <tr>
                    <th>Driver Details</th>
                    <th>Mobile</th>
                    <th>State</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Wallet Balance</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="5" className="loading-row">Loading driver data...</td></tr>
                  ) : error ? (
                    <tr><td colSpan="5" className="error-row">{error}</td></tr>
                  ) : filteredDrivers.length > 0 ? (
                    filteredDrivers.map((driver) => (
                      <tr key={driver._id}>
                        <td>
                          <div className="driver-profile-cell">
                            <div className="driver-avatar">{driver.fullName ? driver.fullName.charAt(0) : 'D'}</div>
                            <span className="driver-name">{driver.fullName || 'Unnamed'}</span>
                          </div>
                        </td>
                        <td>{driver.mobile}</td>
                        <td>{driver.state || 'N/A'}</td>
                        <td style={{ textTransform: 'capitalize' }}>{driver.vehicleType || 'N/A'}</td>
                        <td>
                          <span className={`status-pill ${driver.status === 'Active' ? 'status-active' : 'status-inactive'}`}>
                            {driver.status}
                          </span>
                        </td>
                        <td>
                          <span className={`balance-amount ${(driver.walletBalance || 0) < 0 ? 'negative' : ''}`}>
                            {formatCurrency(driver.walletBalance)}
                          </span>
                        </td>
                        <td>
                          <button className="btn-adjust" onClick={() => openAdjustModal(driver)}>
                            Adjust
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" className="empty-row">No drivers found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'transactions' && (
        <div className="wallet-table-container">
          <table className="wallet-data-table simplified">
            <thead>
              <tr>
                <th>Date</th>
                <th>Party Details</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Category</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="loading-row">Loading transactions...</td></tr>
              ) : transactions.length > 0 ? (
                transactions.map((tx) => (
                  <tr key={tx._id}>
                    <td>{new Date(tx.createdAt).toLocaleString()}</td>
                    <td>{tx.userId?.fullName || tx.userId || 'System'} ({tx.userId?.mobile || 'Admin'})</td>
                    <td>
                      <span className={`type-badge ${tx.type?.toLowerCase()}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className={tx.type === 'Debit' ? 'negative' : ''}>
                      {tx.type === 'Debit' ? '-' : '+'}{formatCurrency(tx.amount)}
                    </td>
                    <td>{tx.category}</td>
                    <td>{tx.description}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" className="empty-state">No transactions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'withdrawals' && (
        <div className="wallet-table-container">
          <table className="wallet-data-table simplified">
            <thead>
              <tr>
                <th>Request Date</th>
                <th>Driver</th>
                <th>Amount</th>
                <th>Bank Details</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="loading-row">Loading requests...</td></tr>
              ) : withdrawals.length > 0 ? (
                withdrawals.map((req) => (
                  <tr key={req._id}>
                    <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td>{req.driverId?.fullName} ({req.driverId?.mobile})</td>
                    <td>{formatCurrency(req.amount)}</td>
                    <td>
                      {req.bankDetails?.accountNumber ? (
                        <div className="bank-info-cell">
                          <strong>{req.bankDetails.bankName}</strong><br/>
                          <small>A/C: {req.bankDetails.accountNumber}</small><br/>
                          <small>IFSC: {req.bankDetails.ifscCode}</small>
                        </div>
                      ) : 'No Bank Details'}
                    </td>
                    <td>
                      <div className="action-btns">
                        <button 
                          className="btn-process" 
                          onClick={() => handleProcessWithdrawal(req._id, 'Processed')}
                          disabled={actionLoading}
                        >
                          Approve
                        </button>
                        <button 
                          className="btn-process cancel" 
                          style={{ background: '#ef4444' }}
                          onClick={() => handleProcessWithdrawal(req._id, 'Rejected')}
                          disabled={actionLoading}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="empty-state">No pending withdrawal requests.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Adjust Modal */}
      {showAdjustModal && (
        <div className="modal-overlay">
          <div className="modal-content anim-fade-in">
            <div className="modal-header">
              <h2>Adjust Wallet: {selectedDriver?.fullName}</h2>
              <button className="close-btn" onClick={() => setShowAdjustModal(false)}>&times;</button>
            </div>
            <div className="modal-mode-toggle">
              <button 
                type="button" 
                className={`mode-btn ${adjustmentData.mode === 'adjust' ? 'active' : ''}`}
                onClick={() => setAdjustmentData({...adjustmentData, mode: 'adjust'})}
              >
                Add/Deduct
              </button>
              <button 
                type="button" 
                className={`mode-btn ${adjustmentData.mode === 'set' ? 'active' : ''}`}
                onClick={() => setAdjustmentData({...adjustmentData, mode: 'set'})}
              >
                Set Directly
              </button>
            </div>

            <form className="adjustment-form" onSubmit={handleAdjustSubmit}>
              <div className="form-group">
                <label>
                  {adjustmentData.mode === 'adjust' ? 'Amount to Add/Deduct (use - for deduction)' : 'New Total Balance'}
                </label>
                <input 
                  type="number" 
                  placeholder={adjustmentData.mode === 'adjust' ? 'e.g. 500 or -200' : 'e.g. 1000'}
                  value={adjustmentData.amount}
                  onChange={(e) => setAdjustmentData({...adjustmentData, amount: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  placeholder="Reason for adjustment..."
                  value={adjustmentData.description}
                  onChange={(e) => setAdjustmentData({...adjustmentData, description: e.target.value})}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowAdjustModal(false)}>Cancel</button>
                <button type="submit" className="btn-submit" disabled={actionLoading}>
                  {actionLoading ? 'Processing...' : 'Confirm Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;
