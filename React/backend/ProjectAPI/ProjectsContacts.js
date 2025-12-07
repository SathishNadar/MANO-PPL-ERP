import express from "express";
import { knexDB } from "../Database.js";
import Fuse from "fuse.js";

const router = express.Router();

/* -------------------------------------------------------
    FETCH CONTACTS WITH SEARCH, FILTER, PAGINATION
--------------------------------------------------------- */
export async function fetchContacts({
  project_id,
  queryString = "",
  limit = 10,
  page = 1,
  order = "ASC",
} = {}) {
  const offset = (page - 1) * limit;

  // Base table
  let query = knexDB("project_contacts");

  if (project_id) {
    query = query.where("project_id", project_id);
  }

  // No search → direct DB paginated results
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

  // With search → fetch ALL then fuse filter
  const allContacts = await query
    .orderBy("company_name", order === "DESC" ? "desc" : "asc")
    .select("*");

  const fuse = new Fuse(allContacts, {
    keys: [
      { name: "company_name", weight: 0.4 },
      { name: "job_nature", weight: 0.1 },
      { name: "contact_person", weight: 0.2 },
      { name: "designation", weight: 0.1 },
      { name: "responsibilities", weight: 0.1 },
      { name: "email", weight: 0.05 },
      { name: "mobile_no", weight: 0.05 },
      { name: "address_line", weight: 0.05 }
    ],
    threshold: 0.38,
  });

  const results = fuse.search(queryString).map(r => r.item);
  const paginated = results.slice(offset, offset + limit);

  return {
    contacts: paginated,
    contactCount: results.length,
  };
}

/* -------------------------------------------------------
    INSERT
--------------------------------------------------------- */
async function insertContact(data) {
  const [id] = await knexDB("project_contacts").insert({
    project_id: data.project_id,
    company_name: data.company_name,
    job_nature: data.job_nature,
    contact_person: data.contact_person,
    designation: data.designation,
    responsibilities: data.responsibilities,
    mobile_no: data.mobile_no,
    email: data.email,
    address_line: data.address_line
  });

  return { id };
}

/* -------------------------------------------------------
    UPDATE
--------------------------------------------------------- */
async function updateContact(pc_id, data) {
  const affectedRows = await knexDB("project_contacts")
    .where("pc_id", pc_id)
    .update({
      project_id: data.project_id,
      company_name: data.company_name,
      job_nature: data.job_nature,
      contact_person: data.contact_person,
      designation: data.designation,
      responsibilities: data.responsibilities,
      mobile_no: data.mobile_no,
      email: data.email,
      address_line: data.address_line,
      updated_at: knexDB.fn.now()
    });

  return { affectedRows };
}

/* -------------------------------------------------------
    DELETE
--------------------------------------------------------- */
async function deleteContact(pc_id) {
  const affectedRows = await knexDB("project_contacts")
    .where("pc_id", pc_id)
    .del();

  return { affectedRows };
}

/* -------------------------------------------------------
    ROUTES
--------------------------------------------------------- */

// POST → fetch contacts
router.post("/", async (req, res) => {
  try {
    const {
      project_id,
      queryString = "",
      limit = 10,
      page = 1,
      order = "ASC",
    } = req.body;

    const data = await fetchContacts({
      project_id,
      queryString,
      limit,
      page,
      order
    });

    res.json(data);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ADD CONTACT
router.post("/add", async (req, res) => {
  try {
    const result = await insertContact(req.body);
    res.json({ message: "Contact added", pc_id: result.id });
  } catch (error) {
    console.error("Insert error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// UPDATE CONTACT
router.put("/update/:pc_id", async (req, res) => {
  try {
    const { pc_id } = req.params;
    const result = await updateContact(pc_id, req.body);
    res.json({ message: "Contact updated", affected: result.affectedRows });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE CONTACT
router.delete("/delete/:pc_id", async (req, res) => {
  try {
    const { pc_id } = req.params;
    const result = await deleteContact(pc_id);
    res.json({ message: "Contact deleted", affected: result.affectedRows });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
