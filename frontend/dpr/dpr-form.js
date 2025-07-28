// =================== TIME SLOTS ===================
let timeSlots = [];

function updateTimeslotDisplay() {
  const display = document.getElementById("timeslots-display");
  display.innerHTML = "";

  if (timeSlots.length === 0) {
    display.style.display = "none";
    return;
  }

  timeSlots.forEach((slot, index) => {
    const slotElement = document.createElement("div");
    slotElement.className = "timeslot-item";
    slotElement.innerHTML = `
      <span>${slot.from} - ${slot.to}</span>
      <span class="timeslot-remove" data-index="${index}">×</span>
    `;
    display.appendChild(slotElement);
  });

  document.querySelectorAll(".timeslot-remove").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const index = parseInt(e.target.getAttribute("data-index"));
      timeSlots.splice(index, 1);
      updateTimeslotDisplay();
      updateTimeslotCount();
    });
  });

  display.style.display = "block";
}

function updateTimeslotCount() {
  const countElement = document.getElementById("timeslot-count");
  countElement.textContent = timeSlots.length;
  document.getElementById("pop-up").innerHTML = `<span id="timeslot-count">${timeSlots.length}</span> TIME SLOTS`;
}

document.getElementById("time-slot-submit-button").addEventListener("click", function (event) {
  event.preventDefault();
  timeSlots = [];

  document.querySelectorAll("#timeSlotsContainer .time-slot").forEach((slot) => {
    let fromTime = slot.querySelector("input[type='time']:first-of-type").value;
    let toTime = slot.querySelector("input[type='time']:last-of-type").value;
    if (fromTime && toTime) timeSlots.push({ from: fromTime, to: toTime });
  });

  updateTimeslotDisplay();
  updateTimeslotCount();
  modal.style.display = "none";
});

document.getElementById("pop-up").addEventListener("click", function (e) {
  if (e.target !== this && e.target.className !== "timeslot-remove") return;
  const display = document.getElementById("timeslots-display");
  if (timeSlots.length > 0) {
    display.style.display = display.style.display === "none" ? "block" : "none";
  } else {
    modal.style.display = "block";
  }
});

document.getElementById("addTimeSlotBtn").addEventListener("click", (e) => {
  e.preventDefault();
  const newTimeSlot = document.createElement("div");
  newTimeSlot.className = "time-slot";
  newTimeSlot.innerHTML = `
    <h5>TIME SLOT ${document.querySelectorAll("#timeSlotsContainer .time-slot").length + 1}</h5>
    <input type="time" class="time-input">
    <input type="time" class="time-input">
    <button type="button" class="remove-time-slot-button">Remove</button>
  `;
  newTimeSlot.querySelector(".remove-time-slot-button").addEventListener("click", (event) => {
    event.preventDefault();
    event.target.closest(".time-slot").remove();
  });
  document.getElementById("timeSlotsContainer").appendChild(newTimeSlot);
});

    const today = new Date();
    const dateString = today.toDateString();
    document.getElementById("todays_date").textContent = dateString
//----------------------project details adding-----------------------//
// ===================== PROJECT DETAILS =====================
async function fetchProjectDetails() {
  try {
    const project_id = localStorage.getItem("selected_project_id") || "1";
    const response = await fetch(`http://34.47.131.237:3000/project/getProject/${project_id}`);
    const projectData = await response.json();
    
    // Populate the project details in the table
    document.getElementById('project_name').textContent = projectData.data.project_name || '--';
    document.getElementById('start_date').textContent = formatDate(projectData.data.start_date) || '--';
    document.getElementById('end_date').textContent = formatDate(projectData.data.end_date) || '--';
    document.getElementById('Employer').textContent = projectData.data.Employer || '--';
    document.getElementById('project_description').textContent = projectData.data.project_description || '--';
    document.getElementById('contract_no').textContent = projectData.data.contract_no || '--';
    document.getElementById('location').textContent = projectData.data.location || '--';
    
    // Calculate elapsed and remaining days
    if (projectData.data.start_date && projectData.data.end_date) {
      const { elapsedDays, remainingDays } = calculateProjectDays(
        projectData.data.start_date, 
        projectData.data.end_date
      );
      document.getElementById('elapsedDays').textContent = `Elapsed Days: ${elapsedDays}`;
      document.getElementById('remainingDays').textContent = `Remaining Days: ${remainingDays}`;
    }
  } catch (error) {
    console.error('Error fetching project details:', error);
    // Set default values if API fails
    document.getElementById('project_name').textContent = '--';
    document.getElementById('start_date').textContent = '--';
    document.getElementById('end_date').textContent = '--';
    document.getElementById('Employer').textContent = '--';
    document.getElementById('project_description').textContent = '--';
    document.getElementById('contract_no').textContent = '--';
    document.getElementById('location').textContent = '--';
    document.getElementById('elapsedDays').textContent = 'Elapsed Days: --';
    document.getElementById('remainingDays').textContent = 'Remaining Days: --';
  }
}

