const todayTable = document.getElementById('today-table');
const tomorrowTable = document.getElementById('tomorrow-table');

// Function to add a row to a specific table
function addRowToTable(table) {
  const tbody = table.querySelector('tbody') || table.createTBody();
  const newRow = tbody.insertRow();

  if (table.id === 'today-table') {
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








// =============================== TIME SLOTS IMPROVED UX ========================================= //
let timeSlots = []; // Global variable to store time slots

// Function to update timeslot display    
function updateTimeslotDisplay() {
  const display = document.getElementById('timeslots-display');
  display.innerHTML = '';
  
  if (timeSlots.length === 0) {
    display.style.display = 'none';
    return;
  }
  
  timeSlots.forEach((slot, index) => {
    const slotElement = document.createElement('div');
    slotElement.className = 'timeslot-item';
    slotElement.innerHTML = `
      <span>${slot.from} - ${slot.to}</span>
      <span class="timeslot-remove" data-index="${index}">×</span>
    `;
    display.appendChild(slotElement);
  });
  
  // Add event listeners to remove buttons
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

// Function to update timeslot count badge
function updateTimeslotCount() {
  const countElement = document.getElementById('timeslot-count');
  countElement.textContent = timeSlots.length;
  document.getElementById('pop-up').innerHTML = `<span id="timeslot-count">${timeSlots.length}</span> TIME SLOTS`;
}

// Store timeslots when form is submitted
document.getElementById("time-slot-submit-button").addEventListener("click", function (event) {
  event.preventDefault();
  
  timeSlots = []; // Reset timeSlots
  
  document.querySelectorAll("#timeSlotsContainer .time-slot").forEach(slot => {
    let fromTime = slot.querySelector("input[type='time']:first-of-type").value;
    let toTime = slot.querySelector("input[type='time']:last-of-type").value;
    
    if (fromTime && toTime) {
      timeSlots.push({ from: fromTime, to: toTime });
    }
  });
  
  updateTimeslotDisplay();
  updateTimeslotCount();
  modal.style.display = "none";
});

// Toggle timeslot display when button is clicked
document.getElementById("pop-up").addEventListener("click", function(e) {
  // Only toggle if not opening the modal
  if (e.target !== this && e.target.className !== 'timeslot-remove') return;
  
  const display = document.getElementById('timeslots-display');
  if (timeSlots.length > 0) {
    display.style.display = display.style.display === 'none' ? 'block' : 'none';
  } else {
    modal.style.display = "block";
  }
});

// Add Time Slot Button Functionality
document.getElementById("addTimeSlotBtn").addEventListener("click", (e) => {
  e.preventDefault();
  const existingSlots = document.querySelectorAll("#timeSlotsContainer .time-slot").length;
  const timeSlotCount = existingSlots + 1;

  const newTimeSlot = document.createElement("div");
  newTimeSlot.className = "time-slot";

  const timeslotHeader = document.createElement("h5");
  timeslotHeader.textContent = `TIME SLOT ${timeSlotCount}`;

  const fromTimeInput = document.createElement("input");
  fromTimeInput.type = "time";
  fromTimeInput.className = "time-input";

  const toTimeInput = document.createElement("input");
  toTimeInput.type = "time";
  toTimeInput.className = "time-input";

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.textContent = "Remove";
  removeButton.className = "remove-time-slot-button";

  removeButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.target.closest(".time-slot").remove();
  });

  newTimeSlot.appendChild(timeslotHeader);
  newTimeSlot.appendChild(fromTimeInput);
  newTimeSlot.appendChild(toTimeInput);
  newTimeSlot.appendChild(removeButton);

  document.getElementById("timeSlotsContainer").appendChild(newTimeSlot);
});
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners to existing inputs
    const existingInputs = document.querySelectorAll(".cell-input");
    existingInputs.forEach(input => {
        input.addEventListener("input", calculateTotals);
    });
    
    // Initialize other components...
    updateTimeslotDisplay();
    updateTimeslotCount();
});
//=============EVERYTHING RELATED TO FORM INPUT============================//
function displaydata() {
    const input_array = [];
    const today_progress_input = document.querySelector(".today-progress");
const today_progress_quantity_input = document.querySelector(".today-progress-quantity");

const today_progress = today_progress_input ? today_progress_input.value : "";
const today_progress_quantity = today_progress_quantity_input ? today_progress_quantity_input.value : "";

   const tomorrows_planning_input = document.querySelector(".tomorrows-planning");
const tomorrows_planning_quantity_input = document.querySelector(".tomorrows-planning-quantity");

const tomorrows_planning = tomorrows_planning_input ? tomorrows_planning_input.value : "";
const tomorrows_planning_quantity = tomorrows_planning_quantity_input ? tomorrows_planning_quantity_input.value : "";

  
    let radio_buttons_value = "";
    let ground_ground_state_value = "";
  
    var radio_buttons = document.getElementsByName("weather");
    var ground_state_button = document.getElementsByName("ground-state");
  
    for (let i = 0; i < radio_buttons.length; i++) {
      if (radio_buttons[i].checked) {
        radio_buttons_value = radio_buttons[i].value;
      }
    }
  
    for (let j = 0; j < ground_state_button.length; j++) {
      if (ground_state_button[j].checked) {
        ground_ground_state_value = ground_state_button[j].value;
      }
    }
  
    input_array.push(
      radio_buttons_value,
      ground_ground_state_value,
      today_progress,
      today_progress_quantity,
      tomorrows_planning,
      tomorrows_planning_quantity
    );
  
    const table = document.getElementById("labourTable");
    const rows = Array.from(table.rows);
    
    // Start from index 1 to skip the header row
    const tableData = rows.slice(1).map((row) => {
        const cells = Array.from(row.cells);
        return cells.map((cell) => {
            const input = cell.querySelector("input");
            return input ? input.value : cell.textContent.trim();
        });
    });
  
    // Save the table data to sessionStorage
    sessionStorage.setItem("userTableData", JSON.stringify(tableData));

    // For the "today-table"
    const todaytable = document.getElementById("today-table");
    const todayrows = Array.from(todaytable.rows);

    const todaytableData = todayrows.slice(1).map((row) => {
        const cells = Array.from(row.cells);
        return cells.map((cell) => {
            const input = cell.querySelector("input");
            const value = input ? input.value.trim() : cell.textContent.trim();
            return value === "" ? "--" : value;
        });
    });

    // For the "tomorrow-table"
    const tomorrowtable = document.getElementById("tomorrow-table");
    const tomorrowrows = Array.from(tomorrowtable.rows);

    const tomorrowtableData = tomorrowrows.slice(1).map((row) => {
        const cells = Array.from(row.cells);
        return cells.map((cell) => {
            const input = cell.querySelector("input");
            const value = input ? input.value.trim() : "";
            return value === "" ? "--" : value;
        });
    });


    // Collect events data (6 inputs minimum)
// With this new version that works with the 6-field minimum setup:
const eventsInputs = document.querySelectorAll('#eventsContainer .event-input');
const eventsData = Array.from(eventsInputs)
    .map(input => input.value.trim())
    .filter(event => event !== "");



   const remarksInputs = document.querySelectorAll('.dynamicInputsContainer input');
const remarksData = Array.from(remarksInputs)
    .map(input => input.value.trim())
    .filter(remark => remark !== "");
    // Save all data to sessionStorage
    sessionStorage.setItem("todayTableData", JSON.stringify(todaytableData));
    sessionStorage.setItem("tomorrowTableData", JSON.stringify(tomorrowtableData));
    sessionStorage.setItem("form-values", JSON.stringify(input_array));
    sessionStorage.setItem("timeslots", JSON.stringify(timeSlots));
    sessionStorage.setItem("eventsData", JSON.stringify(eventsData)); // For events section
    sessionStorage.setItem("remarksData", JSON.stringify(remarksData)); // For remarks section

    // Redirect to the next page
    window.location.href = "dpr-viewer.html";
}

