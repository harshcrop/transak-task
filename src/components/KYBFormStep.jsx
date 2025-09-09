import { useState } from "react";
import { ArrowLeft, Upload, Check, AlertCircle } from "lucide-react";
import { useTransakState } from "../context/TransakContext.jsx";
import { TransakFooter } from "./TransakFooter.jsx";

export function KYBFormStep({ onBack, onNext }) {
  const { state } = useTransakState();
  const [currentSection, setCurrentSection] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  // Initialize form data with user information from KYC
  const [formData, setFormData] = useState({
    userId: state.userDetails?.id || Date.now().toString(),
    partnerUserId: state.userDetails?.partnerUserId || "",
    userEmail: state.email?.email || "",

    // Acknowledgments
    acknowledgments: {
      hasTransakAccount: false,
      understandsBusinessForm: false,
      noICOConfirmation: false,
    },

    // Company/Business Information
    companyInfo: {
      contactInfo: {
        firstName: state.personalDetails?.firstName || "",
        lastName: state.personalDetails?.lastName || "",
        email: state.email?.email || "",
        phoneNumber: "",
        telegram: "",
      },
      businessDetails: {
        companyName: "",
        legalEntityName: "",
        tradingDBAName: "",
        legalEntityType: "",
        registrationNumber: "",
        incorporationDocument: "",
        companyRegistryLink: "",
        registeredAddress: "",
        website: "",
        isWebsiteLive: false,
        establishmentDate: "",
        countryOfRegistration: "",
        businessOutsideCountry: false,
        businessCategory: "",
        projectedMonthlyTransactions: "",
      },
    },

    // Transak Account Information
    transakAccount: {
      businessDescription: "",
      purposeOfAccount: "",
      revenueGeneration: "",
      takeCustodyOfFunds: false,
      domainWhitelisting: "",
    },

    // FCA Financial Promotions Rules
    fcaRules: {
      allowUKUsers: false,
    },

    // Travel Rule Compliance
    travelRule: {
      requiredToComply: "",
      complianceReason: "",
      serviceType: "",
      walletAddressControl: "",
    },

    // Director Information
    directors: {
      numberOfDirectors: 1,
      directorsList: [{ fullName: "", position: "Director" }],
    },

    // Beneficial Ownership Information
    beneficialOwners: {
      numberOfOwners: 1,
      ownersList: [{ fullName: "", ownershipPercentage: 25 }],
    },

    // Authorized Signatory Information
    authorizedSignatories: {
      numberOfSignatories: 1,
      signatoriesList: [{ fullName: "", position: "", email: "" }],
    },

    // Further Questions
    furtherQuestions: {
      legalIssues: false,
      politicalExposure: false,
      prohibitedActivities: false,
    },
  });

  const sections = [
    { id: "acknowledgments", title: "Acknowledgments", required: true },
    { id: "company", title: "Company Information", required: true },
    { id: "transak", title: "Transak Account", required: true },
    { id: "compliance", title: "Compliance", required: true },
    { id: "ownership", title: "Ownership & Management", required: true },
    { id: "final", title: "Final Questions", required: true },
    { id: "review", title: "Review & Submit", required: false },
  ];

  const updateFormData = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const updateNestedFormData = (section, subsection, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...prev[section][subsection],
          [field]: value,
        },
      },
    }));
  };

  const handleFileUpload = async (file) => {
    const formDataUpload = new FormData();
    formDataUpload.append("incorporationDocument", file);
    formDataUpload.append("userEmail", formData.userEmail || "");

    try {
      const response = await fetch(
        `http://localhost:5001/api/kyb/upload/${formData.userId}`,
        {
          method: "POST",
          body: formDataUpload,
        }
      );

      if (response.ok) {
        const result = await response.json();
        setUploadedFile(file);
        updateNestedFormData(
          "companyInfo",
          "businessDetails",
          "incorporationDocument",
          result.filePath
        );
        return true;
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("File upload error:", error);
      return false;
    }
  };

  const validateCurrentSection = () => {
    const section = sections[currentSection];

    switch (section.id) {
      case "acknowledgments":
        return Object.values(formData.acknowledgments).every(
          (val) => val === true
        );
      case "company": {
        const { contactInfo, businessDetails } = formData.companyInfo;
        return (
          contactInfo.firstName &&
          contactInfo.lastName &&
          contactInfo.email &&
          businessDetails.companyName &&
          businessDetails.legalEntityName &&
          businessDetails.legalEntityType &&
          businessDetails.registrationNumber
        );
      }
      case "transak": {
        const { transakAccount } = formData;
        return (
          transakAccount.businessDescription &&
          transakAccount.purposeOfAccount &&
          transakAccount.revenueGeneration &&
          transakAccount.domainWhitelisting
        );
      }
      case "compliance":
        return (
          formData.travelRule.requiredToComply &&
          formData.travelRule.serviceType &&
          formData.travelRule.walletAddressControl
        );
      case "ownership":
        return (
          formData.directors.directorsList.length > 0 &&
          formData.directors.directorsList.every((d) => d.fullName)
        );
      case "final":
        return true; // These are just yes/no questions
      default:
        return true;
    }
  };

  const nextSection = () => {
    if (validateCurrentSection() && currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const submitKYBForm = async () => {
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Ensure partnerUserId is present before submit
      if (!formData.partnerUserId) {
        setSubmitStatus("error");
        throw new Error("partnerUserId is required");
      }
      // Insert full KYB document on submit
      const createResponse = await fetch(
        "http://localhost:5001/api/kyb/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (!createResponse.ok) {
        throw new Error("Failed to save KYB form");
      }

      // Then submit for review
      const submitResponse = await fetch(
        `http://localhost:5001/api/kyb/submit/${formData.userId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ipAddress: "127.0.0.1", // In real implementation, get actual IP
            userAgent: navigator.userAgent,
          }),
        }
      );

      if (submitResponse.ok) {
        setSubmitStatus("success");
        setTimeout(() => {
          // Redirect to main page after successful submission
          window.location.href = "/";
        }, 2000);
      } else {
        throw new Error("Failed to submit KYB form");
      }
    } catch (error) {
      console.error("KYB submission error:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSection = () => {
    const section = sections[currentSection];

    switch (section.id) {
      case "acknowledgments":
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">
              Required Acknowledgments
            </h3>

            <div className="space-y-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={formData.acknowledgments.hasTransakAccount}
                  onChange={(e) =>
                    updateFormData(
                      "acknowledgments",
                      "hasTransakAccount",
                      e.target.checked
                    )
                  }
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  I confirm I have created an account on{" "}
                  <strong>dashboard.transak.com</strong>. My submission will be
                  rejected otherwise. *
                </span>
              </label>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={formData.acknowledgments.understandsBusinessForm}
                  onChange={(e) =>
                    updateFormData(
                      "acknowledgments",
                      "understandsBusinessForm",
                      e.target.checked
                    )
                  }
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  This form is for potential business partners wanting to
                  integrate the Transak product. This IS NOT a KYC form for end
                  users to purchase cryptocurrencies. *
                </span>
              </label>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={formData.acknowledgments.noICOConfirmation}
                  onChange={(e) =>
                    updateFormData(
                      "acknowledgments",
                      "noICOConfirmation",
                      e.target.checked
                    )
                  }
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Currently, Transak does not support the use of our product to
                  conduct ICO's (Initial Coin Offerings). I confirm that I will
                  not be utilizing Transak's product to conduct an ICO. *
                </span>
              </label>
            </div>
          </div>
        );

      case "company":
        return (
          <div className="space-y-8">
            <h3 className="text-lg font-medium text-gray-900">
              Company / Business Information
            </h3>

            {/* Contact Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-800">Contact Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First name *
                  </label>
                  <input
                    type="text"
                    value={formData.companyInfo.contactInfo.firstName}
                    onChange={(e) =>
                      updateNestedFormData(
                        "companyInfo",
                        "contactInfo",
                        "firstName",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last name *
                  </label>
                  <input
                    type="text"
                    value={formData.companyInfo.contactInfo.lastName}
                    onChange={(e) =>
                      updateNestedFormData(
                        "companyInfo",
                        "contactInfo",
                        "lastName",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.companyInfo.contactInfo.email}
                    onChange={(e) =>
                      updateNestedFormData(
                        "companyInfo",
                        "contactInfo",
                        "email",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Please enter your email address used to register your
                    Transak account
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone number *
                  </label>
                  <input
                    type="tel"
                    value={formData.companyInfo.contactInfo.phoneNumber}
                    onChange={(e) =>
                      updateNestedFormData(
                        "companyInfo",
                        "contactInfo",
                        "phoneNumber",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telegram
                </label>
                <input
                  type="text"
                  value={formData.companyInfo.contactInfo.telegram}
                  onChange={(e) =>
                    updateNestedFormData(
                      "companyInfo",
                      "contactInfo",
                      "telegram",
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Business Details */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-800">Business Details</h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company name *
                  </label>
                  <input
                    type="text"
                    value={formData.companyInfo.businessDetails.companyName}
                    onChange={(e) =>
                      updateNestedFormData(
                        "companyInfo",
                        "businessDetails",
                        "companyName",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Legal Entity Name *
                  </label>
                  <input
                    type="text"
                    value={formData.companyInfo.businessDetails.legalEntityName}
                    onChange={(e) =>
                      updateNestedFormData(
                        "companyInfo",
                        "businessDetails",
                        "legalEntityName",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trading/DBA Name
                </label>
                <input
                  type="text"
                  value={formData.companyInfo.businessDetails.tradingDBAName}
                  onChange={(e) =>
                    updateNestedFormData(
                      "companyInfo",
                      "businessDetails",
                      "tradingDBAName",
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="If different than Legal Entity Name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Legal Entity Type *
                  </label>
                  <select
                    value={formData.companyInfo.businessDetails.legalEntityType}
                    onChange={(e) =>
                      updateNestedFormData(
                        "companyInfo",
                        "businessDetails",
                        "legalEntityType",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select entity type</option>
                    <option value="LLC">LLC</option>
                    <option value="Corporation">Corporation</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Sole Proprietorship">
                      Sole Proprietorship
                    </option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Legal Entity Registration Number *
                  </label>
                  <input
                    type="text"
                    value={
                      formData.companyInfo.businessDetails.registrationNumber
                    }
                    onChange={(e) =>
                      updateNestedFormData(
                        "companyInfo",
                        "businessDetails",
                        "registrationNumber",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Please upload proof of incorporation or establishment *
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  This should be the incorporation document from your country
                  Company Registry
                </p>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                  <input
                    type="file"
                    id="incorporationDoc"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const success = await handleFileUpload(file);
                        if (!success) {
                          alert("File upload failed. Please try again.");
                        }
                      }
                    }}
                  />
                  <label htmlFor="incorporationDoc" className="cursor-pointer">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      {uploadedFile
                        ? uploadedFile.name
                        : "Click to upload or drag and drop"}
                    </p>
                    <p className="text-xs text-gray-500">
                      PDF, DOC, DOCX, JPG, PNG up to 10MB
                    </p>
                  </label>
                  {uploadedFile && (
                    <div className="mt-2 flex items-center justify-center text-green-600">
                      <Check className="h-4 w-4 mr-1" />
                      <span className="text-sm">
                        File uploaded successfully
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case "transak":
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">
              Your Transak Account
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Please provide a detailed description of your business: *
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Including, but not limited to, usual business activity or daily
                operations
              </p>
              <textarea
                value={formData.transakAccount.businessDescription}
                onChange={(e) =>
                  updateFormData(
                    "transakAccount",
                    "businessDescription",
                    e.target.value
                  )
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purpose of Transak Account *
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Please describe the use-case or intended use of a Transak
                integration.
              </p>
              <textarea
                value={formData.transakAccount.purposeOfAccount}
                onChange={(e) =>
                  updateFormData(
                    "transakAccount",
                    "purposeOfAccount",
                    e.target.value
                  )
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Please explain how your business generates revenue. *
              </label>
              <p className="text-xs text-gray-500 mb-2">
                e.g. charging users a fee, etc.
              </p>
              <textarea
                value={formData.transakAccount.revenueGeneration}
                onChange={(e) =>
                  updateFormData(
                    "transakAccount",
                    "revenueGeneration",
                    e.target.value
                  )
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Will you be taking custody of user funds? *
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="custody"
                    checked={
                      formData.transakAccount.takeCustodyOfFunds === true
                    }
                    onChange={() =>
                      updateFormData(
                        "transakAccount",
                        "takeCustodyOfFunds",
                        true
                      )
                    }
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Yes</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="custody"
                    checked={
                      formData.transakAccount.takeCustodyOfFunds === false
                    }
                    onChange={() =>
                      updateFormData(
                        "transakAccount",
                        "takeCustodyOfFunds",
                        false
                      )
                    }
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">No</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Domain Whitelisting *
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Please provide an exhaustive list of domains where Transak will
                be integrated using your API key.
              </p>
              <textarea
                value={formData.transakAccount.domainWhitelisting}
                onChange={(e) =>
                  updateFormData(
                    "transakAccount",
                    "domainWhitelisting",
                    e.target.value
                  )
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="example.com, staging.example.com, dev.example.com"
                required
              />
            </div>
          </div>
        );

      case "compliance":
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                FCA Financial Promotions Rules
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                From 8 January 2024, the UK Financial Conduct Authority imposed
                new rules on crypto businesses.
              </p>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Do you intend to allow users based in the United Kingdom to
                  purchase crypto via Transak? *
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="ukUsers"
                      checked={formData.fcaRules.allowUKUsers === true}
                      onChange={() =>
                        updateFormData("fcaRules", "allowUKUsers", true)
                      }
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="ukUsers"
                      checked={formData.fcaRules.allowUKUsers === false}
                      onChange={() =>
                        updateFormData("fcaRules", "allowUKUsers", false)
                      }
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">No</span>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Travel Rule Compliance
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                The Travel Rule is a regulation designed to prevent money
                laundering by making sure financial institutions share basic
                information.
              </p>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Is your business required to comply with Travel Rule
                    requirements as an obligated VASP? *
                  </label>
                  <select
                    value={formData.travelRule.requiredToComply}
                    onChange={(e) =>
                      updateFormData(
                        "travelRule",
                        "requiredToComply",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select an option</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Uncertain">Uncertain</option>
                  </select>
                </div>

                {formData.travelRule.requiredToComply === "Yes" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      If so, why?
                    </label>
                    <textarea
                      value={formData.travelRule.complianceReason}
                      onChange={(e) =>
                        updateFormData(
                          "travelRule",
                          "complianceReason",
                          e.target.value
                        )
                      }
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Does your platform operate as a custodial or non-custodial
                    service? *
                  </label>
                  <select
                    value={formData.travelRule.serviceType}
                    onChange={(e) =>
                      updateFormData(
                        "travelRule",
                        "serviceType",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select service type</option>
                    <option value="Custodial">Custodial</option>
                    <option value="Non-custodial">Non-custodial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Can users specify their own wallet addresses when buying or
                    selling crypto? *
                  </label>
                  <select
                    value={formData.travelRule.walletAddressControl}
                    onChange={(e) =>
                      updateFormData(
                        "travelRule",
                        "walletAddressControl",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select an option</option>
                    <option value="User specifies">
                      User specifies their own wallet addresses
                    </option>
                    <option value="System assigns">
                      System exclusively assigns wallet addresses
                    </option>
                    <option value="Both">Both options available</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      case "ownership":
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Director Information
              </h3>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How many Board Directors does your company have? *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.directors.numberOfDirectors}
                  onChange={(e) => {
                    const count = parseInt(e.target.value) || 1;
                    updateFormData("directors", "numberOfDirectors", count);

                    // Update directors list
                    const newDirectors = Array.from(
                      { length: count },
                      (_, i) =>
                        formData.directors.directorsList[i] || {
                          fullName: "",
                          position: "Director",
                        }
                    );
                    updateFormData("directors", "directorsList", newDirectors);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="mt-4 space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Please provide the full name of each Board Director *
                </label>
                {formData.directors.directorsList.map((director, index) => (
                  <div key={index} className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder={`Director ${index + 1} Full Name`}
                      value={director.fullName}
                      onChange={(e) => {
                        const newDirectors = [
                          ...formData.directors.directorsList,
                        ];
                        newDirectors[index] = {
                          ...newDirectors[index],
                          fullName: e.target.value,
                        };
                        updateFormData(
                          "directors",
                          "directorsList",
                          newDirectors
                        );
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <select
                      value={director.position}
                      onChange={(e) => {
                        const newDirectors = [
                          ...formData.directors.directorsList,
                        ];
                        newDirectors[index] = {
                          ...newDirectors[index],
                          position: e.target.value,
                        };
                        updateFormData(
                          "directors",
                          "directorsList",
                          newDirectors
                        );
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Director">Director</option>
                      <option value="Senior Manager">Senior Manager</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Beneficial Ownership Information
              </h3>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How many individuals have at least 25% ownership in the
                  business? *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.beneficialOwners.numberOfOwners}
                  onChange={(e) => {
                    const count = parseInt(e.target.value) || 0;
                    updateFormData("beneficialOwners", "numberOfOwners", count);

                    // Update owners list
                    const newOwners = Array.from(
                      { length: count },
                      (_, i) =>
                        formData.beneficialOwners.ownersList[i] || {
                          fullName: "",
                          ownershipPercentage: 25,
                        }
                    );
                    updateFormData("beneficialOwners", "ownersList", newOwners);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {formData.beneficialOwners.numberOfOwners > 0 && (
                <div className="mt-4 space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Beneficial Owner Details
                  </label>
                  {formData.beneficialOwners.ownersList.map((owner, index) => (
                    <div key={index} className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder={`Owner ${index + 1} Full Name`}
                        value={owner.fullName}
                        onChange={(e) => {
                          const newOwners = [
                            ...formData.beneficialOwners.ownersList,
                          ];
                          newOwners[index] = {
                            ...newOwners[index],
                            fullName: e.target.value,
                          };
                          updateFormData(
                            "beneficialOwners",
                            "ownersList",
                            newOwners
                          );
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      <div className="relative">
                        <input
                          type="number"
                          min="25"
                          max="100"
                          placeholder="Ownership %"
                          value={owner.ownershipPercentage}
                          onChange={(e) => {
                            const newOwners = [
                              ...formData.beneficialOwners.ownersList,
                            ];
                            newOwners[index] = {
                              ...newOwners[index],
                              ownershipPercentage:
                                parseInt(e.target.value) || 25,
                            };
                            updateFormData(
                              "beneficialOwners",
                              "ownersList",
                              newOwners
                            );
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                        <span className="absolute right-3 top-2 text-gray-500">
                          %
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Authorized Signatory Information
              </h3>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How many authorized signatories would you like to add? *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.authorizedSignatories.numberOfSignatories}
                  onChange={(e) => {
                    const count = parseInt(e.target.value) || 1;
                    updateFormData(
                      "authorizedSignatories",
                      "numberOfSignatories",
                      count
                    );

                    // Update signatories list
                    const newSignatories = Array.from(
                      { length: count },
                      (_, i) =>
                        formData.authorizedSignatories.signatoriesList[i] || {
                          fullName: "",
                          position: "",
                          email: "",
                        }
                    );
                    updateFormData(
                      "authorizedSignatories",
                      "signatoriesList",
                      newSignatories
                    );
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="mt-4 space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Authorized Signatory Details
                </label>
                {formData.authorizedSignatories.signatoriesList.map(
                  (signatory, index) => (
                    <div key={index} className="grid grid-cols-3 gap-4">
                      <input
                        type="text"
                        placeholder={`Signatory ${index + 1} Full Name`}
                        value={signatory.fullName}
                        onChange={(e) => {
                          const newSignatories = [
                            ...formData.authorizedSignatories.signatoriesList,
                          ];
                          newSignatories[index] = {
                            ...newSignatories[index],
                            fullName: e.target.value,
                          };
                          updateFormData(
                            "authorizedSignatories",
                            "signatoriesList",
                            newSignatories
                          );
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Position"
                        value={signatory.position}
                        onChange={(e) => {
                          const newSignatories = [
                            ...formData.authorizedSignatories.signatoriesList,
                          ];
                          newSignatories[index] = {
                            ...newSignatories[index],
                            position: e.target.value,
                          };
                          updateFormData(
                            "authorizedSignatories",
                            "signatoriesList",
                            newSignatories
                          );
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={signatory.email}
                        onChange={(e) => {
                          const newSignatories = [
                            ...formData.authorizedSignatories.signatoriesList,
                          ];
                          newSignatories[index] = {
                            ...newSignatories[index],
                            email: e.target.value,
                          };
                          updateFormData(
                            "authorizedSignatories",
                            "signatoriesList",
                            newSignatories
                          );
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        );

      case "final":
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">
              Further Questions
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Have you, your organization, or any of its officers, directors,
                key employees, or majority shareholders ever: *
              </label>
              <p className="text-xs text-gray-600 mb-3">
                - Been convicted of (or currently part) of any civil litigation
                or criminal complaints?
                <br />
                - Declared bankruptcy?
                <br />- Been issued regulatory fines or sanctions, or are
                currently part of any regulatory investigations?
              </p>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="legalIssues"
                    checked={formData.furtherQuestions.legalIssues === false}
                    onChange={() =>
                      updateFormData("furtherQuestions", "legalIssues", false)
                    }
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">No</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="legalIssues"
                    checked={formData.furtherQuestions.legalIssues === true}
                    onChange={() =>
                      updateFormData("furtherQuestions", "legalIssues", true)
                    }
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Yes</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Have any of the directors, key employees, officers, or majority
                shareholders in your organization been identified as Politically
                Exposed Persons (PEPs)? *
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="politicalExposure"
                    checked={
                      formData.furtherQuestions.politicalExposure === false
                    }
                    onChange={() =>
                      updateFormData(
                        "furtherQuestions",
                        "politicalExposure",
                        false
                      )
                    }
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">No</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="politicalExposure"
                    checked={
                      formData.furtherQuestions.politicalExposure === true
                    }
                    onChange={() =>
                      updateFormData(
                        "furtherQuestions",
                        "politicalExposure",
                        true
                      )
                    }
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Yes</span>
                </label>
              </div>
            </div>

            <div>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={formData.furtherQuestions.prohibitedActivities}
                  onChange={(e) =>
                    updateFormData(
                      "furtherQuestions",
                      "prohibitedActivities",
                      e.target.checked
                    )
                  }
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  By checking this box, you confirm that your business does not
                  participate in prohibited activities such as intellectual
                  property infringement, gambling, illegal products, adult
                  content, high-risk businesses, etc. *
                </span>
              </label>
            </div>
          </div>
        );

      case "review":
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">
              Review & Submit
            </h3>

            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-medium text-gray-800 mb-4">
                Application Summary
              </h4>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium">Company:</span>{" "}
                  {formData.companyInfo.businessDetails.companyName}
                </div>
                <div>
                  <span className="font-medium">Legal Entity:</span>{" "}
                  {formData.companyInfo.businessDetails.legalEntityName}
                </div>
                <div>
                  <span className="font-medium">Contact Email:</span>{" "}
                  {formData.companyInfo.contactInfo.email}
                </div>
                <div>
                  <span className="font-medium">Registration Number:</span>{" "}
                  {formData.companyInfo.businessDetails.registrationNumber}
                </div>
                <div>
                  <span className="font-medium">Number of Directors:</span>{" "}
                  {formData.directors.numberOfDirectors}
                </div>
                <div>
                  <span className="font-medium">Beneficial Owners:</span>{" "}
                  {formData.beneficialOwners.numberOfOwners}
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-yellow-800">
                    Before Submitting
                  </h4>
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>
                        Please ensure all information is accurate and complete
                      </li>
                      <li>Review all uploaded documents</li>
                      <li>Allow 2-3 business days for review</li>
                      <li>
                        You will be contacted via the email address provided
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {submitStatus === "success" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex">
                  <Check className="h-5 w-5 text-green-400" />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-green-800">
                      Application Submitted Successfully!
                    </h4>
                    <p className="mt-1 text-sm text-green-700">
                      Your KYB application has been submitted for review. You
                      will receive an email confirmation shortly.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {submitStatus === "error" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-red-800">
                      Submission Failed
                    </h4>
                    <p className="mt-1 text-sm text-red-700">
                      There was an error submitting your application. Please try
                      again or contact support.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                By submitting this application, I certify that all the
                information provided above is true and I confirm that I have the
                authority to open this account. I also understand that Transak
                might require and request additional information to comply with
                AML/CFT regulations.
              </p>
            </div>
          </div>
        );

      default:
        return <div>Invalid section</div>;
    }
  };

  const isCurrentSectionValid = validateCurrentSection();
  const isLastSection = currentSection === sections.length - 1;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="w-[30rem] h-[80vh] bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100 bg-white">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-xl font-medium text-gray-900">
            Know Your Business (KYB) Application
          </h2>
          <div className="w-9 h-9" />
        </div>

        {/* Progress indicator */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900">
              {sections[currentSection].title}
            </span>
            <span className="text-sm text-gray-500">
              Step {currentSection + 1} of {sections.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentSection + 1) / sections.length) * 100}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(80vh-16rem)] overflow-y-auto">
          {renderSection()}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-white">
          <div className="flex items-center justify-between">
            <button
              onClick={prevSection}
              disabled={currentSection === 0}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex gap-2">
              {!isLastSection ? (
                <button
                  onClick={nextSection}
                  disabled={!isCurrentSectionValid}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={submitKYBForm}
                  disabled={
                    !isCurrentSectionValid ||
                    isSubmitting ||
                    submitStatus === "success"
                  }
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? "Submitting..."
                    : submitStatus === "success"
                    ? "Submitted"
                    : "Submit Application"}
                </button>
              )}
            </div>
          </div>

          {/* Powered by Transak */}
          <TransakFooter className="text-center mt-4" />
        </div>
      </div>
    </div>
  );
}
