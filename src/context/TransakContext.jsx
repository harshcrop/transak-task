import { createContext, useContext, useReducer, useEffect } from "react";

// Initial state
const initialState = {
  // Quote step
  quote: {
    fiatAmount: "250",
    selectedPayment: "sepa_bank_transfer",
    selectedFiatCurrency: "EUR",
    selectedCryptoCurrency: "ETH",
    selectedFiatCurrencyObj: null,
    quote: null,
    quoteLoading: false,
    quoteError: null,
  },

  // Wallet step
  wallet: {
    address: "",
    validationResult: null,
    isValid: false,
  },

  // Email step
  email: {
    email: "",
    stateToken: "",
    expiresIn: 600,
    verified: false,
  },

  // OTP step
  otp: {
    code: "",
    verified: false,
    authToken: "",
    refreshToken: "",
    tokenExpiry: null,
    attempts: 0,
  },

  // Personal details step
  personalDetails: {
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    country: "",
    completed: false,
  },

  // Address step
  address: {
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    isManualEntry: false,
    completed: false,
  },

  // Purpose step
  purpose: {
    purposeId: "investments",
    purposeTitle: "",
    purposeDescription: "",
    completed: false,
  },

  // ID Proof step
  idProof: {
    videoBlob: null,
    verificationComplete: false,
    timestamp: null,
    completed: false,
  },

  // Current step
  currentStep: "quote",

  // Progress tracking
  progress: {
    completedSteps: [],
    totalSteps: 8,
  },

  // User details from API responses
  userDetails: null,

  // KYC process tracking
  kycProcess: {
    personalDetailsSubmitted: false,
    addressDetailsSubmitted: false,
    purposeSubmitted: false,
    requirements: null,
    requirementsFetched: false,
  },
};

// Action types
const actionTypes = {
  // Quote actions
  SET_QUOTE_DATA: "SET_QUOTE_DATA",
  SET_QUOTE_LOADING: "SET_QUOTE_LOADING",
  SET_QUOTE_ERROR: "SET_QUOTE_ERROR",
  SET_QUOTE_RESULT: "SET_QUOTE_RESULT",

  // Navigation actions
  SET_CURRENT_STEP: "SET_CURRENT_STEP",
  COMPLETE_STEP: "COMPLETE_STEP",

  // Wallet actions
  SET_WALLET_DATA: "SET_WALLET_DATA",

  // Email actions
  SET_EMAIL_DATA: "SET_EMAIL_DATA",

  // OTP actions
  SET_OTP_DATA: "SET_OTP_DATA",

  // Personal details actions
  SET_PERSONAL_DETAILS: "SET_PERSONAL_DETAILS",

  // Address actions
  SET_ADDRESS_DATA: "SET_ADDRESS_DATA",

  // Purpose actions
  SET_PURPOSE_DATA: "SET_PURPOSE_DATA",

  // ID Proof actions
  SET_ID_PROOF_DATA: "SET_ID_PROOF_DATA",

  // User details
  SET_USER_DETAILS: "SET_USER_DETAILS",

  // KYC process actions
  SET_KYC_PERSONAL_SUBMITTED: "SET_KYC_PERSONAL_SUBMITTED",
  SET_KYC_ADDRESS_SUBMITTED: "SET_KYC_ADDRESS_SUBMITTED",
  SET_KYC_PURPOSE_SUBMITTED: "SET_KYC_PURPOSE_SUBMITTED",
  SET_KYC_REQUIREMENTS: "SET_KYC_REQUIREMENTS",

  // Reset/Load state
  RESET_STATE: "RESET_STATE",
  LOAD_STATE: "LOAD_STATE",
};

