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

    const UNIT_OPTIONS = ["No","Rmt","Sqm","Cum","Rft","Sft","Cft","MT","Kg","Lit","Day","Each","LS","Shift","Month","Hrs"];
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

          // Prefill today's progress
          if (dprJson?.todays_plan) {
            const tp = dprJson.todays_plan;
            const items = Array.isArray(tp.items) ? tp.items : Array.isArray(tp.plan) ? tp.plan : [];
            const qty = Array.isArray(tp.qty) ? tp.qty : [];
            const unit = Array.isArray(tp.unit) ? tp.unit : [];
            const remarks = Array.isArray(tp.remarks) ? tp.remarks : [];
            const len = Math.max(items.length, qty.length, unit.length, remarks.length);
            if (len > 0) {
              const arr = [];
              for (let i = 0; i < len; i++) {
                arr.push({
                  item: items[i] ?? "",
                  qty: qty[i] ?? "",
                  unit: unit[i] ?? "",
                  remarks: remarks[i] ?? "",
                });
              }
              setTodaysProgress(arr);
            } else {
              setTodaysProgress([]);
            }
          } else {
            setTodaysProgress([]);
          }

          // Prefill tomorrow's plan
          if (dprJson?.tomorrow_plan) {
            const tp2 = dprJson.tomorrow_plan;
            const items2 = Array.isArray(tp2.items) ? tp2.items : Array.isArray(tp2.plan) ? tp2.plan : [];
            const qty2 = Array.isArray(tp2.qty) ? tp2.qty : [];
            const unit2 = Array.isArray(tp2.unit) ? tp2.unit : [];
            const remarks2 = Array.isArray(tp2.remarks) ? tp2.remarks : [];
            const len2 = Math.max(items2.length, qty2.length, unit2.length, remarks2.length);
            if (len2 > 0) {
              const arr2 = [];
              for (let i = 0; i < len2; i++) {
                arr2.push({
                  item: items2[i] ?? "",
                  qty: qty2[i] ?? "",
                  unit: unit2[i] ?? "",
                  remarks: remarks2[i] ?? "",
                });
              }
              setTomorrowsPlan(arr2);
            } else {
              setTomorrowsPlan([]);
            }
          } else {
            setTomorrowsPlan([]);
          }
        } catch (err) {
          setTodaysProgress([]);
          setTomorrowsPlan([]);
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
    const cumulative_manpower = Array.isArray(labourReport)
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
    const today_prog = {
      items: todaysProgress.map((row) => row.item || ""),
      qty: todaysProgress.map((row) => row.qty || ""),
      unit: todaysProgress.map((row) => row.unit || ""),
      remarks: todaysProgress.map((row) => row.remarks || ""),
    };

    const tomorrow_plan = {
      items: tomorrowsPlan.map((row) => row.item || ""),
      qty: tomorrowsPlan.map((row) => row.qty || ""),
      unit: tomorrowsPlan.map((row) => row.unit || ""),
      remarks: tomorrowsPlan.map((row) => row.remarks || ""),
    };

    // --- Compose object in required order ---
    return {
      project_id: projectId,
      report_date: new Date().toISOString().split("T")[0], // e.g., "2024-06-24"
      site_condition,
      labour_report,
      cumulative_manpower,
      today_prog,
      today_qty: today_prog.qty,
      tomorrow_plan,
      tomorrow_qty: tomorrow_plan.qty,
      remarks: remarksVal,
      events_remarks,
      created_at: getMySQLDateTime(),
      user_roles: [], // Placeholder, replace with actual user role logic if needed
    };
  }

  async function postDPRToBackend() {
  try {
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
                  className={`mx-1 text-center cursor-pointer pb-0.5 ${
                    condition === "normal" ? "border-b-2 border-blue-400" : ""
                  }`}
                  onClick={() => setCondition("normal")}
                >
                  <span className="material-icons text-yellow-400">
                    wb_sunny
                  </span>
                  <p>Normal Day</p>
                </div>
                <div
                  className={`mx-1 text-center cursor-pointer pb-0.5 ${
                    condition === "normal" ? "border-b-2 border-blue-400" : ""
                  }`}
                  onClick={() => setCondition("normal")}
                >
                  <span className="material-icons text-orange-400">
                    terrain
                  </span>
                  <p>Dry</p>
                </div>
                <div
                  className={`mx-1 text-center cursor-pointer pb-0.5 ${
                    condition === "rainy" ? "border-b-2 border-blue-400" : ""
                  }`}
                  onClick={() => setCondition("rainy")}
                >
                  <span className="material-icons text-blue-400">umbrella</span>
                  <p>Rainy Day</p>
                </div>
                <div
                  className={`mx-1 text-center cursor-pointer pb-0.5 ${
                    condition === "rainy" ? "border-b-2 border-blue-400" : ""
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
              <div className="flex items-center mb-4">
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
              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-0">
                  <thead>
                    <tr>
                      <th className="border-b border-gray-700 px-4 py-2 text-left text-gray-300 font-bold bg-gray-800 w-[35%]">Item</th>
                      <th className="border-b border-gray-700 px-4 py-2 text-left text-gray-300 font-bold bg-gray-800 w-[35%]">Remarks</th>
                      <th className="border-b border-gray-700 px-4 py-2 text-left text-gray-300 font-bold bg-gray-800 w-[17%]">Unit</th>
                      <th className="border-b border-gray-700 px-4 py-2 text-left text-gray-300 font-bold bg-gray-800 w-[13%]">Qty</th>
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
                        <td className="border-b border-gray-700 px-4 py-2 w-[35%]">
                          <input
                            className="w-full bg-gray-700 text-gray-100 rounded px-2 py-1 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Item"
                            value={row.item}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTodaysProgress((prev) => {
                                const updated = [...prev];
                                updated[idx] = { ...updated[idx], item: val };
                                return updated;
                              });
                            }}
                          />
                        </td>

                        <td className="border-b border-gray-700 px-4 py-2 w-[35%]">
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

                        <td className="border-b border-gray-700 px-4 py-2 w-[17%]">
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
                        </td>
                        
                        <td className="border-b border-gray-700 px-4 py-2 w-[13%]">
                          <input
                            className="w-full bg-gray-700 text-gray-100 rounded px-2 py-1 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <button className="bg-gray-600 text-white hover:bg-gray-700 rounded-lg font-medium cursor-pointer transition-colors duration-300 px-5 py-2 w-full mt-4" type="button" onClick={() => setTodaysProgress((prev) => [...prev, { item: "", unit: "", qty: "", remarks: "" }])}>
                Add Task
              </button>
            </div>

            {/* Tomorrow's Planning Table */}
            <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-800">
              <div className="flex items-center mb-4">
                <h2 className="text-lg font-medium text-[#E0E0E0] mr-2">Tomorrow's Planning</h2>
                <button type="button" className="ml-1 text-gray-400 hover:text-blue-400 transition-colors" title={editTomorrow ? "Done" : "Edit"} onClick={() => setEditTomorrow((e) => !e)}>
                  {!editTomorrow ? (
                    <span className="material-icons align-middle">edit</span>
                  ) : (
                    <span className="material-icons align-middle">check</span>
                  )}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-0">
                  <thead>
                    <tr>
                      <th className="border-b border-gray-700 px-4 py-2 text-left text-gray-300 font-bold bg-gray-800 w-[35%]">Item</th>
                      <th className="border-b border-gray-700 px-4 py-2 text-left text-gray-300 font-bold bg-gray-800 w-[35%]">Remarks</th>
                      <th className="border-b border-gray-700 px-4 py-2 text-left text-gray-300 font-bold bg-gray-800 w-[17%]">Unit</th>
                      <th className="border-b border-gray-700 px-4 py-2 text-left text-gray-300 font-bold bg-gray-800 w-[13%]">Qty</th>
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
                        <td className="border-b border-gray-700 px-4 py-2 w-[35%]">
                          <input className="w-full bg-gray-700 text-gray-100 rounded px-2 py-1 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Item" value={row.item} onChange={(e) => { const val = e.target.value; setTomorrowsPlan((prev) => { const updated = [...prev]; updated[idx] = { ...updated[idx], item: val }; return updated; }); }} />
                        </td>

                        <td className="border-b border-gray-700 px-4 py-2 w-[35%]">
                          <input className="w-full bg-gray-700 text-gray-100 rounded px-2 py-1 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Remarks" value={row.remarks} onChange={(e) => { const val = e.target.value; setTomorrowsPlan((prev) => { const updated = [...prev]; updated[idx] = { ...updated[idx], remarks: val }; return updated; }); }} />
                        </td>

                        <td className="border-b border-gray-700 px-4 py-2 w-[17%]">
                          <select className="w-full bg-gray-700 text-gray-100 rounded px-2 py-1 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" value={row.unit} onChange={(e) => { const val = e.target.value; setTomorrowsPlan((prev) => { const updated = [...prev]; updated[idx] = { ...updated[idx], unit: val }; return updated; }); }}>
                            <option value="">Select Unit</option>
                            {UNIT_OPTIONS.map((u) => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                        </td>

                        <td className="border-b border-gray-700 px-4 py-2 w-[13%]">
                          <input className="w-full bg-gray-700 text-gray-100 rounded px-2 py-1 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Quantity" value={row.qty} onChange={(e) => { const val = e.target.value; setTomorrowsPlan((prev) => { const updated = [...prev]; updated[idx] = { ...updated[idx], qty: val }; return updated; }); }} />
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
              <button className="bg-gray-600 text-white hover:bg-gray-700 rounded-lg font-medium cursor-pointer transition-colors duration-300 px-5 py-2 w-full mt-4" type="button" onClick={() => setTomorrowsPlan((prev) => [...prev, { item: "", unit: "", qty: "", remarks: "" }])}>
                Add Plan
              </button>
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
        </div>
      </div>
    </div>
  );
}

export default DailyProgressReport;
