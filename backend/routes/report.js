import express from "express";
import * as DB from "./database.js"

const router = express.Router();

// Post call to Insert DPR
router.post("/insertDPR", async (req, res) => {
  try {
    const {
      project_id,
      reported_by,
      report_date,
      site_condition = null,
      agency = null,
      mason = null,
      carp = null,
      fitter = null,
      electrical = null,
      painter = null,
      gypsum = null,
      plumber = null,
      helper = null,
      staff = null,
      remarks = null,
      cumulative_manpower = 0,
      today_prog = null,
      tomorrow_plan = null,
      events_visit = null,
      distribute = null,
      approval = null,
      prepared_by = "Mano Project Pvt. Ltd."
    } = req.body || {};

    if (!project_id || !reported_by || !report_date) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const insertId = await DB.r_insertDPR({
      project_id,
      reported_by,
      report_date,
      site_condition,
      agency,
      mason,
      carp,
      fitter,
      electrical,
      painter,
      gypsum,
      plumber,
      helper,
      staff,
      remarks,
      cumulative_manpower,
      today_prog,
      tomorrow_plan,
      events_visit,
      distribute,
      approval,
      prepared_by
    });

    res.json({ success: true, insertId });

  } catch (error) {
    console.error("Error inserting DPR:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/updateDPR", async (req, res) => {
  try {
    const {
      project_id,
      reported_by,
      report_date,
      site_condition = null,
      agency = null,
      mason = null,
      carp = null,
      fitter = null,
      electrical = null,
      painter = null,
      gypsum = null,
      plumber = null,
      helper = null,
      staff = null,
      remarks = null,
      cumulative_manpower = 0,
      today_prog = null,
      tomorrow_plan = null,
      events_visit = null,
      distribute = null,
      approval = null,
      prepared_by = "Mano Project Pvt. Ltd.",
      dpr_id
    } = req.body || {};

    if (!project_id || !reported_by || !report_date) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const insertId = await DB.r_updateDPR({
      project_id,
      reported_by,
      report_date,
      site_condition,
      agency,
      mason,
      carp,
      fitter,
      electrical,
      painter,
      gypsum,
      plumber,
      helper,
      staff,
      remarks,
      cumulative_manpower,
      today_prog,
      tomorrow_plan,
      events_visit,
      distribute,
      approval,
      prepared_by,
      dpr_id
    });

    res.json({ success: true, insertId });

  } catch (error) {
    console.error("Error inserting DPR:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get call to fetch Project Detail
router.get("/getProject/:id", async (req, res) => {
  try {
    const project_data = await DB.r_fetchProjectByID(req.params['id']);
    res.json({ project_data })
  } catch (error) {
    console.error("Error fetching Project Details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
})

// Post call to add Project Detail
router.post("/addProject", async (req, res) => {
  try {
    const projectData = req.body;

    if (!projectData.project_name || !projectData.start_date || !projectData.end_date) {
      return res.status(400).json({ message: "Project name, start date, and end date are required." });
    }

    const result = await DB.r_insertProject(projectData);

    res.status(201).json({ message: "Project added successfully", project_id: result.insertId });
  } catch (error) {
    console.error("Error adding Project:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});












export default router;
