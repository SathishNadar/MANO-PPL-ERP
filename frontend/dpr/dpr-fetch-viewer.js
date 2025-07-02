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

  // Extract values safely
  const weather = data[0]; // "Rainy" or "Sunny"
  const groundState = data[1]; // "slushy" or "dry"

  // Reset all checkboxes first (optional if toggling state)
  const rainy = document.getElementById("rainy-day-checkbox");
  const normal = document.getElementById("normal-day-checkbox");
  const slushy = document.getElementById("slushy-day-checkbox");
  const dry = document.getElementById("dry-day-checkbox");

  // WEATHER SECTION
  if (weather === "Rainy" && rainy && normal) {
    rainy.classList.add("active");
    rainy.textContent = "✓";
    normal.style.display = "none"; // hide sunny checkbox
  }

  if (weather === "Sunny" && normal) {
    normal.classList.add("active");
    normal.textContent = "✓";
    normal.style.display = "inline-block"; // just in case it's hidden
  }

  // GROUND STATE SECTION
  if (groundState === "slushy" && slushy) {
    slushy.classList.add("active");
    slushy.textContent = "✓";
  }

  if (groundState === "dry" && dry) {
    dry.classList.add("active");
    dry.textContent = "✓";
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

  // Get remarks from session storage (fallback to empty array)
  const bottomRemarks = JSON.parse(sessionStorage.getItem('bottomRemarksData')) || [];
  const regularRemarks = JSON.parse(sessionStorage.getItem("remarksData")) || [];

  // Store in sessionStorage for other functions to use (OPTIONAL: this line might be unnecessary now)
  sessionStorage.setItem('bottomRemarksData', JSON.stringify(bottomRemarks));

  const remarksToDisplay = bottomRemarks.length ? bottomRemarks : regularRemarks;

  container.innerHTML = "";

  // Always show at least 3 items
  const count = Math.max(remarksToDisplay.length, 3);
  for (let i = 0; i < count; i++) {
    const div = document.createElement("div");
    div.className = "remarks-item";
    div.textContent = remarksToDisplay[i] || "--";
    container.appendChild(div);
  }
}


