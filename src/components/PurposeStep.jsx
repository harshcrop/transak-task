import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useTransakState } from "../context/TransakContext.jsx";
import { submitPurposeOfUsage, getKYCRequirements } from "../api/index.js";

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

  const handleContinue = async () => {
    if (!selectedPurpose) return;

    setIsLoading(true);
    try {
      const selectedOption = purposeOptions.find(
        (option) => option.id === selectedPurpose
      );

      // Submit purpose of usage to API
      if (otp.authToken) {
        try {
          console.log("Submitting purpose of usage...");

          const purposeList = [selectedOption?.title];
          const response = await submitPurposeOfUsage(
            otp.authToken,
            purposeList
          );
          console.log("Purpose of usage response:", response);

          // Mark purpose as submitted
          actions.setKYCPurposeSubmitted(true);

          // Fetch KYC requirements if we have a quote
          if (quote?.quote?.quoteId) {
            try {
              console.log(
                "Fetching KYC requirements with quote ID:",
                quote.quote.quoteId
              );
              const kycResponse = await getKYCRequirements(
                otp.authToken,
                quote.quote.quoteId
              );
              console.log("KYC requirements response:", kycResponse);

              // Store KYC requirements - handle both response formats
              const kycData = kycResponse.data || kycResponse;

              // Mock KYC requirements response for demo if API returns empty
              if (!kycData || !kycData.formsRequired) {
                console.log("Using mock KYC requirements for demo");
                const mockKycData = {
                  formsRequired: [
                    {
                      type: "IDPROOF",
                      metadata: {
                        options: [],
                        documentProofOptions: [],
                        expiresAt: "Sat, 20 Sep 2025 16:13:39 GMT",
                        kycUrl:
                          "https://eu.onfido.app/l/9372b88c-21f3-41a2-b496-9bec80e0de1a",
                        workFlowRunId: "9372b88c-21f3-41a2-b496-9bec80e0de1a",
                      },
                    },
                  ],
                };
                actions.setKYCRequirements(mockKycData);
              } else {
                actions.setKYCRequirements(kycData);
              }
            } catch (kycError) {
              console.error("Error fetching KYC requirements:", kycError);
              // Use mock data for demo purposes
              console.log("Using mock KYC requirements due to API error");
              const mockKycData = {
                formsRequired: [
                  {
                    type: "IDPROOF",
                    metadata: {
                      options: [],
                      documentProofOptions: [],
                      expiresAt: "Sat, 20 Sep 2025 16:13:39 GMT",
                      kycUrl:
                        "https://eu.onfido.app/l/9372b88c-21f3-41a2-b496-9bec80e0de1a",
                      workFlowRunId: "9372b88c-21f3-41a2-b496-9bec80e0de1a",
                    },
                  },
                ],
              };
              actions.setKYCRequirements(mockKycData);
            }
          } else {
            console.warn(
              "No quote ID available for KYC requirements. Quote:",
              quote
            );
            // Use mock data for demo purposes when no quote ID is available
            console.log("Using mock KYC requirements due to missing quote ID");
            const mockKycData = {
              formsRequired: [
                {
                  type: "IDPROOF",
                  metadata: {
                    options: [],
                    documentProofOptions: [],
                    expiresAt: "Sat, 20 Sep 2025 16:13:39 GMT",
                    kycUrl:
                      "https://eu.onfido.app/l/9372b88c-21f3-41a2-b496-9bec80e0de1a",
                    workFlowRunId: "9372b88c-21f3-41a2-b496-9bec80e0de1a",
                  },
                },
              ],
            };
            actions.setKYCRequirements(mockKycData);
          }
        } catch (apiError) {
          console.error("Error submitting purpose of usage:", apiError);
          // Continue with the flow even if API call fails, for demo purposes
          console.log("Continuing with demo flow despite API error");
        }
      }

      onNext({
        purposeId: selectedPurpose,
        purposeTitle: selectedOption?.title,
        purposeDescription: selectedOption?.description,
      });
    } catch (error) {
      console.error("Error submitting purpose:", error);
    } finally {
      setIsLoading(false);
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <div className="h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-blue-600 rounded-full"
                  style={{ width: "75%" }}
                ></div>
              </div>
            </div>
            <div className="ml-4">
              <span className="text-sm text-gray-500">KYC STEP 3/4</span>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center ml-auto mt-1">
                <svg
                  className="w-5 h-5 text-green-600"
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
          <div className="text-center mt-4">
            <span className="text-xs text-gray-500">Powered by </span>
            <span className="text-xs text-gray-600 font-medium">Transak</span>
          </div>
        </div>
      </div>
    </div>
  );
}
