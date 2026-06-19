import React, { useState, useEffect } from 'react';
import { getTickets, updateTicketStatus, deleteTicket, replyTicket } from '../api/supportService';
import './Tickets.css';

const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    mobile: ''
  });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await getTickets(filters);
      setTickets(data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [filters]);

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await updateTicketStatus(ticketId, newStatus);
      fetchTickets(); // Refresh list
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update ticket status');
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (window.confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
      try {
        await deleteTicket(ticketId);
        fetchTickets(); // Refresh list
        if (selectedTicket && selectedTicket._id === ticketId) {
          setSelectedTicket(null);
        }
      } catch (error) {
        console.error('Error deleting ticket:', error);
        // Extract message from error object or fallback
        const errorMsg = error.message || (typeof error === 'string' ? error : 'Unknown error occurred');
        alert(`Failed to delete ticket: ${errorMsg}`);
      }
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;

    try {
      setSendingReply(true);
      const result = await replyTicket(selectedTicket._id, replyText);
      setReplyText('');
      // Update selected ticket with new replies from backend
      setSelectedTicket(result.ticket);
      // Refresh the main list
      fetchTickets();
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const getStatusClass = (status) => {
    return status.toLowerCase().replace(' ', '-');
  };

  return (
    <div className="tickets-container">
      <div className="tickets-header">
        <h1>Support Tickets</h1>
        <button className="action-btn" onClick={fetchTickets}>Refresh</button>
      </div>

      <div className="tickets-filters">
        <div className="filter-group">
          <label>Status</label>
          <select 
            value={filters.status} 
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In-Progress">In-Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Priority</label>
          <select 
            value={filters.priority} 
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          >
            <option value="">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="filter-group search-filter">
          <label>Search Mobile</label>
          <input 
            type="text" 
            placeholder="Search by mobile..."
            value={filters.mobile}
            onChange={(e) => setFilters({ ...filters, mobile: e.target.value })}
            className="search-input"
          />
        </div>
      </div>

      <div className="tickets-table-container">
        {loading ? (
          <div className="empty-state">Loading tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="empty-state">No tickets found.</div>
        ) : (
          <table className="tickets-table">
            <thead>
              <tr>
                <th>User / Mobile</th>
                <th>Subject</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket._id}>
                  <td>
                    <div className="user-info-cell">
                      <span className="user-name">{ticket.userId?.fullName || 'Unknown User'}</span>
                      <span className="user-mobile">{ticket.userId?.mobile || 'N/A'}</span>
                      <small style={{ color: '#94a3b8' }}>Type: {ticket.userType}</small>
                    </div>
                  </td>
                  <td className="clickable-cell" onClick={() => setSelectedTicket(ticket)}>
                    <div style={{ fontWeight: 600, color: '#2563eb' }}>{ticket.subject}</div>
                    <div className="message-preview">
                      {ticket.message}
                    </div>
                  </td>
                  <td>
                    <span className={`priority-badge priority-${ticket.priority.toLowerCase()}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${getStatusClass(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td>
                    {new Date(ticket.createdAt).toLocaleDateString()}
                    <br />
                    <small style={{ color: '#94a3b8' }}>{new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                  </td>
                  <td>
                    <div className="action-cell">
                      <select 
                        className="status-dropdown-inline"
                        value={ticket.status}
                        onChange={(e) => handleStatusChange(ticket._id, e.target.value)}
                      >
                        <option value="Open">Open</option>
                        <option value="In-Progress">In-Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                      </select>
                      <button 
                        className="btn-delete-icon" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTicket(ticket._id);
                        }}
                        title="Delete Ticket"
                      >
                        &times;
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="modal-backdrop" onClick={() => setSelectedTicket(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Ticket Details</h2>
              <button className="btn-close" onClick={() => setSelectedTicket(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3>{selectedTicket.subject}</h3>
                <div className="ticket-meta">
                  <span className={`priority-badge priority-${selectedTicket.priority.toLowerCase()}`}>
                    {selectedTicket.priority} Priority
                  </span>
                  <span className={`status-badge status-${getStatusClass(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                </div>
              </div>
              
              <div className="detail-section">
                <label>From:</label>
                <div className="user-detail">
                  <strong>{selectedTicket.userId?.fullName}</strong> ({selectedTicket.userType})
                  <br />
                  <span>{selectedTicket.userId?.mobile}</span>
                </div>
              </div>

              <div className="detail-section">
                <label>Update Status:</label>
                <select 
                  className="status-select"
                  value={selectedTicket.status}
                  onChange={(e) => {
                    handleStatusChange(selectedTicket._id, e.target.value);
                    setSelectedTicket({ ...selectedTicket, status: e.target.value });
                  }}
                >
                  <option value="Open">Open</option>
                  <option value="In-Progress">In-Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              {/* Replies History */}
              <div className="detail-section">
                <label>Conversation History:</label>
                <div className="replies-container">
                  <div className="reply-bubble user">
                    <div className="reply-content">{selectedTicket.message}</div>
                    <div className="reply-time">Original Message • {new Date(selectedTicket.createdAt).toLocaleString()}</div>
                  </div>
                  
                  {selectedTicket.replies && selectedTicket.replies.map((reply, index) => (
                    <div key={index} className={`reply-bubble ${reply.senderType.toLowerCase()}`}>
                      <div className="reply-header">
                        <strong>{reply.senderType === 'Admin' ? 'You' : reply.senderType}</strong>
                      </div>
                      <div className="reply-content">{reply.message}</div>
                      <div className="reply-time">{new Date(reply.createdAt).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply Input */}
              <div className="detail-section">
                <label>Send a Reply:</label>
                <div className="reply-input-wrapper">
                  <textarea 
                    placeholder="Type your response here..." 
                    className="reply-textarea"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    disabled={sendingReply}
                  />
                  <button 
                    className="action-btn" 
                    onClick={handleSendReply}
                    disabled={sendingReply || !replyText.trim()}
                  >
                    {sendingReply ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="action-btn secondary" onClick={() => setSelectedTicket(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tickets;
