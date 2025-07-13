// ====================== DATA FETCH ======================
const tableData = JSON.parse(sessionStorage.getItem("userTableData")) || [];
const todayData = JSON.parse(sessionStorage.getItem("todayTableData")) || [];
const tomorrowData = JSON.parse(sessionStorage.getItem("tomorrowTableData")) || [];
const timeSlots = JSON.parse(sessionStorage.getItem("timeslots")) || [];
const formValues = JSON.parse(sessionStorage.getItem("form-values")) || [];
const remarksData = JSON.parse(sessionStorage.getItem("remarksData")) || [];
const eventsData = JSON.parse(sessionStorage.getItem("eventsData")) || [];

// ====================== LABOUR REPORT TABLE ======================
function populateLabourTable() {
  const tableData = JSON.parse(sessionStorage.getItem("userTableData")) || [];
  const columns = JSON.parse(sessionStorage.getItem("labourColumns")) || [
    "Mason", "Carp", "Fitter", "Electrical", "Painter", "Gypsum", "Plumber", "Helper", "Staff"
  ];

  const displayTable = document.getElementById("displayTable");
  if (!displayTable) return;

  displayTable.innerHTML = '';

  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");

  // Header Row
  const headerRow = document.createElement("tr");
  headerRow.innerHTML = `<th>Agency Name</th>`;
  columns.forEach(col => headerRow.innerHTML += `<th>${col}</th>`);
  headerRow.innerHTML += `<th>Total</th><th>Remarks</th>`;
  thead.appendChild(headerRow);

  // Data Rows
  tableData.forEach((row) => {
    const tr = document.createElement("tr");
    
    // Agency Name (first column)
    const agencyTd = document.createElement("td");
    agencyTd.textContent = row[0] || "--"; 
    agencyTd.style.textAlign = "left";
    tr.appendChild(agencyTd);
    
    // Labour counts (middle columns)
    for (let i = 1; i <= columns.length; i++) {
      const td = document.createElement("td");
      td.textContent = row[i] ?? "--";
      td.style.textAlign = "center";
      tr.appendChild(td);
    }
    
    // Total (second last column)
    const totalTd = document.createElement("td");
    // Calculate row total from labour counts (columns 1 to columns.length)
    let rowTotal = 0;
    for (let i = 1; i <= columns.length; i++) {
      rowTotal += parseInt(row[i]) || 0;
    }
    totalTd.textContent = rowTotal;
    totalTd.style.textAlign = "center";
    tr.appendChild(totalTd);
    
    // Remarks (last column)
    const remarksTd = document.createElement("td");
    remarksTd.textContent = row[row.length - 1] ?? "--"; // Last item is remarks
    remarksTd.style.textAlign = "left";
    tr.appendChild(remarksTd);
    
    tbody.appendChild(tr);
  });

  displayTable.appendChild(thead);
  displayTable.appendChild(tbody);

  // Calculate and display cumulative manpower
  displayCumulativeManpower();
}


// ====================== CUMULATIVE MANPOWER ======================
async function displayCumulativeManpower() {
  try {
    const project_id = localStorage.getItem("selected_project_id") || "1";
    
    // Calculate today's manpower from table data
    const tableData = JSON.parse(sessionStorage.getItem("userTableData")) || [];
    const columns = JSON.parse(sessionStorage.getItem("labourColumns")) || [];
    
    let todayManpower = 0;
    tableData.forEach(row => { // Exclude TOTAL row
      const rowTotal = parseInt(row[row.length - 2]) || 0; // Second last column is row total
      todayManpower += rowTotal;
    });

    // Get previous cumulative
    const previousCumulative = await getPreviousCumulativeManpower(project_id);
    console.log("Previous Cumulative:", previousCumulative);

    
    // Calculate new cumulative
    const cumulativeManpower = previousCumulative + todayManpower;
    
    // Display it
    document.getElementById("cumulative-manpower").textContent = cumulativeManpower;
    
    // Save for DPR generation
    sessionStorage.setItem("cumulativeManpower", cumulativeManpower.toString());
  } catch (error) {
    console.error("Error calculating cumulative manpower:", error);
    document.getElementById("cumulative-manpower").textContent = "N/A";
  }
}

async function getPreviousCumulativeManpower(projectId) {
  try {
    // Get latest approved DPR
    const response = await fetch(`http://34.47.131.237:3000/report/Alldpr/${projectId}?limit=1&approved=true`);
    const dprArray = await response.json();
    
    if (!dprArray.length) return 0;
    
    const latestDPR = dprArray[0];
    const dprDetails = await fetch(`http://34.47.131.237:3000/report/getDPR/${latestDPR.dpr_id}`);
    const dprData = await dprDetails.json();
    
    return dprData.data?.cumulative_manpower || 0;
  } catch (error) {
    console.error("Error fetching previous cumulative:", error);
    return 0;
  }
}

