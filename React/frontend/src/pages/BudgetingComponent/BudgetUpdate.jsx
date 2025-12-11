import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from "react-router-dom";
const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

// BudgetUpdate: fetch existing hierarchy, make it editable (same UI as creation), and PUT to update endpoint
function BudgetUpdate() {
  const [tree, setTree] = useState({ id: 'root', name: '', type: 'category', children: [] });
  const [selectedId, setSelectedId] = useState(null);
  const [expanded, setExpanded] = useState(new Set(['root']));
  const [toast, setToast] = useState(null);
  const { projectId } = useParams();

  // track which input was focused so we can restore focus after rerenders
  const focusedRef = useRef({ id: null, field: null });
  // track dragging id
  const draggingRef = useRef(null);
  // highlight drop target
  const [dropTarget, setDropTarget] = useState(null);

  // track original item_ids returned by server so we can compute deletions
  const originalItemIdsRef = useRef(new Set());
  // track item_ids deleted by the user (leaf nodes removed)
  const deletedItemsRef = useRef(new Set());

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  // after every render, if there was a focused input, try to restore focus & cursor
  useEffect(() => {
    const { id, field } = focusedRef.current || {};
    if (!id || !field) return;
    const sel = document.querySelector(`[data-node-id="${id}"][data-field="${field}"]`);
    if (sel) {
      sel.focus();
      // put cursor at end
      const val = sel.value || '';
      try { sel.setSelectionRange(val.length, val.length); } catch (e) {}
    }
  }, [tree]);

  // fetch server hierarchy on mount
  useEffect(() => {
    if (!projectId) return;

    async function fetchHierarchy() {
      try {
        setToast('Loading...');
        const res = await fetch(`${API_BASE}/budget/fetch/${projectId}`, {
          method: 'GET',
          credentials: 'include'
        });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json || !json.ok) {
          setToast('Failed to load budget');
          console.error('Fetch failed', res.status, json);
          return;
        }

        const serverRoots = Array.isArray(json.data) ? json.data : [];

        // map server nodes to client node shape
        function mapNode(snode) {
          const isLeaf = Number(snode.is_leaf) === 1;
          const node = {
            id: snode.id != null ? String(snode.id) : genId(),
            // keep server id (string) when available so developer can trace
            name: snode.name ?? (isLeaf ? (snode.item_name ?? 'New Item') : 'New Category'),
            type: isLeaf ? 'item' : 'category',
            unit: snode.item_unit ?? '',
            qty: snode.quantity != null ? Number(snode.quantity) : '',
            rate: snode.item_rate != null ? Number(snode.item_rate) : '',
            item_id: snode.item_id ?? null,
            children: Array.isArray(snode.children) ? snode.children.map(mapNode) : []
          };
          return node;
        }

        // If backend returned a single root, use it directly. If multiple roots, attach them
        // under an empty-named root (so we do NOT force a "Main Budget" parent by default).
        let clientRoot = null;
        if (serverRoots.length === 1) {
          clientRoot = mapNode(serverRoots[0]);
        } else {
          clientRoot = { id: 'root', name: '', type: 'category', children: serverRoots.map(mapNode) };
        }

        // collect original item_ids from server roots
        originalItemIdsRef.current = new Set();
        function collectItemIds(snode) {
          if (snode.item_id != null) originalItemIdsRef.current.add(Number(snode.item_id));
          if (Array.isArray(snode.children)) snode.children.forEach(collectItemIds);
        }
        serverRoots.forEach(collectItemIds);

        setTree(clientRoot);
        setExpanded(new Set(['root']));
        setToast(null);
      } catch (err) {
        console.error('Hierarchy fetch error', err);
        setToast('Failed to load budget');
      }
    }

    fetchHierarchy();
  }, [projectId]);

  // helper to generate ids
  const genId = () => Math.random().toString(36).slice(2, 9);

  // recursive update helpers
  function findAndUpdate(node, id, updater) {
    if (!node) return node;
    if (node.id === id) return updater(node);
    if (!node.children) return node;
    return { ...node, children: node.children.map((c) => findAndUpdate(c, id, updater)) };
  }

  // find and remove node by id, return { newTree, removedNode }
  function findAndRemove(node, id) {
    if (!node) return { node: null, removed: null };
    if (!node.children || node.children.length === 0) return { node, removed: null };
    let removed = null;
    const newChildren = [];
    for (const child of node.children) {
      if (child.id === id) {
        removed = child;
        continue;
      }
      const res = findAndRemove(child, id);
      if (res.removed) {
        newChildren.push(res.node);
        removed = res.removed;
      } else {
        newChildren.push(child);
      }
    }
    return { node: { ...node, children: newChildren }, removed };
  }

  // find parent id of a node
  function findParentId(node, targetId, parentId = null) {
    if (!node) return null;
    if (node.id === targetId) return parentId;
    if (!node.children) return null;
    for (const c of node.children) {
      const res = findParentId(c, targetId, node.id);
      if (res) return res;
    }
    return null;
  }

  // check if targetId is descendant of nodeId
  function isDescendant(node, nodeId, targetId) {
    if (!node) return false;
    if (node.id === nodeId) {
      // check inside this subtree for targetId
      function search(n) {
        if (!n) return false;
        if (n.id === targetId) return true;
        if (!n.children) return false;
        return n.children.some(search);
      }
      return search(node);
    }
    if (!node.children) return false;
    return node.children.some((c) => isDescendant(c, nodeId, targetId));
  }

  function addCategory(parentId) {
    const name = window.prompt('Enter category name', 'New Category');
    if (!name) return;
    const newNode = { id: genId(), name, type: 'category', children: [] };
    if (parentId === null) parentId = 'root';
    setTree((prev) => findAndUpdate(prev, parentId, (n) => ({ ...n, children: [...(n.children || []), newNode] })));
    setExpanded((s) => new Set(s).add(parentId));
    setSelectedId(newNode.id);
  }

  function addItem(parentId) {
    const name = window.prompt('Enter item name', 'New Item');
    if (!name) return;
    const unit = window.prompt('Enter unit (e.g. kg, unit, sq.m)', 'unit');
    if (unit === null) return;
    const qtyStr = window.prompt('Enter quantity (number)', '1');
    if (qtyStr === null) return;
    const rateStr = window.prompt('Enter rate (number)', '0');
    if (rateStr === null) return;
    const qty = qtyStr === '' ? '' : Number(qtyStr) || 0;
    const rate = rateStr === '' ? '' : Number(rateStr) || 0;
    const newNode = { id: genId(), name, type: 'item', unit, qty, rate, children: [] };
    if (parentId === null) parentId = selectedId || 'root';
    setTree((prev) => findAndUpdate(prev, parentId, (n) => ({ ...n, children: [...(n.children || []), newNode] })));
    setExpanded((s) => new Set(s).add(parentId));
    setSelectedId(newNode.id);
  }

  function toggleExpand(id) {
    setExpanded((s) => {
      const copy = new Set(s);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  }

  function updateNodeField(id, field, value) {
    // save focused field so we can restore focus after state update
    focusedRef.current = { id, field };
    setTree((prev) => findAndUpdate(prev, id, (n) => ({ ...n, [field]: value })));
  }

  function removeNode(id) {
    if (id === 'root') return;

    // use findAndRemove to get the removed node and new tree
    const res = findAndRemove(tree, id);
    if (!res || !res.removed) return;

    const removedNode = res.removed;

    // if the removed node was a leaf and has an item_id from server, mark it for deletion
    if (removedNode.type === 'item' && removedNode.item_id != null) {
      deletedItemsRef.current.add(Number(removedNode.item_id));
    }

    setTree(res.node || { id: 'root', name: '', type: 'category', children: [] });
    if (selectedId === id) setSelectedId(null);
  }

  function handleCancel() {
    const ok = window.confirm('Are you sure you want to cancel the changes?');
    if (!ok) return;
    // reset by re-fetching
    window.location.reload();
  }

  // Build payload node (format requested by backend)
  function buildPayloadNode(node) {
    const out = {
      name: node.name ?? '',
      is_leaf: node.type === 'item' ? 1 : 0,
      children: []
    };

    if (node.type === 'item') {
      const rawRate = node.rate === '' || node.rate === null || node.rate === undefined ? 0 : Number(node.rate) || 0;
      const rateNum = Math.round(rawRate * 100) / 100;
      const rawQty = node.qty === '' || node.qty === null || node.qty === undefined ? 0 : Number(node.qty) || 0;
      const qtyNum = Math.round(rawQty * 100) / 100;

      out.item = {
        name: node.name ?? '',
        unit: node.unit ?? '',
        rate: Number(rateNum.toFixed(2)),
        quantity: Number(qtyNum)
      };
    }

    if (Array.isArray(node.children) && node.children.length > 0) {
      out.children = node.children.map((c) => buildPayloadNode(c));
    } else {
      out.children = [];
    }
    return out;
  }

  async function handleSave() {
    try {
      setToast('Saving...');

      const effective_date = new Date().toISOString().slice(0, 10);
      const payload = {
        effective_date,
        data: buildPayloadNode(tree),
        delete_items: Array.from(deletedItemsRef.current)
      };

      const res = await fetch(`${API_BASE}/budget/update/${projectId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const text = await res.text();
      let json = null;
      try { json = text ? JSON.parse(text) : null; } catch (e) { json = null; }

      if (!res.ok) {
        console.error('Update failed:', res.status, json);
        setToast(json && json.message ? json.message : 'Update failed');
        return;
      }

      setToast('Budget updated successfully');
      // clear deleted items after successful save
      deletedItemsRef.current = new Set();
    } catch (err) {
      console.error(err);
      setToast('Save failed');
    }
  }

  // Move a node by id to become a child of targetParentId. If targetParentId is null, attach to root.
  function moveNodeToParent(draggedId, targetParentId) {
    if (!draggedId) return;
    if (draggedId === 'root') return; // can't move root
    // remove dragged node
    const res = findAndRemove(tree, draggedId);
    const removed = res.removed;
    let newTree = res.node || tree;
    if (!removed) return; // nothing removed

    // if moving into its own subtree, cancel
    if (isDescendant(newTree, removed.id, targetParentId)) {
      // invalid move
      setToast('Cannot move into its own child');
      return;
    }

    if (!targetParentId) targetParentId = 'root';
    // insert into target parent
    newTree = findAndUpdate(newTree, targetParentId, (n) => ({ ...n, children: [...(n.children || []), removed] }));
    setTree(newTree);
    setExpanded((s) => new Set(s).add(targetParentId));
    setToast('Moved successfully');
  }

  // helper: drop handling
  function handleDrop(draggedId, targetId) {
    if (!draggedId || draggedId === targetId) return;
    if (draggedId === 'root') return;
    const parentOfTarget = findParentId(tree, targetId) || 'root';
    const targetNode = getNodeById(tree, targetId);
    if (!targetNode) return;

    if (targetNode.type === 'category') {
      moveNodeToParent(draggedId, targetId);
    } else {
      moveNodeToParent(draggedId, parentOfTarget);
    }
    setDropTarget(null);
  }

  // utility to get node by id
  function getNodeById(node, id) {
    if (!node) return null;
    if (node.id === id) return node;
    if (!node.children) return null;
    for (const c of node.children) {
      const found = getNodeById(c, id);
      if (found) return found;
    }
    return null;
  }

  // drag handlers
  function onDragStart(e, node) {
    if (node.id === 'root') {
      e.preventDefault();
      return;
    }
    draggingRef.current = node.id;
    try { e.dataTransfer.setData('text/plain', node.id); } catch (err) {}
    e.dataTransfer.effectAllowed = 'move';
  }

  function onDragOver(e, node) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggingRef.current && draggingRef.current !== node.id) {
      setDropTarget(node.id);
    }
  }

  function onDragLeave(e, node) {
    setDropTarget(null);
  }

  function onDropEvent(e, node) {
    e.preventDefault();
    const draggedId = draggingRef.current || e.dataTransfer.getData('text/plain');
    if (!draggedId) return;
    if (draggedId === node.id) return;
    const draggedNode = getNodeById(tree, draggedId);
    if (!draggedNode) return;
    if (isDescendant(tree, draggedId, node.id)) {
      setToast('Cannot drop into its own child');
      setDropTarget(null);
      return;
    }
    handleDrop(draggedId, node.id);
    draggingRef.current = null;
    setDropTarget(null);
  }

  // Render tree recursively
  function TreeNode({ node, depth = 0 }) {
    const isSelected = selectedId === node.id;
    const isExpanded = expanded.has(node.id);
    const total = (Number(node.qty) || 0) * (Number(node.rate) || 0);
    const indent = 18;
    const offset = depth * indent;

    return (
      <div className="w-full" style={{ paddingLeft: offset }}>
        {/* Row container: make it relative so action buttons can be absolutely positioned to the right edge */}
        <div
          draggable={node.id !== 'root'}
          onDragStart={(e) => onDragStart(e, node)}
          onDragOver={(e) => onDragOver(e, node)}
          onDragLeave={(e) => onDragLeave(e, node)}
          onDrop={(e) => onDropEvent(e, node)}
          className={`relative bg-gray-900 p-4 rounded-lg shadow-md flex items-center ${isSelected ? 'ring-2 ring-primary' : ''} ${dropTarget === node.id ? 'ring-1 ring-dashed ring-blue-500' : ''}`}
          style={{ width: '100%', boxSizing: 'border-box' }}
        >
          <div className="flex items-center gap-4 flex-1 min-w-0" style={{ paddingRight: 260 }}>
            {node.type === 'category' ? (
              <button onClick={() => toggleExpand(node.id)} className="material-icons text-gray-400 flex-shrink-0">{isExpanded ? 'expand_more' : 'chevron_right'}</button>
            ) : (
              <span className="w-6 flex-shrink-0" />
            )}

            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Name editable inline */}
              <input
                value={node.name}
                onChange={(e) => updateNodeField(node.id, 'name', e.target.value)}
                onFocus={() => { focusedRef.current = { id: node.id, field: 'name' }; setSelectedId(node.id); }}
                data-node-id={node.id}
                data-field="name"
                className={`bg-transparent p-0 m-0 truncate ${node.type === 'category' ? 'text-xl font-semibold text-white' : 'text-lg font-semibold text-gray-200'}`}
                style={{ outline: 'none', minWidth: 80 }}
              />

              {/* Show unit next to item name in parentheses */}
              {node.type === 'item' && (
                <span className="text-sm text-gray-400">({node.unit || ''})</span>
              )}

              {/* Item inline fields: unit, qty, rate and pricing preview (qty * rate) */}
              {node.type === 'item' && (
                <div className="flex items-center gap-4 ml-4 text-sm text-gray-400 shrink-0">
                  <input
                    value={node.unit ?? ''}
                    onChange={(e) => updateNodeField(node.id, 'unit', e.target.value)}
                    onFocus={() => { focusedRef.current = { id: node.id, field: 'unit' }; setSelectedId(node.id); }}
                    data-node-id={node.id}
                    data-field="unit"
                    className="bg-transparent p-0 m-0 text-sm text-gray-400 w-20"
                    placeholder="unit"
                    style={{ outline: 'none' }}
                  />

                  <input
                    type="text"
                    inputMode="decimal"
                    value={node.qty ?? ''}
                    onChange={(e) => updateNodeField(node.id, 'qty', e.target.value)}
                    onFocus={() => { focusedRef.current = { id: node.id, field: 'qty' }; setSelectedId(node.id); }}
                    data-node-id={node.id}
                    data-field="qty"
                    className="bg-transparent p-0 m-0 text-sm text-gray-400 w-20"
                    style={{ outline: 'none' }}
                  />

                  <input
                    type="text"
                    inputMode="decimal"
                    value={node.rate ?? ''}
                    onChange={(e) => updateNodeField(node.id, 'rate', e.target.value)}
                    onFocus={() => { focusedRef.current = { id: node.id, field: 'rate' }; setSelectedId(node.id); }}
                    data-node-id={node.id}
                    data-field="rate"
                    className="bg-transparent p-0 m-0 text-sm text-gray-400 w-24"
                    style={{ outline: 'none' }}
                  />

                  <div className="text-sm text-gray-200">Total: ₹{total}</div>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons: absolutely positioned to right so they always align to the extreme corner */}
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            {node.type === 'category' && (
              <>
                <button title="Add sub-category" onClick={() => addCategory(node.id)} className="px-2 py-1 rounded text-sm text-blue-400 border border-dashed border-blue-400/40">+Category</button>
                <button title="Add item" onClick={() => addItem(node.id)} className="px-2 py-1 rounded text-sm text-green-400 border border-dashed border-green-400/40">+Item</button>
              </>
            )}
            {node.id !== 'root' && <button onClick={() => removeNode(node.id)} className="text-sm px-2 py-1 rounded border border-red-600 text-red-400">Delete</button>}
          </div>
        </div>

        {node.children && node.children.length > 0 && isExpanded && (
          <div>
            {node.children.map((c) => (
              <div key={c.id} className="mt-3">
                <TreeNode node={c} depth={depth + 1} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="font-display bg-background-dark text-gray-200 min-h-screen p-8">
      <div className="w-full max-w-full mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-white">Edit Budget Hierarchy</h1>
            <p className="text-gray-400">Modify names, move nodes, add/delete categories & items. Save to update the project budget.</p>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={handleCancel} className="px-4 py-2 rounded-md text-sm font-medium bg-gray-700 hover:bg-gray-600 text-white transition-colors">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-md text-sm font-medium bg-primary hover:bg-blue-500 text-white transition-colors">Save Changes</button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-900 p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between space-x-2">
              <div className="flex items-center space-x-2">
                <span className="material-icons text-gray-400 text-lg">folder</span>
                {tree.name ? (
                  <input className="bg-transparent border-0 text-xl font-bold text-white p-0 focus:ring-0 w-64" type="text" value={tree.name} onChange={(e) => setTree((prev) => ({ ...prev, name: e.target.value }))} />
                ) : (
                  <div className="text-lg font-semibold text-gray-300">Server Budget</div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <p className="text-center text-gray-400 italic">{(tree.children && tree.children.length) ? `${tree.children.length} categories` : 'No categories yet. Start building your budget hierarchy.'}</p>
              </div>
            </div>
          </div>

          <div className="ml-8 mt-4 pl-4 border-l-2 border-dashed border-gray-700">
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-left text-gray-500 bg-gray-900/30 w-full overflow-hidden">
              <p className="mb-3">New categories will appear here</p>

              <div className="flex justify-start gap-3 mb-4">
                <button onClick={() => addItem(null)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-400 border border-dashed border-blue-400/50 rounded-md hover:bg-blue-900/40 hover:border-blue-400 transition-colors">
                  <span className="material-icons text-base">add</span>
                  Add Item
                </button>
                <button onClick={() => addCategory(null)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-400 border border-dashed border-gray-600 rounded-md hover:bg-gray-700/50 hover:border-gray-500 transition-colors">
                  <span className="material-icons text-base">add</span>
                  Add Category
                </button>
              </div>

              <div className="mt-2 text-left w-full">
                <TreeNode node={tree} />
              </div>
            </div>
          </div>
        </div>

        {toast && (
          <div className="fixed right-6 bottom-6 bg-black/70 px-4 py-2 rounded shadow z-50">
            <div className="text-sm text-white">{toast}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BudgetUpdate;