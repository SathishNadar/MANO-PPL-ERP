import express from 'express';
import { knexDB } from '../Database.js';

const router = express.Router();

// GET all summaries for a project
router.get('/:project_id', async (req, res) => {
    try {
        const { project_id } = req.params;
        const summaries = await knexDB('project_summary').where({ project_id });
        res.json(summaries);
    } catch (error) {
        console.error("Error fetching summaries:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// ADD summaries (List of { title, details })
router.post('/add/:project_id', async (req, res) => {
    try {
        const { project_id } = req.params;
        const items = req.body; // Expecting array

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "Invalid input, expected array of objects" });
        }

        const toInsert = items.map(item => ({
            project_id,
            title: item.title,
            details: item.details
        }));

        await knexDB('project_summary').insert(toInsert);
        res.json({ message: "Summaries added successfully" });
    } catch (error) {
        console.error("Error adding summaries:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// UPDATE summaries (List of { id, title, details })
router.put('/update', async (req, res) => {
    try {
        const items = req.body;
        if (!Array.isArray(items)) {
            return res.status(400).json({ message: "Invalid input, expected array" });
        }

        await knexDB.transaction(async (trx) => {
            const queries = items.map(item => {
                if (!item.id) return;
                return knexDB('project_summary')
                    .where({ id: item.id })
                    .update({
                        title: item.title,
                        details: item.details
                    })
                    .transacting(trx);
            });
            await Promise.all(queries);
        });

        res.json({ message: "Summaries updated successfully" });
    } catch (error) {
        console.error("Error updating summaries:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// DELETE summaries (List of IDs)
router.delete('/delete', async (req, res) => {
    try {
        const ids = req.body; // Expecting [id1, id2] or [{id: 1}, ...]
        if (!Array.isArray(ids)) {
            return res.status(400).json({ message: "Invalid input, expected array of IDs" });
        }

        // Normalize to array of IDs
        const idsToDelete = ids.map(i => (typeof i === 'object' ? i.id : i));

        await knexDB('project_summary').whereIn('id', idsToDelete).del();
        res.json({ message: "Summaries deleted successfully" });
    } catch (error) {
        console.error("Error deleting summaries:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
