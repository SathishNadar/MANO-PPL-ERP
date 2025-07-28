// ====================== DEBUGGING HELPERS ======================
function debugLog(message, data) {
    console.log(`[DEBUG] ${message}`, data);
}

// ====================== DATA FETCH ======================
const tableData = JSON.parse(sessionStorage.getItem('userTableData')) || [];
const todayData = JSON.parse(sessionStorage.getItem('todayTableData')) || [];
const tomorrowData = JSON.parse(sessionStorage.getItem('tomorrowTableData')) || [];

const displayTable = document.getElementById('displayTable')?.getElementsByTagName('tbody')[0];
const todayTable = document.getElementById('today-table')?.getElementsByTagName('tbody')[0];
const tomorrowTable = document.getElementById('tomorrow-table')?.getElementsByTagName('tbody')[0];

// Format timeslots for backend
const timeSlotsInProperFormat = JSON.parse(sessionStorage.getItem("timeslots")) || [];
const formattedSlots = timeSlotsInProperFormat.map(slot => `${slot.from}-${slot.to}`);

// ====================== DURATION CALCULATIONS ======================
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

// ====================== POPULATE TABLES ======================
function populateTable(data, tbody, isProgress = false) {
    if (!data || !tbody) return;

    data.forEach(row => {
        const tr = document.createElement('tr');
        row.forEach((cell, index) => {
            const td = document.createElement('td');
            td.textContent = cell || "--";
            styleTableCell(td, index === 0 || isProgress);
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

// ====================== STYLING HELPERS ======================
function styleTableCell(cell, isTextCell = false) {
    cell.style.border = "1px solid #000";
    cell.style.padding = "4px";
    cell.style.boxSizing = "border-box";
    cell.style.whiteSpace = "normal";
    cell.style.wordBreak = "break-word";
    
    // For Today/Tomorrow tables
    const table = cell.closest('table');
    if (table && (table.id === 'today-table' || table.id === 'tomorrow-table')) {
        if (cell.cellIndex === 0) { // Task column
            cell.style.width = "70%";
            cell.style.textAlign = "left";
        } else if (cell.cellIndex === 1) { // Quantity column
            cell.style.width = "30%";
            cell.style.textAlign = "center";
        }
    } 
    // For other tables
    else if (!isTextCell) {
        cell.style.textAlign = "center";
    }
}

function styleRemarksCell(div) {
    div.style.border = "1px solid black";
    div.style.padding = "0px";
    div.style.marginBottom = "0px";
    div.style.backgroundColor = "#f9f9f9";
}

// ====================== LABOUR REPORT TABLE ======================
async function populateLabourTable() {
    const tableData = JSON.parse(sessionStorage.getItem("userTableData")) || [];
    const columns = JSON.parse(sessionStorage.getItem("labourColumns")) || [
        "Mason", "Carp", "Fitter", "Electrical", "Painter", "Gypsum", "Plumber", "Helper", "Staff"
    ];

    const displayTable = document.getElementById("displayTable");
    if (!displayTable) return;

    // Clear existing table
    displayTable.innerHTML = '';

    // Create table structure
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");

    // Create header row
    const headerRow = document.createElement("tr");
    headerRow.innerHTML = '<th>Agency Name</th>';
    
    // Add labour type columns
    columns.forEach(col => {
        headerRow.innerHTML += `<th>${col}</th>`;
    });
    
    // Add Total and Remarks columns
    headerRow.innerHTML += '<th>Total</th><th>Remarks</th>';
    thead.appendChild(headerRow);

    // Calculate today's total manpower
    let todayTotalManpower = 0;
    tableData.forEach(row => {
        let rowTotal = 0;
        for (let i = 1; i <= columns.length; i++) {
            rowTotal += parseInt(row[i]) || 0;
        }
        todayTotalManpower += rowTotal;
    });

    // Get yesterday's cumulative manpower
    const projectId = localStorage.getItem('selected_project_id') || sessionStorage.getItem('projectId');
    const latestDPR = projectId ? await fetchLatestDPR(projectId) : null;
    const yesterdayCumulative = latestDPR?.cumulative_manpower || 0;
    
    // Calculate today's cumulative
    const cumulativeManpower = yesterdayCumulative + todayTotalManpower;
    
    // Store for potential API submission
    sessionStorage.setItem('cumulativeManpower', cumulativeManpower);

    // Create data rows
    tableData.forEach((row) => {
        const tr = document.createElement("tr");
        
        // Agency Name (first column)
        const agencyTd = document.createElement("td");
        agencyTd.textContent = row[0] || "--";
        agencyTd.style.textAlign = "left";
        tr.appendChild(agencyTd);
        
        // Labour type columns
        for (let i = 1; i <= columns.length; i++) {
            const td = document.createElement("td");
            td.textContent = row[i] || "--";
            td.style.textAlign = "center";
            tr.appendChild(td);
        }
        
        // Calculate row total
        let rowTotal = 0;
        for (let i = 1; i <= columns.length; i++) {
            rowTotal += parseInt(row[i]) || 0;
        }
        
        // Total column
        const totalTd = document.createElement("td");
        totalTd.textContent = rowTotal;
        totalTd.style.textAlign = "center";
        totalTd.style.fontWeight = "bold";
        tr.appendChild(totalTd);
        
        // Remarks column (last item in row)
        const remarksTd = document.createElement("td");
        remarksTd.textContent = row[row.length - 1] || "--";
        remarksTd.style.textAlign = "left";
        tr.appendChild(remarksTd);
        
        tbody.appendChild(tr);
    });

    // Add total row at the bottom
    if (tableData.length > 0) {
        const totalRow = document.createElement("tr");
        totalRow.style.fontWeight = "bold";
        
        // Agency column
        totalRow.innerHTML = '<td>Total</td>';
        
        // Calculate column totals
        for (let col = 1; col <= columns.length; col++) {
            let colTotal = 0;
            tableData.forEach(row => {
                colTotal += parseInt(row[col]) || 0;
            });
            const td = document.createElement("td");
            td.textContent = colTotal;
            td.style.textAlign = "center";
            totalRow.appendChild(td);
        }
        
        // Grand total (today's manpower)
        const grandTotalTd = document.createElement("td");
        grandTotalTd.textContent = todayTotalManpower;
        grandTotalTd.style.textAlign = "center";
        grandTotalTd.style.backgroundColor = "#f0f0f0";
        totalRow.appendChild(grandTotalTd);
        
        // Empty remarks cell
        totalRow.innerHTML += '<td></td>';
        
        tbody.appendChild(totalRow);
    }

    // Append to table
    displayTable.appendChild(thead);
    displayTable.appendChild(tbody);

    // Update the existing cumulative manpower elements
    document.getElementById('cumulative-manpower-untill-yesterday').textContent = yesterdayCumulative;
    document.getElementById('cumulative-manpower-for-today').textContent = cumulativeManpower;
}

// ====================== FETCH LATEST DPR ======================
async function fetchLatestDPR(projectId) {
    try {
        // Fetch all DPRs for the project
        const response = await fetch(`http://34.47.131.237:3000/report/Alldpr/${projectId}`);
        if (!response.ok) throw new Error('Failed to fetch DPRs');
        
        const dprs = await response.json();
        if (!dprs || dprs.length === 0) return null;

        // Sort DPRs by date (newest first)
        dprs.sort((a, b) => new Date(b.report_date) - new Date(a.report_date));
        
        // Get the latest DPR ID
        const latestDPRId = dprs[0].dpr_id;
        
        // Fetch the full details of the latest DPR
        const dprResponse = await fetch(`http://34.47.131.237:3000/report/getDPR/${latestDPRId}`);
        if (!dprResponse.ok) throw new Error('Failed to fetch DPR details');
        
        const dprData = await dprResponse.json();
        return dprData.success ? dprData.data : null;
    } catch (error) {
        console.error("Error fetching latest DPR:", error);
        return null;
    }
}

// ====================== HANDLE FORM ELEMENTS ======================
function handleRemarks() {
    const container = document.querySelector('.remarks-content-container');
    if (!container) return;

    const data = JSON.parse(sessionStorage.getItem('remarksData')) || [];
    container.innerHTML = '';

    const count = Math.max(data.length, 3);
    for (let i = 0; i < count; i++) {
        const div = document.createElement('div');
        div.className = 'remarks-content';
        div.textContent = data[i] || '--';
        div.setAttribute('data-index', i);
        styleRemarksCell(div);
        container.appendChild(div);
    }
}

function handleFormData() {
    const data = JSON.parse(sessionStorage.getItem('form-values')) || [];
    
    // Weather checkboxes
    if (data[0] === "Rainy") {
        document.getElementById("rainy-day-checkbox").style.backgroundColor = "green";
        document.getElementById("normal-day-checkbox").style.backgroundColor = "";
    } else {
        document.getElementById("normal-day-checkbox").style.backgroundColor = "green";
        document.getElementById("rainy-day-checkbox").style.backgroundColor = "";
    }
    
    // Ground state checkboxes
    if (data[1] === "slushy") {
        document.getElementById("slushy-day-checkbox").style.backgroundColor = "green";
        document.getElementById("dry-day-checkbox").style.backgroundColor = "";
    } else if (data[1] === "dry") {
        document.getElementById("dry-day-checkbox").style.backgroundColor = "green";
        document.getElementById("slushy-day-checkbox").style.backgroundColor = "";
    }
}

function handleTimeSlots() {
    const timeSlots = JSON.parse(sessionStorage.getItem("timeslots")) || [];
    const container = document.querySelector(".from-to");
    
    if (!container) {
        console.error("Time slots container not found!");
        return;
    }

    // Clear existing content
    container.innerHTML = '';
    
    // Create table structure if needed
    let tbody = container.querySelector('tbody');
    if (!tbody) {
        const table = document.createElement('table');
        tbody = document.createElement('tbody');
        table.appendChild(tbody);
        container.appendChild(table);
    }

    // Add time slot rows
    timeSlots.forEach(slot => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>From: <span>${slot.from || "--"}</span></td>
            <td>To: <span>${slot.to || "--"}</span></td>
        `;
        tbody.appendChild(row);
    });
}

function handleEvents() {
    const container = document.querySelector('.events-container');
    if (!container) return;

    const data = JSON.parse(sessionStorage.getItem('eventsData')) || [];
    container.innerHTML = '';

    const count = Math.max(data.length, 6); // Minimum 6 fields
    for (let i = 0; i < count; i++) {
        const div = document.createElement('div');
        div.className = 'events-content';
        div.textContent = data[i] || '--';
        div.setAttribute('data-index', i);
        styleRemarksCell(div);
        container.appendChild(div);
    }
}

// ====================== PROJECT DATA FETCH ======================
function fetchProjectData() {
    const projectId = localStorage.getItem('selected_project_id') || sessionStorage.getItem('projectId');
    fetch(`http://34.47.131.237:3000/project/getProject/${projectId}`)
        .then(response => {
            if (!response.ok) {
                document.getElementById("project_name").textContent = "DATA UNAVAILABLE";
                throw new Error('Project not found');
            }
            return response.json();
        })
        .then(apiData => {
            if (apiData.data) {
                // Basic project info
                document.getElementById("project_name").textContent = apiData.data.project_name || "--";
                document.getElementById("Employer").textContent = apiData.data.Employer || "--";
                document.getElementById("contract_no").textContent = apiData.data.contract_no || "--";
                document.getElementById("location").textContent = apiData.data.location || "--";
                
                // Dates
                if (apiData.data.start_date) {
                    const startDate = new Date(apiData.data.start_date).toLocaleDateString('en-GB');
                    document.getElementById("start_date").textContent = startDate;
                }
                
                if (apiData.data.end_date) {
                    const endDate = new Date(apiData.data.end_date).toLocaleDateString('en-GB');
                    document.getElementById("end_date").textContent = endDate;
                    
                    // Calculate and display duration info
                    const totalDays = calculateTotalDays(apiData.data.start_date, apiData.data.end_date);
                    const daysRemaining = calculateDaysRemaining(apiData.data.end_date);
                    
                    const totalDaysElement = document.querySelector(".total-value");
                    if (totalDaysElement) {
                        totalDaysElement.textContent = totalDays;
                    }
                    
                    const daysRemainingElement = document.querySelector(".balance-right");
                    if (daysRemainingElement) {
                        daysRemainingElement.textContent = daysRemaining;
                    }
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

// ====================== PRINT HANDLING ======================
function prepareForPrint() {
    document.querySelectorAll('tr, th, td').forEach(el => {
        el.style.height = "auto";
        el.style.lineHeight = "1.2";
        el.style.border = "1px solid #000";
    });

    document.querySelectorAll('table').forEach(table => {
        table.style.tableLayout = 'fixed';
        table.style.borderCollapse = "collapse";
    });

    // Style both events and remarks
    document.querySelectorAll('.events-content, .remarks-content').forEach(div => {
        div.style.border = "1px solid #000";
        div.style.padding = "0px";
        div.style.marginBottom = "0px";
        div.style.backgroundColor = "#f9f9f9";
    });
}

function handlePrint() {
    const style = document.createElement('style');
    style.innerHTML = `
        @page { 
            margin: 5mm !important; 
            size: A4 portrait;
        }
        body { 
            margin: 0 !important; 
            padding: 10px !important;
        }
        .remarks-content, .events-content {
            border: 1px solid #000 !important;
            page-break-inside: avoid !important;
        }
        table {
            page-break-inside: auto !important;
        }
        tr {
            page-break-inside: avoid !important;
        }
    `;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => style.remove(), 1000);
}

// ====================== DPR OBJECT GENERATION ======================
function generateCompleteDPRObject() {
    const apiData = JSON.parse(sessionStorage.getItem('apiProjectData')) || {};
    const tableData = JSON.parse(sessionStorage.getItem('userTableData')) || [];
    const todayData = JSON.parse(sessionStorage.getItem('todayTableData')) || [];
    const tomorrowData = JSON.parse(sessionStorage.getItem('tomorrowTableData')) || [];
    const formValues = JSON.parse(sessionStorage.getItem('form-values')) || [];

    const labour_report = {
        agency: tableData.map(row => row[0] || "--"),
        mason: tableData.map(row => parseInt(row[1]) || 0),
        carp: tableData.map(row => parseInt(row[2]) || 0),
        fitter: tableData.map(row => parseInt(row[3]) || 0),
        electrical: tableData.map(row => parseInt(row[4]) || 0),
        painter: tableData.map(row => parseInt(row[5]) || 0),
        gypsum: tableData.map(row => parseInt(row[6]) || 0),
        plumber: tableData.map(row => parseInt(row[7]) || 0),
        helper: tableData.map(row => parseInt(row[8]) || 0),
        staff: tableData.map(row => parseInt(row[9]) || 0),
        remarks: tableData.slice(0).map(row => row[11] || "--")
    };

    return {
        project_id: parseInt(localStorage.getItem('selected_project_id')) || parseInt(sessionStorage.getItem('projectId')) || 1,
        report_date: new Date().toISOString().split('T')[0],
        site_condition: {
            ground_state: formValues[1] || "normal",
            is_rainy: formValues[0] === "Rainy",
            rain_timing: formattedSlots || []
        },
        labour_report: labour_report,
        today_prog: {
            progress: todayData.map(row => row[0] || "--"),
            qty: todayData.map(row => row[1] || "--")
        },
        tomorrow_plan: {
            plan: tomorrowData.map(row => row[0] || "--"),
            qty: tomorrowData.map(row => row[1] || "--")
        },
        user_roles: {
            created_by: 1,
            approvals: { 1: true, 3: false },
            viewers: [10, 11, 15],
            editors: [1, 3, 4]
        },
        report_footer: {
            events_visit: JSON.parse(sessionStorage.getItem('eventsData')) || [],
            distribute: ["L&T", "MAPLANI"],
            prepared_by: "Mano Project Pvt. Ltd."
        },
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
}

// ====================== DPR SUBMISSION ======================
function postDPRToBackend() {
    const dprData = generateCompleteDPRObject();

    fetch('http://34.47.131.237:3000/report/insertDPR', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dprData)
    })
    .then(response => {
        if (!response.ok) throw new Error("Upload failed");
        return response.json();
    })
    .then(result => {
        console.log("Upload successful:", result);
        alert("DPR uploaded successfully!");
    })
    .catch(err => {
        console.error("Error:", err);
        alert("Failed to upload DPR. Please try again.");
    });
}

// ====================== INITIALIZATION ======================
document.addEventListener("DOMContentLoaded", () => {
    // Check for DPR ID in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const dprId = urlParams.get('id');
    
    if (dprId) {
        const projectId = localStorage.getItem('selected_project_id');
        fetchAndPopulateFromAPI(dprId, projectId);
    } else {
        // Populate from session storage
        populateLabourTable();
        populateTable(todayData, todayTable, true);
        populateTable(tomorrowData, tomorrowTable, true);
        handleFormData();
        handleTimeSlots();
        handleEvents();
        handleRemarks();
        
        // Fetch project data
        fetchProjectData();
    }

    // Initialize print button
    document.getElementById('download-pdf')?.addEventListener('click', handlePrint);
    
    // Make postDPRToBackend available globally
    window.postDPRToBackend = postDPRToBackend;
});

// ====================== API DATA FETCHING ======================
async function fetchAndPopulateFromAPI(dprId, projectId) {
    try {
        const dprResponse = await fetch(`http://34.47.131.237:3000/report/getDPR/${dprId}`);
        if (!dprResponse.ok) throw new Error('Failed to fetch DPR data');
        
        const apiData = await dprResponse.json();
        if (!apiData.success) throw new Error('API returned unsuccessful response');
        
        // Fetch project details
        let projectDetails = {};
        if (projectId) {
            const projectResponse = await fetch(`http://34.47.131.237:3000/project/getProject/${projectId}`);
            if (projectResponse.ok) {
                const projectData = await projectResponse.json();
                if (projectData.success) {
                    projectDetails = projectData.data;
                }
            }
        }
        
        // Merge DPR data with project details
        const mergedData = {
            ...apiData.data,
            projectDetails: projectDetails
        };
        
        // Transform API data to match our expected structure
        const transformedData = transformApiData(mergedData);
        populateAllData(transformedData);
        
    } catch (error) {
        console.error("Error loading data from API:", error);
        showErrorState("Failed to load from API");
    }
}

function transformApiData(apiData) {
    return {
        project_name: apiData.projectDetails?.project_name || apiData.project_name || "--",
        Employer: apiData.projectDetails?.Employer || apiData.projectDetails?.client_name || apiData.Employer || "--",
        contract_no: apiData.projectDetails?.contract_no || apiData.contract_no || "--",
        location: apiData.projectDetails?.location || apiData.location || "--",
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
        site_conditions: {
            normal_day: !apiData.site_condition?.is_rainy,
            rainy_day: apiData.site_condition?.is_rainy || false,
            slushy_day: apiData.site_condition?.ground_state === "slushy",
            dry_day: apiData.site_condition?.ground_state === "dry",
            time_slots: apiData.site_condition?.rain_timing || []
        },
        labour_data: formatLabourData(apiData.labour_report, apiData.cumulative_manpower),
        today_progress: formatProgressData(apiData.today_prog),
        tomorrow_planning: formatProgressData(apiData.tomorrow_plan),
        events_remarks: apiData.report_footer?.events_visit || [],
        general_remarks: apiData.report_footer?.bottom_remarks || ["--"],
        prepared_by: apiData.report_footer?.prepared_by || "MANO PCPL",
        approved_by: apiData.report_footer?.distribute?.join(", ") || "GOYAL"
    };
}

function formatLabourData(labourReport, cumulativeManpower = 0) {
    if (!labourReport) {
        return { headers: [], tableData: [], cumulative_manpower: cumulativeManpower };
    }

    const laborTypes = Object.keys(labourReport).filter(key => 
        key !== 'agency' && 
        key !== 'remarks' && 
        key !== 'k' && 
        key !== 'ok' && 
        Array.isArray(labourReport[key])
    );

    const headers = ['Agency Name', ...laborTypes, 'Total', 'Remarks'];
    const tableData = [];
    const maxLength = Math.max(
        labourReport.agency?.length || 0,
        ...laborTypes.map(type => labourReport[type]?.length || 0)
    );

    for (let i = 0; i < maxLength; i++) {
        const row = [];
        let total = 0;

        // Agency Name
        const agency = labourReport.agency?.[i] || "--";
        row.push(agency);

        // Labor counts
        laborTypes.forEach(type => {
            const count = parseInt(labourReport[type]?.[i]) || 0;
            row.push(count.toString());
            total += count;
        });

        // Total
        row.push(total.toString());

        // Remarks
        const remark = Array.isArray(labourReport.remarks) 
            ? labourReport.remarks[i] || labourReport.remarks[0] || "--"
            : labourReport.remarks || "--";
        row.push(remark);

        tableData.push(row);
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

// ====================== DATA POPULATION ======================
function populateAllData(data) {
    // 1. Populate Project Information
    populateProjectInfo(data);
    
    // 2. Populate Site Conditions
    if (data.site_conditions) {
        populateSiteConditions(data.site_conditions);
    }
    
    // 3. Populate Labour Report
    if (data.labour_data) {
        populateLabourReport(data.labour_data);
    }
    
    // 4. Populate Progress Tables
    populateProgressTables(data);
    
    // 5. Populate Remarks and Events
    populateRemarksAndEvents(data);
}

function populateProjectInfo(data) {
    document.getElementById("project_name").textContent = data.project_name || "--";
    document.getElementById("Employer").textContent = data.Employer || "--";
    document.getElementById("contract_no").textContent = data.contract_no || "--";
    document.getElementById("location").textContent = data.location || "--";
    document.getElementById("start_date").textContent = data.start_date || "--";
    document.getElementById("end_date").textContent = data.end_date || "--";
    
    const reportDateElement = document.querySelector(".daily-progress-report-table tr:nth-child(2) td:nth-child(2)");
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
    if (!labourData || !labourData.headers || !labourData.tableData) return;
    
    const table = document.getElementById('displayTable');
    if (!table) return;
    
    const tbody = table.querySelector('tbody') || table.createTBody();
    tbody.innerHTML = '';
    
    // Create header row
    const headerRow = document.createElement('tr');
    labourData.headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header.toUpperCase();
        headerRow.appendChild(th);
    });
    tbody.appendChild(headerRow);
    
    // Add data rows
    labourData.tableData.forEach(row => {
        const tr = document.createElement('tr');
        row.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });

    // Populate cumulative manpower
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
    // Today's Progress
    const todayTable = document.getElementById('today-table');
    if (todayTable && data.today_progress) {
        const tbody = todayTable.querySelector('tbody') || todayTable.createTBody();
        tbody.innerHTML = '';
        
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = `
            <th style="text-align: center;">Task</th>
            <th>Quantity</th>
        `;
        tbody.appendChild(headerRow);
        
        data.today_progress.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="text-align: left;">${row[0] || "--"}</td>
                <td style="text-align: center;">${row[1] || "--"}</td>
            `;
            tbody.appendChild(tr);
        });
    }
    
    // Tomorrow's Planning
    const tomorrowTable = document.getElementById('tomorrow-table');
    if (tomorrowTable && data.tomorrow_planning) {
        const tbody = tomorrowTable.querySelector('tbody') || tomorrowTable.createTBody();
        tbody.innerHTML = '';
        
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = `
            <th style="text-align: center;">Task</th>
            <th>Quantity</th>
        `;
        tbody.appendChild(headerRow);
        
        data.tomorrow_planning.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="text-align: left;">${row[0] || "--"}</td>
                <td style="text-align: center;">${row[1] || "--"}</td>
            `;
            tbody.appendChild(tr);
        });
    }
}

function populateRemarksAndEvents(data) {
    // Events
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
    
    // Remarks
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
    
    // Signatures
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

function showErrorState(message = "Failed to load report data") {
    document.querySelectorAll('.info-value, td').forEach(el => {
        if (el.textContent.trim() === "") {
            el.textContent = "UNAVAILABLE";
            el.style.color = "red";
        }
    });
    
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

// ====================== ADJUST HEIGHT ======================
function adjustLabourContainer() {
    const label = document.querySelector('.labour-table-lable');
    const container = document.querySelector('.inside-labour-table-cotainer');
    const table = document.getElementById('displayTable');

    if (label && container && table) {
        const maxHeight = Math.max(label.scrollHeight, container.scrollHeight, table.scrollHeight);
        label.style.minHeight = container.style.minHeight = table.style.minHeight = `${maxHeight}px`;
    }
}