//---------------------------------------------------- EVERYTHING RELATED TO ADD AND DELETE ROW ----------------------------------------//
  
function addRow() {
    const tableBody = document.querySelector("#labourTable tbody");
    const newRow = document.createElement("tr");
    newRow.classList.add("data-row");
    newRow.innerHTML = `
      <td><input type="text" /></td>
      <td><input type="number" class="cell-input" /></td>
      <td><input type="number" class="cell-input" /></td>
      <td><input type="number" class="cell-input" /></td>
      <td><input type="number" class="cell-input" /></td>
      <td><input type="number" class="cell-input" /></td>
      <td><input type="number" class="cell-input" /></td>
      <td><input type="number" class="cell-input" /></td>
      <td><input type="number" class="cell-input" /></td>
      <td><input type="number" class="cell-input" /></td>
      <td><input type="number" class="row-total" disabled /></td>
      <td><input type="text" /></td>
    `;
    tableBody.insertBefore(newRow, tableBody.lastElementChild);
  
    // Add event listeners to all new inputs
    const inputs = newRow.querySelectorAll(".cell-input");
    inputs.forEach(input => {
        input.addEventListener("input", calculateTotals);
    });
}

//----------------------to add the rows of today planning-------------------------------------------//
document.addEventListener('DOMContentLoaded', function() {
    // Get all relevant elements
    const todayTable = document.getElementById('today-table');
    const tomorrowTable = document.getElementById('tomorrow-table');
    const todayAddBtn = document.querySelector('.today-planning .todo-add-row-btn');
    const tomorrowAddBtn = document.querySelector('.tomorrow-planning .tomo-add-row-btn');
    const removeButtons = document.querySelectorAll('.remove-row-btn');
  
    // Function to add a row to a specific table
    function addRowToTable(table) {
      const tbody = table.querySelector('tbody') || table.createTBody();
      const newRow = tbody.insertRow();
      
      if (table.id === 'today-table') {
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
  
    // Function to remove row from a specific table
    function removeRowFromTable(table) {
      const rows = table.querySelectorAll('tbody tr');
      if (rows.length > 1) {
        rows[rows.length - 1].remove();
      } else if (rows.length === 1) {
        const inputs = rows[0].querySelectorAll('input');
        inputs.forEach(input => input.value = '');
      }
    }

    // Function to handle synchronized row addition
    function handleAddRow() {
      addRowToTable(todayTable);
      addRowToTable(tomorrowTable);
    }

//--------------------- for the static / constant detaisl to be displayed on the pdf form header--------------------------\\

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
    console.log('Success:', Apidata);
    document.getElementById("project_name").innerHTML = Apidata.data.project_name;
    document.getElementById("start_date").innerHTML = new Date(Apidata.data.start_date).toLocaleDateString('en-GB');
    document.getElementById("end_date").innerHTML = new Date(Apidata.data.end_date).toLocaleDateString('en-GB');
    document.getElementById("Employer").innerHTML = Apidata.data.Employer;
    document.getElementById("project_description").innerHTML = Apidata.data.project_description;
    document.getElementById("contract_no").innerHTML = Apidata.data.contract_no;
    document.getElementById("location").innerHTML = Apidata.data.location;

    trial = "Rendered value:", document.getElementById("project_name").textContent
  })
  .catch(error => {
    console.error('Error:', error);
  });


  //-----------------------------------------------------------------------------------------------------------------------

    // Function to handle synchronized row removal
    function handleRemoveRow() {
      removeRowFromTable(todayTable);
      removeRowFromTable(tomorrowTable);
    }

    // Event listeners
    if (todayAddBtn) todayAddBtn.addEventListener('click', handleAddRow);
    if (tomorrowAddBtn) tomorrowAddBtn.addEventListener('click', handleAddRow);
    
    removeButtons.forEach(button => {
      button.addEventListener('click', handleRemoveRow);
    });
});

