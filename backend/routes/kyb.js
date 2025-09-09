const express = require("express");
const multer = require("multer");
const path = require("path");
const KYB = require("../models/KYB");

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Save uploads under backend/uploads to match static serving path
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept only PDF, DOC, DOCX, and image files
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only JPEG, PNG, GIF, PDF, DOC, and DOCX files are allowed."
        )
      );
    }
  },
});

// GET /api/kyb/user/:userId - Get KYB form data for a user
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const kybData = await KYB.findOne({ userId });

    if (!kybData) {
      return res
        .status(404)
        .json({ message: "KYB form not found for this user" });
    }

    res.json(kybData);
  } catch (error) {
    console.error("Error fetching KYB data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/kyb/create - Create new KYB form
router.post("/create", async (req, res) => {
  try {
    // Insert or fully replace the KYB document for this userId and partnerUserId
    const { userId, partnerUserId } = req.body;
    if (!userId || !partnerUserId) {
      return res
        .status(400)
        .json({ error: "userId and partnerUserId are required" });
    }
    const saved = await KYB.findOneAndUpdate({ userId }, req.body, {
      new: true,
      upsert: true,
      runValidators: false,
      setDefaultsOnInsert: true,
    });
    res.status(201).json(saved);
  } catch (error) {
    console.error("Error creating KYB:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        error: "Validation error",
        details: error.errors,
      });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/kyb/update/:userId - Update existing KYB form
router.put("/update/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    if (!updateData.partnerUserId) {
      return res.status(400).json({ error: "partnerUserId is required" });
    }
    const updatedKYB = await KYB.findOneAndUpdate(
      { userId },
      { $set: updateData },
      // Allow saving draft/partial data and create if not exists
      { new: true, runValidators: false, upsert: true }
    );
    if (!updatedKYB) {
      return res
        .status(404)
        .json({ message: "KYB form not found for this user" });
    }
    res.json(updatedKYB);
  } catch (error) {
    console.error("Error updating KYB:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        error: "Validation error",
        details: error.errors,
      });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/kyb/upload/:userId - Upload incorporation document
router.post(
  "/upload/:userId",
  upload.single("incorporationDocument"),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { userEmail } = req.body;

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Do not write to DB here. Only return file metadata.
      res.json({
        message: "File uploaded successfully",
        filePath: req.file.path,
        fileName: req.file.filename,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /api/kyb/submit/:userId - Submit KYB form for review
router.post("/submit/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { ipAddress, userAgent } = req.body;

    const updatedKYB = await KYB.findOneAndUpdate(
      { userId },
      {
        $set: {
          "submissionInfo.status": "Submitted",
          "submissionInfo.submittedAt": new Date(),
          "submissionInfo.ipAddress": ipAddress,
          "submissionInfo.userAgent": userAgent,
        },
      },
      { new: true }
    );

    if (!updatedKYB) {
      return res
        .status(404)
        .json({ message: "KYB form not found for this user" });
    }

    res.json({
      message: "KYB form submitted successfully",
      submissionId: updatedKYB._id,
      status: "Submitted",
    });
  } catch (error) {
    console.error("Error submitting KYB:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/kyb/all - Get all KYB submissions (admin route)
router.get("/all", async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = status ? { "submissionInfo.status": status } : {};

    const kybForms = await KYB.find(query)
      .select("-__v")
      .sort({ "submissionInfo.submittedAt": -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await KYB.countDocuments(query);

    res.json({
      kybForms,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalForms: total,
    });
  } catch (error) {
    console.error("Error fetching all KYB forms:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/kyb/stats - Get KYB statistics
router.get("/stats", async (req, res) => {
  try {
    const stats = await KYB.aggregate([
      {
        $group: {
          _id: "$submissionInfo.status",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalSubmissions = await KYB.countDocuments();

    res.json({
      totalSubmissions,
      statusBreakdown: stats,
    });
  } catch (error) {
    console.error("Error fetching KYB stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
