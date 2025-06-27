// ====================== DATA FETCH ======================
const tableData = JSON.parse(sessionStorage.getItem("userTableData")) || [];
const todayData = JSON.parse(sessionStorage.getItem("todayTableData")) || [];
const tomorrowData =
  JSON.parse(sessionStorage.getItem("tomorrowTableData")) || [];

const displayTable = document
  .getElementById("displayTable")
  ?.getElementsByTagName("tbody")[0];
const todayTable = document
  .getElementById("today-table")
  ?.getElementsByTagName("tbody")[0];
const tomorrowTable = document
  .getElementById("tomorrow-table")
  ?.getElementsByTagName("tbody")[0];

//---------------------purely to format the timeslots in a formta approprate for posting in the backend------------------------//
const timeSlotsInProperFormat =
  JSON.parse(sessionStorage.getItem("timeslots")) || [];
const formattedSlots = timeSlotsInProperFormat.map(
  (slot) => `${slot.from}-${slot.to}`
);

// ====================== POPULATE TABLES ======================
function populateTable(data, tbody, isProgress = false) {
  if (!data || !tbody) return;

  tbody.innerHTML = ""; // Clear existing rows

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

// ====================== HANDLE WEATHER FORM ======================
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

// ====================== HANDLE TIME SLOTS ======================
function handleTimeSlots() {
  const timeSlots = JSON.parse(sessionStorage.getItem("timeslots")) || [];
  const container = document.getElementById("from-to-container");
  if (!container) return;

  container.innerHTML = "";

  timeSlots.forEach((slot) => {
    const timeSlotDiv = document.createElement("div");
    const fromDiv = document.createElement("div");
    const toDiv = document.createElement("div");

    fromDiv.innerHTML = `<div class="info-label">From</div><div class="info-value">${slot.from}</div>`;
    toDiv.innerHTML = `<div class="info-label">To</div><div class="info-value">${slot.to}</div>`;

    timeSlotDiv.appendChild(fromDiv);
    timeSlotDiv.appendChild(toDiv);
    container.appendChild(timeSlotDiv);
  });
}

// ====================== HANDLE EVENTS ======================
function handleEvents() {
  const container = document.getElementById("events-container");
  if (!container) return;

  const data = JSON.parse(sessionStorage.getItem("eventsData")) || [];
  container.innerHTML = "";

  const count = Math.max(data.length, 6); // Minimum 6 fields
  for (let i = 0; i < count; i++) {
    const div = document.createElement("div");
    div.className = "remarks-item";
    div.textContent = data[i] || "--";
    container.appendChild(div);
  }
}

// ====================== HANDLE REMARKS ======================
function handleRemarks() {
  const container = document.getElementById("remarks-content-container");
  if (!container) return;

  const data = JSON.parse(sessionStorage.getItem("remarksData")) || [];
  container.innerHTML = "";

  const count = Math.max(data.length, 3); // Minimum 3 fields
  for (let i = 0; i < count; i++) {
    const div = document.createElement("div");
    div.className = "remarks-item";
    div.textContent = data[i] || "--";
    container.appendChild(div);
  }
}

function fetchAndDisplayDPR(dprId) {
  fetch(`http://34.47.131.237:3000/report/getDPR/${dprId}`)
    .then((res) => res.json())
    .then(({ data }) => {
      // 1. Site Condition
      const { site_condition } = data;
      if (site_condition.is_rainy) {
        document.getElementById("rainy-day-checkbox").classList.add("active");
        document.getElementById("rainy-day-checkbox").textContent = "✓";
      } else {
        document.getElementById("normal-day-checkbox").classList.add("active");
        document.getElementById("normal-day-checkbox").textContent = "✓";
      }
      if (site_condition.ground_state === "slushy") {
        document.getElementById("slushy-day-checkbox").classList.add("active");
        document.getElementById("slushy-day-checkbox").textContent = "✓";
      }
      if (site_condition.ground_state === "dry") {
        document.getElementById("dry-day-checkbox").classList.add("active");
        document.getElementById("dry-day-checkbox").textContent = "✓";
      }

      // 2. Rain Timings
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

      // 3. Labour Report
      const labour = data.labour_report;
      const tbody = document
        .getElementById("displayTable")
        .getElementsByTagName("tbody")[0];
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

      // 4. Today Progress
      populateTable(
        data.today_prog.progress.map((p, i) => [p, data.today_prog.qty[i]]),
        todayTable,
        true
      );

      // 5. Tomorrow Plan
      populateTable(
        data.tomorrow_plan.plan.map((p, i) => [p, data.tomorrow_plan.qty[i]]),
        tomorrowTable,
        true
      );

      // 6. Events
      const eventsContainer = document.getElementById("events-container");
      eventsContainer.innerHTML = "";
      (data.report_footer.events_visit || []).forEach((event) => {
        const div = document.createElement("div");
        div.className = "remarks-item";
        div.textContent = event;
        eventsContainer.appendChild(div);
      });

      // 7. Remarks
      const remarksContainer = document.getElementById(
        "remarks-content-container"
      );
      remarksContainer.innerHTML = "";
      const remarkDiv = document.createElement("div");
      remarkDiv.className = "remarks-item";
      remarkDiv.textContent = labour.remarks || "--";
      remarksContainer.appendChild(remarkDiv);

      // 8. Footer
      document.getElementById("prepared-by").textContent =
        data.report_footer.prepared_by;
      document.getElementById("distribution").textContent =
        data.report_footer.distribute.join(", ");

      // 9. Date
      document.getElementById("report_date").textContent = new Date(
        data.report_date
      ).toLocaleDateString("en-GB");
    })
    .catch((err) => {
      console.error("Error fetching DPR:", err);
      console.log("Failed to fetch DPR data.");
    });
}
// ====================== PRINT HANDLER ==========================

// ====================== INITIALIZATION =========================

document.addEventListener("DOMContentLoaded", () => {
  populateTable(tableData, displayTable);
  populateTable(todayData, todayTable, true);
  populateTable(tomorrowData, tomorrowTable, true);
  handleFormData();
  handleTimeSlots();
  handleEvents();
  handleRemarks();

  // Fetch project data from API
  fetch("http://34.47.131.237:3000/project/getProject/1")
    .then((response) => {
      if (!response.ok) {
        document.getElementById("project_name").textContent =
          "DATA UNAVAILABLE";
        document.getElementById("project_name").classList.add("error_state");
        return Promise.reject(new Error("Project not found"));
      }
      return response.json();
    })
    .then((Apidata) => {
      sessionStorage.setItem("apiProjectData", JSON.stringify(Apidata.data));
      document.getElementById("project_name").textContent =
        Apidata.data.project_name;
      document.getElementById("Employer").textContent = Apidata.data.Employer;
      document.getElementById("contract_no").textContent =
        Apidata.data.contract_no;
      document.getElementById("location").textContent = Apidata.data.location;
      document.getElementById("start_date").textContent = new Date(
        Apidata.data.start_date
      ).toLocaleDateString("en-GB");

      // Calculate and display duration information
      if (Apidata.data.start_date && Apidata.data.completion_date) {
        const startDate = new Date(Apidata.data.start_date);
        const completionDate = new Date(Apidata.data.completion_date);
        const today = new Date();

        const totalDays = Math.round(
          (completionDate - startDate) / (1000 * 60 * 60 * 24)
        );
        const daysPassed = Math.round(
          (today - startDate) / (1000 * 60 * 60 * 24)
        );
        const daysRemaining = totalDays - daysPassed;

        document.getElementById("completion_date").textContent =
          completionDate.toLocaleDateString("en-GB");
        document.getElementById("total").textContent = totalDays;
        document.getElementById("balance-left").textContent =
          daysRemaining > 0 ? daysRemaining : 0;
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });

  // Set current date
  // Load DPR data
  //   fetchAndDisplayDPR(19); // Replace 17 with dynamic ID if needed
  const params = new URLSearchParams(window.location.search);
  const dprId = params.get("dpr_id");
  if (dprId) {
    fetchAndDisplayDPR(dprId);
  }
});

//-------------------------------TO format THESE DATA TO MATCH THE OBJECT ALREADY EXISTING IN BACKEND------------------------------------------//
function generateCompleteDPRObject() {
  const apiData = JSON.parse(sessionStorage.getItem("apiProjectData")) || {};

  // 1. Get all raw data
  const tableData = JSON.parse(sessionStorage.getItem("userTableData")) || [];
  const todayData = JSON.parse(sessionStorage.getItem("todayTableData")) || [];
  const tomorrowData =
    JSON.parse(sessionStorage.getItem("tomorrowTableData")) || [];
  const formValues = JSON.parse(sessionStorage.getItem("form-values")) || [];
  const timeSlots = JSON.parse(sessionStorage.getItem("timeslots")) || [];
  const remarksData = JSON.parse(sessionStorage.getItem("remarksData")) || [];
  const eventsData = JSON.parse(sessionStorage.getItem("eventsData")) || [];

  // 2. Process LABOR exactly as you need it
  const filteredData = tableData.slice(0, -1); // Excludes the last row
  const transformedData = {
    agency: filteredData.map((row) => row[0] || "--"),
    mason: filteredData.map((row) => parseInt(row[1]) || 0),
    carp: filteredData.map((row) => parseInt(row[2]) || 0),
    fitter: filteredData.map((row) => parseInt(row[3]) || 0),
    electrical: filteredData.map((row) => parseInt(row[4]) || 0),
    painter: filteredData.map((row) => parseInt(row[5]) || 0),
    gypsum: filteredData.map((row) => parseInt(row[6]) || 0),
    plumber: filteredData.map((row) => parseInt(row[7]) || 0),
    helper: filteredData.map((row) => parseInt(row[8]) || 0),
    staff: filteredData.map((row) => parseInt(row[9]) || 0),
    remarks: filteredData.map((row) => row[11] || "--"),
  };
  // 3. Build the COMPLETE DPR object
  return {
    project_id: 1,
    report_date: new Date().toISOString().split("T")[0],

    // B. Site Conditions
    site_condition: {
      is_rainy: formValues[0] === "Rainy",
      ground_state: formValues[1] || "Unknown",
      rain_timing: formattedSlots || "No time slots available",
    },

    // C. Labor (your exact format!)
    labour_report: transformedData,
    cumulative_manpower: 0,

    // D. Progress Data
    today_prog: {
      progress: todayData.map((row) => row[0] || "--"), // Task column
      qty: todayData.map((row) => row[1] || "--"), // Qty column
    },
    tomorrow_plan: {
      plan: tomorrowData.map((row) => row[0] || "--"),
      qty: tomorrowData.map((row) => row[1] || "--"),
    },

    user_roles: {
      created_by: 1,
      approvals: {
        1: true,
        3: false,
      },
      viewers: [10, 11, 15],
      editors: [1, 3, 4],
    },
    report_footer: {
      events_visit: eventsData || [],
      distribute: ["L&T", "MAPLANI"],
      prepared_by: "Mano Project Pvt. Ltd.",
    },
  };
}

//---------------------------------TO UPLOAD THE DATA TO BACKEND UISING POST METHOD---------------------------//
function postDPRToBackend() {
  const dprData = generateCompleteDPRObject();
  console.log(JSON.stringify(dprData, null, 2)); // Pretty print

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
// console.log(JSON.stringify(dprData, null, 2)); // Pretty print
