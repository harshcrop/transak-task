"use client";

import { useState, useMemo, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { CryptoCurrencySelector } from "./components/CryptoCurrencySelector.jsx";
import { FiatCurrencySelector } from "./components/FiatCurrencySelector.jsx";
import { WalletAddressStep } from "./components/WalletAddressStep.jsx";
import { PaymentMethodSelector } from "./components/PaymentMethodSelector.jsx";
import { EmailEntryStep } from "./components/EmailEntryStep.jsx";
import { OTPVerificationStep } from "./components/OTPVerificationStep.jsx";
import { PersonalDetailsStep } from "./components/PersonalDetailsStep.jsx";
import { AddressStep } from "./components/AddressStep.jsx";
import { PurposeStep } from "./components/PurposeStep.jsx";
import { KYCIframeStep } from "./components/KYCIframeStep.jsx";
import { KYBFormStep } from "./components/KYBFormStep.jsx";
import {
  useQuote,
  useCryptoCurrencies,
  useFiatCurrencies,
} from "./api/hooks.js";
import { getUserDetails } from "./api/index.js";
import { useTransakState } from "./context/TransakContext.jsx";

export function TransakWidget() {
  const { state, actions } = useTransakState();
  const {
    quote: contextQuote,
    wallet: contextWallet,
    email: contextEmail,
    otp: contextOtp,
    personalDetails: contextPersonalDetails,
    address: contextAddress,
    purpose: contextPurpose,
    currentStep: contextCurrentStep,
  } = state;

  const [fiatAmount, setFiatAmount] = useState("250");
  const [selectedPayment, setSelectedPayment] = useState("sepa_bank_transfer");
  const [selectedFiatCurrency, setSelectedFiatCurrency] = useState("EUR");
  const [selectedCryptoCurrency, setSelectedCryptoCurrency] = useState("ETH");
  const [showFees, setShowFees] = useState(false);
  const [selectedFiatCurrencyObj, setSelectedFiatCurrencyObj] = useState(null);
  const [_walletData, setWalletData] = useState(null);

  const { cryptoCurrencies } = useCryptoCurrencies();
  const { fiatCurrencies } = useFiatCurrencies();

  // Set initial fiat currency object when currencies are loaded
  useEffect(() => {
    if (fiatCurrencies.length > 0 && !selectedFiatCurrencyObj) {
      const eurCurrency = fiatCurrencies.find(
        (currency) => currency.symbol === "EUR"
      );
      if (eurCurrency) {
        setSelectedFiatCurrencyObj(eurCurrency);
        // Set initial payment method if available
        if (
          eurCurrency.paymentOptions &&
          eurCurrency.paymentOptions.length > 0
        ) {
          setSelectedPayment(eurCurrency.paymentOptions[0].id);
        }
      }
    }
  }, [fiatCurrencies, selectedFiatCurrencyObj]);

  // Get selected crypto currency data
  const selectedCryptoData = useMemo(() => {
    return cryptoCurrencies.find(
      (currency) =>
        currency.uniqueId === selectedCryptoCurrency ||
        currency.symbol === selectedCryptoCurrency
    );
  }, [cryptoCurrencies, selectedCryptoCurrency]);

  // Prepare quote parameters
  const quoteParams = useMemo(() => {
    const numericAmount = parseFloat(fiatAmount);
    if (!numericAmount || numericAmount <= 0) return null;

    const cryptoSymbol = selectedCryptoData?.symbol || "ETH";
    const networkName = selectedCryptoData?.network || "ethereum";

    return {
      fiatCurrency: selectedFiatCurrency,
      cryptoCurrency: cryptoSymbol,
      isBuyOrSell: "BUY",
      network: networkName,
      paymentMethod: selectedPayment,
      fiatAmount: numericAmount,
    };
  }, [
    fiatAmount,
    selectedFiatCurrency,
    selectedPayment,
    selectedCryptoData?.symbol,
    selectedCryptoData?.network,
  ]);

  // Get quote data
  const {
    quote,
    loading: quoteLoading,
    error: quoteError,
  } = useQuote(quoteParams);

  // Handle fiat currency change
  const handleFiatCurrencyChange = (currencyObj) => {
    if (typeof currencyObj === "string") {
      setSelectedFiatCurrency(currencyObj);
    } else {
      setSelectedFiatCurrency(currencyObj.symbol);
      setSelectedFiatCurrencyObj(currencyObj);
      // Reset payment method when currency changes
      if (currencyObj.paymentOptions && currencyObj.paymentOptions.length > 0) {
        setSelectedPayment(currencyObj.paymentOptions[0].id);
      }
    }
  };

  // Handle payment method change and trigger validation
  const handlePaymentChange = (paymentId) => {
    setSelectedPayment(paymentId);
  };

  // Handle Buy Now click
  const handleBuyNowClick = () => {
    if (!hasMinAmountError && quote) {
      actions.setCurrentStep("wallet");
    }
  };

  // Handle wallet step back
  const handleWalletBack = () => {
    actions.setCurrentStep("quote");
  };

  // Handle wallet validation success
  const handleWalletNext = (walletAddress, validationResult) => {
    setWalletData({
      address: walletAddress,
      validationResult,
    });
    actions.setWalletData({
      address: walletAddress,
      validationResult,
    });
    // Move to email entry step after successful wallet validation
    actions.setCurrentStep("email");
  };

  // Handle email step
  const handleEmailNext = (email, stateToken) => {
    actions.setEmailData({
      email,
      stateToken,
    });
    actions.setCurrentStep("otp");
  };

  const handleEmailBack = () => {
    actions.setCurrentStep("wallet");
  };

  // Handle OTP verification
  const handleOTPNext = async (otpData) => {
    console.log("OTP verified successfully:", otpData);
    actions.setOtpData({
      authToken: otpData.authToken || otpData.accessToken,
      verified: true,
    });

    // Fetch user details if needed
    try {
      if (otpData.authToken || otpData.accessToken) {
        const response = await getUserDetails(
          otpData.authToken || otpData.accessToken
        );
        actions.setUserDetails(response.data);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    }

    // Move to personal details step
    actions.setCurrentStep("personal-details");
  };

  const handleOTPBack = () => {
    actions.setCurrentStep("email");
  };

  // Handle Personal Details step
  const handlePersonalDetailsNext = (personalData) => {
    actions.setPersonalDetails(personalData);
    actions.setCurrentStep("address");
  };

  const handlePersonalDetailsBack = () => {
    actions.setCurrentStep("otp");
  };

  // Handle Address step
  const handleAddressNext = (addressData) => {
    actions.setAddressData(addressData);
    actions.setCurrentStep("purpose");
  };

  const handleAddressBack = () => {
    actions.setCurrentStep("personal-details");
  };

  // Handle Purpose step
  const handlePurposeNext = (purposeData) => {
    actions.setPurposeData(purposeData);
    actions.setCurrentStep("kyc-iframe");
  };

  const handlePurposeBack = () => {
    actions.setCurrentStep("address");
  };

  // Handle KYC iframe step
  const handleKYCNext = (kycData) => {
    console.log("KYC verification completed:", kycData);
    actions.setIdProofData(kycData);
    // Move to KYB form after KYC completion
    actions.setCurrentStep("kyb-form");
  };

  const handleKYCBack = () => {
    actions.setCurrentStep("purpose");
  };

  // Handle KYB form step
  const handleKYBNext = (kybData) => {
    console.log("KYB form completed:", kybData);
    // Here you can proceed to payment processing or show success
    alert(
      "KYB form submitted successfully! Your application is under review. Ready to proceed with payment."
    );
  };

  const handleKYBBack = () => {
    actions.setCurrentStep("kyc-iframe");
  };

  // Get minimum amount based on selected payment method
  const getMinAmountForPayment = () => {
    if (!selectedFiatCurrencyObj?.paymentOptions) {
      return 17; // Default minimum for EUR as shown in screenshot
    }

    const selectedPaymentOption = selectedFiatCurrencyObj.paymentOptions.find(
      (option) => option.id === selectedPayment
    );

    if (selectedPaymentOption?.minAmount) {
      return selectedPaymentOption.minAmount;
    }

    // Default minimum amounts by payment type
    const defaultMinAmounts = {
      sepa_bank_transfer: 17,
      pm_open_banking: 10,
      credit_debit_card: 50,
    };

    return defaultMinAmounts[selectedPayment] || 17;
  };

  // Check minimum amount validation
  const getMinAmountError = () => {
    const currentAmount = Number.parseFloat(fiatAmount) || 0;
    const minAmount = getMinAmountForPayment();

    if (currentAmount > 0 && currentAmount < minAmount) {
      return `Minimum buy amount should be more than or equal to ${minAmount}`;
    }

    return null;
  };

  const hasMinAmountError = getMinAmountError();

  // Calculate display values from quote
  const displayValues = useMemo(() => {
    if (!quote) {
      // Return empty/loading state instead of fallback calculations
      return {
        cryptoAmount: "0.00000000",
        totalFees: 0,
        feeBreakdown: [],
        conversionPrice: 0,
        pricePerCrypto: 0,
      };
    }

    // Filter out partner fees (trsk fee) from fee breakdown
    const filteredFeeBreakdown = (quote.feeBreakdown || []).filter(
      (fee) => fee.id !== "partner_fee"
    );

    // Calculate total fees excluding partner fees
    const filteredTotalFees = filteredFeeBreakdown.reduce(
      (sum, fee) => sum + (fee.value || 0),
      0
    );

    // Calculate price per 1 unit of crypto by inverting conversion price
    const pricePerCrypto = quote.conversionPrice
      ? 1 / quote.conversionPrice
      : 0;

    return {
      cryptoAmount: quote.cryptoAmount
        ? Number(quote.cryptoAmount).toFixed(8)
        : "0.00000000",
      totalFees: filteredTotalFees,
      feeBreakdown: filteredFeeBreakdown,
      conversionPrice: quote.conversionPrice || 0,
      pricePerCrypto: pricePerCrypto,
    };
  }, [quote]);

  return (
    <>
      {state.currentStep === "quote" && (
        <div className="w-full max-w-md mx-auto">
          <div className="w-[30rem] h-[80vh] bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Header with Buy title and menu */}
            <div className="flex items-center justify-between p-6 pb-4">
              <div className="flex gap-6">
                <h2 className="text-xl font-medium text-blue-600 border-b-2 border-blue-600 pb-1">
                  Buy
                </h2>
              </div>
            </div>

            <div className="px-6 pb-6 space-y-6">
              {/* You pay section */}
              <div className="space-y-3">
                {/* You pay section */}
                <div
                  className={`flex items-center rounded-lg overflow-hidden ${
                    hasMinAmountError ? "border-red-500 " : ""
                  }`}
                >
                  {/* Input side */}
                  <div className="flex-1 p-2 border-2 border-gey-300">
                    <span className="text-gray-500 text-sm block">You pay</span>
                    <input
                      type="number"
                      value={fiatAmount}
                      onChange={(e) => setFiatAmount(e.target.value)}
                      className={`w-full text-2xl font-light bg-transparent outline-none border-none placeholder:text-gray-400 ${
                        hasMinAmountError ? "text-red-600" : "text-gray-900"
                      }`}
                      placeholder="250"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  {/* Dropdown side */}
                  <div className="border-2 border-gray-300">
                    <FiatCurrencySelector
                      selectedCurrency={selectedFiatCurrency}
                      onCurrencyChange={handleFiatCurrencyChange}
                    />
                  </div>
                </div>

                {hasMinAmountError && (
                  <div className="text-sm text-red-500 mt-2 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {hasMinAmountError}
                  </div>
                )}
              </div>

              {/* Payment methods */}
              <PaymentMethodSelector
                selectedPayment={selectedPayment}
                onPaymentChange={handlePaymentChange}
                paymentOptions={selectedFiatCurrencyObj?.paymentOptions || []}
                showFees={showFees}
                onToggleFees={() => setShowFees(!showFees)}
                feeBreakdown={displayValues.feeBreakdown}
                totalFees={displayValues.totalFees}
                selectedFiatCurrency={selectedFiatCurrency}
                conversionRate={displayValues.pricePerCrypto}
                selectedCryptoSymbol={selectedCryptoData?.symbol || "ETH"}
              />

              {/* You receive section */}
              <div className="space-y-3">
                <div className="flex items-center rounded-lg overflow-hidden">
                  {/* Input side */}
                  <div className="flex-1 p-2 border-2 border-gray-300">
                    <span className="text-gray-500 text-sm block">
                      You receive (estimate)
                    </span>
                    <div className="text-2xl font-light text-gray-900">
                      {quoteLoading ? (
                        <span className="text-gray-400">Loading...</span>
                      ) : quoteError ? (
                        <span className="text-red-400">Error</span>
                      ) : quote ? (
                        displayValues.cryptoAmount
                      ) : (
                        <span className="text-gray-400">0.00000000</span>
                      )}
                      {quoteError && (
                        <span className="text-xs text-red-500 ml-2">
                          (API Error)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dropdown side */}
                  <div className="border-2 border-gray-300">
                    <CryptoCurrencySelector
                      selectedCurrency={selectedCryptoCurrency}
                      onCurrencyChange={setSelectedCryptoCurrency}
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleBuyNowClick}
                disabled={hasMinAmountError || !quote || quoteLoading}
                className={`w-full h-12 text-lg font-medium rounded-xl transition-colors ${
                  hasMinAmountError || !quote || quoteLoading
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {quoteLoading ? "Loading..." : "Buy Now"}
              </button>

              {/* Powered by Transak */}
              <div className="text-center">
                <span className="text-xs text-gray-500">Powered by </span>
                <span className="text-xs text-gray-600 font-medium">
                  Transak
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {state.currentStep === "wallet" && (
        <WalletAddressStep
          selectedCryptoData={selectedCryptoData}
          onBack={handleWalletBack}
          onNext={handleWalletNext}
          quote={quote}
          fiatAmount={fiatAmount}
          selectedFiatCurrency={selectedFiatCurrency}
        />
      )}

      {state.currentStep === "email" && (
        <EmailEntryStep onBack={handleEmailBack} onNext={handleEmailNext} />
      )}

      {state.currentStep === "otp" && (
        <OTPVerificationStep
          email={state.email.email}
          stateToken={state.email.stateToken}
          onBack={handleOTPBack}
          onNext={handleOTPNext}
        />
      )}

      {state.currentStep === "personal-details" && (
        <PersonalDetailsStep
          userDetails={state.userDetails}
          onBack={handlePersonalDetailsBack}
          onNext={handlePersonalDetailsNext}
        />
      )}

      {state.currentStep === "address" && (
        <AddressStep onBack={handleAddressBack} onNext={handleAddressNext} />
      )}

      {state.currentStep === "purpose" && (
        <PurposeStep onBack={handlePurposeBack} onNext={handlePurposeNext} />
      )}

      {state.currentStep === "kyc-iframe" && (
        <KYCIframeStep onBack={handleKYCBack} onNext={handleKYCNext} />
      )}

      {state.currentStep === "kyb-form" && (
        <KYBFormStep onBack={handleKYBBack} onNext={handleKYBNext} />
      )}
    </>
  );
}
