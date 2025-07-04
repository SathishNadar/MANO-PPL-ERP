// =================== TIME SLOTS ===================
let timeSlots = [];

function updateTimeslotDisplay() {
  const display = document.getElementById('timeslots-display');
  if (!display) return;
  
  display.innerHTML = '';

  if (timeSlots.length === 0) {
    display.style.display = 'none';
    return;
  }

  timeSlots.forEach((slot, index) => {
    const slotElement = document.createElement('div');
    slotElement.className = 'timeslot-item';
    slotElement.innerHTML = `<span>${slot.from} - ${slot.to}</span><span class="timeslot-remove" data-index="${index}">×</span>`;
    display.appendChild(slotElement);
  });

  document.querySelectorAll('.timeslot-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.getAttribute('data-index'));
      timeSlots.splice(index, 1);
      updateTimeslotDisplay();
      updateTimeslotCount();
    });
  });

  display.style.display = 'block';
}

function updateTimeslotCount() {
  const countElement = document.getElementById('timeslot-count');
  if (!countElement) return;
  
  countElement.textContent = timeSlots.length;
  const popupBtn = document.getElementById('pop-up');
  if (popupBtn) popupBtn.innerHTML = `<span id="timeslot-count">${timeSlots.length}</span> TIME SLOTS`;
}

// Store timeslots on submit
const submitTimeBtn = document.getElementById("time-slot-submit-button");
if (submitTimeBtn) {
  submitTimeBtn.addEventListener("click", function (event) {
    event.preventDefault();
    timeSlots = [];
    document.querySelectorAll("#timeSlotsContainer .time-slot").forEach(slot => {
      const fromInput = slot.querySelector("input[type='time']");
      const toInput = slot.querySelectorAll("input[type='time']")[1];
      if (fromInput && toInput && fromInput.value && toInput.value) {
        timeSlots.push({ from: fromInput.value, to: toInput.value });
      }
    });
    updateTimeslotDisplay();
    updateTimeslotCount();
    const modal = document.getElementById("myModal");
    if (modal) modal.style.display = "none";
  });
}

// Modal handling
const modal = document.getElementById("myModal");
const openModalBtn = document.getElementById("pop-up");
const closeModalBtn = document.querySelector(".close");

if (openModalBtn) openModalBtn.addEventListener("click", () => {
  if (modal) modal.style.display = "block";
});

if (closeModalBtn) closeModalBtn.addEventListener("click", () => {
  if (modal) modal.style.display = "none";
});

window.addEventListener("click", (e) => { 
  if (e.target === modal && modal) modal.style.display = "none"; 
});

// =================== LABOUR TABLE ===================
let labourCategories = ["Mason", "Carp", "Fitter", "Electrical", "Painter", "Gypsum", "Plumber", "Helper", "Staff"];

function calculateTotals() {
  const dataRows = document.querySelectorAll('.data-row');
  const columnTotals = new Array(labourCategories.length).fill(0);
  let grandTotal = 0;

  dataRows.forEach(row => {
    let rowTotal = 0;
    const inputs = row.querySelectorAll('.cell-input');
    inputs.forEach((input, idx) => {
      const val = parseFloat(input.value) || 0;
      rowTotal += val;
      columnTotals[idx] += val;
    });
    const rowTotalInput = row.querySelector('.row-total');
    if (rowTotalInput) rowTotalInput.value = rowTotal;
    grandTotal += rowTotal;
  });

  columnTotals.forEach((total, i) => {
    const totalField = document.getElementById(`${i + 1}_total`);
    if (totalField) totalField.value = total;
  });

  const grandField = document.getElementById('grandtotal');
  if (grandField) grandField.value = grandTotal;
}

