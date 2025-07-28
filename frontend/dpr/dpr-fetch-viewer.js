async function fetchProjectData() {
  const response = await fetch('http://34.47.131.237:3000/project/getProject/1');
  const apiData = await response.json();
  sessionStorage.setItem('apiProjectData', JSON.stringify(apiData.data));
  updateProjectUI(apiData.data);
}

function getCurrentDPRId() {
  // Check URL parameters first
  const urlParams = new URLSearchParams(window.location.search);
  const urlId = urlParams.get('dpr_id') || urlParams.get('dprId') || urlParams.get('id');
  
  // Validate URL ID if found
  if (urlId) {
    const parsedId = parseInt(urlId);
    if (!isNaN(parsedId)) return parsedId;
  }

  // Check session storage (pdfPreviewData)
  try {
    const storedData = JSON.parse(sessionStorage.getItem('pdfPreviewData'));
    if (storedData?.dpr_id) {
      const parsedId = parseInt(storedData.dpr_id);
      if (!isNaN(parsedId)) return parsedId;
    }
  } catch (e) {
    console.error('Error parsing session storage data:', e);
  }

  // Check API data
  try {
    const apiData = JSON.parse(sessionStorage.getItem('apiProjectData'));
    if (apiData?.dpr_id) {
      const parsedId = parseInt(apiData.dpr_id);
      if (!isNaN(parsedId)) return parsedId;
    }
  } catch (e) {
    console.error('Error parsing API data:', e);
  }

  // Return default value
  return 1;
}

const dprId = getCurrentDPRId();