//--------------------------TO CALCULATE THE GRAND TOTAL OF THE VALUES----------------------------------//
function calculateTotals() {
    const dataRows = document.querySelectorAll('.data-row');
    const columnTotals = new Array(9).fill(0);
    let grandTotal = 0;

    dataRows.forEach(row => {
        let rowTotal = 0;
        const inputs = row.querySelectorAll('.cell-input');
        inputs.forEach((input, index) => {
            const value = parseFloat(input.value) || 0;
            rowTotal += value;
            columnTotals[index] += value;
        });

        const rowTotalInput = row.querySelector('.row-total');
        rowTotalInput.value = rowTotal;
        grandTotal += rowTotal;
    });

    for (let i = 0; i < columnTotals.length; i++) {
        document.getElementById(`${i + 1}_total`).value = columnTotals[i];
    }

    document.getElementById('grandtotal').value = grandTotal;
}

function deleteRow() {
    const rows = document.querySelectorAll(".data-row");
    if (rows.length > 1) {
        rows[rows.length - 1].remove();
        calculateTotals(); // Recalculate after deletion
    }
}

//---------------------------------POP UP------------------------------------------//
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

// =============================== REMARKS/EVENTS INPUT =============================== //
// ===================== EVENTS SECTION (6+ inputs) ===================== //
document.addEventListener('DOMContentLoaded', function() {
  const eventsContainer = document.getElementById('eventsContainer');
  const addEventBtn = document.getElementById('addEventBtn');
  const removeEventBtn = document.getElementById('removeEventBtn');
  const MIN_EVENTS = 6; // Minimum 6 input fields
  const STORAGE_KEY = 'events-data';

  // Initialize with 6 empty fields or load saved data
  function initializeEvents() {
    const savedData = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
    const initialData = savedData || Array(MIN_EVENTS).fill('');
    
    // Clear container and recreate inputs
    eventsContainer.innerHTML = '';
    initialData.forEach((value, index) => {
      createEventInput(value, index);
    });
    
    updateRemoveButton();
  }

  // Create a single event input field
  function createEventInput(value, index) {
    const inputGroup = document.createElement('div');
    inputGroup.className = 'input-group';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'event-input';
    input.value = value;
    input.placeholder = `Event ${index + 1}`;
    
    // Save on input change
    input.addEventListener('input', function() {
      saveEventsToStorage();
    });
    
    inputGroup.appendChild(input);
    eventsContainer.appendChild(inputGroup);
  }

  // Add new event field
  function addEvent() {
    createEventInput('', eventsContainer.children.length);
    saveEventsToStorage();
    updateRemoveButton();
  }

  // Remove last event field (if above minimum)
  function removeEvent() {
    if (eventsContainer.children.length > MIN_EVENTS) {
      eventsContainer.removeChild(eventsContainer.lastElementChild);
      saveEventsToStorage();
      updateRemoveButton();
    }
  }

  // Update remove button state
  function updateRemoveButton() {
    removeEventBtn.disabled = eventsContainer.children.length <= MIN_EVENTS;
  }

  // Save all events data to sessionStorage
  function saveEventsToStorage() {
    const inputs = eventsContainer.querySelectorAll('.event-input');
    const eventsData = Array.from(inputs).map(input => input.value.trim());
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(eventsData));
  }

  // Event listeners
  addEventBtn.addEventListener('click', addEvent);
  removeEventBtn.addEventListener('click', removeEvent);
  
  // Initialize on load
  initializeEvents();
  
  // Save before page unload
  window.addEventListener('beforeunload', saveEventsToStorage);
});

