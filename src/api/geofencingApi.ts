// Mock API service for geofencing
// This will be replaced with actual API calls later

import type {
  Geofence,
  GeofenceCheckIn,
  GeofenceNotification,
} from '../types/geofencing';

// Mock data storage (in a real app, this would be API calls)
let mockGeofences: Geofence[] = [
  {
    id: '1',
    tenantId: 'tenant-1',
    name: 'Main Office',
    description: 'Primary office location',
    type: 'circle',
    center: [40.7128, -74.006],
    radius: 100, // 100 meters
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let mockCheckIns: GeofenceCheckIn[] = [];
let mockNotifications: GeofenceNotification[] = [];

class GeofencingApiService {
  // Get all geofences for the current tenant
  async getGeofences(): Promise<Geofence[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...mockGeofences];
  }

  // Get a single geofence by ID
  async getGeofenceById(id: string): Promise<Geofence | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockGeofences.find(g => g.id === id) || null;
  }

  // Create a new geofence
  async createGeofence(
    data: Omit<Geofence, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Geofence> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newGeofence: Geofence = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockGeofences.push(newGeofence);
    return newGeofence;
  }

  // Update a geofence
  async updateGeofence(id: string, data: Partial<Geofence>): Promise<Geofence> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const index = mockGeofences.findIndex(g => g.id === id);
    if (index === -1) {
      throw new Error('Geofence not found');
    }
    mockGeofences[index] = {
      ...mockGeofences[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return mockGeofences[index];
  }

  // Delete a geofence
  async deleteGeofence(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    mockGeofences = mockGeofences.filter(g => g.id !== id);
  }

  // Get check-ins within geofences
  async getCheckIns(geofenceId?: string): Promise<GeofenceCheckIn[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    if (geofenceId) {
      return mockCheckIns.filter(ci => ci.geofenceId === geofenceId);
    }
    return [...mockCheckIns];
  }

  // Get notifications for managers
  async getNotifications(managerId?: string): Promise<GeofenceNotification[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    let notifications = [...mockNotifications];
    if (managerId) {
      notifications = notifications.filter(n => n.managerId === managerId);
    }
    return notifications.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const notification = mockNotifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
    }
  }

  // Simulate employee check-in (for testing)
  async simulateCheckIn(
    employeeId: string,
    employeeName: string,
    location: [number, number]
  ): Promise<GeofenceCheckIn | null> {
    await new Promise(resolve => setTimeout(resolve, 300));

    // Check if location is within any active geofence
    const activeGeofences = mockGeofences.filter(g => g.isActive);

    for (const geofence of activeGeofences) {
      let isInside = false;

      if (geofence.type === 'circle' && geofence.radius) {
        // Calculate distance from center
        const distance = this.calculateDistance(geofence.center, location);
        isInside = distance <= geofence.radius;
      } else if (geofence.coordinates) {
        // For polygon/rectangle, use point-in-polygon check
        isInside = this.isPointInPolygon(location, geofence.coordinates);
      }

      if (isInside) {
        const checkIn: GeofenceCheckIn = {
          id: Date.now().toString(),
          employeeId,
          employeeName,
          geofenceId: geofence.id,
          geofenceName: geofence.name,
          checkInTime: new Date().toISOString(),
          location,
          isInside: true,
        };
        mockCheckIns.push(checkIn);

        // Create notification for manager
        const notification: GeofenceNotification = {
          id: Date.now().toString() + '-notif',
          managerId: 'manager-1', // This would come from the backend
          employeeId,
          employeeName,
          geofenceId: geofence.id,
          geofenceName: geofence.name,
          type: 'check-in',
          timestamp: new Date().toISOString(),
          location,
          isRead: false,
        };
        mockNotifications.push(notification);

        return checkIn;
      }
    }

    return null;
  }

  // Helper: Calculate distance between two coordinates (Haversine formula)
  private calculateDistance(
    coord1: [number, number],
    coord2: [number, number]
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (coord1[0] * Math.PI) / 180;
    const φ2 = (coord2[0] * Math.PI) / 180;
    const Δφ = ((coord2[0] - coord1[0]) * Math.PI) / 180;
    const Δλ = ((coord2[1] - coord1[1]) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  // Helper: Check if point is inside polygon
  private isPointInPolygon(
    point: [number, number],
    polygon: [number, number][]
  ): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][1];
      const yi = polygon[i][0];
      const xj = polygon[j][1];
      const yj = polygon[j][0];

      const intersect =
        yi > point[0] !== yj > point[0] &&
        point[1] < ((xj - xi) * (point[0] - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }
}

export const geofencingApi = new GeofencingApiService();
