let timeSlots = []; // Declare timeSlots as a global variable

//===============================to STORE the from and to time========================================//
document.getElementById("time-slot-submit-button").addEventListener("click", function (event) {
    event.preventDefault(); // Prevent form submission
    
    timeSlots = []; // Reset timeSlots
    
    document.querySelectorAll("#timeSlotsContainer .time-slot").forEach(slot => {
        let fromTime = slot.querySelector("input[name^='fromTime']").value;
        let toTime = slot.querySelector("input[name^='toTime']").value;
        
        if (fromTime && toTime) {
            timeSlots.push({ from: fromTime, to: toTime });
        }
    });
    
    console.log(timeSlots); // Output the collected time slots
    
    // Close the modal after submission
    modal.style.display = "none";
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

// Start from index 1 to skip the header row
const todaytableData = todayrows.slice(1).map((row) => {
    const cells = Array.from(row.cells);
    return cells.map((cell) => {
        const input = cell.querySelector("input");
        return input ? input.value : cell.textContent.trim();
    });
});

// For the "tomorrow-table"
const tomorrowtable = document.getElementById("tomorrow-table");
const tomorrowrows = Array.from(tomorrowtable.rows);

// Start from index 1 to skip the header row
const tomorrowtableData = tomorrowrows.slice(1).map((row) => {
    const cells = Array.from(row.cells);
    return cells.map((cell) => {
        const input = cell.querySelector("input");
        // Return empty string for both empty inputs and empty cells
        return input ? input.value : "";
    });
});

// Save both table data to sessionStorage
sessionStorage.setItem("todayTableData", JSON.stringify(todaytableData));
sessionStorage.setItem("tomorrowTableData", JSON.stringify(tomorrowtableData));
    sessionStorage.setItem("form-values", JSON.stringify(input_array));
    sessionStorage.setItem("timeslots", JSON.stringify(timeSlots));

    // Redirect to the next page
    window.location.href = "dpr-pdf.html";
}


  //---------------------------------POP UP------------------------------------------//
  // Get the modal, button, and close elements
  const modal = document.getElementById("myModal");
  const openModalBtn = document.getElementById("pop-up");
  const closeModalBtn = document.querySelector(".close");

  // Open the modal when the button is clicked
  openModalBtn.addEventListener("click", () => {
    modal.style.display = "block";
  });

  // Close the modal when the close button is clicked
  closeModalBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Close the modal when clicking outside of it
  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });



    // Log the time slots
    // console.log("Time Slots:", timeSlots);

    // Close the modal after submission
    
  

  // Add Time Slot Button Functionality
  // Add Time Slot Button Functionality
// Add Time Slot Button Functionality
let timeSlotCount = 1; // Counter for time slots

document.getElementById("addTimeSlotBtn").addEventListener("click", () => {
    // Dynamically calculate the next time slot number based on existing slots
    const existingSlots = document.querySelectorAll("#timeSlotsContainer .time-slot").length;
    timeSlotCount = existingSlots + 1; // Set the counter to the correct number

    // Create a new time slot container
    const newTimeSlot = document.createElement("div");
    newTimeSlot.className = "time-slot";

    // Add a header for the time slot
    const timeslotHeader = document.createElement("h5");
    timeslotHeader.textContent = `TIME SLOT ${timeSlotCount}`;
    timeslotHeader.style.marginBottom = "10px"; // Add some spacing below the header
    timeslotHeader.style.color = "black";

    // Add "From Time" input
    const fromTimeInput = document.createElement("input");
    fromTimeInput.type = "time";
    fromTimeInput.id = `fromTime${timeSlotCount}`;
    fromTimeInput.name = `fromTime${timeSlotCount}`;
    fromTimeInput.required = true;

    // Add "To Time" input
    const toTimeInput = document.createElement("input");
    toTimeInput.type = "time";
    toTimeInput.id = `toTime${timeSlotCount}`;
    toTimeInput.name = `toTime${timeSlotCount}`;
    toTimeInput.required = true;

    // Add "Remove" button
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "Remove";
    removeButton.className = "remove-time-slot-button";

    // Attach event listener to remove button
    removeButton.addEventListener("click", (event) => {
        event.target.closest(".time-slot").remove(); // Remove this time slot
        updateTimeSlotHeaders(); // Update headers after removal
    });

    // Append header, inputs, and button to the new time slot container
    newTimeSlot.appendChild(timeslotHeader);
    newTimeSlot.appendChild(fromTimeInput);
    newTimeSlot.appendChild(toTimeInput);
    newTimeSlot.appendChild(removeButton);

    // Append the new time slot to the container
    document.getElementById("timeSlotsContainer").appendChild(newTimeSlot);
});

// Function to update time slot headers after a slot is removed
function updateTimeSlotHeaders() {
    const timeSlots = document.querySelectorAll("#timeSlotsContainer .time-slot");
    timeSlots.forEach((slot, index) => {
        const header = slot.querySelector("h3");
        if (header) {
            header.textContent = `TIME SLOT ${index + 1}`; // Update the header text
        }
    });
}

// Attach remove event listener to existing time slots (if any)
document.querySelectorAll(".remove-time-slot-button").forEach(button => {
    button.addEventListener("click", (event) => {
        event.target.closest(".time-slot").remove(); // Remove this time slot
    });
});

  
  
  
  //----------------------------------------------------  EVERYTHING RELATED TO ADD AND DELETE ROW ----------------------------------------//
  
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
    const removeButtons = document.querySelectorAll('.remove-row-btn'); // Get all remove buttons
  
    // Function to add a row to a specific table
    function addRowToTable(table) {
      const tbody = table.querySelector('tbody') || table.createTBody();
      const newRow = tbody.insertRow();
      
      // Create cells based on table type
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
        // Remove the last row if there's more than one
        rows[rows.length - 1].remove();
      } else if (rows.length === 1) {
        // Clear inputs but keep the row if it's the last one
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
    
    // Add event listeners to all remove buttons
    removeButtons.forEach(button => {
      button.addEventListener('click', handleRemoveRow);
    });
});
  //--------------------------TO CALCULATE THE GRAND TOTAL OF THE VALUES----------------------------------//

  function calculateTotals() {
    // Get all the rows with class 'data-row'
    const dataRows = document.querySelectorAll('.data-row');

    // Initialize an array to hold the totals for each column
    const columnTotals = new Array(9).fill(0); // 9 columns (Mason to Staff)
    let grandTotal = 0;

    // Loop through each data row
    dataRows.forEach(row => {
        let rowTotal = 0;

        // Loop through each input field in the row (excluding the first and last columns)
        const inputs = row.querySelectorAll('.cell-input');
        inputs.forEach((input, index) => {
            const value = parseFloat(input.value) || 0;
            rowTotal += value;
            columnTotals[index] += value;
        });

        // Update the row total
        const rowTotalInput = row.querySelector('.row-total');
        rowTotalInput.value = rowTotal;

        // Add to the grand total
        grandTotal += rowTotal;
    });

    // Update the column totals in the TOTAL row
    for (let i = 0; i < columnTotals.length; i++) {
        document.getElementById(`${i + 1}_total`).value = columnTotals[i];
    }

    // Update the grand total
    document.getElementById('grandtotal').value = grandTotal;
}
//-----------------------------------------------------------------------------------------------------------------------//



  function deleteRow() {
    const rows = document.querySelectorAll(".data-row");
    if (rows.length > 1) {
      rows[rows.length - 1].remove();
      calculateGrandTotal(); // Recalculate totals
    }
  }
  
    