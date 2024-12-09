const express = require("express");
const multer = require("multer");
const xsenv = require("@sap/xsenv");
const axios = require("axios");
const app = express();

xsenv.loadEnv();
const services = xsenv.getServices({ destination: { tag: "destination" } });

const upload = multer();
app.use(express.json());

// Endpoint for DOX POST
app.post("/api/upload-to-dox", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).send({
        success: false,
        message: "No file uploaded",
        metadata: {
          documentType: null,
          schema: null,
          schemaVersion: null,
        },
      });
    }

    // Sample DOX API Call
    const response = await axios.post(
      process.env.DOX_API_URL,
      {
        file: file.buffer.toString("base64"), // Send as base64
        metadata: {
          documentType: "contract",
          schema: "contractSchema",
          schemaVersion: "1.0",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${await getToken()}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.send({
      success: true,
      extracted: {
        contractType: response.data.contractType,
        effectiveDate: response.data.effectiveDate,
        expiryDate: response.data.expiryDate,
      },
      metadata: {
        documentType: "contract",
        schema: "contractSchema",
        schemaVersion: "1.0",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({
      success: false,
      message: "Error in processing file",
      metadata: {
        documentType: "contract",
        schema: "contractSchema",
        schemaVersion: "1.0",
      },
    });
  }
});

// Function to retrieve token
async function getToken() {
  const { data } = await axios.post(process.env.TOKEN_URL, null, {
    auth: {
      username: process.env.CLIENT_ID,
      password: process.env.CLIENT_SECRET,
    },
  });
  return data.access_token;
}

// Health Check
app.get("/api/health", (req, res) => {
  res.send({
    success: true,
    message: "Service is running",
    metadata: {
      documentType: "healthCheck",
      schema: "healthSchema",
      schemaVersion: "1.0",
    },
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