// Reducer function
function transakReducer(state, action) {
  switch (action.type) {
    case actionTypes.SET_QUOTE_DATA:
      return {
        ...state,
        quote: {
          ...state.quote,
          ...action.payload,
        },
      };

    case actionTypes.SET_QUOTE_LOADING:
      return {
        ...state,
        quote: {
          ...state.quote,
          quoteLoading: action.payload,
        },
      };

    case actionTypes.SET_QUOTE_ERROR:
      return {
        ...state,
        quote: {
          ...state.quote,
          quoteError: action.payload,
        },
      };

    case actionTypes.SET_QUOTE_RESULT:
      return {
        ...state,
        quote: {
          ...state.quote,
          quote: action.payload,
        },
      };

    case actionTypes.SET_CURRENT_STEP:
      return {
        ...state,
        currentStep: action.payload,
      };

    case actionTypes.COMPLETE_STEP: {
      const completedSteps = [...state.progress.completedSteps];
      if (!completedSteps.includes(action.payload)) {
        completedSteps.push(action.payload);
      }
      return {
        ...state,
        progress: {
          ...state.progress,
          completedSteps,
        },
      };
    }

    case actionTypes.SET_WALLET_DATA:
      return {
        ...state,
        wallet: {
          ...state.wallet,
          ...action.payload,
        },
      };

    case actionTypes.SET_EMAIL_DATA:
      return {
        ...state,
        email: {
          ...state.email,
          ...action.payload,
        },
      };

    case actionTypes.SET_OTP_DATA:
      return {
        ...state,
        otp: {
          ...state.otp,
          ...action.payload,
        },
      };

    case actionTypes.SET_PERSONAL_DETAILS:
      return {
        ...state,
        personalDetails: {
          ...state.personalDetails,
          ...action.payload,
          completed: true,
        },
      };

    case actionTypes.SET_ADDRESS_DATA:
      return {
        ...state,
        address: {
          ...state.address,
          ...action.payload,
          completed: true,
        },
      };

    case actionTypes.SET_PURPOSE_DATA:
      return {
        ...state,
        purpose: {
          ...state.purpose,
          ...action.payload,
          completed: true,
        },
      };

    case actionTypes.SET_ID_PROOF_DATA:
      return {
        ...state,
        idProof: {
          ...state.idProof,
          ...action.payload,
          completed: true,
        },
      };

    case actionTypes.SET_USER_DETAILS:
      return {
        ...state,
        userDetails: action.payload,
      };

    case actionTypes.SET_KYC_PERSONAL_SUBMITTED:
      return {
        ...state,
        kycProcess: {
          ...state.kycProcess,
          personalDetailsSubmitted: action.payload,
        },
      };

    case actionTypes.SET_KYC_ADDRESS_SUBMITTED:
      return {
        ...state,
        kycProcess: {
          ...state.kycProcess,
          addressDetailsSubmitted: action.payload,
        },
      };

    case actionTypes.SET_KYC_PURPOSE_SUBMITTED:
      return {
        ...state,
        kycProcess: {
          ...state.kycProcess,
          purposeSubmitted: action.payload,
        },
      };

    case actionTypes.SET_KYC_REQUIREMENTS:
      return {
        ...state,
        kycProcess: {
          ...state.kycProcess,
          requirements: action.payload,
          requirementsFetched: true,
        },
      };

    case actionTypes.LOAD_STATE:
      return {
        ...state,
        ...action.payload,
      };

    case actionTypes.RESET_STATE:
      return initialState;

    default:
      return state;
  }
}

// Create context
const TransakContext = createContext();

// Hook to use the context
export const useTransakState = () => {
  const context = useContext(TransakContext);
  if (!context) {
    throw new Error("useTransakState must be used within a TransakProvider");
  }
  return context;
};

// Storage key for persistence
const STORAGE_KEY = "transak_widget_state";

