// ====================== DATA FETCH ======================
const tableData = JSON.parse(sessionStorage.getItem('userTableData')) || [];
const todayData = JSON.parse(sessionStorage.getItem('todayTableData')) || [];
const tomorrowData = JSON.parse(sessionStorage.getItem('tomorrowTableData')) || [];

const displayTable = document.getElementById('displayTable')?.getElementsByTagName('tbody')[0];
const todayTable = document.getElementById('today-table')?.getElementsByTagName('tbody')[0];
const tomorrowTable = document.getElementById('tomorrow-table')?.getElementsByTagName('tbody')[0];

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

// ====================== HANDLE REMARKS ======================
function handleRemarks() {
    const container = document.querySelector('.remarks-content-container');
    if (!container) return;

    // Use the same key as in the form
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

    // Style both events and remarks
    document.querySelectorAll('.events-content, .remarks-content').forEach(div => {
        div.style.border = "1px solid #000";
        div.style.padding = "0px";
        div.style.marginBottom = "0px";
        div.style.backgroundColor = "#f9f9f9";
    });
}

// ====================== INITIALIZATION ======================
document.addEventListener("DOMContentLoaded", () => {
    populateTable(tableData, displayTable);
    populateTable(todayData, todayTable, true);
    populateTable(tomorrowData, tomorrowTable, true);
    handleFormData();
    handleTimeSlots();
    handleEvents();
    handleRemarks();
    adjustLabourContainer();

    window.addEventListener('resize', adjustLabourContainer);
    window.onbeforeprint = prepareForPrint;

    




const reportData = generateReportObject();
  console.log("Generated Report Object:", reportData);


});

// ====================== PRINT HANDLER ======================
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


// ====================== HANDLE EVENTS ======================
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

// ====================== HANDLE REMARKS ======================
function handleRemarks() {
    const container = document.querySelector('.remarks-content-container');
    if (!container) return;

    const data = JSON.parse(sessionStorage.getItem('remarksData')) || [];
    container.innerHTML = '';

    const count = Math.max(data.length, 3); // Minimum 3 fields
    for (let i = 0; i < count; i++) {
        const div = document.createElement('div');
        div.className = 'remarks-content';
        div.textContent = data[i] || '--';
        div.setAttribute('data-index', i);
        styleRemarksCell(div);
        container.appendChild(div);
    }
}





//----------------------------FOR CREATING OBJECT FOR THE VALUES OF THE DPR----------------------------------//
function generateReportObject() {
  return {
    project_id: parseInt(sessionStorage.getItem('projectId')) || 1,
    report_date: new Date().toISOString().split('T')[0],
    site_condition: {
      ground_state: JSON.parse(sessionStorage.getItem('form-values'))?.[1] || "normal",
      is_rainy: JSON.parse(sessionStorage.getItem('form-values'))?.[0] === "Rainy",
      rain_timing: JSON.parse(sessionStorage.getItem('timeslots')) || []
    },
    labour_report: {
      agency: tableData.map(row => row[0]), // From your existing tableData
      mason: tableData.map(row => parseInt(row[1]) || 0),
      carp: tableData.map(row => parseInt(row[2]) || 0),
      // ... other labour fields ...
      remarks: JSON.parse(sessionStorage.getItem('remarksData'))?.[0] || ""
    },
    today_prog: {
      progress: todayData.map(row => row[0]), // From todayData
      qty: todayData.map(row => row[1])
    },
    tomorrow_plan: {
      plan: tomorrowData.map(row => row[0]), // From tomorrowData
      qty: tomorrowData.map(row => row[1])
    }
  };
}