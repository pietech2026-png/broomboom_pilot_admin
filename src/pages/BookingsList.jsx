import React, { useState, useEffect } from 'react';
import './BookingsList.css';
import { getBookings, updateBooking, getBookingById, deleteBooking, getNotifications, markNotificationAsRead } from '../api/bookingService';
import EditBookingModal from '../components/EditBookingModal';

const BookingsList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesCount, setEntriesCount] = useState(10);
  const [isOwnPilotToggled] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [idToDelete, setIdToDelete] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal States
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFetchingFull, setIsFetchingFull] = useState(false);
  const [activeTab, setActiveTab] = useState('current');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [targetBooking, setTargetBooking] = useState(null);
  const [nextStatus, setNextStatus] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (isOwnPilotToggled) filters.isOwnPilotAllocated = true;
      
      const data = await getBookings(filters);
      setBookings(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Bookings from API
  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwnPilotToggled]);

  const filteredBookings = bookings
    .filter(booking => {
      if (activeTab === 'current') {
        return booking.bookingStatus !== 'Cancelled' && booking.bookingStatus !== 'Completed';
      } else {
        return booking.bookingStatus === 'Cancelled' || booking.bookingStatus === 'Completed';
      }
    })
    .filter(booking => 
      booking.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking.pickupLocation && booking.pickupLocation.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (booking.dropLocation && booking.dropLocation.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  const handleStatusClick = (booking, status) => {
    setTargetBooking(booking);
    setNextStatus(status);
    setShowStatusModal(true);
  };

  const handleStatusConfirm = async () => {
    if (!targetBooking) return;
    try {
      await updateBooking(targetBooking.id, { status: nextStatus });
      await fetchBookings();
      setShowStatusModal(false);
      alert(nextStatus === 'Confirmed' ? 'Booking Accepted' : `Booking ${nextStatus}`);
      setTargetBooking(null);
    } catch (err) {
      alert(`Failed to update status to ${nextStatus}`);
    }
  };

  const handleDeleteConfirm = async () => {
    if (idToDelete) {
      try {
        await deleteBooking(idToDelete);
        await fetchBookings();
        setShowDeleteModal(false);
        setIdToDelete(null);
      } catch (err) {
        console.error('Error deleting booking:', err);
        alert('Failed to delete booking. Please try again.');
      }
    }
  };

  const getStatusClass = (status) => {
    switch(status?.toLowerCase()) {
      case 'pending': return 'status-pending';
      case 'confirmed': return 'status-confirmed';
      case 'completed': return 'status-completed';
      case 'outstation': return 'status-outstation';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  };

  const handleDeleteClick = (id) => {
    setIdToDelete(id);
    setShowDeleteModal(true);
  };

  const handleViewClick = async (id) => {
    setIsFetchingFull(true);
    try {
      const fullBooking = await getBookingById(id);
      setSelectedBooking(fullBooking);
      setIsEditModalOpen(true);
    } catch (err) {
      console.error('Error fetching full booking:', err);
      alert('Failed to load booking details.');
    } finally {
      setIsFetchingFull(false);
    }
  };

  const handleSaveSuccess = () => {
    setSelectedBooking(null);
    setIsEditModalOpen(false);
    // Refresh
    const fetchData = async () => {
        const data = await getBookings();
        setBookings(data);
    };
    fetchData();
  };

  if (selectedBooking) {
    return (
      <EditBookingModal 
        booking={selectedBooking} 
        onClose={() => setSelectedBooking(null)} 
        onSave={handleSaveSuccess}
      />
    );
  }

  return (
    <div className="bookings-list-page anim-fade-in">
      <div className="list-header-section">
        <div className="title-group-refined">
          <h1 className="page-title-refined">Manage Bookings</h1>
          <p className="page-subtitle-refined">Track and manage driver allocations and trip statuses.</p>
        </div>
        <div className="booking-tabs-nav">
          <button 
            className={`booking-tab-btn ${activeTab === 'current' ? 'active' : ''}`}
            onClick={() => setActiveTab('current')}
          >
            📋 Current Bookings
          </button>
          <button 
            className={`booking-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📜 Completed History
          </button>
        </div>
      </div>

      <div className="table-controls">
        <div className="entries-control">
          <span>Show</span>
          <select value={entriesCount} onChange={(e) => setEntriesCount(Number(e.target.value))}>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>entries</span>
        </div>
        <div className="search-control-refined">
          <input 
            type="text" 
            placeholder="Search by ID, Location or Status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bookings-table-container">
        <table className="bookings-data-table">
          <thead>
            <tr>
              <th>OrderID</th>
              <th>Locations (Pickup &rarr; Drop)</th>
              <th>Service Info</th>
              <th>Vehicle</th>
              <th>Driver Status</th>
              <th>Created At</th>
              <th>Pickup Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="loading-row">Loading bookings...</td></tr>
            ) : error ? (
              <tr><td colSpan="8" className="error-row">{error}</td></tr>
            ) : filteredBookings.length > 0 ? (
              filteredBookings.slice(0, entriesCount).map((booking) => (
                <tr key={booking.id}>
                  <td className="order-id">
                    {booking.orderId || booking.id.substring(0, 4)}
                    {booking.allocateOurPilot && (
                      <span className="restricted-badge-mini" title="Allocate Our Pilot Selected">Allocate Our Pilot Selected</span>
                    )}
                  </td>
                  <td className="location-cell">
                    <div className="route-info">
                      <span className="pickup">{booking.pickupLocation?.substring(0, 25)}...</span>
                      <span className="arrow">→</span>
                      <span className="drop">{booking.dropLocation?.substring(0, 25)}...</span>
                    </div>
                  </td>
                  <td className="service-info-cell">
                    <span className="main-type">{booking.bookingType}</span>
                    <span className="sub-type">{booking.wayType || booking.rentalPackage || ''}</span>
                  </td>
                  <td>{booking.vehicleType}</td>
                  <td>
                    <span className={`status-pill ${getStatusClass(booking.bookingStatus)}`}>
                      {booking.bookingStatus}
                    </span>
                  </td>
                  <td>{new Date(booking.createdAt).toLocaleDateString()}</td>
                  <td>{new Date(booking.pickupDateTime).toLocaleDateString()}</td>
                  <td className="action-cell-refined">
                    <div className="btn-group-actions">
                      <button 
                        className="btn-icon-action view" 
                        title="View Details"
                        onClick={() => handleViewClick(booking.id)}
                      >
                        👁️
                      </button>
                      <button 
                        className="btn-icon-action history" 
                        title="Activity History"
                        onClick={() => handleViewClick(booking.id)}
                      >
                        📜 <span className="btn-label-internal">Hist</span>
                      </button>
                      {booking.bookingStatus === 'Pending' && (
                        <button 
                          className="btn-icon-action accept" 
                          title="Accept Booking"
                          onClick={() => handleStatusClick(booking, 'Confirmed')}
                        >
                          ✅
                        </button>
                      )}
                      {booking.bookingStatus !== 'Cancelled' && booking.bookingStatus !== 'Completed' && (
                        <button 
                          className="btn-icon-action cancel" 
                          title="Cancel Booking"
                          onClick={() => handleStatusClick(booking, 'Cancelled')}
                        >
                          ❌
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="empty-row">No matching bookings found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-pagination-footer">
        <div className="pagination-info">
          Showing 1 to {Math.min(filteredBookings.length, entriesCount)} of {filteredBookings.length} entries
        </div>
        <div className="pagination-btns">
          <button className="page-btn disabled">Previous</button>
          <button className="page-btn active">1</button>
          <button className="page-btn">Next</button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-backdrop" onClick={() => setShowDeleteModal(false)}>
          <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon warning">⚠️</div>
            <h2 className="modal-title">Delete Booking</h2>
            <p className="modal-text">
              Do you really want to delete the booking <strong>{idToDelete?.substring(0, 4)}</strong>? <br />
              This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>No, Cancel</button>
              <button className="btn-delete-confirm" onClick={handleDeleteConfirm}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="modal-backdrop" onClick={() => setShowStatusModal(false)}>
          <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className={`modal-icon ${nextStatus === 'Cancelled' ? 'danger' : 'success'}`}>
              {nextStatus === 'Cancelled' ? '❌' : '✅'}
            </div>
            <h2 className="modal-title">{nextStatus === 'Cancelled' ? 'Cancel' : 'Accept'} Booking</h2>
            <p className="modal-text">
              Are you sure you want to change the status of booking <strong>{targetBooking?.id.substring(0, 4)}</strong> to <strong>{nextStatus}</strong>?
            </p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowStatusModal(false)}>No, Go Back</button>
              <button className={`btn-confirm-refined ${nextStatus === 'Cancelled' ? 'cancel' : 'accept'}`} onClick={handleStatusConfirm}>
                Yes, {nextStatus === 'Cancelled' ? 'Cancel' : 'Accept'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsList;
