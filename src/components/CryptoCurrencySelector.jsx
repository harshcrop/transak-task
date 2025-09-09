import { useState, useEffect, useRef } from "react";
import { ChevronDown, Search, Loader2, ArrowLeft, X } from "lucide-react";
import { useCryptoCurrencies } from "../api/hooks.js";

export function CryptoCurrencySelector({ selectedCurrency, onCurrencyChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const { cryptoCurrencies, loading, error } = useCryptoCurrencies();

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

  // Filter currencies based on search term
  const filteredCurrencies = cryptoCurrencies.filter(
    (currency) =>
      currency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      currency.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected currency data
  const selectedCurrencyData = cryptoCurrencies.find(
    (currency) =>
      currency.uniqueId === selectedCurrency ||
      currency.symbol === selectedCurrency
  );

  // Extract symbol from currency ID
  const extractSymbol = (currencyId) => {
    if (!currencyId) return "ETH";

    // Handle new format like "ETHethereum" or "BTCmainnet"
    if (currencyId.length > 3) {
      if (currencyId.startsWith("ETH") || currencyId.startsWith("BTC")) {
        return currencyId.substring(0, 3);
      }
    }

    // Handle legacy format with dash separator
    if (currencyId.includes("-")) {
      return currencyId.split("-")[0];
    }

    return currencyId;
  };

  const handleCurrencySelect = (currency) => {
    onCurrencyChange(currency.uniqueId || currency.symbol);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setSearchTerm("");
  };

  if (error) {
    console.error("Crypto currencies error:", error);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="grid m-auto bg-gray-100">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex p-[0.35rem] items-center justify-center gap-2 bg-gray-100 hover:bg-gray-50 transition-colors text-lg font-medium min-w-[120px] h-full cursor-pointer"
        >
          {selectedCurrencyData && (
            <div className="w-5 h-5 flex items-center justify-center">
              <img
                src={selectedCurrencyData.image.thumb}
                alt={selectedCurrencyData.name}
                className="w-5 h-5"
              />
            </div>
          )}
          <span>{extractSymbol(selectedCurrency)}</span>

          <ChevronDown className="w-4 h-4 flex-shrink-0" />
        </button>

        {/* Fixed network display with dynamic width */}
        {selectedCurrencyData?.networkDisplayName && (
          <div className="flex justify-center mb-[6px]">
            <div className="text-center text-[8px] border border-gray-300 rounded px-2 py-1 inline-block min-w-[60px] max-w-[200px]">
              <p className="whitespace-nowrap overflow-hidden text-ellipsis">
                {selectedCurrencyData.networkDisplayName} network
              </p>
            </div>
          </div>
        )}
      </div>

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
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>
                <h2 className="text-lg font-medium text-center flex-1 text-gray-900">
                  Select Currency
                </h2>
                <div className="w-9"></div> {/* Spacer for centering */}
              </div>

              {/* Search and Network Filter */}
              <div className="p-4 space-y-3">
                <div className="flex gap-3">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Type a currency"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-sm bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                    />
                  </div>

                  {/* Network Filter */}
                  <div className="relative">
                    <select
                      className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-8"
                      value={selectedCurrencyData?.networkDisplayName || ""}
                      onChange={(e) => {
                        const selectedNetwork = e.target.value;
                        // Find the first currency with this networkDisplayName
                        const currency = cryptoCurrencies.find(
                          (c) => c.networkDisplayName === selectedNetwork
                        );
                        if (currency) {
                          handleCurrencySelect(currency);
                        }
                      }}
                    >
                      <option value="">Select network</option>
                      {[
                        ...new Set(
                          cryptoCurrencies.map((c) => c.networkDisplayName)
                        ),
                      ]
                        .filter(Boolean)
                        .map((network) => (
                          <option key={network} value={network}>
                            {network}
                          </option>
                        ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="px-4 py-3">
                <h3 className="text-xl font-medium text-gray-600">
                  Popular Currencies
                </h3>
              </div>

              {/* Loading state */}
              {loading && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
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
                <div className="flex-1 overflow-y-auto px-6">
                  {filteredCurrencies.length > 0 ? (
                    filteredCurrencies.map((currency) => (
                      <button
                        key={currency.uniqueId || currency.symbol}
                        onClick={() => handleCurrencySelect(currency)}
                        className={`w-full flex items-center gap-3 p-1 text-left hover:bg-gray-50 cursor-pointer ${
                          currency.uniqueId === selectedCurrency ||
                          currency.symbol === selectedCurrency
                            ? ""
                            : ""
                        }`}
                      >
                        {/* Currency icon */}
                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {currency.image?.large ? (
                            <img
                              src={currency.image.large}
                              alt={currency.name}
                              className="w-6 h-6"
                            />
                          ) : (
                            <span className="text-gray-700 text-xs font-bold">
                              {currency.symbol.substring(0, 2)}
                            </span>
                          )}
                        </div>

                        {/* Currency info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 justify-between">
                            <div className="flex gap-4 items-center">
                              <span className="font-medium text-gray-900 text-xs">
                                {currency.symbol}
                              </span>
                              <div className="text-sm text-gray-600">
                                {currency.name}
                              </div>
                            </div>
                            <div>
                              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                                {currency.networkDisplayName ||
                                  currency.network}
                              </span>
                            </div>
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
