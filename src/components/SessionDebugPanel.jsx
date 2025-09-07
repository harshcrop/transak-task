import { useTransakState } from "../context/TransakTypes.js";

/**
 * Debug component to show session status and provide logout functionality
 * Remove this in production
 */
export function SessionDebugPanel() {
  const { state, actions } = useTransakState();
  const { otp } = state;

  if (!otp.isLoggedIn) {
    return null;
  }

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      actions.logout();
    }
  };

  return (
    <div className="fixed top-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg z-50 max-w-xs">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-900">Session Status</h4>
        <div
          className="w-2 h-2 bg-green-500 rounded-full"
          title="Logged in"
        ></div>
      </div>

      <div className="text-xs text-gray-600 mb-3 space-y-1">
        <div>Status: Logged In</div>
        {otp.tokenExpiry && (
          <div>Expires: {new Date(otp.tokenExpiry).toLocaleTimeString()}</div>
        )}
        <div>Step: {state.currentStep}</div>
      </div>

      <button
        onClick={handleLogout}
        className="w-full bg-red-600 hover:bg-red-700 text-white text-xs py-1 px-2 rounded transition-colors"
      >
        Logout
      </button>
    </div>
  );
}

export default SessionDebugPanel;