function addRow() {
  const tbody = document.querySelector("#labourTable tbody");
  if (!tbody) return;
  
  const newRow = document.createElement("tr");
  newRow.classList.add("data-row");
  newRow.innerHTML = `<td><input type="text" /></td>` +
    labourCategories.map(() => `<td><input type="number" class="cell-input" /></td>`).join('') +
    `<td><input type="number" class="row-total" disabled /></td><td><input type="text" /></td>`;
  
  tbody.insertBefore(newRow, tbody.lastElementChild);
  newRow.querySelectorAll('.cell-input').forEach(input => {
    input.addEventListener('input', calculateTotals);
  });
  calculateTotals();
}

function deleteRow() {
  const rows = document.querySelectorAll(".data-row");
  if (rows.length > 1) {
    rows[rows.length - 1].remove();
    calculateTotals();
  }
}

function addColumn() {
  const table = document.getElementById("labourTable");
  if (!table) return;
  
  const newCategory = prompt("Enter new category:");
  if (!newCategory) return;

  labourCategories.push(newCategory);
  const th = document.createElement("th");
  th.setAttribute("contenteditable", "true");
  th.innerText = newCategory;
  table.tHead.rows[0].insertBefore(th, table.tHead.rows[0].cells[table.tHead.rows[0].cells.length - 2]);

  const rows = table.querySelectorAll("tbody .data-row");
  rows.forEach(row => {
    const td = document.createElement("td");
    td.innerHTML = `<input type="number" class="cell-input" />`;
    row.insertBefore(td, row.cells[row.cells.length - 2]);
  });

  const totalRow = table.querySelector("tbody tr:last-child");
  const tdTotal = document.createElement("td");
  tdTotal.innerHTML = `<input type="number" disabled />`;
  tdTotal.id = `${labourCategories.length}_total`;
  totalRow.insertBefore(tdTotal, totalRow.cells[totalRow.cells.length - 2]);

  document.querySelectorAll('.cell-input').forEach(input => {
    input.removeEventListener('input', calculateTotals);
    input.addEventListener('input', calculateTotals);
  });
  calculateTotals();
}

function removeColumn() {
  if (labourCategories.length <= 1) return alert("At least one category must remain.");
  const table = document.getElementById("labourTable");
  if (!table) return;
  
  const idx = labourCategories.length - 1;
  table.tHead.rows[0].deleteCell(idx + 1);
  table.querySelectorAll("tbody .data-row").forEach(row => row.deleteCell(idx + 1));
  table.querySelector("tbody tr:last-child").deleteCell(idx + 1);
  labourCategories.pop();
  calculateTotals();
}

function clearTableKeepRows() {
  const inputs = document.querySelectorAll('#labourTable tbody tr input');
  if (!inputs) return;
  
  inputs.forEach(input => input.value = '');
  calculateTotals();
}

// =================== EVENTS & REMARKS ===================
function initializeEvents() {
  const eventsContainer = document.getElementById('eventsContainer');
  if (!eventsContainer) return;
  
  eventsContainer.innerHTML = '';
  
  // Create 6 empty event inputs by default
  for (let i = 0; i < 6; i++) {
    const inputGroup = document.createElement('div');
    inputGroup.className = 'input-group';
    inputGroup.innerHTML = `<input type="text" class="event-input" placeholder="Event ${i + 1}">`;
    eventsContainer.appendChild(inputGroup);
  }
}

function initializeRemarks() {
  const remarksContainer = document.getElementById('remarksContainer');
  if (!remarksContainer) return;
  
  remarksContainer.innerHTML = '';
  
  // Create 3 empty remark inputs by default
  for (let i = 0; i < 3; i++) {
    const inputGroup = document.createElement('div');
    inputGroup.className = 'input-group';
    inputGroup.innerHTML = `<input type="text" class="remark-input" placeholder="Remark ${i + 1}">`;
    remarksContainer.appendChild(inputGroup);
  }
}

