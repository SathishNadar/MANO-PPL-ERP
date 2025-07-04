// ====================== MAIN DATA LOADER ======================
// Helper function to format dates (e.g., "2023-01-01" → "01/01/2023")
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch {
        return "--"; // Fallback if date is invalid
    }
}

/**
 * Fetches project data from the API and updates the DOM.
 * @param {number} projectId - The ID of the project to fetch (default: 1).
 */
async function fetchProjectData(projectId = 1) {
    try {
        const response = await fetch(`http://34.47.131.237:3000/project/getProject/${projectId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const projectData = await response.json();
        return projectData.data;
    } catch (error) {
        console.error("Error loading project data:", error);
        return null;
    }
}

    async function fetchDPRData(dprId = 45) {
        try {
            const response = await fetch(`http://34.47.131.237:3000/report/getDPR/${dprId}`);
            if (!response.ok) throw new Error('Failed to fetch DPR data');
            
            const apiData = await response.json();
            const todaysTotal = populateLabourReport(apiData.data.labour_report);
            const yesterdaysCumulative = apiData.data.cumulative_manpower - todaysTotal;

        console.log("Yesterday's cumulative:", yesterdaysCumulative);
        document.getElementById('cumulative-manpower-untill-yesterday').textContent = yesterdaysCumulative || '0';
            // ADD THIS ONE LINE 
        document.getElementById('cumulative-manpower-for-today').textContent = apiData.data.cumulative_manpower || '0';
           
        const duration = getProjectDurationDays(apiData.data.start_date, apiData.data.end_date);
        document.getElementById("duration-in-days").textContent = duration;
        
        if (!apiData.success) throw new Error('API returned unsuccessful response');
            return apiData.data;
        } catch (error) {
            console.error("Error loading DPR data:", error);
            return null;
        }
    }

// ====================== DATA POPULATION ======================
function populateProjectInfo(projectData) {
    if (!projectData) return;

    // Basic project info
    if (document.getElementById("project_name")) {
        document.getElementById("project_name").textContent = projectData.project_name || "--";
    }
    if (document.getElementById("Employer")) {
        document.getElementById("Employer").textContent = projectData.Employer || "--";
    }
    if (document.getElementById("contract_no")) {
        document.getElementById("contract_no").textContent = projectData.contract_no || "--";
    }
    if (document.getElementById("location")) {
        document.getElementById("location").textContent = projectData.location || "--";
    }
    
    // Dates
    if (document.getElementById("start_date")) {
        document.getElementById("start_date").textContent = projectData.start_date ? formatDate(projectData.start_date) : "--";
    }
    if (document.getElementById("end_date")) {
        document.getElementById("end_date").textContent = projectData.end_date ? formatDate(projectData.end_date) : "--";
    }
    
    // Report date in header
    // const reportDateElement = document.querySelector(".daily-progress-report-table tr:nth-child(2) td:nth-child(2)");
    // if (reportDateElement && projectData.report_date) {
    //     reportDateElement.textContent = formatDate(projectData.report_date);
    // }
}

function populateSiteConditions(conditions) {
    if (!conditions) {
        console.error("No conditions data provided");
        return;
    }
    
    console.log("Received conditions data:", conditions);
    
    // Weather conditions
    setCheckboxState("normal-day-checkbox", !conditions.is_rainy);
    setCheckboxState("rainy-day-checkbox", conditions.is_rainy);
    
    // Ground conditions
    setCheckboxState("slushy-day-checkbox", conditions.ground_state === "slushy");
    setCheckboxState("dry-day-checkbox", conditions.ground_state === "dry");
    
    // Time slots
    const timeSlotsContainer = document.getElementById("from-to-container");
    if (!timeSlotsContainer) {
        console.error("Time slots container element not found");
        return;
    }
    
    if (!conditions.rain_timing) {
        console.warn("No rain_timing data in conditions");
        timeSlotsContainer.innerHTML = "<div>No time slots data available</div>";
        return;
    }
    
    console.log("Rain timing data:", conditions.rain_timing);
    
    // Clear container
    timeSlotsContainer.innerHTML = `
        <table class="time-slots-table" style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr>
                    <th style="text-align: center; padding: 4px;">From</th>
                    <th style="text-align: center; padding: 4px;">To</th>
                </tr>
            </thead>
            <tbody id="time-slots-body">
                <!-- Rows will be inserted here -->
            </tbody>
        </table>
    `;
    
    const tbody = document.getElementById("time-slots-body");
    
    // Handle different data formats
    conditions.rain_timing.forEach(slot => {
        let from, to;
        
        if (typeof slot === 'string') {
            // Handle "HH:MM-HH:MM" format
            [from, to] = slot.split('-');
        } else if (slot.from && slot.to) {
            // Handle {from: "HH:MM", to: "HH:MM"} format
            from = slot.from;
            to = slot.to;
        } else {
            console.warn("Unexpected time slot format:", slot);
            from = to = "--";
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="padding: 4px; border-bottom: 1px solid #eee;">${from || "--"}</td>
            <td style="padding: 4px; border-bottom: 1px solid #eee;">${to || "--"}</td>
        `;
        tbody.appendChild(row);
    });
    
    if (conditions.rain_timing.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="2" style="text-align: center; padding: 8px;">No time slots recorded</td>
        `;
        tbody.appendChild(row);
    }
}

function populateLabourReport(labourData) {
    if (!labourData) return 0;
    
    let todaysTotal = 0;
    const table = document.getElementById('displayTable');
    if (!table) return 0;
    
    const tbody = table.querySelector('tbody') || table.createTBody();
    tbody.innerHTML = '';
    
    // Add header row
    const headerRow = document.createElement('tr');
const categories = Object.keys(labourData).filter(k => k !== "agency" && k !== "remarks");

let headerHTML = `<th>Agency Name</th>`;
categories.forEach(cat => {
  headerHTML += `<th>${cat}</th>`;
});
headerHTML += `<th>Total</th><th>Remarks</th>`;
headerRow.innerHTML = headerHTML;
tbody.appendChild(headerRow);


    // Single loop to both create rows AND calculate total
    for (let i = 0; i < labourData.agency.length; i++) {
  let rowHTML = `<td>${labourData.agency[i] || "--"}</td>`;
  let rowTotal = 0;

  categories.forEach(cat => {
    const val = parseInt(labourData[cat][i]) || 0;
    rowHTML += `<td>${val}</td>`;
    rowTotal += val;
  });

  rowHTML += `<td>${rowTotal}</td><td>${labourData.remarks[i] || "--"}</td>`;

  const tr = document.createElement('tr');
  tr.innerHTML = rowHTML;
  tbody.appendChild(tr);

  todaysTotal += rowTotal;
}

    console.log("CORRECT Today's Total:", todaysTotal); // Verify correct total
    return todaysTotal;
}
function populateProgressTables(dprData) {
    // Today's Progress
    const todayTable = document.getElementById('today-table');
    if (todayTable) {
        const tbody = todayTable.querySelector('tbody') || todayTable.createTBody();
        tbody.innerHTML = '';
        
        // Add header row (always present)
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = `
            <th style="text-align: center;">Today progress</th>
            <th style="text-align: center;">Quantity</th>
        `;
        tbody.appendChild(headerRow);
        
        // Add data rows if data exists
        if (dprData.today_prog) {
            for (let i = 0; i < dprData.today_prog.progress.length; i++) {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="text-align: left;">${dprData.today_prog.progress[i] || "--"}</td>
                    <td style="text-align: center;">${dprData.today_prog.qty[i] || "--"}</td>
                `;
                tbody.appendChild(tr);
            }
        } else {
            // Add empty row if no data
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="text-align: left;">--</td>
                <td style="text-align: center;">--</td>
            `;
            tbody.appendChild(tr);
        }
    }
    
    // Tomorrow's Planning
    const tomorrowTable = document.getElementById('tomorrow-table');
    if (tomorrowTable) {
        const tbody = tomorrowTable.querySelector('tbody') || tomorrowTable.createTBody();
        tbody.innerHTML = '';
        
        // Add header row (always present)
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = `
            <th style="text-align: center;">Tomorrow planning</th>
            <th style="text-align: center;">Quantity</th>
        `;
        tbody.appendChild(headerRow);
        
        // Add data rows if data exists
        if (dprData.tomorrow_plan) {
            for (let i = 0; i < dprData.tomorrow_plan.plan.length; i++) {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="text-align: left;">${dprData.tomorrow_plan.plan[i] || "--"}</td>
                    <td style="text-align: center;">${dprData.tomorrow_plan.qty[i] || "--"}</td>
                `;
                tbody.appendChild(tr);
            }
        } else {
            // Add empty row if no data
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="text-align: left;">--</td>
                <td style="text-align: center;">--</td>
            `;
            tbody.appendChild(tr);
        }
    }
}

/**
 * Calculates days between project start and end dates
 * @param {string} startDate - ISO format date string (e.g., "2023-05-01")
 * @param {string} endDate - ISO format date string
 * @returns {number|string} - Number of days or "--" if invalid
 */
function getProjectDurationDays(startDate, endDate) {
    // Handle missing dates
    if (!startDate || !endDate) {
        console.warn("Missing date inputs");
        return "--";
    }

    try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Validate dates
        if (isNaN(start) || isNaN(end)) {
            console.warn("Invalid date format");
            return "--";
        }

        // Calculate difference in days (absolute value)
        const timeDiff = Math.abs(end - start);
        const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        
        return daysDiff;
    } catch (error) {
        console.error("Date calculation error:", error);
        return "--";
    }
}
function appendTotalRowToLabourTable() {
    const table = document.getElementById('displayTable');
    if (!table) return;

    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll('tr')).slice(1); // Skip header

    // Initialize column totals (10 numeric columns: Mason to Total)
    const totals = new Array(10).fill(0);

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        for (let i = 1; i <= 10; i++) { // Columns 1 to 10 are numeric
            totals[i - 1] += parseInt(cells[i]?.textContent) || 0;
        }
    });

    // Append TOTAL row
    const totalRow = document.createElement('tr');
    totalRow.style.fontWeight = 'bold';
    totalRow.innerHTML = `
        <td>TOTAL</td>
        ${totals.map(val => `<td>${val}</td>`).join('')}
        <td>--</td> <!-- For Remarks column -->
    `;
    tbody.appendChild(totalRow);
}

function populateRemarksAndEvents(dprData) {
    // Events
    const eventsContainer = document.querySelector('.events-container');
    if (eventsContainer) {
        eventsContainer.innerHTML = '';
        
        const events = dprData.report_footer?.events_visit || [];
        const minEvents = 6; // Minimum 6 event slots
        
        for (let i = 0; i < Math.max(events.length, minEvents); i++) {
            const div = document.createElement('div');
            div.className = 'events-content';
            div.textContent = events[i] || "--";
            eventsContainer.appendChild(div);
        }
    }
    
    // Remarks
    const remarksContainer = document.querySelector('.remarks-content-container');
    if (remarksContainer) {
        remarksContainer.innerHTML = '';
        
        const remarks = dprData.report_footer?.bottom_remarks || 
                       (dprData.labour_report?.remarks ? [dprData.labour_report.remarks] : []);
        const minRemarks = 3; // Minimum 3 remark slots
        
        for (let i = 0; i < Math.max(remarks.length, minRemarks); i++) {
            const div = document.createElement('div');
            div.className = 'remarks-content';
            div.textContent = remarks[i] || "--";
            remarksContainer.appendChild(div);
        }
    }
    
    // Signatures
    if (dprData.report_footer?.prepared_by && document.getElementById('prepared-by')) {
        document.getElementById('prepared-by').textContent = dprData.report_footer.prepared_by;
    }
    if (dprData.report_footer?.distribute && document.getElementById('distribution')) {
        document.getElementById('distribution').textContent = dprData.report_footer.distribute.join(", ");
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

function setupPrintButton() {
    const printButton = document.getElementById('download-pdf');
    if (printButton) {
        printButton.addEventListener('click', () => {
            const style = document.createElement('style');
            style.innerHTML = `
                @page {
                    size: A4;
                    margin: 10mm;
                }
                body {
                    margin: 0;
                    padding: 0;
                }
                table {
                    page-break-inside: auto;
                }
                tr {
                    page-break-inside: avoid;
                    page-break-after: auto;
                }
                .remarks-content, .events-content {
                    page-break-inside: avoid;
                }
            `;
            document.head.appendChild(style);
            
            window.print();
            
            setTimeout(() => {
                document.head.removeChild(style);
            }, 1000);
        });
    }
}

function showErrorState(message = "Failed to load report data") {
    // Mark all fields as unavailable
    document.querySelectorAll('.info-value, td').forEach(el => {
        if (el.textContent.trim() === "") {
            el.textContent = "UNAVAILABLE";
            el.style.color = "red";
        }
    });
    
    // Show error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.color = 'red';
    errorDiv.style.padding = '10px';
    errorDiv.style.margin = '10px 0';
    errorDiv.style.border = '1px solid red';
    errorDiv.style.textAlign = 'center';
    
    document.body.insertBefore(errorDiv, document.body.firstChild);
}

// ====================== INITIALIZATION ======================
document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Get DPR ID from URL or use default
        const urlParams = new URLSearchParams(window.location.search);
        const dprId = urlParams.get('id') || 45;
        
        // Fetch both project and DPR data in parallel
        const [projectData, dprData] = await Promise.all([
            fetchProjectData(1),
            fetchDPRData(45)
        ]);
        
        // Populate all sections
        populateProjectInfo(projectData || {});
        
        if (dprData) {
            populateSiteConditions(dprData.site_condition);
            populateLabourReport(dprData.labour_report);
            appendTotalRowToLabourTable();
            populateProgressTables(dprData);
            populateRemarksAndEvents(dprData);
        }
        
        // Setup print button
        setupPrintButton();
    } catch (error) {
        console.error("Error loading data:", error);
        showErrorState("Failed to load data");
        
        // Try to use session storage as fallback
        const pdfDataString = sessionStorage.getItem('pdfPreviewData');
        if (pdfDataString) {
            try {
                const pdfData = JSON.parse(pdfDataString);
                populateProjectInfo(pdfData);
                populateSiteConditions(pdfData.site_condition);
                populateLabourReport(pdfData.labour_report);
                populateProgressTables(pdfData);
                populateRemarksAndEvents(pdfData);
            } catch (parseError) {
                console.error("Error parsing fallback data:", parseError);
            }
        }
    }
});