// In your displaydata() function, use this to collect events:
function getEventsData() {
  const inputs = document.querySelectorAll('#eventsContainer .event-input');
  return Array.from(inputs).map(input => input.value.trim())
                         .filter(event => event !== "");
}
// ===================== REMARKS SECTION (3+ inputs) ===================== //
document.addEventListener('DOMContentLoaded', function() {
  const remarksContainer = document.getElementById('remarksContainer');
  const addRemarkBtn = document.getElementById('addRemarkBtn');
  const removeRemarkBtn = document.getElementById('removeRemarkBtn');
  const MIN_INPUTS = 3; // Minimum required remarks

  // Initialize with 3 inputs
  function initializeRemarks() {
    remarksContainer.innerHTML = '';
    for (let i = 0; i < MIN_INPUTS; i++) {
      addRemarkField();
    }
    updateRemoveButton();
  }

  // Add new remark field
  function addRemarkField() {
    const inputGroup = document.createElement('div');
    inputGroup.className = 'input-group';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'remark-input';
    input.placeholder = `Remark ${remarksContainer.children.length + 1}`;
    
    inputGroup.appendChild(input);
    remarksContainer.appendChild(inputGroup);
  }

  // Update remove button state
  function updateRemoveButton() {
    removeRemarkBtn.disabled = remarksContainer.children.length <= MIN_INPUTS;
  }

  // Event listeners
  addRemarkBtn.addEventListener('click', function() {
    addRemarkField();
    updateRemoveButton();
  });

  removeRemarkBtn.addEventListener('click', function() {
    if (remarksContainer.children.length > MIN_INPUTS) {
      remarksContainer.removeChild(remarksContainer.lastElementChild);
      updateRemoveButton();
    }
  });

  // Initialize on load
  initializeRemarks();
});

