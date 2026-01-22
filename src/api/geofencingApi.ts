import type { Geofence } from '../types/geofencing';
import axiosInstance from './axiosInstance';

// Backend API shapes
export interface GeofenceResponse {
  id: string;
  tenant_id: string;
  name: string;
  description?: string | null;
  latitude: string;
  longitude: string;
  status: 'active' | 'inactive' | string;
  created_at: string;
  updated_at: string;
  radius?: number | null;
  coordinates?: [number, number][] | null;
  type?: 'circle' | 'polygon' | 'rectangle' | string | null;
  team_id?: string | null;
  threshold_enabled?: boolean | null;
  threshold_distance?: number | null;
}

export interface CreateGeofencePayload {
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  status?: 'active' | 'inactive' | string;
  type?: 'circle' | 'polygon' | 'rectangle' | string;
  radius?: number | null;
  coordinates?: [number, number][] | null;
  team_id?: string;
  threshold_enabled?: boolean;
  threshold_distance?: number | null;
}

export interface UpdateGeofencePayload {
  name?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  status?: 'active' | 'inactive' | string;
  type?: 'circle' | 'polygon' | 'rectangle' | string;
  radius?: number | null;
  coordinates?: [number, number][] | null;
  team_id?: string | null;
  threshold_enabled?: boolean;
  threshold_distance?: number | null;
}

class GeofencingApiService {
  // Map backend geofence to frontend Geofence type
  private mapFromBackend(item: any): Geofence {
    return {
      id: item.id,
      tenantId: item.tenant_id,
      teamId: item.team_id ?? undefined,
      name: item.name,
      description: item.description,
      type: item.type ?? 'circle',
      center: [parseFloat(item.latitude), parseFloat(item.longitude)],
      radius: item.radius ? Number(item.radius) : undefined,
      coordinates: item.coordinates ?? undefined,
      isActive: item.status === 'active',
      threshold_enabled: item.threshold_enabled ?? false,
      threshold_distance: item.threshold_distance ? Number(item.threshold_distance) : undefined,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    };
  }

  async getGeofences(): Promise<Geofence[]> {
    const resp = await axiosInstance.get<GeofenceResponse[]>('/geofences');
    const data = resp.data ?? [];
    return data.map(d => this.mapFromBackend(d));
  }

  async getGeofenceById(id: string): Promise<Geofence | null> {
    const resp = await axiosInstance.get<GeofenceResponse>(`/geofences/${id}`);
    const data = resp.data;
    return data ? this.mapFromBackend(data) : null;
  }

  async createGeofence(
    data:
      | CreateGeofencePayload
      | Omit<Geofence, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Geofence> {
    // Build a sanitized payload containing only backend-expected fields (snake_case)
    const asAny = data as any;
    const payload: any = {};

    if (typeof asAny.name !== 'undefined') payload.name = asAny.name;
    if (typeof asAny.description !== 'undefined')
      payload.description = asAny.description;

    // center (frontend) -> latitude/longitude (backend)
    if (Array.isArray(asAny.center) && asAny.center.length >= 2) {
      payload.latitude = asAny.center[0];
      payload.longitude = asAny.center[1];
    }

    if (typeof asAny.latitude !== 'undefined')
      payload.latitude = asAny.latitude;
    if (typeof asAny.longitude !== 'undefined')
      payload.longitude = asAny.longitude;

    if (typeof asAny.isActive === 'boolean') {
      payload.status = asAny.isActive ? 'active' : 'inactive';
    }

    if (typeof asAny.type !== 'undefined') payload.type = asAny.type;
    if (typeof asAny.radius !== 'undefined')
      payload.radius = asAny.radius ?? null;
    if (typeof asAny.coordinates !== 'undefined')
      payload.coordinates = asAny.coordinates;

    if (typeof asAny.teamId !== 'undefined') payload.team_id = asAny.teamId;
    if (typeof asAny.team_id !== 'undefined') payload.team_id = asAny.team_id;

    if (typeof asAny.threshold_enabled !== 'undefined')
      payload.threshold_enabled = asAny.threshold_enabled;
    if (typeof asAny.threshold_distance !== 'undefined')
      payload.threshold_distance = asAny.threshold_distance ?? null;

    const resp = await axiosInstance.post<GeofenceResponse>(
      '/geofences',
      payload
    );
    return this.mapFromBackend(resp.data);
  }

  async updateGeofence(
    id: string,
    data: UpdateGeofencePayload | Partial<Geofence>
  ): Promise<Geofence> {
    // Build a sanitized payload that only contains backend-expected fields
    const payload: UpdateGeofencePayload = {};

    // Accept either backend-shaped payload or frontend Geofence-like partials.
    const asAny = data as any;

    if (typeof asAny.name !== 'undefined') payload.name = asAny.name;
    if (typeof asAny.description !== 'undefined')
      payload.description = asAny.description;

    // center (frontend) -> latitude/longitude (backend)
    if (Array.isArray(asAny.center) && asAny.center.length >= 2) {
      payload.latitude = asAny.center[0];
      payload.longitude = asAny.center[1];
    }

    // direct latitude/longitude if provided
    if (typeof asAny.latitude !== 'undefined')
      payload.latitude = asAny.latitude;
    if (typeof asAny.longitude !== 'undefined')
      payload.longitude = asAny.longitude;

    if (typeof asAny.isActive === 'boolean') {
      payload.status = asAny.isActive ? 'active' : 'inactive';
    }

    if (typeof asAny.type !== 'undefined') payload.type = asAny.type;
    if (typeof asAny.radius !== 'undefined')
      payload.radius = asAny.radius ?? null;

    if (typeof asAny.coordinates !== 'undefined')
      payload.coordinates = asAny.coordinates;

    // teamId (frontend) -> team_id (backend)
    if (typeof asAny.teamId !== 'undefined') payload.team_id = asAny.teamId;
    if (typeof asAny.team_id !== 'undefined') payload.team_id = asAny.team_id;

    if (typeof asAny.threshold_enabled !== 'undefined')
      payload.threshold_enabled = asAny.threshold_enabled;
    if (typeof asAny.threshold_distance !== 'undefined')
      payload.threshold_distance = asAny.threshold_distance ?? null;

    const resp = await axiosInstance.patch<GeofenceResponse>(
      `/geofences/${id}`,
      payload
    );
    return this.mapFromBackend(resp.data);
  }

  async deleteGeofence(id: string): Promise<void> {
    await axiosInstance.delete(`/geofences/${id}`);
  }
}

export const geofencingApi = new GeofencingApiService();
