import React, { useState, useEffect } from 'react';
import './DriverEditPage.css';
import { updateDriver } from '../api/driverService';
import { uploadFile } from '../api/fileService';
import { INDIA_STATES } from '../utils/indiaStates';

// Placeholder image URLs for cases where no image exists
const DEFAULT_DOC_IMAGES = {
  aadharFront: 'https://placehold.co/600x400/e0f2fe/0369a1?text=Aadhar+Front',
  aadharBack:  'https://placehold.co/600x400/e0f2fe/0369a1?text=Aadhar+Back',
  panFront:    'https://placehold.co/600x400/fef9c3/854d0e?text=PAN+Front',
  panBack:     'https://placehold.co/600x400/fef9c3/854d0e?text=PAN+Back',
  dlFront:     'https://placehold.co/600x400/f0fdf4/166534?text=DL+Front',
  dlBack:      'https://placehold.co/600x400/f0fdf4/166534?text=DL+Back',
  rcFront:     'https://placehold.co/600x400/fdf4ff/7e22ce?text=RC+Front',
  rcBack:      'https://placehold.co/600x400/fdf4ff/7e22ce?text=RC+Back',
  carFront:    'https://placehold.co/600x400/fff7ed/c2410c?text=Vehicle+Front',
  carBack:     'https://placehold.co/600x400/fff7ed/c2410c?text=Vehicle+Back',
};

const fixImageUrl = (url) => {
  if (!url) return null;
  // Fix for Android Emulator URLs which are unreachable from web browser
  if (typeof url === 'string' && url.includes('10.0.2.2')) {
    return url.replace('10.0.2.2', 'localhost');
  }
  return url;
};

