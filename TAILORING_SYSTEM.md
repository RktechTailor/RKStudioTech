# Tailoring Order Management System - Setup Guide

## Overview
Complete production-ready system for managing tailoring orders with capacity limits, smart delivery scheduling, and admin controls.

## Features

### 1. **Daily Order Limits**
- Each tailor has configurable daily order limit (default: 10)
- System prevents overbooking
- UI shows real-time available slots

### 2. **Stitching Capacity**
- Products per day limit (default: 2)
- Prevents operational overload
- Affects delivery date calculation

### 3. **Work Type Selection**
- **Simple Stitching**: Basic alterations (0-1 day buffer)
- **Heavy/Designer**: Complex work (2-3 day buffer + 4-5 day minimum)
- UI clearly communicates estimated delivery

### 4. **Smart Delivery Calculation**
```
delivery_days = ceil(queue_position / capacity_per_day) + work_type_buffer
delivery_date = order_date + max(delivery_days, minimum_for_work_type)
```

### 5. **Automatic Tailor Assignment**
- Auto-assigns to least-loaded tailor if not specified
- Distributes load intelligently
- Scales with multiple tailors

## Database Schema

### Collection: `tailors`
```typescript
{
  id: string;
  name: string;
  email?: string;
  phone?: string;
  maxOrdersPerDay: number;       // e.g., 10
  stitchingCapacityPerDay: number; // e.g., 2
  heavyWorkBufferDays: number;     // e.g., 3
  minimumHeavyDeliveryDays: number; // e.g., 5
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Collection: `tailoring_orders`
```typescript
{
  id: string;
  userId: string;
  tailorId: string;
  orderDate: Timestamp;
  deliveryDate: Timestamp;
  workType: "simple" | "heavy";
  status: "pending" | "in-progress" | "completed" | "cancelled";
  queuePosition?: number;
  productDetails?: {
    name?: string;
    description?: string;
    measurements?: Record<string, string | number>;
  };
  estimatedDeliveryDays?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## API Endpoints

### Create Order
**POST** `/api/orders/tailoring/create`
```json
{
  "tailorId": "string (optional, auto-assigned if not provided)",
  "workType": "simple" | "heavy",
  "productDetails": {
    "name": "Kurta",
    "description": "Blue cotton kurta with embroidery",
    "measurements": "Chest: 40, Waist: 32"
  }
}
```

### Check Capacity
**GET** `/api/orders/tailoring/capacity?tailorId=<id>`

Returns:
```json
{
  "tailorId": "string",
  "totalOrdersToday": number,
  "slotsAvailable": number,
  "slotsPerDay": number,
  "pendingOrdersCount": number,
  "estimatedDeliveryDays": number,
  "canAcceptOrders": boolean
}
```

### Get All Tailors (Admin)
**GET** `/api/admin/tailors`
- Requires: Admin authorization

### Create Tailor (Admin)
**POST** `/api/admin/tailors`
```json
{
  "name": "Rajesh Kumar",
  "email": "rajesh@tailorshop.com",
  "phone": "+919876543210",
  "maxOrdersPerDay": 10,
  "stitchingCapacityPerDay": 2,
  "heavyWorkBufferDays": 3,
  "minimumHeavyDeliveryDays": 5,
  "active": true
}
```

### Update Tailor Capacity (Admin)
**PUT** `/api/admin/tailors/<id>`
```json
{
  "maxOrdersPerDay": 12,
  "stitchingCapacityPerDay": 3,
  "heavyWorkBufferDays": 2
}
```

## Frontend Components

### Order Page
- Path: `/tailoring/order`
- User-facing order creation interface
- Real-time slot availability display
- Work type selection with delivery estimates
- Auto-tailor selection (least-loaded)

### Admin Panel
- Integrated in AdminDashboard
- Component: `TailoringAdminPanel`
- Manage tailors (create, edit, activate/deactivate)
- Update capacity settings
- View all tailors and their configurations

## Setup Steps

### 1. Initialize Firestore Collections (Manual or Script)

Create sample tailor:
```javascript
// Using Firebase Console or Admin SDK
db.collection('tailors').add({
  name: 'Rajesh Kumar',
  maxOrdersPerDay: 10,
  stitchingCapacityPerDay: 2,
  heavyWorkBufferDays: 3,
  minimumHeavyDeliveryDays: 5,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### 2. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### 3. Set Up Admin SDK (For Server Auth)
Add to `.env.local`:
```
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
FIREBASE_ADMIN_EMAIL=your-admin-email@iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="your-private-key"
```

### 4. Add Admin Role to User
```javascript
// One-time setup using Firebase Admin SDK
const admin = require('firebase-admin');
admin.initializeApp();
admin.auth().setCustomUserClaims('user-uid', { admin: true });
```

## Edge Cases Handled

✅ **Overbooking Prevention**
- Capacity checked before order creation
- Real-time slot counting

✅ **Order Cancellation**
- Queue position automatically recalculates
- Affected orders' delivery dates update

✅ **Unrealistic Delivery**
- Minimum delivery days enforced for heavy work
- Same-day delivery prevented

✅ **Concurrent Orders**
- Transaction support prevents race conditions
- Firestore atomic operations ensure consistency

✅ **Multiple Tailors**
- Least-load distribution algorithm
- Capacity scaling per tailor

## Performance Optimizations

- **Indexed Queries**: `tailorId`, `status`, `orderDate` indexed
- **Query Batching**: Capacity info fetched in parallel
- **Real-time Updates**: Firestore listeners minimize polling
- **Pagination Ready**: Large order lists support offset-based pagination

## Firestore Rules

- Tailors: Public read, admin write
- Tailoring Orders: User read/write own, admin full access
- Prevents unauthorized order creation
- Prevents capacity manipulation

## Testing Checklist

- [ ] Create order with simple work type
- [ ] Create order with heavy work type
- [ ] Verify delivery date calculation
- [ ] Fill daily slots and test "slots full" message
- [ ] Admin: Create new tailor
- [ ] Admin: Update capacity settings
- [ ] Auto-assignment to least-loaded tailor
- [ ] Verify Firestore rules enforcement

## Future Enhancements

1. **Order Status Tracking**: Real-time progress updates
2. **Notifications**: SMS/WhatsApp delivery updates
3. **Analytics**: Tailor performance metrics
4. **Scheduling**: Advanced date blocking for holidays
5. **Multi-item Orders**: Batch similar items for efficiency
6. **Payment Integration**: Link orders to payments
7. **Review System**: Customer feedback on tailors

## Troubleshooting

**"No active tailors available"**
- Create at least one active tailor in Firestore

**"Tailor has no slots available today"**
- Slots are per calendar day in IST timezone
- Check tailor's maxOrdersPerDay configuration

**Unauthorized errors**
- Verify Firebase Admin SDK config in `.env.local`
- Ensure user has `admin: true` custom claim (if admin endpoint)

**Delivery date not calculating correctly**
- Check `stitchingCapacityPerDay` value
- Verify queue position calculation logic
- Check timezone handling (using UTC)
