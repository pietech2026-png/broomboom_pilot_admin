import React, { useState, useEffect } from 'react';
import './DriverDetailsModal.css';

const DriverDetailsModal = ({ driver, onClose, onSave }) => {
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (driver) {
      setStatus(driver.status || 'Pending');
    }
  }, [driver]);

  if (!driver) return null;

  const handleSave = () => {
    onSave(driver.id, status);
  };

  // Helper to check if a document is uploaded
  const isUploaded = (docKey) => {
    if (!driver.documents) return false;
    // The backend provides either the full object with .url or just the URL string
    const doc = driver.documents[docKey];
    if (typeof doc === 'string') return !!doc;
    if (typeof doc === 'object') return !!doc.url;
    return false;
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Driver Verification Details</h2>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {/* Profile Section */}
          <div className="details-grid">
            <h3 className="section-title">Personal Profile</h3>
            <div className="detail-item">
              <span className="detail-label">Full Name</span>
              <span className="detail-value">{driver.fullName || 'Not provided'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Mobile Number</span>
              <span className="detail-value">{driver.mobile || 'Not provided'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Email Address</span>
              <span className="detail-value">{driver.email || 'Not provided'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Date of Birth</span>
              <span className="detail-value">{driver.dob || 'Not provided'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Full Address</span>
              <span className="detail-value">{driver.address || 'Not provided'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">State / City / Pincode</span>
              <span className="detail-value">{driver.state || '-'} / {driver.city || '-'} / {driver.pincode || '-'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Subscription Plan</span>
              <span className={`detail-value plan-badge ${(driver.subscriptionPlan || 'Regular').toLowerCase()}`} style={{ display: 'inline-block', width: 'fit-content' }}>
                {driver.subscriptionPlan || 'Regular'}
              </span>
            </div>

            {/* KYC Section */}
            <h3 className="section-title">KYC Documents</h3>
            <div className="detail-item">
              <span className="detail-label">Aadhar Number</span>
              <span className="detail-value">{driver.aadharNumber || 'Not provided'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">PAN Number</span>
              <span className="detail-value">{driver.panNumber || 'Not provided'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">DL Number</span>
              <span className="detail-value">{driver.dlNumber || 'Not provided'}</span>
            </div>
            <div className="detail-item">
              {/* Empty slot for alignment */}
            </div>

            <div className="detail-item">
              <div className="doc-item">
                <span className="doc-name">Aadhar Card (Front)</span>
                <span className={`doc-status ${isUploaded('aadharFront') ? 'uploaded' : 'missing'}`}>
                  {isUploaded('aadharFront') ? 'Uploaded ✓' : 'Missing ✗'}
                </span>
              </div>
            </div>
            <div className="detail-item">
              <div className="doc-item">
                <span className="doc-name">Aadhar Card (Back)</span>
                <span className={`doc-status ${isUploaded('aadharBack') ? 'uploaded' : 'missing'}`}>
                  {isUploaded('aadharBack') ? 'Uploaded ✓' : 'Missing ✗'}
                </span>
              </div>
            </div>
            
            <div className="detail-item">
              <div className="doc-item">
                <span className="doc-name">PAN Card (Front)</span>
                <span className={`doc-status ${isUploaded('panFront') ? 'uploaded' : 'missing'}`}>
                  {isUploaded('panFront') ? 'Uploaded ✓' : 'Missing ✗'}
                </span>
              </div>
            </div>
            <div className="detail-item">
              <div className="doc-item">
                <span className="doc-name">PAN Card (Back)</span>
                <span className={`doc-status ${isUploaded('panBack') ? 'uploaded' : 'missing'}`}>
                  {isUploaded('panBack') ? 'Uploaded ✓' : 'Missing ✗'}
                </span>
              </div>
            </div>
            <div className="detail-item">
              <div className="doc-item">
                <span className="doc-name">Driving License (Front)</span>
                <span className={`doc-status ${isUploaded('dlFront') ? 'uploaded' : 'missing'}`}>
                  {isUploaded('dlFront') ? 'Uploaded ✓' : 'Missing ✗'}
                </span>
              </div>
            </div>
            <div className="detail-item">
              <div className="doc-item">
                <span className="doc-name">Driving License (Back)</span>
                <span className={`doc-status ${isUploaded('dlBack') ? 'uploaded' : 'missing'}`}>
                  {isUploaded('dlBack') ? 'Uploaded ✓' : 'Missing ✗'}
                </span>
              </div>
            </div>

            {/* Vehicle Section */}
            <h3 className="section-title">Vehicle Details</h3>
            <div className="detail-item">
              <span className="detail-label">Vehicle Type</span>
              <span className="detail-value">{driver.vehicleType || 'Not provided'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">RC Number</span>
              <span className="detail-value">{driver.rcNumber || 'Not provided'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Sitting Capacity</span>
              <span className="detail-value">{driver.sittingCapacity || 'Not provided'}</span>
            </div>

            <div className="detail-item">
              <div className="doc-item">
                <span className="doc-name">RC Document (Front)</span>
                <span className={`doc-status ${isUploaded('rcFront') ? 'uploaded' : 'missing'}`}>
                  {isUploaded('rcFront') ? 'Uploaded ✓' : 'Missing ✗'}
                </span>
              </div>
            </div>
            <div className="detail-item">
              <div className="doc-item">
                <span className="doc-name">RC Document (Back)</span>
                <span className={`doc-status ${isUploaded('rcBack') ? 'uploaded' : 'missing'}`}>
                  {isUploaded('rcBack') ? 'Uploaded ✓' : 'Missing ✗'}
                </span>
              </div>
            </div>
            <div className="detail-item">
              <div className="doc-item">
                <span className="doc-name">Vehicle Photo (Front)</span>
                <span className={`doc-status ${isUploaded('carFront') ? 'uploaded' : 'missing'}`}>
                  {isUploaded('carFront') ? 'Uploaded ✓' : 'Missing ✗'}
                </span>
              </div>
            </div>
            <div className="detail-item">
              <div className="doc-item">
                <span className="doc-name">Vehicle Photo (Back)</span>
                <span className={`doc-status ${isUploaded('carBack') ? 'uploaded' : 'missing'}`}>
                  {isUploaded('carBack') ? 'Uploaded ✓' : 'Missing ✗'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div className="status-control">
            <label>Driver Account Status:</label>
            <select 
              className="modal-status-select" 
              value={status} 
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Active">Active</option>
              <option value="Verified">Verified</option>
              <option value="Under Review">Under Review</option>
              <option value="Pending">Pending</option>
              <option value="Blocked">Blocked</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          {driver.statusReason && (
            <div className="modal-reason-display">
              <strong>Reason:</strong> {driver.statusReason}
            </div>
          )}
          
          <button className="btn-save" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriverDetailsModal;
