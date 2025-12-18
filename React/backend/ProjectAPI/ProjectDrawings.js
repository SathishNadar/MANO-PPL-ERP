import express from "express";
import multer from "multer";
import { knexDB } from "../Database.js";
import {
  uploadFile,
  getFileUrl,
  deleteFile
} from "../s3/s3Service.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get all drawings for a project
router.get("/drawings/:project_id", async (req, res) => {
  try {
    const project_id = parseInt(req.params.project_id, 10);

    if (Number.isNaN(project_id)) {
      return res.status(400).json({ ok: false, message: "Invalid project_id" });
    }

    const rows = await knexDB("project_drawing_management")
      .where({ project_id })
      .orderBy(["drawing_type", "drawing_no"]);

    const data = [];

    for (const row of rows) {
      let drawing_file = null;

      if (row.drawing_key) {
        const { url } = await getFileUrl({
          key: row.drawing_key,
          directory: `drawings/${row.project_id}`
        });
        drawing_file = url;
      }

      data.push({
        ...row,
        drawing_file
      });
    }

    res.json({ ok: true, data });
  } catch (error) {
    console.error("Fetch drawings error:", error);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});

// Add Drawing
router.post(
  "/add/:project_id",
  upload.single("file"),
  async (req, res) => {
    try {
      const project_id = parseInt(req.params.project_id, 10);
      const file = req.file;

      let drawing_key = null;

      if (file) {
        drawing_key = `${Date.now()}_${file.originalname}`;

        await uploadFile({
          fileBuffer: file.buffer,
          key: drawing_key,
          directory: `drawings/${project_id}`,
          contentType: file.mimetype
        });
      }

      await knexDB("project_drawing_management").insert({
        project_id,
        drawing_no: req.body.drawing_no,
        drawing_date: req.body.drawing_date,
        drawing_title: req.body.drawing_title,
        drawing_type: req.body.drawing_type,
        revision: req.body.revision || null,
        received_date: req.body.received_date || null,
        hard_copy: req.body.hard_copy || 0,
        soft_copy: file ? 1 : 0,
        remarks: req.body.remarks,
        drawing_key
      });

      res.status(201).json({ ok: true, message: "Drawing added successfully" });
    } catch (error) {
      console.error("Add drawing error:", error);
      res.status(500).json({ ok: false, message: "Internal server error" });
    }
  }
);

// Update Drawing
router.put(
  "/update/:drawing_id",
  upload.single("file"),
  async (req, res) => {
    try {
      const drawing_id = parseInt(req.params.drawing_id, 10);
      const file = req.file;

      const drawing = await knexDB("project_drawing_management")
        .where({ drawing_id })
        .first();

      if (!drawing) {
        return res.status(404).json({ ok: false, message: "Drawing not found" });
      }

      let drawing_key = drawing.drawing_key;

      if (file) {
        if (drawing_key) {
          await deleteFile({
            key: drawing_key,
            directory: `drawings/${drawing.project_id}`
          });
        }

        drawing_key = `${Date.now()}_${file.originalname}`;

        await uploadFile({
          fileBuffer: file.buffer,
          key: drawing_key,
          directory: `drawings/${drawing.project_id}`,
          contentType: file.mimetype
        });
      }

      await knexDB("project_drawing_management")
        .where({ drawing_id })
        .update({
          drawing_no: req.body.drawing_no,
          drawing_date: req.body.drawing_date,
          drawing_title: req.body.drawing_title,
          drawing_type: req.body.drawing_type,
          revision: req.body.revision,
          received_date: req.body.received_date,
          hard_copy: req.body.hard_copy,
          soft_copy: req.body.soft_copy ?? (file ? 1 : drawing.soft_copy),
          remarks: req.body.remarks,
          drawing_key,
          updated_at: knexDB.fn.now()
        });

      res.json({ ok: true, message: "Drawing updated successfully" });
    } catch (error) {
      console.error("Update drawing error:", error);
      res.status(500).json({ ok: false, message: "Internal server error" });
    }
  }
);

// Delete Drawing
router.delete("/delete/:drawing_id", async (req, res) => {
  try {
    const drawing_id = parseInt(req.params.drawing_id, 10);

    const drawing = await knexDB("project_drawing_management")
      .where({ drawing_id })
      .first();

    if (!drawing) {
      return res.status(404).json({ ok: false, message: "Drawing not found" });
    }

    if (drawing.drawing_key) {
      await deleteFile({
        key: drawing.drawing_key,
        directory: `drawings/${drawing.project_id}`
      });
    }

    await knexDB("project_drawing_management")
      .where({ drawing_id })
      .del();

    res.json({ ok: true, message: "Drawing deleted successfully" });
  } catch (error) {
    console.error("Delete drawing error:", error);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});

export default router;
