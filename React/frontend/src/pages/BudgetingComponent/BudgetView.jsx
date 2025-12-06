import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from "react-router-dom";
const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';


// Helper: format number in Indian numbering system (e.g., 12345678 -> 1,23,45,678)
function formatINR(num) {
  if (num == null || isNaN(num)) return '0.00';
  const n = Number(num.toFixed(2));
  const parts = n.toFixed(2).split('.');
  let intPart = parts[0];
  const decPart = parts[1];

  // handle negative
  const neg = intPart[0] === '-' ? '-' : '';
  if (neg) intPart = intPart.slice(1);

  // Indian formatting
  if (intPart.length > 3) {
    const last3 = intPart.slice(-3);
    let rest = intPart.slice(0, -3);
    rest = rest.replace(/\B(?=(?:\d{2})+(?!\d))/g, ',');
    intPart = rest + ',' + last3;
  }

  return `${neg}${intPart}.${decPart}`;
}

// Helper: convert number to words (Indian system, handles up to crores)
function numberToWordsIndia(amount) {
  if (amount == null || isNaN(amount)) return 'zero rupees';
  let num = Math.floor(Math.abs(Number(amount)));
  if (num === 0) return 'zero rupees';

  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  function twoDigits(n) {
    if (n < 20) return ones[n];
    const ten = Math.floor(n / 10);
    const one = n % 10;
    return tens[ten] + (one ? ' ' + ones[one] : '');
  }

  function threeDigits(n) {
    const hund = Math.floor(n / 100);
    const rem = n % 100;
    let s = '';
    if (hund) s += ones[hund] + ' hundred';
    if (rem) s += (s ? ' ' : '') + twoDigits(rem);
    return s;
  }

  const parts = [];
  const crore = Math.floor(num / 10000000);
  if (crore) {
    parts.push((crore < 100 ? twoDigits(crore) : threeDigits(crore)) + ' crore');
  }
  num = num % 10000000;

  const lakh = Math.floor(num / 100000);
  if (lakh) parts.push((lakh < 100 ? twoDigits(lakh) : threeDigits(lakh)) + ' lakh');
  num = num % 100000;

  const thousand = Math.floor(num / 1000);
  if (thousand) parts.push((thousand < 100 ? twoDigits(thousand) : threeDigits(thousand)) + ' thousand');
  num = num % 1000;

  if (num) parts.push(threeDigits(num));

  const words = parts.join(' ').replace(/\s+/g, ' ').trim();
  return words;
//   return words + ' rupees';
}

// BudgetView: fetches budget tree from backend and displays it in a styled hierarchy view
export default function BudgetView({ projectIdProp }) {
  const [tree, setTree] = useState([]); // array of root nodes
  const [expanded, setExpanded] = useState(new Set());
  const { projectId } = useParams();

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
      <div className="ml-0 text-base"> {/* set base text larger for nodes */}
        <div className={`bg-gray-900 p-6 rounded-lg shadow-md mb-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isLeaf ? <span className="w-6" /> : (
                <button onClick={() => toggle(node.id)} className="material-icons text-gray-400">{isExpanded ? 'expand_more' : 'chevron_right'}</button>
              )}
              <div className="flex flex-col">
                <span className={`${isLeaf ? 'text-xl font-medium text-gray-300' : 'font-bold text-lg text-gray-100'}`}>{node.name}</span>
                {isLeaf && (
                  <span className="text-base text-gray-500">({node.item_unit ?? (node.component && node.component.unit) ?? ''})</span>
                )}
              </div>
            </div>

            <div className="text-right">
              <p className="text-lg font-semibold text-white">₹{formatINR(total)}</p>
              <div className="text-sm text-gray-400 mt-1">{numberToWordsIndia(total)}</div>
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
                        <span className="font-medium text-gray-300 text-base">{child.item_name ?? child.name}</span>
                        <span className="text-base text-gray-500">({child.item_unit ?? ''})</span>

                        {/* quantity × rate breakdown */}
                        <div className="text-sm text-gray-400 mt-1">
                          ({child.quantity ?? 0}) × ({child.item_rate ?? 0}) = ₹{formatINR(Number(child.quantity ?? 0) * Number(child.item_rate ?? 0))}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-base font-semibold text-white">₹{formatINR(Number(child.quantity ?? 0) * Number(child.item_rate ?? 0))}</p>
                        <div className="text-sm text-gray-400 mt-1">{numberToWordsIndia(Number(child.quantity ?? 0) * Number(child.item_rate ?? 0))}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // child is a category with its own children
                  <div>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => toggle(child.id)} className="material-icons text-gray-400">{child.id && expanded.has(child.id) ? 'expand_more' : 'chevron_right'}</button>
                      <span className="font-semibold text-gray-200 text-base">{child.name}</span>
                    </div>

                    {child.children && child.children.length > 0 && child.id && expanded.has(child.id) && (
                      <ul className="space-y-4 pl-8 border-l border-gray-700 ml-3 mt-4">
                        {child.children.map((g) => (
                          <li key={g.id ?? g.name} className="relative py-2">
                            <span className="absolute -left-[13px] top-1/2 -translate-y-1/2 w-5 h-px bg-gray-700"></span>
                            <div className="bg-gray-800 p-4 rounded-md">
                              <div className="flex justify-between items-center">
                                <div>
                                  <span className="font-medium text-gray-300 text-base">{g.item_name ?? g.name}</span>
                                  <span className="text-base text-gray-500">({g.item_unit ?? ''})</span>

                                  <div className="text-sm text-gray-400 mt-1">
                                    ({g.quantity ?? 0}) × ({g.item_rate ?? 0}) = ₹{formatINR(Number(g.quantity ?? 0) * Number(g.item_rate ?? 0))}
                                  </div>
                                </div>

                                <div className="text-right">
                                  <p className="text-base font-semibold text-white">₹{formatINR(Number(g.quantity ?? 0) * Number(g.item_rate ?? 0))}</p>
                                  <div className="text-sm text-gray-400 mt-1">{numberToWordsIndia(Number(g.quantity ?? 0) * Number(g.item_rate ?? 0))}</div>
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
    <div className="font-display bg-background-dark text-gray-200 min-h-screen p-8 text-base">
      <div className="w-full max-w-full mx-auto">
        <div className="flex-shrink-0 mb-8">
          <h1 className="text-3xl font-bold text-white">Budget Hierarchy</h1>
          <p className="text-base text-gray-400">Overview of the project's budget breakdown.</p>
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
                    <p className="text-2xl font-bold text-green-400">₹{formatINR(computeTotal(root))}</p>
                    <div className="text-sm text-gray-400 mt-1">{numberToWordsIndia(computeTotal(root))}</div>
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