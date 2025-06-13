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

//=============EVERYTHING RELATED TO FORM INPUT============================//
function displaydata() {
    const input_array = [];
    const today_progress = document.getElementById("today-progress").value;
    const today_progress_quantity = document.getElementById("today-progress-quantity").value;
    const tomorrows_planning = document.getElementById("tomorrows-planning").value;
    const tomorrows_planning_quantity = document.getElementById("tomorrows-planning-quantity").value;
  
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

    // Collect remarks/events data
    const remarksInputs = document.querySelectorAll('#dynamicInputsContainer input');
    const remarksData = Array.from(remarksInputs)
        .map(input => input.value.trim())
        .filter(remark => remark !== "");

    // Save all data to sessionStorage
    sessionStorage.setItem("todayTableData", JSON.stringify(todaytableData));
    sessionStorage.setItem("tomorrowTableData", JSON.stringify(tomorrowtableData));
    sessionStorage.setItem("form-values", JSON.stringify(input_array));
    sessionStorage.setItem("timeslots", JSON.stringify(timeSlots));
    sessionStorage.setItem("remarksData", JSON.stringify(remarksData));

    // Redirect to the next page
    window.location.href = "dpr-pdf.html";
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
  
    const newInputs = newRow.querySelectorAll(".cell-input");
    newInputs.forEach((input) => {
      input.addEventListener("input", (event) => {
        validateAndCalculate(event.target);
      });
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
      calculateTotals();
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
document.addEventListener('DOMContentLoaded', function() {
  const container = document.getElementById('dynamicInputsContainer');
  const addBtn = document.getElementById('addInputBtn');
  const removeBtn = document.getElementById('removeInputBtn');
  const MIN_INPUTS = 6; // Minimum number of remark fields
  
  // Initialize with minimum inputs
  function initializeInputs() {
    container.innerHTML = ''; // Clear any existing inputs
    for (let i = 0; i < MIN_INPUTS; i++) {
      addInputField();
    }
    updateRemoveButton();
  }
  
  // Add new input field (simplified without labels)
  function addInputField() {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'remark-input';
    input.placeholder = 'Enter remark/event...';
    container.appendChild(input);
  }
  
  // Update remove button state
  function updateRemoveButton() {
    const inputs = container.querySelectorAll('.remark-input');
    removeBtn.disabled = inputs.length <= MIN_INPUTS;
  }
  
  // Add event listeners
  addBtn.addEventListener('click', function() {
    addInputField();
    updateRemoveButton();
  });
  
  removeBtn.addEventListener('click', function() {
    const inputs = container.querySelectorAll('.remark-input');
    if (inputs.length > MIN_INPUTS) {
      container.removeChild(inputs[inputs.length - 1]);
      updateRemoveButton();
    }
  });
  
  // Initialize on page load
  initializeInputs();
});

// Initialize timeslot display
document.addEventListener('DOMContentLoaded', function() {
  updateTimeslotDisplay();
  updateTimeslotCount();
});