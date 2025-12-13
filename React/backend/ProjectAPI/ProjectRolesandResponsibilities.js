import express from "express";
import { knexDB } from "../Database.js";

const router = express.Router();

/* -------------------------------------------------------
   FETCH STAFF
-------------------------------------------------------- */
export async function fetchProjectStaff(projectId) {
  if (!projectId) {
    throw new Error("projectId is required");
  }

  const staff = await knexDB("project_staff_role_responsible")
    .where("project_id", projectId)
    .select("*");

  return {
    staff,
    staffCount: staff.length,
  };
}

/* -------------------------------------------------------
   CRUD OPERATIONS
-------------------------------------------------------- */
async function insertStaff(data) {
  const [psrr_id] = await knexDB("project_staff_role_responsible").insert({
    project_id: data.project_id,
    name: data.name,
    designation: data.designation,
    responsibilities: data.responsibilities,
    mobile: data.mobile,
    email: data.email,
  });

  return { psrr_id };
}

async function updateStaff(id, data) {
  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.designation !== undefined) updateData.designation = data.designation;
  if (data.responsibilities !== undefined) updateData.responsibilities = data.responsibilities;
  if (data.mobile !== undefined) updateData.mobile = data.mobile;
  if (data.email !== undefined) updateData.email = data.email;

  const affected = await knexDB("project_staff_role_responsible")
    .where("psrr_id", id)
    .update(updateData);

  return { affected };
}

async function deleteStaff(id) {
  const affected = await knexDB("project_staff_role_responsible")
    .where("psrr_id", id)
    .del();

  return { affectedRows: affected };
}

/* -------------------------------------------------------
   API Endpoints
-------------------------------------------------------- */

// Fetch staff for a project
router.get("/staff/:project_id", async (req, res) => {
  try {
    const projectId = parseInt(req.params.project_id, 10);
    if (Number.isNaN(projectId)) {
      return res.status(400).json({ message: "Invalid project_id" });
    }

    const result = await fetchProjectStaff(projectId);
    res.json(result);
  } catch (err) {
    console.error("Fetch staff error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Insert staff for a specific project
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
    const result = await insertStaff(payload);

    res.json({ message: "Staff added", psrr_id: result.psrr_id });
  } catch (err) {
    console.error("Insert error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update staff by psrr_id
router.put("/update/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "id is required and must be a number" });
    }

    // Ensure the staff exists
    const existing = await knexDB("project_staff_role_responsible").where({ psrr_id: id }).first();
    if (!existing) {
      return res.status(404).json({ message: "Staff not found" });
    }

    const result = await updateStaff(id, req.body);
    res.json({ message: "Staff updated", affectedRows: result.affected });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete staff by psrr_id
router.delete("/delete/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "id is required and must be a number" });
    }

    // Ensure the staff exists
    const existing = await knexDB("project_staff_role_responsible").where({ psrr_id: id }).first();
    if (!existing) {
      return res.status(404).json({ message: "Staff not found" });
    }

    const result = await deleteStaff(id);
    res.json({ message: "Staff deleted", affectedRows: result.affectedRows });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;