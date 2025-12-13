import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

function DprUpdateSubmit() {
  const { projectId, dprId } = useParams();
  const navigate = useNavigate();
  const UNIT_OPTIONS = ["No", "Rmt", "Sqm", "Cum", "Rft", "Sft", "Cft", "MT", "Kg", "Lit", "Day", "Each", "LS", "Shift", "Month", "Hrs"];
  const genId = () => `${Date.now().toString(36)}-${Math.floor(Math.random() * 100000).toString(36)}`;

  const [project, setProject] = useState(null);
  const [eventsVisit, setEventsVisit] = useState([{ id: genId(), text: "" }]);
  const [generalRemark, setGeneralRemark] = useState("");

  const addEventVisit = () => setEventsVisit(p => [...p, { id: genId(), text: '' }]);
  const removeEventVisit = idx => setEventsVisit(p => p.filter((_, i) => i !== idx));
  const setEventVisit = (idx, val) => setEventsVisit(p => p.map((row, i) => i === idx ? { ...row, text: val } : row));

  const [reportDate, setReportDate] = useState(""); // read-only later
  const [siteCondition, setSiteCondition] = useState({
    is_rainy: false,
    ground_state: "",
    rain_timing: [],
  });
  const [labourReport, setLabourReport] = useState({
    agency: [],
    remarks: [],
  });

  const [todayProg, setTodayProg] = useState([
    { id: genId(), item: "", unit: "", qty: "", remarks: "" },
  ]);
  const [tomorrowPlan, setTomorrowPlan] = useState([
    { id: genId(), item: "", unit: "", qty: "", remarks: "" },
  ]);
  const [eventsRemarks, setEventsRemarks] = useState([
    { id: genId(), text: "" },
  ]);
  const [bottomRemarks, setBottomRemarks] = useState([
    { id: genId(), text: "" },
  ]);
  const [distribute, setDistribute] = useState([{ id: genId(), text: "" }]);

  const [preparedBy, setPreparedBy] = useState("");
  const initialDpr = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const isoToYMD = (iso) => (typeof iso === "string" ? iso.split("T")[0] : "");

  const ymdToDMY = (ymd) => {
    if (!ymd || typeof ymd !== "string") return "";
    const [y, m, d] = ymd.split("-");
    return `${d}/${m}/${y}`;
  };

  const formatISOToDMY = (iso) => {
    if (!iso) return "";
    const ymd = isoToYMD(iso);
    return ymdToDMY(ymd);
  };

  const elapsedRemaining = useMemo(() => {
    if (!project?.start_date || !project?.end_date)
      return { elapsed: "--", left: "--" };
    const s = new Date(project.start_date);
    const e = new Date(project.end_date);
    const current = reportDate
      ? new Date(
        Date.UTC(
          Number(reportDate.slice(0, 4)),
          Number(reportDate.slice(5, 7)) - 1,
          Number(reportDate.slice(8, 10))
        )
      )
      : new Date();

    const DAY = 86400000;
    const startUTC = new Date(
      Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate())
    );
    const endUTC = new Date(
      Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate())
    );

    const totalDays = Math.max(0, Math.floor((endUTC - startUTC) / DAY));
    let elapsed = Math.floor((current - startUTC) / DAY);
    if (elapsed < 0) elapsed = 0;
    if (elapsed > totalDays) elapsed = totalDays;
    const left = totalDays - elapsed;

    return { elapsed, left };
  }, [project, reportDate]);

  // Fetch data
  useEffect(() => {
    let mounted = true;

    async function fetchProject() {
      const res = await fetch(`${API_BASE}/project/getProject/${projectId}`, {
        credentials: "include",
      });
      const { data } = await res.json();
      if (!mounted) return;
      setProject(data || null);
    }

    async function fetchDpr() {
      const res = await fetch(`${API_BASE}/report/getDPR/${dprId}`, {
        credentials: "include",
      });
      const { data } = await res.json();
      if (!mounted) return;

      initialDpr.current = data;

      setReportDate(data?.report_date ? isoToYMD(data.report_date) : "");
      setSiteCondition({
        is_rainy: !!data?.site_condition?.is_rainy,
        ground_state: data?.site_condition?.ground_state || "",
        rain_timing: Array.isArray(data?.site_condition?.rain_timing)
          ? data.site_condition.rain_timing
          : [],
      });

      // ---- Labour report ----
      const lr = data?.labour_report || {};
      const safe = {
        agency: Array.isArray(lr.agency) ? lr.agency : [],
        remarks: Array.isArray(lr.remarks) ? lr.remarks : [],
      };
      Object.keys(lr || {}).forEach((k) => {
        if (k !== "agency" && k !== "remarks") {
          safe[k] = Array.isArray(lr[k]) ? lr[k] : [];
        }
      });
      setLabourReport(safe);

      // ---- Today Progress ----
      // Support both old and new shapes
      // ---- Today Progress ----
      // Support old object shape and new array-of-objects shape
      if (data?.today_prog) {
        const tp = data.today_prog;

        if (Array.isArray(tp)) {
          // ✅ New format: array of objects
          const arr = tp.map((row) => ({
            id: genId(), // local React row id
            itemId: row.item_id ?? null, // DB item id
            dprUseId: row.dpr_use_id ?? null, // DB row id (use row.dpr_use_id)
            item: row.item_name ?? row.item ?? "",
            unit: row.unit ?? "",
            qty: row.quantity ?? row.qty ?? "",
            remarks: row.remarks ?? "",
          }));

          setTodayProg(
            arr.length
              ? arr
              : [{ id: genId(), item: "", unit: "", qty: "", remarks: "" }]
          );
        } else {
          // ✅ Old format: { items, unit, qty, remarks } or { progress, qty }
          const items = Array.isArray(tp.items)
            ? tp.items
            : Array.isArray(tp.progress)
            ? tp.progress
            : [];
          const qty = Array.isArray(tp.qty) ? tp.qty : [];
          const unit = Array.isArray(tp.unit) ? tp.unit : [];
          const remarks = Array.isArray(tp.remarks) ? tp.remarks : [];
          const len = Math.max(
            items.length,
            qty.length,
            unit.length,
            remarks.length,
            1
          );
          const arr = [];
          for (let i = 0; i < len; i++) {
            arr.push({
              id: genId(),
              item: items[i] ?? "",
              unit: unit[i] ?? "",
              qty: qty[i] ?? "",
              remarks: remarks[i] ?? "",
            });
          }
          setTodayProg(arr);
        }
      } else {
        setTodayProg([
          { id: genId(), item: "", unit: "", qty: "", remarks: "" },
        ]);
      }

      // ---- Tomorrow Plan ----
      // Support old object shape and new array-of-objects shape
      if (data?.tomorrow_plan) {
        const tp2 = data.tomorrow_plan;

        if (Array.isArray(tp2)) {
          // ✅ New format: array of objects
          const arr2 = tp2.map((row) => ({
            id: genId(), // local React id
            itemId: row.item_id ?? null, // DB item id
            dprPlanId: row.dpr_plan_id ?? null, // DB row id
            item: row.item_name ?? row.item ?? "",
            unit: row.unit ?? "",
            qty: row.quantity ?? row.qty ?? "",
            remarks: row.remarks ?? "",
          }));

          setTomorrowPlan(
            arr2.length
              ? arr2
              : [{ id: genId(), item: "", unit: "", qty: "", remarks: "" }]
          );
        } else {
          // ✅ Old format: { items, unit, qty, remarks } or { plan, qty }
          const items2 = Array.isArray(tp2.items)
            ? tp2.items
            : Array.isArray(tp2.plan)
            ? tp2.plan
            : [];
          const qty2 = Array.isArray(tp2.qty) ? tp2.qty : [];
          const unit2 = Array.isArray(tp2.unit) ? tp2.unit : [];
          const remarks2 = Array.isArray(tp2.remarks) ? tp2.remarks : [];
          const len2 = Math.max(
            items2.length,
            qty2.length,
            unit2.length,
            remarks2.length,
            1
          );
          const arr2 = [];
          for (let i = 0; i < len2; i++) {
            arr2.push({
              id: genId(),
              item: items2[i] ?? "",
              unit: unit2[i] ?? "",
              qty: qty2[i] ?? "",
              remarks: remarks2[i] ?? "",
            });
          }
          setTomorrowPlan(arr2);
        }
      } else {
        setTomorrowPlan([
          { id: genId(), item: "", unit: "", qty: "", remarks: "" },
        ]);
      }

      // Events Visit
      setEventsVisit(
        Array.isArray(data?.report_footer?.events_visit)
          ? data.report_footer.events_visit.map((text) => ({
              id: genId(),
              text,
            }))
          : [{ id: genId(), text: "" }]
      );

      // General / bottom remarks (textarea)
      setGeneralRemark(
        Array.isArray(data?.report_footer?.bottom_remarks)
          ? data.report_footer.bottom_remarks.join("\n")
          : typeof data?.report_footer?.bottom_remarks === "string"
            ? data.report_footer.bottom_remarks
            : ""
      );

      // Distribute
      setDistribute(
        Array.isArray(data?.report_footer?.distribute)
          ? data.report_footer.distribute.map((text) => ({ id: genId(), text }))
          : [{ id: genId(), text: "" }]
      );

      setPreparedBy(data?.report_footer?.prepared_by || "");
    }

    (async () => {
      try {
        setLoading(true);
        await Promise.all([fetchProject(), fetchDpr()]);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load data");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [projectId, dprId]);

  const labourCols = useMemo(() => {
    return Object.keys(labourReport).filter(
      (k) => k !== "agency" && k !== "remarks"
    );
  }, [labourReport]);

  const setRemark = (idx, val) =>
    setLabourReport((p) => {
      const next = { ...p, remarks: [...p.remarks] };
      next.remarks[idx] = val;
      return next;
    });

  const setCell = (col, idx, val) =>
    setLabourReport((p) => {
      const next = { ...p, [col]: [...(p[col] || [])] };
      const n = Number(val);
      next[col][idx] = Number.isFinite(n) && n >= 0 ? n : 0;
      return next;
    });

  const rowTotal = (idx) =>
    labourCols.reduce(
      (sum, c) => sum + (Number(labourReport[c]?.[idx]) || 0),
      0
    );

  const colTotals = useMemo(() => {
    const totals = {};
    labourCols.forEach((c) => {
      totals[c] = (labourReport[c] || []).reduce(
        (s, v) => s + (Number(v) || 0),
        0
      );
    });
    totals.total = Object.values(totals).reduce((s, v) => s + (v || 0), 0);
    return totals;
  }, [labourCols, labourReport]);

  const normalize = (dpr) => ({
    site_condition: {
      is_rainy: Boolean(dpr?.site_condition?.is_rainy),
      ground_state: dpr?.site_condition?.ground_state || "",
      rain_timing: Array.isArray(dpr?.site_condition?.rain_timing)
        ? dpr.site_condition.rain_timing
        : [],
    },

    // labour_report is ALWAYS an object
    labour_report: (() => {
      const lr = dpr?.labour_report || {};
      const safe = {
        agency: Array.isArray(lr.agency) ? lr.agency : [],
        remarks: Array.isArray(lr.remarks) ? lr.remarks : [],
      };
      Object.keys(lr || {}).forEach((k) => {
        if (k !== "agency" && k !== "remarks") {
          safe[k] = Array.isArray(lr[k]) ? lr[k] : [];
        }
      });
      return safe;
    })(),

    today_prog: (() => {
      const tp = dpr?.today_prog;

      // New shape: array of objects
      if (Array.isArray(tp)) {
        return {
          items: tp.map((r) => r.item_name ?? r.item ?? ""),
          unit: tp.map((r) => r.unit ?? ""),
          qty: tp.map((r) => r.quantity ?? r.qty ?? ""),
          remarks: tp.map((r) => r.remarks ?? ""),
        };
      }

      // Old shapes: { items, unit, qty, remarks } or { progress, qty }
      return {
        items: Array.isArray(tp?.items)
          ? tp.items
          : Array.isArray(tp?.progress)
          ? tp.progress
          : [],
        unit: Array.isArray(tp?.unit) ? tp.unit : [],
        qty: Array.isArray(tp?.qty) ? tp.qty : [],
        remarks: Array.isArray(tp?.remarks) ? tp.remarks : [],
      };
    })(),

    tomorrow_plan: (() => {
      const tp2 = dpr?.tomorrow_plan;

      if (Array.isArray(tp2)) {
        return {
          items: tp2.map((r) => r.item_name ?? r.item ?? ""),
          unit: tp2.map((r) => r.unit ?? ""),
          qty: tp2.map((r) => r.quantity ?? r.qty ?? ""),
          remarks: tp2.map((r) => r.remarks ?? ""),
        };
      }

      return {
        items: Array.isArray(tp2?.items)
          ? tp2.items
          : Array.isArray(tp2?.plan)
          ? tp2.plan
          : [],
        unit: Array.isArray(tp2?.unit) ? tp2.unit : [],
        qty: Array.isArray(tp2?.qty) ? tp2.qty : [],
        remarks: Array.isArray(tp2?.remarks) ? tp2.remarks : [],
      };
    })(),
    events_remarks: Array.isArray(dpr?.events_remarks)
      ? dpr.events_remarks
      : [],
    report_footer: {
      distribute: Array.isArray(dpr?.report_footer?.distribute)
        ? dpr.report_footer.distribute
        : [],
      prepared_by: dpr?.report_footer?.prepared_by || "",
      events_visit: Array.isArray(dpr?.report_footer?.events_visit)
        ? dpr.report_footer.events_visit
        : [],
      bottom_remarks: Array.isArray(dpr?.report_footer?.bottom_remarks)
        ? dpr.report_footer.bottom_remarks
        : typeof dpr?.report_footer?.bottom_remarks === "string"
          ? [dpr.report_footer.bottom_remarks]
          : [],
    },
  });

  function deepSectionDiff(prev, next) {
    prev = normalize(prev);
    next = normalize(next);

    const diff = {};

    for (const key of Object.keys(next)) {
      const p = prev[key];
      const n = next[key];

      if (typeof p === "object" && typeof n === "object" && p && n) {
        if (JSON.stringify(p) !== JSON.stringify(n)) {
          diff[key] = n;
        }
      } else if (n !== undefined && n !== null) {
        if (p !== n) diff[key] = n;
      }
    }

    return diff;
  }

  const performSave = async (silent = false) => {
    try {
      setSaving(true);

      const bottomRemarksArray = (() => {
        if (!generalRemark) return [""];
        const arr = generalRemark
          .split("\n")
          .map((s) => s.replace(/\r/g, "").trim());
        const filtered = arr.filter((s) => s.length > 0);
        return filtered.length ? filtered : [""];
      })();

      const currentDpr = {
        report_date: reportDate,
        site_condition: {
          is_rainy: siteCondition.is_rainy,
          ground_state: siteCondition.ground_state,
          rain_timing: siteCondition.rain_timing,
        },
        labour_report: labourReport,
        today_prog: {
          items: todayProg.map((row) => row.item || ""),
          unit: todayProg.map((row) => row.unit || ""),
          qty: todayProg.map((row) => row.qty || ""),
          remarks: todayProg.map((row) => row.remarks || ""),
        },
        tomorrow_plan: {
          items: tomorrowPlan.map((row) => row.item || ""),
          unit: tomorrowPlan.map((row) => row.unit || ""),
          qty: tomorrowPlan.map((row) => row.qty || ""),
          remarks: tomorrowPlan.map((row) => row.remarks || ""),
        },
        events_remarks: eventsRemarks.map((e) => e.text),
        report_footer: {
          distribute: distribute.map((d) => d.text),
          prepared_by: preparedBy,
          bottom_remarks: bottomRemarksArray,
          events_visit: eventsVisit.map((e) => e.text),
        },
      };

      const patch = deepSectionDiff(initialDpr.current || {}, currentDpr) || {};

      patch.today_prog = {
        items: todayProg.map((row) => row.item || ""),
        unit: todayProg.map((row) => row.unit || ""),
        qty: todayProg.map((row) => row.qty || ""),
        remarks: todayProg.map((row) => row.remarks || ""),
      };

      patch.tomorrow_plan = {
        items: tomorrowPlan.map((row) => row.item || ""),
        unit: tomorrowPlan.map((row) => row.unit || ""),
        qty: tomorrowPlan.map((row) => row.qty || ""),
        remarks: tomorrowPlan.map((row) => row.remarks || ""),
      };

      // console.log("PATCH:", patch);

      if (!patch || Object.keys(patch).length === 0) {
        if (!silent) toast.info("No changes to save.");
        setSaving(false);
        return true; // considered success
      }

      if (Object.keys(patch).length > 0) {
        patch.project_id = projectId;
        patch.report_date = reportDate;
      }

      // console.log("FINAL PATCH SENT:", JSON.stringify(patch, null, 2));

      const res = await fetch(`${API_BASE}/report/updateDPR/${dprId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(patch),
      });
      const data = await res.json();

      if (res.ok && (data.ok || data.success)) {
        if (!silent) toast.success("DPR updated successfully");
        initialDpr.current = currentDpr;
        return true;
      } else {
        toast.info("Make changes to update the DPR" || data.message);
        return false;
      }
    } catch (e) {
      console.error(e);
      toast.error("Error updating DPR");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const onSave = async () => {
    await performSave();
  };

  // #region helpers

  function EditableList({
    title,
    items,
    onAdd,
    onRemove,
    onChange,
    placeholder,
    className = "",
    children,
  }) {
    return (
      <div
        className={`bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-lg ${className}`}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onAdd}
            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600"
          >
            + Add
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {items.length ? (
            items.map((r, idx) => (
              <div key={r.id} className="flex items-center gap-2">
                <input
                  type="text"
                  defaultValue={r.text}
                  onBlur={(e) => onChange(idx, e.target.value)}
                  className="flex-1 bg-transparent border-b border-gray-600 outline-none"
                  placeholder={placeholder}
                />
                <button
                  type="button"
                  onClick={() => onRemove(idx)}
                  className="text-red-400 hover:text-red-500 text-sm"
                >
                  <span className="material-icons text-md">delete</span>
                </button>
              </div>
            ))
          ) : (
            <div className="text-gray-500 italic">No items yet.</div>
          )}
        </div>
        {children}
      </div>
    );
  }

  // ---- Today handlers (4-col) ----
  const addTodayRow = () =>
    setTodayProg((p) => [
      ...p,
      { id: genId(), item: "", unit: "", qty: "", remarks: "" },
    ]);

  const removeTodayRow = (idx) =>
    setTodayProg((p) => p.filter((_, i) => i !== idx));

  // ---- Tomorrow handlers (4-col) ----
  const addTomorrowRow = () =>
    setTomorrowPlan((p) => [
      ...p,
      { id: genId(), item: "", unit: "", qty: "", remarks: "" },
    ]);

  const removeTomorrowRow = (idx) =>
    setTomorrowPlan((p) => p.filter((_, i) => i !== idx));

  const addDistributor = () =>
    setDistribute((p) => [...p, { id: genId(), text: "" }]);
  const removeDistributor = (idx) =>
    setDistribute((p) => p.filter((_, i) => i !== idx));
  const setDistributor = (idx, val) =>
    setDistribute((p) =>
      p.map((row, i) => (i === idx ? { ...row, text: val } : row))
    );

  //#endregion

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // open the confirm modal
  const openSubmitModal = () => setShowConfirmModal(true);
  const cancelSubmit = () => setShowConfirmModal(false);


  const autoCloseMs = 2000;
  // confirmed submit handler
  const confirmSubmit = async () => {
    setShowConfirmModal(false);

    // First save any pending changes silently
    const saved = await performSave(true);
    if (!saved) {
      toast.error("Cannot submit: Failed to save changes.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`${API_BASE}/report/submit/${dprId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.message || response.statusText || "Request failed");
      }

      const successBody = await response.json().catch(() => ({}));

      // show success toast and redirect when it closes
      toast.success(successBody.message || "DPR submitted successfully", {
        autoClose: autoCloseMs,
        onClose: () => {
          navigate(`/dashboard/project-description/${projectId}/dpr-list`);
        },
      });
    } catch (error) {
      console.error("Submit DPR error:", error);
      // show error toast then redirect when it closes
      toast.error(error?.message || "Error submitting DPR", {
        autoClose: autoCloseMs,
        onClose: () => {
          navigate(`/dashboard/project-description/${projectId}`);
        },
      });
      console.error("Submit DPR error:", error);
      // show error toast then redirect when it closes
      toast.error(error?.message || "Error submitting DPR", {
        autoClose: autoCloseMs,
        onClose: () => {
          navigate(`/dashboard/project-description/${projectId}`);
        },
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 px-6 py-8 md:px-12 lg:px-20">
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-gray-700 pb-4 mb-8">
        <h1 className="text-3xl font-bold">Daily Progress Report — Update</h1>
        <div className="bg-gray-800 px-4 py-2 rounded-lg text-sm text-gray-300 shadow">
          Report Date:{" "}
          <span className="font-semibold text-white">
            {reportDate ? ymdToDMY(reportDate) : "—"}
          </span>
        </div>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={autoCloseMs}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <div className="grid md:grid-cols-3 gap-6 mb-10">
        {/* Project Info + Timeline */}
        <div className="bg-gray-800 rounded-xl p-6 space-y-4 col-span-2 shadow-lg border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">
            Project Information
          </h2>

          {/* Project details grid */}
          <div className="grid grid-cols-2 gap-2 text-base">
            <p>
              <span className="text-gray-400">Name of Work:</span>{" "}
              <strong>{project?.project_name || "—"}</strong>
            </p>
            <p>
              <span className="text-gray-400">Employer:</span>{" "}
              <strong>{project?.Employer || "—"}</strong>
            </p>
            <p>
              <span className="text-gray-400">Project Code:</span>{" "}
              <strong>{project?.project_code || "—"}</strong>
            </p>
            <p>
              <span className="text-gray-400">Location:</span>{" "}
              <strong>{project?.location || "—"}</strong>
            </p>
          </div>

          {/* Elapsed / Remaining Days Row */}
          <div className="flex justify-between mt-6 text-sm">
            {/* Elapsed Days */}
            <div className="relative left-6">
              <div className="text-gray-400 relative left-12 mb-1">
                Elapsed Days
              </div>
              <div className="text-2xl font-bold flex items-center gap-2">
                <span className="material-icons bg-white rounded-full text-black text-3xl flex items-center justify-center w-10 h-10">
                  calendar_today
                </span>
                <span>{elapsedRemaining?.elapsed || 0}</span>
                <span className="text-xl font-normal">days</span>
              </div>
              <div className="text-gray-400 relative left-12 mt-1">
                Start: {formatISOToDMY(project?.start_date) || "—"}
              </div>
            </div>

            {/* Remaining Days */}
            <div className="relative right-80">
              <div className="text-gray-400 relative left-12 mb-1">
                Remaining Days
              </div>
              <div className="text-2xl font-bold flex items-center gap-2">
                <span className="material-icons bg-white rounded-full text-black text-3xl flex items-center justify-center w-10 h-10">
                  calendar_today
                </span>
                <span>{elapsedRemaining?.left || 0}</span>
                <span className="text-xl font-normal">days</span>
              </div>
              <div className="text-gray-400 relative left-12 mt-1">
                End: {formatISOToDMY(project?.end_date) || "—"}
              </div>
            </div>
          </div>
        </div>

        {/* Site Conditions (moved to right side) */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">
            Site Conditions
          </h2>

          <div className="flex gap-4 items-center mb-4">
            <label>
              <input
                type="checkbox"
                checked={siteCondition.is_rainy}
                onChange={(e) =>
                  setSiteCondition((s) => ({
                    ...s,
                    is_rainy: e.target.checked,
                  }))
                }
              />{" "}
              Rainy
            </label>
            <label>
              <input
                type="radio"
                checked={siteCondition.ground_state === "slushy"}
                onChange={() =>
                  setSiteCondition((s) => ({ ...s, ground_state: "slushy" }))
                }
              />{" "}
              Slushy
            </label>
            <label>
              <input
                type="radio"
                checked={siteCondition.ground_state === "dry"}
                onChange={() =>
                  setSiteCondition((s) => ({ ...s, ground_state: "dry" }))
                }
              />{" "}
              Dry
            </label>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span>Rain Timings</span>
              <button
                disabled={(siteCondition.rain_timing || []).length >= 3}
                onClick={() =>
                  setSiteCondition((s) => ({
                    ...s,
                    rain_timing: [...(s.rain_timing || []), "00:00-01:00"],
                  }))
                }
                className="bg-gray-700 px-2 py-1 rounded disabled:opacity-50"
              >
                + Add
              </button>
            </div>

            {(siteCondition.rain_timing || []).map((slot, i) => {
              const [from, to] = (slot || "").split("-");
              return (
                <div key={i} className="flex gap-2 items-center mb-1">
                  <input
                    type="time"
                    style={{ colorScheme: "dark" }}
                    value={from}
                    onChange={(e) => {
                      const next = [...siteCondition.rain_timing];
                      next[i] = `${e.target.value}-${to}`;
                      setSiteCondition((s) => ({ ...s, rain_timing: next }));
                    }}
                  />
                  <span>to</span>
                  <input
                    type="time"
                    style={{ colorScheme: "dark" }}
                    value={to}
                    onChange={(e) => {
                      const next = [...siteCondition.rain_timing];
                      next[i] = `${from}-${e.target.value}`;
                      setSiteCondition((s) => ({ ...s, rain_timing: next }));
                    }}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setSiteCondition((s) => ({
                        ...s,
                        rain_timing: s.rain_timing.filter(
                          (_, idx) => idx !== i
                        ),
                      }))
                    }
                    className="text-red-400 hover:text-red-500 hover:cursor-pointer relative top-1    "
                    title="Delete row"
                  >
                    <span className="material-icons text-[18px]">delete</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Labour Report - new design with arrow key navigation */}
      <div className="bg-gray-800/60 p-6 rounded-xl mb-10 shadow-lg border border-gray-700">
        <h2 className="text-2xl font-semibold mb-4 text-blue-400">
          Labour Report
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-700/60 text-gray-300 uppercase text-xs tracking-wider">
                <th className="px-3 py-2 text-left">Agency</th>
                {project?.metadata?.labour_type?.map((type, colIdx) => (
                  <th key={type} className="px-3 py-2 text-center">
                    {type}
                  </th>
                ))}
                <th className="px-3 py-2 text-center">Total</th>
                <th className="px-3 py-2 text-left">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {project?.metadata?.agency?.map((agency, rowIdx) => (
                <tr
                  key={`${agency}-${rowIdx}`}
                  className="even:bg-gray-700/40 hover:bg-gray-700/60 transition"
                >
                  <td className="px-3 py-2 font-medium">{agency}</td>
                  {project?.metadata?.labour_type?.map((type, colIdx) => (
                    <td key={type} className="px-3 py-2 text-center">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={
                          labourReport[type] &&
                          labourReport[type][rowIdx] !== undefined
                            ? labourReport[type][rowIdx]
                            : ""
                        }
                        onChange={(e) => {
                          setLabourReport((prev) => {
                            const next = {
                              ...prev,
                              [type]: [...(prev[type] || [])],
                            };
                            const n = Number(e.target.value);
                            next[type][rowIdx] =
                              Number.isFinite(n) && n >= 0 ? n : 0;
                            return next;
                          });
                        }}
                        className="w-20 text-center bg-gray-900/50 border border-gray-600 rounded px-2 py-1 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        data-labour-row={rowIdx}
                        data-labour-col={colIdx}
                        onKeyDown={(e) => {
                          const totalRows =
                            project?.metadata?.agency?.length ?? 0;
                          const totalCols =
                            project?.metadata?.labour_type?.length ?? 0;
                          let nextRow = rowIdx,
                            nextCol = colIdx;
                          if (
                            [
                              "ArrowUp",
                              "ArrowDown",
                              "ArrowLeft",
                              "ArrowRight",
                            ].includes(e.key)
                          ) {
                            if (e.key === "ArrowUp")
                              nextRow = Math.max(0, rowIdx - 1);
                            if (e.key === "ArrowDown")
                              nextRow = Math.min(totalRows - 1, rowIdx + 1);
                            if (e.key === "ArrowLeft")
                              nextCol = Math.max(0, colIdx - 1);
                            if (e.key === "ArrowRight")
                              nextCol = Math.min(totalCols - 1, colIdx + 1);
                            // Only move if not same as current
                            if (nextRow !== rowIdx || nextCol !== colIdx) {
                              e.preventDefault();
                              const sel = document.querySelector(
                                `input[data-labour-row="${nextRow}"][data-labour-col="${nextCol}"]`
                              );
                              if (sel) sel.focus();
                            }
                          }
                        }}
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center font-semibold">
                    {project?.metadata?.labour_type?.reduce(
                      (sum, type) =>
                        sum + (Number(labourReport[type]?.[rowIdx]) || 0),
                      0
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={labourReport.remarks?.[rowIdx] || ""}
                      onChange={(e) => {
                        setLabourReport((prev) => {
                          const next = {
                            ...prev,
                            remarks: [...(prev.remarks || [])],
                          };
                          next.remarks[rowIdx] = e.target.value;
                          return next;
                        });
                      }}
                      className="w-full bg-gray-900/50 border border-gray-600 rounded px-2 py-1 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-900/70 font-semibold">
                <td className="px-3 py-2">Total</td>
                {project?.metadata?.labour_type?.map((type, colIdx) => (
                  <td key={type} className="px-3 py-2 text-center">
                    {(labourReport[type] || []).reduce(
                      (s, v) => s + (Number(v) || 0),
                      0
                    )}
                  </td>
                ))}
                <td className="px-3 py-2 text-center text-blue-400 font-bold">
                  {project?.metadata?.labour_type?.reduce(
                    (total, type) =>
                      total +
                      (labourReport[type] || []).reduce(
                        (s, v) => s + (Number(v) || 0),
                        0
                      ),
                    0
                  )}
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <EditableTable4
          title="Today's Progress"
          rows={todayProg}
          onAdd={() => addTodayRow()}
          onRemove={removeTodayRow}
          onChangeItem={(i, v) =>
            setTodayProg((p) =>
              p.map((r, idx) => (idx === i ? { ...r, item: v } : r))
            )
          }
          onChangeRemarks={(i, v) =>
            setTodayProg((p) =>
              p.map((r, idx) => (idx === i ? { ...r, remarks: v } : r))
            )
          }
          onChangeUnit={(i, v) =>
            setTodayProg((p) =>
              p.map((r, idx) => (idx === i ? { ...r, unit: v } : r))
            )
          }
          onChangeQty={(i, v) =>
            setTodayProg((p) =>
              p.map((r, idx) => (idx === i ? { ...r, qty: v } : r))
            )
          }
        />
        <EditableTable4
          title="Tomorrow's Planning"
          rows={tomorrowPlan}
          onAdd={() => addTomorrowRow()}
          onRemove={removeTomorrowRow}
          onChangeItem={(i, v) =>
            setTomorrowPlan((p) =>
              p.map((r, idx) => (idx === i ? { ...r, item: v } : r))
            )
          }
          onChangeRemarks={(i, v) =>
            setTomorrowPlan((p) =>
              p.map((r, idx) => (idx === i ? { ...r, remarks: v } : r))
            )
          }
          onChangeUnit={(i, v) =>
            setTomorrowPlan((p) =>
              p.map((r, idx) => (idx === i ? { ...r, unit: v } : r))
            )
          }
          onChangeQty={(i, v) =>
            setTomorrowPlan((p) =>
              p.map((r, idx) => (idx === i ? { ...r, qty: v } : r))
            )
          }
        />
      </div>

      {/* General Remarks section with new layout */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <EditableList
          className="md:col-span-2"
          title="Events & Visits"
          items={eventsVisit}
          onAdd={addEventVisit}
          onRemove={removeEventVisit}
          onChange={setEventVisit}
          placeholder="Enter event or remark"
        />
        {/* General Remarks - new layout */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-lg flex flex-col h-full">
          <div className="grid grid-cols-2 gap-3">
            {/* General Remarks textarea spanning two columns */}
            <div className="col-span-2">
              <h2 className="text-lg font-semibold mb-3">General Remarks</h2>
              <textarea
                rows={4}
                value={generalRemark}
                onChange={(e) => setGeneralRemark(e.target.value)}
                className="w-full bg-transparent border border-gray-600 rounded px-3 py-2 outline-none resize-y text-gray-100"
                placeholder="Enter general remarks"
              />
            </div>
            {/* Prepared By and Distribute side by side */}
            <div>
              <label className="block text-sm text-gray-300 mb-1 mt-4">
                Prepared By
              </label>
              <input
                type="text"
                value={preparedBy}
                onChange={(e) => setPreparedBy(e.target.value)}
                className="w-full bg-transparent border-b border-gray-600 outline-none text-gray-100"
                placeholder="Prepared By"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1 mt-4">
                Distribute
              </label>
              <EditableList
                title=""
                items={distribute}
                onAdd={addDistributor}
                onRemove={removeDistributor}
                onChange={setDistributor}
                placeholder="Add recipient"
                className="p-0 border-0 shadow-none bg-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-60"></div>
          <div className="relative bg-gray-800 text-white rounded-lg p-6 w-11/12 max-w-md z-10 shadow-lg border border-gray-700">
            <h3 className="text-lg font-semibold mb-2">Confirm Submit</h3>
            <p className="mb-4 text-sm text-gray-300">Are you sure you want to submit the DPR? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={cancelSubmit} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-sm">Cancel</button>
              <button onClick={confirmSubmit} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold">{submitting ? 'Submitting...' : 'Submit'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => navigate(`/dashboard/project-description/${projectId}/${dprId}`)}
          className="px-5 py-2 rounded bg-gray-700 hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className={`px-5 py-2 rounded font-semibold hover:cursor-pointer ${saving
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
            }`}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={openSubmitModal}
          disabled={submitting}
          className={`px-5 py-2 rounded font-semibold hover:cursor-pointer ${submitting
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
            }`}
        >
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </div>
    </div>
  );
}

export default DprUpdateSubmit;

function EditableTable4({
  title,
  rows,
  onAdd,
  onRemove,
  onChangeItem,
  onChangeRemarks,
  onChangeUnit,
  onChangeQty,
}) {
  const UNIT_OPTIONS_LOCAL = ["No", "Rmt", "Sqm", "Cum", "Rft", "Sft", "Cft", "MT", "Kg", "Lit", "Day", "Each", "LS", "Shift", "Month", "Hrs"];
  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button
          type="button"
          onClick={onAdd}
          className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600"
        >
          + Add Row
        </button>
      </div>
      <table className="w-full text-sm border-separate border-spacing-y-2">
        <thead className="text-gray-300 border-b border-gray-600">
          <tr>
            <th className="py-2 pl-2 text-left w-[35%]">Item</th>
            <th className="py-2 pl-2 text-left w-[35%]">Remarks</th>
            <th className="py-2 pl-2 text-left w-[10%]">Unit</th>
            <th className="py-2 pl-2 text-left w-[20%]">Qty</th>
            <th></th>
          </tr>
        </thead>
        <tbody className="text-white">
          {rows.length ? (
            rows.map((r, idx) => (
              <tr key={r.id}>
                <td className="px-3 py-2 w-[35%]">
                  <input
                    type="text"
                    value={r.item}
                    onChange={(e) => onChangeItem(idx, e.target.value)}
                    className="w-full bg-transparent border-b border-gray-600 outline-none"
                    placeholder="Item"
                  />
                </td>
                <td className="px-3 py-2 w-[35%]">
                  <input
                    type="text"
                    value={r.remarks}
                    onChange={(e) => onChangeRemarks(idx, e.target.value)}
                    className="w-full bg-transparent border-b border-gray-600 outline-none"
                    placeholder="Remarks"
                  />
                </td>
                <td className="px-3 py-2 w-[10%] text-left">
                  <select
                    value={r.unit}
                    onChange={(e) => onChangeUnit(idx, e.target.value)}
                    className="w-full text-left bg-transparent border-b border-gray-600 outline-none"
                  >
                    <option value="">Select</option>
                    {UNIT_OPTIONS_LOCAL.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2 w-[20%] text-left">
                  <input
                    type="text"
                    value={r.qty}
                    onChange={(e) => onChangeQty(idx, e.target.value)}
                    className="w-full bg-transparent border-b border-gray-600 outline-none text-left"
                    placeholder="Qty"
                  />
                </td>
                <td className="py-2 text-right">
                  <button
                    type="button"
                    onClick={() => onRemove(idx)}
                    className="text-red-400 hover:text-red-500 hover:cursor-pointer"
                    title="Delete row"
                  >
                    <span className="material-icons text-md">delete</span>
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="text-gray-500 italic py-4" colSpan={5}>
                No rows yet. Use “+ Add Row”.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}