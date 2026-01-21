import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  MapContainer,
  TileLayer,
  Circle,
  Polygon,
  Rectangle,
  Marker,
  Popup,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import type { Geofence } from '../../types/geofencing';
import { geofencingApi } from '../../api/geofencingApi';
import AppButton from '../common/AppButton';

// Fix for default marker icons in React-Leaflet
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

type LatLngTuple = [number, number];

interface NearestGeofenceInfo {
  geofence: Geofence;
  distanceMeters: number;
  isInside: boolean;
}

function haversineDistanceMeters(a: LatLngTuple, b: LatLngTuple): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371000; // meters
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);

  const h =
    sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

// Basic point-in-polygon using ray casting. Works for both polygon & rectangle coordinates.
function isPointInPolygon(point: LatLngTuple, polygon: LatLngTuple[]): boolean {
  let inside = false;
  const [x, y] = point;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

function formatDistance(meters: number): string {
  if (meters < 0) meters = 0;
  if (meters < 50) return `${Math.round(meters)} m`;
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = meters / 1000;
  if (km < 10) return `${km.toFixed(2)} km`;
  return `${km.toFixed(1)} km`;
}

const EmployeeGeofenceStatus = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState<LatLngTuple | null>(null);
  const [nearest, setNearest] = useState<NearestGeofenceInfo | null>(null);

  const loadStatus = async () => {
    setLoading(true);
    setError(null);

    if (!('geolocation' in navigator)) {
      setError('Geolocation is not available on this device.');
      setLoading(false);
      return;
    }

    const getPosition = () =>
      new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });

    try {
      const [pos, geofences] = await Promise.all([
        getPosition(),
        geofencingApi.getGeofences(),
      ]);

      const current: LatLngTuple = [
        pos.coords.latitude,
        pos.coords.longitude,
      ];
      setPosition(current);

      const active = geofences.filter(g => g.isActive);
      if (active.length === 0) {
        setError('No active geofences configured for your tenant/team.');
        setNearest(null);
        return;
      }

      let best: NearestGeofenceInfo | null = null;

      for (const g of active) {
        let isInside = false;
        let distance = 0;

        if (g.type === 'circle' && g.radius) {
          const distToCenter = haversineDistanceMeters(current, g.center);
          isInside = distToCenter <= g.radius;
          distance = isInside ? 0 : distToCenter - g.radius;
        } else if (g.coordinates && g.coordinates.length >= 3) {
          const coords = g.coordinates as LatLngTuple[];
          isInside = isPointInPolygon(current, coords);
          // As an approximation, use distance to geofence center when outside
          distance = isInside
            ? 0
            : haversineDistanceMeters(current, g.center);
        } else {
          // Fallback: use distance to center only
          distance = haversineDistanceMeters(current, g.center);
        }

        if (!best || distance < best.distanceMeters) {
          best = { geofence: g, distanceMeters: distance, isInside };
        }
      }

      setNearest(best);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err) {
        const ge = err as GeolocationPositionError;
        if (ge.code === ge.PERMISSION_DENIED) {
          setError(
            'Location permission denied. Please allow location access to see geofence distance.'
          );
        } else if (ge.code === ge.POSITION_UNAVAILABLE) {
          setError(
            'Unable to determine your location. Please ensure GPS is enabled.'
          );
        } else if (ge.code === ge.TIMEOUT) {
          setError('Location request timed out. Please try again.');
        } else {
          setError('Failed to get location. Please try again.');
        }
      } else {
        setError('Failed to load geofence status. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasData = position && nearest;

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 1,
        mt: 2,
        boxShadow: 'unset',
      }}
    >
      <Box
        display='flex'
        flexDirection={{ xs: 'column', md: 'row' }}
        justifyContent='space-between'
        alignItems={{ xs: 'flex-start', md: 'center' }}
        gap={2}
        mb={2}
      >
        <Box>
          <Typography variant='h6' fontWeight={600}>
            Live Geofence Distance
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            See how far you are from the nearest active geofence in real time.
          </Typography>
        </Box>

        <Box display='flex' gap={1} alignItems='center'>
          {nearest && (
            <Chip
              label={nearest.isInside ? 'Inside Geofence' : 'Outside Geofence'}
              color={nearest.isInside ? 'success' : 'warning'}
              size='small'
            />
          )}
          <AppButton
            variant='outlined'
            size='small'
            onClick={loadStatus}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh Location'}
          </AppButton>
        </Box>
      </Box>

      {error && (
        <Alert severity='warning' sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading && !hasData && (
        <Box
          display='flex'
          justifyContent='center'
          alignItems='center'
          minHeight='220px'
        >
          <CircularProgress size={28} />
        </Box>
      )}

      {!loading && !hasData && !error && (
        <Typography variant='body2' color='text.secondary'>
          Geofence information is not available.
        </Typography>
      )}

      {hasData && nearest && position && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2,
          }}
        >
          <Box sx={{ width: { xs: '100%', md: '35%' } }}>
            <Typography variant='subtitle2' color='text.secondary' gutterBottom>
              Nearest Geofence
            </Typography>
            <Typography variant='body1' fontWeight={600}>
              {nearest.geofence.name}
            </Typography>
            {nearest.geofence.description && (
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{ mt: 0.5 }}
              >
                {nearest.geofence.description}
              </Typography>
            )}
            <Box sx={{ mt: 2 }}>
              <Typography
                variant='body2'
                color='text.secondary'
                gutterBottom
              >
                Distance to geofence
              </Typography>
              <Typography variant='h6' fontWeight={700}>
                {nearest.isInside
                  ? 'Inside geofence'
                  : formatDistance(nearest.distanceMeters)}
              </Typography>
              {!nearest.isInside && (
                <Typography
                  variant='caption'
                  color='text.secondary'
                  display='block'
                  sx={{ mt: 0.5 }}
                >
                  Distance is approximate for non-circular geofences.
                </Typography>
              )}
            </Box>
          </Box>

          <Box
            sx={{
              width: { xs: '100%', md: '65%' },
              height: 260,
              borderRadius: 1,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              '& .leaflet-container': {
                height: '100%',
                width: '100%',
              },
            }}
          >
            <MapContainer
              center={position}
              zoom={16}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom
            >
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
              />

              {/* Employee position */}
              <Marker position={position}>
                <Popup>
                  <Typography variant='subtitle2'>Your location</Typography>
                  <Typography variant='caption'>
                    {position[0].toFixed(6)}, {position[1].toFixed(6)}
                  </Typography>
                </Popup>
              </Marker>

              {/* Nearest geofence geometry */}
              {nearest.geofence.type === 'circle' &&
                nearest.geofence.radius && (
                  <Circle
                    center={nearest.geofence.center}
                    radius={nearest.geofence.radius}
                    pathOptions={{
                      color: '#3083dc',
                      fillColor: '#3083dc',
                      fillOpacity: 0.25,
                    }}
                  >
                    <Popup>
                      <Typography variant='subtitle2'>
                        {nearest.geofence.name}
                      </Typography>
                      {nearest.geofence.description && (
                        <Typography variant='body2'>
                          {nearest.geofence.description}
                        </Typography>
                      )}
                      <Typography variant='caption'>
                        Radius: {nearest.geofence.radius} m
                      </Typography>
                    </Popup>
                  </Circle>
                )}

              {nearest.geofence.type === 'rectangle' &&
                nearest.geofence.coordinates &&
                nearest.geofence.coordinates.length >= 4 && (
                  <Rectangle
                    bounds={
                      [
                        [
                          nearest.geofence.coordinates[0][0],
                          nearest.geofence.coordinates[0][1],
                        ],
                        [
                          nearest.geofence.coordinates[2][0],
                          nearest.geofence.coordinates[2][1],
                        ],
                      ] as [[number, number], [number, number]]
                    }
                    pathOptions={{
                      color: '#3083dc',
                      fillColor: '#3083dc',
                      fillOpacity: 0.25,
                    }}
                  >
                    <Popup>
                      <Typography variant='subtitle2'>
                        {nearest.geofence.name}
                      </Typography>
                      {nearest.geofence.description && (
                        <Typography variant='body2'>
                          {nearest.geofence.description}
                        </Typography>
                      )}
                    </Popup>
                  </Rectangle>
                )}

              {nearest.geofence.type === 'polygon' &&
                nearest.geofence.coordinates && (
                  <Polygon
                    positions={nearest.geofence.coordinates}
                    pathOptions={{
                      color: '#3083dc',
                      fillColor: '#3083dc',
                      fillOpacity: 0.25,
                    }}
                  >
                    <Popup>
                      <Typography variant='subtitle2'>
                        {nearest.geofence.name}
                      </Typography>
                      {nearest.geofence.description && (
                        <Typography variant='body2'>
                          {nearest.geofence.description}
                        </Typography>
                      )}
                    </Popup>
                  </Polygon>
                )}
            </MapContainer>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default EmployeeGeofenceStatus;


