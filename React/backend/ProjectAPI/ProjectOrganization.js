import express from "express";
import { knexDB } from "../Database.js";

const router = express.Router();


router.get("/:project_id", async (req, res) => {
    try {
        const projectId = parseInt(req.params.project_id, 10);
        if (Number.isNaN(projectId)) {
            return res.status(400).json({ message: "project_id must be a number" });
        }

        // 1. Fetch Client Name and Project Details
        const project = await knexDB("projects")
            .select([
                "Employer as client_name",
                "project_name",
                "location"
            ])
            .where("project_id", projectId)
            .first();

        const clientName = project?.client_name || null;
        const projectName = project?.project_name || "Unknown Project";
        const projectLocation = project?.location || "Unknown Location";

        // 2. Fetch Vendors
        const vendors = await knexDB("project_vendors as pv")
            .leftJoin("vendors as v", "pv.vendor_id", "v.id")
            .leftJoin("job_nature as jn", "v.job_nature_id", "jn.job_id")
            .where("pv.project_id", projectId)
            .select([
                "pv.pv_id",
                "pv.vendor_id",
                "v.name as company_name",
                "jn.job_name as job_nature",
                "v.mobile",
                "v.email"
            ])
            .orderBy("v.name", "asc");

        // 3. Fetch Directory
        const directory = await knexDB("project_directory as pd")
            .leftJoin("vendors as v", "pd.vendor_id", "v.id")
            .leftJoin("job_nature as jn", "v.job_nature_id", "jn.job_id")
            .where("pd.project_id", projectId)
            .select([
                "pd.pd_id",
                "pd.vendor_id",
                "v.name as company_name",
                "jn.job_name as job_nature",
                "pd.contact_person",
                "pd.designation",
                "pd.responsibilities",
                "pd.mobile_no",
                "pd.email",
                "pd.address_line"
            ])
            .orderBy("pd.created_at", "desc");

        res.json({
            client_name: clientName,
            project_name: projectName,
            project_location: projectLocation,
            vendors,
            directory
        });

    } catch (err) {
        console.error("Fetch project organization error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