// Helper function to format date
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Helper function to calculate elapsed and remaining days
function calculateProjectDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  
  // Calculate elapsed days
  const elapsedTime = today - start;
  const elapsedDays = Math.floor(elapsedTime / (1000 * 60 * 60 * 24));
  
  // Calculate remaining days
  const remainingTime = end - today;
  const remainingDays = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
  
  return {
    elapsedDays: elapsedDays >= 0 ? elapsedDays : 0,
    remainingDays: remainingDays >= 0 ? remainingDays : 0
  };
}



//-------------------dynamically adding the rows and columns to labour report------------------------//
async function initializeLabourTable() {
  try {
    // Fetch project data containing agency and labour types
    const project_id = localStorage.getItem("selected_project_id") || "1";
    const response = await fetch(`http://34.47.131.237:3000/project/getProject/${project_id}`);
    const projectData = await response.json();
    
    // Extract agency names and labour types from metadata
    const agencies = projectData.data.metadata.agency || [];
    const labourTypes = projectData.data.metadata.labour_type || [];

    const table = document.getElementById("labourTable");
    table.innerHTML = "";

    // ===== HEADER ROW =====
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    
    // Agency column
    headerRow.innerHTML = `<th>Agency</th>`;
    
    // Labour type columns
    labourTypes.forEach(type => {
      headerRow.innerHTML += `<th>${type.charAt(0).toUpperCase() + type.slice(1)}</th>`;
    });
    
    // Total and Remarks columns
    headerRow.innerHTML += `<th>Total</th><th>Remarks</th>`;
    thead.appendChild(headerRow);

    // ===== DATA ROWS =====
    const tbody = document.createElement("tbody");

    agencies.forEach(agency => {
      const tr = document.createElement("tr");
      tr.className = "data-row";

      // Agency name (editable)
      tr.innerHTML = `<td><input type="text" value="${agency}" /></td>`;

      // Empty inputs for each labour type
      labourTypes.forEach(type => {
        tr.innerHTML += `<td><input type="number" class="cell-input" data-type="${type}" value="" /></td>`;
      });

      // Total (auto-calculated, disabled)
      tr.innerHTML += `<td><input type="number" class="row-total" disabled /></td>`;

      // Remarks (editable)
      tr.innerHTML += `<td><input type="text" class="remarks-input" /></td>`;

      tbody.appendChild(tr);
    });

    // ===== TOTAL ROW =====
    const totalRow = document.createElement("tr");
    totalRow.innerHTML = `<td><strong>TOTAL</strong></td>`;

    // Column totals (auto-calculated, disabled)
    labourTypes.forEach(type => {
      totalRow.innerHTML += `<td><input id="total-${type}" type="number" disabled /></td>`;
    });

    // Grand total (auto-calculated, disabled)
    totalRow.innerHTML += `<td><input id="grandtotal" type="number" disabled /></td><td></td>`;
    tbody.appendChild(totalRow);

    // Append to table
    table.appendChild(thead);
    table.appendChild(tbody);

    // Setup event listeners for auto-calculation
    document.querySelectorAll(".cell-input").forEach(input => {
      input.addEventListener("input", calculateTotals);
    });

  } catch (error) {
    console.error("Error loading labour structure:", error);
    document.getElementById("labourTable").innerHTML = `
      <thead>
        <tr>
          <th colspan="3">Error Loading Labour Data</th>
        </tr>
      </thead>
      <tbody>
        <tr><td colspan="3">${error.message}</td></tr>
      </tbody>
    `;
  }
}


