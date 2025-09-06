import { useState, useEffect, useMemo } from "react";
import { ChevronLeft } from "lucide-react";
import { useTransakState } from "../context/TransakContext.jsx";

export function PersonalDetailsStep({ userDetails, onBack, onNext }) {
  const { state, actions } = useTransakState();
  const { otp } = state;
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    mobileNumber: "",
    countryCode: "+91",
    day: "",
    month: "",
    year: "",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const months = useMemo(
    () => [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    []
  );

  // Pre-fill form with user details if available
  useEffect(() => {
    if (userDetails) {
      console.log("Pre-filling form with user details:", userDetails);

      setFormData((prev) => ({
        ...prev,
        firstName: userDetails.firstName || userDetails.first_name || "",
        lastName: userDetails.lastName || userDetails.last_name || "",
        mobileNumber:
          userDetails.mobileNumber ||
          userDetails.mobile_number ||
          userDetails.phone ||
          "",
        // Parse date of birth if available
        ...(userDetails.dateOfBirth || userDetails.date_of_birth
          ? (() => {
              const dob = new Date(
                userDetails.dateOfBirth || userDetails.date_of_birth
              );
              if (!isNaN(dob.getTime())) {
                return {
                  day: dob.getDate().toString(),
                  month: months[dob.getMonth()],
                  year: dob.getFullYear().toString(),
                };
              }
              return {};
            })()
          : {}),
      }));
    }
  }, [userDetails, months]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = "Mobile number is required";
    } else if (!/^\d{10}$/.test(formData.mobileNumber.replace(/\D/g, ""))) {
      newErrors.mobileNumber = "Please enter a valid mobile number";
    }

    if (!formData.day) {
      newErrors.day = "Day is required";
    }

    if (!formData.month) {
      newErrors.month = "Month is required";
    }

    if (!formData.year) {
      newErrors.year = "Year is required";
    }

    // Check if user is at least 18 years old
    if (formData.day && formData.month && formData.year) {
      const birthDate = new Date(
        parseInt(formData.year),
        months.indexOf(formData.month),
        parseInt(formData.day)
      );
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      if (age < 18) {
        newErrors.dateOfBirth = "You must be at least 18 years old";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Format the date of birth
      const dateOfBirth = `${String(formData.day).padStart(2, "0")}-${String(
        months.indexOf(formData.month) + 1
      ).padStart(2, "0")}-${formData.year}`;

      const personalDetails = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        mobileNumber: `${formData.countryCode}${formData.mobileNumber}`,
        dateOfBirth: dateOfBirth,
      };

      // Check if we have an access token
      if (otp.authToken) {
        try {
          console.log("Updating KYC user with personal details...");

          // For now, we'll store personal details and update KYC in the address step
          // when we have both personal and address details
          console.log("Personal details stored for later KYC update");

          // Mark personal details as submitted
          actions.setKYCPersonalSubmitted(true);
        } catch (apiError) {
          console.error("Error updating KYC user:", apiError);
          // Continue with the flow even if API call fails, for demo purposes
          console.log("Continuing with demo flow despite API error");
        }
      }

      // Store personal details in context
      actions.setPersonalDetails(personalDetails);

      onNext(personalDetails);
    } catch (error) {
      console.error("Error submitting personal details:", error);
      setErrors({
        submit: "Failed to submit personal details. Please try again.",
      });
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
            Personal Details
          </h2>
          <div className="w-9 h-9" /> {/* Spacer for centering */}
        </div>

        <div className="px-6 py-6 space-y-6 overflow-y-auto">
          {/* Progress indicator */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <div className="h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-blue-600 rounded-full"
                  style={{ width: "25%" }}
                ></div>
              </div>
            </div>
            <div className="ml-4">
              <span className="text-sm text-gray-500">KYC STEP 1/4</span>
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

          {/* Instructions */}
          <p className="text-gray-600 text-sm mb-6">
            Please enter your personal details as they appear on official
            documents.
          </p>

          {/* Name fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                className={`w-full p-3 bg-gray-100 rounded-lg border-0 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.firstName ? "ring-2 ring-red-500" : ""
                }`}
                placeholder="First Name"
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                className={`w-full p-3 bg-gray-100 rounded-lg border-0 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.lastName ? "ring-2 ring-red-500" : ""
                }`}
                placeholder="Last Name"
              />
              {errors.lastName && (
                <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mobile Number
            </label>
            <div
              className={`flex bg-gray-100 rounded-lg focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500 transition-all ${
                errors.mobileNumber ? "ring-2 ring-red-500" : ""
              }`}
            >
              <div className="flex items-center px-3 border-r border-gray-300">
                <span className="text-lg mr-1">🇮🇳</span>
                <select
                  value={formData.countryCode}
                  onChange={(e) =>
                    handleInputChange("countryCode", e.target.value)
                  }
                  className="bg-transparent border-0 focus:ring-0 text-sm"
                >
                  <option value="+91">+91</option>
                  <option value="+1">+1</option>
                  <option value="+44">+44</option>
                </select>
              </div>
              <input
                type="tel"
                value={formData.mobileNumber}
                onChange={(e) =>
                  handleInputChange("mobileNumber", e.target.value)
                }
                className="flex-1 p-3 bg-transparent border-0 focus:ring-0"
                placeholder="85112-91978"
              />
            </div>
            {errors.mobileNumber && (
              <p className="text-red-500 text-xs mt-1">{errors.mobileNumber}</p>
            )}
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Of Birth
            </label>
            <div className="grid grid-cols-3 gap-3">
              <select
                value={formData.day}
                onChange={(e) => handleInputChange("day", e.target.value)}
                className={`p-3 bg-gray-100 rounded-lg border-0 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.day ? "ring-2 ring-red-500" : ""
                }`}
              >
                <option value="">Day</option>
                {days.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
              <select
                value={formData.month}
                onChange={(e) => handleInputChange("month", e.target.value)}
                className={`p-3 bg-gray-100 rounded-lg border-0 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.month ? "ring-2 ring-red-500" : ""
                }`}
              >
                <option value="">Month</option>
                {months.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                value={formData.year}
                onChange={(e) => handleInputChange("year", e.target.value)}
                className={`p-3 bg-gray-100 rounded-lg border-0 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.year ? "ring-2 ring-red-500" : ""
                }`}
              >
                <option value="">Year</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            {(errors.day ||
              errors.month ||
              errors.year ||
              errors.dateOfBirth) && (
              <p className="text-red-500 text-xs mt-1">
                {errors.dateOfBirth || "Please select a valid date of birth"}
              </p>
            )}
          </div>

          {errors.submit && (
            <div className="text-red-500 text-sm text-center">
              {errors.submit}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100">
          <button
            onClick={handleContinue}
            disabled={isLoading}
            className={`w-full h-12 text-lg font-medium rounded-xl transition-colors ${
              isLoading
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
