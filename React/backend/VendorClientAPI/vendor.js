import express from "express";
import { knexDB } from "../Database.js";
import Fuse from "fuse.js";


const router = express.Router();


/* -----------------------Queries-------------------------- */
export async function fetchVendors({
  queryString = "",
  category = 0,
  limit = 11,
  page = 1,
  locationIds = [],
  jobNatureIds = [],
  order = 'ASC',
} = {}) {
  const offset = (page - 1) * limit;
  
  // Build base query
  let query = knexDB('vendors');
  
  if (category !== 0) {
    query = query.where('category_id', category);
  }
  
  if (locationIds.length > 0) {
    query = query.whereIn('location_id', locationIds);
  }
  
  if (jobNatureIds.length > 0) {
    query = query.whereIn('job_nature_id', jobNatureIds);
  }
  
  // If no search string, fetch paginated results directly from DB
  if (!queryString.trim()) {
    // Get total count
    const [{ total }] = await query.clone().count('* as total');
    
    // Get paginated vendors
    const vendors = await query
      .orderBy('name', order === 'DESC' ? 'desc' : 'asc')
      .limit(limit)
      .offset(offset)
      .select('*');
    
    return {
      vendors,
      vendorCount: total,
    };
  }
  
  // With search, fetch ALL matching vendors (no limit, no offset)
  const allVendors = await query
    .orderBy('name', order === 'DESC' ? 'desc' : 'asc')
    .select('*');
  
  const fuse = new Fuse(allVendors, {
    keys: [
      { name: "name", weight: 0.5 },
      { name: "remarks", weight: 0.2 },
      { name: "email", weight: 0.1 },
      { name: "website", weight: 0.1 },
      { name: "telephone_no", weight: 0.05 },
      { name: "mobile", weight: 0.05 },
      { name: "reference", weight: 0.025 },
      { name: "contact_person", weight: 0.025 },
    ],
    threshold: 0.4,
  });
  
  const results = fuse.search(queryString).map(r => r.item);
  const paginatedResults = results.slice(offset, offset + limit);
  
  return {
    vendors: paginatedResults,
    vendorCount: results.length,
  };
}

async function fetchVendorsAllLocations() {
  try {
    const rows = await knexDB('locations')
      .select('loc_id', 'loc_name');
    
    return Object.fromEntries(rows.map(row => [row.loc_name, row.loc_id]));
  } catch (error) {
    console.error(`Error fetching data from locations:`, error);
    throw error;
  }
}

// Fetch all Job Natures in table
async function fetchVendorsAllJobNatures() {
  try {
    const rows = await knexDB('job_nature')
      .select('job_id', 'job_name');
    
    return Object.fromEntries(rows.map(row => [row.job_name, row.job_id]));
  } catch (error) {
    console.error(`Error fetching data from job_nature:`, error);
    throw error;
  }
}

async function fetchVendorsCount() {
  try {
    const [result] = await knexDB('vendors')
      .count('* as count');
    
    return result.count;
  } catch (error) {
    console.error("Error fetching vendor count:", error);
    throw error;
  }
}

async function insertVendor(data) {
  const [id] = await knexDB('vendors').insert({
    name: data.name,
    job_nature_id: data.job_nature_id,
    contact_person: data.contact_person,
    telephone_no: data.telephone_no,
    mobile: data.mobile,
    location_id: data.location_id,
    email: data.email,
    address: data.address,
    gst_no: data.gst_no,
    constitution: data.constitution,
    website: data.website,
    reference: data.reference,
    remarks: data.remarks,
    category_id: data.category_id
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
      location_id: data.location_id,
      email: data.email,
      address: data.address,
      gst_no: data.gst_no,
      constitution: data.constitution,
      website: data.website,
      reference: data.reference,
      remarks: data.remarks,
      category_id: data.category_id
    });
  
  return { affectedRows };
}

/*---------------------API Endpoints----------------------- */

// Post call to fetch Vendor data as per filters, pagination and search
router.post("/", async (req, res) => {
    try {
        const {
            queryString = "",
            limit = 11,
            page = 1,
            order = "ASC",
            category = 0,
            locationIds = [],
            jobNatureIds = []
        } = req.body || {};

        const vendors = await fetchVendors({
            queryString,
            category,
            limit,
            page,
            locationIds,
            jobNatureIds,
            order
        });

        res.json(vendors);
    } catch (error) {
        console.error("Error fetching vendors:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// GET call to fetch all locations, job natures, and vendor count
router.get("/metadata", async (req, res) => {
    try {
        const locations = await fetchVendorsAllLocations();
        const jobNatures = await fetchVendorsAllJobNatures();
        const vendorCount = await fetchVendorsCount();

        res.json({ 
            locations, 
            jobNatures,
            vendorCount
        });
    } catch (error) {
        console.error("Error fetching vendor metadata:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Insert vendor
router.post("/add", async (req, res) => {
    try {
        const result = await insertVendor(req.body);
        res.json({ message: "Vendor added", id: result.id });
    } catch (error) {
        console.error("Insert error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Update vendor
router.put("/update/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const result = await updateVendor(id, req.body);
        res.json({ message: "Vendor updated", affected: result.affectedRows });
    } catch (error) {
        console.error("Update error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Delete vendor
router.delete("/delete/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const result = await deleteVendor(id);
        res.json({ message: "Vendor deleted", affected: result.affectedRows });
    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


export default router;
