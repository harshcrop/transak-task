import { get, post, patch } from "./utils.js";
import { ENDPOINTS, API_CONFIG } from "./config.js";

/**
 * Send OTP to email for verification
 * @param {string} email - User's email address
 * @returns {Promise<Object>} Response containing state token and expiration info
 */
export const sendEmailOTP = async (email) => {
  try {
    const response = await post(ENDPOINTS.AUTH_LOGIN, {
      apiKey: API_CONFIG.AUTH_API_KEY,
      email: email,
    });

    // Return the response data
    if (response.data) {
      return {
        success: true,
        data: response.data,
        stateToken: response.data.stateToken,
        email: response.data.email,
        expiresIn: response.data.expiresIn,
      };
    }

    return {
      success: true,
      data: response,
    };
  } catch (error) {
    console.error("Error sending email OTP:", error);
    throw new Error(
      error.data?.message || error.message || "Failed to send OTP to email"
    );
  }
};

/**
 * Verify OTP sent to email
 * @param {string} otp - OTP code from email
 * @param {string} stateToken - State token from login response
 * @param {string} email - Email address for verification
 * @returns {Promise<Object>} Verification response
 */
export const verifyEmailOTP = async (otp, stateToken, email) => {
  try {
    const payload = {
      apiKey: API_CONFIG.AUTH_API_KEY,
      email: email,
      otp: otp,
      stateToken: stateToken,
    };

    // Debug: Log the payload being sent to the API
    console.log("API Payload for OTP verification:", payload);

    const response = await post(ENDPOINTS.AUTH_VERIFY_OTP, payload);

    return {
      success: true,
      data: response.data || response,
    };
  } catch (error) {
    console.error("Error verifying email OTP:", error);
    // Re-throw the original error to preserve API error structure
    throw error;
  }
};

/**
 * Get user details after email verification
 * @param {string} accessToken - Access token from OTP verification response
 * @returns {Promise<Object>} User details response
 */
export const getUserDetails = async (accessToken) => {
  try {
    const response = await get(
      ENDPOINTS.USER_DETAILS,
      {
        apiKey: API_CONFIG.PARTNER_API_KEY,
      },
      {
        authorization: accessToken,
      }
    );

    return {
      success: true,
      data: response.data || response,
    };
  } catch (error) {
    console.error("Error fetching user details:", error);
    throw new Error(
      error.data?.message || error.message || "Failed to fetch user details"
    );
  }
};

/**
 * Get available fiat currencies with country and payment method information
 */
export const getFiatCurrencies = async () => {
  try {
    const response = await get(ENDPOINTS.FIAT_CURRENCIES);

    // Check for data.fiatCurrencies structure first
    if (
      response.data &&
      response.data.fiatCurrencies &&
      Array.isArray(response.data.fiatCurrencies)
    ) {
      return response.data.fiatCurrencies.map((currency) => ({
        symbol: currency.symbol,
        name: currency.name,
        decimals: currency.roundOff || currency.decimals || 2,
        paymentMethods: currency.paymentOptions
          ? currency.paymentOptions.map((option) => option.id)
          : currency.paymentMethods || [],
        isAllowed: currency.isAllowed !== false,
        icon: currency.icon,
        isSellAllowed: currency.isSellAllowed,
        paymentOptions: currency.paymentOptions || [],
      }));
    }

    // The API response contains fiat currencies with country and payment method info
    if (response.response && Array.isArray(response.response)) {
      return response.response.map((currency) => ({
        symbol: currency.symbol,
        name: currency.name,
        decimals: currency.roundOff || currency.decimals || 2,
        paymentMethods: currency.paymentOptions
          ? currency.paymentOptions.map((option) => option.id)
          : currency.paymentMethods || [],
        isAllowed: currency.isAllowed !== false,
        icon: currency.icon,
        isSellAllowed: currency.isSellAllowed,
        paymentOptions: currency.paymentOptions || [],
      }));
    }

    // Handle single currency response (like the example you provided)
    if (response.response && response.response.symbol) {
      const currency = response.response;
      return [
        {
          symbol: currency.symbol,
          name: currency.name,
          decimals: currency.roundOff || currency.decimals || 2,
          paymentMethods: currency.paymentOptions
            ? currency.paymentOptions.map((option) => option.id)
            : currency.paymentMethods || [],
          isAllowed: currency.isAllowed !== false,
          icon: currency.icon,
          isSellAllowed: currency.isSellAllowed,
          paymentOptions: currency.paymentOptions || [],
        },
      ];
    }

    // Fallback to empty array if no valid structure found
    console.warn("Unexpected fiat currencies response structure:", response);
    return [];
  } catch (error) {
    console.error("Error fetching fiat currencies:", error);
    throw error;
  }
};

