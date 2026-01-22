import { useEffect, useState } from 'react';
import { env } from '../config/env';

type Prediction = {
  description: string;
  place_id: string;
};

export function useGooglePlaces() {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    const key = env.placesApiKey;
    if (!key) {
      setIsLoaded(false);
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src*="maps.googleapis.com/maps/api/js"]'
    );

    if (existing) {
      if (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).google &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).google.maps &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).google.maps.places
      ) {
        setIsLoaded(true);
      } else {
        existing.addEventListener('load', () => setIsLoaded(true), {
          once: true,
        });
      }
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => setIsLoaded(false);
    document.head.appendChild(script);
  }, []);

  const getPredictions = (input: string): Promise<Prediction[]> => {
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!(window as any).google || !(window as any).google.maps) {
        reject(new Error('Google Maps script not loaded'));
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const svc = new (window as any).google.maps.places.AutocompleteService();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      svc.getPlacePredictions({ input }, (predictions: any[], status: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const okStatus = (window as any).google.maps.places.PlacesServiceStatus
          .OK;
        if (status !== okStatus) {
          resolve([]);
          return;
        }
        resolve(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (predictions || []).map((p: any) => ({
            description: p.description,
            place_id: p.place_id,
          }))
        );
      });
    });
  };

  const getPlaceDetails = (placeId: string): Promise<unknown> => {
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!(window as any).google || !(window as any).google.maps) {
        reject(new Error('Google Maps script not loaded'));
        return;
      }

      const element = document.createElement('div');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ps = new (window as any).google.maps.places.PlacesService(element);
      ps.getDetails(
        { placeId, fields: ['geometry', 'formatted_address', 'name'] },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (place: any, status: any) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const okStatus = (window as any).google.maps.places
            .PlacesServiceStatus.OK;
          if (status !== okStatus) {
            reject(new Error('Place details fetch failed'));
            return;
          }
          resolve(place);
        }
      );
    });
  };

  return { isLoaded, getPredictions, getPlaceDetails };
}
