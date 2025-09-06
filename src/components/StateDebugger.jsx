import { useTransakState } from "../context/TransakContext";

export function StateDebugger({ show = false }) {
  const { state, helpers } = useTransakState();

  if (!show) return null;

  const progress = helpers.getProgress();

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md max-h-96 overflow-y-auto z-50">
      <h3 className="font-semibold text-sm mb-2">State Debug Panel</h3>

      {/* Progress */}
      <div className="mb-3">
        <p className="text-xs text-gray-600">
          Progress: {progress.completed}/{progress.total} (
          {Math.round(progress.percentage)}%)
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
          <div
            className="bg-blue-600 h-2 rounded-full"
            style={{ width: `${progress.percentage}%` }}
          ></div>
        </div>
      </div>

      {/* Current Step */}
      <div className="mb-2">
        <p className="text-xs">
          <strong>Current Step:</strong> {state.currentStep}
        </p>
      </div>

      {/* Completed Steps */}
      <div className="mb-2">
        <p className="text-xs">
          <strong>Completed Steps:</strong>
        </p>
        <p className="text-xs text-gray-600">
          {state.progress.completedSteps.join(", ") || "None"}
        </p>
      </div>

      {/* Form Data Summary */}
      <div className="space-y-1 text-xs">
        <p>
          <strong>Quote:</strong> {state.quote.fiatAmount}{" "}
          {state.quote.selectedFiatCurrency} →{" "}
          {state.quote.selectedCryptoCurrency}
        </p>

        {state.wallet.address && (
          <p>
            <strong>Wallet:</strong> {state.wallet.address.slice(0, 10)}...
          </p>
        )}

        {state.email.email && (
          <p>
            <strong>Email:</strong> {state.email.email}
          </p>
        )}

        {state.otp.verified && (
          <p>
            <strong>OTP:</strong> ✓ Verified
          </p>
        )}

        {state.personalDetails.completed && (
          <p>
            <strong>Personal:</strong> {state.personalDetails.firstName}{" "}
            {state.personalDetails.lastName}
          </p>
        )}

        {state.address.completed && (
          <p>
            <strong>Address:</strong> {state.address.city},{" "}
            {state.address.country}
          </p>
        )}

        {state.purpose.completed && (
          <p>
            <strong>Purpose:</strong> {state.purpose.purposeId}
          </p>
        )}

        {state.idProof.completed && (
          <p>
            <strong>ID Proof:</strong> ✓ Completed
          </p>
        )}
      </div>

      {/* Reset Button */}
      <button
        onClick={() => {
          if (window.confirm("Are you sure you want to reset all data?")) {
            window.location.reload();
          }
        }}
        className="mt-3 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
      >
        Reset All Data
      </button>
    </div>
  );
}
