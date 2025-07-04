// =================== TIME SLOTS ===================
let timeSlots = [];

// Function to update timeslot display
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

  // Add event listeners to remove buttons
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
  document.getElementById(
    "pop-up"
  ).innerHTML = `<span id="timeslot-count">${timeSlots.length}</span> TIME SLOTS`;
}

// Store timeslots when form is submitted
document
  .getElementById("time-slot-submit-button")
  .addEventListener("click", function (event) {
    event.preventDefault();

    timeSlots = []; // Reset timeSlots

    document
      .querySelectorAll("#timeSlotsContainer .time-slot")
      .forEach((slot) => {
        let fromTime = slot.querySelector(
          "input[type='time']:first-of-type"
        ).value;
        let toTime = slot.querySelector(
          "input[type='time']:last-of-type"
        ).value;

        if (fromTime && toTime) {
          timeSlots.push({ from: fromTime, to: toTime });
        }
      });

    updateTimeslotDisplay();
    updateTimeslotCount();
    modal.style.display = "none";
  });

// Toggle timeslot display when button is clicked
document.getElementById("pop-up").addEventListener("click", function (e) {
  // Only toggle if not opening the modal
  if (e.target !== this && e.target.className !== "timeslot-remove") return;

  const display = document.getElementById("timeslots-display");
  if (timeSlots.length > 0) {
    display.style.display = display.style.display === "none" ? "block" : "none";
  } else {
    modal.style.display = "block";
  }
});

