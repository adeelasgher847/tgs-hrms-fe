export interface Geofence {
  id: string;
  tenantId: string;
  teamId?: string;
  name: string;
  description?: string;
  type: 'circle' | 'polygon' | 'rectangle';
  center: [number, number]; // [latitude, longitude]
  radius?: number; // For circle type
  coordinates?: [number, number][]; // For polygon/rectangle type
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GeofenceCheckIn {
  id: string;
  employeeId: string;
  employeeName: string;
  geofenceId: string;
  geofenceName: string;
  checkInTime: string;
  location: [number, number];
  isInside: boolean;
}

export interface GeofenceNotification {
  id: string;
  managerId: string;
  employeeId: string;
  employeeName: string;
  geofenceId: string;
  geofenceName: string;
  type: 'check-in' | 'check-out';
  timestamp: string;
  location: [number, number];
  isRead: boolean;
}