// In your displaydata() function, keep this for data collection:
const remarksInputs = document.querySelectorAll('#remarksContainer .remark-input');
const remarksData = Array.from(remarksInputs)
    .map(input => input.value.trim())
    .filter(remark => remark !== "");



  function clearTableKeepRows() {
    const inputs = document.querySelectorAll('#labourTable td input');
    inputs.forEach(input => input.value = '');
    if (typeof calculateTotals === 'function') calculateTotals();
}

// Replace the last part of your dpr-approval.js with this:


fetch("http://34.47.131.237:3000/report/getDPR/30")
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(apiResponse => {
    console.log("API Response:", apiResponse);

    if (!apiResponse.success || !apiResponse.data) {
      throw new Error("Invalid API response structure");
    }

    const apiData = apiResponse.data;

    const normalizedData = {
      dpr_id: apiData.dpr_id || 0,
      project_id: apiData.project_id || 0,
      report_date: apiData.report_date ? apiData.report_date.split('T')[0] : "",
      site_condition: {
        ground_state: apiData.site_condition?.ground_state || "",
        is_rainy: apiData.site_condition?.is_rainy || false,
        rain_timing: apiData.site_condition?.rain_timing || []
      },
      labour_report: {
        agency: apiData.labour_report?.agency || [],
        mason: apiData.labour_report?.mason || [],
        carp: apiData.labour_report?.carp || [],
        fitter: apiData.labour_report?.fitter || [],
        electrical: apiData.labour_report?.electrical || [],
        painter: apiData.labour_report?.painter || [],
        gypsum: apiData.labour_report?.gypsum || [],
        plumber: apiData.labour_report?.plumber || [],
        helper: apiData.labour_report?.helper || [],
        staff: apiData.labour_report?.staff || [],
        remarks: apiData.labour_report?.remarks || ""
      },
      today_prog: {
        progress: apiData.today_prog?.progress || [],
        qty: apiData.today_prog?.qty || []
      },
      tomorrow_plan: {
        plan: apiData.tomorrow_plan?.plan || [],
        qty: apiData.tomorrow_plan?.qty || []
      },
      report_footer: {
        distribute: apiData.report_footer?.events_visit || [],
        prepared_by: apiData.report_footer?.prepared_by || "",
        events_visit: apiData.report_footer?.events_visit || []
      },
      cumulative_manpower: apiData.cumulative_manpower || 0,
      user_roles: apiData.user_roles || null,
      created_at: apiData.created_at || null
    };

    populateDPRForm(normalizedData);
  })
  .catch(apiError => {
    console.error("API Error:", apiError);

    const sampleData = {
      dpr_id: 6,
      project_id: 1,
      report_date: "2025-01-15",
      site_condition: {
        ground_state: "dry",
        is_rainy: false,
        rain_timing: ["10:10-11:00", "01:05-02:00"]
      },
      labour_report: {
        agency: ["MAPLANI", "L&T", "AMAZON", "NVIDIA"],
        mason: [0, 0, 1, 0],
        carp: [1, 0, 3, 5],
        fitter: [2, 1, 0, 4],
        electrical: [0, 2, 1, 3],
        painter: [1, 1, 0, 0],
        gypsum: [3, 0, 2, 1],
        plumber: [0, 0, 0, 2],
        helper: [5, 2, 3, 1],
        staff: [2, 1, 1, 0],
        remarks: "test remarks"
      },
      today_prog: {
        progress: ["cement imported.", "water distributed."],
        qty: ["1kg", "5L"]
      },
      tomorrow_plan: {
        plan: ["cement imported.", "water distributed."],
        qty: ["1kg", "5L"]
      },
      report_footer: {
        distribute: ["L&T", "MAPLANI"],
        prepared_by: "Mano Project Pvt. Ltd.",
        events_visit: []
      },
      cumulative_manpower: 0,
      user_roles: null,
      created_at: null
    };

    console.log("Using sample data instead");
    populateDPRForm(sampleData);
  });

