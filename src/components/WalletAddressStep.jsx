import { useState } from "react";
import { ArrowLeft, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import transakService from "../api/transakService.js";
import { TransakFooter } from "./TransakFooter.jsx";

export function WalletAddressStep({
  selectedCryptoData,
  onBack,
  onNext,
  // quote,
  // fiatAmount,
  // selectedFiatCurrency,
}) {
  const [walletAddress, setWalletAddress] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [isValid, setIsValid] = useState(false);

  const handleWalletValidation = async () => {
    if (!walletAddress.trim()) {
      setValidationError("Please enter a wallet address");
      return;
    }

    setIsValidating(true);
    setValidationError("");
    setIsValid(false);

    try {
      const result = await transakService.validateWalletAddress({
        walletAddress: walletAddress.trim(),
        cryptoCurrency: selectedCryptoData?.symbol,
        network: selectedCryptoData?.network,
      });

      if (result.isValid) {
        setIsValid(true);
        setValidationError("");
        // Auto-proceed after successful validation
        setTimeout(() => {
          onNext(walletAddress.trim(), result);
        }, 1000);
      } else {
        setValidationError(result.message || "Invalid wallet address");
        setIsValid(false);
      }
    } catch (err) {
      setValidationError(
        "Failed to validate wallet address. Please try again."
      );
      setIsValid(false);
      console.error("Wallet validation error:", err);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValidating && !isValid) {
      handleWalletValidation();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="w-[30rem] h-[80vh] bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 border-b border-gray-200">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h2 className="text-bas font-medium text-gray-900">
            Enter Your Wallet Address
          </h2>
        </div>

        <div className="p-6 flex-1 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Wallet Address Input */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Wallet Address
                </label>
                <div className="relative">
                  <div className="flex items-center">
                    {selectedCryptoData?.image?.thumb && (
                      <div className="absolute left-3 w-6 h-6">
                        <img
                          src={selectedCryptoData.image.thumb}
                          alt={selectedCryptoData.name}
                          className="w-6 h-6"
                        />
                      </div>
                    )}
                    <input
                      type="text"
                      value={walletAddress}
                      onChange={(e) => {
                        setWalletAddress(e.target.value);
                        setValidationError("");
                        setIsValid(false);
                      }}
                      placeholder={`Enter your ${
                        selectedCryptoData?.symbol || "ETH"
                      } wallet address`}
                      className={`w-full pl-12 pr-12 py-4 border-1 rounded-lg bg-gray-100 outline-none transition-colors ${
                        validationError
                          ? "border-red-500 bg-red-50"
                          : isValid
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 focus:border-blue-500"
                      }`}
                    />
                    {isValidating && (
                      <div className="absolute right-3">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                      </div>
                    )}
                    {isValid && !isValidating && (
                      <div className="absolute right-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                    )}
                    {validationError && !isValidating && (
                      <div className="absolute right-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Error Message */}
                {validationError && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isValidating || isValid || !walletAddress.trim()}
                className={`w-full h-12 text-lg font-medium rounded-xl transition-colors ${
                  isValidating || isValid || !walletAddress.trim()
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {isValidating ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Validating...
                  </div>
                ) : isValid ? (
                  "Proceeding..."
                ) : (
                  `Buy ${selectedCryptoData?.symbol || "ETH"}`
                )}
              </button>
            </form>
          </div>

          {/* Powered by Transak Footer */}
          <TransakFooter />
        </div>
      </div>
    </div>
  );
}