function calculateTotals() {
  const labourTypes = Array.from(new Set(
    Array.from(document.querySelectorAll("[data-type]"))
      .map(el => el.getAttribute("data-type"))
  ));

  // Initialize totals
  const columnTotals = {};
  labourTypes.forEach(type => {
    columnTotals[type] = 0;
  });
  let grandTotal = 0;

  // Calculate row totals and column totals
  document.querySelectorAll(".data-row").forEach(row => {
    let rowTotal = 0;
    
    labourTypes.forEach(type => {
      const input = row.querySelector(`[data-type="${type}"]`);
      const value = parseFloat(input.value) || 0;
      rowTotal += value;
      columnTotals[type] += value;
    });

    // Update row total
    row.querySelector(".row-total").value = rowTotal;
    grandTotal += rowTotal;
  });

  // Update column totals
  labourTypes.forEach(type => {
    const totalInput = document.getElementById(`total-${type}`);
    if (totalInput) totalInput.value = columnTotals[type];
  });

  // Update grand total
  const grandTotalInput = document.getElementById("grandtotal");
  if (grandTotalInput) grandTotalInput.value = grandTotal;
}

// ===================== CALCULATE TOTALS =====================
function calculateTotals() {
  const dataRows = document.querySelectorAll(".data-row");
  const columnTotals = {};
  let grandTotal = 0;

  document.querySelectorAll("#labourTable thead th").forEach((th, index) => {
    if (th.textContent !== "Total" && th.textContent !== "Remarks") {
      columnTotals[index] = 0;
    }
  });

  dataRows.forEach((row) => {
    let rowTotal = 0;
    const cells = row.cells;
    
    for (let i = 0; i < cells.length - 2; i++) {
      const input = cells[i].querySelector("input");
      if (input && input.type === "number") {
        const value = parseFloat(input.value) || 0;
        rowTotal += value;
        columnTotals[i] += value;
      }
    }

    const rowTotalInput = row.querySelector(".row-total");
    if (rowTotalInput) rowTotalInput.value = rowTotal;
    grandTotal += rowTotal;
  });

  Object.entries(columnTotals).forEach(([index, total]) => {
    const totalInput = document.getElementById(`${index}_total`);
    if (totalInput) totalInput.value = total;
  });

  const grandTotalInput = document.getElementById("grandtotal");
  if (grandTotalInput) grandTotalInput.value = grandTotal;
}