// Provider component
export function TransakProvider({ children }) {
  const [state, dispatch] = useReducer(transakReducer, initialState);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        // Don't restore quote and loading states, but restore form data
        const stateToRestore = {
          ...parsedState,
          quote: {
            ...parsedState.quote,
            quote: null,
            quoteLoading: false,
            quoteError: null,
          },
        };
        dispatch({ type: actionTypes.LOAD_STATE, payload: stateToRestore });
      }
    } catch (error) {
      console.error("Error loading saved state:", error);
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      // Don't save sensitive data like authToken or video blobs
      const stateToSave = {
        ...state,
        otp: {
          ...state.otp,
          authToken: "", // Don't persist auth tokens
        },
        idProof: {
          ...state.idProof,
          videoBlob: null, // Don't persist video blobs
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Error saving state:", error);
    }
  }, [state]);

  // Action creators
  const actions = {
    // Quote actions
    setQuoteData: (data) =>
      dispatch({ type: actionTypes.SET_QUOTE_DATA, payload: data }),
    setQuoteLoading: (loading) =>
      dispatch({ type: actionTypes.SET_QUOTE_LOADING, payload: loading }),
    setQuoteError: (error) =>
      dispatch({ type: actionTypes.SET_QUOTE_ERROR, payload: error }),
    setQuoteResult: (quote) =>
      dispatch({ type: actionTypes.SET_QUOTE_RESULT, payload: quote }),

    // Navigation actions
    setCurrentStep: (step) =>
      dispatch({ type: actionTypes.SET_CURRENT_STEP, payload: step }),
    completeStep: (step) =>
      dispatch({ type: actionTypes.COMPLETE_STEP, payload: step }),

    // Data actions
    setWalletData: (data) =>
      dispatch({ type: actionTypes.SET_WALLET_DATA, payload: data }),
    setEmailData: (data) =>
      dispatch({ type: actionTypes.SET_EMAIL_DATA, payload: data }),
    setOtpData: (data) =>
      dispatch({ type: actionTypes.SET_OTP_DATA, payload: data }),
    setPersonalDetails: (data) =>
      dispatch({ type: actionTypes.SET_PERSONAL_DETAILS, payload: data }),
    setAddressData: (data) =>
      dispatch({ type: actionTypes.SET_ADDRESS_DATA, payload: data }),
    setPurposeData: (data) =>
      dispatch({ type: actionTypes.SET_PURPOSE_DATA, payload: data }),
    setIdProofData: (data) =>
      dispatch({ type: actionTypes.SET_ID_PROOF_DATA, payload: data }),
    setUserDetails: (data) =>
      dispatch({ type: actionTypes.SET_USER_DETAILS, payload: data }),

    // KYC process actions
    setKYCPersonalSubmitted: (submitted) =>
      dispatch({
        type: actionTypes.SET_KYC_PERSONAL_SUBMITTED,
        payload: submitted,
      }),
    setKYCAddressSubmitted: (submitted) =>
      dispatch({
        type: actionTypes.SET_KYC_ADDRESS_SUBMITTED,
        payload: submitted,
      }),
    setKYCPurposeSubmitted: (submitted) =>
      dispatch({
        type: actionTypes.SET_KYC_PURPOSE_SUBMITTED,
        payload: submitted,
      }),
    setKYCRequirements: (requirements) =>
      dispatch({
        type: actionTypes.SET_KYC_REQUIREMENTS,
        payload: requirements,
      }),

    // Utility actions
    resetState: () => {
      localStorage.removeItem(STORAGE_KEY);
      dispatch({ type: actionTypes.RESET_STATE });
    },
  };

  // Helper functions
  const helpers = {
    isStepCompleted: (step) => state.progress.completedSteps.includes(step),
    getProgress: () => ({
      completed: state.progress.completedSteps.length,
      total: state.progress.totalSteps,
      percentage:
        (state.progress.completedSteps.length / state.progress.totalSteps) *
        100,
    }),
    canNavigateToStep: (step) => {
      const stepOrder = [
        "quote",
        "wallet",
        "email",
        "otp",
        "personal-details",
        "address",
        "purpose",
        "id-proof",
      ];
      const currentIndex = stepOrder.indexOf(state.currentStep);
      const targetIndex = stepOrder.indexOf(step);

      // Can always go back to previous steps
      if (targetIndex <= currentIndex) return true;

      // Can only go forward if all previous steps are completed
      for (let i = 0; i < targetIndex; i++) {
        if (!state.progress.completedSteps.includes(stepOrder[i])) {
          return false;
        }
      }
      return true;
    },
    getAllFormData: () => ({
      quote: state.quote,
      wallet: state.wallet,
      email: state.email,
      otp: state.otp,
      personalDetails: state.personalDetails,
      address: state.address,
      purpose: state.purpose,
      idProof: state.idProof,
      userDetails: state.userDetails,
    }),
  };

  const value = {
    state,
    actions,
    helpers,
  };

  return (
    <TransakContext.Provider value={value}>{children}</TransakContext.Provider>
  );
}

export { actionTypes };