const DocCard = ({ docKey, label, imageUrl, isPlaceholder, isUploading, onPreview, onUpload }) => (
  <div className="doc-card">
    <div
      className={`doc-card-thumb ${!isPlaceholder ? 'has-image' : 'no-image'}`}
      onClick={() => {
        if (isUploading) return;
        !isPlaceholder ? onPreview(docKey, label) : document.getElementById(`upload-${docKey}`).click();
      }}
    >
      {!isPlaceholder ? (
        <>
          {imageUrl?.toLowerCase().endsWith('.pdf') ? (
            <div className="pdf-thumbnail">
              <span className="pdf-icon">📄</span>
              <span className="pdf-label">PDF View</span>
            </div>
          ) : (
            <img src={imageUrl} alt={label} />
          )}
          <div className="doc-card-overlay">
            <span className="doc-card-zoom-icon">&#128269;</span>
          </div>
        </>
      ) : (
        <div className="doc-card-placeholder">
          <span className="doc-placeholder-icon">&#128196;</span>
          <span className="doc-placeholder-text">No file</span>
        </div>
      )}
    </div>

    <div className="doc-card-footer">
      <span className="doc-card-label">{label}</span>

      <input
        type="file"
        accept="image/*,application/pdf"
        id={`upload-${docKey}`}
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files[0]) {
            onUpload(docKey, e.target.files[0]);
          }
        }}
      />

      <button
        className={`doc-toggle-btn ${!isPlaceholder ? 'uploaded' : 'missing'} ${isUploading ? 'uploading' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          if (!isUploading) {
            document.getElementById(`upload-${docKey}`).click();
          }
        }}
        disabled={isUploading}
      >
        {isUploading ? 'Uploading...' : (!isPlaceholder ? 'Uploaded ✓' : 'Missing ✗')}
      </button>
    </div>
  </div>
);

const ImageLightbox = ({ docKey, label, imageUrl, onClose }) => {
  if (!docKey) return null;
  const isPdf = imageUrl?.toLowerCase().endsWith('.pdf');

  return (
    <div className="lightbox-backdrop" onClick={onClose}>
      <div className="lightbox-container" onClick={(e) => e.stopPropagation()}>
        <div className="lightbox-header">
          <span className="lightbox-title">{label}</span>
          <button className="lightbox-close" onClick={onClose}>&times;</button>
        </div>
        <div className="lightbox-body">
          {isPdf ? (
            <iframe src={imageUrl} title={label} className="lightbox-pdf-viewer" />
          ) : (
            <img src={imageUrl} alt={label} className="lightbox-image" />
          )}
        </div>
        <div className="lightbox-footer">
          <a 
            href={imageUrl} 
            download 
            className="lightbox-download-btn"
            target="_blank" 
            rel="noreferrer"
          >
            &#8681; Download {isPdf ? 'PDF' : 'Image'}
          </a>
        </div>
      </div>
    </div>
  );
};

// Convert Flutter DOB format (D/M/YYYY or DD/MM/YYYY) to YYYY-MM-DD for <input type="date">
const normalizeDob = (dob) => {
  if (!dob) return '';
  // Already correct format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dob)) return dob;
  // Handle D/M/YYYY or DD/MM/YYYY
  const parts = dob.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  return dob;
};

const DriverEditPage = ({ driver, onBack, onSave }) => {
  const [form, setForm] = useState({ ...driver, dob: normalizeDob(driver.dob) });
  const [docImages, setDocImages] = useState({});
  const [lightbox, setLightbox] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState({});
  const [error, setError] = useState(null);
  const [showPlanChangeTooltip, setShowPlanChangeTooltip] = useState(false);

  useEffect(() => {
    // Initialize image URLs from driver documents or defaults
    const initialImages = { ...DEFAULT_DOC_IMAGES };
    if (driver.documents) {
      Object.keys(driver.documents).forEach(key => {
        const doc = driver.documents[key];
        if (doc) {
          const url = typeof doc === 'string' ? doc : doc.url;
          const fixedUrl = fixImageUrl(url);
          if (fixedUrl) {
            initialImages[key] = fixedUrl;
          }
        }
      });
    }
    setDocImages(initialImages);
  }, [driver]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (field, file) => {
    const isPdf = file.type === 'application/pdf';
    const localPreviewUrl = isPdf ? null : URL.createObjectURL(file);
    
    if (!isPdf) {
      setDocImages((prev) => ({ ...prev, [field]: localPreviewUrl }));
    }
    
    setUploadingDocs((prev) => ({ ...prev, [field]: true }));
    setError(null);
    try {
      const serverUrl = await uploadFile(file);
      const fixedUrl = fixImageUrl(serverUrl);
      setDocImages((prev) => ({ ...prev, [field]: fixedUrl }));
    } catch (err) {
      setError(`Upload failed for ${field}: ${err.message}. File will not persist after refresh.`);
    } finally {
      setUploadingDocs((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handlePreview = (docKey, label) => {
    setLightbox({ docKey, label, imageUrl: docImages[docKey] });
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const documentsUpdate = {};
      Object.keys(docImages).forEach(key => {
        if (docImages[key] !== DEFAULT_DOC_IMAGES[key]) {
          documentsUpdate[key] = { url: docImages[key] };
        }
      });

      const updateData = {
        fullName: form.fullName,
        mobile: form.mobile,
        email: form.email,
        dob: form.dob,
        address: form.address,
        state: form.state,
        city: form.city,
        pincode: form.pincode,
        // Document Numbers
        aadharNumber: form.aadharNumber,
        panNumber: form.panNumber,
        dlNumber: form.dlNumber,
        rcNumber: form.rcNumber,
        sittingCapacity: form.sittingCapacity || '4 Seater',
        
        status: form.status,
        statusReason: form.statusReason,
        supportMethod: form.supportMethod || 'Call',
        supportValue: form.supportValue || '',
        subscriptionPlan: form.subscriptionPlan || 'Regular',
        dutyStatus: form.dutyStatus || 'Offline',
        documents: documentsUpdate,
        verifyAt: form.status === 'Active' ? new Date().toISOString() : form.verifyAt
      };

      await updateDriver(driver.id, updateData);
      onSave({ ...form, documents: documentsUpdate });
    } catch (err) {
      setError(err.message || 'Failed to save driver updates');
    } finally {
      setIsLoading(false);
    }
  };

  const docConfig = [
    { key: 'aadharFront', label: 'Aadhar Front' },
    { key: 'aadharBack',  label: 'Aadhar Back' },
    { key: 'panFront',    label: 'PAN Front' },
    { key: 'panBack',     label: 'PAN Back' },
    { key: 'dlFront',     label: 'DL Front' },
    { key: 'dlBack',      label: 'DL Back' },
    { key: 'rcFront',     label: 'RC Front' },
    { key: 'rcBack',      label: 'RC Back' },
    { key: 'carFront',    label: 'Vehicle Front' },
    { key: 'carBack',     label: 'Vehicle Back' },
  ];

  return (
    <div className="edit-page-container">
      {lightbox && (
        <ImageLightbox
          docKey={lightbox.docKey}
          label={lightbox.label}
          imageUrl={lightbox.imageUrl}
          onClose={() => setLightbox(null)}
        />
      )}

      <div className="edit-page-header">
        <div className="edit-page-header-left">
          <button className="btn-back" onClick={onBack}>&#8592; Back</button>
          <div>
            <h1 className="edit-page-title">Edit Driver — {form.fullName || '(New Signup)'}</h1>
            <p className="edit-page-subtitle">Update driver profile and verification documents below.</p>
          </div>
        </div>
        <div className="edit-page-header-actions">
          {(form.lastPlanChange || driver.lastPlanChange) && (
            <div className="notification-bell-container">
              <button 
                className={`notification-bell-btn ${(form.isPlanChangeSeenByAdmin === false || driver.isPlanChangeSeenByAdmin === false) ? 'has-unread' : ''}`}
                onClick={() => setShowPlanChangeTooltip(!showPlanChangeTooltip)}
              >
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                {(form.isPlanChangeSeenByAdmin === false || driver.isPlanChangeSeenByAdmin === false) && <span className="unread-dot" />}
              </button>
              {showPlanChangeTooltip && (
                <div className="plan-change-popup">
                  <div className="popup-arrow" />
                  <div className="popup-content">
                    <div className="popup-header">
                      <span className="popup-icon">&#128227;</span>
                      <span className="popup-title">Plan Upgrade Message</span>
                    </div>
                    <div className="popup-body">
                      The driver has upgraded their subscription to <span className="plan-name">{form.subscriptionPlan}</span>.
                    </div>
                    <div className="popup-footer">
                      <strong>Updated On:</strong> {new Date(form.lastPlanChange || driver.lastPlanChange).toLocaleString('en-IN', {
                        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <button className="btn-cancel" onClick={onBack}>Cancel</button>
          <button className="btn-save-page" onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="edit-page-body">
        {error && <div className="error-banner">{error}</div>}
        
        <div className="edit-section-card">
          <h2 className="edit-section-title">Personal Profile</h2>
          <div className="edit-fields-grid">
            <div className="edit-field">
              <label>Full Name</label>
              <input type="text" value={form.fullName || ''} onChange={(e) => handleChange('fullName', e.target.value)} />
            </div>
            <div className="edit-field">
              <label>Mobile Number</label>
              <input type="text" value={form.mobile || ''} onChange={(e) => handleChange('mobile', e.target.value)} disabled />
            </div>
            <div className="edit-field">
              <label>Email Address</label>
              <input type="email" value={form.email || ''} onChange={(e) => handleChange('email', e.target.value)} />
            </div>
            <div className="edit-field">
              <label>Date of Birth</label>
              <input type="date" value={form.dob || ''} onChange={(e) => handleChange('dob', e.target.value)} />
            </div>
            <div className="edit-field edit-field-full">
              <label>Full Address</label>
              <input type="text" value={form.address || ''} onChange={(e) => handleChange('address', e.target.value)} />
            </div>
            <div className="edit-field">
              <label>State</label>
              <select value={form.state || ''} onChange={(e) => handleChange('state', e.target.value)}>
                <option value="">Select State</option>
                {INDIA_STATES.map(st => <option key={st} value={st}>{st}</option>)}
              </select>
            </div>
            <div className="edit-field">
              <label>City</label>
              <input type="text" value={form.city || ''} onChange={(e) => handleChange('city', e.target.value)} />
            </div>
            <div className="edit-field">
              <label>Pincode</label>
              <input type="text" value={form.pincode || ''} onChange={(e) => handleChange('pincode', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="edit-section-card">
          <h2 className="edit-section-title">KYC & Vehicle Identifiers</h2>
          <div className="edit-fields-grid">
            <div className="edit-field">
              <label>Aadhar Number</label>
              <input type="text" value={form.aadharNumber || ''} onChange={(e) => handleChange('aadharNumber', e.target.value)} placeholder="0000 0000 0000" />
            </div>
            <div className="edit-field">
              <label>PAN Number</label>
              <input type="text" value={form.panNumber || ''} onChange={(e) => handleChange('panNumber', e.target.value)} placeholder="ABCDE1234F" />
            </div>
            <div className="edit-field">
              <label>Driving License (DL) No</label>
              <input type="text" value={form.dlNumber || ''} onChange={(e) => handleChange('dlNumber', e.target.value)} placeholder="DL-00000000000" />
            </div>
            <div className="edit-field">
              <label>Vehicle RC Number</label>
              <input type="text" value={form.rcNumber || ''} onChange={(e) => handleChange('rcNumber', e.target.value)} placeholder="MH01AB1234" />
            </div>
            <div className="edit-field">
              <label>Sitting Capacity</label>
              <select value={form.sittingCapacity || '4 Seater'} onChange={(e) => handleChange('sittingCapacity', e.target.value)}>
                <option value="4 Seater">4 Seater</option>
                <option value="6 Seater">6 Seater</option>
                <option value="7 Seater">7 Seater</option>
                <option value="13 Seater">13 Seater</option>
                <option value="15 Seater">15 Seater</option>
                <option value="17 Seater">17 Seater</option>
                <option value="25 Seater">25 Seater</option>
              </select>
            </div>
          </div>
        </div>

        <div className="edit-section-card">
          <h2 className="edit-section-title">Verification Documents</h2>
          <p className="edit-doc-subtitle">Upload or update verification images for KYC and Vehicle</p>
          <div className="doc-card-grid">
            {docConfig.map((doc) => (
              <DocCard
                key={doc.key}
                docKey={doc.key}
                label={doc.label}
                imageUrl={docImages[doc.key]}
                isPlaceholder={
                  !docImages[doc.key] || 
                  docImages[doc.key] === DEFAULT_DOC_IMAGES[doc.key] || 
                  (typeof docImages[doc.key] === 'string' && docImages[doc.key].includes('placehold.co'))
                }
                isUploading={uploadingDocs[doc.key]}
                onPreview={handlePreview}
                onUpload={handleImageUpload}
              />
            ))}
          </div>
        </div>

        <div className="edit-section-card">
          <div className="subscription-plan-section-header">
            <h2 className="edit-section-title">Upgrade & Status</h2>
          </div>
          <div className="edit-fields-grid">
            <div className="edit-field">
              <div className="subscription-plan-label-wrapper">
                <label>Subscription Plan</label>
              </div>
              <select value={form.subscriptionPlan || 'None'} onChange={(e) => handleChange('subscriptionPlan', e.target.value)}>
                <option value="None">None</option>
                <option value="Regular">Regular</option>
                <option value="Prime">Prime</option>
              </select>
            </div>
            <div className="edit-field">
              <label>Driver Status</label>
              <select value={form.dutyStatus || 'Offline'} onChange={(e) => handleChange('dutyStatus', e.target.value)}>
                <option value="Online">Online</option>
                <option value="Offline">Offline</option>
                <option value="On Ride">On Ride</option>
              </select>
            </div>
            <div className="edit-field">
              <label>Verification Status</label>
              <select value={form.status || ''} onChange={(e) => handleChange('status', e.target.value)}>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Blocked">Blocked</option>
              </select>
            </div>
            {(form.status === 'Pending' || form.status === 'Blocked' || form.status === 'Rejected') && (
              <>
                <div className="edit-field edit-field-full">
                  <label>Status Reason (visible to driver)</label>
                  <textarea 
                    className="edit-textarea"
                    value={form.statusReason || ''} 
                    onChange={(e) => handleChange('statusReason', e.target.value)}
                    placeholder="Explain why the status was changed..."
                  />
                </div>
                <div className="edit-field">
                  <label>Support Method</label>
                  <select 
                    value={form.supportMethod || 'Call'} 
                    onChange={(e) => handleChange('supportMethod', e.target.value)}
                  >
                    <option value="Call">Phone Call</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Chat">Live Chat</option>
                  </select>
                </div>
                <div className="edit-field">
                  <label>Support Contact Info (Number/Link)</label>
                  <input 
                    type="text" 
                    value={form.supportValue || ''} 
                    onChange={(e) => handleChange('supportValue', e.target.value)}
                    placeholder={form.supportMethod === 'Call' ? '+91 98765 43210' : 'https://wa.me/919876543210'}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverEditPage;