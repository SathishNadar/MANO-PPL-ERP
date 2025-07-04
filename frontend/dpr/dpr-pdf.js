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
      progress: todayData.map(row => row[0] || "--"),  // Task column
      qty: todayData.map(row => row[1] || "--")       // Qty column
    },
    tomorrow_plan: {
      plan: tomorrowData.map(row => row[0] || "--"),
      qty: tomorrowData.map(row => row[1] || "--")
    }
  };
}


//-------------------------------------------------fetching the data from backend directly into the PDF format----------------------------------//
fetch('http://34.47.131.237:3000/project/getProject/1')
  .then(response => {
    if (!response.ok) {
      document.getElementById("project_name").textContent = "DATA UNAVAILABLE";
      document.getElementById("project_name").classList.add = "error_state";

      return Promise.reject(new Error('Project not found'));
      
    }
    return response.json(); // Parse JSON response
  })
  .then(Apidata => {
    sessionStorage.setItem('apiProjectData', JSON.stringify(Apidata.data));//to store the values to later on upload to backend//
    document.getElementById("project_name").innerHTML = Apidata.data.project_name;
    document.getElementById("Employer").innerHTML = Apidata.data.Employer;
    document.getElementById("contract_no").innerHTML = Apidata.data.contract_no;
    document.getElementById("location").innerHTML = Apidata.data.location;
    document.getElementById("start_date").innerHTML = new Date(Apidata.data.start_date).toLocaleDateString('en-GB');

    const completeReport = generateCompleteDPRObject();
    console.log(JSON.stringify(completeReport, null, 2));
  })
  .catch(error => {
    console.error('Error:', error);
  });



  //-------------------------------TO format THESE DATA TO MATCH THE OBJECT ALREADY EXISTING IN BACKEND------------------------------------------//
function generateCompleteDPRObject() {
const apiData = JSON.parse(sessionStorage.getItem('apiProjectData')) || {};


  // 1. Get all raw data
  const tableData = JSON.parse(sessionStorage.getItem('userTableData')) || [];
  const todayData = JSON.parse(sessionStorage.getItem('todayTableData')) || [];
  const tomorrowData = JSON.parse(sessionStorage.getItem('tomorrowTableData')) || [];
  const formValues = JSON.parse(sessionStorage.getItem('form-values')) || [];
  // const timeSlots = JSON.parse(sessionStorage.getItem('timeslots')) || [];
  // const remarksData = JSON.parse(sessionStorage.getItem('remarksData')) || []; //-----THAT FINAL BOTTOM REGION REMARKS-----//
  // 2. Process LABOR exactly as you need it
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
    // Total_column_wise: tableData.map(row => parseInt(row[10]) || 0),  total column wise!!!!
    // Bonus: Auto-calculated totals
    // totals: {//---------------might need or not needed later on-----------------------//
    //   mason: tableData.reduce((sum, row) => sum + (parseInt(row[1]) || 0), 0) /2,
    //   carp: tableData.reduce((sum, row) => sum + (parseInt(row[2]) || 0), 0) /2,
    //   // Add other trades if needed
    // }
  };

  // 3. Build the COMPLETE DPR object
  return {
    project_id : 66,
    report_date:"2004-10-10",

    // A. Project Info (from API)
    // project_info: {
      
    //   project_name: apiData.project_name || "N/A",
    //   employer: apiData.Employer || "N/A",
    //   contract_no: apiData.contract_no || "N/A",
    //   location: apiData.location || "N/A",
    //   start_date: apiData.start_date ? new Date(apiData.start_date).toLocaleDateString('en-GB') : "N/A",
    // },

    // B. Site Conditions
    site_condition: {
      is_rainy: formValues[0] ==="Rainy",
      ground_state: formValues[1] || "Unknown",
      rain_timing: formattedSlots || "No time slots available"
    },

    // C. Labor (your exact format!)
    
    labour_report: labour_report,

    // D. Progress Data
    today_prog: {
      progress: todayData.map(row => row[0] || "--"),  // Task column
      qty: todayData.map(row => row[1] || "--")       // Qty column
    },
    tomorrow_plan: {
      plan: tomorrowData.map(row => row[0] || "--"),
      qty: tomorrowData.map(row => row[1] || "--")
    },

  
    user_roles: {
    created_by: 1,
    approvals: {
      1: true,
      3: false
    },
    viewers: [10, 11, 15],
    editors: [1, 3, 4]
  },
  report_footer: {
    events_visit: [], 
    distribute: ["L&T", "MAPLANI"],
    prepared_by: "Mano Project Pvt. Ltd."
  },
  created_at: "2025-01-19 12:00:00"
}
  };



//---------------------------------TO UPLOAD THE DATA TO BACKEND UISING POST METHOD---------------------------//
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
    console.log("Uploaded:", result);
  })
  .catch(err => {
    console.error("Error:", err);
  });
}




// dpr-pdf.js - Complete File

