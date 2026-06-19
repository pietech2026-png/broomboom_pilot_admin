# Txigo Admin Panel - API Documentation

This document outlines the API endpoints required for the Txigo Admin Panel. The backend should implement these to support the features currently in the admin interface.

---

## 1. Base Configuration
- **Base URL**: `http://localhost:5001/api/admin`
- **Authentication**: Bearer Token (JWT) required for all endpoints except Login.

---

## 2. Authentication APIs

### Admin Login
- **Endpoint**: `POST /auth/login`
- **Description**: Authenticate admin user.
- **Request Body**:
  ```json
  {
    "email": "admin@txigo.com",
    "password": "hashed_password"
  }
  ```
- **Response**:
  ```json
  {
    "token": "jwt_token_here",
    "admin": {
      "id": "admin_id",
      "name": "Super Admin",
      "email": "admin@txigo.com"
    }
  }
  ```

---

## 3. Driver Management APIs

### Get All Drivers (with Filters)
- **Endpoint**: `GET /drivers`
- **Query Parameters**:
  - `page` (optional): Current page (default: 1)
  - `limit` (optional): Entries per page (default: 10)
  - `category` (optional): `scooty`, `bike`, `car`, `mini`, `sedan`
  - `status` (optional): `under_verification`, `verified`, `rejected`, `active`, `blocked`, `inactive`
  - `type` (optional): `regular`, `premium`
  - `city` (optional): Filter by city/address
  - `search` (optional): Search by name, email, or mobile.
- **Response**:
  ```json
  {
    "total": 150,
    "page": 1,
    "drivers": [
      {
        "id": 1,
        "fullName": "Rahul Sharma",
        "email": "rahul.sharma@example.com",
        "mobile": "7980641007",
        "pincode": "700001",
        "vehicleType": "Car",
        "rcNumber": "WB04F1234",
        "registeredAt": "2022-07-09 12:52:15",
        "verifyAt": "2026-02-03 17:22:56",
        "status": "Active",
        "type": "regular"
      }
    ]
  }
  ```

### Get Driver Details
- **Endpoint**: `GET /drivers/:id`
- **Description**: Fetch full KYC details and document URLs for a specific driver.
- **Response**:
  ```json
  {
    "id": 1,
    "fullName": "Rahul Sharma",
    "dob": "1992-05-14",
    "email": "rahul.sharma@example.com",
    "pincode": "700001",
    "state": "West Bengal",
    "address": "Kolkata, Park Street",
    "mobile": "7980641007",
    "vehicleType": "Car",
    "rcNumber": "WB04F1234",
    "aadharNumber": "1234 5678 9012",
    "panNumber": "ABCDE1234F",
    "dlNumber": "DL-1234567890",
    "documents": {
      "aadharFront": "url_to_image",
      "aadharBack": "url_to_image",
      "panFront": "url_to_image",
      "dlFront": "url_to_image",
      "rcFront": "url_to_image",
      "carFront": "url_to_image"
    },
    "status": "Active",
    "registeredAt": "2022-07-09 12:52:15"
  }
  ```

### Update Driver Status/KYC
- **Endpoint**: `PATCH /drivers/:id`
- **Description**: Approve/Reject driver or update specific fields.
- **Request Body**:
  ```json
  {
    "status": "Active",
    "verifyAt": "2026-04-15 17:31:38",
    "fullName": "Rahul Sharma (Updated)" 
  }
  ```

### Verify/Reject Document
- **Endpoint**: `POST /drivers/:id/verify-document`
- **Description**: Verify individual documents during KYC.
- **Request Body**:
  ```json
  {
    "documentType": "aadharFront",
    "status": "verified", // or "rejected"
    "reason": "" // Optional if rejected
  }
  ```

---

## 4. Dashboard Statistics

### Get Summary Data
- **Endpoint**: `GET /dashboard/stats`
- **Response**:
  ```json
  {
    "totalDrivers": 1200,
    "pendingVerifications": 45,
    "activeDrivers": 850,
    "blockedDrivers": 12
  }
  ```

---

## 5. Data Models (Reference)

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | Integer | Unique identifier |
| `fullName` | String | Driver's name |
| `email` | String | Email address |
| `mobile` | String | Contact number |
| `vehicleType`| String | `scooty`, `bike`, `car`, `mini`, `sedan` |
| `rcNumber` | String | Vehicle RC number |
| `status` | String | `Pending`, `Active`, `Blocked`, `Inactive` |
| `documents` | Object | Collection of URL fields for images |