// ====================== TODAY/TOMORROW TABLES ======================
function populateProgressTables() {
  const todayTable = document.getElementById("today-table")?.querySelector("tbody");
  const tomorrowTable = document.getElementById("tomorrow-table")?.querySelector("tbody");

  if (todayTable) {
    todayTable.innerHTML = "";
    todayData.forEach(row => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row[0] || "--"}</td>
        <td>${row[1] || "--"}</td>
      `;
      todayTable.appendChild(tr);
    });
  }

  if (tomorrowTable) {
    tomorrowTable.innerHTML = "";
    tomorrowData.forEach(row => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row[0] || "--"}</td>
        <td>${row[1] || "--"}</td>
      `;
      tomorrowTable.appendChild(tr);
    });
  }
}

// ====================== SITE CONDITIONS ======================
function handleSiteConditions() {
  if (!Array.isArray(formValues)) return;

  // Clear all checkboxes first
  document.querySelectorAll('.condition-checkbox').forEach(checkbox => {
    checkbox.classList.remove("active");
    checkbox.textContent = "";
  });

  // Set active conditions
  if (formValues[0] === "Rainy") {
    document.getElementById("rainy-day-checkbox").classList.add("active");
    document.getElementById("rainy-day-checkbox").textContent = "✓";
  } else if (formValues[0] === "Sunny") {
    document.getElementById("normal-day-checkbox").classList.add("active");
    document.getElementById("normal-day-checkbox").textContent = "✓";
  }

  if (formValues[1] === "slushy") {
    document.getElementById("slushy-day-checkbox").classList.add("active");
    document.getElementById("slushy-day-checkbox").textContent = "✓";
  } else if (formValues[1] === "dry") {
    document.getElementById("dry-day-checkbox").classList.add("active");
    document.getElementById("dry-day-checkbox").textContent = "✓";
  }
}

// ====================== TIME SLOTS ======================
function displayTimeSlots() {
  const container = document.getElementById("from-to-container");
  if (!container) return;

  container.innerHTML = "";
  
  timeSlots.forEach(slot => {
    const timeSlotDiv = document.createElement("div");
    timeSlotDiv.style.display = "grid";
    timeSlotDiv.style.gridTemplateColumns = "1fr 1fr";
    timeSlotDiv.style.gap = "15px";
    
    timeSlotDiv.innerHTML = `
      <div>
        <div class="info-label">From</div>
        <div class="info-value">${slot.from || "--"}</div>
      </div>
      <div>
        <div class="info-label">To</div>
        <div class="info-value">${slot.to || "--"}</div>
      </div>
    `;
    container.appendChild(timeSlotDiv);
  });
}

// ====================== EVENTS & REMARKS ======================
function displayEventsAndRemarks() {
  const eventsContainer = document.getElementById("events-container");
  const remarksContainer = document.getElementById("remarks-content-container");

  if (eventsContainer) {
    eventsContainer.innerHTML = "";
    const eventsCount = Math.max(eventsData.length, 6); // Minimum 6 events
    for (let i = 0; i < eventsCount; i++) {
      const div = document.createElement("div");
      div.className = "remarks-item";
      div.textContent = eventsData[i] || "--";
      eventsContainer.appendChild(div);
    }
  }

  if (remarksContainer) {
    remarksContainer.innerHTML = "";
    const remarksCount = Math.max(remarksData.length, 3); // Minimum 3 remarks
    for (let i = 0; i < remarksCount; i++) {
      const div = document.createElement("div");
      div.className = "remarks-item";
      div.textContent = remarksData[i] || "--";
      remarksContainer.appendChild(div);
    }
  }
}

