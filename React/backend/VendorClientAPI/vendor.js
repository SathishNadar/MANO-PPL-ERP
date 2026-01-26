import express from "express";
import { knexDB } from "../Database.js";
import Fuse from "fuse.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";


const router = express.Router();


/* -----------------------Queries-------------------------- */
// Helper for building search queries
export async function fetchVendors({
  category = 0, // Ignored in new logic but kept for signature compatibility if needed
  limit = 11,
  page = 1,
  locationIds = [],
  jobNatureIds = [], // IDs filter (from filter modal)
  categories = [],   // Categories filter (from filter modal)
  order = 'ASC',
  // New specific search fields
  searchCompany = "",
  searchJobNature = "",
  searchPerson = ""
} = {}) {
  const offset = (page - 1) * limit;

  // Start with base query
  let query = knexDB('vendors')
    .leftJoin('job_nature', 'vendors.job_nature_id', 'job_nature.job_id');

  // Apply ID-based filters (existing functionality)
  // locationIds removed due to schema change (location_id -> location_name)
  // if (locationIds.length > 0) {
  //   query = query.whereIn('vendors.location_id', locationIds);
  // }

  if (jobNatureIds.length > 0) {
    query = query.whereIn('vendors.job_nature_id', jobNatureIds);
  }

  // Apply Category Filter
  if (categories.length > 0) {
    query = query.whereIn('vendors.category', categories);
  }

  // Apply Text-based Search Filters (New functionality)
  // Using whereILike for case-insensitive partial matching (Postgres/MySQL compatible usually, defaulting to where like for broad compatibility if ILIKE not supported by DB driver, specifically sqlite needs setup. Assuming standard sql behavior or knex handles it)
  // If specific DB doesn't support ILIKE, we might need LOWER(). keeping it simple with where + like %...%

  if (searchCompany.trim()) {
    query = query.where('vendors.name', 'like', `%${searchCompany}%`);
  }

  if (searchPerson.trim()) {
    query = query.where('vendors.contact_person', 'like', `%${searchPerson}%`);
  }

  if (searchJobNature.trim()) {
    query = query.where('job_nature.job_name', 'like', `%${searchJobNature}%`);
  }

  // Clone to get total count
  const [{ total }] = await query.clone().count('* as total');

  // Get paginated results
  const vendors = await query
    .orderBy('vendors.name', order === 'DESC' ? 'desc' : 'asc')
    .limit(limit)
    .offset(offset)
    .select('vendors.*', 'job_nature.job_name as job_nature_name_joined');
  // Selecting job_name mainly for debug/consistency, though frontend maps IDs. 
  // The frontend currently maps IDs, so returning vendors.* is fine.

  return {
    vendors,
    vendorCount: total,
  };
}

async function fetchVendorsAllLocations() {
  const rows = await knexDB('locations')
    .select('loc_id', 'loc_name');

  return Object.fromEntries(rows.map(row => [row.loc_name, row.loc_id]));
}

// Fetch all Job Natures in table
async function fetchVendorsAllJobNatures() {
  const rows = await knexDB('job_nature')
    .select('job_id', 'job_name');

  return Object.fromEntries(rows.map(row => [row.job_name, row.job_id]));
}

async function fetchVendorsCount() {
  const [result] = await knexDB('vendors')
    .count('* as count');

  return result.count;
}


async function insertVendor(data) {
  const [id] = await knexDB('vendors').insert({
    name: data.name,
    job_nature_id: data.job_nature_id,
    contact_person: data.contact_person,
    telephone_no: data.telephone_no,
    mobile: data.mobile,
    location_name: data.location_name,
    email: data.email,
    address: data.address,
    gst_no: data.gst_no,
    constitution: data.constitution,
    website: data.website,
    reference: data.reference,
    remarks: data.remarks,
    category: data.category
  });

  return { id };
}

async function deleteVendor(id) {
  const affectedRows = await knexDB('vendors')
    .where('id', id)
    .del();

  return { affectedRows };
}

async function updateVendor(id, data) {
  const affectedRows = await knexDB('vendors')
    .where('id', id)
    .update({
      name: data.name,
      job_nature_id: data.job_nature_id,
      contact_person: data.contact_person,
      telephone_no: data.telephone_no,
      mobile: data.mobile,
      location_name: data.location_name,
      email: data.email,
      address: data.address,
      gst_no: data.gst_no,
      constitution: data.constitution,
      website: data.website,
      reference: data.reference,
      remarks: data.remarks,
      category: data.category
    });

  return { affectedRows };
}

/*---------------------API Endpoints----------------------- */

// Post call to fetch Vendor data as per filters, pagination and search
router.post("/", catchAsync(async (req, res) => {
  const {
    limit = 11,
    page = 1,
    order = "ASC",
    locationIds = [],
    jobNatureIds = [],
    categories = [],
    searchCompany = "",
    searchJobNature = "",
    searchPerson = ""
  } = req.body || {};

  const vendors = await fetchVendors({
    limit,
    page,
    locationIds,
    jobNatureIds,
    categories,
    order,
    searchCompany,
    searchJobNature,
    searchPerson
  });

  res.json(vendors);
}));

// GET call to fetch all locations, job natures, and vendor count
router.get("/metadata", catchAsync(async (req, res) => {
  const locations = await fetchVendorsAllLocations();
  const jobNatures = await fetchVendorsAllJobNatures();
  const vendorCount = await fetchVendorsCount();

  res.json({
    locations,
    jobNatures,
    vendorCount
  });
}));

// Insert vendor
router.post("/add", catchAsync(async (req, res) => {
  const result = await insertVendor(req.body);
  res.json({ message: "Vendor added", id: result.id });
}));

// Update vendor
router.put("/update/:id", catchAsync(async (req, res) => {
  const id = parseInt(req.params.id);
  const result = await updateVendor(id, req.body);

  if (result.affectedRows === 0) {
    throw new AppError("No vendor found with that ID", 404);
  }

  res.json({ message: "Vendor updated", affected: result.affectedRows });
}));

// Delete vendor
router.delete("/delete/:id", catchAsync(async (req, res) => {
  const id = parseInt(req.params.id);
  const result = await deleteVendor(id);

  if (result.affectedRows === 0) {
    throw new AppError("No vendor found with that ID", 404);
  }

  res.json({ message: "Vendor deleted", affected: result.affectedRows });
}));

// GET call to fetch simplified vendors list for dropdowns etc.
router.get("/vendors-jobnature", async (req, res) => {
  try {
    const vendors = await knexDB('vendors as v')
      .leftJoin('job_nature as jn', 'v.job_nature_id', 'jn.job_id')
      .select(
        'v.id',
        'v.name as company_name',
        'jn.job_name as job_nature'
      )
      .orderBy('v.name', 'asc');

    res.json({ vendors });
  } catch (error) {
    console.error("Error fetching vendors list:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});



// Helper to insert job nature
async function insertJobNature(jobName) {
  const [id] = await knexDB('job_nature').insert({
    job_name: jobName
  });
  return { id };
}

// ... existing routes ...

export default router;

// Add Job Nature Route
router.post("/add-job-nature", catchAsync(async (req, res) => {
  const { job_name } = req.body;

  if (!job_name) {
    throw new AppError("Job Nature Name is required", 400);
  }

  // Optional: Check existence. Assuming DB unique constraint might handle it or just let duplicates happen if schema allows? 
  // Let's assume naive insert for now as requested.
  const result = await insertJobNature(job_name);
  res.json({ message: "Job Nature added", id: result.id });
}));

