import React, { useEffect, useState } from 'react';
const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

// BudgetView: fetches budget tree from backend and displays it in a styled hierarchy view
export default function BudgetView({ projectIdProp }) {
  const [tree, setTree] = useState([]); // array of root nodes
  const [expanded, setExpanded] = useState(new Set());
  const projectId = projectIdProp ?? 10; // default project id (override via prop)

  useEffect(() => {
    let mounted = true;
    async function fetchTree() {
      try {
        const res = await fetch(`${API_BASE}/budget/fetch/${projectId}`, { credentials: 'include' });
        const text = await res.text();
        let json = null;
        try { json = text ? JSON.parse(text) : null; } catch (e) { json = null; }

        if (!res.ok) {
          console.error('Fetch failed', res.status, json);
          return;
        }

        const data = (json && json.data) || [];
        if (!Array.isArray(data)) {
          // backend might return a single root object — coerce to array
          setTree(data ? [data] : []);
        } else {
          setTree(data);
        }

        // expand all top-level by default
        const topExpanded = new Set();
        data.forEach((n) => { if (n && n.id) topExpanded.add(n.id); });
        setExpanded(topExpanded);

        // log final received tree structure for debugging
        console.log('Fetched budget tree:', JSON.stringify(data, null, 2));
      } catch (err) {
        console.error('Error fetching budget hierarchy', err);
      }
    }

    fetchTree();
    return () => { mounted = false; };
  }, [projectId]);

  // compute total cost for a node (recursive). Leaves use quantity * rate (prefer item_rate + quantity from backend, fallback to component)
  function computeTotal(node) {
    if (!node) return 0;

    // Leaf nodes: use quantity * rate (prefer item_rate + quantity from backend, fallback to component)
    if (Number(node.is_leaf) === 1) {
      const rate = Number(node.item_rate ?? (node.component && node.component.rate) ?? 0) || 0;
      const qty = Number(node.quantity ?? (node.component && node.component.quantity) ?? 0) || 0;
      return rate * qty;
    }

    // Non-leaf: sum cumulative totals of children recursively
    if (!node.children || node.children.length === 0) return 0;
    return node.children.reduce((sum, c) => sum + computeTotal(c), 0);
  }

  function toggle(id) {
    setExpanded((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id); else copy.add(id);
      return copy;
    });
  }

  // Render node recursively using markup inspired by provided design
  function Node({ node }) {
    const isLeaf = Number(node.is_leaf) === 1;
    const isExpanded = node.id && expanded.has(node.id);
    const total = computeTotal(node);

    return (
      <div className="ml-0">
        <div className={`bg-gray-900 p-6 rounded-lg shadow-md mb-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isLeaf ? <span className="w-6" /> : (
                <button onClick={() => toggle(node.id)} className="material-icons text-gray-400">{isExpanded ? 'expand_more' : 'chevron_right'}</button>
              )}
              <div className="flex flex-col">
                <span className={`${isLeaf ? 'text-lg font-medium text-gray-300' : 'font-bold text-md text-gray-100'}`}>{node.name}</span>
                {isLeaf && (
                  <span className="text-sm text-gray-500">({node.item_unit ?? (node.component && node.component.unit) ?? ''})</span>
                )}
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-400">Total Cost</p>
              <p className="text-lg font-semibold text-white">₹{total}</p>
            </div>
          </div>
        </div>

        {/* children list */}
        {!isLeaf && node.children && node.children.length > 0 && isExpanded && (
          <ul className="space-y-4 pl-8 border-l border-gray-700 ml-3">
            {node.children.map((child) => (
              <li key={child.id ?? child.name} className="relative py-2">
                <span className="absolute -left-[13px] top-1/2 -translate-y-1/2 w-5 h-px bg-gray-700"></span>

                {/* if child is leaf */}
                {Number(child.is_leaf) === 1 ? (
                  <div className="bg-gray-800 p-4 rounded-md">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium text-gray-300">{child.item_name ?? child.name}</span>
                        <span className="text-gray-500 text-sm">({child.item_unit ?? ''})</span>

                        {/* quantity × rate breakdown */}
                        <div className="text-xs text-gray-400 mt-1">
                          ({child.quantity ?? 0}) × ({child.item_rate ?? 0}) = ₹{(Number(child.quantity ?? 0) * Number(child.item_rate ?? 0)).toFixed(2)}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">₹{(Number(child.quantity ?? 0) * Number(child.item_rate ?? 0)).toFixed(2)}</p>
                        <p className="text-xs text-gray-400">final cost</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  // child is a category with its own children
                  <div>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => toggle(child.id)} className="material-icons text-gray-400">{child.id && expanded.has(child.id) ? 'expand_more' : 'chevron_right'}</button>
                      <span className="font-semibold text-gray-200">{child.name}</span>
                    </div>

                    {child.children && child.children.length > 0 && child.id && expanded.has(child.id) && (
                      <ul className="space-y-4 pl-8 border-l border-gray-700 ml-3 mt-4">
                        {child.children.map((g) => (
                          <li key={g.id ?? g.name} className="relative py-2">
                            <span className="absolute -left-[13px] top-1/2 -translate-y-1/2 w-5 h-px bg-gray-700"></span>
                            <div className="bg-gray-800 p-4 rounded-md">
                              <div className="flex justify-between items-center">
                                <div>
                                  <span className="font-medium text-gray-300">{g.item_name ?? g.name}</span>
                                  <span className="text-gray-500 text-sm">({g.item_unit ?? ''})</span>

                                  <div className="text-xs text-gray-400 mt-1">
                                    ({g.quantity ?? 0}) × ({g.item_rate ?? 0}) = ₹{(Number(g.quantity ?? 0) * Number(g.item_rate ?? 0)).toFixed(2)}
                                  </div>
                                </div>

                                <div className="text-right">
                                  <p className="text-sm font-semibold text-white">₹{(Number(g.quantity ?? 0) * Number(g.item_rate ?? 0)).toFixed(2)}</p>
                                  <p className="text-xs text-gray-400">final cost</p>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="font-display bg-background-dark text-gray-200 min-h-screen p-8">
      <div className="w-full max-w-full mx-auto">
        <div className="flex-shrink-0 mb-8">
          <h1 className="text-3xl font-bold text-white">Budget Hierarchy</h1>
          <p className="text-gray-400">Overview of the project's budget breakdown.</p>
        </div>

        <div className="space-y-4">
          {/* Render each root node */}
          {tree.length === 0 && (
            <div className="bg-gray-900 p-6 rounded-lg shadow-md">No budget data found.</div>
          )}

          {tree.map((root) => (
            <div key={root.id ?? root.name} className="ml-0">
              <div className="bg-gray-900 p-6 rounded-lg shadow-md mb-4">
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex items-center space-x-2">
                    <button onClick={() => toggle(root.id)} className="material-icons text-gray-400 text-lg">{root.id && expanded.has(root.id) ? 'expand_more' : 'chevron_right'}</button>
                    <span className="font-bold text-lg text-white">{root.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Total Cost</p>
                    <p className="text-2xl font-bold text-primary">₹{computeTotal(root)}</p>
                  </div>
                </div>
              </div>

              <div className="ml-8 space-y-4">
                {root.children && root.children.map((c) => (
                  <Node key={c.id ?? c.name} node={c} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}