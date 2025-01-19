import express from "express";
import fs from "fs";

const router = express.Router();
const jsonFilePath = "./backend/data/dpr.json"; // File path for the DPR data

// Function to read data from the file
function readData() {
  try {
    if (!fs.existsSync(jsonFilePath)) {
      fs.writeFileSync(jsonFilePath, JSON.stringify({}, null, 2)); // Initialize as an empty object if file doesn't exist
    }
    const data = fs.readFileSync(jsonFilePath, "utf8");
    return JSON.parse(data || "{}"); // Parse the JSON or return an empty object if file is empty
  } catch (err) {
    console.error("Error reading file:", err);
    return {}; // Return an empty object on error
  }
}

// Function to write data to the file
function writeData(data) {
  try {
    fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing to file:", err);
    throw new Error("Failed to write data to file");
  }
}

// Route to save a report
router.post("/saveReport", (req, res) => {
  const {
    reportDate,
    reported_by,
    approved_by,
    header_constant,
    labourProgress,
    todaysProgress,
    tomorrowsPlanning,
  } = req.body;

  // Validate required fields
  if (
    !reportDate ||
    !reported_by ||
    !approved_by ||
    !labourProgress ||
    !todaysProgress ||
    !tomorrowsPlanning
  ) {
    return res
      .status(400)
      .json({ message: "Missing required fields in the request body." });
  }


  try {
    const data = readData(); // Read existing data
    data[reportDate] = {
      reported_by,
      approved_by,
      header_constant,
      labourProgress,
      todaysProgress,
      tomorrowsPlanning,
    };

    console.log("Data to Save:", data[reportDate]); // Log the new data to be written

    writeData(data); // Save the data
    res.status(200).json({ message: "Report saved successfully." });
  } catch (err) {
    console.error("Error saving report:", err); // Log the error
    res.status(500).json({ message: "Internal server error." });
  }
});

// Route to retrieve a report
router.get("/getReport", (req, res) => {
  const { reportDate } = req.query;

  // Validate required fields
  if (!reportDate) {
    return res
      .status(400)
      .json({ message: "Report date is required in the query." });
  }

  try {
    const data = readData();

    const report = data[reportDate];

    if (!report) {
      return res
        .status(404)
        .json({ message: `No report found for date: ${reportDate}.` });
    }

    res.status(200).json(report);
  } catch (err) {
    console.error("Error retrieving report:", err);
    res
      .status(500)
      .json({ message: "Internal server error while retrieving report." });
  }
});

export default router;
