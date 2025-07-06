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
    const table = cell.closest('table');
    const keys = table?.id === 'displayTable' 
        ? Object.keys(JSON.parse(sessionStorage.getItem("labourReport")) || [])
        : [];

    cell.style.border = "1px solid #000";
    cell.style.padding = "4px";
    cell.style.boxSizing = "border-box";
    cell.style.whiteSpace = "normal";
    cell.style.wordBreak = "break-word";
    
    // For Today/Tomorrow tables
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

// ====================== HANDLE WEATHER FORM ======================
function handleFormData() {
    const data = JSON.parse(sessionStorage.getItem('form-values'));
    if (!Array.isArray(data)) return;

    if (data[0] === "Rainy") document.getElementById("rainy-day-checkbox").style.backgroundColor = "green";
    if (data[0] === "Sunny") document.getElementById("normal-day-checkbox").style.backgroundColor = "green";
    if (data[1] === "slushy") document.getElementById("slushy-day-checkbox").style.backgroundColor = "green";
    if (data[1] === "dry") document.getElementById("dry-day-checkbox").style.backgroundColor = "green";
}

// ====================== HANDLE TIME SLOTS ======================
function handleTimeSlots() {
    const timeSlots = JSON.parse(sessionStorage.getItem("timeslots")) || [];
    const table = document.querySelector(".from-to");
    if (!table) return;

    table.innerHTML = '';
    timeSlots.forEach(slot => {
        const row = document.createElement("tr");

        const fromTd = document.createElement("td");
        const toTd = document.createElement("td");

        fromTd.innerHTML = `From: <span>${slot.from}</span>`;
        toTd.innerHTML = `To: <span>${slot.to}</span>`;

        styleTableCell(fromTd);
        styleTableCell(toTd);

        row.appendChild(fromTd);
        row.appendChild(toTd);
        table.appendChild(row);
    });
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

// ====================== PREPARE FOR PRINT ======================
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

    document.querySelectorAll('.events-content, .remarks-content').forEach(div => {
        div.style.border = "1px solid #000";
        div.style.padding = "0px";
        div.style.marginBottom = "0px";
        div.style.backgroundColor = "#f9f9f9";
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

// ====================== FETCH PROJECT DATA ======================
async function fetchProjectAndPopulate() {
    try {
        const response = await fetch('http://34.47.131.237:3000/project/getProject/1');
        if (!response.ok) {
            document.getElementById("project_name").textContent = "DATA UNAVAILABLE";
            document.getElementById("project_name").classList.add("error_state");
            throw new Error('Project not found');
        }
        
        const Apidata = await response.json();
        sessionStorage.setItem('apiProjectData', JSON.stringify(Apidata.data));
        document.getElementById("project_name").textContent = Apidata.data.project_name;
        document.getElementById("Employer").textContent = Apidata.data.Employer;
        document.getElementById("contract_no").textContent = Apidata.data.contract_no;
        document.getElementById("location").textContent = Apidata.data.location;
        document.getElementById("start_date").textContent = new Date(Apidata.data.start_date).toLocaleDateString('en-GB');
    } catch (error) {
        console.error('Error:', error);
    }
}

// ====================== GENERATE COMPLETE DPR OBJECT ======================
function generateCompleteDPRObject() {
    const apiData = JSON.parse(sessionStorage.getItem('apiProjectData')) || {};

    return {
        project_id: 66,
        report_date: "2004-10-10",
        site_condition: {
            is_rainy: JSON.parse(sessionStorage.getItem('form-values'))?.[0] === "Rainy",
            ground_state: JSON.parse(sessionStorage.getItem('form-values'))?.[1] || "normal",
            rain_timing: formattedSlots || []
        },
        labour_report: {
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
            remarks: tableData.map(row => row[11] || "--")
        },
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

// ====================== POST DPR TO BACKEND ======================
async function postDPRToBackend() {
    try {
        const dprData = generateCompleteDPRObject();
        const response = await fetch('http://34.47.131.237:3000/report/insertDPR', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dprData)
        });

        if (!response.ok) throw new Error("Upload failed");
        const result = await response.json();
        console.log("Upload successful:", result);
        alert("DPR uploaded successfully!");
    } catch (err) {
        console.error("Error:", err);
        alert("Failed to upload DPR. Please try again.");
    }
}

// ====================== INITIALIZATION ======================
async function initialize() {
    populateLabourTable();
    populateTable(todayData, todayTable, true);
    populateTable(tomorrowData, tomorrowTable, true);
    handleFormData();
    handleTimeSlots();
    handleEvents();
    handleRemarks();
    adjustLabourContainer();
    await fetchProjectAndPopulate();
    
    // Make postDPRToBackend available globally
    window.postDPRToBackend = postDPRToBackend;
}

document.addEventListener("DOMContentLoaded", initialize);

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