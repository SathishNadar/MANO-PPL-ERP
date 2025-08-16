// ====================== DEBUGGING HELPERS ======================
function debugLog(message, data) {
  // console.log(`[DEBUG] ${message}`, data);
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

// ====================== DATA TRANSFORMATION ======================
function transformApiData(apiData) {
    debugLog("Transforming API Data", apiData);
    
    // Convert API data structure to match what our HTML expects
    const transformed = {
        // Project Information - now using projectDetails
        project_name: apiData.projectDetails?.project_name || apiData.project_name || "Project Name Not Available",
        Employer: apiData.projectDetails?.Employer || apiData.Employer || "Employer Not Available",
        contract_no: apiData.projectDetails?.contract_no || apiData.contract_no || "--",
        location: apiData.projectDetails?.location || apiData.location || "Location Not Available",
        start_date: apiData.projectDetails?.start_date 
            ? new Date(apiData.projectDetails.start_date).toLocaleDateString('en-GB') 
            : (apiData.start_date ? new Date(apiData.start_date).toLocaleDateString('en-GB') : "--"),
        end_date: apiData.projectDetails?.end_date 
            ? new Date(apiData.projectDetails.end_date).toLocaleDateString('en-GB') 
            : (apiData.end_date ? new Date(apiData.end_date).toLocaleDateString('en-GB') : "--"),
        total_days: calculateTotalDays(
            apiData.projectDetails?.start_date || apiData.start_date, 
            apiData.projectDetails?.end_date || apiData.end_date
        ),
        days_remaining: calculateDaysRemaining(apiData.projectDetails?.end_date || apiData.end_date),
        report_date: apiData.report_date ? new Date(apiData.report_date).toLocaleDateString('en-GB') : "--",
        
        // Site Conditions
        site_conditions: {
            normal_day: !apiData.site_condition?.is_rainy,
            rainy_day: apiData.site_condition?.is_rainy || false,
            slushy_day: apiData.site_condition?.ground_state === "slushy",
            dry_day: apiData.site_condition?.ground_state === "dry",
            time_slots: apiData.site_condition?.rain_timing || []
        },
        
        // Labour Report
        labour_data: formatLabourData(apiData.labour_report, apiData.cumulative_manpower),
        
        // Progress Data
        today_progress: formatProgressData(apiData.today_prog),
        tomorrow_planning: formatProgressData(apiData.tomorrow_plan),
        
        // Events and Remarks
        events_remarks: apiData.report_footer?.events_visit || [],
        general_remarks: apiData.report_footer?.bottom_remarks || ["--"],
        
        // Signatures
        prepared_by: apiData.report_footer?.prepared_by || "MANO PCPL",
        approved_by: apiData.report_footer?.distribute?.join(", ") || "GOYAL"
    };
    
    debugLog("Final Transformed Data", transformed);
    return transformed;
}

// ====================== DATA FORMATTING HELPERS ======================
function formatLabourData(labourReport, cumulativeManpower = 0) {
    debugLog("Formatting Labour Data", labourReport);
    
    if (!labourReport) {
        debugLog("No labour report data found");
        return { headers: [], tableData: [], cumulative_manpower: cumulativeManpower };
    }

    const laborTypes = Object.keys(labourReport).filter(key => 
        key !== 'agency' && 
        key !== 'remarks' && 
        key !== 'k' && 
        key !== 'ok' &&
        Array.isArray(labourReport[key])
    );
    
    debugLog("Detected Labor Types", laborTypes);

    const headers = ['Agency Name', ...laborTypes, 'Total', 'Remarks'];
    debugLog("Generated Headers", headers);

    const tableData = [];
    const maxLength = Math.max(
        labourReport.agency?.length || 0,
        ...laborTypes.map(type => labourReport[type]?.length || 0)
    );
    
    debugLog("Max Rows to Process", maxLength);

    for (let i = 0; i < maxLength; i++) {
        const row = [];
        let total = 0;

        const agency = labourReport.agency?.[i] || "--";
        row.push(agency);

        laborTypes.forEach(type => {
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
        cumulative_manpower: cumulativeManpower 
    };
}

function formatProgressData(progressData) {
    if (!progressData) return [["--", "--"]];
    
    const result = [];
    const maxLength = Math.max(
        progressData.progress?.length || 0,
        progressData.plan?.length || 0,
        progressData.qty?.length || 0
    );
    
    for (let i = 0; i < maxLength; i++) {
        const task = progressData.progress?.[i] || progressData.plan?.[i] || "--";
        const qty = progressData.qty?.[i] || "--";
        result.push([task, qty]);
    }
    
    return result.length > 0 ? result : [["--", "--"]];
}

function calculateTotalDays(startDate, endDate) {
    if (!startDate || !endDate) return "--";
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

function calculateDaysRemaining(endDate) {
    if (!endDate) return "--";
    const end = new Date(endDate);
    const today = new Date();
    const diff = Math.round((end - today) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
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
  document.getElementById("project_code").textContent = data.project_code || "--";
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

  const daysRemainingElement = document.querySelector(".balance-right");
  if (daysRemainingElement) {
    daysRemainingElement.textContent = data.days_remaining || "--";
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
            .map(slot => {
                const [from, to] = slot.split('-');
                return `
                    <div class="time-slot">
                        <span>From: ${from || "--"}</span>
                        <span>To: ${to || "--"}</span>
                    </div>
                `;
            })
            .join('');
    }
}

function populateLabourReport(labourData) {
    debugLog("Populating Labour Report", labourData);
    
    if (!labourData || !labourData.headers || !labourData.tableData) {
        debugLog("Invalid labour data received", labourData);
        return;
    }
    
    const table = document.getElementById('displayTable');
    if (!table) {
        debugLog("Labour table element not found");
        return;
    }
    
    const tbody = table.querySelector('tbody') || table.createTBody();
    tbody.innerHTML = '';
    
    const headerRow = document.createElement('tr');
    labourData.headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header.toUpperCase();
        headerRow.appendChild(th);
    });
    tbody.appendChild(headerRow);
    
    labourData.tableData.forEach((row, index) => {
        const tr = document.createElement('tr');
        row.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    
    if (labourData.cumulative_manpower) {
        let todayTotal = 0;
        labourData.tableData.forEach(row => {
            const totalCell = row[labourData.headers.length - 2];
            const total = parseInt(totalCell) || 0;
            todayTotal += total;
        });

        const cumulativeToday = parseInt(labourData.cumulative_manpower) || 0;
        const cumulativeYesterday = cumulativeToday - todayTotal;

        const cumulativeYesterdayEl = document.getElementById('cumulative-manpower-untill-yesterday');
        if (cumulativeYesterdayEl) {
            cumulativeYesterdayEl.textContent = cumulativeYesterday.toString();
        }

        const cumulativeTodayEl = document.getElementById('cumulative-manpower-4');
        if (cumulativeTodayEl) {
            cumulativeTodayEl.textContent = cumulativeToday.toString();
        }
    }
}

function populateProgressTables(data) {
    const todayProgress = data.today_progress || [];
    const tomorrowPlanning = data.tomorrow_planning || [];

    const maxRows = Math.max(todayProgress.length, tomorrowPlanning.length);

    const todayTable = document.getElementById('today-table');
    const tomorrowTable = document.getElementById('tomorrow-table');

    if (todayTable) {
        const tbody = todayTable.querySelector('tbody') || todayTable.createTBody();
        tbody.innerHTML = '';

        // Header
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = `<th style="text-align: center;">Task</th><th>Quantity</th>`;
        tbody.appendChild(headerRow);

        // Data rows
        for (let i = 0; i < maxRows; i++) {
            const rowData = todayProgress[i] || ["--", "--"];
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="text-align: left;">${rowData[0]}</td>
                <td style="text-align: center;">${rowData[1]}</td>
            `;
            tbody.appendChild(tr);
        }
    }

    if (tomorrowTable) {
        const tbody = tomorrowTable.querySelector('tbody') || tomorrowTable.createTBody();
        tbody.innerHTML = '';

        // Header
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = `<th style="text-align: center;">Task</th><th>Quantity</th>`;
        tbody.appendChild(headerRow);

        // Data rows
        for (let i = 0; i < maxRows; i++) {
            const rowData = tomorrowPlanning[i] || ["--", "--"];
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="text-align: left;">${rowData[0]}</td>
                <td style="text-align: center;">${rowData[1]}</td>
            `;
            tbody.appendChild(tr);
        }
    }
}


function populateRemarksAndEvents(data) {
    debugLog("Populating Remarks and Events", data);
    
    const eventsContainer = document.querySelector('.events-container');
    if (eventsContainer) {
        eventsContainer.innerHTML = '';
        const events = data.events_remarks || [];
        const minEvents = 6;
        
        for (let i = 0; i < Math.max(events.length, minEvents); i++) {
            const div = document.createElement('div');
            div.className = 'events-content';
            div.textContent = events[i] || "--";
            eventsContainer.appendChild(div);
        }
    }
    
    const remarksContainer = document.querySelector('.remarks-content-container');
    if (remarksContainer) {
        remarksContainer.innerHTML = '';
        
        const remarks = data.general_remarks || [];
        const minRemarks = 3;
        
        for (let i = 0; i < Math.max(remarks.length, minRemarks); i++) {
            const div = document.createElement('div');
            div.className = 'remarks-content';
            div.textContent = remarks[i] || "--";
            remarksContainer.appendChild(div);
        }
    }
    
    if (data.prepared_by) {
        document.getElementById('prepared-by').textContent = data.prepared_by;
    }
    if (data.approved_by) {
        document.getElementById('distribution').textContent = data.approved_by;
    }
}

// ====================== HELPER FUNCTIONS ======================
function setCheckboxState(elementId, isActive) {
  const element = document.getElementById(elementId);
  if (element) {
    if (isActive) {
      element.style.backgroundColor = "green";
      element.textContent = "✓";
      element.style.color = "white";
    } else {
      element.style.backgroundColor = "";
      element.textContent = "";
    }
  }
}
