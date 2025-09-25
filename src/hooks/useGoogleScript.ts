import { useEffect, useState } from 'react';

export function useGoogleScript(): { isLoaded: boolean } {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      if (existing.getAttribute('data-loaded') === 'true') {
        setIsLoaded(true);
      } else {
        existing.addEventListener('load', () => setIsLoaded(true), { once: true });
      }
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.setAttribute('data-loaded', 'true');
      setIsLoaded(true);
    };
    script.onerror = () => setIsLoaded(false);
    document.head.appendChild(script);
  }, []);

  return { isLoaded };
} 