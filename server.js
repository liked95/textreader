const express = require("express");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const Tesseract = require("tesseract.js");
const morgan = require("morgan");

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));

app.use(express.json({ limit: "50mb" })); // Support large file uploads
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(morgan("dev"));

// Function to extract text from PDFs, DOCX, and images
async function extractTextFromFile(buffer, filename) {
    const ext = path.extname(filename).toLowerCase();

    try {
        if (ext === ".pdf") {
            const data = await pdfParse(buffer);
            return data.text || "No text found in PDF.";
        } else if (ext === ".docx") {
            const data = await mammoth.extractRawText({ buffer });
            return data.value || "No text found in DOCX.";
        } else if ([".png", ".jpg", ".jpeg"].includes(ext)) {
            const { data } = await Tesseract.recognize(buffer, "eng");
            return data.text || "No text found in Image.";
        } else {
            return "Unsupported file type.";
        }
    } catch (error) {
        return `Error extracting text: ${error.message}`;
    }
}

app.get("/api/test", (req, res) => {
    res.json({ message: "Hello from the server!" });
})

// Webhook endpoint to receive binary data from n8n
app.post("/process-attachments", async (req, res) => {
    const { data: attachments } = req.body;

    if (attachments && typeof attachments === "object") {
        // Convert the object into an array
        const attachmentsArray = Object.values(attachments);

        if (!attachmentsArray.length) {
            return res.status(400).send("No valid attachments found.");
        }

        try {
            let extractedContent = "";

            // Loop through attachments and extract content
            for (const attachment of attachmentsArray) {
                const { fileName, data } = attachment;

                if (!fileName || !data) {
                    continue; // Skip attachments that are missing data or fileName
                }

                // Decode base64 data
                const fileBuffer = Buffer.from(data, "base64");

                // Extract text
                const extractedText = await extractTextFromFile(fileBuffer, fileName);
                extractedContent += `File: ${fileName}\n${extractedText}\n\n`;
            }

            // Return the concatenated extracted content
            res.json({ content: extractedContent });
        } catch (error) {
            res.status(500).send("Error processing attachments: " + error.message);
        }
    } else {
        return res.status(400).send("Invalid or missing attachments object.");
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});