// Add Time Slot Button Functionality
document.getElementById("addTimeSlotBtn").addEventListener("click", (e) => {
  e.preventDefault();
  const existingSlots = document.querySelectorAll(
    "#timeSlotsContainer .time-slot"
  ).length;
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
document.addEventListener("DOMContentLoaded", function () {
  // Add event listeners to existing inputs
  const existingInputs = document.querySelectorAll(".cell-input");
  existingInputs.forEach((input) => {
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
  const today_progress_quantity_input = document.querySelector(
    ".today-progress-quantity"
  );

  const today_progress = today_progress_input ? today_progress_input.value : "";
  const today_progress_quantity = today_progress_quantity_input
    ? today_progress_quantity_input.value
    : "";

  const tomorrows_planning_input = document.querySelector(
    ".tomorrows-planning"
  );
  const tomorrows_planning_quantity_input = document.querySelector(
    ".tomorrows-planning-quantity"
  );

  const tomorrows_planning = tomorrows_planning_input
    ? tomorrows_planning_input.value
    : "";
  const tomorrows_planning_quantity = tomorrows_planning_quantity_input
    ? tomorrows_planning_quantity_input.value
    : "";

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
  const eventsInputs = document.querySelectorAll(
    "#eventsContainer .event-input"
  );
  const eventsData = Array.from(eventsInputs)
    .map((input) => input.value.trim())
    .filter((event) => event !== "");

  const remarksInputs = document.querySelectorAll(
    ".dynamicInputsContainer input"
  );
  const remarksData = Array.from(remarksInputs)
    .map((input) => input.value.trim())
    .filter((remark) => remark !== "");
  // Save all data to sessionStorage
  sessionStorage.setItem("todayTableData", JSON.stringify(todaytableData));
  sessionStorage.setItem(
    "tomorrowTableData",
    JSON.stringify(tomorrowtableData)
  );
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
  inputs.forEach((input) => {
    input.addEventListener("input", calculateTotals);
  });
}

//----------------------to add the rows of today planning-------------------------------------------//
document.addEventListener("DOMContentLoaded", function () {
  // Get all relevant elements
  const todayTable = document.getElementById("today-table");
  const tomorrowTable = document.getElementById("tomorrow-table");
  const todayAddBtn = document.querySelector(
    ".today-planning .todo-add-row-btn"
  );
  const tomorrowAddBtn = document.querySelector(
    ".tomorrow-planning .tomo-add-row-btn"
  );
  const removeButtons = document.querySelectorAll(".remove-row-btn");

  // Function to add a row to a specific table
  function addRowToTable(table) {
    const tbody = table.querySelector("tbody") || table.createTBody();
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

  // Function to remove row from a specific table
  function removeRowFromTable(table) {
    const rows = table.querySelectorAll("tbody tr");
    if (rows.length > 1) {
      rows[rows.length - 1].remove();
    } else if (rows.length === 1) {
      const inputs = rows[0].querySelectorAll("input");
      inputs.forEach((input) => (input.value = ""));
    }
  }

  // Function to handle synchronized row addition
  function handleAddRow() {
    addRowToTable(todayTable);
    addRowToTable(tomorrowTable);
  }

  const projectId = localStorage.getItem("selected_project_id");

  if (!projectId) {
    alert("No project selected. Please go back and choose a project.");
    window.location.href = "../home/projectdesc.html"; // Or fallback page
  } else {
    fetch(`http://34.47.131.237:3000/project/getProject/${projectId}`)
      .then((response) => {
        if (!response.ok) {
          document.getElementById("project_name").textContent =
            "DATA UNAVAILABLE";
          return Promise.reject(new Error("Project not found"));
        }
        return response.json();
      })
      .then((Apidata) => {
        document.getElementById("project_name").innerHTML =
          Apidata.data.project_name;
        document.getElementById("start_date").innerHTML = new Date(
          Apidata.data.start_date
        ).toLocaleDateString("en-GB");
        document.getElementById("end_date").innerHTML = new Date(
          Apidata.data.end_date
        ).toLocaleDateString("en-GB");
        document.getElementById("Employer").innerHTML = Apidata.data.Employer;
        document.getElementById("project_description").innerHTML =
          Apidata.data.project_description;
        document.getElementById("contract_no").innerHTML =
          Apidata.data.contract_no;
        document.getElementById("location").innerHTML = Apidata.data.location;
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

// You can change this URL to any valid API returning an array of objects
async function getLatestDprId() {
  try {
    const response = await fetch(`http://34.47.131.237:3000/report/Alldpr/${projectId}?limit=10`);
    const dprArray = await response.json();

    const latestDPR = dprArray.reduce((latest, current) => {
      return new Date(current.report_date) > new Date(latest.report_date) ? current : latest;
    });

    const latestDprId = latestDPR.dpr_id;

    // ✅ Move the second fetch here so it waits for the ID
    fetch(`http://34.47.131.237:3000/report/getDPR/${latestDprId}`)
      .then(res => res.ok ? res.json() : Promise.reject("Previous DPR not found"))
      .then(prev => {
        const prevPlan = prev?.data?.tomorrow_plan;
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
      })
      .catch(err => console.error("Error fetching previous DPR:", err));

  } catch (error) {
    console.error("Fetch error:", error);
  }
}
getLatestDprId();


  //-----------------------------------------------------------------------------------------------------------------------

  // Function to handle synchronized row removal
  function handleRemoveRow() {
    removeRowFromTable(todayTable);
    removeRowFromTable(tomorrowTable);
  }

  // Event listeners
  if (todayAddBtn) todayAddBtn.addEventListener("click", handleAddRow);
  if (tomorrowAddBtn) tomorrowAddBtn.addEventListener("click", handleAddRow);

  removeButtons.forEach((button) => {
    button.addEventListener("click", handleRemoveRow);
  });
});

//--------------------------TO CALCULATE THE GRAND TOTAL OF THE VALUES----------------------------------//
function calculateTotals() {
  const dataRows = document.querySelectorAll(".data-row");
  const columnTotals = new Array(9).fill(0);
  let grandTotal = 0;

  dataRows.forEach((row) => {
    let rowTotal = 0;
    const inputs = row.querySelectorAll(".cell-input");
    inputs.forEach((input, index) => {
      const value = parseFloat(input.value) || 0;
      rowTotal += value;
      columnTotals[index] += value;
    });

    const rowTotalInput = row.querySelector(".row-total");
    rowTotalInput.value = rowTotal;
    grandTotal += rowTotal;
  });

  for (let i = 0; i < columnTotals.length; i++) {
    document.getElementById(`${i + 1}_total`).value = columnTotals[i];
  }

  document.getElementById("grandtotal").value = grandTotal;
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

// ===================== EVENTS SECTION (6+ inputs) ===================== //
document.addEventListener("DOMContentLoaded", function () {
  const eventsContainer = document.getElementById("eventsContainer");
  const addEventBtn = document.getElementById("addEventBtn");
  const removeEventBtn = document.getElementById("removeEventBtn");
  const MIN_EVENTS = 6; // Minimum 6 input fields
  const STORAGE_KEY = "events-data";

  // Initialize with 6 empty fields or load saved data
  function initializeEvents() {
    const savedData = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
    const initialData = savedData || Array(MIN_EVENTS).fill("");

    // Clear container and recreate inputs
    eventsContainer.innerHTML = "";
    initialData.forEach((value, index) => {
      createEventInput(value, index);
    });

    updateRemoveButton();
  }

  // Create a single event input field
  function createEventInput(value, index) {
    const inputGroup = document.createElement("div");
    inputGroup.className = "input-group";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "event-input";
    input.value = value;
    input.placeholder = `Event ${index + 1}`;

    // Save on input change
    input.addEventListener("input", function () {
      saveEventsToStorage();
    });

    inputGroup.appendChild(input);
    eventsContainer.appendChild(inputGroup);
  }

  // Add new event field
  function addEvent() {
    createEventInput("", eventsContainer.children.length);
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
    const inputs = eventsContainer.querySelectorAll(".event-input");
    const eventsData = Array.from(inputs).map((input) => input.value.trim());
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(eventsData));
  }

  // Event listeners
  addEventBtn.addEventListener("click", addEvent);
  removeEventBtn.addEventListener("click", removeEvent);

  // Initialize on load
  initializeEvents();

  // Save before page unload
  window.addEventListener("beforeunload", saveEventsToStorage);
});

// In your displaydata() function, use this to collect events:
function getEventsData() {
  const inputs = document.querySelectorAll("#eventsContainer .event-input");
  return Array.from(inputs)
    .map((input) => input.value.trim())
    .filter((event) => event !== "");
}

// ===================== REMARKS SECTION (3+ inputs) ===================== //
document.addEventListener("DOMContentLoaded", function () {
  const remarksContainer = document.getElementById("remarksContainer");
  const addRemarkBtn = document.getElementById("addRemarkBtn");
  const removeRemarkBtn = document.getElementById("removeRemarkBtn");
  const MIN_INPUTS = 3; // Minimum required remarks

  // Initialize with 3 inputs
  function initializeRemarks() {
    remarksContainer.innerHTML = "";
    for (let i = 0; i < MIN_INPUTS; i++) {
      addRemarkField();
    }
    updateRemoveButton();
  }

  // Add new remark field
  function addRemarkField() {
    const inputGroup = document.createElement("div");
    inputGroup.className = "input-group";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "remark-input";
    input.placeholder = `Remark ${remarksContainer.children.length + 1}`;

    inputGroup.appendChild(input);
    remarksContainer.appendChild(inputGroup);
  }

  // Update remove button state
  function updateRemoveButton() {
    removeRemarkBtn.disabled = remarksContainer.children.length <= MIN_INPUTS;
  }

  // Event listeners
  addRemarkBtn.addEventListener("click", function () {
    addRemarkField();
    updateRemoveButton();
  });

  removeRemarkBtn.addEventListener("click", function () {
    if (remarksContainer.children.length > MIN_INPUTS) {
      remarksContainer.removeChild(remarksContainer.lastElementChild);
      updateRemoveButton();
    }
  });

  // Initialize on load
  initializeRemarks();
});

// In your displaydata() function, keep this for data collection:
const remarksInputs = document.querySelectorAll(
  "#remarksContainer .remark-input"
);
const remarksData = Array.from(remarksInputs)
  .map((input) => input.value.trim())
  .filter((remark) => remark !== "");

function clearTableKeepRows() {
  const inputs = document.querySelectorAll("#labourTable td input");
  inputs.forEach((input) => (input.value = ""));
  if (typeof calculateTotals === "function") calculateTotals();
}
