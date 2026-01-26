import React, { useState, useEffect } from "react";
// EditableList component: Simple editable list of strings with add, remove, and change handlers.
// EditableList now expects items as array of {id, text}
function EditableList({ items, onAdd, onRemove, onChange, placeholder, addButtonLabel }) {
  return (
    <div>
      <ul className="flex flex-col gap-2">
        {items.map((item, idx) => (
          <li key={item.id ?? idx} className="flex items-center gap-2">
            <input
              type="text"
              className="flex-1 bg-gray-700 text-gray-100 rounded px-2 py-1 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={item.text}
              onChange={e => onChange(idx, e.target.value)}
              placeholder={placeholder}
            />
            <button
              type="button"
              className="text-red-400 hover:text-red-600 transition-colors"
              title="Delete"
              onClick={() => onRemove(idx)}
            >
              <span className="material-icons align-middle">close</span>
            </button>
          </li>
        ))}
      </ul>
      <button
        className="bg-gray-600 text-white hover:bg-gray-700 rounded-lg font-medium cursor-pointer transition-colors duration-300 px-4 py-1 w-full mt-2"
        type="button"
        onClick={onAdd}
      >
        {addButtonLabel || "Add"}
      </button>
    </div>
  );
}

// BudgetTreeForDPR: Simplified budget tree for item selection in DPR
function BudgetTreeForDPR({ tree, expanded, onToggle, onItemDoubleClick }) {
  function formatINR(num) {
    if (num == null || isNaN(num)) return '0.00';
    const n = Number(num.toFixed(2));
    const parts = n.toFixed(2).split('.');
    let intPart = parts[0];
    const decPart = parts[1];
    const neg = intPart[0] === '-' ? '-' : '';
    if (neg) intPart = intPart.slice(1);
    if (intPart.length > 3) {
      const last3 = intPart.slice(-3);
      let rest = intPart.slice(0, -3);
      rest = rest.replace(/\B(?=(?:\d{2})+(?!\d))/g, ',');
      intPart = rest + ',' + last3;
    }
    return `${neg}${intPart}.${decPart}`;
  }

  function computeTotal(node) {
    if (!node) return 0;
    if (Number(node.is_leaf) === 1) {
      const itemRate = Number(node.item_rate ?? 0) || 0;
      const labourRate = Number(node.item_labour_rate ?? 0);
      const qty = Number(node.quantity ?? 0) || 0;
      return qty * (itemRate + labourRate);
    }
    if (!node.children || node.children.length === 0) return 0;
    return node.children.reduce((sum, c) => sum + computeTotal(c), 0);
  }

  function BudgetNode({ node }) {
    const isLeaf = Number(node.is_leaf) === 1;
    const isExpanded = node.id && expanded.has(node.id);
    const total = computeTotal(node);

    if (isLeaf) {
      return (
        <div
          className="ml-0 mb-2 cursor-pointer hover:bg-gray-700 transition-colors rounded-md"
          onDoubleClick={() => onItemDoubleClick(node)}
          title="Double-click to add this item"
        >
          <div className="bg-gray-800 p-3 rounded-md shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-medium text-gray-300 text-sm">{node.item_name ?? node.name}</span>
                <span className="text-sm text-gray-500 ml-2">({node.item_unit ?? ''})</span>
                <div className="text-xs text-gray-400 mt-1">
                  Qty: {node.quantity ?? 0} | Rate: ₹{formatINR(Number(node.item_rate ?? 0) + Number(node.item_labour_rate ?? 0))}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-white">₹{formatINR(total)}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="ml-0 mb-2">
        <div className="bg-gray-900 p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => onToggle(node.id)} className="material-icons text-gray-400 text-base">
                {isExpanded ? 'expand_more' : 'chevron_right'}
              </button>
              <span className="font-bold text-base text-gray-100">{node.name}</span>
            </div>
            <div className="text-right">
              <p className="text-base font-semibold text-white">₹{formatINR(total)}</p>
            </div>
          </div>
        </div>

        {node.children && node.children.length > 0 && isExpanded && (
          <div className="ml-6 mt-2 space-y-2 border-l border-gray-700 pl-4">
            {node.children.map((child) => (
              <BudgetNode key={child.id ?? child.name} node={child} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tree.length === 0 && (
        <div className="bg-gray-900 p-4 rounded-lg text-gray-400 text-center">No budget data found.</div>
      )}
      {tree.map((root) => (
        <BudgetNode key={root.id ?? root.name} node={root} />
      ))}
    </div>
  );
}

import { useParams, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Sidebar from "../SidebarComponent/sidebar";

function DailyProgressReport() {
  const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [condition, setCondition] = React.useState("normal"); // "normal" or "rainy"
  const [timeSlots, setTimeSlots] = React.useState([
    { from: "", to: "" },
    { from: "", to: "" },
    { from: "", to: "" },
  ]);
  const [labourReport, setLabourReport] = React.useState([]); // dynamic labour report rows
  const [eventsEnabled, setEventsEnabled] = useState(true);
  const [eventsList, setEventsList] = useState([]);
  const [eventInput, setEventInput] = useState("");
  const [remarksEnabled, setRemarksEnabled] = useState(true);

  // --- New state variables for redesigned Events & Remarks section ---
  // Helper for unique IDs for list items
  function generateListId() {
    return Math.random().toString(36).substr(2, 9) + Date.now();
  }
  const [eventsRemarks, setEventsRemarks] = useState([]);
  const [generalRemark, setGeneralRemark] = useState([]);
  const [preparedBy, setPreparedBy] = useState("");
  const [distribute, setDistribute] = useState([]);

  // --- New states for today's progress and tomorrow's plan ---
  const [todaysProgress, setTodaysProgress] = useState([]);
  const [tomorrowsPlan, setTomorrowsPlan] = useState([]);
  const [editToday, setEditToday] = useState(false);
  const [editTomorrow, setEditTomorrow] = useState(false);
  // New state for remarks textarea
  const [remarks, setRemarks] = useState("");
  const today = new Date();

  // --- Budget Integration States ---
  const [budgetTree, setBudgetTree] = useState([]);
  const [showTodayModal, setShowTodayModal] = useState(false);
  const [showTomorrowModal, setShowTomorrowModal] = useState(false);
  const [expandedBudgetNodes, setExpandedBudgetNodes] = useState(new Set());
  const [budgetItemUsage, setBudgetItemUsage] = useState({}); // Track used quantities per budget item ID
  const [consumedQuantities, setConsumedQuantities] = useState({}); // Track consumed quantities from all DPRs
  const [cumulativeManpowerTillDate, setCumulativeManpowerTillDate] = useState(0);

  const UNIT_OPTIONS = ["No", "Rmt", "Sqm", "Cum", "Rft", "Sft", "Cft", "MT", "Kg", "Lit", "Day", "Each", "LS", "Shift", "Month", "Hrs"];
  useEffect(() => {
    if (!projectId) return;
    const fetchProjectDetails = async () => {
      try {
        const response = await fetch(`${API_BASE}/project/getProject/${projectId}`,
          {
            credentials: "include",
          }
        );
        const projectData = await response.json();
        if (projectData.success) {
          const data = projectData.data;
          // Calculate days
          let totalDays = "--";
          let remainingDays = "--";
          if (data.start_date && data.end_date) {
            const startDate = new Date(data.start_date);
            const endDate = new Date(data.end_date);

            totalDays = Math.floor(
              (endDate - startDate) / (1000 * 60 * 60 * 24)
            );
            const elapsedDays = Math.floor(
              (today - startDate) / (1000 * 60 * 60 * 24)
            );
            remainingDays =
              totalDays - elapsedDays > 0 ? totalDays - elapsedDays : 0;
          }
          setProject({ ...data, totalDays, remainingDays });

          // If API returns timeSlots, set them
          if (data.timeSlots && Array.isArray(data.timeSlots)) {
            setTimeSlots(data.timeSlots);
          }
          // If API returns condition, set it
          if (data.condition) {
            setCondition(data.condition);
          }
          // If project metadata exists and has agency and labour_type arrays, build labourReport accordingly
          if (
            data.metadata &&
            Array.isArray(data.metadata.agency) &&
            Array.isArray(data.metadata.labour_type)
          ) {
            // If API returns a labourReport, try to use values from it, else default to empty/zero
            let apiLabourReport = Array.isArray(data.labourReport)
              ? data.labourReport
              : [];
            // Map by agency for fast lookup
            const apiLabourByAgency = {};
            for (const row of apiLabourReport) {
              if (row.agency) apiLabourByAgency[row.agency] = row;
            }
            // Build rows for each agency, with keys for each labour_type
            const reportRows = data.metadata.agency.map((agencyName) => {
              const apiRow = apiLabourByAgency[agencyName] || {};
              const row = { agency: agencyName };
              data.metadata.labour_type.forEach((type) => {
                row[type] = apiRow[type] ?? "";
              });
              // Optionally add remarks if present
              if (apiRow.remarks) row.remarks = apiRow.remarks;
              return row;
            });
            setLabourReport(reportRows);
          } else if (data.labourReport && Array.isArray(data.labourReport)) {
            // fallback: use API's labourReport directly if no metadata
            setLabourReport(data.labourReport);
          } else {
            setLabourReport([]);
          }
        }
        // --- Fetch last DPR for today's progress and tomorrow's plan prefill ---
        try {
          const dprResp = await fetch(`${API_BASE}/report/initDPR/${projectId}`, {
            credentials: "include",
          });
          const dprJson = await dprResp.json();
          // Store cumulative manpower from previous DPRs
          if (dprJson && dprJson.cumulative_manpower_till_date !== undefined) {
            setCumulativeManpowerTillDate(Number(dprJson.cumulative_manpower_till_date) || 0);
          }

          // Prefill today's progress from yesterday's tomorrow_plan
          if (dprJson?.todays_plan && Array.isArray(dprJson.todays_plan)) {
            const arr = dprJson.todays_plan.map(item => ({
              item: item.item_name || "",
              qty: item.quantity || "",
              unit: item.unit || "",
              remarks: item.remarks || "",
              budgetItemId: item.item_id || null,
              totalAvailable: 0, // Will be updated from budget tree below
            }));
            setTodaysProgress(arr);
          } else {
            setTodaysProgress([]);
          }

          // Tomorrow's plan is not prefilled from previous DPR
          setTomorrowsPlan([]);
        } catch (err) {
          setTodaysProgress([]);
          setTomorrowsPlan([]);
        }

        // --- Fetch Budget Tree ---
        try {
          const budgetResp = await fetch(`${API_BASE}/budget/fetch/${projectId}`, {
            credentials: "include",
          });
          const budgetJson = await budgetResp.json();
          if (budgetJson?.data) {
            const data = Array.isArray(budgetJson.data) ? budgetJson.data : [budgetJson.data];
            setBudgetTree(data);

            // Expand all top-level nodes by default
            const topExpanded = new Set();
            data.forEach((n) => { if (n && n.id) topExpanded.add(n.id); });
            setExpandedBudgetNodes(topExpanded);

            // Fetch consumed quantities for all items in the project
            try {
              const consumedResp = await fetch(`${API_BASE}/report/consumedQuantities/${projectId}`, {
                credentials: "include",
              });
              const consumedJson = await consumedResp.json();
              if (consumedJson?.success && consumedJson.data) {
                setConsumedQuantities(consumedJson.data);
                console.log("Consumed quantities:", consumedJson.data);
              }
            } catch (err) {
              console.error("Error fetching consumed quantities:", err);
            }

            // Helper to find budget item by item_id (not budget_category.id)
            const findItemByItemId = (tree, itemId) => {
              for (const node of tree) {
                if (Number(node.is_leaf) === 1 && node.item_id === itemId) {
                  return node;
                }
                if (node.children && node.children.length > 0) {
                  const found = findItemByItemId(node.children, itemId);
                  if (found) return found;
                }
              }
              return null;
            };

            // Update today's progress with budget quantities if items were loaded
            setTodaysProgress(prev => prev.map(item => {
              if (item.budgetItemId) {
                const budgetItem = findItemByItemId(data, item.budgetItemId);
                if (budgetItem) {
                  return {
                    ...item,
                    totalAvailable: budgetItem.quantity || 0,
                  };
                }
              }
              return item;
            }));
          }
        } catch (err) {
          console.error("Error fetching budget tree:", err);
        }
      } catch (error) {
        console.error("Error fetching project details:", error);
      }
    };
    fetchProjectDetails();
  }, [projectId]);

  // Helper to get MySQL DATETIME string (YYYY-MM-DD HH:MM:SS)
  function getMySQLDateTime() {
    // toISOString() gives 'YYYY-MM-DDTHH:MM:SS.sssZ'
    // We want 'YYYY-MM-DD HH:MM:SS'
    return new Date().toISOString().slice(0, 19).replace("T", " ");
  }

  // Construct the complete DPR object
  function generateCompleteDPRObject() {
    // --- site_condition object ---
    const isRainy = condition === "rainy";
    const rainTiming = timeSlots
      .filter((slot) => slot.from && slot.to)
      .map((slot) => `${slot.from}-${slot.to}`);
    const groundState = isRainy ? "lava" : "dry";
    const site_condition = {
      is_rainy: isRainy,
      rain_timing: rainTiming,
      ground_state: groundState,
    };

    // --- labour_report as single object ---
    let labour_report = {};
    if (
      Array.isArray(labourReport) &&
      project?.metadata?.labour_type &&
      Array.isArray(project.metadata.labour_type)
    ) {
      // For each labour type, collect array of numbers per agency row
      project.metadata.labour_type.forEach((type) => {
        labour_report[type] = labourReport.map((row) => Number(row[type]) || 0);
      });
      labour_report.agency = labourReport.map((row) => row.agency || "");
      // remarks: array of remarks per agency (matching number of agencies)
      labour_report.remarks = labourReport.map((row) => row.remarks ?? "");
    } else {
      // fallback: just output as-is
      labour_report = labourReport;
    }

    // --- cumulative_manpower ---

    const todays_manpower = Array.isArray(labourReport)
      ? labourReport.reduce(
        (sum, row) =>
          sum +
          (project?.metadata?.labour_type
            ? project.metadata.labour_type.reduce(
              (rowSum, type) => rowSum + (Number(row[type]) || 0),
              0
            )
            : 0),
        0
      )
      : 0;

    // Total cumulative = previous total + today's total
    const cumulative_manpower = cumulativeManpowerTillDate + todays_manpower;

    // --- remarks field (top-level string) ---
    const remarksVal = remarksEnabled ? remarks : "NO General remarks";

    // --- events_remarks logic ---
    let events_remarks;
    if (!eventsEnabled) {
      events_remarks = ["No Event Remark"];
    } else {
      events_remarks = eventsList;
    }

    // --- today_prog and tomorrow_plan ---
    // New format: array of objects with item_id, quantity, remarks
    const today_prog = todaysProgress
      .filter(row => row.budgetItemId && row.qty) // Only include budget-linked items with quantity
      .map((row) => ({
        item_id: row.budgetItemId,
        quantity: parseFloat(row.qty) || 0,
        remarks: row.remarks || null,
      }));

    const tomorrow_plan = tomorrowsPlan
      .filter(row => row.budgetItemId && row.qty) // Only include budget-linked items with quantity
      .map((row) => ({
        item_id: row.budgetItemId,
        quantity: parseFloat(row.qty) || 0,
        remarks: row.remarks || null,
      }));

    // --- Compose object in required order ---
    return {
      project_id: projectId,
      report_date: new Date().toISOString().split("T")[0], // e.g., "2024-06-24"
      site_condition,
      labour_report,
      cumulative_manpower,
      today_prog,
      tomorrow_plan,
      remarks: remarksVal,
      events_remarks,
      created_at: getMySQLDateTime(),
      user_roles: [], // Placeholder, replace with actual user role logic if needed
    };
  }

  async function postDPRToBackend() {
    try {
      // Validate quantities before submission
      for (const row of todaysProgress) {
        if (row.budgetItemId && row.qty) {
          const consumed = consumedQuantities[row.budgetItemId] || 0;
          const available = row.totalAvailable - consumed;
          const currentQty = parseFloat(row.qty) || 0;

          if (currentQty > available) {
            toast.error(
              `Quantity exceeds available limit for "${row.item}". Available: ${available}, Entered: ${currentQty}`,
              { autoClose: 4000 }
            );
            return; // Stop submission
          }
        }
      }

      const dprObj = generateCompleteDPRObject();

      const report_footer = {
        distribute: distribute.map((d) => d.text),
        prepared_by: "Mano Projects Pvt. Ltd.",
        events_visit: eventsRemarks.map((e) => e.text),
        bottom_remarks: generalRemark ? [generalRemark] : [""],
      };

      const fullPayload = {
        pr_id: null,
        ...dprObj,
        report_footer,
        created_at: getMySQLDateTime(),
        created_by: "system",
        approved_by: null,
        final_approved_by: null,
        current_handler: null,
        dpr_status: "pending",
      };

      const response = await fetch(`${API_BASE}/report/insertDPR`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(fullPayload),
      });

      // safe parse (avoid throw if invalid JSON)
      const data = await response.json().catch(() => ({}));

      // Robust success detection:
      // - prefer explicit flags (data.success || data.ok)
      // - fallback to HTTP response.ok
      // - fallback to message containing 'insert' (covers "DPR inserted successfully")
      const isSuccess = Boolean(
        (data && (data.success || data.ok)) ||
        response.ok ||
        (typeof data.message === "string" && /insert(ed)?/i.test(data.message))
      );
      const autoCloseMs = 2000;
      if (isSuccess) {
        // success toast and navigate when toast closes
        toast.success(data.message || "DPR generated and submitted successfully!", {
          autoClose: autoCloseMs,
          onClose: () => {
            navigate(`/dashboard/project-description/${projectId}`);
          },
        });
      } else {
        toast.error(data?.message || response.statusText || "Failed to generate DPR", {
          autoClose: autoCloseMs,
          onClose: () => {
            navigate(`/dashboard/project-description/${projectId}`);
          }
        });
      }
    } catch (err) {
      toast.error(`Error submitting DPR: ${err?.message || err}`);
      console.error("Error submitting DPR:", err);
    }
  }

  // --- EditableList handler functions for Events, Bottom Remarks, Distribute ---
  // Events
  function addEvent() {
    setEventsRemarks(prev => [...prev, { id: generateListId(), text: "" }]);
  }
  function removeEvent(idx) {
    setEventsRemarks(prev => prev.filter((_, i) => i !== idx));
  }
  function setEvent(idx, value) {
    setEventsRemarks(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], text: value };
      return updated;
    });
  }
  // Bottom Remarks
  function addBottomRemark() {
    setBottomRemarks(prev => [...prev, { id: generateListId(), text: "" }]);
  }
  function removeBottomRemark(idx) {
    setBottomRemarks(prev => prev.filter((_, i) => i !== idx));
  }
  function setBottomRemark(idx, value) {
    setBottomRemarks(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], text: value };
      return updated;
    });
  }
  // Distribute
  function addDistributor() {
    setDistribute(prev => [...prev, { id: generateListId(), text: "" }]);
  }
  function removeDistributor(idx) {
    setDistribute(prev => prev.filter((_, i) => i !== idx));
  }
  function setDistributor(idx, value) {
    setDistribute(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], text: value };
      return updated;
    });
  }

  // --- Budget Helper Functions ---
  function toggleBudgetNode(id) {
    setExpandedBudgetNodes((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  }

  // Find budget item by ID recursively
  function findBudgetItemById(tree, itemId) {
    for (const node of tree) {
      if (Number(node.is_leaf) === 1 && node.id === itemId) {
        return node;
      }
      if (node.children && node.children.length > 0) {
        const found = findBudgetItemById(node.children, itemId);
        if (found) return found;
      }
    }
    return null;
  }

  // Calculate total quantity available for a budget item (total - already used)
  function getAvailableQuantity(budgetItemId, totalQty) {
    const used = budgetItemUsage[budgetItemId] || 0;
    return totalQty - used;
  }

  // Handle budget item selection (double-click)
  function handleBudgetItemSelect(budgetItem, modalType) {
    // Prevent duplicate items
    const targetList = modalType === "today" ? todaysProgress : tomorrowsPlan;
    const itemExists = targetList.some(row => row.budgetItemId === budgetItem.item_id);

    if (itemExists) {
      toast.warning(`"${budgetItem.item_name || budgetItem.name}" is already added!`, {
        autoClose: 2000,
      });
      return;
    }

    const newRow = {
      item: budgetItem.item_name || budgetItem.name,
      unit: budgetItem.item_unit || "",
      qty: "",
      remarks: "",
      budgetItemId: budgetItem.item_id,  // Use item_id from item table, not budget_category.id
      totalAvailable: budgetItem.quantity || 0,
    };

    if (modalType === "today") {
      setTodaysProgress((prev) => [...prev, newRow]);
      toast.success(`Added ${budgetItem.item_name || budgetItem.name} to Today's Progress`);
    } else {
      setTomorrowsPlan((prev) => [...prev, newRow]);
      toast.success(`Added ${budgetItem.item_name || budgetItem.name} to Tomorrow's Planning`);
    }
  }

  // Compute total for a budget node (recursive)
  function computeBudgetTotal(node) {
    if (!node) return 0;
    if (Number(node.is_leaf) === 1) {
      const itemRate = Number(node.item_rate ?? 0) || 0;
      const labourRate = Number(node.item_labour_rate ?? 0);
      const qty = Number(node.quantity ?? 0) || 0;
      return qty * (itemRate + labourRate);
    }
    if (!node.children || node.children.length === 0) return 0;
    return node.children.reduce((sum, c) => sum + computeBudgetTotal(c), 0);
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 min-h-screen bg-gray-900 text-gray-100 overflow-y-auto">
        <ToastContainer
          position="top-right"
          autoClose={2000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        {/* Header with Back Button and Date */}
        <div className="px-4 py-6 md:px-12 lg:px-24">
          <div className="mb-8 flex justify-between items-center px-2">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.location.href = `/dashboard/project-description/${projectId}`}
                className="flex items-center gap-2 bg-gray-700 text-gray-200 hover:bg-gray-600 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <span className="material-icons">arrow_back</span>
                Back
              </button>

              <h1 className="text-2xl align-middle font-extrabold text-white">
                Daily Progress Report
              </h1>
            </div>

            <p className="text-base text-[#BBDEFB]">
              {today.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          {/* Project Details Card */}
          <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-800">
            <h2 className="text-lg font-medium mb-4 text-[#E0E0E0]">
              Project Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <div className="flex justify-between border-b border-gray-700 py-2 ">
                <span className="font-medium text-gray-200">Project Name</span>
                <span className="text-gray-400">
                  {project?.project_name || "--"}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-700 py-2 ">
                <span className="font-medium text-gray-200">Employer</span>
                <span className="text-gray-400">
                  {project?.Employer || "--"}
                </span>
              </div>
              {/* Removed Date row */}
              <div className="flex justify-between border-b border-gray-700 py-2 ">
                <span className="font-medium text-gray-200">Contract No</span>
                <span className="text-gray-400">
                  {project?.project_code || "--"}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-700 py-2 ">
                <span className="font-medium text-gray-200">Location</span>
                <span className="text-gray-400">
                  {project?.location || "--"}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-700 py-2 ">
                <span className="font-medium text-gray-200">Start Date</span>
                <span className="text-gray-400">
                  {project?.start_date
                    ? new Date(project.start_date).toLocaleDateString()
                    : "--"}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-700 py-2 ">
                <span className="font-medium text-gray-200">End Date</span>
                <span className="text-gray-400">
                  {project?.end_date
                    ? new Date(project.end_date).toLocaleDateString()
                    : "--"}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-700 py-2 col-span-1 md:col-span-2 ">
                <span className="font-medium text-gray-200">
                  Project Description
                </span>
                <span className="text-gray-400 text-right">
                  {project?.project_description || "--"}
                </span>
              </div>
            </div>
            {/* Duration in Days Section moved here */}
            <div className="mt-6">
              <h2 className="text-lg font-medium mb-4 text-[#E0E0E0]">
                Duration in Days
              </h2>
              <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:justify-around mt-4">
                <div className="text-center flex-1 bg-gray-800 rounded-lg py-2">
                  <div className="text-xl font-bold text-white">
                    {project?.totalDays || "--"}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">Total</div>
                </div>
                <div className="text-center flex-1 bg-gray-800 rounded-lg py-2">
                  <div className="text-xl font-bold text-white">
                    {project?.totalDays && project?.remainingDays !== undefined
                      ? project.totalDays - project.remainingDays
                      : "--"}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">Days Passed</div>
                </div>
                <div className="text-center flex-1 bg-gray-800 rounded-lg py-2">
                  <div className="text-xl font-bold text-white">
                    {project?.remainingDays || "--"}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">Balance</div>
                </div>
              </div>
            </div>
          </div>

          {/* <!-- Condition & Time Slots --> */}
          <div className="grid grid-cols-2 md:grid-cols-[500px_minmax(0,1fr)] gap-6">
            {/* <!-- Condition --> */}
            <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-800">
              <h2 className="text-xl font-semibold mb-4">Condition</h2>
              <div className="flex justify-around text-xs gap-8 text-gray-300">
                <div
                  className={`mx-1 text-center cursor-pointer pb-0.5 ${condition === "normal" ? "border-b-2 border-blue-400" : ""
                    }`}
                  onClick={() => setCondition("normal")}
                >
                  <span className="material-icons text-yellow-400">
                    wb_sunny
                  </span>
                  <p>Normal Day</p>
                </div>
                <div
                  className={`mx-1 text-center cursor-pointer pb-0.5 ${condition === "normal" ? "border-b-2 border-blue-400" : ""
                    }`}
                  onClick={() => setCondition("normal")}
                >
                  <span className="material-icons text-orange-400">
                    terrain
                  </span>
                  <p>Dry</p>
                </div>
                <div
                  className={`mx-1 text-center cursor-pointer pb-0.5 ${condition === "rainy" ? "border-b-2 border-blue-400" : ""
                    }`}
                  onClick={() => setCondition("rainy")}
                >
                  <span className="material-icons text-blue-400">umbrella</span>
                  <p>Rainy Day</p>
                </div>
                <div
                  className={`mx-1 text-center cursor-pointer pb-0.5 ${condition === "rainy" ? "border-b-2 border-blue-400" : ""
                    }`}
                  onClick={() => setCondition("rainy")}
                >
                  <span className="material-icons text-indigo-300">
                    opacity
                  </span>
                  <p>Slushy</p>
                </div>
              </div>
            </div>

            {/* <!-- Time Slots --> */}
            {(condition === "rainy" || condition === "normal") && (
              <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-800">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Time Slots</h2>
                  <button
                    className="bg-blue-500 px-2 py-1 rounded text-sm hover:bg-blue-600"
                    onClick={() => {
                      if (timeSlots.length >= 3) {
                        alert("Maximum of 3 time slots allowed");
                        return;
                      }
                      setTimeSlots((prev) => [...prev, { from: "", to: "" }]);
                    }}
                  >
                    Add Time Slot
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {timeSlots.map((slot, idx) => (
                    <div
                      className="flex items-center gap-2 bg-gray-700 px-3 py-2 rounded-lg shadow border border-gray-700 hover:border-blue-500 transition"
                      key={idx}
                    >
                      <input
                        type="time"
                        className="p-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-200"
                        value={slot.from}
                        onChange={(e) => {
                          const newSlots = [...timeSlots];
                          newSlots[idx] = {
                            ...newSlots[idx],
                            from: e.target.value,
                          };
                          setTimeSlots(newSlots);
                        }}
                      />
                      <span>-</span>
                      <input
                        type="time"
                        className="p-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-200"
                        value={slot.to}
                        onChange={(e) => {
                          const toValue = e.target.value;
                          if (slot.from && toValue < slot.from) {
                            alert("End time cannot be earlier than start time");
                            return;
                          }
                          const newSlots = [...timeSlots];
                          newSlots[idx] = { ...newSlots[idx], to: toValue };
                          setTimeSlots(newSlots);
                        }}
                      />
                      <span
                        className="material-icons text-red-500 cursor-pointer"
                        onClick={() => {
                          setTimeSlots((prev) =>
                            prev.filter((_, i) => i !== idx)
                          );
                        }}
                      >
                        delete
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Labour Report Table */}
          <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-800">
            <h2 className="text-lg font-semibold text-gray-200 mb-4">
              Labour Report Details
            </h2>
            <div className="overflow-x-auto rounded-lg">
              {project?.metadata &&
                Array.isArray(project.metadata.agency) &&
                Array.isArray(project.metadata.labour_type) ? (
                (() => {
                  // Calculate column totals and grand total
                  const colTotals = project.metadata.labour_type.map((type) =>
                    labourReport.reduce(
                      (sum, row) => sum + (Number(row[type]) || 0),
                      0
                    )
                  );
                  const rowTotals = labourReport.map((row) =>
                    project.metadata.labour_type.reduce(
                      (sum, type) => sum + (Number(row[type]) || 0),
                      0
                    )
                  );
                  const grandTotal = colTotals.reduce(
                    (sum, val) => sum + val,
                    0
                  );
                  // Table rendering:
                  return (
                    <table className="w-full border-separate border-spacing-0">
                      <thead>
                        <tr>
                          <th className="border-b border-gray-700 border-r border-gray-700 px-4 py-2 text-left text-gray-300 font-bold bg-gray-800">
                            Agency
                          </th>
                          {project.metadata.labour_type.map((type, i) => (
                            <th
                              key={type}
                              className={`border-b border-gray-700 border-r border-gray-700 px-4 py-2 text-left text-gray-300 font-bold bg-gray-800`}
                            >
                              {type}
                            </th>
                          ))}
                          <th className="border-b border-gray-700 border-r border-gray-700 px-4 py-2 text-left text-blue-300 font-bold bg-gray-800">
                            Total
                          </th>
                          <th className="border-b border-gray-700 px-4 py-2 text-left text-blue-300 font-bold bg-gray-800">
                            Remarks
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {labourReport && labourReport.length > 0 ? (
                          <>
                            {labourReport.map((row, idx) => (
                              <tr
                                key={row.agency || idx}
                                className="bg-gray-800"
                              >
                                <td className="border-b border-gray-700 border-r border-gray-700 px-4 py-2 font-semibold">
                                  {row.agency || "--"}
                                </td>
                                {project.metadata.labour_type.map(
                                  (type, colIdx) => (
                                    <td
                                      key={type}
                                      className="border-b border-gray-700 border-r border-gray-700 px-4 py-2"
                                    >
                                      <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        pattern="[0-9]*"
                                        inputMode="numeric"
                                        className="w-20 bg-gray-700 text-gray-100 rounded px-2 py-1 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]"
                                        value={row[type] ?? ""}
                                        onChange={(e) => {
                                          const val = e.target.value.replace(
                                            /[^0-9]/g,
                                            ""
                                          );
                                          setLabourReport((prev) => {
                                            const updated = [...prev];
                                            updated[idx] = {
                                              ...updated[idx],
                                              [type]: val,
                                            };
                                            return updated;
                                          });
                                        }}
                                        onKeyDown={(e) => {
                                          // Arrow key navigation between inputs
                                          const numRows = labourReport.length;
                                          const numCols =
                                            project.metadata.labour_type.length;
                                          // Only handle arrow keys
                                          let targetRow = idx;
                                          let targetCol = colIdx;
                                          if (e.key === "ArrowUp") {
                                            if (idx > 0) {
                                              targetRow = idx - 1;
                                            } else {
                                              return;
                                            }
                                          } else if (e.key === "ArrowDown") {
                                            if (idx < numRows - 1) {
                                              targetRow = idx + 1;
                                            } else {
                                              return;
                                            }
                                          } else if (e.key === "ArrowLeft") {
                                            if (colIdx > 0) {
                                              targetCol = colIdx - 1;
                                            } else {
                                              return;
                                            }
                                          } else if (e.key === "ArrowRight") {
                                            if (colIdx < numCols - 1) {
                                              targetCol = colIdx + 1;
                                            } else {
                                              return;
                                            }
                                          } else {
                                            return;
                                          }
                                          e.preventDefault();
                                          // Find the target input and focus it
                                          // Inputs have a unique data-row and data-col attribute
                                          const selector = `input[data-labour-row="${targetRow}"][data-labour-col="${targetCol}"]`;
                                          const targetInput =
                                            document.querySelector(selector);
                                          if (targetInput) targetInput.focus();
                                        }}
                                        data-labour-row={idx}
                                        data-labour-col={colIdx}
                                      />
                                    </td>
                                  )
                                )}
                                <td className="border-b border-gray-700 border-r border-gray-700 px-4 py-2 font-bold text-blue-300">
                                  {project.metadata.labour_type.reduce(
                                    (sum, type) =>
                                      sum + (Number(row[type]) || 0),
                                    0
                                  )}
                                </td>
                                <td className="border-b border-gray-700 px-2 py-2">
                                  <input
                                    type="text"
                                    className="w-full bg-gray-700 text-gray-100 rounded px-2 py-1 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={row.remarks ?? ""}
                                    onChange={(e) => {
                                      setLabourReport((prev) => {
                                        const updated = [...prev];
                                        updated[idx] = {
                                          ...updated[idx],
                                          remarks: e.target.value,
                                        };
                                        return updated;
                                      });
                                    }}
                                  />
                                </td>
                              </tr>
                            ))}
                            {/* Total row */}
                            <tr className="bg-gray-800 font-bold">
                              <td className="border-t border-gray-700 border-r border-gray-700 px-4 py-2 text-blue-300">
                                Total
                              </td>
                              {colTotals.map((ct, i) => (
                                <td
                                  key={"total-" + i}
                                  className="border-t border-gray-700 border-r border-gray-700 px-4 py-2 text-blue-300"
                                >
                                  {ct}
                                </td>
                              ))}
                              <td className="border-t border-gray-700 border-r border-gray-700 px-4 py-2 text-blue-300">
                                {grandTotal}
                              </td>
                              <td className="border-t border-gray-700 px-4 py-2"></td>
                            </tr>
                          </>
                        ) : (
                          <tr>
                            <td
                              className="text-center text-gray-400 px-4 py-2"
                              colSpan={project.metadata.labour_type.length + 3}
                            >
                              No Labour Report Data
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  );
                })()
              ) : (
                <table className="w-full border-collapse">
                  <tbody>
                    <tr>
                      <td
                        className="text-center text-gray-400 px-4 py-2"
                        colSpan={11}
                      >
                        No Labour Report Data
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Today's Progress Table */}
            <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <h2 className="text-lg font-medium text-[#E0E0E0] mr-2">Today's Progress</h2>
                  <button
                    type="button"
                    className="ml-1 text-gray-400 hover:text-blue-400 transition-colors"
                    title={editToday ? "Done" : "Edit"}
                    onClick={() => setEditToday((e) => !e)}
                  >
                    {!editToday ? (
                      <span className="material-icons align-middle">edit</span>
                    ) : (
                      <span className="material-icons align-middle">check</span>
                    )}
                  </button>
                </div>
                <button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  onClick={() => setShowTodayModal(true)}
                >
                  <span className="material-icons text-sm">add</span>
                  Add Task
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-0">
                  <thead>
                    <tr>
                      <th className="border-b border-gray-700 px-4 py-2 text-left text-gray-300 font-bold bg-gray-800 w-[30%]">Item</th>
                      <th className="border-b border-gray-700 px-4 py-2 text-left text-gray-300 font-bold bg-gray-800 w-[30%]">Remarks</th>
                      <th className="border-b border-gray-700 px-4 py-2 text-left text-gray-300 font-bold bg-gray-800 w-[15%]">Unit</th>
                      <th className="border-b border-gray-700 px-4 py-2 text-left text-gray-300 font-bold bg-gray-800 w-[25%]">Qty</th>
                      {editToday && <th className="border-b border-gray-700 px-2 py-2 bg-gray-800"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {todaysProgress.length === 0 && (
                      <tr>
                        <td colSpan={editToday ? 5 : 4} className="text-center text-gray-400 px-4 py-2">No tasks added yet.</td>
                      </tr>
                    )}
                    {todaysProgress.map((row, idx) => (
                      <tr key={idx} className="bg-gray-800">
                        <td className="border-b border-gray-700 px-4 py-2 w-[30%]">
                          <input
                            className="w-full bg-gray-700 text-gray-100 rounded px-2 py-1 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Item"
                            value={row.item}
                            readOnly={!!row.budgetItemId}
                            onChange={(e) => {
                              if (!row.budgetItemId) {
                                const val = e.target.value;
                                setTodaysProgress((prev) => {
                                  const updated = [...prev];
                                  updated[idx] = { ...updated[idx], item: val };
                                  return updated;
                                });
                              }
                            }}
                          />
                        </td>

                        <td className="border-b border-gray-700 px-4 py-2 w-[30%]">
                          <input
                            className="w-full bg-gray-700 text-gray-100 rounded px-2 py-1 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Remarks"
                            value={row.remarks}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTodaysProgress((prev) => {
                                const updated = [...prev];
                                updated[idx] = { ...updated[idx], remarks: val };
                                return updated;
                              });
                            }}
                          />
                        </td>

                        <td className="border-b border-gray-700 px-4 py-2 w-[15%]">
                          {row.budgetItemId ? (
                            <input
                              className="w-full bg-gray-600 text-gray-300 rounded px-2 py-1 border border-gray-700"
                              value={row.unit}
                              readOnly
                            />
                          ) : (
                            <select
                              className="w-full bg-gray-700 text-gray-100 rounded px-2 py-1 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={row.unit}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTodaysProgress((prev) => {
                                  const updated = [...prev];
                                  updated[idx] = { ...updated[idx], unit: val };
                                  return updated;
                                });
                              }}
                            >
                              <option value="">Select Unit</option>
                              {UNIT_OPTIONS.map((u) => (
                                <option key={u} value={u}>{u}</option>
                              ))}
                            </select>
                          )}
                        </td>

                        <td className="border-b border-gray-700 px-4 py-2 w-[25%]">
                          <div className="flex flex-col gap-1">
                            <input
                              className={`w-full bg-gray-700 text-gray-100 rounded px-2 py-1 border ${(() => {
                                if (!row.budgetItemId) return 'border-gray-700';
                                const consumed = consumedQuantities[row.budgetItemId] || 0;
                                const available = row.totalAvailable - consumed;
                                return Number(row.qty) > available ? 'border-red-500' : 'border-gray-700';
                              })()} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                              placeholder="Quantity"
                              type="number"
                              value={row.qty}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTodaysProgress((prev) => {
                                  const updated = [...prev];
                                  updated[idx] = { ...updated[idx], qty: val };
                                  return updated;
                                });
                              }}
                            />
                            {row.budgetItemId && row.totalAvailable !== undefined && (() => {
                              const consumed = consumedQuantities[row.budgetItemId] || 0;
                              const available = row.totalAvailable - consumed;
                              const current = Number(row.qty) || 0;
                              const remaining = available - current;
                              const isValid = current <= available;
                              return (
                                <div className={`text-xs ${!isValid ? 'text-red-400' : 'text-blue-400'
                                  }`}>
                                  {current}/{available} remaining {remaining} (consumed: {consumed})
                                </div>
                              );
                            })()}
                          </div>
                        </td>

                        {editToday && (
                          <td className="border-b border-gray-700 px-2 py-2 text-center">
                            <button type="button" className="text-red-400 hover:text-red-600 transition-colors" title="Delete" onClick={() => setTodaysProgress((prev) => prev.filter((_, i) => i !== idx))}>
                              <span className="material-icons align-middle">close</span>
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>

            {/* Tomorrow's Planning Table */}
            <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <h2 className="text-lg font-medium text-[#E0E0E0] mr-2">Tomorrow's Planning</h2>
                  <button type="button" className="ml-1 text-gray-400 hover:text-blue-400 transition-colors" title={editTomorrow ? "Done" : "Edit"} onClick={() => setEditTomorrow((e) => !e)}>
                    {!editTomorrow ? (
                      <span className="material-icons align-middle">edit</span>
                    ) : (
                      <span className="material-icons align-middle">check</span>
                    )}
                  </button>
                </div>
                <button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  onClick={() => setShowTomorrowModal(true)}
                >
                  <span className="material-icons text-sm">add</span>
                  Add Plan
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-0">
                  <thead>
                    <tr>
                      <th className="border-b border-gray-700 px-4 py-2 text-left text-gray-300 font-bold bg-gray-800 w-[30%]">Item</th>
                      <th className="border-b border-gray-700 px-4 py-2 text-left text-gray-300 font-bold bg-gray-800 w-[30%]">Remarks</th>
                      <th className="border-b border-gray-700 px-4 py-2 text-left text-gray-300 font-bold bg-gray-800 w-[15%]">Unit</th>
                      <th className="border-b border-gray-700 px-4 py-2 text-left text-gray-300 font-bold bg-gray-800 w-[25%]">Qty</th>
                      {editTomorrow && <th className="border-b border-gray-700 px-2 py-2 bg-gray-800"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {tomorrowsPlan.length === 0 && (
                      <tr>
                        <td colSpan={editTomorrow ? 5 : 4} className="text-center text-gray-400 px-4 py-2">No plans added yet.</td>
                      </tr>
                    )}
                    {tomorrowsPlan.map((row, idx) => (
                      <tr key={idx} className="bg-gray-800">
                        <td className="border-b border-gray-700 px-4 py-2 w-[30%]">
                          <input
                            className="w-full bg-gray-700 text-gray-100 rounded px-2 py-1 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Item"
                            value={row.item}
                            readOnly={!!row.budgetItemId}
                            onChange={(e) => {
                              if (!row.budgetItemId) {
                                const val = e.target.value;
                                setTomorrowsPlan((prev) => {
                                  const updated = [...prev];
                                  updated[idx] = { ...updated[idx], item: val };
                                  return updated;
                                });
                              }
                            }}
                          />
                        </td>

                        <td className="border-b border-gray-700 px-4 py-2 w-[30%]">
                          <input
                            className="w-full bg-gray-700 text-gray-100 rounded px-2 py-1 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Remarks"
                            value={row.remarks}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTomorrowsPlan((prev) => {
                                const updated = [...prev];
                                updated[idx] = { ...updated[idx], remarks: val };
                                return updated;
                              });
                            }}
                          />
                        </td>

                        <td className="border-b border-gray-700 px-4 py-2 w-[15%]">
                          {row.budgetItemId ? (
                            <input
                              className="w-full bg-gray-600 text-gray-300 rounded px-2 py-1 border border-gray-700"
                              value={row.unit}
                              readOnly
                            />
                          ) : (
                            <select
                              className="w-full bg-gray-700 text-gray-100 rounded px-2 py-1 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={row.unit}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTomorrowsPlan((prev) => {
                                  const updated = [...prev];
                                  updated[idx] = { ...updated[idx], unit: val };
                                  return updated;
                                });
                              }}
                            >
                              <option value="">Select Unit</option>
                              {UNIT_OPTIONS.map((u) => (
                                <option key={u} value={u}>{u}</option>
                              ))}
                            </select>
                          )}
                        </td>

                        <td className="border-b border-gray-700 px-4 py-2 w-[25%]">
                          <div className="flex flex-col gap-1">
                            <input
                              className={`w-full bg-gray-700 text-gray-100 rounded px-2 py-1 border ${(() => {
                                if (!row.budgetItemId) return 'border-gray-700';
                                const consumed = consumedQuantities[row.budgetItemId] || 0;
                                const available = row.totalAvailable - consumed;
                                return Number(row.qty) > available ? 'border-red-500' : 'border-gray-700';
                              })()} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                              placeholder="Quantity"
                              type="number"
                              value={row.qty}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTomorrowsPlan((prev) => {
                                  const updated = [...prev];
                                  updated[idx] = { ...updated[idx], qty: val };
                                  return updated;
                                });
                              }}
                            />
                            {row.budgetItemId && row.totalAvailable !== undefined && (
                              <div className={`text-xs ${Number(row.qty) > row.totalAvailable ? 'text-red-400' : 'text-blue-400'
                                }`}>
                                {row.qty || 0}/{row.totalAvailable} remaining {row.totalAvailable - (Number(row.qty) || 0)}
                              </div>
                            )}
                          </div>
                        </td>

                        {editTomorrow && (
                          <td className="border-b border-gray-700 px-2 py-2 text-center">
                            <button type="button" className="text-red-400 hover:text-red-600 transition-colors" title="Delete" onClick={() => setTomorrowsPlan((prev) => prev.filter((_, i) => i !== idx))}>
                              <span className="material-icons align-middle">close</span>
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* --- Redesigned Events & Remarks Section using EditableList --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-24">
            {/* Events & Visits Section */}
            <div className="bg-gray-800 rounded-2xl p-6 shadow-md border border-gray-800">
              <h2 className="text-lg font-medium mb-4 text-[#E0E0E0]">
                Events &amp; Visits
              </h2>
              <EditableList
                items={eventsRemarks}
                onAdd={addEvent}
                onRemove={removeEvent}
                onChange={setEvent}
                placeholder="Add event or visit..."
                addButtonLabel="Add Event/Visit"
              />
            </div>
            {/* General Remarks, Prepared By, Distribute Section */}
            <div className="bg-gray-800 rounded-2xl p-6 shadow-md border border-gray-800 flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-medium mb-4 text-[#E0E0E0]">General Remarks</h2>
                <textarea
                  rows={4}
                  className="w-full bg-gray-700 text-gray-100 rounded px-3 py-2 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  placeholder="Enter general remarks..."
                  value={generalRemark}
                  onChange={(e) => setGeneralRemark(e.target.value)}
                />
              </div>
              <div className="flex flex-col md:flex-row gap-4 mt-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Prepared By
                  </label>
                  <input
                    type="text"
                    className="w-full bg-gray-700 text-gray-400 rounded px-3 py-2 border border-gray-700"
                    value="Mano Projects Pvt. Ltd."
                    disabled
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Distribute
                  </label>
                  <EditableList
                    items={distribute}
                    onAdd={addDistributor}
                    onRemove={removeDistributor}
                    onChange={setDistributor}
                    placeholder="Add recipient..."
                    addButtonLabel="Add Recipient"
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Generate & Close Button */}
          <div className="relative bottom-7 flex justify-end bg-gray-900 p-1 z-50">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-colors duration-150"
              onClick={postDPRToBackend}
            >
              Generate &amp; Close
            </button>
          </div>

          {/* Budget Selection Modal for Today's Progress */}
          {showTodayModal && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                  <h2 className="text-2xl font-bold text-white">Add Task - Today's Progress</h2>
                  <button
                    onClick={() => setShowTodayModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <span className="material-icons text-3xl">close</span>
                  </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-hidden flex">
                  {/* Budget Tree Section - Right Side */}
                  <div className="w-1/2 border-r border-gray-700 p-6 overflow-y-auto">
                    <h3 className="text-lg font-semibold text-white mb-4">Budget Items</h3>
                    <p className="text-sm text-gray-400 mb-4">Double-click on any item to add it</p>
                    <BudgetTreeForDPR
                      tree={budgetTree}
                      expanded={expandedBudgetNodes}
                      onToggle={toggleBudgetNode}
                      onItemDoubleClick={(item) => {
                        handleBudgetItemSelect(item, "today");
                      }}
                    />
                  </div>

                  {/* Task List Section - Left Side */}
                  <div className="w-1/2 p-6 overflow-y-auto">
                    <h3 className="text-lg font-semibold text-white mb-4">Selected Tasks</h3>
                    {todaysProgress.length === 0 ? (
                      <div className="text-center text-gray-400 py-8">
                        No tasks added yet. Double-click items from the budget tree to add them.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {todaysProgress.map((row, idx) => (
                          <div key={idx} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <div className="font-semibold text-white">{row.item || "Untitled"}</div>
                                <div className="text-sm text-gray-400">Unit: {row.unit || "Not set"}</div>
                              </div>
                              <button
                                onClick={() => setTodaysProgress((prev) => prev.filter((_, i) => i !== idx))}
                                className="text-red-400 hover:text-red-600 transition-colors"
                              >
                                <span className="material-icons">delete</span>
                              </button>
                            </div>
                            <div className="space-y-2">
                              <input
                                className="w-full bg-gray-700 text-gray-100 rounded px-3 py-2 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Add remarks..."
                                value={row.remarks}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setTodaysProgress((prev) => {
                                    const updated = [...prev];
                                    updated[idx] = { ...updated[idx], remarks: val };
                                    return updated;
                                  });
                                }}
                              />
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  className={`flex-1 bg-gray-700 text-gray-100 rounded px-3 py-2 border ${(() => {
                                    if (!row.budgetItemId) return 'border-gray-700';
                                    const consumed = consumedQuantities[row.budgetItemId] || 0;
                                    const available = row.totalAvailable - consumed;
                                    return Number(row.qty) > available ? 'border-red-500' : 'border-gray-700';
                                  })()} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                  placeholder="Quantity"
                                  value={row.qty}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setTodaysProgress((prev) => {
                                      const updated = [...prev];
                                      updated[idx] = { ...updated[idx], qty: val };
                                      return updated;
                                    });
                                  }}
                                />
                                {row.budgetItemId && row.totalAvailable !== undefined && (() => {
                                  const consumed = consumedQuantities[row.budgetItemId] || 0;
                                  const available = row.totalAvailable - consumed;
                                  const current = Number(row.qty) || 0;
                                  const remaining = available - current;
                                  const isValid = current <= available;
                                  return (
                                    <div className={`flex items-center px-3 py-2 rounded text-sm ${!isValid ? 'bg-red-900 text-red-200' : 'bg-blue-900 text-blue-200'
                                      }`}>
                                      {current}/{available} remaining {remaining} (consumed: {consumed})
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-gray-700">
                  <button
                    onClick={() => setShowTodayModal(false)}
                    className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Budget Selection Modal for Tomorrow's Planning */}
          {showTomorrowModal && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                  <h2 className="text-2xl font-bold text-white">Add Plan - Tomorrow's Planning</h2>
                  <button
                    onClick={() => setShowTomorrowModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <span className="material-icons text-3xl">close</span>
                  </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-hidden flex">
                  {/* Budget Tree Section - Right Side */}
                  <div className="w-1/2 border-r border-gray-700 p-6 overflow-y-auto">
                    <h3 className="text-lg font-semibold text-white mb-4">Budget Items</h3>
                    <p className="text-sm text-gray-400 mb-4">Double-click on any item to add it</p>
                    <BudgetTreeForDPR
                      tree={budgetTree}
                      expanded={expandedBudgetNodes}
                      onToggle={toggleBudgetNode}
                      onItemDoubleClick={(item) => {
                        handleBudgetItemSelect(item, "tomorrow");
                      }}
                    />
                  </div>

                  {/* Plan List Section - Left Side */}
                  <div className="w-1/2 p-6 overflow-y-auto">
                    <h3 className="text-lg font-semibold text-white mb-4">Selected Plans</h3>
                    {tomorrowsPlan.length === 0 ? (
                      <div className="text-center text-gray-400 py-8">
                        No plans added yet. Double-click items from the budget tree to add them.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {tomorrowsPlan.map((row, idx) => (
                          <div key={idx} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <div className="font-semibold text-white">{row.item || "Untitled"}</div>
                                <div className="text-sm text-gray-400">Unit: {row.unit || "Not set"}</div>
                              </div>
                              <button
                                onClick={() => setTomorrowsPlan((prev) => prev.filter((_, i) => i !== idx))}
                                className="text-red-400 hover:text-red-600 transition-colors"
                              >
                                <span className="material-icons">delete</span>
                              </button>
                            </div>
                            <div className="space-y-2">
                              <input
                                className="w-full bg-gray-700 text-gray-100 rounded px-3 py-2 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Add remarks..."
                                value={row.remarks}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setTomorrowsPlan((prev) => {
                                    const updated = [...prev];
                                    updated[idx] = { ...updated[idx], remarks: val };
                                    return updated;
                                  });
                                }}
                              />
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  className={`flex-1 bg-gray-700 text-gray-100 rounded px-3 py-2 border ${(() => {
                                    if (!row.budgetItemId) return 'border-gray-700';
                                    const consumed = consumedQuantities[row.budgetItemId] || 0;
                                    const available = row.totalAvailable - consumed;
                                    return Number(row.qty) > available ? 'border-red-500' : 'border-gray-700';
                                  })()} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                  placeholder="Quantity"
                                  value={row.qty}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setTomorrowsPlan((prev) => {
                                      const updated = [...prev];
                                      updated[idx] = { ...updated[idx], qty: val };
                                      return updated;
                                    });
                                  }}
                                />
                                {row.budgetItemId && row.totalAvailable !== undefined && (() => {
                                  const consumed = consumedQuantities[row.budgetItemId] || 0;
                                  const available = row.totalAvailable - consumed;
                                  const current = Number(row.qty) || 0;
                                  const remaining = available - current;
                                  const isValid = current <= available;
                                  return (
                                    <div className={`flex items-center px-3 py-2 rounded text-sm ${!isValid ? 'bg-red-900 text-red-200' : 'bg-blue-900 text-blue-200'
                                      }`}>
                                      {current}/{available} remaining {remaining} (consumed: {consumed})
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-gray-700">
                  <button
                    onClick={() => setShowTomorrowModal(false)}
                    className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DailyProgressReport;
