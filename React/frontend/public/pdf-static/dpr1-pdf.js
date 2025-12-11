// ====================== DEBUGGING HELPERS ======================
function debugLog(message, data) {
  // console.log(`[DEBUG] ${message}`, data);
}

// Universal date parser that handles multiple formats
function parseDateSafe(dateStr) {
  if (!dateStr || dateStr === "--") return new Date(NaN);

  // If it's in API format (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + "T00:00:00");
  }

  // If it's in displayed format (DD/MM/YYYY)
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
    const parts = dateStr.split("/");
    return new Date(
      parseInt(parts[2]),
      parseInt(parts[1]) - 1,
      parseInt(parts[0])
    );
  }

  // If it's a Date object string
  if (typeof dateStr === "string" && dateStr.includes("T")) {
    return new Date(dateStr);
  }

  // Fallback to Date constructor
  return new Date(dateStr);
}

// ====================== MAIN DATA LOADER ======================
document.addEventListener("DOMContentLoaded", async () => {
  try {
    debugLog("DOM fully loaded, starting data load");

    // Fetch both JSON files in parallel
    const dprData = JSON.parse(localStorage.getItem("dprData"));
    const projectData = JSON.parse(localStorage.getItem("projectData"));

    debugLog("Loaded DPR Data", dprData);
    debugLog("Loaded Project Data", projectData);

    // Merge project data with DPR data
    const mergedData = {
      ...dprData,
      projectDetails: projectData,
    };

    // Transform the merged data
    const transformedData = transformApiData(mergedData);
    debugLog("Transformed Data", transformedData);

    // Populate the data
    populateAllData(transformedData);
  } catch (error) {
    console.error("Error loading data:", error);
    showErrorState("Failed to load data");
  }
});

