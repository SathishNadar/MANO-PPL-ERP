import express from "express";
import * as DB from "../Database.js";
import { knexDB } from "../Database.js";
import { authenticateJWT } from "../AuthAPI/LoginAPI.js";

const router = express.Router();

// CREATE hierarchy from scratch (no deletes, no updates)
// add trx parameter (default: null)
async function createBudgetHierarchy(jsonRoot, projectId, effectiveDate, parentId = null, iteration, trx = null) {
  const db = trx || knexDB; // use transaction if provided, otherwise global knex

  // insert category
  const [newId] = await db("budget_category").insert({
    parent_id: parentId,
    project_id: projectId,
    iteration: iteration,
    name: jsonRoot.name,
    is_leaf: jsonRoot.is_leaf
  });

  // -------------------------------------------------
  // Leaf node → item + item_rate + attach item_id
  // -------------------------------------------------
  if (jsonRoot.is_leaf) {
    const itemData = jsonRoot.item;
    let itemId = itemData?.item_id ?? null;

    // If no item_id → create item
    if (!itemId) {
      const [newItemId] = await db("item").insert({
        project_id: projectId,
        name: itemData.name,
        unit: itemData.unit,
        iteration: iteration
      });

      itemId = newItemId;

      // Insert item_rate for new item
      await db("item_rate").insert({
        item_id: itemId,
        rate: itemData.rate,
        quantity: itemData.quantity ?? 0,
        effective_from: effectiveDate,
        iteration: iteration
      });
    } else {
      // If item_id is given, also allow inserting new rate (optional)
      if (itemData.rate != null) {
        await db("item_rate").insert({
          item_id: itemId,
          rate: itemData.rate,
          quantity: itemData.quantity ?? 0,
          effective_from: effectiveDate,
          iteration: iteration
        });
      }
    }

    // Update category with item_id
    await db("budget_category")
      .where({ id: newId })
      .update({ item_id: itemId });
  }

  // -------------------------------------------------
  // Recursively process children (pass trx)
  // -------------------------------------------------
  if (jsonRoot.children?.length > 0) {
    for (const child of jsonRoot.children) {
      await createBudgetHierarchy(child, projectId, effectiveDate, newId, iteration, trx);
    }
  }

  return newId;
}


async function fetchBudgetHierarchy(projectId) {
  const rows = await knexDB('budget_category as bc')
    .leftJoin('item as c', function () {
      this.on('bc.item_id', '=', 'c.item_id')
        .andOn('c.is_active', '=', 1);  // only active items
    })
    .leftJoin(
      knexDB('item_rate')
        .select('item_id')
        .max('effective_from as max_eff')
        .where('effective_from', '<=', knexDB.fn.now())
        .where('is_active', 1)  // only active rates
        .groupBy('item_id')
        .as('latest_rate'),
      function () {
        this.on('c.item_id', '=', 'latest_rate.item_id');
      }
    )
    .leftJoin('item_rate as cr', function () {
      this.on('cr.item_id', '=', 'c.item_id')
        .andOn('cr.effective_from', '=', 'latest_rate.max_eff')
        .andOn('cr.is_active', '=', 1);  // only active rates
    })
    .where('bc.project_id', projectId)
    .where('bc.is_active', 1)  // only active categories
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

// POST /budget/create - create entire budget hierarchy for a project
router.post("/create/:projectId", authenticateJWT, async (req, res) => {
  try {
    const { projectId } = req.params;
    const effective_date = req.body.effective_date; // Expect full hierarchy JSON
    const hierarchyJson = req.body.data; // Expect full hierarchy JSON

    if (!hierarchyJson) {
      return res.status(400).json({ ok: false, message: "Missing hierarchy data" });
    }

    // Call your recursive sync function - assumes top-level node incoming
    await createBudgetHierarchy(hierarchyJson, parseInt(projectId), effective_date, null, 0);

    res.json({ ok: true, message: "Budget hierarchy synced successfully" });
  } catch (err) {
    console.error("Budget sync error:", err);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});

// PUT /budget/update/:projectId - mark hierarchy + items inactive, then recreate
router.put("/update/:projectId", authenticateJWT, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { effective_date, data, inactive_items = [] } = req.body; // renamed to inactive_items

    if (!data || !effective_date) {
      return res.status(400).json({ ok: false, message: "Missing data or effective_date" });
    }

    await knexDB.transaction(async (trx) => {
      const projectNum = parseInt(projectId);

      // 1) MARK entire hierarchy inactive for this project
      await trx("budget_category")
        .where({ project_id: projectNum })
        .update({ is_active: 0 });

      // 2) MARK specified items + ALL their rates inactive
      if (inactive_items.length > 0) {
        // Mark item_rates inactive first
        await trx("item_rate")
          .whereIn("item_id", inactive_items)
          .update({ is_active: 0 });

        // Then mark items inactive
        await trx("item")
          .where({ project_id: projectNum })
          .whereIn("item_id", inactive_items)
          .update({ is_active: 0 });
      }

      // 3) Fetch last iteration number using trx
      const Iteration = await trx("budget_category")
        .where({ project_id: projectNum })
        .max("iteration as max_iter")
        .first();

      // 4) RECREATE hierarchy using transaction-aware create function (pass trx)
      await createBudgetHierarchy(data, projectNum, effective_date, null, (Iteration?.max_iter ?? 0) + 1, trx);
    });

    res.json({
      ok: true,
      message: `Hierarchy updated. Marked ${inactive_items.length} items inactive.`
    });
  } catch (err) {
    console.error("Budget update error:", err);
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

