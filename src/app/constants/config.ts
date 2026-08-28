export const APP_CONFIG = {
  APP_NAME: 'Ayurvedic Super App',
  API_BASE_URL: 'https://api.ayurvedicsuperapp.com/v1',
  API_TIMEOUT_MS: 12000,
  SLOT_HOLD_DURATION_SECONDS: 300, // 5 minutes
  DEBOUNCE_SEARCH_MS: 300,
  MAX_OFFLINE_RETRIES: 5,
  PAGINATION_LIMIT: 15,
} as const;
