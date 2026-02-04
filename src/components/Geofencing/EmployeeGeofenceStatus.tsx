import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  LinearProgress,
  Card,
  CardContent,
  useTheme,
  alpha,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  RadioButtonChecked as RadioButtonCheckedIcon,
} from '@mui/icons-material';
import {
  MapContainer,
  TileLayer,
  Circle,
  Polygon,
  Rectangle,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import type { Geofence } from '../../types/geofencing';
import { geofencingApi } from '../../api/geofencingApi';
import { extractErrorMessage } from '../../utils/errorHandler';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

type LatLngTuple = [number, number];

/* ---------------- Map Fit Helper ---------------- */

function FitGeofence({ geofence }: { geofence: Geofence }) {
  const map = useMap();

  useEffect(() => {
    if (!geofence) return;

    if (geofence.type === 'circle' && geofence.radius) {
      const threshold = geofence.threshold_enabled
        ? Number(geofence.threshold_distance)
        : 0;
      const bounds = L.circle(geofence.center, {
        radius: geofence.radius + threshold,
      }).getBounds();
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    if (
      (geofence.type === 'polygon' || geofence.type === 'rectangle') &&
      geofence.coordinates
    ) {
      const bounds = L.latLngBounds(
        geofence.coordinates as LatLngTuple[]
      );
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [geofence, map]);

  return null;
}

/* ---------------- Utils ---------------- */

function haversineDistanceMeters(a: LatLngTuple, b: LatLngTuple): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(2)} km`;
}

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

/* ---------------- Component ---------------- */

const EmployeeGeofenceStatus = () => {
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState<LatLngTuple | null>(null);
  const [geofence, setGeofence] = useState<Geofence | null>(null);
  const [distance, setDistance] = useState<number>(0);
  const [isInside, setIsInside] = useState<boolean>(false);

  /* -------- Auto live tracking -------- */

  useEffect(() => {
    let watchId: number | null = null;
    let positionBuffer: GeolocationPosition[] = [];
    const bufferSize = 3;
    let updateTimeout: NodeJS.Timeout | null = null;

    (async () => {
      try {
        const list = await geofencingApi.getGeofences();

        // Use user's team ID if available to find the correct geofence
        const userStr = localStorage.getItem('user');
        const userObj = userStr ? JSON.parse(userStr) : null;
        const userTeamId = userObj?.team_id || userObj?.teamId;

        console.log('User team ID for geofencing:', userTeamId);

        // Find active geofence for the user's team, or fallback to any active one if no team assigned
        const active = userTeamId
          ? list.find(g => g.isActive && g.teamId === userTeamId)
          : list.find(g => g.isActive);

        if (!active) {
          setError('No active geofence found');
          setLoading(false);
          return;
        }

        setGeofence(active);

        const updateDistance = (current: LatLngTuple) => {
          let dist = 0;
          let inside = false;

          if (active.type === 'circle' && active.radius) {
            const distToCenter = haversineDistanceMeters(current, active.center);
            inside = distToCenter <= active.radius;
            dist = inside ? 0 : distToCenter - active.radius;
          } else if (active.coordinates && active.coordinates.length >= 3) {
            const coords = active.coordinates as LatLngTuple[];
            inside = isPointInPolygon(current, coords);
            dist = inside ? 0 : haversineDistanceMeters(current, active.center);
          } else {
            dist = haversineDistanceMeters(current, active.center);
          }

          setDistance(dist);
          setIsInside(inside);
        };

        const processPosition = () => {
          if (positionBuffer.length === 0) return;

          const avgLat =
            positionBuffer.reduce((sum, p) => sum + p.coords.latitude, 0) /
            positionBuffer.length;
          const avgLon =
            positionBuffer.reduce((sum, p) => sum + p.coords.longitude, 0) /
            positionBuffer.length;

          const current: LatLngTuple = [avgLat, avgLon];
          setPosition(current);
          updateDistance(current);
          setLoading(false);
          positionBuffer = [];
        };

        watchId = navigator.geolocation.watchPosition(
          pos => {
            positionBuffer.push(pos);
            if (positionBuffer.length > bufferSize) {
              positionBuffer.shift();
            }

            if (updateTimeout) {
              clearTimeout(updateTimeout);
            }
            updateTimeout = setTimeout(processPosition, 2000);
          },
          (err: unknown) => {
            console.warn('Geolocation watch error:', err);
            const errorResult = extractErrorMessage(err);
            setError(errorResult.message);
            setLoading(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 10000,
          }
        );
      } catch (err) {
        const errorResult = extractErrorMessage(err);
        setError(errorResult.message);
        setLoading(false);
      }
    })();

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
    };
  }, []);

  /* -------- Derived state -------- */

  const threshold = geofence?.threshold_enabled
    ? (Number(geofence.threshold_distance))
    : 0;

  const canCheckIn = isInside || (geofence?.threshold_enabled && threshold > 0 && distance <= threshold);

  const progress = threshold > 0
    ? Math.min(100, Math.max(0, ((threshold - distance) / threshold) * 100))
    : 0;

  /* ---------------- UI ---------------- */

  return (
    <Card sx={{ mt: 2, borderRadius: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={700} mb={0.5}>
          Live Geofence Tracking
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          {geofence?.name ? `Geofence: ${geofence.name}` : 'Live location tracking is active automatically'}
        </Typography>

        {error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading && (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight={300}
          >
            <CircularProgress />
          </Box>
        )}

        {!loading && position && geofence && (
          <Box
            display="flex"
            flexDirection={{ xs: 'column', lg: 'row' }}
            gap={3}
          >
            {/* LEFT */}
            <Box width={{ xs: '100%', lg: '40%' }} display="flex" flexDirection="column" gap={2}>
              <Card
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  border: `2px solid ${canCheckIn
                    ? theme.palette.success.main
                    : theme.palette.warning.main
                    }`,
                  background: alpha(
                    canCheckIn
                      ? theme.palette.success.main
                      : theme.palette.warning.main,
                    0.08
                  ),
                }}
              >
                <Box display="flex" gap={1.5} alignItems="center">
                  {canCheckIn ? (
                    <CheckCircleIcon color="success" />
                  ) : (
                    <WarningIcon color="warning" />
                  )}
                  <Box>
                    <Typography variant="caption">
                      Check-in Status
                    </Typography>
                    <Typography variant="h6" fontWeight={700}>
                      {canCheckIn
                        ? 'You Can Check In'
                        : 'Too Far to Check In'}
                    </Typography>
                  </Box>
                </Box>

                {!canCheckIn && (
                  <Box mt={2}>
                    <LinearProgress
                      variant="determinate"
                      value={progress}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                )}
              </Card>

              <Card sx={{ p: 2.5 }}>
                <Typography variant="caption">
                  Distance to Geofence
                </Typography>
                <Box display="flex" gap={1} alignItems="center">
                  <RadioButtonCheckedIcon
                    color={canCheckIn ? 'success' : 'disabled'}
                  />
                  <Typography variant="h4" fontWeight={800}>
                    {isInside ? 'Inside' : formatDistance(distance)}
                  </Typography>
                </Box>
              </Card>
            </Box>

            {/* MAP */}
            <Box
              width={{ xs: '100%', lg: '60%' }}
              height={420}
              borderRadius={2}
              overflow="hidden"
              border="1px solid"
              borderColor="divider"
            >
              <MapContainer style={{ height: '100%' }} zoom={16}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <FitGeofence geofence={geofence} />

                <Marker position={position}>
                  <Popup>Your location</Popup>
                </Marker>

                {/* Circle geofence with threshold */}
                {geofence.type === 'circle' && geofence.radius && (
                  <>
                    <Circle
                      center={geofence.center}
                      radius={geofence.radius + threshold}
                      pathOptions={{
                        color: canCheckIn ? '#4caf50' : '#ff9800',
                        dashArray: '8 6',
                        fillOpacity: 0.12,
                      }}
                    />
                    <Circle
                      center={geofence.center}
                      radius={geofence.radius}
                      pathOptions={{
                        color: '#1976d2',
                        fillOpacity: 0.3,
                        weight: 3,
                      }}
                    />
                  </>
                )}

                {geofence.type === 'polygon' && geofence.coordinates && (
                  <Polygon
                    positions={geofence.coordinates}
                    pathOptions={{
                      color: '#1976d2',
                      fillOpacity: 0.3,
                      weight: 3,
                    }}
                  />
                )}

                {geofence.type === 'rectangle' && geofence.coordinates && (
                  <Rectangle
                    bounds={
                      [
                        [
                          geofence.coordinates[0][0],
                          geofence.coordinates[0][1],
                        ],
                        [
                          geofence.coordinates[2][0],
                          geofence.coordinates[2][1],
                        ],
                      ] as [[number, number], [number, number]]
                    }
                    pathOptions={{
                      color: '#1976d2',
                      fillOpacity: 0.3,
                      weight: 3,
                    }}
                  />
                )}
              </MapContainer>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default EmployeeGeofenceStatus;
