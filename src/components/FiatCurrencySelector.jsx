import { useState, useEffect, useRef } from "react";
import { ChevronDown, Search, Loader2, ArrowLeft } from "lucide-react";
import { useFiatCurrencies } from "../api/hooks.js";

export function FiatCurrencySelector({ selectedCurrency, onCurrencyChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  // Hooks must be called unconditionally
  const { fiatCurrencies, loading, error } = useFiatCurrencies();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Ensure we have valid props
  if (typeof onCurrencyChange !== "function") {
    console.error("FiatCurrencySelector: onCurrencyChange must be a function");
    return <div>Error: Invalid props</div>;
  }

  // Filter currencies based on search term
  const filteredCurrencies = Array.isArray(fiatCurrencies)
    ? fiatCurrencies.filter((currency) => {
        if (!currency || typeof currency !== "object") return false;
        const name = currency.name || "";
        const symbol = currency.symbol || "";
        return (
          name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          symbol.toLowerCase().includes(searchTerm.toLowerCase())
        );
      })
    : [];

  const handleCurrencySelect = (currency) => {
    onCurrencyChange(currency); // Pass the complete currency object instead of just symbol
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setSearchTerm("");
  };

  // Helper function to get the selected currency object
  const getSelectedCurrency = () => {
    if (!Array.isArray(fiatCurrencies)) return null;
    return fiatCurrencies.find(
      (currency) =>
        currency.symbol === selectedCurrency?.symbol ||
        currency.symbol === selectedCurrency
    );
  };

  // Helper function to render SVG icon
  const renderCurrencyIcon = (currency, size = "w-6 h-6") => {
    if (currency?.icon) {
      return (
        <div
          className={`${size} flex items-center justify-center`}
          dangerouslySetInnerHTML={{ __html: currency.icon }}
        />
      );
    }
  };

  if (error) {
    console.error("Fiat currencies error:", error);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex p-[1.25rem] bg-gray-100 items-center gap-2 hover:bg-gray-50 transition-colors text-lg font-medium min-w-[120px] h-full"
      >
        <>
          {renderCurrencyIcon(getSelectedCurrency(), "w-5 h-5")}
          <span>{selectedCurrency}</span>
          <ChevronDown className="w-4 h-4 flex-shrink-0" />
        </>
      </button>

      {isOpen && (
        <>
          {/* Modal Overlay */}
          <div className="fixed inset-0 bg-white bg-opacity-50 z-50 flex items-center justify-center p-4">
            {/* Modal Content */}
            <div className="bg-white text-gray-900 rounded-2xl w-full max-w-md h-[90vh] max-h-[600px] flex flex-col overflow-hidden shadow-2xl border border-gray-200">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>
                <h2 className="text-lg font-medium text-center flex-1 text-gray-900">
                  Select Currency
                </h2>
                <div className="w-9"></div> {/* Spacer for centering */}
              </div>

              {/* Search */}
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Type a currency"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-sm bg-white border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>

              {/* Currencies Label */}
              <div className="px-4 py-3">
                <h3 className="text-sm font-medium text-gray-600">
                  Currencies
                </h3>
              </div>

              {/* Loading state */}
              {loading && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                    <p className="text-sm text-gray-600 mt-2">
                      Loading currencies...
                    </p>
                  </div>
                </div>
              )}

              {/* Error state */}
              {error && !loading && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm text-red-500">
                      Error loading currencies
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Using cached data
                    </p>
                  </div>
                </div>
              )}

              {/* Currency list */}
              {!loading && (
                <div className="flex-1 overflow-y-auto">
                  {filteredCurrencies.length > 0 ? (
                    filteredCurrencies.map((currency) => (
                      <button
                        key={currency.symbol}
                        onClick={() => handleCurrencySelect(currency)}
                        className={`w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                          currency.symbol ===
                          (selectedCurrency?.symbol || selectedCurrency)
                            ? "bg-blue-50"
                            : ""
                        }`}
                      >
                        {/* Currency icon */}
                        <div className="flex-shrink-0">
                          {renderCurrencyIcon(currency, "w-8 h-8")}
                        </div>

                        {/* Currency info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900 text-lg">
                              {currency.symbol}
                            </span>
                            {currency.isAllowed === false && (
                              <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                                Limited
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            {currency.name}
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-sm text-gray-500">
                        {searchTerm
                          ? "No currencies found"
                          : "No currencies available"}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
