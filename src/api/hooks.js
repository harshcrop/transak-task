import { useState, useEffect, useCallback } from "react";
import transakService from "./transakService.js";

/**
 * Hook for managing crypto currencies specifically
 */
export const useCryptoCurrencies = () => {
  const [cryptoCurrencies, setCryptoCurrencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCryptoCurrencies = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const cryptoData = await transakService.getCryptoCurrencies();
      setCryptoCurrencies(cryptoData);
      console.log("Fetched crypto currencies:", cryptoData);
    } catch (err) {
      setError(err.message);
      console.error("Crypto currencies fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCryptoCurrencies();
  }, [fetchCryptoCurrencies]);

  return {
    cryptoCurrencies,
    loading,
    error,
    refetch: fetchCryptoCurrencies,
  };
};

/**
 * Hook for managing fiat currencies only
 */
export const useFiatCurrencies = () => {
  const [fiatCurrencies, setFiatCurrencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFiatCurrencies = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const fiatData = await transakService.getFiatCurrencies();
      setFiatCurrencies(fiatData);
      console.log("Fetched fiat currencies:", fiatData);
    } catch (err) {
      setError(err.message);
      console.error("Fiat currencies fetch error:", err);
      setFiatCurrencies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiatCurrencies();
  }, [fetchFiatCurrencies]);

  return {
    fiatCurrencies,
    refetch: fetchFiatCurrencies,
    loading,
    error,
  };
};

/**
 * Hook for managing quotes and fee calculations
 */
export const useQuote = (quoteParams) => {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debounced effect to fetch quote when params change
  useEffect(() => {
    if (!quoteParams) {
      setQuote(null);
      return;
    }

    if (!quoteParams?.fiatAmount || quoteParams.fiatAmount <= 0) {
      setQuote(null);
      return;
    }

    const fetchQuote = async (params) => {
      console.log("Fetching quote with params:", params);
      setLoading(true);
      setError(null);

      try {
        const quoteData = await transakService.getQuote(params);
        setQuote(quoteData);
        console.log("Fetched quote:", quoteData);
      } catch (err) {
        setError(err.message);
        console.error("Quote fetch error:", err);
        setQuote(null);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchQuote(quoteParams);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [quoteParams]);

  const refetch = useCallback(async (params) => {
    if (!params?.fiatAmount || params.fiatAmount <= 0) {
      setQuote(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const quoteData = await transakService.getQuote(params);
      setQuote(quoteData);
      console.log("Fetched quote:", quoteData);
    } catch (err) {
      setError(err.message);
      console.error("Quote fetch error:", err);
      setQuote(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    quote,
    loading,
    error,
    refetch,
  };
};

export default {
  useCryptoCurrencies,
  useFiatCurrencies,
  useQuote,
};