// =================== PROJECT DATA FETCH ===================
async function fetchProjectData() {
  try {
    const response = await fetch('http://34.47.131.237:3000/project/getProject/1');
    if (!response.ok) throw new Error('Failed to fetch project data');
    
    const data = await response.json();
    if (!data.data) throw new Error('No project data received');
    
    // Update project info fields
    document.getElementById("project_name").textContent = data.data.project_name || "--";
    document.getElementById("Employer").textContent = data.data.Employer || "--";
    document.getElementById("contract_no").textContent = data.data.contract_no || "--";
    document.getElementById("location").textContent = data.data.location || "--";
    
    if (data.data.start_date) {
      const startDate = new Date(data.data.start_date);
      document.getElementById("start_date").textContent = startDate.toLocaleDateString('en-GB');
    }
    
    if (data.data.end_date) {
      const endDate = new Date(data.data.end_date);
      document.getElementById("end_date").textContent = endDate.toLocaleDateString('en-GB');
    }
    
    // Store in sessionStorage for other pages
    sessionStorage.setItem('apiProjectData', JSON.stringify(data.data));
    
  } catch (error) {
    console.error("Error fetching project data:", error);
    document.getElementById("project_name").textContent = "DATA UNAVAILABLE";
    document.getElementById("project_name").classList.add("error_state");
  }
}

// =================== DISPLAY DATA ===================
function displaydata() {
  // Weather & ground state
  const weather = document.querySelector('input[name="weather"]:checked')?.value || "";
  const ground = document.querySelector('input[name="ground-state"]:checked')?.value || "";
  sessionStorage.setItem('form-values', JSON.stringify([weather, ground]));
  
  // Time slots
  sessionStorage.setItem('timeslots', JSON.stringify(timeSlots));

  // Today's progress
  const todayData = [];
  const todayRows = document.querySelectorAll("#today-table tbody tr");
  todayRows.forEach(row => {
    const task = row.querySelector("td:first-child input")?.value.trim() || "--";
    const qty = row.querySelector("td:last-child input")?.value.trim() || "--";
    todayData.push([task, qty]);
  });
  sessionStorage.setItem('todayTableData', JSON.stringify(todayData));

  // Tomorrow's planning
  const tomorrowData = [];
  const tomorrowRows = document.querySelectorAll("#tomorrow-table tbody tr");
  tomorrowRows.forEach(row => {
    const task = row.querySelector("td:first-child input")?.value.trim() || "--";
    const qty = row.querySelector("td:last-child input")?.value.trim() || "--";
    tomorrowData.push([task, qty]);
  });
  sessionStorage.setItem('tomorrowTableData', JSON.stringify(tomorrowData));

  // Events
  const events = [];
  const eventInputs = document.querySelectorAll('#eventsContainer .event-input');
  eventInputs.forEach(input => {
    if (input.value.trim()) events.push(input.value.trim());
  });
  sessionStorage.setItem('eventsData', JSON.stringify(events));

  // Remarks
  const remarks = [];
  const remarkInputs = document.querySelectorAll('#remarksContainer .remark-input');
  remarkInputs.forEach(input => {
    if (input.value.trim()) remarks.push(input.value.trim());
  });
  sessionStorage.setItem('remarksData', JSON.stringify(remarks));

  // Labour report
  const labourTable = document.getElementById("labourTable");
  if (labourTable) {
    const headers = Array.from(labourTable.tHead.rows[0].cells).map(th => th.innerText.trim());
    const dataRows = labourTable.querySelectorAll("tbody .data-row");
    const labourReport = {};

    headers.forEach((h, i) => {
      if (i === 0) labourReport["agency"] = [];
      else if (i === headers.length - 1) labourReport["remarks"] = [];
      else if (h.toLowerCase() !== "total") labourReport[h] = [];
    });

    dataRows.forEach(row => {
      const cells = row.cells;
      headers.forEach((h, i) => {
        const input = cells[i]?.querySelector("input");
        const val = input?.value.trim() || "";
        if (i === 0) labourReport["agency"].push(val);
        else if (i === headers.length - 1) labourReport["remarks"].push(val);
        else if (h.toLowerCase() !== "total") labourReport[h].push(Number(val) || 0);
      });
    });

    sessionStorage.setItem("labourReport", JSON.stringify(labourReport));
  }

  // Redirect to viewer
  window.location.href = "dpr-viewer.html";
}

