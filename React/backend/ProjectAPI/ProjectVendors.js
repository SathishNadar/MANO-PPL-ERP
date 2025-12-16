import express from "express";
import { knexDB } from "../Database.js";

const router = express.Router();

/*fetch_vendors*/
router.get("/:project_id", async (req, res) => {
  try {
    const projectId = parseInt(req.params.project_id, 10);
    if (Number.isNaN(projectId)) {
      return res.status(400).json({ message: "project_id must be a number" });
    }

    const vendors = await knexDB("project_vendors as pv")
      .leftJoin("vendors as v", "pv.vendor_id", "v.id")
      .leftJoin("job_nature as jn", "v.job_nature_id", "jn.job_id")
      .where("pv.project_id", projectId)
      .select([
        "pv.pv_id",
        "pv.project_id",
        "pv.vendor_id",
        "v.name as company_name",
        "jn.job_name as job_nature",
        "v.contact_person",
        "v.telephone_no",
        "v.mobile",
        "v.email",
        "v.address",
        "v.website",
        "v.reference",
      ])
      .orderBy("v.name", "asc");

    res.json({ vendors });
  } catch (err) {
    console.error("Fetch project vendors error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});



/*INSERT VENDOR INTO PROJECT*/
router.post("/add/:project_id", async (req, res) => {
  try {
    const projectId = parseInt(req.params.project_id, 10);
    const { vendors } = req.body;

    if (Number.isNaN(projectId)) {
      return res.status(400).json({ message: "project_id must be a number" });
    }

    if (!vendors || !Array.isArray(vendors) || vendors.length === 0) {
      return res.status(400).json({ message: "vendors array is required and must not be empty" });
    }

    // Ensure project exists
    const project = await knexDB("projects")
      .where({ project_id: projectId })
      .first();

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Validate all vendors exist
    const vendorRecords = await knexDB("vendors")
      .whereIn("id", vendors);

    if (vendorRecords.length !== vendors.length) {
      const foundIds = vendorRecords.map(v => v.id);
      const missingIds = vendors.filter(id => !foundIds.includes(id));
      return res.status(404).json({ 
        message: "Some vendors not found", 
        missing_vendor_ids: missingIds 
      });
    }

    // Check for existing vendor-project associations
    const existingAssociations = await knexDB("project_vendors")
      .where({ project_id: projectId })
      .whereIn("vendor_id", vendors);

    if (existingAssociations.length > 0) {
      const existingIds = existingAssociations.map(a => a.vendor_id);
      return res.status(409).json({ 
        message: "Some vendors already added to this project",
        existing_vendor_ids: existingIds
      });
    }

    // Insert all vendor associations
    const insertData = vendors.map(vendor_id => ({
      project_id: projectId,
      vendor_id
    }));

    await knexDB("project_vendors").insert(insertData);

    // Fetch the inserted records to get their IDs
    const insertedRecords = await knexDB("project_vendors")
      .where({ project_id: projectId })
      .whereIn("vendor_id", vendors)
      .select("pv_id");

    const pv_ids = insertedRecords.map(record => record.pv_id);

    res.json({ 
      message: "Vendors added to project", 
      pv_ids,
      count: pv_ids.length
    });
  } catch (err) {
    console.error("Insert project vendors error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE project vendor by pv_id
router.delete("/delete", async (req, res) => {
  try {
    const { pv_ids } = req.body;

    if (!pv_ids || !Array.isArray(pv_ids) || pv_ids.length === 0) {
      return res.status(400).json({ message: "pv_ids array is required and must not be empty" });
    }

    // Check which associations exist
    const existing = await knexDB("project_vendors")
      .whereIn("pv_id", pv_ids);

    if (existing.length === 0) {
      return res.status(404).json({ message: "No matching project vendors found" });
    }

    // Check if some pv_ids don't exist
    const existingPvIds = existing.map(e => e.pv_id);
    const notFound = pv_ids.filter(id => !existingPvIds.includes(id));

    // Delete the associations
    const deletedCount = await knexDB("project_vendors")
      .whereIn("pv_id", pv_ids)
      .del();

    res.json({ 
      message: "Vendors removed from project",
      deleted_count: deletedCount,
      deleted_pv_ids: existingPvIds,
      ...(notFound.length > 0 && { not_found_pv_ids: notFound })
    });
  } catch (err) {
    console.error("Delete project vendors error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
