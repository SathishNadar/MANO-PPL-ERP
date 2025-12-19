import express from "express";
import { knexDB } from "../Database.js";

const router = express.Router();

//Fetch Planned vs Achieved Drawings Report
router.get("/report/:project_id", async (req, res) => {
  try {
    const project_id = parseInt(req.params.project_id, 10);

    if (Number.isNaN(project_id)) {
      return res.status(400).json({ ok: false, message: "Invalid project_id" });
    }

    const rows = await knexDB("project_drawing_planned_achieved")
      .where({ project_id })
      .orderBy([
        { column: "drawing_type", order: "asc" },
        { column: "drawing_name", order: "asc" }
      ]);

    res.json({
      ok: true,
      data: rows
    });
  } catch (error) {
    console.error("Fetch planned vs achieved report error:", error);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});


//Insert Planned vs Achieved Drawings Report
router.post("/add/:project_id", async (req, res) => {
  try {
    const project_id = parseInt(req.params.project_id, 10);

    const {
      drawing_type,
      drawing_name,
      planned_date,
      received_date,
      remarks
    } = req.body;

    if (!drawing_type || !drawing_name) {
      return res.status(400).json({
        ok: false,
        message: "drawing_type and drawing_name are required"
      });
    }

    await knexDB("project_drawing_planned_achieved").insert({
      project_id,
      drawing_type,
      drawing_name,
      planned_date,
      received_date,
      remarks
    });

    res.status(201).json({
      ok: true,
      message: "Drawing report added successfully"
    });
  } catch (error) {
    console.error("Insert planned vs achieved error:", error);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});

//Update Planned vs Achieved Drawings Report
router.put("/update/:drawing_pa_id", async (req, res) => {
  try {
    const drawing_pa_id = parseInt(req.params.drawing_pa_id, 10);

    const {
      drawing_type,
      drawing_name,
      planned_date,
      received_date,
      remarks
    } = req.body;

    const exists = await knexDB("project_drawing_planned_achieved")
      .where({ drawing_pa_id })
      .first();

    if (!exists) {
      return res.status(404).json({
        ok: false,
        message: "Record not found"
      });
    }

    await knexDB("project_drawing_planned_achieved")
      .where({ drawing_pa_id })
      .update({
        drawing_type,
        drawing_name,
        planned_date,
        received_date,
        remarks,
        updated_at: knexDB.fn.now()
      });

    res.json({
      ok: true,
      message: "Drawing report updated successfully"
    });
  } catch (error) {
    console.error("Update planned vs achieved error:", error);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});

//Delete Planned vs Achieved Drawings Report
router.delete("/delete/:drawing_pa_id", async (req, res) => {
  try {
    const drawing_pa_id = parseInt(req.params.drawing_pa_id, 10);

    const exists = await knexDB("project_drawing_planned_achieved")
      .where({ drawing_pa_id })
      .first();

    if (!exists) {
      return res.status(404).json({
        ok: false,
        message: "Record not found"
      });
    }

    await knexDB("project_drawing_planned_achieved")
      .where({ drawing_pa_id })
      .del();

    res.json({
      ok: true,
      message: "Record deleted successfully"
    });
  } catch (error) {
    console.error("Delete planned vs achieved error:", error);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});

export default router;
