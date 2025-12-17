import express from "express";
import { knexDB } from "../Database.js";
import Fuse from "fuse.js";

const router = express.Router();

/* -------------------------------------------------------
   FETCH CONTACTS (FILTERS + PAGINATION + SEARCH)
-------------------------------------------------------- */
export async function fetchProjectContacts({
  queryString = "",
  limit = 20,
  page = 1,
  projectId = null,
  order = "ASC",
} = {}) {
  const offset = (page - 1) * limit;

  let query = knexDB("project_contact");

  if (projectId) {
    query = query.where("project_id", projectId);
  }

  // No search → return paginated DB result
  if (!queryString.trim()) {
    const [{ total }] = await query.clone().count("* as total");

    const contacts = await query
      .orderBy("company_name", order === "DESC" ? "desc" : "asc")
      .limit(limit)
      .offset(offset)
      .select("*");

    return {
      contacts,
      contactCount: total,
    };
  }

  // With search → Load all + Fuse search
  const allContacts = await query
    .orderBy("company_name", order === "DESC" ? "desc" : "asc")
    .select("*");

  const fuse = new Fuse(allContacts, {
    keys: [
      { name: "company_name", weight: 0.5 },
      { name: "contact_person", weight: 0.2 },
      { name: "email", weight: 0.1 },
      { name: "designation", weight: 0.1 },
      { name: "mobile_no", weight: 0.05 },
    ],
    threshold: 0.4,
  });

  const results = fuse.search(queryString).map(r => r.item);
  const paginated = results.slice(offset, offset + limit);

  return {
    contacts: paginated,
    contactCount: results.length,
  };
}

/* -------------------------------------------------------
   METADATA
-------------------------------------------------------- */
async function fetchContactsCount(projectId = null) {
  let query = knexDB("project_contact");

  if (projectId) query = query.where("project_id", projectId);

  const [result] = await query.count("* as count");
  return result.count;
}

// Fetch distinct job_nature values for a project
async function fetchProjectJobNatures(projectId) {
  const rows = await knexDB("project_contact")
    .where("project_id", projectId)
    .distinct("job_nature")
    .whereNotNull("job_nature");

  return rows.map((r) => r.job_nature);
}

// Fetch distinct designation values for a project
async function fetchProjectDesignations(projectId) {
  const rows = await knexDB("project_contact")
    .where("project_id", projectId)
    .distinct("designation")
    .whereNotNull("designation");

  return rows.map((r) => r.designation);
}

// Fetch distinct locations (address_line) for a project
async function fetchProjectLocations(projectId) {
  const rows = await knexDB("project_contact")
    .where("project_id", projectId)
    .distinct("address_line")
    .whereNotNull("address_line");

  return rows.map((r) => r.address_line);
}


/* -------------------------------------------------------
   CRUD OPERATIONS
-------------------------------------------------------- */
async function insertContact(data) {
  const [insertedId] = await knexDB("project_contact").insert({
    project_id: data.project_id,
    company_name: data.company_name,
    job_nature: data.job_nature,
    contact_person: data.contact_person,
    designation: data.designation,
    responsibilities: data.responsibilities,
    mobile_no: data.mobile_no,
    email: data.email,
    address_line: data.address_line,
    created_at: knexDB.fn.now(),
    updated_at: knexDB.fn.now(),
  });
  return { pc_id: insertedId };
}

