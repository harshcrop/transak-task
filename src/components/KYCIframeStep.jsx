import { useState, useEffect } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useTransakState } from "../context/TransakContext.jsx";
import { TransakFooter } from "./TransakFooter.jsx";
import { KYBFormStep } from "./KYBFormStep.jsx";

export function KYCIframeStep({ onBack, onNext }) {
  // TEST FLAG: Set to true to load KYB form instead of KYC iframe for testing
  const TEST_LOAD_KYB_INSTEAD_OF_KYC = false;

  const { state } = useTransakState();
  const [isLoading, setIsLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);

  // Get KYC URL directly from context
  const kycUrl = state.kycProcess.kycUrl;
  const additionalRequirementsFetched =
    state.kycProcess.additionalRequirementsFetched;
  const additionalRequirements = state.kycProcess.additionalRequirements;

  useEffect(() => {
    console.log("🎯 KYC Iframe Step - Context State:", {
      kycUrl,
      additionalRequirementsFetched,
      hasAdditionalRequirements: !!additionalRequirements,
      additionalRequirements: additionalRequirements,
    });

    if (kycUrl) {
      console.log("✅ KYC URL available in iframe component:", kycUrl);
      // Test URL accessibility
      console.log("🔗 KYC URL details:", {
        url: kycUrl,
        domain: new URL(kycUrl).hostname,
        protocol: new URL(kycUrl).protocol,
      });
    } else {
      console.log("❌ No KYC URL available in iframe component");
      console.log("🔍 Debug additional requirements:", additionalRequirements);
    }
  }, [kycUrl, additionalRequirementsFetched, additionalRequirements]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setIframeError(false);
  };

  const handleIframeError = () => {
    console.error("❌ Iframe failed to load KYC URL:", kycUrl);
    setIsLoading(false);
    setIframeError(true);
  };

  const openInNewWindow = () => {
    if (kycUrl) {
      window.open(kycUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleComplete = () => {
    // For now, just complete the flow
    // In a real implementation, you might want to listen for messages from the iframe
    onNext({
      kycCompleted: true,
      kycUrl: kycUrl,
      timestamp: new Date().toISOString(),
    });
  };

  // Handle KYB form completion when testing with KYB instead of KYC
  const handleKYBNext = (kybData) => {
    console.log("KYB form completed in KYC step:", kybData);
    // Complete the KYC step with KYB data
    onNext({
      kycCompleted: true,
      kybCompleted: true,
      kybData: kybData,
      timestamp: new Date().toISOString(),
    });
  };

  // If test flag is enabled, render KYB form instead of KYC iframe
  if (TEST_LOAD_KYB_INSTEAD_OF_KYC) {
    return <KYBFormStep onBack={onBack} onNext={handleKYBNext} />;
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="w-[30rem] h-[80vh] bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100 bg-white relative z-10">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-xl font-medium text-gray-900">
            Identity Verification
          </h2>
          <div className="w-9 h-9" /> {/* Spacer for centering */}
        </div>

        {/* Progress indicator section */}
        <div className="px-6 py-4 bg-white">
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex-1">
              <div className="h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: "100%" }}
                ></div>
              </div>
            </div>
            <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
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
          <div className="flex justify-end">
            <span className="text-sm text-gray-600 font-medium">
              KYC STEP 4/4
            </span>
          </div>
        </div>

        {/* Main content */}
        <div className="relative" style={{ height: "calc(100vh - 22rem)" }}>
          {/* Show loading if additional requirements are not yet fetched */}
          {!additionalRequirementsFetched ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Fetching KYC requirements...</p>
                <p className="text-gray-500 text-sm mt-2">
                  Please wait while we prepare your verification
                </p>
              </div>
            </div>
          ) : kycUrl ? (
            <>
              {/* Loading overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-gray-50 flex items-center justify-center z-10">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading KYC verification...</p>
                  </div>
                </div>
              )}

              {/* Iframe error fallback */}
              {iframeError && (
                <div className="absolute inset-0 bg-gray-50 flex items-center justify-center z-10">
                  <div className="text-center p-8">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ExternalLink className="w-8 h-8 text-yellow-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Iframe Loading Issue
                    </h3>
                    <p className="text-gray-600 mb-4">
                      The verification page couldn't load in this window. You
                      can open it in a new tab to continue.
                    </p>
                    <button
                      onClick={openInNewWindow}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mr-2"
                    >
                      Open in New Tab
                    </button>
                    <button
                      onClick={handleComplete}
                      className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Continue Without Verification
                    </button>
                  </div>
                </div>
              )}

              {/* KYC iframe */}
              <iframe
                src={kycUrl}
                className="w-full h-full border-0"
                title="KYC Verification"
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                allow="camera; microphone; geolocation; autoplay; encrypted-media; fullscreen"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation allow-modals allow-orientation-lock allow-popups-to-escape-sandbox"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </>
          ) : (
            /* No KYC URL available - show error state */
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-red-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  KYC URL Unavailable
                </h3>
                <p className="text-gray-600 mb-4">
                  We couldn't retrieve the KYC verification URL from the
                  additional requirements. Please try going back and completing
                  the previous step again.
                </p>
                <button
                  onClick={onBack}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors mr-2"
                >
                  Go Back
                </button>
                <button
                  onClick={handleComplete}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Skip for Demo
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer - only show if KYC URL is available */}

        {/* Footer for other states */}
        {!kycUrl && (
          <div className="p-6 border-t border-gray-100 bg-white">
            <TransakFooter className="text-center" />
          </div>
        )}
      </div>
    </div>
  );
}
