// ====================== MAIN CODE ======================
const tableData = JSON.parse(sessionStorage.getItem('userTableData')) || [];
const displayTable = document.getElementById('displayTable').getElementsByTagName('tbody')[0];
const todaytableData = JSON.parse(sessionStorage.getItem('todayTableData')) || [];
const todaydisplayTable = document.getElementById('today-table').getElementsByTagName('tbody')[0];
const tomorrowtableData = JSON.parse(sessionStorage.getItem('tomorrowTableData')) || [];
const tomorrowdisplayTable = document.getElementById('tomorrow-table').getElementsByTagName('tbody')[0];

// ====================== TABLE POPULATION ======================
function populateTables() {
    // Labour Table
    if (tableData.length > 0) {
        tableData.forEach(row => {
            const tr = document.createElement('tr');
            styleTableRow(tr); // Apply row styling
            row.forEach(cell => {
                const td = document.createElement('td');
                td.textContent = cell;
                styleTableCell(td);
                tr.appendChild(td);
            });
            displayTable.appendChild(tr);
        });
    }

    // Today's Progress Table
    if (todaytableData.length > 0) {
        todaytableData.forEach(row => {
            const tr = document.createElement('tr');
            styleTableRow(tr);
            row.forEach(cell => {
                const td = document.createElement('td');
                td.textContent = cell;
                styleTableCell(td);
                tr.appendChild(td);
            });
            todaydisplayTable.appendChild(tr);
        });
    }

    // Tomorrow's Planning Table
    if (tomorrowtableData.length > 0) {
        tomorrowtableData.forEach(row => {
            const tr = document.createElement('tr');
            styleTableRow(tr);
            row.forEach(cell => {
                const td = document.createElement('td');
                td.textContent = cell;
                styleTableCell(td);
                tr.appendChild(td);
            });
            tomorrowdisplayTable.appendChild(tr);
        });
    }
}

function styleTableRow(row) {
    row.style.height = "20px";
    row.style.minHeight = "20px";
    row.style.maxHeight = "20px";
    row.style.lineHeight = "20px";
}

function styleTableCell(cell) {
    cell.style.height = "20px";
    cell.style.minHeight = "20px";
    cell.style.padding = "0 4px";
    cell.style.lineHeight = "20px";
    cell.style.border = "1px solid #000";
    cell.style.overflow = "hidden";
    cell.style.boxSizing = "border-box";
    
    if (!cell.textContent || cell.textContent.trim() === "") {
        cell.innerHTML = "&nbsp;";
    }
}

// ====================== HEIGHT ADJUSTMENT ======================
function adjustLabourContainer() {
    const label = document.querySelector('.labour-table-lable');
    const container = document.querySelector('.inside-labour-table-cotainer');
    const table = document.getElementById('displayTable');

    if (label && container && table) {
        const maxHeight = Math.max(
            label.scrollHeight,
            container.scrollHeight,
            table.scrollHeight
        );
        
        label.style.minHeight = `${maxHeight}px`;
        container.style.minHeight = `${maxHeight}px`;
        table.style.minHeight = `${maxHeight}px`;
    }
}

// ====================== PRINT PREPARATION ======================
function prepareForPrint() {
    // Enforce 20px height for all rows and cells
    document.querySelectorAll('tr, th, td').forEach(el => {
        el.style.height = "20px !important";
        el.style.minHeight = "20px !important";
        el.style.maxHeight = "20px !important";
        el.style.lineHeight = "20px !important";
    });

    // Ensure borders are visible
    document.querySelectorAll('table, th, td').forEach(el => {
        el.style.border = "1px solid #000 !important";
        el.style.borderCollapse = "collapse !important";
    });

    // Handle checkboxes
    document.querySelectorAll('[id$="-checkbox"]').forEach(checkbox => {
        checkbox.style.border = "1px solid #000 !important";
    });
}

// ====================== FORM DATA HANDLING ======================
function handleFormData() {
    const storedItem = sessionStorage.getItem('form-values');
    if (!storedItem) return;
    
    const parsedItem = JSON.parse(storedItem);
    if (!parsedItem || !Array.isArray(parsedItem)) return;

    if (parsedItem[0] === "Rainy") {
        // Correct way to set background color
        document.getElementById("rainy-day-checkbox").style.backgroundColor = "green";
    }
    if (parsedItem[0] === "Sunny") {
        document.getElementById("normal-day-checkbox").style.backgroundColor = "green";
    }
    if (parsedItem[1] === "slushy") {
        document.getElementById("slushy-day-checkbox").style.backgroundColor = "green";
    }
    if (parsedItem[1] === "dry") {
        document.getElementById("dry-day-checkbox").style.backgroundColor = "green";
    }
}

// ====================== TIME SLOTS ======================
function handleTimeSlots() {
    const timeSlots = JSON.parse(sessionStorage.getItem("timeslots")) || [];
    const table = document.querySelector(".from-to");

    if (table) {
        table.innerHTML = "";
        timeSlots.forEach(slot => {
            const row = document.createElement("tr");
            styleTableRow(row);
            const fromTd = document.createElement("td");
            const toTd = document.createElement("td");
            styleTableCell(fromTd);
            styleTableCell(toTd);

            fromTd.innerHTML = `From: <span>${slot.from}</span>`;
            toTd.innerHTML = `To: <span>${slot.to}</span>`;

            row.appendChild(fromTd);
            row.appendChild(toTd);
            table.appendChild(row);
        });
    }
}

// ====================== PRINT FUNCTION ======================
function printit() {
    prepareForPrint();
    setTimeout(window.print, 50);
}

// ====================== INITIALIZATION ======================
document.addEventListener("DOMContentLoaded", function() {
    populateTables();
    handleFormData();
    handleTimeSlots();
    adjustLabourContainer();

    // Add CSS class for print media
    const style = document.createElement('style');
    style.textContent = `
        @media print {
            tr, th, td {
                height: 20px !important;
                min-height: 20px !important;
                max-height: 20px !important;
                line-height: 20px !important;
            }
        }
    `;
    document.head.appendChild(style);

    window.addEventListener('resize', adjustLabourContainer);
    window.onbeforeprint = prepareForPrint;
});