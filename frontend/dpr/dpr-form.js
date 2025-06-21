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


    // Collect events data (6 inputs minimum)
const eventsInputs = document.querySelectorAll('#dynamicInputsContainer input');
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

    //-------------fetching the data and displaying it to the today progress rows from yesterdays tomorrow planning---------------//
    // fetch("https://jsonplaceholder.typicode.com/posts")
    // .then(res => res.json())
    // .then(json => {
    //   const rowCount = json.length;
    //   console.log(rowCount)
    //   for(let i = 0; i < rowCount; i++){
    //   addRowToTable(todayTable);
    //   addRowToTable(tomorrowTable);
      
    //   }
    // });
// === Inject dummy data into tomorrow planning table ===
// You can change this URL to any valid API returning an array of objects
fetch("https://dummyjson.com/products?limit=3")  // 🔁 replace with your API
  .then(res => res.json())
  .then(data => {
    // Assuming API gives data like: { products: [ { title, price }, ... ] }
    const apiData = data.products || [];

    const mappedData = apiData.map(item => ({
      task: item.title,
      quantity: item.price
    }));

    const todayBody = todayTable.querySelector('tbody');
    const tomorrowBody = tomorrowTable.querySelector('tbody');

    if (mappedData.length > 0) {
      // Clear default HTML row if needed
      todayBody.innerHTML = '';
      tomorrowBody.innerHTML = '';

      // Add rows equal to API data length
      for (let i = 0; i < mappedData.length; i++) {
        addRowToTable(todayTable);
        addRowToTable(tomorrowTable);
      }

      // Fill data into rows
      const todayRows = todayTable.querySelectorAll('tbody tr');
      mappedData.forEach((item, index) => {

        // Today progress
        const dRow = todayRows[index];
        const dTaskInput = dRow.querySelector('.today-progress');
        const dQtyInput = dRow.querySelector('.today-progress-quantity');
        dTaskInput.value = item.task;
        dQtyInput.value = item.quantity;
      });

    } else {
      // If no API data, ensure at least one row exists
      if (todayBody.querySelectorAll('tr').length === 0) {
        addRowToTable(todayTable);
      }
      if (tomorrowBody.querySelectorAll('tr').length === 0) {
        addRowToTable(tomorrowTable);
      }
    }
  })
  .catch(error => {
    console.error("API fetch failed:", error);
    // On error, fallback: at least one row
    if (todayTable.querySelectorAll('tbody tr').length === 0) {
      addRowToTable(todayTable);
    }
    if (tomorrowTable.querySelectorAll('tbody tr').length === 0) {
      addRowToTable(tomorrowTable);
    }
  });



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


// Initialize timeslot display
document.addEventListener('DOMContentLoaded', function() {
  updateTimeslotDisplay();
  updateTimeslotCount();
});
// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the section with 3 default inputs
    const sectionContainer = document.querySelector('.dynamicInputsContainer');
    const addBtn = document.querySelector('.addInputBtn');
    const removeBtn = document.querySelector('.removeInputBtn');
    const storageKey = 'events-remarks-storage'; // Key for sessionStorage
    
    // Load saved data or initialize with empty inputs
    let inputsData = JSON.parse(sessionStorage.getItem(storageKey)) || Array(3).fill('');
    
    // Function to render inputs
    function renderInputs() {
        sectionContainer.innerHTML = '';
        inputsData.forEach((value, index) => {
            createInputElement(value, index);
        });
        updateRemoveButtonState();
    }
    
    // Function to create a single input element
    function createInputElement(value, index) {
        const inputGroup = document.createElement('div');
        inputGroup.className = 'input-group';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = value;
        input.placeholder = `Input ${index + 1}`;
        
        // Add event listener to save on change
        input.addEventListener('input', function() {
            inputsData[index] = this.value;
            saveToSessionStorage();
        });
        
        inputGroup.appendChild(input);
        sectionContainer.appendChild(inputGroup);
    }
    
    // Function to add a new input
    function addInput() {
        inputsData.push('');
        renderInputs();
        saveToSessionStorage();
    }
    
    // Function to remove last input (but keep minimum 3)
    function removeInput() {
        if (inputsData.length > 3) {
            inputsData.pop();
            renderInputs();
            saveToSessionStorage();
        }
    }
    
    // Function to update remove button state
    function updateRemoveButtonState() {
        removeBtn.disabled = inputsData.length <= 3;
    }
    
    // Function to save data to sessionStorage
    function saveToSessionStorage() {
        sessionStorage.setItem(storageKey, JSON.stringify(inputsData));
    }
    
    // Event listeners
    addBtn.addEventListener('click', addInput);
    removeBtn.addEventListener('click', removeInput);
    
    // Initial render
    renderInputs();
    
    // Also save when page is about to unload
    window.addEventListener('beforeunload', saveToSessionStorage);
});

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



