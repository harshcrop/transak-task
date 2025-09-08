// API Configuration
export const API_CONFIG = {
  DEFAULT_HEADERS: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  PARTNER_API_KEY: import.meta.env.VITE_PARTNER_API_KEY,
  AUTH_API_KEY: import.meta.env.VITE_AUTH_API_KEY,
};

// Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// API Endpoints
export const ENDPOINTS = {
  CRYPTO_CURRENCIES: `${API_BASE_URL}/api/v2/lookup/currencies/crypto-currencies`,
  FIAT_CURRENCIES: `${API_BASE_URL}/api/v2/lookup/currencies/fiat-currencies?apiKey=${
    import.meta.env.VITE_PARTNER_API_KEY
  }`,
  QUOTES: `${API_BASE_URL}/api/v2/lookup/quotes`,
  VERIFY_WALLET:
    "https://api.transak.com/cryptocoverage/api/v1/public/verify-wallet-address",
  AUTH_LOGIN: `${API_BASE_URL}/api/v2/auth/login`,
  AUTH_VERIFY_OTP: `${API_BASE_URL}/api/v2/auth/verify`,
  AUTH_REFRESH: `${API_BASE_URL}/api/v2/auth/refresh`,
  USER_DETAILS: `${API_BASE_URL}/api/v2/user/`,
  KYC_USER: `${API_BASE_URL}/api/v2/kyc/user`,
  KYC_REQUIREMENT: `${API_BASE_URL}/api/v2/kyc/requirement`,
  KYC_ADDITIONAL_REQUIREMENTS: `${API_BASE_URL}/api/v2/kyc/additional-requirements`,
  KYC_PURPOSE_OF_USAGE: `${API_BASE_URL}/api/v2/kyc/purpose-of-usage`,
};

export default API_CONFIG;
