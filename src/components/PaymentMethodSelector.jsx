import { useState } from "react";
import { Info } from "lucide-react";

export function PaymentMethodSelector({
  selectedPayment,
  onPaymentChange,
  paymentOptions = [],
  showFees = false,
  onToggleFees,
  feeBreakdown = [],
  totalFees = 0,
  selectedFiatCurrency,
  conversionRate = null,
  selectedCryptoSymbol,
}) {
  const [expandedTooltip, setExpandedTooltip] = useState(null);

  // Filter to show only the first payment method for now
  const filteredPaymentOptions =
    paymentOptions.length > 0 ? [paymentOptions[0]] : [];

  const handlePaymentSelect = (paymentId) => {
    onPaymentChange(paymentId);
  };

  const formatCurrency = (amount, currency) => {
    return `${amount.toFixed(2)} ${currency}`;
  };

  return (
    <div className="transak-calculator-breakdown transak-calculator-breakdown--inverse ml-12">
      {/* Payment Methods Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Using payment method</span>
        </div>

        <div className="space-y-3">
          {filteredPaymentOptions.map((payment) => (
            <label
              key={payment.id}
              className="flex items-center gap-3 cursor-pointer p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <input
                type="radio"
                name="payment-method"
                value={payment.id}
                checked={selectedPayment === payment.id}
                onChange={() => handlePaymentSelect(payment.id)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div className="flex items-center gap-3 flex-1">
                {payment.icon && (
                  <img
                    alt={payment.name}
                    src={payment.icon}
                    className="payment-method-icon"
                    style={{
                      height: "24px",
                      maxWidth: "48px",
                      objectFit: "contain",
                    }}
                  />
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                    {payment.name}
                  </span>
                  {payment.processingTime && (
                    <span className="text-xs text-gray-500">
                      {payment.processingTime}
                    </span>
                  )}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Fees Toggle Button */}
      <div className="mt-4">
        <button
          type="button"
          onClick={onToggleFees}
          className="text-sm text-gray-600 hover:text-gray-800 cursor-pointer ml-4"
          style={{ fontSize: "0.875rem" }}
        >
          {showFees ? "Hide" : "See fees calculation"}
        </button>
      </div>

      {/* Expanded Fee Breakdown */}
      {showFees && feeBreakdown.length > 0 && (
        <div className="mt-2">
          <div className="space-y-2">
            {feeBreakdown.map((fee, index) => (
              <div
                key={fee.id || index}
                className="flex items-center gap-4 text-sm"
              >
                <div className="flex items-center gap-1"></div>
                <span className="font-medium">
                  {formatCurrency(fee.value || 0, selectedFiatCurrency)}
                </span>
                <span className="text-gray-600">{fee.name || fee.id}</span>
                {fee.description && (
                  <div
                    className="relative cursor-pointer"
                    onMouseEnter={() => setExpandedTooltip(fee.id)}
                    onMouseLeave={() => setExpandedTooltip(null)}
                  >
                    <Info className="w-3 h-3 text-gray-400" />
                    {expandedTooltip === fee.id && (
                      <div className="absolute z-10 p-2 bg-black text-white text-xs rounded shadow-lg mt-1 min-w-[200px]">
                        {fee.description}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Total Fees Display */}
      <div className="flex items-center mt-3">
        <span className="sequence-icon transak-calculator-breakdown__icon mr-3">
          –
        </span>
        <div className="transak-calculator-breakdown-item__left">
          <div className="fee-display">
            <div className="fee-amount text-sm">
              {formatCurrency(totalFees, selectedFiatCurrency)}
            </div>
            <div className="fee-label text-sm text-gray-600">Total fees</div>
          </div>
        </div>
      </div>

      {/* Conversion Rate Display */}
      {conversionRate && (
        <div className="flex items-center mt-3">
          <span className="sequence-icon transak-calculator-breakdown__icon mr-3">
            ÷
          </span>
          <div className="conversion-rate-display">
            <div className="rate-text text-sm">
              {formatCurrency(conversionRate, selectedFiatCurrency)} = 1{" "}
              {selectedCryptoSymbol}
            </div>
            <div className="rate-label-container flex items-center gap-1 text-xs text-gray-500">
              <span>Rate</span>
              <div
                className="rate-info-icon cursor-pointer"
                onMouseEnter={() => setExpandedTooltip("rate")}
                onMouseLeave={() => setExpandedTooltip(null)}
              >
                <Info className="w-3 h-3 text-gray-400" />
                {expandedTooltip === "rate" && (
                  <div className="absolute z-10 p-2 bg-black text-white text-xs rounded shadow-lg mt-1">
                    Current exchange rate
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .transak-calculator-breakdown {
          font-family: inherit;
        }

        .sequence-icon {
          color: var(--font-color-secondary, #666);
          font-weight: 500;
        }

        .payment-method-container {
          display: inline-block;
        }

        .payment-method {
          transition: all 0.2s ease;
          cursor: pointer;
          position: relative;
        }

        .payment-method:hover {
          background-color: rgba(20, 97, 219, 0.02);
        }

        .payment-method.selected {
          background-color: rgba(20, 97, 219, 0.05);
        }

        .badge-dot {
          display: inline-block;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .fee-display {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .fee-amount {
          color: var(--font-color-primary, #333);
        }

        .fee-label {
          color: var(--font-color-secondary, #666);
        }

        .conversion-rate-display {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .rate-text {
          color: var(--font-color-primary, #333);
          font-weight: 500;
        }

        .rate-label-container {
          margin-top: 2px;
        }

        .rate-info-icon {
          position: relative;
        }
      `}</style>
    </div>
  );
}
