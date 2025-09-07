import { useEffect, useRef } from "react";
import { useTransakState } from "../context/TransakContext.jsx";
import { refreshAccessToken } from "../api/index.js";

// Simple helper to extract token from various possible shapes
const extractTokenFromResponse = (response) => {
  const data = response?.data || response;
  return (
    data?.accessToken ||
    data?.authToken ||
    data?.token ||
    data?.authorization ||
    null
  );
};

/**
 * Keeps the user session alive by periodically calling Refresh API
 * and updating `otp.authToken` in context. Also restores token from
 * sessionStorage on mount and persists on change.
 */
export function useAuthSession() {
  const { state, actions } = useTransakState();
  const intervalRef = useRef(null);

  // Restore token from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("transak_access_token");
      if (stored && !state.otp.authToken) {
        actions.setOtpData({ authToken: stored, verified: !!stored });
      }
    } catch (e) {
      // ignore storage errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist token whenever it changes
  useEffect(() => {
    try {
      if (state.otp.authToken) {
        sessionStorage.setItem("transak_access_token", state.otp.authToken);
      } else {
        sessionStorage.removeItem("transak_access_token");
      }
    } catch (e) {
      // ignore storage errors
    }
  }, [state.otp.authToken]);

  // Background refresher: refresh every ~9 minutes (token TTL is typically ~10m)
  useEffect(() => {
    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!state.otp.authToken) {
      return undefined;
    }

    const doRefresh = async () => {
      try {
        const resp = await refreshAccessToken(state.otp.authToken);
        const newToken = extractTokenFromResponse(resp);
        if (newToken && newToken !== state.otp.authToken) {
          actions.setOtpData({ authToken: newToken });
        }
      } catch (err) {
        // If refresh fails, we silently keep the old token; UX can retry on demand
        // Optionally, clear token on 401/403 to force re-login in a real app
        // console.error("Token refresh failed", err);
      }
    };

    // Kick off an immediate refresh attempt to extend on first mount
    doRefresh();

    // Then schedule periodic refreshes
    intervalRef.current = setInterval(doRefresh, 9 * 60 * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state.otp.authToken, actions]);

  return null;
}

export default useAuthSession;


