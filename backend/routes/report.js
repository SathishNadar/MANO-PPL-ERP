import express from "express";
import * as DB from "./database.js"

const router = express.Router();

// Post call to Insert DPR
router.post("/insertDPR", async (req, res) => {
  try {
    const {
      project_id,
      report_date,
      site_condition = null,
      labour_report = null,
      cumulative_manpower = 0,
      today_prog = null,
      tomorrow_plan = null,
      user_roles = null,
      report_footer = null,
      created_at = new Date()
    } = req.body || {};
    
    if (!project_id || !report_date) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    const insertId = await DB.r_insertDPR({
      project_id,
      report_date,
      site_condition,
      labour_report,
      cumulative_manpower,
      today_prog,
      tomorrow_plan,
      user_roles,
      report_footer,
      created_at
    });
    
    res.json({ success: true, insertId });
    
  } catch (error) {
    console.error("Error inserting DPR:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get call to fetch DPR
router.get("/getDPR/:id", async (req, res) => {
  try {
    const dpr_id = parseInt(req.params.id, 10);
    if (isNaN(dpr_id)) {
      return res.status(400).json({ message: "Invalid DPR ID" });
    }
    
    const dprData = await DB.r_getDPRById(dpr_id);
    if (!dprData) {
            return res.status(404).json({ message: "DPR not found" });
        }

        res.json({ success: true, data: dprData });
    } catch (error) {
        console.error("❌ API error in getDPR:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Post call to update an existing DPR
router.post("/updateDPR", async (req, res) => {
    try {
        const {
            dpr_id,
            project_id,
            report_date,
            site_condition = null,
            labour_report = null,
            cumulative_manpower = 0,
            today_prog = null,
            tomorrow_plan = null,
            user_roles = null,
            report_footer = null,
            created_at = null
        } = req.body || {};

        if (!dpr_id || !project_id || !report_date) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const affectedRows = await DB.r_updateDPR({
            dpr_id,
            project_id,
            report_date,
            site_condition,
            labour_report,
            cumulative_manpower,
            today_prog,
            tomorrow_plan,
            user_roles,
            report_footer,
            created_at
        });

        if (affectedRows === 0) {
            return res.status(404).json({ message: "No DPR found to update" });
        }

        res.json({ success: true, updated: affectedRows });
    } catch (error) {
        console.error("❌ API error in updateDPR:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
