import express from "express";
import * as DB from "./database.js"

const router = express.Router();

// Post call to fetch Vendor data as per the filters
router.post("/", async (req, res) => {
    try {
        const {
            tab = 1,
            limit = 25,
            order = "ASC",
            category = 0,
            locationIds = [],
            jobNatureIds = []
        } = req.body || {};
        
        const vendors = await DB.r_fetchVendorsByTab({ 
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

// Get call to fetch All available Job Natures in Vendors List 
router.get("/JobNatures", async (req, res) =>{
    try {
        const JobNatures = await DB.r_fetchVendorsAllJobNatures();
        res.json({ JobNatures});
    } catch (error) {
        console.error("Error fetching JobNatures:", error);
        res.status(500).json({ message: "Internal server error" });
    }
})

// Get call to fetch All available Locations in Vendors List 
router.get("/Locations", async (req, res) =>{
    try {
        const Locations = await DB.r_fetchVendorsAllLocations();
        res.json({ Locations});
    } catch (error) {
        console.error("Error fetching JobNatures:", error);
        res.status(500).json({ message: "Internal server error" });
    }
})

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

export default router;