document.addEventListener("DOMContentLoaded", () => {
const pdfData = JSON.parse(sessionStorage.getItem('pdfPreviewData'));
    
    if (pdfData) {
        // Project Information
        document.getElementById("project_name").textContent = pdfData.project_name || "--";
        document.getElementById("Employer").textContent = pdfData.Employer || "--";
        document.getElementById("contract_no").textContent = pdfData.contract_no || "--";
        document.getElementById("location").textContent = pdfData.location || "--";
        document.getElementById("start_date").textContent = pdfData.start_date || "--";
        document.getElementById("completion_date").textContent = pdfData.completion_date || "--";
        
        // Duration and Days Remaining
        if (document.querySelector(".total-value")) {
            document.querySelector(".total-value").textContent = pdfData.total_days || "--";
        }
        if (document.querySelector(".balance-right")) {
            document.querySelector(".balance-right").textContent = pdfData.days_remaining || "--";
        }
        if (document.querySelector(".daily-progress-report-table tr:nth-child(2) td:nth-child(2)")) {
            document.querySelector(".daily-progress-report-table tr:nth-child(2) td:nth-child(2)").textContent = 
                pdfData.report_date || "--";
        }

        // Site Conditions
        if (pdfData.site_conditions) {
            const setCheckboxState = (id, isActive) => {
                const element = document.getElementById(id);
                if (element) {
                    element.style.backgroundColor = isActive ? "green" : "";
                    element.textContent = isActive ? "✓" : "";
                }
            };
            
            setCheckboxState("normal-day-checkbox", pdfData.site_conditions.normal_day);
            setCheckboxState("rainy-day-checkbox", pdfData.site_conditions.rainy_day);
            setCheckboxState("slushy-day-checkbox", pdfData.site_conditions.slushy_day);
            setCheckboxState("dry-day-checkbox", pdfData.site_conditions.dry_day);

            // Time Slots
            const timeSlotsContainer = document.querySelector(".from-to");
            if (timeSlotsContainer && pdfData.site_conditions.time_slots) {
                timeSlotsContainer.innerHTML = pdfData.site_conditions.time_slots
                    .map(slot => {
                        const [from, to] = slot.split('-');
                        return `
                            <tr>
                                <td>From: <span>${from || "--"}</span></td>
                                <td>To: <span>${to || "--"}</span></td>
                            </tr>
                        `;
                    })
                    .join('');
            }
        }
        // Labour Report
        const labourTable = document.getElementById('displayTable');
        if (labourTable && pdfData.labour_data && pdfData.labour_data.table_data) {
            const tbody = labourTable.querySelector('tbody') || labourTable.createTBody();
            tbody.innerHTML = pdfData.labour_data.table_data
                .map(row => `<tr>${row.map(cell => `<td>${cell || "--"}</td>`).join('')}</tr>`)
                .join('');
            
            // Cumulative Manpower
            if (pdfData.labour_data.cumulative_manpower) {
                const cumulativeElement = document.querySelector('.commulative');
                if (cumulativeElement) {
                    cumulativeElement.textContent = `Cumulative man power upto last date: ${pdfData.labour_data.cumulative_manpower}`;
                }
            }
        }

        // Progress Tables
        populateTableFromData('#today-table', pdfData.today_progress);
        populateTableFromData('#tomorrow-table', pdfData.tomorrow_planning);

        // Remarks Sections
        if (pdfData.events_remarks) {
            populateRemarksSection('.events-container', pdfData.events_remarks, 'events-content');
        }
        if (pdfData.general_remarks) {
            populateRemarksSection('.remarks-content-container', pdfData.general_remarks, 'remarks-content');
        }

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
}

// Generate complete DPR object (for backend submission)
function generateCompleteDPRObject() {
    const pdfData = JSON.parse(sessionStorage.getItem('pdfPreviewData')) || {};
    const apiData = JSON.parse(sessionStorage.getItem('apiProjectData')) || {};

    return {
        project_id: parseInt(sessionStorage.getItem('projectId')) || 1,
        report_date: pdfData.report_date || new Date().toISOString().split('T')[0],
        
        site_condition: {
            ground_state: pdfData.site_conditions?.slushy_day ? "slushy" : 
                         pdfData.site_conditions?.dry_day ? "dry" : "normal",
            is_rainy: pdfData.site_conditions?.rainy_day || false,
            rain_timing: pdfData.site_conditions?.time_slots || []
        },
        
        labour_report: {
            agency: pdfData.labour_data?.table_data?.map(row => row[0]) || [],
            mason: pdfData.labour_data?.table_data?.map(row => parseInt(row[1]) || 0) || [],
            carp: pdfData.labour_data?.table_data?.map(row => parseInt(row[2]) || 0) || [],
            fitter: pdfData.labour_data?.table_data?.map(row => parseInt(row[3]) || 0) || [],
            electrical: pdfData.labour_data?.table_data?.map(row => parseInt(row[4]) || 0) || [],
            painter: pdfData.labour_data?.table_data?.map(row => parseInt(row[5]) || 0) || [],
            gypsum: pdfData.labour_data?.table_data?.map(row => parseInt(row[6]) || 0) || [],
            plumber: pdfData.labour_data?.table_data?.map(row => parseInt(row[7]) || 0) || [],
            helper: pdfData.labour_data?.table_data?.map(row => parseInt(row[8]) || 0) || [],
            staff: pdfData.labour_data?.table_data?.map(row => parseInt(row[9]) || 0) || [],
            remarks: pdfData.labour_data?.table_data?.map(row => row[11] || "") || []
        },
        
        today_prog: {
            progress: pdfData.today_progress?.map(row => row[0]) || [],
            qty: pdfData.today_progress?.map(row => row[1]) || []
        },
        
        tomorrow_plan: {
            plan: pdfData.tomorrow_planning?.map(row => row[0]) || [],
            qty: pdfData.tomorrow_planning?.map(row => row[1]) || []
        },
        
        user_roles: {
            created_by: 1,
            approvals: { 1: true, 3: false },
            viewers: [10, 11, 15],
            editors: [1, 3, 4]
        },
        
        report_footer: {
            events_visit: pdfData.events_remarks || [],
            distribute: ["L&T", "MAPLANI"],
            prepared_by: pdfData.prepared_by || "Mano Project Pvt. Ltd."
        },
        
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
}

// Post DPR to backend
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

// Make postDPRToBackend available globally
window.postDPRToBackend = postDPRToBackend;


console.log("single file");
