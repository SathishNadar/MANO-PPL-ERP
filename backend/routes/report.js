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










export default router;
