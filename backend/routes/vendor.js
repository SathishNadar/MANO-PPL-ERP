import express from "express";
import * as DB from "./database.js"

const router = express.Router();

router.get("/api", async (req, res) => {
    try {
        const tab = parseInt(req.query.tab, 10) || 1;
        const order = req.query.order === "desc" ? false : true;
        const vendors = await DB.r_fetchVendorsByTab(tab);

        res.json({ vendors });
    } catch (error) {
        console.error("Error fetching vendors:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
