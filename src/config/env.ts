export const REQUIRED_ENV_VARS = [
  'VITE_GOOGLE_CLIENT_ID',
  'VITE_API_BASE_URL',
] as const;

type RequiredEnvKey = (typeof REQUIRED_ENV_VARS)[number];

const rawEnv = import.meta.env as unknown as Record<string, string | undefined>;

function getEnvVar(key: RequiredEnvKey): string {
  const value = rawEnv[key];
  if (!value) {
    const message = `Missing required environment variable: ${key}`;
    // Fail fast if required environment variables are missing
    throw new Error(message);
  }

  return value;
}

export const env = {
  googleClientId: getEnvVar('VITE_GOOGLE_CLIENT_ID'),
  apiBaseUrl: getEnvVar('VITE_API_BASE_URL'),
  placesApiKey: rawEnv['VITE_GOOGLE_PLACES_API_KEY'] ?? '',
};
