import apiClient from './apiClient';

/**
 * Maps frontend booking data to the backend Booking model structure.
 */
const mapToBackend = (data) => {
  return {
    customerName: data.userName,
    customerEmail: data.userEmail,
    customerMobile: data.mobileNumber,
    serviceType: data.bookingType,
    // ... rest same
    wayType: data.wayType,
    airportDirection: data.airportDirection,
    rentalPackage: data.rentalPackage,
    state: data.state, // Added to root level to fix validation error
    pickup: {
      address: data.pickupLocation,
      lat: Number(data.pickupLat) || 0,
      lng: Number(data.pickupLng) || 0,
      pincode: data.pincode,
      state: data.state
    },
    drop: {
      address: data.dropLocation,
      lat: Number(data.dropLat) || 0,
      lng: Number(data.dropLng) || 0
    },
    pickupTime: data.pickupDateTime,
    returnTime: data.returnTime,
    vehicle: {
      category: data.car,
      carModel: data.vehicleType,
      seater: Number(data.seater) || 4,
      isAC: data.ac === 'AC'
    },
    isOwnPilotAllocated: !!data.allocateOurPilot,
    pricing: {
      distance: Number(data.distance) || 0,
      totalFare: Number(data.totalFare) || 0,
      advancedAmount: Number(data.advancedAmount) || 0,
      pilotShare: Number(data.pilotShare) || 0,
      companyShare: Number(data.companyShare) || 0,
      extraCharges: {
        nightAllowance: Number(data.driverNightAllowance) || 0,
        toll: Number(data.tollCharges) || 0,
        extraKm: Number(data.extraKm) || 0,
        extraHour: Number(data.extraHour) || 0
      }
    },
    eligiblePilots: data.eligiblePilots || [],
    status: data.bookingStatus || 'Pending'
  };
};

const mapFromBackend = (item) => {
  if (!item) return null;
  return {
    id: item._id,
    orderId: item._id.substring(0, 4).toUpperCase(),
    userName: item.customerName || '',
    userEmail: item.customerEmail || '',
    mobileNumber: item.customerMobile || '',
    bookingType: item.serviceType || '',
    wayType: item.wayType || '',
    airportDirection: item.airportDirection || '',
    rentalPackage: item.rentalPackage || '',
    pickupLocation: item.pickup?.address || '',
    pickupLat: item.pickup?.lat || '',
    pickupLng: item.pickup?.lng || '',
    pincode: item.pickup?.pincode || '',
    state: item.pickup?.state || '',
    dropLocation: item.drop?.address || '',
    dropLat: item.drop?.lat || '',
    dropLng: item.drop?.lng || '',
    pickupDateTime: item.pickupTime ? new Date(item.pickupTime).toISOString().slice(0, 16) : '',
    returnTime: item.returnTime ? new Date(item.returnTime).toISOString().slice(0, 16) : '',
    distance: item.pricing?.distance || '',
    vehicleType: item.vehicle?.category || '',
    car: item.vehicle?.category || 'Sedan',
    carType: item.vehicle?.carModel || '',
    seater: item.vehicle?.seater || '4',
    ac: item.vehicle?.isAC ? 'AC' : 'Non-AC',
    driverNightAllowance: item.pricing?.extraCharges?.nightAllowance || '',
    tollCharges: item.pricing?.extraCharges?.toll || 'Excluded',
    extraKm: item.pricing?.extraCharges?.extraKm || '',
    extraHour: item.pricing?.extraCharges?.extraHour || '',
    waitingCharge: item.pricing?.extraCharges?.waitingCharge || '',
    totalFare: item.pricing?.totalFare || '',
    advancedAmount: item.pricing?.advancedAmount || '',
    pilotShare: item.pricing?.pilotShare || '',
    companyShare: item.pricing?.companyShare || '',
    allocateOurPilot: item.isOwnPilotAllocated || false,
    
    // New Nested Pilot Data
    acceptedByPilot: item.acceptedByPilot || null,
    allocatedPilot: item.allocatedPilot || null,
    
    // Legacy support (fallback to nested mobile if available)
    assignedDriverMobile: item.allocatedPilot?.mobile || item.assignedDriverMobile || null,
    
    eligiblePilots: item.eligiblePilots || [],
    
    bookingStatus: item.status || 'Pending',
    createdAt: item.createdAt
  };
};

// ... existing endpoints same ...

export const unassignDriver = async (id) => {
  try {
    const response = await apiClient.patch(`/bookings/${id}`, { 
      assignedDriverMobile: null, 
      allocatedPilot: null,
      eligiblePilots: [],
      isOwnPilotAllocated: false,
      status: 'Pending' 
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Network Error');
  }
};

export const createBooking = async (bookingData) => {
  try {
    const backendData = mapToBackend(bookingData);
    const response = await apiClient.post('/bookings', backendData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Network Error');
  }
};

export const getBookings = async (filters = {}) => {
  try {
    const response = await apiClient.get('/bookings', { params: filters });
    return response.data.map(mapFromBackend);
  } catch (error) {
    throw error.response ? error.response.data : new Error('Network Error');
  }
};

export const getBookingById = async (id) => {
  try {
    const response = await apiClient.get(`/bookings/${id}`);
    return mapFromBackend(response.data);
  } catch (error) {
    throw error.response ? error.response.data : new Error('Network Error');
  }
};

export const updateBooking = async (id, data) => {
  try {
    // If it's a direct status update (like in delete flow), send as is
    // Otherwise, if it's a full form update, map it
    const backendData = data.userName ? mapToBackend(data) : data;
    const response = await apiClient.patch(`/bookings/${id}`, backendData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Network Error');
  }
};

export const deleteBooking = async (id) => {
  try {
    const response = await apiClient.delete(`/bookings/${id}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Network Error');
  }
};

export const getNotifications = async (params = {}) => {
  try {
    const response = await apiClient.get('/notifications', { params });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Network Error');
  }
};

export const markNotificationAsRead = async (id) => {
  try {
    const response = await apiClient.patch(`/notifications/${id}/read`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Network Error');
  }
};
