import express from "express";
import { knexDB } from "../Database.js";

const router = express.Router();

//Fetch project agendas
export async function fetchProjectAgendas(projectId) {
  if (!projectId) {
    throw new Error("projectId is required");
  }

  const agendas = await knexDB("project_agenda")
    .where("project_id", projectId)
    .select([
      "agenda_id",
      "subject",
      "meeting_no",
      "date",
      "venue"
    ])
    .orderBy("date", "desc");

  return {
    agendas,
    count: agendas.length,
  };
}

//Fetch single agenda by ID
export async function fetchAgendaById(agendaId) {
  if (!agendaId) {
    throw new Error("agendaId is required");
  }

  // Get agenda details with project name
  const agenda = await knexDB("project_agenda as pa")
    .leftJoin("projects as p", "pa.project_id", "p.project_id")
    .where("pa.agenda_id", agendaId)
    .select([
      "pa.agenda_id",
      "pa.project_id",
      "p.project_name",
      "pa.subject",
      "pa.venue",
      "pa.date",
      "pa.meeting_no",
      "pa.content"
    ])
    .first();

  if (!agenda) {
    return null;
  }

  // Get participants for this agenda
  const participants = await knexDB("project_agenda_participants as pap")
    .leftJoin("project_directory as pd", "pap.pd_id", "pd.pd_id")
    .leftJoin("vendors as v", "pd.vendor_id", "v.id")
    .where("pap.agenda_id", agendaId)
    .select([
      "pap.pap_id",
      "pap.pd_id",
      "pd.responsibilities",
      "v.name as company_name",
      "pd.contact_person",
      "pd.designation"
    ]);


  agenda.participants = participants;

  return agenda;
}

/*--------------------------CRUD OPERATIONS--------------------------*/

// Create agenda
async function createAgenda(data) {
  const result = await knexDB("project_agenda").insert({
    project_id: data.project_id,
    subject: data.subject,
    venue: data.venue,
    date: data.date,
    meeting_no: data.meeting_no,
    content: data.content ? JSON.stringify(data.content) : null,
  });

  // ✅ FIX: MySQL + Knex returns [id]
  const agenda_id = result[0];

  // Insert participants
  if (Array.isArray(data.participants) && data.participants.length > 0) {
    const participantRecords = data.participants.map(pd_id => ({
      agenda_id,
      pd_id,
    }));

    await knexDB("project_agenda_participants").insert(participantRecords);
  }

  return { agenda_id };
}


// Update agenda
async function updateAgenda(agendaId, data) {
  const trx = await knexDB.transaction();

  try {
    /* ---------------- AGENDA UPDATE ---------------- */
    const allowedFields = ["subject", "venue", "date", "meeting_no"];
    const updateData = {};

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    if (data.content !== undefined) {
      updateData.content = data.content
        ? JSON.stringify(data.content)
        : null;
    }

    if (Object.keys(updateData).length > 0) {
      await trx("project_agenda")
        .where("agenda_id", agendaId)
        .update(updateData);
    }

    /* ---------------- PARTICIPANTS UPDATE ---------------- */
    if (Array.isArray(data.participants)) {
      await trx("project_agenda_participants")
        .where("agenda_id", agendaId)
        .del();

      if (data.participants.length > 0) {
        const participantRecords = data.participants.map(pd_id => ({
          agenda_id: agendaId,
          pd_id
        }));

        await trx("project_agenda_participants").insert(participantRecords);
      }
    }

    await trx.commit();
    return { affected: 1 };

  } catch (error) {
    await trx.rollback();
    throw error;
  }
}


// Delete agenda
async function deleteAgenda(agendaId) {
  // Delete participants first (foreign key constraint)
  await knexDB("project_agenda_participants")
    .where("agenda_id", agendaId)
    .del();

  // Delete agenda
  const affected = await knexDB("project_agenda")
    .where("agenda_id", agendaId)
    .del();

  return { affectedRows: affected };
}

/* -------------------------------------------------------
   API ENDPOINTS
-------------------------------------------------------- */

// 1. Fetch all agendas for a project
router.get("/agendas/:project_id", async (req, res) => {
  try {
    const projectId = parseInt(req.params.project_id, 10);
    if (Number.isNaN(projectId)) {
      return res.status(400).json({ message: "Invalid project_id" });
    }

    const result = await fetchProjectAgendas(projectId);
    res.json(result);
  } catch (err) {
    console.error("Fetch agendas error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 2. Fetch single agenda by agenda_id
router.get("/agenda/:agenda_id", async (req, res) => {
  try {
    const agendaId = parseInt(req.params.agenda_id, 10);
    if (Number.isNaN(agendaId)) {
      return res.status(400).json({ message: "Invalid agenda_id" });
    }

    const agenda = await fetchAgendaById(agendaId);
    
    if (!agenda) {
      return res.status(404).json({ message: "Agenda not found" });
    }

    res.json(agenda);
  } catch (err) {
    console.error("Fetch agenda error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 5. Create agenda for a project
router.post("/add/:project_id", async (req, res) => {
  try {
    const projectId = parseInt(req.params.project_id, 10);
    if (Number.isNaN(projectId)) {
      return res.status(400).json({ 
        message: "project_id path parameter is required and must be a number" 
      });
    }

    // Validate required fields
    const { subject, venue, date, meeting_no } = req.body;
    if (!subject || !venue || !date || !meeting_no) {
      return res.status(400).json({ 
        message: "subject, venue, date, and meeting_no are required" 
      });
    }

    // Ensure project exists
    const project = await knexDB("projects")
      .where({ project_id: projectId })
      .first();
    
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Merge project_id from path into request body
    const payload = { ...req.body, project_id: projectId };
    const result = await createAgenda(payload);

    res.json({ 
      message: "Agenda created successfully", 
      agenda_id: result.agenda_id 
    });
  } catch (err) {
    console.error("Create agenda error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 3. Update agenda by agenda_id
router.put("/update/:agenda_id", async (req, res) => {
  try {
    const agendaId = parseInt(req.params.agenda_id, 10);
    if (Number.isNaN(agendaId)) {
      return res.status(400).json({ message: "agenda_id is required and must be a number" });
    }

    // Ensure the agenda exists
    const existing = await knexDB("project_agenda")
      .where({ agenda_id: agendaId })
      .first();
    
    if (!existing) {
      return res.status(404).json({ message: "Agenda not found" });
    }

    const result = await updateAgenda(agendaId, req.body);
    res.json({ 
      message: "Agenda updated successfully", 
      affectedRows: result.affected 
    });
  } catch (err) {
    console.error("Update agenda error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 4. Delete agenda by agenda_id
router.delete("/delete/:agenda_id", async (req, res) => {
  try {
    const agendaId = parseInt(req.params.agenda_id, 10);
    if (Number.isNaN(agendaId)) {
      return res.status(400).json({ message: "agenda_id is required and must be a number" });
    }

    // Ensure the agenda exists
    const existing = await knexDB("project_agenda")
      .where({ agenda_id: agendaId })
      .first();
    
    if (!existing) {
      return res.status(404).json({ message: "Agenda not found" });
    }

    const result = await deleteAgenda(agendaId);
    res.json({ 
      message: "Agenda deleted successfully", 
      affectedRows: result.affectedRows 
    });
  } catch (err) {
    console.error("Delete agenda error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;