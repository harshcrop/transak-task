import { useEffect, useState, useCallback } from "react";
import { useTransakState } from "../context/TransakContext.jsx";
import { getKYCAdditionalRequirements } from "../api/transakService.js";

/**
 * Custom hook to fetch KYC additional requirements and KYC URL
 * @returns {Object} Object containing loading state, error, and retry function
 */
export const useKYCAdditionalRequirements = () => {
  const { state, actions } = useTransakState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAdditionalRequirements = useCallback(async () => {
    const accessToken = state.otp.authToken;
    const quoteId = state.quote.quote?.quoteId;

    if (!accessToken || !quoteId) {
      console.log("Missing required data for KYC additional requirements:", {
        hasAccessToken: !!accessToken,
        hasQuoteId: !!quoteId,
      });
      return;
    }

    // Don't fetch if already fetched
    if (state.kycProcess.additionalRequirementsFetched) {
      console.log("KYC additional requirements already fetched");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Fetching KYC additional requirements with:", {
        quoteId,
        hasAccessToken: !!accessToken,
      });

      const response = await getKYCAdditionalRequirements(accessToken, quoteId);
      
      console.log("KYC additional requirements response:", response);

      if (response.success && response.data) {
        actions.setKYCAdditionalRequirements(response.data);
        console.log("KYC additional requirements saved to context:", response.data);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Error fetching KYC additional requirements:", err);
      setError(err.message || "Failed to fetch KYC additional requirements");
    } finally {
      setLoading(false);
    }
  }, [
    state.otp.authToken,
    state.quote.quote?.quoteId,
    state.kycProcess.additionalRequirementsFetched,
    actions,
  ]);

  // Auto-fetch when dependencies are available
  useEffect(() => {
    if (
      state.otp.authToken &&
      state.quote.quote?.quoteId &&
      !state.kycProcess.additionalRequirementsFetched
    ) {
      fetchAdditionalRequirements();
    }
  }, [
    state.otp.authToken,
    state.quote.quote?.quoteId,
    state.kycProcess.additionalRequirementsFetched,
    fetchAdditionalRequirements,
  ]);

  return {
    loading,
    error,
    kycUrl: state.kycProcess.kycUrl,
    additionalRequirements: state.kycProcess.additionalRequirements,
    additionalRequirementsFetched: state.kycProcess.additionalRequirementsFetched,
    retry: fetchAdditionalRequirements,
  };
};

export default useKYCAdditionalRequirements;
