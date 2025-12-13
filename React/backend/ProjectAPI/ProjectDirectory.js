import express from "express";
import { knexDB } from "../Database.js";

const router = express.Router();

/* -------------------------------------------------------
   FETCH CONTACTS (FILTERS + PAGINATION + SEARCH)
-------------------------------------------------------- */
export async function fetchProjectContacts(projectId) {
  if (!projectId) {
    throw new Error("projectId is required");
  }

  const contacts = await knexDB("project_contact as pc")
    .leftJoin("vendors as v", "pc.vendor_id", "v.id")
    .leftJoin("job_nature as jn", "v.job_nature_id", "jn.job_id")
    .where("pc.project_id", projectId)
    .select([
      "pc.pc_id",
      "pc.project_id",
      "pc.vendor_id",
      "v.name as company_name",
      "jn.job_name as job_nature",
      "pc.contact_person",
      "pc.designation",
      "pc.responsibilities",
      "pc.mobile_no",
      "pc.email",
      "pc.address_line",
      "pc.created_at",
      "pc.updated_at",
    ])
    .orderBy("pc.created_at", "desc");

  return {
    contacts,
    contactCount: contacts.length,
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



/* -------------------------------------------------------
   CRUD OPERATIONS
-------------------------------------------------------- */
async function insertContact(data) {
  const [pc_id] = await knexDB("project_contact").insert({
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

  return { pc_id };
}


async function updateContact(id, data) {
  const affected = await knexDB("project_contact")
    .where("pc_id", id)
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
// Fetch contacts for a project
router.get("/contacts/:project_id", async (req, res) => {
  try {
    const projectId = parseInt(req.params.project_id, 10);
    if (Number.isNaN(projectId)) {
      return res.status(400).json({ message: "Invalid project_id" });
    }

    const result = await fetchProjectContacts(projectId);
    res.json(result);
  } catch (err) {
    console.error("Fetch contacts error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});





// Insert
// Insert (preferred): POST /:projectId/add
// Insert contact for a specific project
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
    const result = await insertContact(payload);

    res.json({ message: "Contact added", pc_id: result.pc_id });
  } catch (err) {
    console.error("Insert error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});



// Update (project-scoped): PUT /:projectId/update/:id
// Update contact by pc_id only
router.put("/update/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "id is required and must be a number" });
    }

    // Ensure the contact exists
    const existing = await knexDB("project_contact").where({ pc_id: id }).first();
    if (!existing) {
      return res.status(404).json({ message: "Contact not found" });
    }

    const result = await updateContact(id, req.body);
    res.json({ message: "Contact updated", affectedRows: result.affected });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});



// Delete (project-scoped): DELETE /:projectId/delete/:id
// Delete contact by pc_id only
router.delete("/delete/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "id is required and must be a number" });
    }

    // Ensure the contact exists
    const existing = await knexDB("project_contact").where({ pc_id: id }).first();
    if (!existing) {
      return res.status(404).json({ message: "Contact not found" });
    }

    const result = await deleteContact(id);
    res.json({ message: "Contact deleted", affectedRows: result.affectedRows });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


export default router;
