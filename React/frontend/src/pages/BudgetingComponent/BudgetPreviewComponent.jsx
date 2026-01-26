import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

// Simple compact preview: fully expanded view-only tree (shows only name + unit)
export default function BudgetPreviewComponent({ projectId: projectIdProp }) {
  const { projectId: pidFromParams } = useParams();
  const projectId = projectIdProp ?? pidFromParams;

  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function fetchTree() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/budget/fetch/${projectId}`, { credentials: 'include' });
        const text = await res.text();
        let json = null;
        try { json = text ? JSON.parse(text) : null; } catch (e) { json = null; }

        if (!res.ok) {
          console.error('Fetch failed', res.status, json);
          setError('Failed to load preview');
          setTree([]);
          setLoading(false);
          return;
        }

        const data = (json && json.data) || [];
        if (!Array.isArray(data)) {
          // backend might return a single root object — coerce to array
          if (mounted) setTree(data ? [data] : []);
        } else {
          if (mounted) setTree(data);
        }

        // log final received tree structure for debugging
        console.debug('Fetched budget tree:', JSON.stringify(data, null, 2));
      } catch (err) {
        console.error('Error fetching budget hierarchy', err);
        if (mounted) setError('Error fetching preview');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (projectId) fetchTree();
    return () => { mounted = false; };
  }, [projectId]);

  // Render node recursively (fully expanded). Show only name and unit/item_unit
  const RenderNode = ({ node, level = 0 }) => {
    const indent = Math.min(level * 10, 48);
    const name = node.name ?? node.item_name ?? node.category_name ?? 'Untitled';
    const unit = node.item_unit ?? node.unit ?? (node.component && node.component.unit) ?? '';

    return (
      <div style={{ minWidth: 140, flex: '1 0 140px', marginLeft: indent }}>
        <div className="bg-gray-900 p-3 rounded-md mb-2">
          <div className="flex items-center justify-between">
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{name}</div>
              {unit ? <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>({unit})</div> : null}
            </div>
          </div>
        </div>

        {node.children && node.children.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {node.children.map((c, i) => (
              <RenderNode key={c.id ?? `${name}-${i}`} node={c} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 shadow-sm" style={{ minHeight: 220 }}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-sm font-semibold text-[var(--text-primary)]">Budget preview</div>
          <div className="text-xs text-[var(--text-secondary)]">Quick glance — fully expanded</div>
        </div>
        <div className="text-right text-xs">
          <div className="font-semibold text-[var(--text-primary)]">{tree?.length ? `${tree.length} root(s)` : ''}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {loading && <div className="text-xs text-[var(--text-secondary)]">Loading preview…</div>}

        {!loading && tree && tree.length > 0 && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', width: '100%' }}>
            {tree.map((root, idx) => (
              <RenderNode key={root.id ?? `root-${idx}`} node={root} level={0} />
            ))}
          </div>
        )}

        {!loading && (!tree || tree.length === 0) && (
          <div className="text-xs text-[var(--text-secondary)]">No budget data found.</div>
        )}

        {error && <div className="text-xs text-yellow-400 mt-3">{error}</div>}
      </div>
    </div>
  );
}