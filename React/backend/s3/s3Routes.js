import express from "express";
import multer from "multer";
import { uploadFile, getFileUrl, listFiles, deleteFile } from "./S3Service.js";

const router = express.Router();
const upload = multer(); // store files in memory

// Upload
router.post("/upload", upload.single("file"), async (req, res) => {
  const result = await uploadFile({
    fileBuffer: req.file.buffer,
    key: req.file.originalname,
    directory: req.body.directory || "",
    ContentType: req.file.mimetype,
  });
  res.json(result);
});

// Fetch
router.get("/file", async (req, res) => {
  const result = await getFileUrl({
    key: req.query.key,
    directory: req.query.directory || ""
  });
  res.json(result);
});

// List
router.get("/list", async (req, res) => {
  const result = await listFiles(req.query.directory || "");
  res.json(result);
});

// Delete
router.delete("/delete", async (req, res) => {
  const result = await deleteFile({
    key: req.body.key,
    directory: req.body.directory || ""
  });
  res.json(result);
});

export default router;
