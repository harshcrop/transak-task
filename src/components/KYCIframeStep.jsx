import { useState, useEffect } from "react";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { useTransakState } from "../context/TransakContext.jsx";

export function KYCIframeStep({ onBack, onNext }) {
  const { state } = useTransakState();
  const { kycProcess } = state;
  const [isLoading, setIsLoading] = useState(true);
  const [kycUrl, setKycUrl] = useState(null);

  useEffect(() => {
    console.log("KYC Requirements received:", kycProcess.requirements);

    // Extract KYC URL from requirements
    if (kycProcess.requirements && kycProcess.requirements.formsRequired) {
      const idProofForm = kycProcess.requirements.formsRequired.find(
        (form) => form.type === "IDPROOF"
      );

      if (idProofForm && idProofForm.metadata) {
        const urlFromMeta =
          idProofForm.metadata.kycUrl || idProofForm.metadata.kycurl;
        if (urlFromMeta) {
          setKycUrl(urlFromMeta);
          console.log("KYC URL found:", urlFromMeta);
        } else {
          console.error(
            "No KYC URL found in IDPROOF metadata:",
            idProofForm.metadata
          );
        }
      } else {
        console.error(
          "No IDPROOF form found in requirements:",
          kycProcess.requirements.formsRequired
        );
      }
    } else {
      console.error(
        "No KYC requirements found. Current requirements:",
        kycProcess.requirements
      );

      // If no requirements are available yet, we should wait for them to be fetched
      if (!kycProcess.requirementsFetched) {
        console.log("KYC requirements not yet fetched, waiting...");
      }
    }
  }, [kycProcess.requirements, kycProcess.requirementsFetched]);

  const handleIframeLoad = () => {
    setIsLoading(false);
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

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="w-full h-[90vh] bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100 bg-white relative z-10">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-xl font-medium text-gray-900">
            Identity Verification
          </h2>
          <div className="w-9 h-9" /> {/* Spacer for centering */}
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex-1">
            <div className="h-2 bg-gray-200 rounded-full">
              <div
                className="h-2 bg-blue-600 rounded-full"
                style={{ width: "100%" }}
              ></div>
            </div>
          </div>
          <div className="ml-4">
            <span className="text-sm text-gray-500">KYC STEP 4/4</span>
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

        {/* Main content */}
        <div className="relative flex-1 h-[calc(90vh-12rem)]">
          {/* Show loading if requirements are being fetched */}
          {!kycProcess.requirementsFetched ? (
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

              {/* KYC iframe */}
              <iframe
                src={kycUrl}
                className="w-full h-full border-0"
                title="KYC Verification"
                onLoad={handleIframeLoad}
                allow="camera; microphone; geolocation"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
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
                  KYC Requirements Unavailable
                </h3>
                <p className="text-gray-600 mb-4">
                  We couldn't retrieve the KYC verification requirements. Please
                  try going back and completing the previous step again.
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
        {kycUrl && (
          <div className="p-6 border-t border-gray-100 bg-white">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <p>Complete the verification process in the frame above</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.open(kycUrl, "_blank")}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in New Tab
                </button>
                <button
                  onClick={handleComplete}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  I've Completed Verification
                </button>
              </div>
            </div>

            {/* Powered by Transak */}
            <div className="text-center mt-4">
              <span className="text-xs text-gray-500">Powered by </span>
              <span className="text-xs text-gray-600 font-medium">Transak</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