// ====================== FIXED DATE CALCULATIONS ======================
function calculateTotalDays(startDate, endDate) {
  if (!startDate || !endDate) return "--";

  const start = parseDateSafe(startDate);
  const end = parseDateSafe(endDate);

  if (isNaN(start) || isNaN(end)) return "--";

  // Calculate difference in days (inclusive of both start and end dates)
  const diffTime = Math.abs(end - start);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

function calculateDaysRemaining(endDate, reportDate) {
  if (!endDate || !reportDate) return "--";

  const end = parseDateSafe(endDate);
  const report = parseDateSafe(reportDate);

  if (isNaN(end) || isNaN(report)) return "--";

  // Calculate days remaining (inclusive of report date and end date)
  const diffTime = Math.abs(end - report);
  const daysRemaining = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

  return daysRemaining > 0 ? daysRemaining : 0;
}

function calculateDaysPassed(startDate, reportDate) {
  if (!startDate || !reportDate) return "--";

  const start = parseDateSafe(startDate);
  const report = parseDateSafe(reportDate);

  if (isNaN(start) || isNaN(report)) return "--";

  // Calculate days passed (inclusive of both start and report dates)
  const diffTime = Math.abs(report - start);
  const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

  return daysPassed > 0 ? daysPassed : 0;
}

// ====================== DATA TRANSFORMATION ======================
function transformApiData(apiData) {
  debugLog("Transforming API Data", apiData);

  // Calculate dates first to ensure consistency
  const startDate = apiData.projectDetails?.start_date || apiData.start_date;
  const endDate = apiData.projectDetails?.end_date || apiData.end_date;
  const reportDate = apiData.report_date;

  const totalDays = calculateTotalDays(startDate, endDate);
  const daysPassed = calculateDaysPassed(startDate, reportDate);
  const daysRemaining = calculateDaysRemaining(endDate, reportDate);

  // Convert API data structure to match what our HTML expects
  const transformed = {
    // Project Information - now using projectDetails
    project_name:
      apiData.projectDetails?.project_name ||
      apiData.project_name ||
      "Project Name Not Available",
    Employer:
      apiData.projectDetails?.Employer ||
      apiData.Employer ||
      "Employer Not Available",
    contract_no:
      apiData.projectDetails?.contract_no || apiData.contract_no || "--",
    location:
      apiData.projectDetails?.location ||
      apiData.location ||
      "Location Not Available",
    start_date: startDate
      ? new Date(startDate).toLocaleDateString("en-GB")
      : "--",
    end_date: endDate ? new Date(endDate).toLocaleDateString("en-GB") : "--",
    total_days: totalDays,
    days_passed: daysPassed,
    days_remaining: daysRemaining,
    report_date: reportDate
      ? new Date(reportDate).toLocaleDateString("en-GB")
      : "--",

    // Site Conditions
    site_conditions: {
      normal_day: !apiData.site_condition?.is_rainy,
      rainy_day: apiData.site_condition?.is_rainy || false,
      slushy_day: apiData.site_condition?.ground_state === "slushy",
      dry_day: apiData.site_condition?.ground_state === "dry",
      time_slots: apiData.site_condition?.rain_timing || [],
    },

    // Labour Report
    labour_data: formatLabourData(
      apiData.labour_report,
      apiData.cumulative_manpower
    ),

    // Progress Data - FIXED: Consistent key mapping
    today_progress: formatProgressData(apiData.today_prog, "today"),
    tomorrow_planning: formatProgressData(apiData.tomorrow_plan, "tomorrow"),

    // Events and Remarks - get from report_footer
    events_visit: apiData.report_footer?.events_visit || [],
    bottom_remarks: apiData.report_footer?.bottom_remarks,

    // Signatures
    prepared_by:
      apiData.report_footer?.prepared_by || "Mano Private Consulation Ltd.",
    approved_by: apiData.report_footer?.distribute
      ? {
          reported_by: apiData.report_footer.distribute["reported-by"] || "",
          approved_by: apiData.report_footer.distribute["approved-by"] || "",
          final_approved:
            apiData.report_footer.distribute["final-approval"] || "",
        }
      : null,

    // Keep report_footer for reference
    report_footer: apiData.report_footer || {},
  };

  debugLog("Final Transformed Data", transformed);
  return transformed;
}

// ====================== DATA FORMATTING HELPERS ======================
function formatLabourData(labourReport, cumulativeManpower = 0) {
  debugLog("Formatting Labour Data", labourReport);

  if (!labourReport) {
    debugLog("No labour report data found");
    return {
      headers: [],
      tableData: [],
      cumulative_manpower: cumulativeManpower,
    };
  }

  const laborTypes = Object.keys(labourReport).filter(
    (key) =>
      key !== "agency" &&
      key !== "remarks" &&
      key !== "k" &&
      key !== "ok" &&
      Array.isArray(labourReport[key])
  );

  debugLog("Detected Labor Types", laborTypes);

  const headers = ["Agency Name", ...laborTypes, "Total", "Remarks"];
  debugLog("Generated Headers", headers);

  const tableData = [];
  const maxLength = Math.max(
    labourReport.agency?.length || 0,
    ...laborTypes.map((type) => labourReport[type]?.length || 0)
  );

  debugLog("Max Rows to Process", maxLength);

  for (let i = 0; i < maxLength; i++) {
    const row = [];
    let total = 0;

    const agency = labourReport.agency?.[i] || "--";
    row.push(agency);

    laborTypes.forEach((type) => {
      const count = parseInt(labourReport[type]?.[i]) || 0;
      row.push(count.toString());
      total += count;
    });

    row.push(total.toString());

    let remark = "";
    if (Array.isArray(labourReport.remarks)) {
      if (labourReport.remarks[i] !== undefined) {
        remark = labourReport.remarks[i];
      }
    } else if (labourReport.remarks !== undefined) {
      remark = labourReport.remarks;
    }
    row.push(remark);

    tableData.push(row);
    debugLog(`Processed Row ${i}`, row);
  }

  return {
    headers,
    tableData,
    cumulative_manpower: cumulativeManpower,
  };
}

// ====================== DATA FORMATTING HELPERS ======================
function normalizeProgressData(progressData) {
  if (!progressData) {
    return { items: [], remarks: [], unit: [], qty: [] };
  }

  // ✅ New API shape: array of objects
  // [ { component_name, unit, quantity, remarks }, ... ]
  if (Array.isArray(progressData)) {
    return {
      items: progressData.map((p) => p.component_name ?? p.item ?? "--"),
      remarks: progressData.map((p) => p.remarks ?? "--"),
      unit: progressData.map((p) => p.unit ?? "--"),
      qty: progressData.map((p) => p.quantity ?? p.qty ?? "--"),
    };
  }

  // ✅ Old shape already: { items, remarks, unit, qty }
  return {
    items: progressData.items || [],
    remarks: progressData.remarks || [],
    unit: progressData.unit || [],
    qty: progressData.qty || [],
  };
}

function formatProgressData(progressData, type = "today") {
  const normalized = normalizeProgressData(progressData);

  const taskArray = normalized.items;
  const remarksArray = normalized.remarks;
  const unitArray = normalized.unit;
  const quantityArray = normalized.qty;

  const result = [];

  const maxLength = Math.max(
    taskArray.length,
    remarksArray.length,
    unitArray.length,
    quantityArray.length
  );

  for (let i = 0; i < maxLength; i++) {
    const task = taskArray[i] || "--";
    const remarks = remarksArray[i] || "--";
    const unit = unitArray[i] || "--";
    const quantity = quantityArray[i] || "--";

    result.push([task, remarks, unit, quantity]);
  }

  return result.length > 0 ? result : [["--", "--", "--", "--"]];
}

// ====================== DATA POPULATION ======================
function populateAllData(data) {
  debugLog("Populating all data", data);

  populateProjectInfo(data);

  if (data.site_conditions) {
    populateSiteConditions(data.site_conditions);
  }

  if (data.labour_data) {
    populateLabourReport(data.labour_data);
  }

  populateProgressTables(data);
  populateRemarksAndEvents(data);
}

function populateProjectInfo(data) {
  debugLog("Populating Project Info", data);

  document.getElementById("project_name").textContent =
    data.project_name || "--";
  document.getElementById("Employer").textContent = data.Employer || "--";
  document.getElementById("project_code").textContent =
    data.contract_no || "--";
  document.getElementById("location").textContent = data.location || "--";
  document.getElementById("start_date").textContent = data.start_date || "--";
  document.getElementById("end_date").textContent = data.end_date || "--";

  const reportDateElement = document.querySelector(
    ".daily-progress-report-table tr:nth-child(2) td:nth-child(2)"
  );
  if (reportDateElement) {
    reportDateElement.textContent = data.report_date || "--";
  }

  const totalDaysElement = document.querySelector(".total-value");
  if (totalDaysElement) {
    totalDaysElement.textContent = data.total_days || "--";
  }

  const daysRemainingElement = document.getElementById("remaining-days");
  if (daysRemainingElement) {
    daysRemainingElement.textContent = data.days_remaining || "--";
  }

  // FIXED: Days passed calculation
  if (
    data.start_date &&
    data.report_date &&
    data.start_date !== "--" &&
    data.report_date !== "--"
  ) {
    // Update days passed in HTML
    const daysPassedElement = document.getElementById("days-passed");
    if (daysPassedElement) {
      daysPassedElement.textContent =
        data.days_passed !== "--" ? data.days_passed : "--";
    }

    // Verify the calculation: total = passed + remaining
    if (
      data.total_days !== "--" &&
      data.days_passed !== "--" &&
      data.days_remaining !== "--"
    ) {
      const calculatedTotal = data.days_passed + data.days_remaining;
      debugLog("Date validation:", {
        total: data.total_days,
        passed: data.days_passed,
        remaining: data.days_remaining,
        calculatedTotal: calculatedTotal,
      });

      // If there's a discrepancy, adjust the remaining days to match
      if (calculatedTotal !== data.total_days) {
        const adjustedRemaining = data.total_days - data.days_passed;
        if (daysRemainingElement && adjustedRemaining >= 0) {
          daysRemainingElement.textContent = adjustedRemaining;
        }
      }
    }
  } else {
    // Set default values if dates are not available
    const daysPassedElement = document.getElementById("days-passed");
    if (daysPassedElement) {
      daysPassedElement.textContent = "--";
    }
  }
}

function populateSiteConditions(conditions) {
  if (!conditions) return;

  setCheckboxState("normal-day-checkbox", conditions.normal_day);
  setCheckboxState("rainy-day-checkbox", conditions.rainy_day);
  setCheckboxState("slushy-day-checkbox", conditions.slushy_day);
  setCheckboxState("dry-day-checkbox", conditions.dry_day);

  const timeSlotsContainer = document.querySelector(".from-to");
  if (timeSlotsContainer && conditions.time_slots) {
    timeSlotsContainer.innerHTML = conditions.time_slots
      .map((slot) => {
        const [from, to] = slot.split("-");
        return `
                    <div class="time-slot">
                        <span>From: ${from || "--"}</span>
                        <span>To: ${to || "--"}</span>
                    </div>
                `;
      })
      .join("");
  }
}

function populateLabourReport(labourData) {
  debugLog("Populating Labour Report", labourData);

  if (!labourData || !labourData.headers || !labourData.tableData) {
    debugLog("Invalid labour data received", labourData);
    return;
  }

  const table = document.getElementById("displayTable");
  if (!table) {
    debugLog("Labour table element not found");
    return;
  }

  const tbody = table.querySelector("tbody") || table.createTBody();
  tbody.innerHTML = "";

  const headerRow = document.createElement("tr");
  labourData.headers.forEach((header) => {
    const th = document.createElement("th");
    th.textContent = header.toUpperCase();
    headerRow.appendChild(th);
  });
  tbody.appendChild(headerRow);

  // Calculate column totals
  const columnTotals = new Array(labourData.headers.length).fill(0);
  // Skip first column (Agency Name) and last column (Remarks)
  const numericColumnsStart = 1;
  const numericColumnsEnd = labourData.headers.length - 2;

  labourData.tableData.forEach((row, index) => {
    const tr = document.createElement("tr");
    row.forEach((cell, colIndex) => {
      const td = document.createElement("td");
      td.textContent = cell;
      tr.appendChild(td);

      // Sum numeric columns (skip Agency Name and Remarks)
      if (colIndex >= numericColumnsStart && colIndex <= numericColumnsEnd) {
        const value = parseInt(cell) || 0;
        columnTotals[colIndex] += value;
      }
    });
    tbody.appendChild(tr);
  });

  // Add total row
  const totalRow = document.createElement("tr");
  totalRow.style.fontWeight = "bold";

  labourData.headers.forEach((header, colIndex) => {
    const td = document.createElement("td");

    if (colIndex === 0) {
      td.textContent = "TOTAL";
    } else if (
      colIndex >= numericColumnsStart &&
      colIndex <= numericColumnsEnd
    ) {
      td.textContent = columnTotals[colIndex].toString();
    } else if (colIndex === labourData.headers.length - 2) {
      // Total column
      // Sum of all numeric columns
      const grandTotal = columnTotals
        .slice(numericColumnsStart, numericColumnsEnd + 1)
        .reduce((sum, value) => sum + value, 0);
      td.textContent = grandTotal.toString();
    } else {
      // Remarks column
      td.textContent = "";
    }

    totalRow.appendChild(td);
  });

  tbody.appendChild(totalRow);

  // CUMULATIVE MANPOWER CALCULATION AND DISPLAY
  if (labourData.cumulative_manpower) {
    let todayTotal = 0;
    labourData.tableData.forEach((row) => {
      const totalCell = row[labourData.headers.length - 2]; // Get the "Total" column
      const total = parseInt(totalCell) || 0;
      todayTotal += total;
    });

    const cumulativeToday = parseInt(labourData.cumulative_manpower) || 0;
    const cumulativeYesterday = cumulativeToday - todayTotal;

    const cumulativeYesterdayEl = document.getElementById(
      "cumulative-manpower-untill-yesterday"
    );
    if (cumulativeYesterdayEl) {
      cumulativeYesterdayEl.textContent = cumulativeYesterday.toString();
    }

    const cumulativeTodayEl = document.getElementById("cumulative-manpower-4");
    if (cumulativeTodayEl) {
      cumulativeTodayEl.textContent = cumulativeToday.toString();
    }
  }
}

function populateProgressTables(data) {
  const todayProgress = data.today_progress || [];
  const tomorrowPlanning = data.tomorrow_planning || [];

  const FIXED_ROW_COUNT = 9; // Fixed number of rows

  // Calculate max rows needed - use fixed count, but allow dynamic expansion if data exceeds it
  const maxRows = Math.max(
    FIXED_ROW_COUNT,
    todayProgress.length,
    tomorrowPlanning.length
  );

  // Today's progress - populate 4 columns with forced widths
  const todayTbody = document.querySelector("#today-table tbody");
  if (todayTbody) {
    todayTbody.innerHTML = "";
    for (let i = 0; i < maxRows; i++) {
      const rowData = todayProgress[i] || ["--", "--", "--", "--"];
      const tr = document.createElement("tr");
      tr.innerHTML = `
                <td style="text-align: center; border: 1px solid #000; width: 50% !important; padding: 4px;">${
                  rowData[0] || "--"
                }</td>
                <td style="text-align: center; border: 1px solid #000; width: 25% !important; padding: 4px;">${
                  rowData[1] || "--"
                }</td>
                <td style="text-align: center; border: 1px solid #000; width: 12.5% !important; padding: 4px;">${
                  rowData[2] || "--"
                }</td>
                <td style="text-align: center; border: 1px solid #000; width: 12.5% !important; padding: 4px; border-right-width: 0px;">${
                  rowData[3] || "--"
                }</td>
            `;
      todayTbody.appendChild(tr);
    }
  }

  // Tomorrow's planning - populate 4 columns with forced widths
  const tomorrowTbody = document.querySelector("#tomorrow-table tbody");
  if (tomorrowTbody) {
    tomorrowTbody.innerHTML = "";
    for (let i = 0; i < maxRows; i++) {
      const rowData = tomorrowPlanning[i] || ["--", "--", "--", "--"];
      const tr = document.createElement("tr");
      tr.innerHTML = `
                <td style="text-align: center; border: 1px solid #000; width: 50% !important; padding: 4px;">${
                  rowData[0] || "--"
                }</td>
                <td style="text-align: center; border: 1px solid #000; width: 25% !important; padding: 4px;">${
                  rowData[1] || "--"
                }</td>
                <td style="text-align: center; border: 1px solid #000; width: 12.5% !important; padding: 4px;">${
                  rowData[2] || "--"
                }</td>
                <td style="text-align: center; border: 1px solid #000; width: 12.5% !important; padding: 4px; border-right: none !important;;">${
                  rowData[3] || "--"
                }</td>
            `;
      tomorrowTbody.appendChild(tr);
    }
  }
}

function populateRemarksAndEvents(data) {
  debugLog("Populating Remarks and Events", data);

  const eventsContainer = document.querySelector(".events-container");
  if (eventsContainer) {
    eventsContainer.innerHTML = "";
    // Get events from the transformed data
    const events = data.events_visit || [];
    const minEvents = 4;

    for (let i = 0; i < Math.max(events.length, minEvents); i++) {
      const div = document.createElement("div");
      div.className = "events-content";
      div.textContent = events[i] || "--";
      eventsContainer.appendChild(div);
    }
  }

  const remarksContainer = document.querySelector(".remarks-content-container");
  if (remarksContainer) {
    remarksContainer.innerHTML = "";

    // Get remarks from the transformed data
    const remarks = data.bottom_remarks || [];
    const minRemarks = 1;

    //idar aake wo  --  hataya tha maine - dp the bakra

    for (let i = 0; i < Math.max(remarks.length, minRemarks); i++) {
      const div = document.createElement("div");
      div.className = "remarks-content";
      div.textContent = remarks[i] || " ";
      remarksContainer.appendChild(div);
    }
  }

  //   if (data.prepared_by) {
  //     return;
  //     // document.getElementById('prepared-by').textContent = data.prepared_by || " Prepared - by Mano Private Consulation Ltd";
  //   }

  if (data.approved_by) {
    const distributionEl = document.getElementById("distribution");
    if (distributionEl) {
      distributionEl.innerHTML = ""; // clear old content

      const { reported_by, approved_by, final_approved } = data.approved_by;

      if (reported_by) {
        const div = document.createElement("div");
        div.textContent = `Reported by: ${reported_by}`;
        distributionEl.appendChild(div);
      }

      if (approved_by) {
        const div = document.createElement("div");
        div.textContent = `Approved by: ${approved_by}`;
        distributionEl.appendChild(div);
      }

      if (final_approved) {
        const div = document.createElement("div");
        div.textContent = `Final approved: ${final_approved}`;
        distributionEl.appendChild(div);
      }

      // Fallback if nothing is set at all
      if (!reported_by && !approved_by && !final_approved) {
        distributionEl.textContent = "--";
      }
    }
  }
}

// ====================== HELPER FUNCTIONS ======================
function setCheckboxState(elementId, isActive) {
  const element = document.getElementById(elementId);
  if (element) {
    if (isActive) {
      element.style.backgroundColor = "green";
      element.style.color = "white";
    } else {
      element.style.backgroundColor = "";
      element.textContent = "";
    }
  }
}

function showErrorState(message) {
  console.error("Error state:", message);
  // You can add error display logic here if needed
}
