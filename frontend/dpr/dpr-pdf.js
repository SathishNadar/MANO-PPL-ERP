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

// ====================== UPDATED LABOUR TABLE WITH TOTAL COLUMN ======================
function populateLabourTable() {
    const labourData = JSON.parse(sessionStorage.getItem("labourReport")) || {};
    const table = document.getElementById("displayTable");
    const tbody = table?.getElementsByTagName("tbody")[0];
    
    if (!labourData || !table || !tbody) return;

    const keys = Object.keys(labourData).filter(k => k !== "agency" && k !== "remarks");
    const agencies = labourData.agency || [];
    const remarks = labourData.remarks || [];

    // Clear existing content
    tbody.innerHTML = "";

    // Create header row with Total column
    const headerRow = document.createElement("tr");
    headerRow.innerHTML = `<th>Agency Name</th>`;
    keys.forEach(k => headerRow.innerHTML += `<th>${k}</th>`);
    headerRow.innerHTML += `<th>Total</th><th>Remarks</th>`;
    tbody.appendChild(headerRow);

    // Create data rows with calculated totals
    for (let i = 0; i < agencies.length; i++) {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${agencies[i]}</td>`;
        
        let rowTotal = 0;
        keys.forEach(k => {
            const value = labourData[k]?.[i] ?? "--";
            row.innerHTML += `<td>${value}</td>`;
            if (!isNaN(parseInt(value))) rowTotal += parseInt(value);
        });
        
        row.innerHTML += `<td style="font-weight:bold;background:#f0f0f0">${rowTotal}</td><td>${remarks[i] || "--"}</td>`;
        tbody.appendChild(row);
    }

    // Add footer row with column totals
    if (agencies.length > 0) {
        const footerRow = document.createElement("tr");
        footerRow.style.fontWeight = "bold";
        footerRow.innerHTML = `<td>Total</td>`;
        
        // Column totals
        keys.forEach(k => {
            const colTotal = (labourData[k] || []).reduce((sum, val) => sum + (parseInt(val) || 0), 0);
            footerRow.innerHTML += `<td>${colTotal}</td>`;
        });
        
        // Grand total
        const grandTotal = keys.reduce((total, k) => {
            return total + (labourData[k] || []).reduce((sum, val) => sum + (parseInt(val) || 0), 0);
        }, 0);
        
        footerRow.innerHTML += `<td style="background:#e0e0e0">${grandTotal}</td><td></td>`;
        tbody.appendChild(footerRow);
    }
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
    // For labour table
    else if (table && table.id === 'displayTable') {
        if (cell.cellIndex === 0) { // Agency column
            cell.style.textAlign = "left";
        } 
        else if (cell.closest('tr').rowIndex === 0) { // Header row
            cell.style.fontWeight = "bold";
            cell.style.backgroundColor = "#f0f0f0";
        }
        else if (cell.cellIndex === keys.length + 1) { // Total column
            cell.style.fontWeight = "bold";
        }
        else {
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

// ====================== HANDLE FORM DATA ======================
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

// ====================== HANDLE TIME SLOTS ======================
function handleTimeSlots() {
    const timeSlots = JSON.parse(sessionStorage.getItem("timeslots")) || [];
    const container = document.querySelector(".from-to");
    
    if (!container) {
        console.error("Time slots container not found!");
        return;
    }

    container.innerHTML = '';
    
    let tbody = container.querySelector('tbody');
    if (!tbody) {
        const table = document.createElement('table');
        tbody = document.createElement('tbody');
        table.appendChild(tbody);
        container.appendChild(table);
    }

    timeSlots.forEach(slot => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>From: <span>${slot.from || "--"}</span></td>
            <td>To: <span>${slot.to || "--"}</span></td>
        `;
        tbody.appendChild(row);
    });
}

// ====================== HANDLE EVENTS ======================
function handleEvents() {
    const container = document.querySelector('.events-container');
    if (!container) return;

    const data = JSON.parse(sessionStorage.getItem('eventsData')) || [];
    container.innerHTML = '';

    const count = Math.max(data.length, 6);
    for (let i = 0; i < count; i++) {
        const div = document.createElement('div');
        div.className = 'events-content';
        div.textContent = data[i] || '--';
        div.setAttribute('data-index', i);
        styleRemarksCell(div);
        container.appendChild(div);
    }
}

// ====================== HANDLE REMARKS ======================
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

