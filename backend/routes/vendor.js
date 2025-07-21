import express from "express";
import * as DB from "./database.js";
import * as auth from "./auth.js";

const router = express.Router();

// Post call to fetch Vendor data as per the filters
router.post("/", async (req, res) => {
    try {
        const {
            queryString = "",
            tab = 1,
            limit = 25,
            order = "ASC",
            category = 0,
            locationIds = [],
            jobNatureIds = []
        } = req.body || {};

        const vendors = await DB.r_fetchVendors({
            queryString,
            category,
            tab,
            limit,
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

// Post call to fetch Vendor data as per search and filters
router.post("/search", async (req, res) => {
    try {
        const {
            queryString,
            tab = 1,
            limit = 25,
            order = "ASC",
            category = 1,
            locationIds = [],
            jobNatureIds = []
        } = req.body || {};
        
        const vendors = await DB.r_searchVendors({ 
            queryString,
            category, 
            tab, 
            limit, 
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
        const locations = await DB.r_fetchVendorsAllLocations();
        const jobNatures = await DB.r_fetchVendorsAllJobNatures();
        const vendorCount = await DB.r_fetchVendorsCount();

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
        const result = await DB.r_insertVendor(req.body);
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
        const result = await DB.r_updateVendor(id, req.body);
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
        const result = await DB.r_deleteVendor(id);
        res.json({ message: "Vendor deleted", affected: result.affectedRows });
    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


export default router;