// Utility Functions
function showLoadingIndicator() {
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'loading-indicator';
  loadingDiv.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; padding: 20px;">
      <div class="spinner" style="margin-right: 10px;"></div>
      <span>Loading project data...</span>
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

// Table Population
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

// Project UI Update
function updateProjectUI(projectData) {
  document.getElementById("project_name").textContent = projectData.project_name || "--";
  document.getElementById("Employer").textContent = projectData.Employer || "--";
  document.getElementById("contract_no").textContent = projectData.contract_no || "--";
  document.getElementById("location").textContent = projectData.location || "--";
  
  if (projectData.start_date) {
    const startDate = new Date(projectData.start_date);
    document.getElementById("start_date").textContent = startDate.toLocaleDateString('en-GB');
    
    if (projectData.end_date) {
      const endDate = new Date(projectData.end_date);
      document.getElementById("end_date").textContent = endDate.toLocaleDateString('en-GB');
      
      // Calculate duration in days
      const timeDiff = endDate - startDate;
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      document.getElementById("total_days").textContent = daysDiff;
    }
  }

  if (projectData.start_date && projectData.end_date) {
    const startDate = new Date(projectData.start_date);
    const endDate = new Date(projectData.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    let daysRemaining;
    
    if (today < startDate) {
      daysRemaining = totalDays;
    } else if (today > endDate) {
      daysRemaining = 0;
    } else {
      daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    }

    document.getElementById("days_left").textContent = daysRemaining;
    document.getElementById("total_days").textContent = totalDays;
  }
}

// Main DPR Display Function
async function fetchAndDisplayDPR(dprId) {
  try {
    const response = await fetchWithRetry(`http://34.47.131.237:3000/report/getDPR/${dprId}`);
    const { data } = await response;

    // Site Conditions
    const { site_condition } = data;
    document.querySelectorAll('.condition-checkbox').forEach(checkbox => {
      checkbox.style.backgroundColor = "";
      checkbox.textContent = "";
    });

    if (site_condition.is_rainy) {
      document.getElementById("rainy-day-checkbox").style.backgroundColor = "green";
    } else {
      document.getElementById("normal-day-checkbox").style.backgroundColor = "green";
    }

    if (site_condition.ground_state === "slushy") {
      document.getElementById("slushy-day-checkbox").style.backgroundColor = "green";
    } else if (site_condition.ground_state === "dry") {
      document.getElementById("dry-day-checkbox").style.backgroundColor = "green";
    }

    // Time Slots
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

    const permanentColumns = ['agency', 'remarks'];
    const dynamicColumns = Object.keys(labour).filter(
      key => !permanentColumns.includes(key) &&
             !key.startsWith('_') &&
             Array.isArray(labour[key])
    );

    const thead = document.getElementById("displayTable").getElementsByTagName("thead")[0];
    thead.innerHTML = "";
    const headerRow = document.createElement("tr");

    const agencyHeader = document.createElement("th");
    agencyHeader.textContent = "Agency Name";
    headerRow.appendChild(agencyHeader);

    dynamicColumns.sort().forEach(col => {
      const th = document.createElement("th");
      th.textContent = col.charAt(0).toUpperCase() + col.slice(1);
      th.style.textAlign = "center";
      headerRow.appendChild(th);
    });

    const totalHeader = document.createElement("th");
    totalHeader.textContent = "Total";
    totalHeader.style.textAlign = "center";
    headerRow.appendChild(totalHeader);

    const remarksHeader = document.createElement("th");
    remarksHeader.textContent = "Remarks";
    headerRow.appendChild(remarksHeader);

    thead.appendChild(headerRow);

    const agencyCount = Math.max(
      ...permanentColumns.map(col => labour[col]?.length || 0),
      ...dynamicColumns.map(col => labour[col]?.length || 0)
    );

    let todayManpowerTotal = 0;

    for (let i = 0; i < agencyCount; i++) {
      const tr = document.createElement("tr");

      const agencyCell = document.createElement("td");
      agencyCell.textContent = labour.agency?.[i] || "--";
      tr.appendChild(agencyCell);

      let rowTotal = 0;
      dynamicColumns.forEach(col => {
        const cell = document.createElement("td");
        const value = parseInt(labour[col]?.[i]) || 0;
        cell.textContent = value;
        cell.style.textAlign = "center";
        tr.appendChild(cell);
        rowTotal += value;
      });

      todayManpowerTotal += rowTotal;

      const totalCell = document.createElement("td");
      totalCell.textContent = rowTotal;
      totalCell.style.textAlign = "center";
      tr.appendChild(totalCell);

      const remarksCell = document.createElement("td");
      remarksCell.textContent = labour.remarks?.[i] || "--";
      tr.appendChild(remarksCell);

      tbody.appendChild(tr);
    }

    // Cumulative Manpower Logic (subtract today's from total)
    const totalCumulative = parseInt(data.cumulative_manpower) || 0;
    const yesterdayCumulative = totalCumulative - todayManpowerTotal;
    document.getElementById("cumulative-manpower").textContent = yesterdayCumulative.toString();

    // Progress Data
    populateTable(
      data.today_prog.progress?.map((p, i) => [p, data.today_prog.qty?.[i] || "--"]) || [["--", "--"]],
      document.getElementById("today-table").getElementsByTagName("tbody")[0],
      true
    );

    populateTable(
      data.tomorrow_plan.plan?.map((p, i) => [p, data.tomorrow_plan.qty?.[i] || "--"]) || [["--", "--"]],
      document.getElementById("tomorrow-table").getElementsByTagName("tbody")[0],
      true
    );

    // Events
    const eventsContainer = document.getElementById("events-container");
    eventsContainer.innerHTML = "";
    (data.report_footer?.events_visit || []).forEach(event => {
      const div = document.createElement("div");
      div.className = "remarks-item";
      div.textContent = event || "--";
      eventsContainer.appendChild(div);
    });

    // Remarks
    const remarksContainer = document.getElementById("remarks-content-container");
    remarksContainer.innerHTML = "";
    (data.report_footer?.bottom_remarks || []).forEach(remark => {
      const div = document.createElement("div");
      div.className = "remarks-item";
      div.textContent = remark || "--";
      remarksContainer.appendChild(div);
    });

    // Footer
    document.getElementById("prepared-by").textContent = data.report_footer?.prepared_by || "--";
    document.getElementById("distribution").textContent = data.report_footer?.distribute?.join(", ") || "--";

    // Date
    document.getElementById("report_date").textContent = data.report_date
      ? new Date(data.report_date).toLocaleDateString("en-GB")
      : new Date().toLocaleDateString("en-GB");

  } catch (err) {
    console.error("Error fetching DPR:", err);
    showErrorToUser("Failed to load DPR data. Please try again.");
  }
}


// PDF Preview
function prepareForPDFPreview() {
  try {
    const getData = () => ({
      apiData: JSON.parse(sessionStorage.getItem('apiProjectData')) || {},
      formValues: JSON.parse(sessionStorage.getItem('form-values')) || [],
      timeSlots: JSON.parse(sessionStorage.getItem('timeslots')) || [],
      tableData: JSON.parse(sessionStorage.getItem('userTableData')) || [],
      todayData: JSON.parse(sessionStorage.getItem('todayTableData')) || [],
      tomorrowData: JSON.parse(sessionStorage.getItem('tomorrowTableData')) || [],
      eventsData: JSON.parse(sessionStorage.getItem('eventsData')) || [],
      remarksData: JSON.parse(sessionStorage.getItem('remarksData')) || []
    });

    const projectData = {
      project_name: document.getElementById("project_name").textContent || "Project Name",
      Employer: document.getElementById("Employer").textContent || "Employer",
      contract_no: document.getElementById("contract_no").textContent || "--",
      location: document.getElementById("location").textContent || "--",
      start_date: document.getElementById("start_date").textContent || "--",
      completion_date: document.getElementById("end_date").textContent || "--",
      total_days: document.getElementById("total_days").textContent || "0",
      days_remaining: document.getElementById("days_left").textContent || "0",
      report_date: document.getElementById("report_date").textContent || new Date().toLocaleDateString('en-GB'),
      prepared_by: document.getElementById("prepared-by").textContent || "User",
      approved_by: document.getElementById("distribution").textContent || "Approver",
      dpr_id: getCurrentDPRId() || 1
    };

    sessionStorage.setItem('pdfPreviewData', JSON.stringify(projectData));
    window.location.href = `dpr1-pdf.html?id=${projectData.dpr_id}`;
    
  } catch (error) {
    console.error("PDF Preview Error:", error);
    window.location.href = `dpr1-pdf.html?id=1`;
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const loadingIndicator = showLoadingIndicator();
    await fetchProjectData();
    await fetchAndDisplayDPR(dprId);
    hideLoadingIndicator(loadingIndicator);
  } catch (error) {
    console.error("Initialization error:", error);
    showErrorToUser("Failed to initialize. Using fallback data.");
  }
});

window.prepareForPDFPreview = prepareForPDFPreview;