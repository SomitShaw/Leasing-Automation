const express = require("express");
const multer = require("multer");
const axios = require("axios");
const xsenv = require("@sap/xsenv");
const xssec = require("@sap/xssec");
const passport = require("passport");
const { retrieveJwt } = require("@sap-cloud-sdk/connectivity");
const { executeHttpRequest } = require("@sap-cloud-sdk/http-client");
const fs = require("fs");

const app = express();
const upload = multer({ dest: "uploads/" });

// Load environment variables for destinations
xsenv.loadEnv();

// Middleware for BTP authentication
passport.use("JWT", new xssec.JWTStrategy(xsenv.getServices({ uaa: { tag: "xsuaa" } }).uaa));
app.use(passport.initialize());
app.use(passport.authenticate("JWT", { session: false }));

// Endpoint for uploading file and calling DOX
app.post("/api/upload-to-dox", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path;

    // Retrieve JWT token for destination access
    const jwt = retrieveJwt(req);

    // Use SAP Cloud SDK to call the destination
    const destinationResult = await executeHttpRequest(
      { destinationName: "DOX_API_DESTINATION", jwt: jwt },
      {
        method: "POST",
        url: "/v1/document/jobs",
        data: fs.readFileSync(filePath),
        headers: {
          "Content-Type": "application/pdf"
        }
      }
    );

    // Extract relevant fields from DOX response
    const extractedData = {
      contractType: destinationResult.data.fields.contractType,
      effectiveDate: destinationResult.data.fields.effectiveDate,
      expiryDate: destinationResult.data.fields.expiryDate
    };

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    // Send extracted data back to the frontend
    res.json({ success: true, extracted: extractedData });
  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(3000, () => {
  console.log("Backend server running on port 3000");
});
