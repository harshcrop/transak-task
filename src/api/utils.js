import { API_CONFIG } from "./config.js";

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * Base API request function
 */
export const apiRequest = async (url, options = {}) => {
  const { method = "GET", body, headers = {}, params } = options;

  // Build URL with query parameters
  const urlObj = new URL(url);
  const urlParams = new URLSearchParams(urlObj.search);

  // Add additional parameters
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        urlParams.set(key, value);
      }
    });
  }

  // Add API key as query parameter if available and URL contains fiat-currencies
  if (
    API_CONFIG.PARTNER_API_KEY &&
    API_CONFIG.PARTNER_API_KEY !== "your-api-key-here" &&
    url.includes("fiat-currencies")
  ) {
    urlParams.set("apiKey", API_CONFIG.PARTNER_API_KEY);
  }

  urlObj.search = urlParams.toString();

  const config = {
    method,
    headers: {
      ...API_CONFIG.DEFAULT_HEADERS,
      ...headers,
    },
  };

  if (body && method !== "GET") {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(urlObj.toString(), config);

    // Handle non-JSON responses
    const contentType = response.headers.get("content-type");
    const responseData =
      contentType && contentType.includes("application/json")
        ? await response.json()
        : await response.text();

    if (!response.ok) {
      throw new ApiError(
        responseData.message ||
          `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        responseData
      );
    }

    return responseData;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network or other errors
    throw new ApiError(error.message || "Network error occurred", 0, {
      originalError: error,
    });
  }
};

/**
 * GET request helper
 */
export const get = (url, params = {}, headers = {}) => {
  return apiRequest(url, { method: "GET", params, headers });
};

/**
 * POST request helper
 */
export const post = (url, body = {}, params = {}, headers = {}) => {
  return apiRequest(url, { method: "POST", body, params, headers });
};

/**
 * PATCH request helper
 */
export const patch = (url, body = {}, params = {}, headers = {}) => {
  return apiRequest(url, { method: "PATCH", body, params, headers });
};

/**
 * PUT request helper
 */
export const put = (url, body = {}, headers = {}) => {
  return apiRequest(url, { method: "PUT", body, headers });
};

/**
 * DELETE request helper
 */
export const del = (url, headers = {}) => {
  return apiRequest(url, { method: "DELETE", headers });
};

export default { apiRequest, get, post, patch, put, del, ApiError };
