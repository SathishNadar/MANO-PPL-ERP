import express from "express";
import { knexDB } from "../Database.js";

const router = express.Router();

//Fetch project MoMs
export async function fetchProjectMoMs(projectId) {
  if (!projectId) {
    throw new Error("projectId is required");
  }

  const moms = await knexDB("project_mom")
    .where("project_id", projectId)
    .select([
      "mom_id",
      "subject",
      "meeting_no",
      "date",
      "venue",
    ])
    .orderBy("date", "desc");

  return {
    moms,
    count: moms.length,
  };
}

//Fetch single MoM by ID
export async function fetchMoMById(momId) {
  if (!momId) {
    throw new Error("momId is required");
  }

  // Fetch MoM header + project info
  const mom = await knexDB("project_mom as pm")
    .leftJoin("projects as p", "pm.project_id", "p.project_id")
    .where("pm.mom_id", momId)
    .select([
      "pm.mom_id",
      "pm.project_id",
      "p.project_name",
      "pm.subject",
      "pm.venue",
      "pm.date",
      "pm.meeting_no",
      "pm.content",
    ])
    .first();

  if (!mom) {
    return null;
  }

  // Fetch participants
  const participants = await knexDB("project_mom_participants as pmp")
    .leftJoin("project_directory as pd", "pmp.pd_id", "pd.pd_id")
    .leftJoin("vendors as v", "pd.vendor_id", "v.id")
    .where("pmp.mom_id", momId)
    .select([
      "pmp.pap_id",
      "pmp.pd_id",
      "pd.responsibilities",
      "v.name as organization",
      "pd.contact_person",
      "pd.designation",
    ]);

  mom.participants = participants;

    // Parse content JSON
  if (typeof mom.content === "string") {
    mom.content = JSON.parse(mom.content);
  }

  return mom;
}


//Create MoM
async function createMoM(data) {
  const result = await knexDB("project_mom").insert({
    project_id: data.project_id,
    subject: data.subject,
    venue: data.venue,
    date: data.date,
    meeting_no: data.meeting_no,
    content: data.content ? JSON.stringify(data.content) : null,
  });

  // MySQL returns inserted id as array
  const mom_id = result[0];

  // Insert participants
  if (Array.isArray(data.participants) && data.participants.length > 0) {
    const records = data.participants.map((pd_id) => ({
      mom_id,
      pd_id,
    }));

    await knexDB("project_mom_participants").insert(records);
  }

  return { mom_id };
}

//Update MoM
async function updateMoM(momId, data) {
  const trx = await knexDB.transaction();

  try {
    const updateData = {};

    if (data.subject !== undefined) updateData.subject = data.subject;
    if (data.venue !== undefined) updateData.venue = data.venue;
    if (data.date !== undefined) updateData.date = data.date;
    if (data.meeting_no !== undefined) updateData.meeting_no = data.meeting_no;

    if (data.content !== undefined) {
      updateData.content = data.content
        ? JSON.stringify(data.content)
        : null;
    }

    if (Object.keys(updateData).length > 0) {
      await trx("project_mom")
        .where("mom_id", momId)
        .update(updateData);
    }

    // Update participants
    if (Array.isArray(data.participants)) {
      await trx("project_mom_participants")
        .where("mom_id", momId)
        .del();

      if (data.participants.length > 0) {
        const records = data.participants.map((pd_id) => ({
          mom_id: momId,
          pd_id,
        }));

        await trx("project_mom_participants").insert(records);
      }
    }

    await trx.commit();
    return { affected: 1 };
  } catch (error) {
    await trx.rollback();
    throw error;
  }
}

//Delete MoM
async function deleteMoM(momId) {
  // Delete participants first
  await knexDB("project_mom_participants")
    .where("mom_id", momId)
    .del();

  const affected = await knexDB("project_mom")
    .where("mom_id", momId)
    .del();

  return { affectedRows: affected };
}

/*-----------------Api Endpoints------------------*/

//Fetch all MoMs for a project
router.get("/moms/:project_id", async (req, res) => {
  try {
    const projectId = parseInt(req.params.project_id, 10);
    if (Number.isNaN(projectId)) {
      return res.status(400).json({ message: "Invalid project_id" });
    }

    const result = await fetchProjectMoMs(projectId);
    res.json(result);
  } catch (err) {
    console.error("Fetch MoMs error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

//Fetch single MoM
router.get("/mom/:mom_id", async (req, res) => {
  try {
    const momId = parseInt(req.params.mom_id, 10);
    if (Number.isNaN(momId)) {
      return res.status(400).json({ message: "Invalid mom_id" });
    }

    const mom = await fetchMoMById(momId);
    if (!mom) {
      return res.status(404).json({ message: "MoM not found" });
    }

    res.json(mom);
  } catch (err) {
    console.error("Fetch MoM error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

//Create MoM
router.post("/add/:project_id", async (req, res) => {
  try {
    const projectId = parseInt(req.params.project_id, 10);
    if (Number.isNaN(projectId)) {
      return res.status(400).json({ message: "Invalid project_id" });
    }

    const { subject, venue, date, meeting_no } = req.body;
    if (!subject || !venue || !date || !meeting_no) {
      return res.status(400).json({
        message: "subject, venue, date and meeting_no are required",
      });
    }

    // Ensure project exists
    const project = await knexDB("projects")
      .where({ project_id: projectId })
      .first();

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const payload = { ...req.body, project_id: projectId };
    const result = await createMoM(payload);

    res.json({
      message: "MoM created successfully",
      mom_id: result.mom_id,
    });
  } catch (err) {
    console.error("Create MoM error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

//Update MoM
router.put("/update/:mom_id", async (req, res) => {
  try {
    const momId = parseInt(req.params.mom_id, 10);
    if (Number.isNaN(momId)) {
      return res.status(400).json({ message: "Invalid mom_id" });
    }

    const existing = await knexDB("project_mom")
      .where({ mom_id: momId })
      .first();

    if (!existing) {
      return res.status(404).json({ message: "MoM not found" });
    }

    await updateMoM(momId, req.body);

    res.json({ message: "MoM updated successfully" });
  } catch (err) {
    console.error("Update MoM error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

//Delete MoM
router.delete("/delete/:mom_id", async (req, res) => {
  try {
    const momId = parseInt(req.params.mom_id, 10);
    if (Number.isNaN(momId)) {
      return res.status(400).json({ message: "Invalid mom_id" });
    }

    const existing = await knexDB("project_mom")
      .where({ mom_id: momId })
      .first();

    if (!existing) {
      return res.status(404).json({ message: "MoM not found" });
    }

    const result = await deleteMoM(momId);

    res.json({
      message: "MoM deleted successfully",
      affectedRows: result.affectedRows,
    });
  } catch (err) {
    console.error("Delete MoM error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