// ===================== FORM DATA HANDLING =====================
function displaydata() {
  const input_array = [];
  const today_progress = document.querySelector(".today-progress")?.value || "";
  const today_progress_quantity = document.querySelector(".today-progress-quantity")?.value || "";
  const tomorrows_planning = document.querySelector(".tomorrows-planning")?.value || "";
  const tomorrows_planning_quantity = document.querySelector(".tomorrows-planning-quantity")?.value || "";

  let radio_buttons_value = "";
  let ground_ground_state_value = "";

  document.getElementsByName("weather").forEach(radio => {
    if (radio.checked) radio_buttons_value = radio.value;
  });

  document.getElementsByName("ground-state").forEach(radio => {
    if (radio.checked) ground_ground_state_value = radio.value;
  });

  input_array.push(
    radio_buttons_value,
    ground_ground_state_value,
    today_progress,
    today_progress_quantity,
    tomorrows_planning,
    tomorrows_planning_quantity
  );

  // Save labour table data
  const tableData = Array.from(document.getElementById("labourTable").rows)
    .slice(1, -1)
    .map(row => Array.from(row.cells).map(cell => {
      const input = cell.querySelector("input");
      return input ? input.value : cell.textContent.trim();
    }));

  // Save today/tomorrow tables
  const todaytableData = Array.from(document.getElementById("today-table").rows)
    .slice(1)
    .map(row => Array.from(row.cells).map(cell => {
      const input = cell.querySelector("input");
      const value = input ? input.value.trim() : cell.textContent.trim();
      return value === "" ? "--" : value;
    }));

  const tomorrowtableData = Array.from(document.getElementById("tomorrow-table").rows)
    .slice(1)
    .map(row => Array.from(row.cells).map(cell => {
      const input = cell.querySelector("input");
      const value = input ? input.value.trim() : "";
      return value === "" ? "--" : value;
    }));

  // Save events and remarks
  const eventsData = Array.from(document.querySelectorAll("#eventsContainer .event-input"))
    .map(input => input.value.trim())
    .filter(event => event !== "");

  const remarksData = Array.from(document.querySelectorAll("#remarksContainer .remark-input"))
    .map(input => input.value.trim())
    .filter(remark => remark !== "");
  
    // In displaydata() function:
const labourTypes = Array.from(document.querySelectorAll("#labourTable thead th"))
  .slice(1, -2) // Skip Agency and Total/Remarks columns
  .map(th => th.textContent);
sessionStorage.setItem("labourColumns", JSON.stringify(labourTypes));
  // Save all data to sessionStorage
  sessionStorage.setItem("userTableData", JSON.stringify(tableData));
  sessionStorage.setItem("todayTableData", JSON.stringify(todaytableData));
  sessionStorage.setItem("tomorrowTableData", JSON.stringify(tomorrowtableData));
  sessionStorage.setItem("form-values", JSON.stringify(input_array));
  sessionStorage.setItem("timeslots", JSON.stringify(timeSlots));
  sessionStorage.setItem("eventsData", JSON.stringify(eventsData));
  sessionStorage.setItem("remarksData", JSON.stringify(remarksData));

  window.location.href = "dpr-viewer.html";
}

// ===================== TODAY/TOMORROW TABLES =====================
async function initializeTodayTomorrowTables() {
  try {
    // Get latest DPR for project ID 1
    const response = await fetch(`http://34.47.131.237:3000/report/Alldpr/1?limit=10`);
    const dprArray = await response.json();

    if (dprArray.length > 0) {
      const latestDPR = dprArray.reduce((latest, current) => 
        new Date(current.report_date) > new Date(latest.report_date) ? current : latest
      );

      const dprDetails = await fetch(`http://34.47.131.237:3000/report/getDPR/${latestDPR.dpr_id}`);
      const prevDPR = await dprDetails.json();

      const prevPlan = prevDPR?.data?.tomorrow_plan;
      const progressList = prevPlan?.plan || [];
      const qtyList = prevPlan?.qty || [];

      const todayTable = document.getElementById('today-table');
      const todayBody = todayTable.querySelector('tbody');
      todayBody.innerHTML = '';

      const tomorrowTable = document.getElementById('tomorrow-table');
      const tomorrowBody = tomorrowTable.querySelector('tbody');
      tomorrowBody.innerHTML = '';

      for (let i = 0; i < progressList.length; i++) {
        const todayRow = todayBody.insertRow();
        todayRow.innerHTML = `
          <td><input type="text" class="today-progress" value="${progressList[i]}" /></td>
          <td><input type="text" class="today-progress-quantity" value="${qtyList[i] || ''}" /></td>
        `;

        const tomorrowRow = tomorrowBody.insertRow();
        tomorrowRow.innerHTML = `
          <td><input type="text" class="tomorrows-planning" /></td>
          <td><input type="number" class="tomorrows-planning-quantity" /></td>
        `;
      }

      if (progressList.length === 0) {
        todayBody.innerHTML = `
          <tr>
            <td><input type="text" class="today-progress" /></td>
            <td><input type="text" class="today-progress-quantity" /></td>
          </tr>
        `;

        tomorrowBody.innerHTML = `
          <tr>
            <td><input type="text" class="tomorrows-planning" /></td>
            <td><input type="number" class="tomorrows-planning-quantity" /></td>
          </tr>
        `;
      }
    }
  } catch (error) {
    console.error("Error loading previous DPR:", error);
    // Fallback to empty tables
    document.getElementById('today-table').querySelector('tbody').innerHTML = `
      <tr>
        <td><input type="text" class="today-progress" /></td>
        <td><input type="text" class="today-progress-quantity" /></td>
      </tr>
    `;
    document.getElementById('tomorrow-table').querySelector('tbody').innerHTML = `
      <tr>
        <td><input type="text" class="tomorrows-planning" /></td>
        <td><input type="number" class="tomorrows-planning-quantity" /></td>
      </tr>
    `;
  }
}