// ====================== API DATA FETCHING ======================
function updateProjectUI(projectData) {
  document.getElementById("project_name").textContent = projectData.project_name || "--";
  document.getElementById("Employer").textContent = projectData.Employer || "--";
  document.getElementById("contract_no").textContent = projectData.contract_no || "--";
  document.getElementById("location").textContent = projectData.location || "--";
  
if (projectData.start_date) {
  const startDate = new Date(projectData.start_date);
  document.getElementById("start_date").textContent = 
    startDate.toLocaleDateString('en-GB');
  
  if (projectData.end_date) {
    const endDate = new Date(projectData.end_date);
    document.getElementById("end_date").textContent = 
      endDate.toLocaleDateString('en-GB');
    
    // Calculate duration in days
    const timeDiff = endDate - startDate;
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    // Display the calculated duration
    document.getElementById("total_days").textContent = daysDiff;
    
    // Optional: Calculate working days (excluding weekends)
    // const workingDays = calculateWorkingDays(startDate, endDate);
    // document.getElementById("working_days").textContent = workingDays;

  }
 if (projectData.start_date && projectData.end_date) {
  const startDate = new Date(projectData.start_date);
  const endDate = new Date(projectData.end_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to midnight

  // Calculate total duration
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  
  // Calculate days remaining (never more than total duration)
  let daysRemaining;
  if (today < startDate) {
    daysRemaining = totalDays; // Project hasn't started yet
  } else if (today > endDate) {
    daysRemaining = 0; // Project completed
  } else {
    daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
  }

  document.getElementById("days_left").textContent = daysRemaining;
  document.getElementById("total_days").textContent = totalDays;
}
}
}


// async function fetchAndDisplayCumulativeManpower() {
//   try {
//     // Fetch project data (using your existing endpoint)
//     const response = await fetch('http://34.47.131.237:3000/project/getProject/1');
//     const { data } = await response.json();
    
//     // Get cumulative manpower (with fallback to 0 if undefined)
//     const cumulativeManpower = data.cumulative_manpower || 10;
    
//     // Display it - ensure you have an element with this ID in your HTML
//     const displayElement = document.getElementById('cumulative-manpower');
//     if (displayElement) {
//       displayElement.textContent = cumulativeManpower;
//     } else {
//       console.error('Element with ID "cumulative-manpower" not found');
//     }
    
//     return cumulativeManpower; // Optional: return the value if needed elsewhere
    
//   } catch (error) {
//     console.error('Failed to fetch cumulative manpower:', error);
//     // Fallback display if API fails
//     document.getElementById('cumulative-manpower').textContent = 'N/A';
//     return 0;
//   }
// }

// Usage (call when needed, e.g., on page load):
// fetchAndDisplayCumulativeManpower();

//-----------------------------to fetch and display the cummulative man power---------------------//
const dprId = getCurrentDPRId() || 45;
fetch(`http://34.47.131.237:3000/report/getDPR/${dprId}`)
  .then(response => response.json())
  .then(data => {
    // Get the value using the key
    const value = data.data?.cumulative_manpower;
    // Update the HTML element
    document.getElementById("cumulative-manpower").textContent = value ?? 'Value not found';
  })
  .catch(error => {
    console.error('Error fetching data:', error);
    document.getElementById("cumulative-manpower").textContent = 'Failed to load data';
  });

async function fetchAndDisplayDPR() {
  try {

    const dprId = getCurrentDPRId() || 45; // Fallback to 45 if no ID is found
    const response = await fetch(`http://34.47.131.237:3000/report/getDPR/${dprId}`);
    const { data } = await response.json(); 
    
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
      checkbox.textContent = "";
      checkbox.style.color = "white";
    } else {
      const checkbox = document.getElementById("normal-day-checkbox");
      checkbox.style.backgroundColor = "green";
      checkbox.textContent = "";
      checkbox.style.color = "white";
    }
    
    if (site_condition.ground_state === "slushy") {
      const checkbox = document.getElementById("slushy-day-checkbox");
      checkbox.style.backgroundColor = "green";
      checkbox.textContent = "";
      checkbox.style.color = "white";
    } else if (site_condition.ground_state === "dry") {
      const checkbox = document.getElementById("dry-day-checkbox");
      checkbox.style.backgroundColor = "green";
      checkbox.textContent = "";
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
        <td>${labour.remarks[i] || "--"}</td>
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

    // Bottom Remarks (NEW)
     const remarksContainer = document.getElementById("remarks-content-container");
    remarksContainer.innerHTML = "";
    
    // Use bottom_remarks if available, otherwise use empty array
    const bottomRemarks = data.report_footer?.bottom_remarks || (data.labour_report?.remarks ? [data.labour_report.remarks] : []);
    
    // Always show at least 3 items
    const count = Math.max(bottomRemarks.length, 3);
    for (let i = 0; i < count; i++) {
      const div = document.createElement("div");
      div.className = "remarks-item";
      div.textContent = bottomRemarks[i] || "--";
      remarksContainer.appendChild(div);
    }

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
    // Get all data with fallbacks
    const apiData = JSON.parse(sessionStorage.getItem('apiProjectData')) || {};
    const formValues = JSON.parse(sessionStorage.getItem('form-values')) || [];
    const timeSlots = JSON.parse(sessionStorage.getItem('timeslots')) || [];
    const tableData = JSON.parse(sessionStorage.getItem('userTableData')) || [];
    const todayData = JSON.parse(sessionStorage.getItem('todayTableData')) || [];
    const tomorrowData = JSON.parse(sessionStorage.getItem('tomorrowTableData')) || [];
    const eventsData = JSON.parse(sessionStorage.getItem('eventsData')) || [];
    const remarksData = JSON.parse(sessionStorage.getItem('remarksData')) || [];
    const bottomRemarksData = JSON.parse(sessionStorage.getItem('bottomRemarksData')) || [];

    // Prepare project data
    const projectData = {
      project_name: apiData.project_name || "--",
      Employer: apiData.Employer || "--",
      contract_no: apiData.contract_no || "--",
      location: apiData.location || "--",
      start_date: apiData.start_date || "--",
      end_date: apiData.end_date || "--",
      total_days: document.getElementById("total_days")?.textContent || "--",
      days_remaining: document.getElementById("days_left")?.textContent || "--",
      report_date: document.getElementById("report_date")?.textContent || new Date().toLocaleDateString('en-GB'),
      
      site_condition: {
        is_rainy: formValues[0] === "Rainy",
        ground_state: formValues[1] || "dry",
        rain_timing: timeSlots.map(slot => `${slot.from}-${slot.to}`)
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

      report_footer: {
        events_visit: eventsData,
        distribute: ["L&T", "MAPLANI"],
        prepared_by: "Mano Project Pvt. Ltd.",
        bottom_remarks: bottomRemarksData.length ? bottomRemarksData : remarksData
      }
    };

    sessionStorage.setItem('pdfPreviewData', JSON.stringify(projectData));
    window.location.href = `dpr1-pdf.html?id=${projectData.dpr_id || 1}`;
    
  } catch (error) {
    console.error("PDF Preview Error:", error);
    alert("Error preparing PDF preview. Please try again.");
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


// ====================== INITIALIZATION ======================
// Update the initialization to properly handle API data
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // First try to load from API
    await fetchProjectData();
     const dprId = getCurrentDPRId() || 45;
    await fetchAndDisplayDPR(dprId);
    
    // Then fall back to session data if API fails
    if (!sessionStorage.getItem('apiProjectData')) {
      populateTable(tableData, displayTable);
      populateTable(todayData, todayTable, true);
      populateTable(tomorrowData, tomorrowTable, true);
      handleFormData();
      handleTimeSlots();
    }
    
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