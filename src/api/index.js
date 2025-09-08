// Export API configuration
export { API_CONFIG, ENDPOINTS } from "./config.js";

// Export API utilities
export { apiRequest, get, post, patch, put, del, ApiError } from "./utils.js";

// Export Transak service functions
export {
  sendEmailOTP,
  verifyEmailOTP,
  getUserDetails,
  refreshAccessToken,
  updateKYCUser,
  getKYCRequirements,
  getKYCAdditionalRequirements,
  submitPurposeOfUsage,
  getFiatCurrencies,
  getCryptoCurrencies,
  getExchangeRate,
  createOrder,
  getQuote,
  calculateFees,
} from "./transakService.js";

// Export React hooks
export { useCryptoCurrencies, useFiatCurrencies, useQuote } from "./hooks.js";

// Export default service
export { default as transakService } from "./transakService.js";
export { default as apiHooks } from "./hooks.js";