// ====================== ADJUST CONTAINER HEIGHTS ======================
function adjustLabourContainer() {
    const label = document.querySelector('.labour-table-lable');
    const container = document.querySelector('.inside-labour-table-cotainer');
    const table = document.getElementById('displayTable');

    if (label && container && table) {
        const maxHeight = Math.max(label.scrollHeight, container.scrollHeight, table.scrollHeight);
        label.style.minHeight = container.style.minHeight = table.style.minHeight = `${maxHeight}px`;
    }
}

// ====================== PREPARE FOR PRINT ======================
function prepareForPrint() {
    // Style all table cells
    document.querySelectorAll('th, td').forEach(cell => {
        cell.style.border = "1px solid #000";
        cell.style.padding = "4px";
        cell.style.boxSizing = "border-box";
    });

    // Ensure tables don't break across pages
    document.querySelectorAll('table').forEach(table => {
        table.style.pageBreakInside = "avoid";
    });

    // Style remarks sections
    document.querySelectorAll('.events-content, .remarks-content').forEach(div => {
        div.style.border = "1px solid #000";
        div.style.padding = "4px";
        div.style.marginBottom = "0px";
    });
}

// ====================== PROJECT DATA FETCH ======================
async function fetchProjectAndPopulate() {
    try {
        const res = await fetch('http://34.47.131.237:3000/project/getProject/1');
        if (!res.ok) throw new Error('Project fetch failed');

        const data = (await res.json()).data;

        const startDate = new Date(data.start_date);
        const endDate = new Date(data.end_date);
        const today = new Date();

        const totalDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
        const daysPassed = Math.round((today - startDate) / (1000 * 60 * 60 * 24));
        const daysRemaining = Math.max(totalDays - daysPassed, 0);

        document.getElementById("project_name").textContent = data.project_name || "--";
        document.getElementById("Employer").textContent = data.Employer || "--";
        document.getElementById("contract_no").textContent = data.contract_no || "--";
        document.getElementById("location").textContent = data.location || "--";
        document.getElementById("start_date").textContent = startDate.toLocaleDateString('en-GB') || "--";
        document.getElementById("end_date").textContent = endDate.toLocaleDateString('en-GB') || "--";
        document.getElementById("total_days").textContent = totalDays;
        document.getElementById("days_remaining").textContent = daysRemaining;

    } catch (error) {
        console.error("Error fetching project:", error);
    }
}

// ====================== CUMULATIVE MANPOWER CALCULATION ======================
async function fetchCumulativeManpower() {
    try {
        const resp = await fetch('http://34.47.131.237:3000/report/Alldpr/1?limit=10');
        const dprs = await resp.json();

        if (!Array.isArray(dprs) || dprs.length === 0) return;

        const latest = dprs.reduce((a, b) => new Date(a.report_date) > new Date(b.report_date) ? a : b);

        const fullResp = await fetch(`http://34.47.131.237:3000/report/getDPR/${latest.dpr_id}`);
        const fullData = await fullResp.json();
        const previousManpower = fullData?.data?.cumulative_manpower || 0;

        const currentLabour = JSON.parse(sessionStorage.getItem('labourReport')) || {};
        const keys = Object.keys(currentLabour).filter(k => k !== 'agency' && k !== 'remarks');

        let currentTotal = 0;
        keys.forEach(role => {
            currentTotal += (currentLabour[role] || []).reduce((sum, val) => sum + (parseInt(val) || 0), 0);
        });

        document.getElementById('cumulative-manpower-untill-yesterday').textContent = previousManpower;
        document.getElementById('cumulative-manpower-for-today').textContent = previousManpower + currentTotal;

    } catch (err) {
        console.error("Error calculating cumulative manpower:", err);
    }
}

// ====================== INITIALIZATION ======================
async function initializePDF() {
    populateLabourTable(); // Now includes totals
    populateTable(todayData, todayTable, true);
    populateTable(tomorrowData, tomorrowTable, true);
    handleFormData();
    handleTimeSlots();
    handleEvents();
    handleRemarks();
    adjustLabourContainer();
    await fetchProjectAndPopulate();
    await fetchCumulativeManpower();
}

// ====================== EVENT LISTENERS ======================
document.addEventListener("DOMContentLoaded", initializePDF);

document.getElementById('download-pdf')?.addEventListener('click', () => {
    const style = document.createElement('style');
    style.innerHTML = `
        @page { margin: 5mm !important; }
        body { margin: 0 !important; }
        .remarks-content {
            border: 1px solid #000 !important;
            page-break-inside: avoid !important;
        }
    `;
    document.head.appendChild(style);
    prepareForPrint();
    window.print();
    setTimeout(() => style.remove(), 1000);
});