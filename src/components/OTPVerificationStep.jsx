import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { verifyEmailOTP, sendEmailOTP, getUserDetails } from "../api/index.js";

export function OTPVerificationStep({ email, stateToken, onBack, onNext }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [currentStateToken, setCurrentStateToken] = useState(stateToken);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const inputRefs = useRef([]);

  // Timer countdown effect
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleOtpChange = (index, value) => {
    // Only allow single digit
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Clear error when user starts typing
    if (otpError && value) {
      setOtpError("");
    }

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled and terms are accepted
    if (
      index === 5 &&
      value &&
      newOtp.every((digit) => digit !== "") &&
      termsAccepted
    ) {
      // Add a small delay to show the complete OTP before verification
      setTimeout(() => handleVerifyOtp(newOtp.join("")), 200);
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "");
    if (pastedData.length === 6) {
      const newOtp = pastedData.split("");
      setOtp(newOtp);
      setOtpError("");
      // Auto-submit after paste only if terms are accepted
      if (termsAccepted) {
        setTimeout(() => handleVerifyOtp(pastedData), 100);
      }
    }
  };

  const handleVerifyOtp = async (otpCode = null) => {
    const codeToVerify = otpCode || otp.join("");

    if (codeToVerify.length !== 6) {
      setOtpError("Please enter the complete verification code");
      return;
    }

    if (!termsAccepted) {
      setOtpError(
        "Please accept the Terms of Use and Privacy Policy to continue"
      );
      return;
    }

    setIsVerifying(true);
    setOtpError("");

    try {
      // Debug: Log the parameters being sent
      console.log("OTP Verification Parameters:", {
        otp: codeToVerify,
        stateToken: currentStateToken,
        email: email,
      });

      // Call the actual OTP verification API with email parameter
      const response = await verifyEmailOTP(
        codeToVerify,
        currentStateToken,
        email
      );

      console.log("OTP Verification Response:", response);

      // Strict validation - only proceed if verification was explicitly successful
      if (response && response.success === true && response.data) {
        // Extract access token from response - try multiple possible field names
        const accessToken =
          response.data.accessToken ||
          response.data.authorization ||
          response.data.data?.accessToken ||
          response.data.data?.authorization;

        console.log("Extracted access token:", accessToken);

        if (accessToken) {
          console.log("OTP verified successfully, fetching user details...");

          try {
            // Fetch user details using the access token
            const userDetailsResponse = await getUserDetails(accessToken);

            if (userDetailsResponse.success) {
              console.log("User details fetched:", userDetailsResponse.data);

              // Pass both verification response and user details to parent component
              console.log("CALLING onNext - OTP verification successful");
              onNext(codeToVerify, {
                ...response,
                accessToken: accessToken,
                userDetails: userDetailsResponse.data,
              });
              return; // Successfully processed, exit function
            } else {
              // If user details fetch fails, still proceed with just the auth token
              console.warn(
                "Failed to fetch user details, proceeding with auth token only"
              );
              console.log(
                "CALLING onNext - OTP verification successful (no user details)"
              );
              onNext(codeToVerify, {
                ...response,
                accessToken: accessToken,
              });
              return; // Successfully processed, exit function
            }
          } catch (userDetailsError) {
            console.warn("Error fetching user details:", userDetailsError);
            // Still proceed with verification success even if user details fail
            console.log(
              "CALLING onNext - OTP verification successful (user details error)"
            );
            onNext(codeToVerify, {
              ...response,
              accessToken: accessToken,
            });
            return; // Successfully processed, exit function
          }
        } else {
          console.error("No access token in verification response");
          setOtpError(
            "Verification successful but missing access token. Please try again."
          );
          return; // Stop here, don't proceed
        }
      } else {
        // Verification failed - show error and don't proceed
        console.error("OTP verification failed:", response);
        setOtpError("Invalid verification code. Please try again.");
        // Clear the OTP fields so user can retry
        setOtp(["", "", "", "", "", ""]);
        // Focus back to first input
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
        return; // Stop here, don't proceed
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        status: error.status,
        data: error.data,
        stack: error.stack,
      });

      // Handle ApiError with structured response data
      if (error.data && error.data.error) {
        // This is the case where API returns {"error":{"statusCode":400,"message":"Invalid OTP","errorCode":1007}}
        const apiError = error.data.error;
        console.log("API Error Response:", apiError);
        setOtpError(
          apiError.message || "Invalid verification code. Please try again."
        );
      } else if (error.status === 400) {
        // Handle other 400 errors
        setOtpError("Invalid verification code. Please try again.");
      } else if (error.response && error.response.status) {
        setOtpError(
          `Verification failed (${error.response.status}): ${
            error.response.data?.message || "Invalid verification code"
          }`
        );
      } else {
        setOtpError(
          error.message || "Invalid verification code. Please try again."
        );
      }

      // Clear the OTP fields so user can retry
      setOtp(["", "", "", "", "", ""]);
      // Focus back to first input
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
      return; // Stop here, don't proceed
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;

    try {
      // Call the API to resend OTP
      const response = await sendEmailOTP(email);

      if (response.success) {
        // Update the state token with the new one from resend
        setCurrentStateToken(response.stateToken);

        // Reset timer and state
        setResendTimer(60);
        setCanResend(false);
        setOtpError("");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        setOtpError("Failed to resend code. Please try again.");
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      setOtpError(error.message || "Failed to resend code. Please try again.");
    }
  };

  const isOtpComplete = otp.every((digit) => digit !== "");
  const canContinue = isOtpComplete && termsAccepted;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="w-[30rem] h-[80vh] bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-4 p-6 border-b border-gray-200">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isVerifying}
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h2 className="text-xl font-medium text-gray-900">
            Verify Your Email
          </h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700">
              You will receive a verification code at{" "}
              <span className="font-medium text-gray-900">{email}</span>. Check
              your spam folder in case you cannot find it in your inbox.
            </p>
          </div>

          {/* OTP Input */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Verification Code
            </label>

            <div className="flex gap-3 justify-center">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) =>
                    handleOtpChange(index, e.target.value.replace(/\D/g, ""))
                  }
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className={`w-12 h-12 text-center text-xl font-medium border-2 rounded-lg outline-none transition-colors ${
                    otpError
                      ? "border-red-500 bg-red-50"
                      : digit
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 focus:border-blue-500"
                  }`}
                  disabled={isVerifying}
                />
              ))}
            </div>

            {/* Error Message */}
            {otpError && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg text-center">
                {otpError}
              </div>
            )}
          </div>

          {/* Terms Agreement */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms-checkbox"
                checked={termsAccepted}
                onChange={(e) => {
                  setTermsAccepted(e.target.checked);
                  // Clear error when user accepts terms
                  if (e.target.checked && otpError.includes("Terms of Use")) {
                    setOtpError("");
                  }
                }}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={isVerifying}
              />
              <label
                htmlFor="terms-checkbox"
                className="text-sm text-gray-600 cursor-pointer"
              >
                I agree with Transak's{" "}
                <button
                  type="button"
                  className="text-blue-600 hover:underline"
                  onClick={() =>
                    window.open("https://transak.com/terms-of-use", "_blank")
                  }
                >
                  Terms of Use
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  className="text-blue-600 hover:underline"
                  onClick={() =>
                    window.open("https://transak.com/privacy-policy", "_blank")
                  }
                >
                  Privacy Policy
                </button>
                .
              </label>
            </div>
          </div>

          {/* Continue Button */}
          <button
            onClick={() => handleVerifyOtp()}
            disabled={!canContinue || isVerifying}
            className={`w-full h-12 text-lg font-medium rounded-xl transition-colors ${
              !canContinue || isVerifying
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {isVerifying ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Verifying...
              </div>
            ) : (
              "Continue"
            )}
          </button>

          {/* Resend OTP */}
          <div className="text-center">
            {canResend ? (
              <button
                onClick={handleResendOtp}
                className="text-blue-600 hover:underline text-sm"
              >
                Resend verification code
              </button>
            ) : (
              <p className="text-sm text-gray-500">
                Resend code in {resendTimer}s
              </p>
            )}
          </div>
        </div>

        {/* Powered by Transak */}
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <span className="text-xs text-gray-500">Powered by </span>
          <span className="text-xs text-gray-600 font-medium">Transak</span>
        </div>
      </div>
    </div>
  );
}
