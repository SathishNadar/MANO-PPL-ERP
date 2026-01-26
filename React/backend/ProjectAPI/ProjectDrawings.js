import express from "express";
import multer from "multer";
import { knexDB } from "../Database.js";
import { authenticateJWT } from "../AuthAPI/LoginAPI.js";
import {
  uploadFile,
  getFileUrl,
  deleteFile
} from "../s3/s3Service.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get all drawings for a project
router.get("/drawings/:project_id", authenticateJWT, async (req, res) => {
  try {
    const project_id = parseInt(req.params.project_id, 10);

    if (Number.isNaN(project_id)) {
      return res.status(400).json({ ok: false, message: "Invalid project_id" });
    }

    const rows = await knexDB("project_drawing_management as d")
      .where("d.project_id", project_id)
      .whereRaw(`
        d.revision = (
          SELECT MAX(d2.revision)
          FROM project_drawing_management d2
          WHERE d2.project_id = d.project_id
          AND d2.drawing_no = d.drawing_no
        )
      `)
      .orderBy(["d.drawing_type", "d.drawing_no"]);

    const data = [];

    for (const row of rows) {
      let preview_url = null;
      let download_url = null;

      if (row.drawing_key) {
        const preview = await getFileUrl({
          key: row.drawing_key,
          directory: `drawings/${row.project_id}`,
          mode: "preview",
        });

        const download = await getFileUrl({
          key: row.drawing_key,
          directory: `drawings/${row.project_id}`,
          mode: "download",
        });

        preview_url = preview.url;
        download_url = download.url;
      }

      data.push({
        ...row,
        preview_url,
        download_url,
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
  authenticateJWT,
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

      // Parse revision: if provided as "R1" format, extract number; otherwise default to 1
      let revision = 1;
      if (req.body.revision) {
        const revisionStr = req.body.revision.toString().trim();
        if (revisionStr.startsWith('R') || revisionStr.startsWith('r')) {
          const num = parseInt(revisionStr.substring(1), 10);
          revision = isNaN(num) ? 1 : num;
        } else {
          const num = parseInt(revisionStr, 10);
          revision = isNaN(num) ? 1 : num;
        }
      }

      // Auto-generate drawing number based on type if not provided
      let drawing_no = req.body.drawing_no || '';
      const drawing_type = req.body.drawing_type || 'OTHER';

      if (!drawing_no || drawing_no.trim() === '') {
        // Get prefix based on drawing type
        const typePrefixes = {
          'ARCHITECTURAL DRAWING': 'A',
          'STRUCTURAL DRAWING': 'S',
          'MEP DRAWING': 'M',
          'CIVIL DRAWING': 'C',
          'OTHER': 'O'
        };

        const prefix = typePrefixes[drawing_type] || 'O';

        // Get count of existing drawings of this type for this project
        const existingCount = await knexDB("project_drawing_management")
          .where({ project_id, drawing_type })
          .count('* as count')
          .first();

        // Handle different count return formats (MySQL vs PostgreSQL)
        const count = typeof existingCount?.count === 'object'
          ? parseInt(existingCount.count[Object.keys(existingCount.count)[0]], 10)
          : parseInt(existingCount?.count || 0, 10);

        const nextNumber = count + 1;
        drawing_no = `${prefix}${nextNumber}`;
      }

      await knexDB("project_drawing_management").insert({
        project_id,
        drawing_no: drawing_no,
        drawing_date: req.body.drawing_date,
        drawing_title: req.body.drawing_title,
        drawing_type: drawing_type,
        revision: revision,
        received_date: req.body.received_date || null,
        hard_copy: req.body.hard_copy || 0,
        soft_copy: file ? 1 : 0,
        remarks: req.body.remarks || '',
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
  authenticateJWT,
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

      if (file) {
        // 🔎 Get latest revision for SAME drawing_no
        const latest = await knexDB("project_drawing_management")
          .where({
            project_id: drawing.project_id,
            drawing_no: drawing.drawing_no
          })
          .max("revision as r")
          .first();

        const nextRevision =
          latest.r === null ? 0 : latest.r + 1;


        // Upload new file (DO NOT delete old one)
        const drawing_key = `${Date.now()}_${file.originalname}`;

        await uploadFile({
          fileBuffer: file.buffer,
          key: drawing_key,
          directory: `drawings/${drawing.project_id}`,
          contentType: file.mimetype
        });

        // ✅ INSERT NEW ROW (copy everything)
        await knexDB("project_drawing_management").insert({
          project_id: drawing.project_id,
          drawing_no: drawing.drawing_no,
          drawing_date: drawing.drawing_date,
          drawing_title: drawing.drawing_title,
          drawing_type: drawing.drawing_type,
          revision: nextRevision,
          received_date: drawing.received_date,
          hard_copy: drawing.hard_copy,
          soft_copy: 1,
          remarks: drawing.remarks,
          drawing_key,
          created_at: knexDB.fn.now(),
          updated_at: knexDB.fn.now()
        });

        return res.json({
          ok: true,
          message: `New revision R${nextRevision} created`
        });
      }


      await knexDB("project_drawing_management")
        .where({ drawing_id })
        .update({
          drawing_no: req.body.drawing_no ?? drawing.drawing_no,
          drawing_date: req.body.drawing_date ?? drawing.drawing_date,
          drawing_title: req.body.drawing_title ?? drawing.drawing_title,
          drawing_type: req.body.drawing_type ?? drawing.drawing_type,
          received_date: req.body.received_date ?? drawing.received_date,
          hard_copy: req.body.hard_copy ?? drawing.hard_copy,
          soft_copy: req.body.soft_copy ?? drawing.soft_copy,
          remarks: req.body.remarks ?? drawing.remarks,
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
router.delete("/delete/:drawing_id", authenticateJWT, async (req, res) => {
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

// Get a specific drawing/revision by its drawing_id
router.get("/revision/:drawing_id", authenticateJWT, async (req, res) => {
  try {
    const drawing_id = parseInt(req.params.drawing_id, 10);

    if (Number.isNaN(drawing_id)) {
      return res.status(400).json({ ok: false, message: "Invalid drawing_id" });
    }

    const revision = await knexDB("project_drawing_management")
      .where({ drawing_id })
      .first();

    if (!revision) {
      return res.status(404).json({ ok: false, message: "Revision not found" });
    }

    let preview_url = null;
    let download_url = null;

    if (revision.drawing_key) {
      try {
        const preview = await getFileUrl({
          key: revision.drawing_key,
          directory: `drawings/${revision.project_id}`,
          mode: "preview",
        });

        const download = await getFileUrl({
          key: revision.drawing_key,
          directory: `drawings/${revision.project_id}`,
          mode: "download",
        });

        preview_url = preview.url;
        download_url = download.url;
      } catch (err) {
        console.error("Error generating URL:", err);
      }
    }

    res.json({
      ok: true,
      data: {
        ...revision,
        preview_url,
        download_url,
      }
    });
  } catch (error) {
    console.error("Fetch revision error:", error);
  }
});

// Get full revision history for a drawing
router.get("/revision-history/:drawing_id", authenticateJWT, async (req, res) => {
  try {
    const drawing_id = parseInt(req.params.drawing_id, 10);

    if (Number.isNaN(drawing_id)) {
      return res.status(400).json({ ok: false, message: "Invalid drawing_id" });
    }

    // 1. Get the drawing details to find the drawing_no
    const drawing = await knexDB("project_drawing_management")
      .where({ drawing_id })
      .first();

    if (!drawing) {
      return res.status(404).json({ ok: false, message: "Drawing not found" });
    }

    // 2. Fetch ALL revisions for this drawing_no in this project
    const history = await knexDB("project_drawing_management")
      .where({
        project_id: drawing.project_id,
        drawing_no: drawing.drawing_no
      })
      .orderBy("revision", "desc"); // Latest first

    const data = [];

    for (const rev of history) {
      let preview_url = null;
      let download_url = null;

      if (rev.drawing_key) {
        try {
          const preview = await getFileUrl({
            key: rev.drawing_key,
            directory: `drawings/${rev.project_id}`,
            mode: "preview",
          });

          const download = await getFileUrl({
            key: rev.drawing_key,
            directory: `drawings/${rev.project_id}`,
            mode: "download",
          });

          preview_url = preview.url;
          download_url = download.url;
        } catch (err) {
          console.error(`Error generating URL for R${rev.revision}:`, err);
        }
      }

      data.push({
        ...rev,
        preview_url,
        download_url
      });
    }

    res.json({ ok: true, data });
  } catch (error) {
    console.error("Fetch revision history error:", error);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});

export default router;