// Combined form population logic
function populateDPRForm(data) {
  // 1. Site Condition
  if (data.site_condition) {
    document.getElementById(data.site_condition.is_rainy ? 'rainy' : 'sunny').checked = true;
    document.getElementById(data.site_condition.ground_state || 'dry').checked = true;

    if (data.site_condition.rain_timing) {
      timeSlots = data.site_condition.rain_timing.map(slot => {
        const [from, to] = slot.split('-');
        return { from, to };
      });
      updateTimeslotDisplay();
      updateTimeslotCount();
    }
  }

  // 2. Labour Report
  if (data.labour_report) {
    const tbody = document.querySelector('#labourTable tbody');
    document.querySelectorAll('#labourTable tr.data-row').forEach(row => row.remove());

    data.labour_report.agency.forEach((agency, i) => {
      const row = document.createElement('tr');
      row.className = 'data-row';
      row.innerHTML = `
        <td><input type="text" value="${agency}" /></td>
        <td><input type="number" class="cell-input" value="${data.labour_report.mason[i] || 0}" /></td>
        <td><input type="number" class="cell-input" value="${data.labour_report.carp[i] || 0}" /></td>
        <td><input type="number" class="cell-input" value="${data.labour_report.fitter[i] || 0}" /></td>
        <td><input type="number" class="cell-input" value="${data.labour_report.electrical[i] || 0}" /></td>
        <td><input type="number" class="cell-input" value="${data.labour_report.painter[i] || 0}" /></td>
        <td><input type="number" class="cell-input" value="${data.labour_report.gypsum[i] || 0}" /></td>
        <td><input type="number" class="cell-input" value="${data.labour_report.plumber[i] || 0}" /></td>
        <td><input type="number" class="cell-input" value="${data.labour_report.helper[i] || 0}" /></td>
        <td><input type="number" class="cell-input" value="${data.labour_report.staff[i] || 0}" /></td>
        <td><input type="number" class="row-total" disabled /></td>
        <td><input type="text" value="${data.labour_report.remarks || ''}" /></td>
      `;
      tbody.insertBefore(row, tbody.lastElementChild);
    });

    if (typeof calculateTotals === 'function') {
      calculateTotals();
    }
  }

  // 3. Today's Progress
  const todayBody = document.querySelector('#today-table tbody');
  todayBody.innerHTML = '';
  const todayProg = data.today_prog || { progress: [], qty: [] };
  for (let i = 0; i < todayProg.progress.length; i++) {
    addRowToTable(todayTable);
  }
  const todayRows = todayTable.querySelectorAll('tbody tr');
  todayProg.progress.forEach((task, index) => {
    const row = todayRows[index];
    const taskInput = row.querySelector('.today-progress');
    const qtyInput = row.querySelector('.today-progress-quantity');
    taskInput.value = task;
    qtyInput.value = todayProg.qty[index] || '';
  });

  // 4. Tomorrow's Plan
  const tomorrowBody = document.querySelector('#tomorrow-table tbody');
  tomorrowBody.innerHTML = '';
  const tomorrowPlan = data.tomorrow_plan || { plan: [], qty: [] };
  for (let i = 0; i < tomorrowPlan.plan.length; i++) {
    addRowToTable(tomorrowTable);
  }
  const tomorrowRows = tomorrowTable.querySelectorAll('tbody tr');
  tomorrowPlan.plan.forEach((task, index) => {
    const row = tomorrowRows[index];
    const taskInput = row.querySelector('.tomorrows-planning');
    const qtyInput = row.querySelector('.tomorrows-planning-quantity');
    taskInput.value = task;
    qtyInput.value = tomorrowPlan.qty[index] || '';
  });

  // 5. Footer
  if (data.report_footer) {
    const remarksInputs = document.querySelectorAll('#remarksContainer input');
    if (remarksInputs[0]) remarksInputs[0].value = data.report_footer.prepared_by || '';

    const eventInputs = document.querySelectorAll('#eventsContainer input');
    data.report_footer.distribute.forEach((item, i) => {
      if (eventInputs[i]) {
        eventInputs[i].value = item;
      }
    });
  }
}