async function updateContact(id, data) {
  const affected = await knexDB("project_contact")
    .where("pc_id", id)
    .update({
      company_name: data.company_name,
      job_nature: data.job_nature,
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

async function deleteContact(id) {
  const affected = await knexDB("project_contact")
    .where("pc_id", id)
    .del();

  return { affectedRows: affected };
}

/* -------------------------------------------------------
API Endpoints
-------------------------------------------------------- */


// Fetch contacts with search, pagination for a project
router.post("/:projectId", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    if (Number.isNaN(projectId)) {
      return res.status(400).json({ message: "projectId path parameter is required and must be a number" });
    }

    const {
      queryString = "",
      limit = 20,
      page = 1,
      order = "ASC",
    } = req.body || {};

    // ensure project exists
    const project = await knexDB("projects").where({ project_id: projectId }).first();
    if (!project) return res.status(404).json({ message: "Project not found" });

    const result = await fetchProjectContacts({
      queryString,
      limit,
      page,
      order,
      projectId,
    });

    res.json(result);
  } catch (err) {
    console.error("Error fetching contacts:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


// Backwards compatible: keep POST / (deprecated) which expects projectId in body
// Backwards compatible: POST / expects `projectId` in body (deprecated)
router.post("/", async (req, res) => {
  try {
    const projectId = parseInt(req.body && req.body.projectId, 10);
    if (Number.isNaN(projectId)) {
      return res.status(400).json({ message: "projectId is required in body and must be a number" });
    }

    const {
      queryString = "",
      limit = 20,
      page = 1,
      order = "ASC",
    } = req.body || {};

    const project = await knexDB("projects").where({ project_id: projectId }).first();
    if (!project) return res.status(404).json({ message: "Project not found" });

    const result = await fetchProjectContacts({
      queryString,
      limit,
      page,
      order,
      projectId,
    });

    res.json(result);
  } catch (err) {
    console.error("Deprecated fetch alias error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


// Metadata: for specific project (projectId required)
router.get("/metadata/:projectId", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    if (Number.isNaN(projectId)) {
      return res.status(400).json({ message: "projectId is required and must be a number" });
    }
    // ensure project exists
    const project = await knexDB("projects").where({ project_id: projectId }).first();
    if (!project) return res.status(404).json({ message: "Project not found" });

    const count = await fetchContactsCount(projectId);
    const jobNatures = await fetchProjectJobNatures(projectId);
    const designations = await fetchProjectDesignations(projectId);
    const locations = await fetchProjectLocations(projectId);

    res.json({
      contactCount: Number(count),
      jobNatures,
      designations,
      locations,
    });
  } catch (err) {
    console.error("Metadata error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


// Insert
// Insert (preferred): POST /:projectId/add
router.post("/:projectId/add", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    if (Number.isNaN(projectId)) {
      return res.status(400).json({ message: "projectId path parameter is required and must be a number" });
    }

    const project = await knexDB("projects").where({ project_id: projectId }).first();
    if (!project) return res.status(404).json({ message: "Project not found" });

    // use projectId from path, ignore project_id in body if present
    const payload = { ...req.body, project_id: projectId };
    const result = await insertContact(payload);
    res.json({ message: "Contact added", pc_id: result.pc_id });
  } catch (err) {
    console.error("Insert error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


// Backwards-compatible insert: POST /add (deprecated) expects project_id in body
router.post("/add", async (req, res) => {
  try {
    const projectId = parseInt(req.body && req.body.project_id, 10);
    if (Number.isNaN(projectId)) {
      return res.status(400).json({ message: "project_id is required in body and must be a number" });
    }

    const project = await knexDB("projects").where({ project_id: projectId }).first();
    if (!project) return res.status(404).json({ message: "Project not found" });

    const result = await insertContact(req.body);
    res.json({ message: "Contact added", pc_id: result.pc_id });
  } catch (err) {
    console.error("Insert error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update (project-scoped): PUT /:projectId/update/:id
router.put("/:projectId/update/:id", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    if (Number.isNaN(projectId)) {
      return res.status(400).json({ message: "projectId is required and must be a number" });
    }

    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "id is required and must be a number" });
    }

    // ensure the contact belongs to this project
    const existing = await knexDB("project_contact").where({ pc_id: id, project_id: projectId }).first();
    if (!existing) {
      return res.status(404).json({ message: "Contact not found for this project" });
    }

    const result = await updateContact(id, req.body);
    res.json({ message: "Contact updated", affectedRows: result.affected });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


// Delete (project-scoped): DELETE /:projectId/delete/:id
router.delete("/:projectId/delete/:id", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    if (Number.isNaN(projectId)) {
      return res.status(400).json({ message: "projectId is required and must be a number" });
    }

    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "id is required and must be a number" });
    }

    // ensure the contact belongs to this project
    const existing = await knexDB("project_contact").where({ pc_id: id, project_id: projectId }).first();
    if (!existing) {
      return res.status(404).json({ message: "Contact not found for this project" });
    }

    const result = await deleteContact(id);
    res.json({ message: "Contact deleted", affectedRows: result.affectedRows });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
