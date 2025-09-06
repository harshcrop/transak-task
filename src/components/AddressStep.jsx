import { useState, useEffect, useRef } from "react";
import { ChevronLeft, MapPin } from "lucide-react";
import { useTransakState } from "../context/TransakContext.jsx";
import { updateKYCUser } from "../api/index.js";

// Mock address suggestions (in real app, this would be from a geocoding API)
const mockAddressSuggestions = [
  {
    id: 1,
    name: "Apple Woods",
    fullAddress: "Galleria Mall Service Road, Ahmedabad, Gujarat, India",
    city: "Ahmedabad",
    state: "Gujarat",
    country: "India",
    postalCode: "380057",
  },
  {
    id: 2,
    name: "Applewood",
    fullAddress:
      "Heights Secondary School Bloor Street, Mississauga, ON, Canada",
    city: "Mississauga",
    state: "Ontario",
    country: "Canada",
    postalCode: "L4Y 2N7",
  },
  {
    id: 3,
    name: "Applewood",
    fullAddress: "Golf Course West 32nd Avenue, Golden, CO, USA",
    city: "Golden",
    state: "Colorado",
    country: "USA",
    postalCode: "80401",
  },
  {
    id: 4,
    name: "Applewood",
    fullAddress: "CO, USA",
    city: "Golden",
    state: "Colorado",
    country: "USA",
    postalCode: "80401",
  },
  {
    id: 5,
    name: "Applewoods",
    fullAddress: "Township Main Road Shantipura, Ahmedabad, Gujarat, India",
    city: "Ahmedabad",
    state: "Gujarat",
    country: "India",
    postalCode: "380057",
  },
];

