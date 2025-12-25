import express from "express";
import { knexDB } from "../Database.js";

const router = express.Router();

/* -------------------------------------------------------
   FETCH DIRECTORY (FILTERS + PAGINATION + SEARCH)
-------------------------------------------------------- */
export async function fetchProjectDirectory(projectId) {
  if (!projectId) {
    throw new Error("projectId is required");
  }

  const directory = await knexDB("project_directory as pd")
    .leftJoin("vendors as v", "pd.vendor_id", "v.id")
    .leftJoin("job_nature as jn", "v.job_nature_id", "jn.job_id")
    .where("pd.project_id", projectId)
    .select([
      "pd.pd_id",
      "pd.project_id",
      "pd.vendor_id",
      "v.name as company_name",
      "jn.job_name as job_nature",
      "pd.contact_person",
      "pd.designation",
      "pd.responsibilities",
      "pd.mobile_no",
      "pd.email",
      "pd.address_line",
      "pd.created_at",
      "pd.updated_at",
    ])
    .orderBy("pd.created_at", "desc");

  return {
    directory,
    count: directory.length,
  };
}



/* -------------------------------------------------------
   METADATA
-------------------------------------------------------- */
async function fetchDirectoryCount(projectId = null) {
  let query = knexDB("project_directory");

  if (projectId) query = query.where("project_id", projectId);

  const [result] = await query.count("* as count");
  return result.count;
}


/* -------------------------------------------------------
   CRUD OPERATIONS
-------------------------------------------------------- */
async function insertDirectoryItem(data) {
  const [pd_id] = await knexDB("project_directory").insert({
    project_id: data.project_id,
    vendor_id: data.vendor_id,
    contact_person: data.contact_person,
    designation: data.designation,
    responsibilities: data.responsibilities,
    mobile_no: data.mobile_no,
    email: data.email,
    address_line: data.address_line,
    created_at: knexDB.fn.now(),
    updated_at: knexDB.fn.now(),
  });

  return { pd_id };
}


async function updateDirectoryItem(id, data) {
  const affected = await knexDB("project_directory")
    .where("pd_id", id)
    .update({
      vendor_id: data.vendor_id,
      contact_person: data.contact_person,
      designation: data.designation,
      responsibilities: data.responsibilities,
      mobile_no: data.mobile_no,
      email: data.email,
      address_line: data.address_line,
      updated_at: knexDB.fn.now(),
    });

  return { affected };
}


async function deleteDirectoryItem(id) {
  const affected = await knexDB("project_directory")
    .where("pd_id", id)
    .del();

  return { affectedRows: affected };
}

/* -------------------------------------------------------
API Endpoints
-------------------------------------------------------- */


// Fetch directory for a project
router.get("/list/:project_id", async (req, res) => {
  try {
    const projectId = parseInt(req.params.project_id, 10);
    if (Number.isNaN(projectId)) {
      return res.status(400).json({ message: "Invalid project_id" });
    }

    const result = await fetchProjectDirectory(projectId);
    res.json(result);
  } catch (err) {
    console.error("Fetch directory error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Insert
// Insert directory item for a specific project
router.post("/add/:project_id", async (req, res) => {
  try {
    const projectId = parseInt(req.params.project_id, 10);
    if (Number.isNaN(projectId)) {
      return res.status(400).json({ message: "project_id path parameter is required and must be a number" });
    }

    // Ensure project exists
    const project = await knexDB("projects").where({ project_id: projectId }).first();
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Merge project_id from path into request body
    const payload = { ...req.body, project_id: projectId };
    const result = await insertDirectoryItem(payload);

    res.json({ message: "Directory item added", pd_id: result.pd_id });
  } catch (err) {
    console.error("Insert error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update (project-scoped): PUT /:projectId/update/:id
// Update directory item by pd_id only
router.put("/update/:id", async (req, res) => { 
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "id is required and must be a number" });
    }

    // Ensure the item exists
    const existing = await knexDB("project_directory").where({ pd_id: id }).first();
    if (!existing) {
      return res.status(404).json({ message: "Directory item not found" });
    }

    const result = await updateDirectoryItem(id, req.body);
    res.json({ message: "Directory item updated", affectedRows: result.affected });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete (project-scoped): DELETE /:projectId/delete/:id
// Delete directory item by pd_id only
router.delete("/delete/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "id is required and must be a number" });
    }

    // Ensure the item exists
    const existing = await knexDB("project_directory").where({ pd_id: id }).first();
    if (!existing) {
      return res.status(404).json({ message: "Directory item not found" });
    }

    const result = await deleteDirectoryItem(id);
    res.json({ message: "Directory item deleted", affectedRows: result.affectedRows });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


export default router;

