const mongoose = require("mongoose");

// Director/Senior Manager Schema
const directorSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  position: {
    type: String,
    required: true,
    enum: ["Director", "Senior Manager"],
  },
});

// Beneficial Owner Schema
const beneficialOwnerSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  ownershipPercentage: {
    type: Number,
    required: true,
    min: 25,
    max: 100,
  },
});

// Authorized Signatory Schema
const authorizedSignatorySchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  position: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
});

// Main KYB Schema
const kybSchema = new mongoose.Schema(
  {
    // Link to user who completed KYC
    userId: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },

    // Acknowledgments
    acknowledgments: {
      hasTransakAccount: {
        type: Boolean,
        required: true,
        default: false,
      },
      understandsBusinessForm: {
        type: Boolean,
        required: true,
        default: false,
      },
      noICOConfirmation: {
        type: Boolean,
        required: true,
        default: false,
      },
    },

    // Company/Business Information
    companyInfo: {
      contactInfo: {
        firstName: {
          type: String,
          required: true,
          trim: true,
        },
        lastName: {
          type: String,
          required: true,
          trim: true,
        },
        email: {
          type: String,
          required: true,
          trim: true,
        },
        phoneNumber: {
          type: String,
          required: true,
          trim: true,
        },
        telegram: {
          type: String,
          trim: true,
        },
      },
      businessDetails: {
        companyName: {
          type: String,
          required: true,
          trim: true,
        },
        legalEntityName: {
          type: String,
          required: true,
          trim: true,
        },
        tradingDBAName: {
          type: String,
          trim: true,
        },
        legalEntityType: {
          type: String,
          required: true,
          enum: [
            "LLC",
            "Corporation",
            "Partnership",
            "Sole Proprietorship",
            "Other",
          ],
        },
        registrationNumber: {
          type: String,
          required: true,
          trim: true,
        },
        incorporationDocument: {
          type: String, // File path
          required: true,
        },
        companyRegistryLink: {
          type: String,
          required: true,
          trim: true,
        },
        registeredAddress: {
          type: String,
          required: true,
          trim: true,
        },
        website: {
          type: String,
          required: true,
          trim: true,
        },
        isWebsiteLive: {
          type: Boolean,
          required: true,
        },
        establishmentDate: {
          type: Date,
          required: true,
        },
        countryOfRegistration: {
          type: String,
          required: true,
          trim: true,
        },
        businessOutsideCountry: {
          type: Boolean,
          required: true,
        },
        businessCategory: {
          type: String,
          required: true,
          enum: [
            "Financial Services",
            "Technology/Software",
            "E-commerce",
            "Gaming",
            "Trading/Investment",
            "Other",
          ],
        },
        projectedMonthlyTransactions: {
          type: String,
          required: true,
          enum: [
            "Less than $10,000",
            "$10,000 - $50,000",
            "$50,000 - $100,000",
            "$100,000 - $500,000",
            "More than $500,000",
          ],
        },
      },
    },

    // Transak Account Information
    transakAccount: {
      businessDescription: {
        type: String,
        required: true,
        trim: true,
      },
      purposeOfAccount: {
        type: String,
        required: true,
        trim: true,
      },
      revenueGeneration: {
        type: String,
        required: true,
        trim: true,
      },
      takeCustodyOfFunds: {
        type: Boolean,
        required: true,
      },
      domainWhitelisting: {
        type: String,
        required: true,
        trim: true,
      },
    },

    // FCA Financial Promotions Rules
    fcaRules: {
      allowUKUsers: {
        type: Boolean,
        required: true,
      },
    },

    // Travel Rule Compliance
    travelRule: {
      requiredToComply: {
        type: String,
        required: true,
        enum: ["Yes", "No", "Uncertain"],
      },
      complianceReason: {
        type: String,
        trim: true,
      },
      serviceType: {
        type: String,
        required: true,
        enum: ["Custodial", "Non-custodial"],
      },
      walletAddressControl: {
        type: String,
        required: true,
        enum: ["User specifies", "System assigns", "Both"],
      },
    },

    // Director Information
    directors: {
      numberOfDirectors: {
        type: Number,
        required: true,
        min: 1,
      },
      directorsList: [directorSchema],
    },

    // Beneficial Ownership Information
    beneficialOwners: {
      numberOfOwners: {
        type: Number,
        required: true,
        min: 0,
      },
      ownersList: [beneficialOwnerSchema],
    },

    // Authorized Signatory Information
    authorizedSignatories: {
      numberOfSignatories: {
        type: Number,
        required: true,
        min: 1,
      },
      signatoriesList: [authorizedSignatorySchema],
    },

    // Further Questions
    furtherQuestions: {
      legalIssues: {
        type: Boolean,
        required: true,
      },
      politicalExposure: {
        type: Boolean,
        required: true,
      },
      prohibitedActivities: {
        type: Boolean,
        required: true,
      },
    },

    // Submission Details
    submissionInfo: {
      submittedAt: {
        type: Date,
        default: Date.now,
      },
      ipAddress: {
        type: String,
      },
      userAgent: {
        type: String,
      },
      status: {
        type: String,
        enum: ["Draft", "Submitted", "Under Review", "Approved", "Rejected"],
        default: "Draft",
      },
      reviewNotes: {
        type: String,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
kybSchema.index({ userId: 1 });
kybSchema.index({ userEmail: 1 });
kybSchema.index({ "submissionInfo.status": 1 });
kybSchema.index({ "submissionInfo.submittedAt": -1 });

module.exports = mongoose.model("KYB", kybSchema);
