async function fetchProjectData() {
  const response = await fetch('http://34.47.131.237:3000/project/getProject/1');
  const apiData = await response.json();
  sessionStorage.setItem('apiProjectData', JSON.stringify(apiData.data));
  updateProjectUI(apiData.data);
}



// ====================== UTILITY FUNCTIONS ======================
function showLoadingIndicator() {
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'loading-indicator';
  loadingDiv.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; padding: 20px;">
      <div class="spinner" style="margin-right: 10px;"></div>
      <span>project data unavilable...</span>
    </div>
  `;
  
  const style = document.createElement('style');
  style.textContent = `
    .spinner {
      border: 3px solid rgba(0, 0, 0, 0.1);
      border-radius: 50%;
      border-top: 3px solid #3498db;
      width: 20px;
      height: 20px;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
  
  const dashboard = document.querySelector('.dashboard');
  if (dashboard) {
    dashboard.insertBefore(loadingDiv, dashboard.firstChild);
  }
  
  return loadingDiv;
}

function hideLoadingIndicator(loadingDiv) {
  if (loadingDiv && loadingDiv.parentNode) {
    loadingDiv.parentNode.removeChild(loadingDiv);
  }
}

function showErrorToUser(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  errorDiv.style.color = 'red';
  errorDiv.style.padding = '10px';
  errorDiv.style.margin = '10px 0';
  errorDiv.style.border = '1px solid red';
  
  const dashboard = document.querySelector('.dashboard');
  if (dashboard) {
    dashboard.insertBefore(errorDiv, dashboard.firstChild);
  }
  
  document.getElementById("project_name").textContent = "DATA UNAVAILABLE";
  document.getElementById("project_name").classList.add("error_state");
}

async function fetchWithRetry(url, options = {}, retries = 3, delay = 1000) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying... ${retries} attempts left`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return await fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
}

// ====================== DATA FETCH ======================
const tableData = JSON.parse(sessionStorage.getItem("userTableData")) || [];
const todayData = JSON.parse(sessionStorage.getItem("todayTableData")) || [];
const tomorrowData = JSON.parse(sessionStorage.getItem("tomorrowTableData")) || [];

const displayTable = document.getElementById("displayTable")?.getElementsByTagName("tbody")[0];
const todayTable = document.getElementById("today-table")?.getElementsByTagName("tbody")[0];
const tomorrowTable = document.getElementById("tomorrow-table")?.getElementsByTagName("tbody")[0];

// ====================== TABLE POPULATION ======================
function populateTable(data, tbody, isProgress = false) {
  if (!data || !tbody) return;

  tbody.innerHTML = "";

  data.forEach((row) => {
    const tr = document.createElement("tr");
    row.forEach((cell, index) => {
      const td = document.createElement("td");
      td.textContent = cell || "--";
      if (index === 0 || isProgress) {
        td.style.textAlign = "left";
      } else {
        td.style.textAlign = "center";
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

// ====================== FORM HANDLERS ======================
function handleFormData() {
  const data = JSON.parse(sessionStorage.getItem("form-values"));
  if (!Array.isArray(data)) return;

  if (data[0] === "Rainy") {
    document.getElementById("rainy-day-checkbox").classList.add("active");
    document.getElementById("rainy-day-checkbox").textContent = "✓";
  }
  if (data[0] === "Sunny") {
    document.getElementById("normal-day-checkbox").classList.add("active");
    document.getElementById("normal-day-checkbox").textContent = "✓";
  }
  if (data[1] === "slushy") {
    document.getElementById("slushy-day-checkbox").classList.add("active");
    document.getElementById("slushy-day-checkbox").textContent = "✓";
  }
  if (data[1] === "dry") {
    document.getElementById("dry-day-checkbox").classList.add("active");
    document.getElementById("dry-day-checkbox").textContent = "✓";
  }
}

function handleTimeSlots() {
  try {
    const timingContainer = document.getElementById("from-to-container");
    if (!timingContainer) return;

    timingContainer.innerHTML = "";
    
    // Get timeslots from either API data or session storage
    let timeSlots = [];
    const apiData = JSON.parse(sessionStorage.getItem('apiProjectData'));
    const sessionSlots = JSON.parse(sessionStorage.getItem('timeslots')) || [];
    
    if (apiData?.site_condition?.rain_timing) {
      timeSlots = apiData.site_condition.rain_timing;
    } else if (sessionSlots.length) {
      timeSlots = sessionSlots;
    }

    timeSlots.forEach(t => {
      let from, to;
      if (typeof t === 'string') {
        [from, to] = t.split('-');
      } else if (t.from && t.to) {
        from = t.from;
        to = t.to;
      } else {
        from = to = "--";
      }

      const timeSlotDiv = document.createElement("div");
      timeSlotDiv.style.display = "flex";
      timeSlotDiv.style.justifyContent = "space-between";
      timeSlotDiv.style.marginBottom = "5px";

      const fromDiv = document.createElement("div");
      fromDiv.innerHTML = `From: <span>${from || "--"}</span>`;
      
      const toDiv = document.createElement("div");
      toDiv.innerHTML = `To: <span>${to || "--"}</span>`;

      timeSlotDiv.appendChild(fromDiv);
      timeSlotDiv.appendChild(toDiv);
      timingContainer.appendChild(timeSlotDiv);
    });
  } catch (error) {
    console.error("Error handling timeslots:", error);
  }
}

function handleEvents() {
  const container = document.getElementById("events-container");
  if (!container) return;

  const data = JSON.parse(sessionStorage.getItem("eventsData")) || [];
  container.innerHTML = "";

  const count = Math.max(data.length, 6);
  for (let i = 0; i < count; i++) {
    const div = document.createElement("div");
    div.className = "remarks-item";
    div.textContent = data[i] || "--";
    container.appendChild(div);
  }
}

function handleRemarks() {
  const container = document.getElementById("remarks-content-container");
  if (!container) return;

  const data = JSON.parse(sessionStorage.getItem("remarksData")) || [];
  container.innerHTML = "";

  const count = Math.max(data.length, 3);
  for (let i = 0; i < count; i++) {
    const div = document.createElement("div");
    div.className = "remarks-item";
    div.textContent = data[i] || "--";
    container.appendChild(div);
  }
}

// ====================== API DATA FETCHING ======================
async function fetchAndDisplayDPR(dprId = 17) {  // Default ID is 17
  try {
    const response = await fetch(`http://34.47.131.237:3000/report/getDPR/${dprId}`);
    const { data } = await response.json();
    
    // Site Condition
    // const { site_condition } = data;
    // document.getElementById("rainy-day-checkbox").classList.toggle("active", site_condition.is_rainy);
    // document.getElementById("normal-day-checkbox").classList.toggle("active", !site_condition.is_rainy);
    // if (site_condition.ground_state === "slushy") {
    //   document.getElementById("slushy-day-checkbox").classList.add("active");
    // } 
    // if (site_condition.ground_state === "dry") {
    //   document.getElementById("dry-day-checkbox").classList.add("active");
    // }

    // // Rain Timings
    // const timingContainer = document.getElementById("from-to-container");
    // timingContainer.innerHTML = "";
    // (site_condition.rain_timing || []).forEach(t => {
    //   const [from, to] = t.split("-");
    //   const div = document.createElement("div");
    //   div.innerHTML = `
    //     <div class="info-label">From</div><div class="info-value">${from}</div>
    //     <div class="info-label">To</div><div class="info-value">${to}</div>
    //   `;
    //   timingContainer.appendChild(div);
    // });

    // Labour Report
    const labour = data.labour_report;
    const tbody = document.getElementById("displayTable").getElementsByTagName("tbody")[0];
    tbody.innerHTML = "";
    for (let i = 0; i < labour.agency.length; i++) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${labour.agency[i]}</td>
        <td>${labour.mason[i]}</td>
        <td>${labour.carp[i]}</td>
        <td>${labour.fitter[i]}</td>
        <td>${labour.electrical[i]}</td>
        <td>${labour.painter[i]}</td>
        <td>${labour.gypsum[i]}</td>
        <td>${labour.plumber[i]}</td>
        <td>${labour.helper[i]}</td>
        <td>${labour.staff[i]}</td>
        <td>${
          labour.helper[i] + labour.staff[i] + labour.mason[i] + 
          labour.carp[i] + labour.fitter[i] + labour.electrical[i] + 
          labour.painter[i] + labour.gypsum[i] + labour.plumber[i]
        }</td>
        <td>${labour.remarks || "--"}</td>
      `;
      tbody.appendChild(tr);
    }

    // Progress Data
    populateTable(
      data.today_prog.progress.map((p, i) => [p, data.today_prog.qty[i]]),
      todayTable,
      true
    );
    populateTable(
      data.tomorrow_plan.plan.map((p, i) => [p, data.tomorrow_plan.qty[i]]),
      tomorrowTable,
      true
    );

    // Events
    const eventsContainer = document.getElementById("events-container");
    eventsContainer.innerHTML = "";
    (data.report_footer.events_visit || []).forEach(event => {
      const div = document.createElement("div");
      div.className = "remarks-item";
      div.textContent = event;
      eventsContainer.appendChild(div);
    });

    // Remarks
    document.getElementById("remarks-content-container").innerHTML = `
      <div class="remarks-item">${labour.remarks || "--"}</div>
    `;

    // Footer
    document.getElementById("prepared-by").textContent = data.report_footer.prepared_by;
    document.getElementById("distribution").textContent = data.report_footer.distribute.join(", ");

    // Date
    document.getElementById("report_date").textContent = new Date(data.report_date).toLocaleDateString("en-GB");

  } catch (err) {
    console.error("Error fetching DPR:", err);
  }
}
function updateProjectUI(projectData) {
  document.getElementById("project_name").textContent = projectData.project_name || "--";
  document.getElementById("Employer").textContent = projectData.Employer || "--";
  document.getElementById("contract_no").textContent = projectData.contract_no || "--";
  document.getElementById("location").textContent = projectData.location || "--";
  
  if (projectData.start_date) {
    document.getElementById("start_date").textContent = 
      new Date(projectData.start_date).toLocaleDateString('en-GB');
  }
  
  if (projectData.start_date && projectData.completion_date) {
    const startDate = new Date(projectData.start_date);
    const completionDate = new Date(projectData.completion_date);
    const today = new Date();
    
    const totalDays = Math.round((completionDate - startDate) / (1000 * 60 * 60 * 24));
    const daysPassed = Math.round((today - startDate) / (1000 * 60 * 60 * 24));
    const daysRemaining = totalDays - daysPassed;
    
    document.getElementById("completion_date").textContent = 
      completionDate.toLocaleDateString('en-GB');
    document.getElementById("total").textContent = totalDays;
    document.getElementById("balance-left").textContent = 
      daysRemaining > 0 ? daysRemaining : 0;
  }
}

async function fetchAndDisplayDPR(dprId = 17) {
  try {
    
    const { data } = await fetchWithRetry(`http://34.47.131.237:3000/report/getDPR/${dprId}`);
    
        // Site Condition - Updated checkbox handling
    const { site_condition } = data;
    
    // Clear all checkboxes first
    document.querySelectorAll('.condition-checkbox').forEach(checkbox => {
      checkbox.style.backgroundColor = "";
      checkbox.textContent = "";
    });

    // Set active checkboxes
    if (site_condition.is_rainy) {
      const checkbox = document.getElementById("rainy-day-checkbox");
      checkbox.style.backgroundColor = "green";
      checkbox.textContent = "✓";
      checkbox.style.color = "white";
    } else {
      const checkbox = document.getElementById("normal-day-checkbox");
      checkbox.style.backgroundColor = "green";
      checkbox.textContent = "✓";
      checkbox.style.color = "white";
    }
    
    if (site_condition.ground_state === "slushy") {
      const checkbox = document.getElementById("slushy-day-checkbox");
      checkbox.style.backgroundColor = "green";
      checkbox.textContent = "✓";
      checkbox.style.color = "white";
    } else if (site_condition.ground_state === "dry") {
      const checkbox = document.getElementById("dry-day-checkbox");
      checkbox.style.backgroundColor = "green";
      checkbox.textContent = "✓";
      checkbox.style.color = "white";
    }
    // Rain Timings
    const timingContainer = document.getElementById("from-to-container");
    timingContainer.innerHTML = "";
    (site_condition.rain_timing || []).forEach((t) => {
      const [from, to] = t.split("-");
      const div = document.createElement("div");
      div.innerHTML = `
        <div class="info-label">From</div><div class="info-value">${from}</div>
        <div class="info-label">To</div><div class="info-value">${to}</div>
      `;
      timingContainer.appendChild(div);
    });

    // Labour Report
    const labour = data.labour_report;
    const tbody = document.getElementById("displayTable").getElementsByTagName("tbody")[0];
    tbody.innerHTML = "";

    for (let i = 0; i < labour.agency.length; i++) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${labour.agency[i]}</td>
        <td>${labour.mason[i]}</td>
        <td>${labour.carp[i]}</td>
        <td>${labour.fitter[i]}</td>
        <td>${labour.electrical[i]}</td>
        <td>${labour.painter[i]}</td>
        <td>${labour.gypsum[i]}</td>
        <td>${labour.plumber[i]}</td>
        <td>${labour.helper[i]}</td>
        <td>${labour.staff[i]}</td>
        <td>${
          labour.helper[i] +
          labour.staff[i] +
          labour.mason[i] +
          labour.carp[i] +
          labour.fitter[i] +
          labour.electrical[i] +
          labour.painter[i] +
          labour.gypsum[i] +
          labour.plumber[i]
        }</td>
        <td>${labour.remarks || "--"}</td>
      `;
      tbody.appendChild(tr);
    }

    // Progress Data
    populateTable(
      data.today_prog.progress.map((p, i) => [p, data.today_prog.qty[i]]),
      todayTable,
      true
    );

    populateTable(
      data.tomorrow_plan.plan.map((p, i) => [p, data.tomorrow_plan.qty[i]]),
      tomorrowTable,
      true
    );

    // Events
    const eventsContainer = document.getElementById("events-container");
    eventsContainer.innerHTML = "";
    (data.report_footer.events_visit || []).forEach((event) => {
      const div = document.createElement("div");
      div.className = "remarks-item";
      div.textContent = event;
      eventsContainer.appendChild(div);
    });

    // Remarks
    const remarksContainer = document.getElementById("remarks-content-container");
    remarksContainer.innerHTML = "";
    const remarkDiv = document.createElement("div");
    remarkDiv.className = "remarks-item";
    remarkDiv.textContent = labour.remarks || "--";
    remarksContainer.appendChild(remarkDiv);

    // Footer
    document.getElementById("prepared-by").textContent =
      data.report_footer.prepared_by;
    document.getElementById("distribution").textContent =
      data.report_footer.distribute.join(", ");

    // Date
    document.getElementById("report_date").textContent = new Date(
      data.report_date
    ).toLocaleDateString("en-GB");

  } catch (err) {
    console.error("Error fetching DPR:", err);
    showErrorToUser("Failed to load DPR data. Please try again.");
  }
}

// ====================== PDF PREVIEW ======================
// ====================== PDF PREVIEW ======================
function prepareForPDFPreview() {
  try {
    // Get the DPR ID from the current page or use a default
    const dprId = getCurrentDPRId() || 17; // Default to 17 if not found
    
    // Get all data from session storage
    const formValues = JSON.parse(sessionStorage.getItem('form-values')) || [];
    const timeSlots = JSON.parse(sessionStorage.getItem('timeslots')) || [];
    const apiData = JSON.parse(sessionStorage.getItem('apiProjectData')) || {};
    const tableData = JSON.parse(sessionStorage.getItem('userTableData')) || [];
    const todayData = JSON.parse(sessionStorage.getItem('todayTableData')) || [];
    const tomorrowData = JSON.parse(sessionStorage.getItem('tomorrowTableData')) || [];
    const eventsData = JSON.parse(sessionStorage.getItem('eventsData')) || [];
    const remarksData = JSON.parse(sessionStorage.getItem('remarksData')) || [];

    // Convert timeslots to consistent format
    const formattedTimeSlots = timeSlots.map(slot => {
      if (typeof slot === 'string') {
        return slot;
      } else if (slot.from && slot.to) {
        return `${slot.from}-${slot.to}`;
      }
      return "--:--";
    });

    // Prepare labour report data with proper structure
    const labourData = {
      table_data: tableData.length > 0 ? tableData : [
        ["--", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "--"]
      ],
      cumulative_manpower: calculateCumulativeManpower(tableData) || "0"
    };

    // Get dates with proper formatting
    const reportDate = document.getElementById('report_date').textContent || new Date().toLocaleDateString('en-GB');
    const startDate = apiData.start_date ? new Date(apiData.start_date).toLocaleDateString('en-GB') : "--";
    const completionDate = apiData.completion_date ? new Date(apiData.completion_date).toLocaleDateString('en-GB') : "--";

    // Prepare complete project data object with all required fields
    const projectData = {
      // Project Information (matching PDF expectations)
      project_name: apiData.project_name || "--",
      Employer: apiData.Employer || "--",
      contract_no: apiData.contract_no || "--",
      location: apiData.location || "--",
      start_date: startDate,
      completion_date: completionDate,
      total_days: document.getElementById('total').textContent || "--",
      days_remaining: document.getElementById('balance-left').textContent || "--",
      report_date: reportDate,

      // Site Conditions (must match checkbox IDs in PDF)
      site_conditions: {
        normal_day: formValues[0] === "Sunny",
        rainy_day: formValues[0] === "Rainy",
        slushy_day: formValues[1] === "slushy",
        dry_day: formValues[1] === "dry",
        time_slots: formattedTimeSlots.length > 0 ? formattedTimeSlots : ["--:--"]
      },

      // Labour Report (must match table structure in PDF)
      labour_data: labourData,

      // Progress Data (ensure array structure)
      today_progress: todayData.length > 0 ? todayData : [["--", "--"]],
      tomorrow_planning: tomorrowData.length > 0 ? tomorrowData : [["--", "--"]],

      // Events and Remarks (ensure arrays)
      events_remarks: eventsData.length > 0 ? eventsData : ["--"],
      general_remarks: remarksData.length > 0 ? remarksData : ["--"],

      // Signatures
      prepared_by: document.getElementById('prepared-by').textContent || "MANO PCPL",
      approved_by: document.getElementById('distribution').textContent || "GOYAL",

      // Include the DPR ID for API reference
      dpr_id: dprId
    };

    console.log("Prepared PDF data:", projectData); // Debug log

    // Store for PDF preview
    sessionStorage.setItem('pdfPreviewData', JSON.stringify(projectData));
    
    // Redirect to PDF page with the DPR ID as a URL parameter
    window.location.href = `dpr1-pdf.html?id=${dprId}`;
  } catch (error) {
    console.error("Error preparing PDF preview:", error);
    alert("Failed to prepare PDF preview. Please check console for details.");
  }
}

// Helper function to get current DPR ID
function getCurrentDPRId() {
  // Try to get from URL first
  const urlParams = new URLSearchParams(window.location.search);
  const urlId = urlParams.get('id');
  if (urlId) return urlId;
  
  // Try to get from session storage
  const storedData = JSON.parse(sessionStorage.getItem('pdfPreviewData'));
  if (storedData?.dpr_id) return storedData.dpr_id;
  
  // Try to get from API data if available
  const apiData = JSON.parse(sessionStorage.getItem('apiProjectData'));
  if (apiData?.dpr_id) return apiData.dpr_id;
  
  return null; // Return null if no ID found
}

// Helper function to calculate cumulative manpower
function calculateCumulativeManpower(tableData) {
  try {
    return tableData.reduce((total, row) => {
      const rowTotal = parseInt(row[10]) || 0;
      return total + rowTotal;
    }, 0);
  } catch (error) {
    console.error("Error calculating cumulative manpower:", error);
    return 0;
  }
}
// ====================== INITIALIZATION ======================
// Update the initialization to properly handle API data
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // First try to load from API
    await fetchProjectData();
    await fetchAndDisplayDPR();
    
    // Then fall back to session data if API fails
    if (!sessionStorage.getItem('apiProjectData')) {
      populateTable(tableData, displayTable);
      populateTable(todayData, todayTable, true);
      populateTable(tomorrowData, tomorrowTable, true);
      handleFormData();
      handleTimeSlots();
    }
    
    handleEvents();
    handleRemarks();
  } catch (error) {
    console.error("Initialization error:", error);
    // Fallback to session data
    populateTable(tableData, displayTable);
    populateTable(todayData, todayTable, true);
    populateTable(tomorrowData, tomorrowTable, true);
    handleFormData();
    handleTimeSlots();
    handleEvents();
    handleRemarks();
  }
});
// Make functions available globally
window.prepareForPDFPreview = prepareForPDFPreview;