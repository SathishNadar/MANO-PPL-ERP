import express from "express";
import * as DB from "../Database.js";  
import { knexDB } from "../Database.js";
import { authenticateJWT } from "../AuthAPI/LoginAPI.js";

const router = express.Router();

// Recursively sync JSON budget hierarchy with DB: insert, update, delete nodes and leaf items
async function syncBudgetHierarchy(jsonNode, parentId, projectId, effective_date) {
  // Fetch existing node if ID exists
  let dbNode = jsonNode.id
    ? await knexDB('budget_category').where({ id: jsonNode.id, project_id: projectId }).first()
    : null;

  if (!dbNode) {
    const insertedCat = await knexDB('budget_category')
      .insert({
        parent_id: parentId,
        project_id: projectId,
        name: jsonNode.name,
        is_leaf: jsonNode.is_leaf,
      });

    const newIdObj = Array.isArray(insertedCat) ? insertedCat[0] : insertedCat;
    const newId = newIdObj?.id ?? newIdObj;
    jsonNode.id = newId;
    dbNode = { id: newId };
  } else {
    // Update existing node
    await knexDB('budget_category').where({ id: dbNode.id }).update({
      name: jsonNode.name,
      is_leaf: jsonNode.is_leaf,
    });
  }

  // allow frontend to send either `item` (preferred) or legacy `component`
  const itemPayload = jsonNode.item ?? jsonNode.component ?? null;

  // Handle leaf node item and rate
  if (jsonNode.is_leaf && itemPayload) {
    let itemRow = await knexDB('item')
      .where({ project_id: projectId, name: itemPayload.name })
      .first();

    let item;
    if (!itemRow) {
      const inserted = await knexDB('item')
        .insert({
          project_id: projectId,
          name: itemPayload.name,
          unit: itemPayload.unit
        });

      const first = Array.isArray(inserted) ? inserted[0] : inserted;
      const itemId = first?.item_id ?? first?.id ?? first;
      item = { item_id: itemId };
    } else {
      const itemId = itemRow.item_id ?? itemRow.id;
      item = { item_id: itemId };
    }

    // insert item_rate if rate provided (allow 0). also store quantity if present
    if (itemPayload.rate != null) {
      // defensive parse for numeric values
      const rateVal = Number(itemPayload.rate);
      const qVal = itemPayload.quantity != null ? Number(itemPayload.quantity) : 0.0;

      await knexDB('item_rate')
        .insert({
          item_id: item.item_id,
          rate: isNaN(rateVal) ? itemPayload.rate : rateVal,
          effective_from: effective_date,
          quantity: isNaN(qVal) ? 0.0 : qVal
        })
        .catch(err => {
          // log but don't crash entire sync — optional: consider upsert/merge for Postgres
          console.error('item_rate insert error (item_id=' + item.item_id + '):', err.message);
          throw err; // rethrow to let outer try/catch handle transaction-level rollback if used
        });
    }

    await knexDB('budget_category').where({ id: jsonNode.id })
      .update({ item_id: item.item_id });
  }

  // Fetch children from DB
  const dbChildren = await knexDB('budget_category')
    .where({ parent_id: jsonNode.id, project_id: projectId });

  const inputChildIds = (jsonNode.children || []).map(c => c.id).filter(Boolean);

  // Delete children missing in input
  for (const dbChild of dbChildren) {
    if (!inputChildIds.includes(dbChild.id)) {
      await knexDB('budget_category').where({ id: dbChild.id }).del();
      // Optionally handle cascading deletes for associated items if needed
    }
  }

  // Recursively process children
  if (jsonNode.children && jsonNode.children.length > 0) {
    for (const child of jsonNode.children) {
      await syncBudgetHierarchy(child, jsonNode.id, projectId, effective_date);
    }
  }
}

async function fetchBudgetHierarchy(projectId) {
  const rows = await knexDB('budget_category as bc')
    .leftJoin('item as c', 'bc.item_id', 'c.item_id')
    .leftJoin(
      knexDB('item_rate')
        .select('item_id')
        .max('effective_from as max_eff')
        .where('effective_from', '<=', knexDB.fn.now())
        .groupBy('item_id')
        .as('latest_rate'),
      function () {
        this.on('c.item_id', '=', 'latest_rate.item_id');
      }
    )
    .leftJoin('item_rate as cr', function () {
      this.on('cr.item_id', '=', 'c.item_id')
          .andOn('cr.effective_from', '=', 'latest_rate.max_eff');
    })
    .select(
      'bc.id',
      'bc.parent_id',
      'bc.name',
      'bc.is_leaf',
      'c.item_id',
      'c.name as item_name',
      'c.unit as item_unit',
      'cr.rate as item_rate',
      'cr.quantity as quantity'
    )
    .where('bc.project_id', projectId)
    .orderBy('bc.id');

  // Build map of id to node
  const nodeMap = new Map();
  for (const row of rows) {
    row.quantity = row.quantity != null ? Number(row.quantity) : 0;
    row.children = [];
    nodeMap.set(row.id, row);
  }

  // Assemble tree
  const treeRoots = [];
  for (const node of nodeMap.values()) {
    if (node.parent_id === null) {
      treeRoots.push(node);
    } else {
      const parent = nodeMap.get(node.parent_id);
      if (parent) parent.children.push(node);
    }
  }

  return treeRoots;
}

router.get('/exists/:projectId', async (req, res) => {
  const { projectId } = req.params;
  if (!projectId) {
    return res.status(400).json({ success: false, message: 'projectId required' });
  }

  try {
    // Use knex (same style as other routes in this file)
    const rows = await knexDB('budget_category')
      .where({ project_id: projectId })
      .count('id as cnt');

    // knex returns an array with a count value; normalize safely
    const cnt = Array.isArray(rows) ? rows[0].cnt : rows.cnt;
    const exists = Number(cnt) > 0;

    return res.json({ success: true, exists });
  } catch (err) {
    console.error('Error checking budget existence:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});


// POST /budget/sync - update entire budget hierarchy for a project
router.post("/sync/:projectId", authenticateJWT, async (req, res) => {
  try {
    const { projectId } = req.params;
    const effective_date = req.body.effective_date; // Expect full hierarchy JSON
    const hierarchyJson = req.body.data; // Expect full hierarchy JSON

    if (!hierarchyJson) {
      return res.status(400).json({ ok: false, message: "Missing hierarchy data" });
    }

    // Call your recursive sync function - assumes top-level node incoming
    await syncBudgetHierarchy(hierarchyJson, null, parseInt(projectId), effective_date);

    res.json({ ok: true, message: "Budget hierarchy synced successfully" });
  } catch (err) {
    console.error("Budget sync error:", err);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});

// GET /budget/fetch/:projectId - fetch full budget hierarchy for a project
router.get("/fetch/:projectId", authenticateJWT, async (req, res) => {
  try {
    const { projectId } = req.params;

    const tree = await fetchBudgetHierarchy(parseInt(projectId));

    res.json({ ok: true, data: tree });
  } catch (err) {
    console.error("Budget fetch error:", err);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});

export default router;