/**
 * Get available crypto currencies
 */
export const getCryptoCurrencies = async () => {
  try {
    const response = await get(ENDPOINTS.CRYPTO_CURRENCIES);

    // The API response structure is { data: { cryptoCurrencies: [...] } }
    if (
      response.data &&
      response.data.cryptoCurrencies &&
      Array.isArray(response.data.cryptoCurrencies)
    ) {
      // Filter to only include ETH and BTC as requested
      const filteredCryptos = response.data.cryptoCurrencies.filter(
        (crypto) => crypto.symbol === "ETH" || crypto.symbol === "BTC"
      );

      return filteredCryptos.map((crypto) => ({
        symbol: crypto.symbol,
        name: crypto.name,
        network: crypto.network?.name || "mainnet",
        networkDisplayName: formatNetworkDisplayName(
          crypto.network?.name || "mainnet"
        ),
        image: crypto.image,
        isAllowed: crypto.isAllowed,
        isStable: crypto.isStable,
        uniqueId: crypto.uniqueId,
        roundOff: crypto.roundOff,
        isSellAllowed: crypto.isSellAllowed,
        kycCountriesNotSupported: crypto.kycCountriesNotSupported || [],
      }));
    }

    // Fallback for different response structures
    if (response.response && Array.isArray(response.response)) {
      const filteredCryptos = response.response.filter(
        (crypto) => crypto.symbol === "ETH" || crypto.symbol === "BTC"
      );

      return filteredCryptos.map((crypto) => ({
        symbol: crypto.symbol,
        name: crypto.name,
        network: crypto.network?.name || crypto.network || "mainnet",
        networkDisplayName: formatNetworkDisplayName(
          crypto.network?.name || crypto.network || "mainnet"
        ),
        image: crypto.image,
        isAllowed: crypto.isAllowed,
        isStable: crypto.isStable,
        uniqueId:
          crypto.uniqueId ||
          `${crypto.symbol}${
            crypto.network?.name || crypto.network || "mainnet"
          }`,
        roundOff: crypto.roundOff,
        isSellAllowed: crypto.isSellAllowed,
        kycCountriesNotSupported: crypto.kycCountriesNotSupported || [],
      }));
    }

    return [];
  } catch (error) {
    console.error("Error fetching crypto currencies:", error);
    throw error;
  }
};

/**
 * Format network display names
 */
const formatNetworkDisplayName = (networkName) => {
  const networkDisplayNames = {
    ethereum: "Ethereum",
    mainnet: "Bitcoin",
    optimism: "Optimism",
    arbitrum: "Arbitrum",
    polygon: "Polygon",
    bsc: "BSC",
    avalanche: "Avalanche",
  };

  return (
    networkDisplayNames[networkName] ||
    networkName.charAt(0).toUpperCase() + networkName.slice(1)
  );
};

/**
 * Get exchange rate between fiat and crypto
 */
export const getExchangeRate = async (
  fiatCurrency = "EUR",
  cryptoCurrency = "ETH",
  network = "ethereum",
  fiatAmount = 250
) => {
  try {
    const response = await get(ENDPOINTS.EXCHANGE_RATES, {
      fiatCurrency,
      cryptoCurrency,
      network,
      fiatAmount,
      paymentMethod: "credit_debit_card", // Default payment method
    });
    return response.response || response;
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    throw error;
  }
};

/**
 * Create a new order
 */
