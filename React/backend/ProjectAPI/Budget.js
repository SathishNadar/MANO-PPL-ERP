import express from "express";
import * as DB from "../Database.js";  
import { knexDB } from "../Database.js";
import { authenticateJWT } from "../AuthAPI/LoginAPI.js";

const router = express.Router();

// Recursively sync JSON budget hierarchy with DB: insert, update, delete nodes and leaf components
async function syncBudgetHierarchy(jsonNode, parentId, projectId, effective_date) {
  // Fetch existing node if ID exists
  let dbNode = jsonNode.id
    ? await knexDB('budget_category').where({ id: jsonNode.id, project_id: projectId }).first()
    : null;

  // Insert new node if missing
  if (!dbNode) {
    const [newId] = await knexDB('budget_category').insert({
      parent_id: parentId,
      project_id: projectId,
      name: jsonNode.name,
      is_leaf: jsonNode.is_leaf,
    });
    jsonNode.id = newId;
    dbNode = { id: newId };
  } else {
    // Update existing node
    await knexDB('budget_category').where({ id: dbNode.id }).update({
      name: jsonNode.name,
      is_leaf: jsonNode.is_leaf,
    });
  }

  // Handle leaf node component and rate
  if (jsonNode.is_leaf && jsonNode.component) {
    let component = await knexDB('component')
      .where({ project_id: projectId, name: jsonNode.component.name })
      .first();

    if (!component) {
      const [componentId] = await knexDB('component').insert({
        project_id: projectId,
        name: jsonNode.component.name,
        unit: jsonNode.component.unit
      });
      component = { component_id: componentId };
    }

    if (jsonNode.component.rate) {
      await knexDB('component_rate').insert({
        component_id: component.component_id,
        rate: jsonNode.component.rate,
        effective_from: effective_date,
      });
    }

    await knexDB('budget_category').where({ id: jsonNode.id })
      .update({ component_id: component.component_id });
  }

  // Fetch children from DB
  const dbChildren = await knexDB('budget_category')
    .where({ parent_id: jsonNode.id, project_id: projectId });

  const inputChildIds = (jsonNode.children || []).map(c => c.id).filter(Boolean);

  // Delete children missing in input
  for (const dbChild of dbChildren) {
    if (!inputChildIds.includes(dbChild.id)) {
      await knexDB('budget_category').where({ id: dbChild.id }).del();
      // Optionally handle cascading deletes for associated components if needed
    }
  }

  // Recursively process children
  if (jsonNode.children && jsonNode.children.length > 0) {
    for (const child of jsonNode.children) {
      await syncBudgetHierarchy(child, jsonNode.id, projectId, effective_date);
    }
  }
}

// Fetch full project budget hierarchy in one query and build nested tree in memory with latest component rates
async function fetchBudgetHierarchy(projectId) {
  // Fetch all categories with joined component and latest rate data
  const rows = await knexDB('budget_category as bc')
    .leftJoin('component as c', 'bc.component_id', 'c.component_id')
    .leftJoin(
      knexDB('component_rate')
        .select('component_id')
        .max('effective_from as max_eff')
        .where('effective_from', '<=', knexDB.fn.now())
        .groupBy('component_id')
        .as('latest_rate'),
      function () {
        this.on('c.component_id', '=', 'latest_rate.component_id');
      }
    )
    .leftJoin('component_rate as cr', function () {
      this.on('cr.component_id', '=', 'c.component_id')
          .andOn('cr.effective_from', '=', 'latest_rate.max_eff');
    })
    .select(
      'bc.id',
      'bc.parent_id',
      'bc.name',
      'bc.is_leaf',
      'c.component_id',
      'c.name as component_name',
      'c.unit as component_unit',
      'cr.rate as component_rate'
    )
    .where('bc.project_id', projectId)
    .orderBy('bc.id');

  // Build map of id to node
  const nodeMap = new Map();
  for (const row of rows) {
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
