const express = require("express");
const multer = require("multer");
const axios = require("axios");
const fs = require("fs");
require("dotenv").config();  // To load environment variables

const app = express();
const upload = multer({ dest: "uploads/" });

// Middleware to parse JSON bodies (for documentType, schema, and schemaVersion)
app.use(express.json());

// Endpoint for uploading file and calling DOX
app.post("/api/upload-to-dox", upload.single("file"), async (req, res) => {
  try {
    // Retrieve the document type, schema, and schema version from the request body (or use default values)
    const documentType = req.body.documentType || process.env.DOCUMENT_TYPE || "invoice"; // Default to "invoice"
    const schema = req.body.schema || process.env.SCHEMA || "default"; // Default to "default"
    const schemaVersion = req.body.schemaVersion || process.env.SCHEMA_VERSION || "1.0"; // Default to "1.0"

    const filePath = req.file.path;

    // Retrieve DOX destination from environment variables
    const url = process.env.DOX_API_URL; // Base URL of the DOX service
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;
    const tokenUrl = process.env.TOKEN_URL;

    // Get OAuth token using client credentials (OAuth2 Client Credentials Flow)
    const authResponse = await axios.post(
      tokenUrl,
      `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    const accessToken = authResponse.data.access_token;

    // Read the file and send to DOX API
    const fileData = fs.readFileSync(filePath);

    // Send request to DOX
    const response = await axios.post(
      `${url}/v1/document/jobs`, // Adjust the path as needed
      {
        file: fileData,
        documentType: documentType,
        schema: schema,
        schemaVersion: schemaVersion // Added schemaVersion
      },
      {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      }
    );

    // Map DOX response to your field names
    const extractedData = {
      contractType: response.data.fields.contractType,
      effectiveDate: response.data.fields.effectiveDate,
      expiryDate: response.data.fields.expiryDate
    };

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    // Send extracted data back to frontend
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
