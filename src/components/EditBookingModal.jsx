import React, { useState, useEffect } from 'react';
import './EditBookingModal.css';
import { updateBooking, unassignDriver, getNotifications, markNotificationAsRead } from '../api/bookingService';
import { getDrivers, getStates } from '../api/driverService';
import { INDIA_STATES } from '../utils/indiaStates';

const EditBookingModal = ({ booking, onClose, onSave }) => {
  const [formData, setFormData] = useState({ ...booking });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [assignMessage, setAssignMessage] = useState(null);

  // Pilot Allocation State
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [pilotSearchTerm, setPilotSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSeater, setSelectedSeater] = useState(booking.seater || '');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [isFetchingDrivers, setIsFetchingDrivers] = useState(false);
  const [allStates, setAllStates] = useState([]);
  
  // State filter for pilot search - default to booking state
  const [pilotStateFilter, setPilotStateFilter] = useState(booking.state || '');

  // Multi-Allocate State
  const [isMultiAllocateMode, setIsMultiAllocateMode] = useState(false);
  const [selectedPilotIds, setSelectedPilotIds] = useState(new Set());

  // Notification State for this specific booking
  const [bookingNotifications, setBookingNotifications] = useState([]);
  const [showBookingNotifications, setShowBookingNotifications] = useState(false);

  const fetchBookingNotifications = async () => {
    try {
      const data = await getNotifications({ bookingId: formData.id });
      setBookingNotifications(data);
    } catch (err) {
      console.error('Error fetching booking notifications:', err);
    }
  };

  useEffect(() => {
    if (formData.id) {
      fetchBookingNotifications();
      const interval = setInterval(fetchBookingNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [formData.id]);

  const handleNotificationRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      fetchBookingNotifications();
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  useEffect(() => {
    setFormData({ ...booking });
    // Also sync pilot search defaults when booking changes
    if (booking.state) setPilotStateFilter(booking.state);
    if (booking.seater) setSelectedSeater(booking.seater);
  }, [booking]);

  useEffect(() => {
    // Initial fetch of drivers and state list
    fetchAvailableDrivers();
    loadStates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedSeater, selectedPlan, pilotStateFilter]);

  // Dynamic search on type (with slight debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAvailableDrivers();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pilotSearchTerm]);

  const loadStates = async () => {
    try {
      const states = await getStates();
      setAllStates(states);
    } catch (err) {
      console.warn('Failed to load state list:', err);
    }
  };

  const fetchAvailableDrivers = async () => {
    setIsFetchingDrivers(true);
    try {
      const filters = {
        category: selectedCategory,
        seater: selectedSeater,
        plan: selectedPlan,
        search: pilotSearchTerm,
        state: pilotStateFilter, // Use local pilotStateFilter
        limit: 1000 // Show all drivers as requested
      };
      console.log('DEBUG: Fetching Pilots with filters:', filters); // LOG TO DEBUG
      console.log('DEBUG: Booking state was:', booking.state); // LOG TO DEBUG
      const data = await getDrivers(filters);
      console.log('DEBUG: Available Drivers with Status:', data.drivers);
      setAvailableDrivers(data.drivers || []);
    } catch (err) {
      console.error('Error fetching drivers:', err);
    } finally {
      setIsFetchingDrivers(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpdateContact = async () => {
    setLoading(true);
    try {
      await updateBooking(formData.id, { 
        customerName: formData.userName, 
        customerMobile: formData.mobileNumber 
      });
      setAssignMessage({ text: 'Contact info updated successfully!', type: 'success' });
    } catch (err) {
      setError('Failed to update contact info');
    } finally {
      setLoading(false);
      setTimeout(() => setAssignMessage(null), 3000);
    }
  };

  const handleUnassign = async () => {
    if (!window.confirm('Are you sure you want to unassign the current driver?')) return;
    setLoading(true);
    try {
      await unassignDriver(formData.id);
      setFormData(prev => ({ 
        ...prev, 
        assignedDriverMobile: null, 
        acceptedByPilot: null, 
        allocatedPilot: null, 
        eligiblePilots: [],
        allocateOurPilot: false,
        bookingStatus: 'Pending' 
      }));
      setAssignMessage({ text: 'Driver unassigned successfully', type: 'success' });
      onSave(); // Refresh parent list
    } catch (err) {
      setError('Failed to unassign driver');
    } finally {
      setLoading(false);
      setTimeout(() => setAssignMessage(null), 3000);
    }
  };

  const handleAllocate = async (driver) => {
    setLoading(true);
    try {
      const allocationData = {
        eligiblePilots: [{
          name: driver.fullName,
          mobile: driver.mobile,
          id: driver.id
        }],
        isOwnPilotAllocated: true,
        status: 'Pending'
      };
      await updateBooking(formData.id, allocationData);
      setFormData(prev => ({ 
        ...prev, 
        eligiblePilots: allocationData.eligiblePilots,
        allocateOurPilot: true,
        bookingStatus: 'Pending'
      }));
      setAssignMessage({ text: 'Pilot allocated successfully!', type: 'success' });
      onSave(); // Refresh parent list
    } catch (err) {
      setError('Failed to allocate pilot');
    } finally {
      setLoading(false);
      setTimeout(() => setAssignMessage(null), 3000);
    }
  };

  const handleMultiAllocate = async () => {
    if (selectedPilotIds.size === 0) {
      alert('Please select at least one pilot.');
      return;
    }
    
    setLoading(true);
    try {
      const selectedPilots = availableDrivers.filter(d => selectedPilotIds.has(d.id));
      const pilotNames = selectedPilots.map(p => p.fullName).join(', ');
      
      // Since backend currently only supports ONE allocatedPilot, 
      // we will take the FIRST one but send a specific timeline message if multiple selected.
      // In a real app, this might hit a "broadcast" endpoint.
      const primaryDriver = selectedPilots[0];
      
      const allocationData = {
        eligiblePilots: selectedPilots.map(p => ({
          id: p.id,
          name: p.fullName,
          mobile: p.mobile
        })),
        isOwnPilotAllocated: true,
        status: 'Pending',
        timelineMessage: `Booking was restricted to ${selectedPilots.length} specific pilots: ${pilotNames}`
      };

      await updateBooking(formData.id, allocationData);
      
      setFormData(prev => ({ 
        ...prev, 
        eligiblePilots: allocationData.eligiblePilots,
        allocateOurPilot: true,
        bookingStatus: 'Pending' 
      }));
      
      setAssignMessage({ text: `Allocated to ${selectedPilots.length} pilots!`, type: 'success' });
      alert('Booking Sent');
      setIsMultiAllocateMode(false);
      setSelectedPilotIds(new Set());
      // Removed onSave() to remain on the same screen as requested
    } catch (err) {
      setError('Failed to broadcast allocation');
    } finally {
      setLoading(false);
      setTimeout(() => setAssignMessage(null), 3000);
    }
  };

  const togglePilotSelection = (id) => {
    setSelectedPilotIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const [viewingDriver, setViewingDriver] = useState(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  const handleViewDriverDetails = async () => {
    const driverId = formData.allocatedPilot?.id || formData.acceptedByPilot?.id;
    if (!driverId) return;

    setIsFetchingDetails(true);
    try {
      const details = await getDrivers({ search: formData.allocatedPilot?.mobile });
      // Find exact match
      const driver = details.drivers.find(d => d.mobile === (formData.allocatedPilot?.mobile || formData.acceptedByPilot?.mobile));
      setViewingDriver(driver);
    } catch (err) {
      console.error('Error fetching driver details:', err);
      alert('Failed to load driver details');
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Re-map nested fields if needed on save
      await updateBooking(booking.id, formData);
      onSave();
    } catch (err) {
      console.error('Update Error:', err);
      setError(err.message || 'Failed to update booking');
    } finally {
      setLoading(false);
    }
  };

  if (!booking) return null;

  if (!booking) return null;

  return (
    <div className="edit-page-container anim-fade-in">
      <div className="edit-page-header">
        <div className="header-left">
          <button className="btn-back-link" onClick={onClose}>← Back to Booking List</button>
          <h1 className="edit-page-title">
            Management Dashboard - Booking #{formData.orderId}
            {formData.allocateOurPilot && (
              <span className="allocate-pilot-tag">Allocate Our Pilot Selected</span>
            )}
          </h1>
        </div>
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center' }}>
          <div className="booking-notification-wrapper" style={{ position: 'relative', marginRight: '15px' }}>
            <button 
              type="button" 
              className="btn-notification-bell" 
              onClick={() => setShowBookingNotifications(!showBookingNotifications)}
              style={{ 
                background: 'white', 
                border: '1px solid #e2e8f0', 
                borderRadius: '50%', 
                padding: '8px', 
                cursor: 'pointer',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}
              title="Ride Notifications"
            >
              🔔
              {bookingNotifications.filter(n => !n.isRead).length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  background: '#ef4444',
                  color: 'white',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  fontSize: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  border: '2px solid white'
                }}>
                  {bookingNotifications.filter(n => !n.isRead).length}
                </span>
              )}
            </button>

            {showBookingNotifications && (
              <div className="booking-notification-dropdown" style={{
                position: 'absolute',
                top: '100%',
                right: '0',
                width: '320px',
                backgroundColor: 'white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                borderRadius: '12px',
                zIndex: 1001,
                maxHeight: '400px',
                overflowY: 'auto',
                border: '1px solid #e2e8f0',
                marginTop: '10px',
                padding: '10px'
              }}>
                <div style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', fontWeight: 'bold', marginBottom: '8px' }}>
                  Trip Alerts
                </div>
                {bookingNotifications.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                    No activity alerts for this ride.
                  </div>
                ) : (
                  bookingNotifications.map(n => (
                    <div key={n._id} style={{ 
                      padding: '10px', 
                      borderRadius: '8px',
                      backgroundColor: n.isRead ? 'transparent' : '#f0f7ff',
                      marginBottom: '6px',
                      border: '1px solid',
                      borderColor: n.isRead ? '#f1f5f9' : '#dbeafe',
                      textAlign: 'left'
                    }}>
                      <div style={{ 
                        fontSize: '12px', 
                        fontWeight: 'bold', 
                        color: n.type === 'Cancellation' ? '#ef4444' : '#2563eb',
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}>
                        {n.title}
                        <span style={{ fontWeight: 'normal', color: '#94a3b8', fontSize: '10px' }}>
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#334155', marginTop: '4px', lineHeight: '1.4' }}>{n.message}</div>
                      <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                        {new Date(n.createdAt).toLocaleDateString()}
                      </div>
                      {!n.isRead && (
                        <button 
                          type="button"
                          onClick={() => handleNotificationRead(n._id)}
                          style={{ 
                            marginTop: '6px', 
                            fontSize: '10px', 
                            color: '#2563eb', 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer',
                            padding: 0,
                            fontWeight: '600'
                          }}
                        >
                          Mark as seen
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <button type="button" className="btn-save-top" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {assignMessage && <div className={`message-banner ${assignMessage.type}`}>{assignMessage.text}</div>}

      <div className="edit-page-content">
          <form onSubmit={handleSubmit} className="edit-booking-form">
            <div className="form-main-content">
              {/* SECTION 1: CUSTOMER & SERVICE TYPE */}
              <div className="edit-form-section">
                <h3 className="section-header">👤 Customer & Service Type</h3>
                <div className="edit-input-grid">
                  <div className="edit-input-field">
                    <label>User Name</label>
                    <input type="text" value={formData.userName} onChange={(e) => handleChange('userName', e.target.value)} required />
                  </div>
                  <div className="edit-input-field">
                    <label>Mobile Number</label>
                    <input type="tel" value={formData.mobileNumber} onChange={(e) => handleChange('mobileNumber', e.target.value)} required />
                  </div>
                  <div className="edit-input-field">
                    <label>Booking Type</label>
                    <select value={formData.bookingType} onChange={(e) => handleChange('bookingType', e.target.value)} required>
                      <option value="Outstation">Outstation</option>
                      <option value="Rental">Rental</option>
                      <option value="Airport Ride">Airport Ride</option>
                      <option value="Station Ride">Station Ride</option>
                    </select>
                  </div>
                  {formData.bookingType === 'Outstation' && (
                    <div className="edit-input-field">
                      <label>Way Type</label>
                      <select value={formData.wayType} onChange={(e) => handleChange('wayType', e.target.value)}>
                        <option value="One-way">One-way</option>
                        <option value="Roundtrip">Roundtrip</option>
                      </select>
                    </div>
                  )}
                  {formData.bookingType === 'Airport Ride' && (
                    <div className="edit-input-field">
                      <label>Airport Direction</label>
                      <select value={formData.airportDirection} onChange={(e) => handleChange('airportDirection', e.target.value)}>
                        <option value="From airport">From airport</option>
                        <option value="To Airport">To Airport</option>
                      </select>
                    </div>
                  )}
                  {formData.bookingType === 'Rental' && (
                    <div className="edit-input-field">
                      <label>Rental Package</label>
                      <select value={formData.rentalPackage} onChange={(e) => handleChange('rentalPackage', e.target.value)}>
                        <option value="1-10">1 Hour - 10 KM</option>
                        <option value="5-50">5 Hours - 50 KM</option>
                        <option value="8-80">8 Hours - 80 KM</option>
                      </select>
                    </div>
                  )}
                  <div className="edit-input-field">
                    <label>Pickup Date & Time</label>
                    <input type="datetime-local" value={formData.pickupDateTime} onChange={(e) => handleChange('pickupDateTime', e.target.value)} required />
                  </div>
                  {formData.bookingType === 'Outstation' && formData.wayType === 'Roundtrip' && (
                    <div className="edit-input-field">
                      <label>Return Date & Time</label>
                      <input type="datetime-local" value={formData.returnTime} onChange={(e) => handleChange('returnTime', e.target.value)} />
                    </div>
                  )}
                  <div className="edit-input-field">
                    <label>Driver Status</label>
                    <select value={formData.bookingStatus} onChange={(e) => handleChange('bookingStatus', e.target.value)}>
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Outstation">Outstation</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: ROUTE & TIMELINE */}
              <div className="edit-form-section">
                <h3 className="section-header">📍 Route & Timeline</h3>
                <div className="edit-input-grid">
                  <div className="edit-input-field full-width">
                    <label>Pickup Location</label>
                    <input type="text" value={formData.pickupLocation} onChange={(e) => handleChange('pickupLocation', e.target.value)} />
                  </div>
                  <div className="edit-input-field full-width">
                    <label>Drop Location</label>
                    <input type="text" value={formData.dropLocation} onChange={(e) => handleChange('dropLocation', e.target.value)} />
                  </div>
                  <div className="edit-input-field">
                    <label>Pincode</label>
                    <input type="text" value={formData.pincode} onChange={(e) => handleChange('pincode', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* SECTION 3: GPS COORDINATES */}
              <div className="edit-form-section">
                <h3 className="section-header">🗺️ GPS Coordinates</h3>
                <div className="edit-input-grid">
                  <div className="edit-input-field">
                    <label>Pickup Latitude</label>
                    <input type="text" value={formData.pickupLat} onChange={(e) => handleChange('pickupLat', e.target.value)} />
                  </div>
                  <div className="edit-input-field">
                    <label>Pickup Longitude</label>
                    <input type="text" value={formData.pickupLng} onChange={(e) => handleChange('pickupLng', e.target.value)} />
                  </div>
                  <div className="edit-input-field">
                    <label>Drop Latitude</label>
                    <input type="text" value={formData.dropLat} onChange={(e) => handleChange('dropLat', e.target.value)} />
                  </div>
                  <div className="edit-input-field">
                    <label>Drop Longitude</label>
                    <input type="text" value={formData.dropLng} onChange={(e) => handleChange('dropLng', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* SECTION 4: VEHICLE & DETAILS */}
              <div className="edit-form-section">
                <h3 className="section-header">🚗 Vehicle & Details</h3>
                <div className="edit-input-grid">
                  <div className="edit-input-field">
                    <label>Distance (km)</label>
                    <input type="number" value={formData.distance} onChange={(e) => handleChange('distance', e.target.value)} />
                  </div>
                  <div className="edit-input-field">
                    <label>Vehicle Category</label>
                    <select value={formData.car} onChange={(e) => handleChange('car', e.target.value)}>
                      <option value="Mini">Mini</option>
                      <option value="Sedan">Sedan</option>
                      <option value="SUV">SUV</option>
                      <option value="SUV+">SUV+</option>
                      <option value="Traveller">Traveller</option>
                    </select>
                  </div>
                  <div className="edit-input-field">
                    <label>Seater</label>
                    <select value={formData.seater} onChange={(e) => handleChange('seater', e.target.value)}>
                      <option value="4">4 Seater</option>
                      <option value="6">6 Seater</option>
                      <option value="7">7 Seater</option>
                      <option value="13">13 Seater</option>
                      <option value="15">15 Seater</option>
                      <option value="17">17 Seater</option>
                      <option value="25">25 Seater</option>
                    </select>
                  </div>
                  <div className="edit-input-field">
                    <label>AC/Non-AC</label>
                    <select value={formData.ac} onChange={(e) => handleChange('ac', e.target.value)}>
                      <option value="AC">AC</option>
                      <option value="Non-AC">Non-AC</option>
                    </select>
                  </div>
                  <div className="edit-input-field checkbox-field">
                    <label>
                      <input type="checkbox" checked={formData.allocateOurPilot} onChange={(e) => handleChange('allocateOurPilot', e.target.checked)} />
                      Allocate our pilot
                    </label>
                  </div>
                </div>
              </div>

              {/* SECTION 5: PRICING & FARE */}
              <div className="edit-form-section">
                <h3 className="section-header">💳 Pricing & Total Fare</h3>
                <div className="edit-input-grid">
                  <div className="edit-input-field">
                    <label>Driver night allowance</label>
                    <input type="number" value={formData.driverNightAllowance} onChange={(e) => handleChange('driverNightAllowance', e.target.value)} />
                  </div>
                  <div className="edit-input-field">
                    <label>Toll charges</label>
                    <input type="text" value={formData.tollCharges} onChange={(e) => handleChange('tollCharges', e.target.value)} />
                  </div>
                  <div className="edit-input-field">
                    <label>Extra km</label>
                    <input type="text" value={formData.extraKm} onChange={(e) => handleChange('extraKm', e.target.value)} />
                  </div>
                  <div className="edit-input-field">
                    <label>Extra hour</label>
                    <input type="text" value={formData.extraHour} onChange={(e) => handleChange('extraHour', e.target.value)} />
                  </div>
                  <div className="edit-input-field">
                    <label>Waiting Charge</label>
                    <input type="number" value={formData.waitingCharge} onChange={(e) => handleChange('waitingCharge', e.target.value)} />
                  </div>
                  <div className="edit-input-field">
                    <label>Total Fare (₹)</label>
                    <input type="number" value={formData.totalFare} onChange={(e) => handleChange('totalFare', e.target.value)} />
                  </div>
                  <div className="edit-input-field">
                    <label>Advanced Amount</label>
                    <input type="number" value={formData.advancedAmount} onChange={(e) => handleChange('advancedAmount', e.target.value)} />
                  </div>
                  <div className="edit-input-field">
                    <label>Pilot share</label>
                    <input type="number" value={formData.pilotShare} onChange={(e) => handleChange('pilotShare', e.target.value)} />
                  </div>
                  <div className="edit-input-field">
                    <label>Company share</label>
                    <input type="number" value={formData.companyShare} onChange={(e) => handleChange('companyShare', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* SECTION 6: MANAGEMENT - BOOKING USER DETAILS */}
              <div className="edit-form-section">
                <h3 className="section-header blue">Booking User Details</h3>
                <div className="user-details-layout">
                  <div className="detail-row">
                    <span className="detail-label">Name</span>
                    <input type="text" value={formData.userName} onChange={(e) => handleChange('userName', e.target.value)} />
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Email</span>
                    <input type="email" value={formData.userEmail} onChange={(e) => handleChange('userEmail', e.target.value)} />
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Mobile Number</span>
                    <div className="input-with-button">
                      <input type="tel" value={formData.mobileNumber} onChange={(e) => handleChange('mobileNumber', e.target.value)} />
                      <button type="button" className="btn-update-small" onClick={handleUpdateContact}>Update</button>
                    </div>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">State</span>
                    <input 
                      type="text" 
                      placeholder="e.g. Maharashtra" 
                      value={formData.state || ''} 
                      onChange={(e) => handleChange('state', e.target.value)} 
                      list="states-list"
                    />
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Accepted By</span>
                    <div className="input-with-button">
                      <span className="assigned-info">
                        {formData.acceptedByPilot?.name || 'Not assigned'}
                      </span>
                      {(formData.acceptedByPilot || formData.allocatedPilot) && (
                        <button type="button" className="btn-unassign-small" onClick={handleUnassign}>Unassign</button>
                      )}
                    </div>
                  </div>
                    <div className="allocation-wrapper">
                      <span className="allocation-status">
                        {formData.allocatedPilot?.name ? (
                          <span className="anim-fade-in" style={{color: '#16a34a', fontWeight: 'bold'}}>
                            Assigned to {formData.allocatedPilot.name}
                          </span>
                        ) : 'No pilots allocated yet'}
                      </span>
                      {formData.allocatedPilot?.name && (
                        <button 
                          type="button" 
                          className="btn-view-driver-details"
                          onClick={handleViewDriverDetails}
                          disabled={isFetchingDetails}
                        >
                          {isFetchingDetails ? 'Fetching...' : 'View Driver Details'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 7: MANAGEMENT - ALLOCATE PILOTS */}
              <div className="edit-form-section">
                <h3 className="section-header purple">Allocate Pilots</h3>

                <div className="pilot-allocation-controls">
                  <div className="control-row">
                    <button 
                      type="button" 
                      className={`btn-multi-allocate ${isMultiAllocateMode ? 'active' : ''}`}
                      onClick={() => {
                        const newMode = !isMultiAllocateMode;
                        setIsMultiAllocateMode(newMode);
                        if (newMode && availableDrivers.length > 0) {
                          setSelectedPilotIds(new Set(availableDrivers.map(d => d.id)));
                        } else {
                          setSelectedPilotIds(new Set());
                        }
                      }}
                    >
                      {isMultiAllocateMode ? 'Cancel Multi' : 'Multiple Allocate'}
                    </button>
                    {isMultiAllocateMode && (
                      <button 
                        type="button" 
                        className="btn-confirm-multi"
                        onClick={handleMultiAllocate}
                        disabled={loading || selectedPilotIds.size === 0}
                      >
                        ✅ Confirm Selection ({selectedPilotIds.size})
                      </button>
                    )}
                    <button type="button" className="btn-reload" onClick={fetchAvailableDrivers}>Reload</button>
                    <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                      <option value="">choose vehicle category</option>
                      <option value="Mini">Mini</option>
                      <option value="Sedan">Sedan</option>
                      <option value="SUV">SUV</option>
                    </select>
                    <select value={selectedSeater} onChange={(e) => setSelectedSeater(e.target.value)}>
                      <option value="">Choose Seater</option>
                      <option value="4">4 Seater</option>
                      <option value="6">6 Seater</option>
                      <option value="7">7 Seater</option>
                    </select>
                    <select value={selectedPlan} onChange={(e) => setSelectedPlan(e.target.value)}>
                      <option value="">Pilot Type</option>
                      <option value="Regular">Regular</option>
                      <option value="Prime">Prime</option>
                    </select>
                    <div className="search-box">
                      <input 
                        type="text" 
                        placeholder="Search name, phone, city or state..." 
                        value={pilotSearchTerm}
                        onChange={(e) => setPilotSearchTerm(e.target.value)}
                      />
                    </div>
                       <div className="control-row extra-filters anim-fade-in">
                    <div className="search-state-wrapper">
                      <label className="filter-label">Search State</label>
                      <select 
                        value={pilotStateFilter}
                        onChange={(e) => setPilotStateFilter(e.target.value)}
                        className="state-dropdown-select"
                      >
                        <option value="">All States</option>
                        {INDIA_STATES.map(st => <option key={st} value={st}>{st}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pilot-table-container">
                  <table className="pilot-mini-table">
                    <thead>
                      <tr>
                        {isMultiAllocateMode && <th>Select</th>}
                        <th>Low Balance</th>
                        <th>Active Status</th>
                        <th>Driver Status</th>
                        <th>Pilot Name</th>
                        <th>State</th>
                        <th>Pilot Type</th>
                        <th>Mobile</th>
                        <th>Vehicle Category</th>
                        <th>Seating Capacity</th>
                        <th>City</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isFetchingDrivers ? (
                        <tr><td colSpan="11" className="loading-text">Fetching pilots...</td></tr>
                      ) : availableDrivers.length > 0 ? (
                        availableDrivers.map(driver => (
                          <tr key={driver.id} className={selectedPilotIds.has(driver.id) ? 'selected-row' : ''}>
                            {isMultiAllocateMode && (
                              <td>
                                <input 
                                  type="checkbox" 
                                  checked={selectedPilotIds.has(driver.id)}
                                  onChange={() => togglePilotSelection(driver.id)}
                                />
                              </td>
                            )}
                            <td>{driver.walletBalance < 0 ? <span className="tag-red">Yes</span> : 'No'}</td>
                            <td>{driver.status === 'Active' ? 'Yes' : 'No'}</td>
                            <td>
                              <span className={`status-badge ${(driver.dutyStatus || 'offline').toLowerCase().replace(' ', '-')}`}>
                                {driver.dutyStatus || 'Offline'}
                              </span>
                            </td>
                            <td>
                              <div className="pilot-name-cell">
                                <strong>{driver.fullName}</strong>
                                <span className="reg-at">Reg: {driver.registeredAt?.split(' ')[0]}</span>
                              </div>
                            </td>
                            <td>{driver.state || 'N/A'}</td>
                            <td>{driver.subscriptionPlan}</td>
                            <td>{driver.mobile}</td>
                            <td>{driver.vehicleType}</td>
                            <td>{driver.sittingCapacity || '4 Seater'}</td>
                            <td>{driver.city}</td>
                            <td><span className={`status-text ${driver.status.toLowerCase()}`}>{driver.status}</span></td>
                            <td>
                              <button 
                                type="button" 
                                className="btn-allocate-small"
                                onClick={() => handleAllocate(driver)}
                                disabled={loading || formData.allocatedPilot?.mobile === driver.mobile}
                              >
                                {formData.allocatedPilot?.mobile === driver.mobile ? 'Allocated' : 'Allocate'}
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="11" className="empty-text">
                            <div className="no-drivers-info">
                              {pilotStateFilter 
                                ? `No drivers found in ${pilotStateFilter}` 
                                : 'No available pilots found'}
                              <div className="active-filters-hint">
                                (Filtering by: Seater: {selectedSeater || 'Any'}, Category: {selectedCategory || 'Any'}, State: {pilotStateFilter || 'Any'})
                              </div>
                              <button type="button" className="btn-clear-filters" onClick={() => {
                                setPilotStateFilter('');
                                setSelectedSeater('');
                                setSelectedCategory('');
                                setPilotSearchTerm('');
                              }}>Clear All Filters</button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 8. Activity History */}
            <div className="booking-form-section">
              <div className="section-header-refined">
                <span className="section-num-refined">8</span>
                <h3 className="section-title-refined">Activity Timeline</h3>
              </div>
              <div className="activity-timeline-refined">
                {formData.timeline && formData.timeline.length > 0 ? (
                  <div className="timeline-flow-refined">
                    {formData.timeline.slice().reverse().map((item, idx) => (
                      <div key={idx} className="timeline-step-refined">
                        <div className="step-point-refined"></div>
                        <div className="step-info-refined">
                          <div className="step-top-refined">
                            <span className={`step-status-pill ${item.status?.toLowerCase()}`}>{item.status}</span>
                            <span className="step-date-refined">{new Date(item.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="step-msg-refined">{item.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-msg-refined">Activity history will appear here as the trip progresses.</div>
                )}
              </div>
            </div>

            <div className="edit-modal-footer">
              {formData.bookingStatus === 'Cancelled' && <div className="status-banner cancelled">Booking has been cancelled</div>}
              <div className="footer-actions">
                <button type="button" className="btn-secondary" onClick={onClose}>Back to List</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save All Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>

      {/* Driver Details Pop-up Modal */}
      {viewingDriver && (
        <div className="modal-backdrop" onClick={() => setViewingDriver(null)}>
          <div className="confirmation-modal driver-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon pilot-icon">🚕</div>
            <h2 className="modal-title">Driver Details</h2>
            <div className="driver-info-popup-content">
              <div className="info-popup-row">
                <span className="info-popup-label">Name:</span>
                <span className="info-popup-value">{viewingDriver.fullName}</span>
              </div>
              <div className="info-popup-row">
                <span className="info-popup-label">Phone number:</span>
                <span className="info-popup-value">{viewingDriver.mobile}</span>
              </div>
              <div className="info-popup-row">
                <span className="info-popup-label">Car RC number:</span>
                <span className="info-popup-value">{viewingDriver.rcNumber || 'N/A'}</span>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setViewingDriver(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditBookingModal;