export function AddressStep({ onBack, onNext }) {
  const { state, actions } = useTransakState();
  const { otp, personalDetails } = state;
  const [addressSearch, setAddressSearch] = useState("");
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [manualAddress, setManualAddress] = useState({
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });
  const [errors, setErrors] = useState({});
  const scrollContainerRef = useRef(null);

  // Filter suggestions based on search
  useEffect(() => {
    if (addressSearch.length > 2) {
      const filtered = mockAddressSuggestions.filter(
        (address) =>
          address.name.toLowerCase().includes(addressSearch.toLowerCase()) ||
          address.fullAddress
            .toLowerCase()
            .includes(addressSearch.toLowerCase())
      );
      setAddressSuggestions(filtered);
    } else {
      setAddressSuggestions([]);
    }
  }, [addressSearch]);

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    setAddressSearch(address.name);
    setAddressSuggestions([]);

    // Populate manual address form
    setManualAddress({
      addressLine1: "Service Road",
      addressLine2: "",
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
    });
    setShowManualEntry(true);

    // Smooth scroll to top of form after a brief delay
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 100);
  };

  const handleManualAddressChange = (field, value) => {
    setManualAddress((prev) => ({
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

  const validateManualAddress = () => {
    const newErrors = {};

    if (!manualAddress.addressLine1.trim()) {
      newErrors.addressLine1 = "Address line is required";
    }

    if (!manualAddress.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!manualAddress.state.trim()) {
      newErrors.state = "State/Region is required";
    }

    if (!manualAddress.postalCode.trim()) {
      newErrors.postalCode = "Postal/Zip code is required";
    }

    if (!manualAddress.country.trim()) {
      newErrors.country = "Country is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (showManualEntry) {
      if (!validateManualAddress()) {
        return;
      }
    } else if (!selectedAddress && !addressSearch.trim()) {
      setErrors({
        address: "Please enter your address or select from suggestions",
      });
      return;
    }

    setIsLoading(true);
    try {
      const addressData = showManualEntry
        ? {
            addressLine1: manualAddress.addressLine1,
            addressLine2: manualAddress.addressLine2,
            city: manualAddress.city,
            state: manualAddress.state,
            postalCode: manualAddress.postalCode,
            country: manualAddress.country,
            countryCode: getCountryCode(manualAddress.country),
            isManualEntry: true,
          }
        : {
            selectedAddress,
            searchTerm: addressSearch,
            isManualEntry: false,
          };

      // If we have both personal details and access token, update KYC user
      if (otp.authToken && personalDetails) {
        try {
          console.log("Updating KYC user with complete details...");

          // Prepare address data for API
          const addressForAPI = showManualEntry
            ? {
                addressLine1: manualAddress.addressLine1,
                addressLine2: manualAddress.addressLine2,
                city: manualAddress.city,
                state: manualAddress.state,
                postalCode: manualAddress.postalCode,
                countryCode: getCountryCode(manualAddress.country),
              }
            : {
                addressLine1: "Service Road", // Default from selected address
                addressLine2: "",
                city: selectedAddress.city,
                state: selectedAddress.state,
                postalCode: selectedAddress.postalCode,
                countryCode: getCountryCode(selectedAddress.country),
              };

          const response = await updateKYCUser(
            otp.authToken,
            {
              firstName: personalDetails.firstName,
              lastName: personalDetails.lastName,
              mobileNumber: personalDetails.mobileNumber,
              dateOfBirth: personalDetails.dateOfBirth,
            },
            addressForAPI
          );
          console.log("KYC User update response:", response);

          // Mark both personal and address details as submitted
          actions.setKYCAddressSubmitted(true);
        } catch (apiError) {
          console.error("Error updating KYC user:", apiError);
          // Continue with the flow even if API call fails, for demo purposes
          console.log("Continuing with demo flow despite API error");
        }
      }

      // Store address data in context
      actions.setAddressData(addressData);

      onNext(addressData);
    } catch (error) {
      console.error("Error submitting address:", error);
      setErrors({ submit: "Failed to submit address. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get country code
  const getCountryCode = (country) => {
    const countryMap = {
      India: "IN",
      USA: "US",
      Canada: "CA",
      UK: "GB",
      France: "FR",
    };
    return countryMap[country] || "IN";
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
          <h2 className="text-xl font-medium text-gray-900">Address</h2>
          <div className="w-9 h-9" /> {/* Spacer for centering */}
        </div>

        <div
          ref={scrollContainerRef}
          className="px-6 py-6 space-y-6 overflow-y-auto flex-1 max-h-[calc(80vh-8rem)] scroll-smooth"
        >
          {/* Progress indicator */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <div className="h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-blue-600 rounded-full"
                  style={{ width: "50%" }}
                ></div>
              </div>
            </div>
            <div className="ml-4">
              <span className="text-sm text-gray-500">KYC STEP 2/4</span>
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

          {!showManualEntry ? (
            /* Address Search */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">
                  Your Address
                </h3>
                <button
                  onClick={() => {
                    setShowManualEntry(true);
                    // Smooth scroll to top when switching to manual entry
                    setTimeout(() => {
                      if (scrollContainerRef.current) {
                        scrollContainerRef.current.scrollTo({
                          top: 0,
                          behavior: "smooth",
                        });
                      }
                    }, 100);
                  }}
                  className="text-blue-600 text-sm hover:text-blue-700"
                >
                  Add Address Manually
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={addressSearch}
                  onChange={(e) => setAddressSearch(e.target.value)}
                  className={`w-full p-3 bg-gray-100 rounded-lg border-0 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all ${
                    errors.address ? "ring-2 ring-red-500" : ""
                  }`}
                  placeholder="Search by house or street number"
                />

                {/* Address Suggestions */}
                {addressSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-10 max-h-60 overflow-y-auto">
                    <div className="sticky top-0 bg-gray-50 px-3 py-2 border-b border-gray-200">
                      <p className="text-xs text-gray-600">
                        {addressSuggestions.length} suggestion
                        {addressSuggestions.length !== 1 ? "s" : ""} found
                      </p>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {addressSuggestions.map((address) => (
                        <button
                          key={address.id}
                          onClick={() => handleAddressSelect(address)}
                          className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-start gap-3 transition-colors"
                        >
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-gray-900 truncate">
                              {address.name}
                            </div>
                            <div className="text-sm text-gray-500 break-words">
                              {address.fullAddress}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    {addressSuggestions.length >= 5 && (
                      <div className="sticky bottom-0 bg-gray-50 px-3 py-2 border-t border-gray-200">
                        <p className="text-xs text-gray-600 text-center">
                          Scroll to see more options or type to refine search
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {errors.address && (
                <p className="text-red-500 text-xs mt-1">{errors.address}</p>
              )}
            </div>
          ) : (
            /* Manual Address Entry */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">
                  Your Address
                </h3>
                <button
                  onClick={() => {
                    setShowManualEntry(false);
                    setSelectedAddress(null);
                    setManualAddress({
                      addressLine1: "",
                      addressLine2: "",
                      city: "",
                      state: "",
                      postalCode: "",
                      country: "India",
                    });
                    // Smooth scroll to top when switching modes
                    setTimeout(() => {
                      if (scrollContainerRef.current) {
                        scrollContainerRef.current.scrollTo({
                          top: 0,
                          behavior: "smooth",
                        });
                      }
                    }, 100);
                  }}
                  className="text-blue-600 text-sm hover:text-blue-700"
                >
                  Search Address
                </button>
              </div>

              {/* Address Line 1 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address Line
                </label>
                <input
                  type="text"
                  value={manualAddress.addressLine1}
                  onChange={(e) =>
                    handleManualAddressChange("addressLine1", e.target.value)
                  }
                  className={`w-full p-3 bg-gray-100 rounded-lg border-0 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all ${
                    errors.addressLine1 ? "ring-2 ring-red-500" : ""
                  }`}
                  placeholder="Street address"
                />
                {errors.addressLine1 && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.addressLine1}
                  </p>
                )}
              </div>

              {/* Address Line 2 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address Line 2 (Optional)
                </label>
                <input
                  type="text"
                  value={manualAddress.addressLine2}
                  onChange={(e) =>
                    handleManualAddressChange("addressLine2", e.target.value)
                  }
                  className="w-full p-3 bg-gray-100 rounded-lg border-0 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Apartment, studio, or floor"
                />
              </div>

              {/* State/Region and City */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State/Region
                  </label>
                  <input
                    type="text"
                    value={manualAddress.state}
                    onChange={(e) =>
                      handleManualAddressChange("state", e.target.value)
                    }
                    className={`w-full p-3 bg-gray-100 rounded-lg border-0 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all ${
                      errors.state ? "ring-2 ring-red-500" : ""
                    }`}
                    placeholder="State"
                  />
                  {errors.state && (
                    <p className="text-red-500 text-xs mt-1">{errors.state}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={manualAddress.city}
                    onChange={(e) =>
                      handleManualAddressChange("city", e.target.value)
                    }
                    className={`w-full p-3 bg-gray-100 rounded-lg border-0 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all ${
                      errors.city ? "ring-2 ring-red-500" : ""
                    }`}
                    placeholder="City"
                  />
                  {errors.city && (
                    <p className="text-red-500 text-xs mt-1">{errors.city}</p>
                  )}
                </div>
              </div>

              {/* Postal Code and Country */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postal/Zip Code
                  </label>
                  <input
                    type="text"
                    value={manualAddress.postalCode}
                    onChange={(e) =>
                      handleManualAddressChange("postalCode", e.target.value)
                    }
                    className={`w-full p-3 bg-gray-100 rounded-lg border-0 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all ${
                      errors.postalCode ? "ring-2 ring-red-500" : ""
                    }`}
                    placeholder="Postal Code"
                  />
                  {errors.postalCode && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.postalCode}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <select
                    value={manualAddress.country}
                    onChange={(e) =>
                      handleManualAddressChange("country", e.target.value)
                    }
                    className={`w-full p-3 bg-gray-100 rounded-lg border-0 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all ${
                      errors.country ? "ring-2 ring-red-500" : ""
                    }`}
                  >
                    <option value="India">India</option>
                    <option value="USA">USA</option>
                    <option value="Canada">Canada</option>
                    <option value="UK">UK</option>
                  </select>
                  {errors.country && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.country}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

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
                : (showManualEntry &&
                    manualAddress.addressLine1 &&
                    manualAddress.city &&
                    manualAddress.state &&
                    manualAddress.postalCode) ||
                  (!showManualEntry && addressSearch.trim())
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-blue-400 text-white cursor-not-allowed"
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
