import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ToastContainer,toast } from "react-toastify";
import "./DprFetchViewer.css";

const DprFetchViewer = () => {
  const navigate = useNavigate();
  const API_URI = import.meta.env.VITE_API_URI;
  const PORT = import.meta.env.VITE_BACKEND_PORT;

  const { projectId, dprId } = useParams();
  const [projectData, setProjectData] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [dprData, setDprData] = useState(null);
  let projectStart = null;
  let projectEnd = null;

  const fetchandUpdateProjectData = async () => {
    const pid = projectId;

    try {
      const response = await fetch(
        `http://${API_URI}:${PORT}/project/getProject/${pid}`,
        {
          credentials: "include",
        }
      );
      const { data: static_data } = await response.json();
      setProjectData(static_data);
      // console.log(static_data);
      const setText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text || "--";
      };

      setText("project_name", static_data.project_name);
      setText("Employer", static_data.Employer);
      setText("project_code", static_data.project_code);
      setText("location", static_data.location);

      const formatDate = (dateStr) =>
        new Date(dateStr).toLocaleDateString("en-GB");

      if (static_data.start_date) {
        projectStart = new Date(static_data.start_date);
        setText("start_date", formatDate(projectStart));
      }

      if (static_data.end_date) {
        projectEnd = new Date(static_data.end_date);
        setText("end_date", formatDate(projectEnd));
      }
    } catch (error) {
      console.error("Failed to fetch project data:", error);
    }
  };

  const fetchandUpdateDprdata = async () => {
    //#region Helper Functions
    const renderTable = (tableId, tasks = [], quantities = []) => {
      const table = document.getElementById(tableId);
      if (!table) return;
      table.innerHTML =
        tasks
          ?.map(
            (task, i) => `
        <tr class=" bg-gray-700 rounded">
          <td class=" py-2 pl-4 text-left">${task || "--"}</td>
          <td class="text-center">${quantities?.[i] ?? "--"}</td>
        </tr>
      `
          )
          .join("") || "";
    };

    const renderList = (containerId, items = []) => {
      const container = document.getElementById(containerId);
      if (!container) return;

      const arr = Array.isArray(items) ? items : [items];
      container.innerHTML = arr
        .map((item) => `<div class="remarks-item">${item || "--"}</div>`)
        .join("");
    };

    const capitalize = (str) =>
      typeof str === "string"
        ? str.charAt(0).toUpperCase() + str.slice(1)
        : str;

    function generateTable(data) {
      const tableHead = document.getElementById("dpr-data-head");
      const tableBody = document.getElementById("dpr-data");
      const table = tableHead?.closest("table");

      if (!data || typeof data !== "object") return;

      const headerLabels = {
        agency: "Agency",
        remarks: "Remarks",
        total: "Total",
      };
      const allKeys = Object.keys(data);
      const middleCols = allKeys.filter(
        (k) => k !== "agency" && k !== "remarks"
      );
      const finalCols = ["agency", ...middleCols, "total", "remarks"];

      // table spacing
      if (table) {
        const colCount = finalCols.length;
        if (colCount > 8) {
          table.classList.add("table-tight");
          table.classList.remove("table-spacious");
        } else {
          table.classList.add("table-spacious");
          table.classList.remove("table-tight");
        }
      }

      // header
      tableHead.innerHTML = finalCols
        .map(
          (key) =>
            `<th class="px-2 py-2">${headerLabels[key] || capitalize(key)}</th>`
        )
        .join("");

      // init totals
      const colTotals = {};
      finalCols.forEach((col) => (colTotals[col] = 0));

      // row count
      const firstAvailableKey = finalCols.find((key) =>
        Array.isArray(data[key])
      );
      const rowCount = firstAvailableKey ? data[firstAvailableKey].length : 0;

      let rowsHTML = "";

      for (let i = 0; i < rowCount; i++) {
        let total = 0;
        const rowCells = finalCols
          .map((key) => {
            if (key === "total") {
              colTotals[key] += total;
              return `<td class="px-2 py-1">${total}</td>`;
            } else if (key === "agency" || key === "remarks") {
              return `<td class="px-2 py-1">${data[key]?.[i] || ""}</td>`;
            } else {
              const val = data[key]?.[i] ?? 0;
              if (typeof val === "number") {
                total += val;
                colTotals[key] += val;
              }
              return `<td class="px-2 py-1">${val}</td>`;
            }
          })
          .join("");
        rowsHTML += `<tr>${rowCells}</tr>`;
      }

      // totals row
      const totalsRow = finalCols
        .map((key) => {
          if (key === "agency") return `<td class="font-bold">Total</td>`;
          if (key === "remarks") return `<td></td>`;
          if (key === "total")
            return `<td class="font-bold">${colTotals[key] || 0}</td>`;
          return `<td>${colTotals[key] || 0}</td>`;
        })
        .join("");

      tableBody.innerHTML = rowsHTML + `<tr>${totalsRow}</tr>`;
    }

    const createLabourRow = (labour_report, i) => {
      let total = 0;
      const cols = Object.keys(labour_report).filter(
        (k) => k !== "agency" && k !== "remarks"
      );
      const cells = [
        `<td>${labour_report.agency?.[i] || ""}</td>`,
        ...cols.map((col) => {
          const val = labour_report[col]?.[i] ?? 0;
          if (typeof val === "number") total += val;
          return `<td>${val}</td>`;
        }),
        `<td>${total}</td>`,
        `<td>${labour_report.remarks?.[i] || ""}</td>`,
      ];
      return { html: `<tr>${cells.join("")}</tr>`, total };
    };

    const renderSiteConditions = (site_condition) => {
      const { is_rainy, ground_state, rain_timing = [] } = site_condition || {};
      const setActive = (id, active) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.toggle("underline", active);
        el.classList.toggle("decoration-green-400", active);
        el.classList.toggle("decoration-2", active); // thickness
        el.classList.toggle("underline-offset-4", active); // gap between icon and underline
      };

      setActive("normal-day", !is_rainy);
      setActive("rainy-day", is_rainy);
      setActive("slushy-day", ground_state === "slushy");
      setActive("dry-day", ground_state === "dry");

      const container = document.getElementById("from-to-container");
      if (container) {
        container.innerHTML = rain_timing.length
          ? rain_timing
              .map((t) => {
                const [from, to] = t.split("-");
                return `<span class="inline-block bg-gray-700 rounded px-2 py-0.5 mr-1 mb-1 text-xs">${from}–${to}</span>`;
              })
              .join("")
          : "—";
      }
    };

    //#endregion

    try {
      const response = await fetch(
        `http://${API_URI}:${PORT}/report/getDPR/${dprId}`,
        { credentials: "include" }
      );
      const { data } = await response.json();
      setDprData(data);

      if (data?.created_at && projectStart && projectEnd) {
        const DAY = 1000 * 60 * 60 * 24;

        const created = new Date(data.report_date);
        const totalDays = Math.floor((projectEnd - projectStart) / DAY);

        let elapsedDays = Math.floor((created - projectStart) / DAY);
        if (elapsedDays < 0) elapsedDays = 0;
        if (elapsedDays > totalDays) elapsedDays = totalDays;

        const remainingDays = totalDays - elapsedDays;

        document.getElementById("elapsed_days").textContent = elapsedDays;
        document.getElementById("days_left").textContent = remainingDays;
      }

      //Site-Contditions
      renderSiteConditions(data.site_condition);
      // LABOUR REPORT TABLE
      const labour_report = data.labour_report || {};
      generateTable(labour_report);

      let totalmanpower = 0;
      let labourRowsHTML = "";
      const rowCount = labour_report.agency?.length || 0;
      // console.log(data);
      for (let i = 0; i < rowCount; i++) {
        const { html, total } = createLabourRow(labour_report, i);
        labourRowsHTML += html;
        totalmanpower += total;
      }

      const yesterdayCumulative = parseInt(data.cumulative_manpower);
      // const yesterdayCumulative = totalCumulative - totalmanpower;
      document.getElementById("cumulative-manpower").textContent =
        yesterdayCumulative.toLocaleString();

      // TODAY / TOMORROW TABLES
      renderTable(
        "today-table",
        data.today_prog?.progress,
        data.today_prog?.qty
      );
      renderTable(
        "tomorrow-table",
        data.tomorrow_plan?.plan,
        data.tomorrow_plan?.qty
      );

      // EVENTS & REMARKS
      renderList("events-container", data.events_remarks);
      renderList(
        "remarks-content-container",
        data.report_footer?.bottom_remarks
      );

      // FOOTER DETAILS
      document.getElementById("prepared-by").textContent =
        data.report_footer?.prepared_by || "--";
      document.getElementById("distribution").textContent =
        data.report_footer?.distribute?.join(", ") || "--";

      // Date formatting
      const formatDate = (dateStr) =>
        new Date(dateStr || Date.now()).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      document.getElementById("report_date").textContent = formatDate(
        data.report_date
      );
    } catch (error) {
      console.error("error hai dosto", error);
    }
  };

  useEffect(() => {
    fetchandUpdateDprdata();
    fetchandUpdateProjectData();
  }, []);

  const loadPdf = () => {
    localStorage.setItem("dprData", JSON.stringify(dprData));
    localStorage.setItem("projectData", JSON.stringify(projectData));

    // debugging purposes
    // window.open("/pdf-static/dpr1-pdf.html", "_blank");

    const pdfFrame = document.getElementById("pdfPreviewFrame");
    const pdfContainer = document.getElementById("pdfPreviewContainer");

    pdfFrame.src = "/pdf-static/dpr1-pdf.html";

    pdfContainer.style.display = "flex";

    pdfFrame.onload = function () {
      setTimeout(() => {
        if (pdfFrame.contentWindow) {
          pdfFrame.contentWindow.focus();
          pdfFrame.contentWindow.print();
        }
      }, 500);
    };
  };

  // Submit
  const SubmitDPR = async () => {
    const confirmSubmit = window.confirm(
      "Are you sure you want to submit the DPR? This action cannot be undone."
    );

    if (!confirmSubmit) return;

    try {
      setSubmitting(true);

      const response = await fetch(
        `http://${API_URI}:${PORT}/report/submit/${dprId}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Request failed");
      }

      toast.success("Success:", await response.json());
    } catch (error) {
      toast.error("Error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-900 text-white font-sans min-h-screen p-6">
      <ToastContainer></ToastContainer>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-700 pb-4">
          <h1 className="text-3xl font-bold">Daily Progress Report</h1>
          <div className="bg-gray-800 px-4 py-2 rounded text-sm text-gray-300">
            Report Date: <span id="report_date">--</span>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Project Info */}
          <div className="bg-gray-800 rounded-xl p-6 space-y-2 col-span-2">
            <h2 className="text-xl font-semibold mb-4">Project Information</h2>

            <div className="grid grid-cols-2 gap-2 text-base">
              <p>
                <span className="text-gray-400">Name of Work:</span>{" "}
                <strong id="project_name"></strong>
              </p>
              <p>
                <span className="text-gray-400">Employer:</span>{" "}
                <strong id="Employer"></strong>
              </p>
              <p>
                <span className="text-gray-400">Project Code:</span>{" "}
                <strong id="project_code"></strong>
              </p>
              <p>
                <span className="text-gray-400">Location:</span>{" "}
                <strong id="location"></strong>
              </p>
            </div>

            <div className="flex justify-between mt-4 text-sm">
              <div className="relative left-10">
                <div className="text-gray-400 relative left-12 top-1 bottom-0.5">
                  Elapsed days
                </div>
                <div className="text-2xl font-bold flex items-center justify-center gap-2">
                  <span className="material-icons bg-white rounded-full text-black text-3xl flex items-center justify-center w-10 h-10 relative top-1">
                    calendar_today
                  </span>
                  <span id="elapsed_days"></span>
                  <span className="text-xl font-normal">days</span>
                </div>
                <div className="text-gray-400 relative left-12 bottom-0.5">
                  Start: <span id="start_date"></span>
                </div>
              </div>

              <div className="relative right-40">
                <div className="text-gray-400 relative left-12 top-1 bottom-0.5">
                  Remaining days
                </div>
                <div className="text-2xl font-bold flex items-center justify-center gap-2">
                  <span className="material-icons bg-white rounded-full text-black text-3xl flex items-center justify-center w-10 h-10 relative top-1">
                    calendar_today
                  </span>
                  <span id="days_left"></span>
                  <span className="text-xl font-normal">days</span>
                </div>
                <div className="text-gray-400 relative left-12 bottom-0.5">
                  End: <span id="end_date"></span>
                </div>
              </div>
            </div>
          </div>

          {/* Site Conditions */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Site Conditions</h2>
            <div className="flex justify-around text-xs text-gray-300">
              <div id="normal-day" className="text-center condition-icon">
                <span className="material-icons text-yellow-400">wb_sunny</span>
                <p>Normal Day</p>
              </div>
              <div id="rainy-day" className="text-center condition-icon">
                <span className="material-icons text-blue-400">umbrella</span>
                <p>Rainy Day</p>
              </div>
              <div id="slushy-day" className="text-center condition-icon">
                <span className="material-icons text-indigo-300">ac_unit</span>
                <p>Slushy</p>
              </div>
              <div id="dry-day" className="text-center condition-icon">
                <span className="material-icons text-gray-300">cloud</span>
                <p>Dry</p>
              </div>
            </div>
            <p className="text-[18px] text-center text-white mt-4">
              Time Slots:
              <span className="mt-1 grid">
                <span
                  className="[display:contents]"
                  id="from-to-container"
                ></span>
              </span>
            </p>
          </div>
        </div>

        {/* Labour Report */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Labour Report</h2>
          <div className="overflow-x-auto">
            <table className="table-auto w-full text-sm text-left">
              <thead
                id="dpr-data-head"
                className="text-gray-300 border-b border-gray-600"
              >
                <tr>
                  <th className="px-2 py-2">Agency</th>
                </tr>
              </thead>
              <tbody className="text-white" id="dpr-data">
                {/* Add rows dynamically or statically here */}
              </tbody>
            </table>
          </div>
          <div className="text-sm text-gray-400 mt-2">
            Cumulative Manpower (until yesterday):{" "}
            <span id="cumulative-manpower">--</span>
          </div>
        </div>

        {/* Progress & Planning */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gray-800 rounded-xl p-4">
            <h2 className="text-lg font-semibold mb-2">
              <span className="material-icons mr-2 relative top-1.5">
                assignment
              </span>
              Today's Progress
            </h2>
            <table className="w-full text-sm border-separate border-spacing-y-2">
              <thead className="text-gray-300 border-b border-gray-600">
                <tr>
                  <th className="py-2 pl-4 text-left text-[16px]">Task</th>
                  <th className="text-center text-[16px]">Quantity</th>
                </tr>
              </thead>
              <tbody className="text-white" id="today-table">
                {/* Add today's progress data */}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-800 rounded-xl p-4">
            <h2 className="text-lg font-semibold mb-2">
              {" "}
              <span className="material-icons mr-2 relative top-1.5">
                assignment
              </span>
              Tomorrow's Planning
            </h2>
            <table className="w-full text-sm border-separate border-spacing-y-2">
              <thead className="text-gray-300 border-b border-gray-600">
                <tr>
                  <th className="py-2 pl-4 text-left ">Task</th>
                  <th className="text-center text-[16px]">Quantity</th>
                </tr>
              </thead>
              <tbody className="text-white" id="tomorrow-table">
                {/* Add tomorrow's plan data */}
              </tbody>
            </table>
          </div>
        </div>

        {/* Remarks Section */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-gray-800 rounded-xl p-4">
            <h2 className="text-lg font-semibold mb-2">Events & Remarks</h2>
            <div
              className="space-y-2 text-l text-gray-300"
              id="events-container"
            >
              {/* Add event entries */}
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4">
            <h2 className="text-lg font-semibold mb-2">General Remarks</h2>
            <div
              className="space-y-2 text-sm text-gray-300"
              id="remarks-content-container"
            >
              {/* Add general remarks */}
            </div>
            <div className="mt-4 border-t border-gray-600 pt-4 flex justify-between text-xs text-gray-400">
              <div className="text-center">
                <div>Prepared By</div>
                <div id="prepared-by" className="mt-1 font-semibold text-white">
                  MANO PCPL
                </div>
              </div>
              <div className="text-center">
                <div>Distrubuters</div>
                <div
                  id="distribution"
                  className="mt-1 font-semibold text-white"
                >
                  GOYAL
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Button Section */}
        <div className="flex justify-end gap-4 pt-6">
          <button
            onClick={() => loadPdf()}
            className="bg-blue-500 hover:bg-blue-600 cursor-pointer text-white px-4 py-2 rounded"
          >
            Print PDF
          </button>
          <button
            onClick={() =>
              navigate(
                `/dashboard/project-description/dprUpdate/${projectId}/${dprId}`
              )
            }
            className="bg-blue-500 hover:bg-blue-600 cursor-pointer text-white px-4 py-2 rounded"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={SubmitDPR}
            disabled={submitting}
            className={`px-5 py-2 rounded font-semibold hover:cursor-pointer ${
              submitting
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>

        <div className="mt-5 border border-gray-300 p-3 invisible">
          <div
            id="pdfPreviewContainer"
            className="w-full h-[80vh] flex-col hidden"
          >
            <iframe
              id="pdfPreviewFrame"
              className="flex-grow border-0 w-full min-h-[700px]"
              title="PDF Preview"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DprFetchViewer;
