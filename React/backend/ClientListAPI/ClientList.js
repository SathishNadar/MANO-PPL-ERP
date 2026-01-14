import express from "express";
import { knexDB } from "../Database.js";
import Fuse from "fuse.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";


const router = express.Router();


/* -----------------------Queries-------------------------- */
// Helper for building search queries
export async function fetchClients({
    limit = 11,
    page = 1,
    jobIds = [], // Changed from jobNatureIds for consistency with schema 'job_id'
    order = 'ASC',
    // New specific search fields
    searchCompany = "",
    searchJobNature = "",
    searchPerson = ""
} = {}) {
    const offset = (page - 1) * limit;

    // Start with base query
    let query = knexDB('clients')
        .leftJoin('job_nature', 'clients.job_id', 'job_nature.job_id');

    if (jobIds.length > 0) {
        query = query.whereIn('clients.job_id', jobIds);
    }

    if (searchCompany.trim()) {
        query = query.where('clients.name', 'like', `%${searchCompany}%`);
    }

    if (searchPerson.trim()) {
        query = query.where('clients.contact_person', 'like', `%${searchPerson}%`);
    }

    if (searchJobNature.trim()) {
        query = query.where('job_nature.job_name', 'like', `%${searchJobNature}%`);
    }

    // Clone to get total count
    const [{ total }] = await query.clone().count('* as total');

    // Get paginated results
    const clients = await query
        .orderBy('clients.name', order === 'DESC' ? 'desc' : 'asc')
        .limit(limit)
        .offset(offset)
        .select('clients.*', 'job_nature.job_name as job_nature_name_joined');

    return {
        clients,
        clientCount: total,
    };
}

async function fetchClientsAllLocations() {
    const rows = await knexDB('locations')
        .select('loc_id', 'loc_name');

    return Object.fromEntries(rows.map(row => [row.loc_name, row.loc_id]));
}

// Fetch all Job Natures in table
async function fetchClientsAllJobNatures() {
    const rows = await knexDB('job_nature')
        .select('job_id', 'job_name');

    return Object.fromEntries(rows.map(row => [row.job_name, row.job_id]));
}

// Fetch all Sectors in table
async function fetchClientsAllSectors() {
    const rows = await knexDB('sectors')
        .select('sector_id', 'sector_name');

    return Object.fromEntries(rows.map(row => [row.sector_name, row.sector_id]));
}

async function fetchClientsCount() {
    const [result] = await knexDB('clients')
        .count('* as count');

    return result.count;
}


async function insertClient(data = {}) {
    if (!data || Object.keys(data).length === 0) {
        throw new AppError("No data provided for insertion", 400);
    }
    const [id] = await knexDB('clients').insert({
        name: data.name || '',
        sector_id: data.sector_id || null,
        job_id: data.job_id || null,
        contact_person: data.contact_person || '',
        designation: data.designation || '',
        location: data.location || '',
        contact_no: data.contact_no || '',
        email: data.email || '',
        address: data.address || '',
        web_site: data.web_site || '',
        emailed_date: data.emailed_date || null,
        whatsapp_text_date: data.whatsapp_text_date || null,
        called_date: data.called_date || null,
        visited_date: data.visited_date || null,
        reference: data.reference || '',
        responsibility: data.responsibility || '',
        self_remark: data.self_remark || '',
        other_remark: data.other_remark || '',
        interaction_remark: data.interaction_remark || '',
        status_remark: data.status_remark || '',
        call_on_date: data.call_on_date || null
    });

    return { id };
}

async function deleteClient(id) {
    const affectedRows = await knexDB('clients')
        .where('client_id', id)
        .del();

    return { affectedRows };
}