export const createOrder = async (orderData) => {
  try {
    const response = await post(ENDPOINTS.CREATE_ORDER, {
      ...orderData,
    });
    return response.response || response;
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
};

/**
 * Get quote with fees and rates for a transaction
 */
export const getQuote = async ({
  fiatCurrency = "EUR",
  cryptoCurrency = "ETH",
  isBuyOrSell = "BUY",
  network = "ethereum",
  paymentMethod = "sepa_bank_transfer",
  fiatAmount = null,
  cryptoAmount = null,
  partnerCustomerId = null,
}) => {
  try {
    const params = {
      apiKey: API_CONFIG.PARTNER_API_KEY,
      fiatCurrency,
      cryptoCurrency,
      isBuyOrSell,
      network,
      paymentMethod,
    };

    // Add amount parameter (either fiat or crypto)
    if (fiatAmount !== null) {
      params.fiatAmount = fiatAmount.toString();
    }
    if (cryptoAmount !== null) {
      params.cryptoAmount = cryptoAmount.toString();
    }
    if (partnerCustomerId) {
      params.partnerCustomerId = partnerCustomerId;
    }

    const response = await get(ENDPOINTS.QUOTES, params);

    return response.data || response;
  } catch (error) {
    console.error("Error fetching quote:", error);
    throw error;
  }
};

/**
 * Calculate fees for a transaction
 */
export const calculateFees = async (
  fiatCurrency = "EUR",
  cryptoCurrency = "ETH",
  fiatAmount = 250,
  paymentMethod = "credit_debit_card",
  network = "ethereum"
) => {
  try {
    // Use the quotes endpoint to get real fee calculation
    const quote = await getQuote({
      fiatCurrency,
      cryptoCurrency,
      isBuyOrSell: "BUY",
      network,
      paymentMethod,
      fiatAmount,
    });

    return {
      feeBreakdown: quote.feeBreakdown || [],
      totalFee: quote.totalFee || 0,
      conversionPrice: quote.conversionPrice || 0,
      cryptoAmount: quote.cryptoAmount || 0,
      fiatAmount: quote.fiatAmount || fiatAmount,
      slippage: quote.slippage || 0,
      quoteId: quote.quoteId,
      nonce: quote.nonce,
    };
  } catch (error) {
    console.error("Error calculating fees:", error);

    // Re-throw the error instead of providing fallback data
    throw new Error(`Failed to calculate fees: ${error.message}`);
  }
};

/**
 * Validate wallet address format
 */
export const validateWalletAddress = async ({
  walletAddress,
  cryptoCurrency,
  network,
}) => {
  try {
    // Verify wallet address format
    const verifyParams = {
      cryptoCurrency,
      network,
      walletAddress,
    };

    let verifyResponse;
    try {
      verifyResponse = await get(ENDPOINTS.VERIFY_WALLET, verifyParams);
    } catch (verifyError) {
      // If verification API returns an error, the address is invalid
      return {
        isValid: false,
        error: "Invalid wallet address format",
        message:
          verifyError.data?.message ||
          "Invalid wallet address. Please provide a valid wallet address to proceed.",
      };
    }

    // Check if wallet address verification failed
    if (
      !verifyResponse ||
      !verifyResponse.response ||
      !verifyResponse.success
    ) {
      return {
        isValid: false,
        error: "Invalid wallet address format",
        message:
          "Invalid wallet address. Please provide a valid wallet address to proceed.",
      };
    }

    // Wallet address is valid
    return {
      isValid: true,
      walletAddress: walletAddress,
      message: "Wallet address is valid",
    };
  } catch (error) {
    console.error("Error validating wallet address:", error);

    // Return validation failure
    return {
      isValid: false,
      error: error.message || "Invalid wallet address",
      message:
        "Invalid wallet address. Please provide a valid wallet address to proceed.",
    };
  }
};

/**
 * Refresh the access token to maintain session
 * @param {string} accessToken - Current access token
 * @returns {Promise<Object>} Refresh response with new token
 */
export const refreshAccessToken = async (accessToken) => {
  try {
    const response = await get(
      ENDPOINTS.AUTH_REFRESH,
      {},
      {
        authorization: accessToken,
      }
    );

    return {
      success: true,
      data: response.data || response,
    };
  } catch (error) {
    console.error("Error refreshing access token:", error);
    throw new Error(
      error.data?.message || error.message || "Failed to refresh access token"
    );
  }
};

/**
 * Update KYC user data with personal and address details
 * @param {string} accessToken - Access token from login
 * @param {Object} personalDetails - User personal details (optional)
 * @param {Object} addressDetails - User address details (optional)
 * @returns {Promise<Object>} Update response
 */
export const updateKYCUser = async (
  accessToken,
  personalDetails = {},
  addressDetails = {}
) => {
  try {
    const payload = {};

    // Add personal details if provided
    if (personalDetails && Object.keys(personalDetails).length > 0) {
      payload.personalDetails = {
        firstName: personalDetails.firstName,
        lastName: personalDetails.lastName,
        mobileNumber: personalDetails.mobileNumber,
        dob: personalDetails.dateOfBirth,
      };
    }

    // Add address details if provided
    if (addressDetails && Object.keys(addressDetails).length > 0) {
      payload.addressDetails = {
        addressLine1: addressDetails.addressLine1,
        addressLine2: addressDetails.addressLine2 || "",
        state: addressDetails.state,
        city: addressDetails.city,
        postCode: addressDetails.postalCode,
        countryCode: addressDetails.countryCode,
      };
    }

    // If no data provided, skip the API call
    if (Object.keys(payload).length === 0) {
      console.log("No data to update, skipping API call");
      return { success: true, data: { message: "No data to update" } };
    }

    const response = await patch(
      ENDPOINTS.KYC_USER,
      payload,
      {
        apiKey: API_CONFIG.PARTNER_API_KEY,
      },
      {
        authorization: accessToken,
      }
    );

    return {
      success: true,
      data: response.data || response,
    };
  } catch (error) {
    console.error("Error updating KYC user:", error);
    throw new Error(
      error.data?.message ||
        error.message ||
        "Failed to update KYC user details"
    );
  }
};

/**
 * Get KYC requirements based on quote ID
 * @param {string} accessToken - Access token from login
 * @param {string} quoteId - Quote ID from the quote API
 * @returns {Promise<Object>} KYC requirements response
 */
export const getKYCRequirements = async (accessToken, quoteId) => {
  try {
    const response = await get(
      ENDPOINTS.KYC_REQUIREMENT,
      {
        "metadata[quoteId]": quoteId,
        apiKey: API_CONFIG.PARTNER_API_KEY,
      },
      {
        authorization: accessToken,
      }
    );

    return {
      success: true,
      data: response.data || response,
    };
  } catch (error) {
    console.error("Error fetching KYC requirements:", error);
    throw new Error(
      error.data?.message || error.message || "Failed to fetch KYC requirements"
    );
  }
};

/**
 * Submit purpose of usage for compliance
 * @param {string} accessToken - Access token from login
 * @param {Array<string>} purposeList - Array of purpose strings
 * @returns {Promise<Object>} Purpose submission response
 */
export const submitPurposeOfUsage = async (accessToken, purposeList) => {
  try {
    const payload = {
      purposeList: purposeList,
    };

    const response = await post(
      ENDPOINTS.KYC_PURPOSE_OF_USAGE,
      payload,
      {},
      {
        authorization: accessToken,
      }
    );

    return {
      success: true,
      data: response.data || response,
    };
  } catch (error) {
    console.error("Error submitting purpose of usage:", error);
    throw new Error(
      error.data?.message ||
        error.message ||
        "Failed to submit purpose of usage"
    );
  }
};

/**
 * Get KYC additional requirements with KYC URL
 * @param {string} accessToken - Access token from login
 * @param {string} quoteId - Quote ID from the quote API
 * @returns {Promise<Object>} KYC additional requirements response with KYC URL
 */
export const getKYCAdditionalRequirements = async (accessToken, quoteId) => {
  try {
    console.log("🚀 getKYCAdditionalRequirements called with:", {
      hasAccessToken: !!accessToken,
      quoteId: quoteId,
      endpoint: ENDPOINTS.KYC_ADDITIONAL_REQUIREMENTS,
    });

    const params = {
      "metadata[quoteId]": quoteId,
      apiKey: API_CONFIG.PARTNER_API_KEY,
    };

    const headers = {
      authorization: accessToken,
    };

    console.log("📤 API Request params:", params);
    console.log("📤 API Request headers:", {
      ...headers,
      authorization: "***",
    });

    const response = await get(
      ENDPOINTS.KYC_ADDITIONAL_REQUIREMENTS,
      params,
      headers
    );

    console.log("📥 KYC Additional Requirements API Response:", response);

    return {
      success: true,
      data: response.data || response,
    };
  } catch (error) {
    console.error("❌ Error fetching KYC additional requirements:", error);
    console.error("❌ Error response:", error.response || error);
    throw new Error(
      error.data?.message ||
        error.message ||
        "Failed to fetch KYC additional requirements"
    );
  }
};

export default {
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
  validateWalletAddress,
};
