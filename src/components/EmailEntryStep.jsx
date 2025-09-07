import { useState } from "react";
import { ArrowLeft, Mail, Loader2 } from "lucide-react";
import { sendEmailOTP } from "../api/index.js";
import { TransakFooter } from "./TransakFooter.jsx";

export function EmailEntryStep({ onBack, onNext }) {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (emailValue) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);

    if (emailError && value) {
      setEmailError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setEmailError("Please enter your email address");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setEmailError("");

    try {
      // Send OTP to email using the API
      const response = await sendEmailOTP(email.trim());

      if (response.success) {
        // Pass the email and state token to the OTP verification step
        onNext(email.trim(), response.stateToken, response.expiresIn);
      } else {
        setEmailError("Failed to send OTP. Please try again.");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      setEmailError(error.message || "Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="w-[30rem] h-[80vh] bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 p-6 border-b border-gray-200">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h2 className="text-xl font-medium text-gray-900">
            Enter Your Email
          </h2>
        </div>

        <div className="p-6 flex-1 flex flex-col justify-between">
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="Enter email"
                    className={`w-full pl-12 pr-4 py-4 border-2 rounded-lg outline-none transition-colors ${
                      emailError
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200 focus:border-blue-500"
                    }`}
                  />
                </div>

                {/* Error Message */}
                {emailError && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                    {emailError}
                  </div>
                )}
              </div>

              {/* Continue Button */}
              <button
                type="submit"
                disabled={!email.trim() || isLoading}
                className={`w-full h-12 text-lg font-medium rounded-xl transition-colors flex items-center justify-center gap-2 ${
                  !email.trim() || isLoading
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  "Continue"
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