// ====================== PROJECT DETAILS ======================
async function fetchProjectDetails() {
  try {
    const project_id = localStorage.getItem("selected_project_id") || "1";
    const response = await fetch(`http://34.47.131.237:3000/project/getProject/${project_id}`);
    const projectData = await response.json();
    
    // Populate project details
    document.getElementById("project_name").textContent = projectData.data.project_name || "--";
    document.getElementById("Employer").textContent = projectData.data.Employer || "--";
    document.getElementById("contract_no").textContent = projectData.data.contract_no || "--";
    document.getElementById("location").textContent = projectData.data.location || "--";
    document.getElementById("start_date").textContent = formatDate(projectData.data.start_date) || "--";
    document.getElementById("completion_date").textContent = formatDate(projectData.data.end_date) || "--";

    // Calculate days
    if (projectData.data.start_date && projectData.data.end_date) {
      const startDate = new Date(projectData.data.start_date);
      const endDate = new Date(projectData.data.end_date);
      const today = new Date();
      
      const totalDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
      const elapsedDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
      const remainingDays = totalDays - elapsedDays;

      document.getElementById("total").textContent = totalDays;
      document.getElementById("balance-left").textContent = remainingDays > 0 ? remainingDays : 0;
    }
  } catch (error) {
    console.error("Error fetching project details:", error);
    // Set default values
    document.getElementById("project_name").textContent = "--";
    document.getElementById("Employer").textContent = "--";
    document.getElementById("contract_no").textContent = "--";
    document.getElementById("location").textContent = "--";
    document.getElementById("start_date").textContent = "--";
    document.getElementById("completion_date").textContent = "--";
    document.getElementById("total").textContent = "--";
    document.getElementById("balance-left").textContent = "--";
  }
}

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB"); // DD/MM/YYYY format
}

// ====================== INITIALIZATION ======================
document.addEventListener("DOMContentLoaded", async () => {
  const today = new Date();
  document.getElementById("report_date").textContent = today.toLocaleDateString("en-GB");

  await fetchProjectDetails();
  populateLabourTable();
  populateProgressTables();
  handleSiteConditions();
  displayTimeSlots();
  displayEventsAndRemarks();
});

// ====================== DPR GENERATION ======================
async function generateCompleteDPRObject() {
  const project_id = localStorage.getItem("selected_project_id") || "1";
  
  // Get all raw data
  const tableData = JSON.parse(sessionStorage.getItem("userTableData")) || [];
  const todayData = JSON.parse(sessionStorage.getItem("todayTableData")) || [];
  const tomorrowData = JSON.parse(sessionStorage.getItem("tomorrowTableData")) || [];
  const formValues = JSON.parse(sessionStorage.getItem("form-values")) || [];
  const timeSlots = JSON.parse(sessionStorage.getItem("timeslots")) || [];
  const remarksData = JSON.parse(sessionStorage.getItem("remarksData")) || [];
  const eventsData = JSON.parse(sessionStorage.getItem("eventsData")) || [];
  const cumulativeManpower = parseInt(sessionStorage.getItem("cumulativeManpower")) || 0;

  // Process LABOR data
  const labourColumns = JSON.parse(sessionStorage.getItem("labourColumns")) || [];
  const filteredData = [...tableData];

  const transformedData = {
    agency: filteredData.map(row => row[0] || "--"),
    remarks: filteredData.map(row => row[row.length - 1] || "--")
  };

  labourColumns.forEach((col, colIndex) => {
    transformedData[col.toLowerCase()] = filteredData.map(row => parseInt(row[colIndex + 1]) || 0);
  });

  // Format time slots
  const formattedSlots = timeSlots.map(slot => {
    if (typeof slot === 'object') {
      return `${slot.from || "--"}-${slot.to || "--"}`;
    }
    return slot;
  });

  return {
    project_id: project_id,
    report_date: new Date().toISOString().split("T")[0],
    site_condition: {
      is_rainy: formValues[0] === "Rainy",
      ground_state: formValues[1] || "Unknown",
      rain_timing: formattedSlots || "No time slots available",
    },
    labour_report: transformedData,
    cumulative_manpower: cumulativeManpower,
    today_prog: {
      progress: todayData.map((row) => row[0] || "--") || [],
      qty: todayData.map((row) => row[1] || "--") || [],
    },
    tomorrow_plan: {
      plan: tomorrowData.map((row) => row[0] || "--") || [],
      qty: tomorrowData.map((row) => row[1] || "--") || [],
    },
    user_roles: {
      created_by: 1,
      approvals: { 1: true, 3: false },
      viewers: [10, 11, 15],
      editors: [1, 3, 4],
    },
    report_footer: {
      events_visit: eventsData || [],
      distribute: ["L&T", "MAPLANI"],
      prepared_by: "Mano Project Pvt. Ltd.",
      bottom_remarks: remarksData || []
    },
  };
}

async function postDPRToBackend() {
  const dprData = await generateCompleteDPRObject();
  // console.log(JSON.stringify(dprData, null, 2)); // Pretty print

  fetch("http://34.47.131.237:3000/report/insertDPR", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dprData),
  })
    .then((response) => {
      if (!response.ok) {
        return response.text().then((text) => {
          throw new Error(`Upload failed: ${text}`);
        });
      }
      return response.json();
    })
    .then((result) => {
      console.log("Uploaded:", result);
      alert("DPR uploaded successfully!");
    })
    .catch((err) => {
      console.error("Error:", err);
      alert("Error uploading DPR: " + err.message);
    });
}

const dprData = generateCompleteDPRObject();