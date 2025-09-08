import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useTransakState } from "../context/TransakContext.jsx";
import {
  submitPurposeOfUsage,
  getKYCRequirements,
  getKYCAdditionalRequirements,
} from "../api/index.js";
import { TransakFooter } from "./TransakFooter.jsx";

const purposeOptions = [
  {
    id: "investments",
    title: "Buying/selling crypto for investments",
    description: "For long-term holding or portfolio diversification",
  },
  {
    id: "nfts",
    title: "Buying NFTs",
    description: "For collecting or trading non-fungible tokens",
  },
  {
    id: "web3",
    title: "Buying crypto to use a web3 protocol",
    description: "For DeFi, gaming, or other decentralized applications",
  },
];

export function PurposeStep({
  onBack,
  onNext,
  initialPurpose = "investments",
}) {
  const { state, actions } = useTransakState();
  const { otp, quote } = state;
  const [selectedPurpose, setSelectedPurpose] = useState(initialPurpose);
  const [isLoading, setIsLoading] = useState(false);

  console.log("PurposeStep - Current quote state:", quote);

  // Test function to manually trigger additional requirements API
  const testAdditionalRequirements = async () => {
    console.log("🧪 Testing additional requirements API...");
    try {
      if (!otp.authToken || !quote?.quote?.quoteId) {
        console.log("❌ Missing required data:", {
          hasToken: !!otp.authToken,
          hasQuoteId: !!quote?.quote?.quoteId,
        });
        return;
      }

      const response = await getKYCAdditionalRequirements(
        otp.authToken,
        quote.quote.quoteId
      );
      console.log("✅ Test response:", response);

      // Store the response in context for testing
      const responseData = response.data || response;
      if (responseData) {
        const extractedKycUrl =
          responseData?.formsRequired?.[0]?.metadata?.kycUrl;
        console.log("🔗 Test extracted KYC URL:", extractedKycUrl);
        actions.setKYCAdditionalRequirements(responseData);
        console.log("✅ Test data stored in context");
      }
    } catch (error) {
      console.error("❌ Test error:", error);
    }
  };

  const handleContinue = async () => {
    if (!selectedPurpose) return;

    console.log("🚀 handleContinue started");
    setIsLoading(true);

    const selectedOption = purposeOptions.find(
      (option) => option.id === selectedPurpose
    );
    console.log("📝 Selected option:", selectedOption);

    try {
      // Submit purpose of usage to API
      if (otp.authToken) {
        console.log("🔑 Auth token available, starting API calls");
        try {
          console.log("📤 Submitting purpose of usage...");

          const purposeList = [selectedOption?.title];
          const response = await submitPurposeOfUsage(
            otp.authToken,
            purposeList
          );
          console.log("✅ Purpose of usage response:", response);

          // Mark purpose as submitted
          actions.setKYCPurposeSubmitted(true);
          console.log("✅ Purpose marked as submitted");

          // Fetch KYC requirements if we have a quote
          if (quote?.quote?.quoteId) {
            console.log("📊 Quote ID available:", quote.quote.quoteId);
            try {
              console.log(
                "📤 Fetching KYC requirements with quote ID:",
                quote.quote.quoteId
              );
              const kycResponse = await getKYCRequirements(
                otp.authToken,
                quote.quote.quoteId
              );
              testAdditionalRequirements();
              console.log("✅ KYC requirements response:", kycResponse);

              // Store KYC requirements - handle both response formats
              const kycData = kycResponse.data || kycResponse;

              // Check if we received valid KYC requirements
              if (kycData && kycData.formsRequired) {
                console.log("✅ Valid KYC requirements found, storing...");
                actions.setKYCRequirements(kycData);

                // After successfully getting KYC requirements, fetch additional requirements
                console.log("🔍 Now fetching additional requirements...");
                try {
                  console.log(
                    "🔍 Starting to fetch KYC additional requirements with quote ID:",
                    quote.quote.quoteId
                  );
                  console.log(
                    "🔑 Using auth token:",
                    otp.authToken ? "✅ Present" : "❌ Missing"
                  );

                  const additionalRequirementsResponse =
                    await getKYCAdditionalRequirements(
                      otp.authToken,
                      quote.quote.quoteId
                    );
                  console.log(
                    "✅ KYC additional requirements response:",
                    additionalRequirementsResponse
                  );

                  // Store additional requirements - handle both response formats
                  const additionalRequirementsData =
                    additionalRequirementsResponse.data ||
                    additionalRequirementsResponse;

                  // Check if we received valid additional requirements
                  if (additionalRequirementsData) {
                    // Extract and log the kycUrl before storing
                    const extractedKycUrl =
                      additionalRequirementsData?.formsRequired?.[0]?.metadata
                        ?.kycUrl;
                    console.log("🔗 Extracted KYC URL:", extractedKycUrl);

                    actions.setKYCAdditionalRequirements(
                      additionalRequirementsData
                    );
                    console.log(
                      "✅ KYC additional requirements stored successfully:",
                      additionalRequirementsData
                    );
                    console.log(
                      "🎯 KYC URL should now be available in context"
                    );
                  } else {
                    console.error(
                      "❌ Invalid KYC additional requirements response:",
                      additionalRequirementsData
                    );
                  }
                } catch (additionalRequirementsError) {
                  console.error(
                    "❌ Error fetching KYC additional requirements:",
                    additionalRequirementsError
                  );
                  console.error("❌ Error details:", {
                    message: additionalRequirementsError.message,
                    status: additionalRequirementsError.status,
                    data: additionalRequirementsError.data,
                  });
                  // Don't throw here - additional requirements might be optional
                }
              } else {
                console.error("❌ Invalid KYC requirements response:", kycData);
                throw new Error("Invalid KYC requirements response");
              }
            } catch (kycError) {
              console.error("❌ Error fetching KYC requirements:", kycError);
              // Re-throw the error to handle it properly
              throw kycError;
            }
          } else {
            console.warn(
              "❌ No quote ID available for KYC requirements. Quote:",
              quote
            );
            throw new Error("No quote ID available for KYC requirements");
          }
        } catch (apiError) {
          console.error("❌ Error in API calls section:", apiError);
          // Don't re-throw the error - we still want to proceed to next step
          console.log("⚠️ Proceeding to next step despite API errors");
        }
      } else {
        console.warn("❌ No auth token available");
      }

      console.log("✅ All processing completed, proceeding to next step");
      onNext({
        purposeId: selectedPurpose,
        purposeTitle: selectedOption?.title,
        purposeDescription: selectedOption?.description,
      });
    } catch (error) {
      console.error("❌ Error in handleContinue:", error);
      // Even if there's an error, we should still try to proceed
      console.log("⚠️ Attempting to proceed despite errors");
      onNext({
        purposeId: selectedPurpose,
        purposeTitle: selectedOption?.title,
        purposeDescription: selectedOption?.description,
      });
    } finally {
      setIsLoading(false);
      console.log("🏁 handleContinue finished");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="w-[30rem] h-[80vh] bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-xl font-medium text-gray-900">
            Purpose of Transak
          </h2>
          <div className="w-9 h-9" /> {/* Spacer for centering */}
        </div>

        <div className="px-6 py-6 space-y-6 overflow-y-auto flex-1">
          {/* Progress indicator */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-blue-600 rounded-full"
                  style={{ width: "75%" }}
                ></div>
              </div>
            </div>
            <div className="w-4 h-4 bg-gray-500 rounded-full flex items-center justify-center ml-auto mt-1">
              <svg
                className="w-3 h-3 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
          <div className="flex justify-end -mt-4">
            <span className="text-sm text-gray-600 font-medium">
              KYC STEP 1/4
            </span>
          </div>

          {/* Question */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              What's Your Purpose For Using Transak?
            </h3>
          </div>

          {/* Purpose Options */}
          <div className="space-y-4">
            {purposeOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedPurpose(option.id)}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  selectedPurpose === option.id
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedPurpose === option.id
                            ? "border-blue-600 bg-blue-600"
                            : "border-gray-300"
                        }`}
                      >
                        {selectedPurpose === option.id && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {option.title}
                        </h4>
                        {option.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {option.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100">
          {/* Test button for debugging */}
          {/* <button
            onClick={testAdditionalRequirements}
            className="w-full mb-2 h-8 text-sm bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
          >
            🧪 Test Additional Requirements API
          </button> */}

          <button
            onClick={handleContinue}
            disabled={!selectedPurpose || isLoading}
            className={`w-full h-12 text-lg font-medium rounded-xl transition-colors ${
              !selectedPurpose || isLoading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {isLoading ? "Loading..." : "Continue"}
          </button>

          {/* Powered by Transak */}
          <TransakFooter className="text-center mt-4" />
        </div>
      </div>
    </div>
  );
}