// =================== INITIALIZATION ===================
document.addEventListener('DOMContentLoaded', function() {
  // Initialize components
  updateTimeslotDisplay();
  updateTimeslotCount();
  initializeEvents();
  initializeRemarks();
  fetchProjectData();
  
  // Set up event listeners
  document.querySelectorAll('.cell-input').forEach(input => {
    input.addEventListener('input', calculateTotals);
  });
  
  // Add row buttons
  const addRowBtn = document.querySelector('.todo-add-row-btn');
  const addTomorrowRowBtn = document.querySelector('.tomo-add-row-btn');
  
  if (addRowBtn) addRowBtn.addEventListener('click', function() {
    const todayTable = document.getElementById('today-table');
    const tbody = todayTable.querySelector('tbody');
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
      <td><input type="text" class="today-progress"></td>
      <td><input type="number" class="today-progress-quantity"></td>
    `;
    tbody.appendChild(newRow);
  });
  
  if (addTomorrowRowBtn) addTomorrowRowBtn.addEventListener('click', function() {
    const tomorrowTable = document.getElementById('tomorrow-table');
    const tbody = tomorrowTable.querySelector('tbody');
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
      <td><input type="text" class="tomorrows-planning"></td>
      <td><input type="number" class="tomorrows-planning-quantity"></td>
    `;
    tbody.appendChild(newRow);
  });
  
  // Remove row buttons
  document.querySelectorAll('.remove-row-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const table = this.closest('.today-planning, .tomorrow-planning');
      const tbody = table.querySelector('tbody');
      const rows = tbody.querySelectorAll('tr');
      if (rows.length > 1) {
        tbody.removeChild(rows[rows.length - 1]);
      }
    });
  });
  
  // Add/remove event buttons
  const addEventBtn = document.getElementById('addEventBtn');
  const removeEventBtn = document.getElementById('removeEventBtn');
  
  if (addEventBtn) addEventBtn.addEventListener('click', function() {
    const container = document.getElementById('eventsContainer');
    const count = container.querySelectorAll('.input-group').length;
    const newInput = document.createElement('div');
    newInput.className = 'input-group';
    newInput.innerHTML = `<input type="text" class="event-input" placeholder="Event ${count + 1}">`;
    container.appendChild(newInput);
  });
  
  if (removeEventBtn) removeEventBtn.addEventListener('click', function() {
    const container = document.getElementById('eventsContainer');
    const inputs = container.querySelectorAll('.input-group');
    if (inputs.length > 6) {
      container.removeChild(inputs[inputs.length - 1]);
    }
  });
  
  // Add/remove remark buttons
  const addRemarkBtn = document.getElementById('addRemarkBtn');
  const removeRemarkBtn = document.getElementById('removeRemarkBtn');
  
  if (addRemarkBtn) addRemarkBtn.addEventListener('click', function() {
    const container = document.getElementById('remarksContainer');
    const count = container.querySelectorAll('.input-group').length;
    const newInput = document.createElement('div');
    newInput.className = 'input-group';
    newInput.innerHTML = `<input type="text" class="remark-input" placeholder="Remark ${count + 1}">`;
    container.appendChild(newInput);
  });
  
  if (removeRemarkBtn) removeRemarkBtn.addEventListener('click', function() {
    const container = document.getElementById('remarksContainer');
    const inputs = container.querySelectorAll('.input-group');
    if (inputs.length > 3) {
      container.removeChild(inputs[inputs.length - 1]);
    }
  });
  
  // Calculate initial totals
  calculateTotals();
});