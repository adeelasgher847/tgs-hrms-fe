# Leave API Integration

## Overview

The leave management system has been successfully integrated with the backend API. All mock data has been removed and the system now works with real API data.

## API Endpoints Used

### 1. Create Leave Request

- **POST** `/leaves`
- **Description**: Create a new leave request for the logged-in user
- **Headers**: `Authorization: Bearer <token>`
- **Body**:

```json
{
  "fromDate": "2025-01-15",
  "toDate": "2025-01-17",
  "reason": "Medical leave",
  "type": "sick"
}
```

### 2. Get User Leaves

- **GET** `/leaves`
- **Description**: Get leave requests for the current user
- **Headers**: `Authorization: Bearer <token>`

### 3. Get All Leaves (Admin Only)

- **GET** `/leaves/all`
- **Description**: Get all leave requests for the tenant
- **Headers**: `Authorization: Bearer <admin-token>`

### 4. Update Leave Status (Admin Only)

- **PATCH** `/leaves/:id`
- **Description**: Approve or reject a leave request
- **Headers**: `Authorization: Bearer <admin-token>`
- **Body**:

```json
{
  "status": "approved"
}
```

## Features Implemented

### ✅ Real API Integration

- All mock data removed
- Real API calls for all operations
- Proper error handling and loading states

### ✅ Role-Based Access

- **Admin Users**: Can see all leaves with employee names
- **Regular Users**: Can only see their own leaves (shows "You")

### ✅ Leave Management

- **Apply Leave**: Create new leave requests
- **View History**: See leave history with proper formatting
- **Approve/Reject**: Admin can approve or reject leaves
- **Status Tracking**: Real-time status updates

### ✅ User Experience

- Loading indicators during API calls
- Success/Error notifications
- Responsive design maintained
- Form validation

## Testing

### Manual Testing

1. Start the development server: `npm run dev`
2. Navigate to the leave management page
3. Test the following functionality:
   - Apply for a new leave
   - View leave history
   - Approve/reject leaves (as admin)

### API Testing

Use the test function in browser console:

```javascript
await testLeaveAPI();
```

This will test all CRUD operations and log the results.

## Configuration

### Environment Variables

Make sure your `.env` file has the correct API base URL:

```
VITE_API_BASE_URL=http://localhost:3001
```

### Authentication

The system expects:

- `accessToken` in localStorage for API authentication
- Admin role detection (currently hardcoded, should be replaced with actual auth logic)

## Error Handling

The integration includes comprehensive error handling:

- Network errors are caught and displayed to users
- Loading states prevent multiple simultaneous requests
- Success/error notifications provide user feedback
- Form validation prevents invalid data submission

## Data Flow

1. **Load**: Component mounts → API call → Update state → Render list
2. **Create**: Form submission → API call → Update state → Show success message
3. **Update**: Action button click → API call → Update state → Show success message
4. **Error**: API error → Show error message → Log error details

## Next Steps

1. **Authentication**: Replace hardcoded `isAdmin` with actual auth logic
2. **User Context**: Get current user info from auth context
3. **Real-time Updates**: Consider WebSocket for real-time status updates
4. **Pagination**: Add pagination for large leave lists
5. **Filtering**: Add date range and status filters

## Troubleshooting

### Common Issues

1. **API Connection**: Ensure the backend server is running
2. **CORS**: Check if CORS is properly configured on the backend
3. **Authentication**: Verify the access token is valid
4. **Network Errors**: Check browser network tab for failed requests

### Debug Mode

Enable debug logging by checking the browser console for detailed API interaction logs.