// ===================== INITIALIZATION =====================
document.addEventListener("DOMContentLoaded", async function() {
  // Initialize all components
  await fetchProjectDetails(); 
  initializeLabourTable();
  await initializeTodayTomorrowTables();
  updateTimeslotDisplay();
  updateTimeslotCount();

  // Set up today/tomorrow table row management
  const todayAddBtn = document.querySelector(".today-planning .todo-add-row-btn");
  const tomorrowAddBtn = document.querySelector(".tomorrow-planning .tomo-add-row-btn");
  const removeButtons = document.querySelectorAll(".remove-row-btn");

  function addRowToTable(table) {
    const tbody = table.querySelector("tbody");
    const newRow = tbody.insertRow();
    if (table.id === "today-table") {
      newRow.innerHTML = `
        <td><input type="text" class="today-progress"></td>
        <td><input type="number" class="today-progress-quantity"></td>
      `;
    } else {
      newRow.innerHTML = `
        <td><input type="text" class="tomorrows-planning"></td>
        <td><input type="number" class="tomorrows-planning-quantity"></td>
      `;
    }
  }

  function handleAddRow() {
    addRowToTable(document.getElementById("today-table"));
    addRowToTable(document.getElementById("tomorrow-table"));
  }

  function handleRemoveRow() {
    const todayRows = document.querySelectorAll("#today-table tbody tr");
    const tomorrowRows = document.querySelectorAll("#tomorrow-table tbody tr");
    
    if (todayRows.length > 1) todayRows[todayRows.length-1].remove();
    if (tomorrowRows.length > 1) tomorrowRows[tomorrowRows.length-1].remove();
  }

  if (todayAddBtn) todayAddBtn.addEventListener("click", handleAddRow);
  if (tomorrowAddBtn) tomorrowAddBtn.addEventListener("click", handleAddRow);
  removeButtons.forEach(btn => btn.addEventListener("click", handleRemoveRow));
});

// ===================== EVENTS SECTION =====================
// ===================== REMARKS SECTION =====================
// ===================== MODAL =====================
const modal = document.getElementById("myModal");
const openModalBtn = document.getElementById("pop-up");
const closeModalBtn = document.querySelector(".close");

openModalBtn.addEventListener("click", () => {
  modal.style.display = "block";
});

closeModalBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

window.addEventListener("click", (event) => {
  if (event.target === modal) {
    modal.style.display = "none";
  }
});
function createEventInput(value = "") {
  const container = document.createElement("div");
  container.className = "event-input-container";
  container.innerHTML = `
    <input type="text" class="event-input" value="${value}">
    <button class="remove-input-btn">−</button>
  `;

  container.querySelector(".remove-input-btn").addEventListener("click", () => {
    container.remove();
  });

  return container;
}

document.addEventListener("DOMContentLoaded", function () {
  const eventsContainer = document.getElementById("eventsContainer");
  const addEventBtn = document.getElementById("addEventBtn");

  addEventBtn.addEventListener("click", () => {
    eventsContainer.appendChild(createEventInput());
  });

  // Add one by default
  eventsContainer.appendChild(createEventInput());
});
function createRemarkInput(value = "") {
  const container = document.createElement("div");
  container.className = "remark-input-container";
  container.innerHTML = `
    <input type="text" class="remark-input" value="${value}">
    <button class="remove-input-btn">−</button>
  `;

  container.querySelector(".remove-input-btn").addEventListener("click", () => {
    container.remove();
  });

  return container;
}

document.addEventListener("DOMContentLoaded", function () {
  const remarksContainer = document.getElementById("remarksContainer");
  const addRemarkBtn = document.getElementById("addRemarkBtn");

  addRemarkBtn.addEventListener("click", () => {
    remarksContainer.appendChild(createRemarkInput());
  });

  // Add one by default
  remarksContainer.appendChild(createRemarkInput());
});