async function updateClient(id, data = {}) {
    if (!data || Object.keys(data).length === 0) {
        throw new AppError("No data provided for update", 400);
    }
    const affectedRows = await knexDB('clients')
        .where('client_id', id)
        .update({
            name: data.name,
            sector_id: data.sector_id,
            job_id: data.job_id,
            contact_person: data.contact_person,
            designation: data.designation,
            location: data.location,
            contact_no: data.contact_no,
            email: data.email,
            address: data.address,
            web_site: data.web_site,
            emailed_date: data.emailed_date,
            whatsapp_text_date: data.whatsapp_text_date,
            called_date: data.called_date,
            visited_date: data.visited_date,
            reference: data.reference,
            responsibility: data.responsibility,
            self_remark: data.self_remark,
            other_remark: data.other_remark,
            interaction_remark: data.interaction_remark,
            status_remark: data.status_remark,
            call_on_date: data.call_on_date
        });

    return { affectedRows };
}

/*---------------------API Endpoints----------------------- */

// Post call to fetch Client data as per filters, pagination and search
router.post("/", catchAsync(async (req, res) => {
    const {
        limit = 11,
        page = 1,
        order = "ASC",
        jobIds = [],
        searchCompany = "",
        searchJobNature = "",
        searchPerson = ""
    } = req.body || {};

    const clients = await fetchClients({
        limit,
        page,
        jobIds,
        order,
        searchCompany,
        searchJobNature,
        searchPerson
    });

    res.json(clients);
}));

// GET call to fetch all locations, job natures, sectors, and client count
router.get("/metadata", catchAsync(async (req, res) => {
    const jobNatures = await fetchClientsAllJobNatures();
    const sectors = await fetchClientsAllSectors();
    const clientCount = await fetchClientsCount();

    res.json({
        jobNatures,
        sectors,
        clientCount
    });
}));

// Insert client
router.post("/add", catchAsync(async (req, res) => {
    const result = await insertClient(req.body);
    res.json({ message: "Client added", id: result.id });
}));

// Update client
router.put("/update/:id", catchAsync(async (req, res) => {
    const id = parseInt(req.params.id);
    const result = await updateClient(id, req.body);

    if (result.affectedRows === 0) {
        throw new AppError("No client found with that ID", 404);
    }

    res.json({ message: "Client updated", affected: result.affectedRows });
}));

// Delete client
router.delete("/delete/:id", catchAsync(async (req, res) => {
    const id = parseInt(req.params.id);
    const result = await deleteClient(id);

    if (result.affectedRows === 0) {
        throw new AppError("No client found with that ID", 404);
    }

    res.json({ message: "Client deleted", affected: result.affectedRows });
}));

// GET call to fetch simplified clients list for dropdowns etc.
router.get("/clients-jobnature", async (req, res) => {
    try {
        const clients = await knexDB('clients as c')
            .leftJoin('job_nature as jn', 'c.job_id', 'jn.job_id')
            .select(
                'c.client_id as id',
                'c.name as company_name',
                'jn.job_name as job_nature'
            )
            .orderBy('c.name', 'asc');

        res.json({ clients });
    } catch (error) {
        console.error("Error fetching clients list:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.get("/clients-sector", async (req, res) => {
    try {
        const clients = await knexDB('clients as c')
            .leftJoin('sectors as s', 'c.sector_id', 's.sector_id')
            .select(
                'c.client_id as id',
                'c.name as company_name',
                's.sector_name as sector'
            )
            .orderBy('c.name', 'asc');

        res.json({ clients });
    } catch (error) {
        console.error("Error fetching clients list:", error);
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

// Helper to insert sector
async function insertSector(sectorName) {
    const [id] = await knexDB('sectors').insert({
        sector_name: sectorName
    });
    return { id };
}

// Add Job Nature Route
router.post("/add-job-nature", catchAsync(async (req, res) => {
    const { job_name } = req.body;

    if (!job_name) {
        throw new AppError("Job Nature Name is required", 400);
    }

    const result = await insertJobNature(job_name);
    res.json({ message: "Job Nature added", id: result.id });
}));

// Add Sector Route
router.post("/add-sector", catchAsync(async (req, res) => {
    const { sector_name } = req.body;

    if (!sector_name) {
        throw new AppError("Sector Name is required", 400);
    }

    const result = await insertSector(sector_name);
    res.json({ message: "Sector added", id: result.id });
}));

export default router;


