document.addEventListener("DOMContentLoaded", () => {
  // Retrieve the session
  const username = getSession();

  if (!username) {
    // If session is not valid, redirect to login page
    alert("Session expired or user not logged in. Please log in again.");
    window.location.href = "frontendloginindex.html"; // Redirect to login page
  } else {
    document.getElementById("usernameDisplay").textContent = username;
  }
});

function getSession() {
  const sessionData = JSON.parse(localStorage.getItem("session"));
  if (!sessionData) return null;

  const { username, expiry } = sessionData;

  if (Date.now() > expiry) {
    // Session expired
    localStorage.removeItem("session");
    return null;
  }

  // Extend session expiration by resetting the session
  setSession(username);
  return username;
}

// set session dor user signi in to say logged in
function setSession(username) {
  const expiryTime = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
  const sessionData = { username, expiry: expiryTime };
  localStorage.setItem("session", JSON.stringify(sessionData));
}

// togle between dark and light mode
function toggleTheme() {
  const body = document.body;
  const currentTheme = body.getAttribute("data-theme");
  const newTheme = currentTheme === "light" ? "dark" : "light";
  body.setAttribute("data-theme", newTheme);
  document.querySelector(".switch-container button").textContent =
    newTheme === "light" ? "Switch to Night Mode" : "Switch to Day Mode";
}

// this is to add row in labour report
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

// delete row in labour report
function deleteRow() {
  const rows = document.querySelectorAll(".data-row");
  if (rows.length > 1) {
    rows[rows.length - 1].remove();
    calculateGrandTotal(); // Recalculate totals
  }
}

// calulate total and prevent negative input
document.addEventListener("DOMContentLoaded", () => {
  const inputs = document.querySelectorAll(".cell-input");

  inputs.forEach((input) => {
    input.addEventListener("input", (event) => {
      const row = event.target.closest("tr");
      validateAndCalculate(event.target);
    });
  });
});

function validateAndCalculate(input) {
  const value = parseFloat(input.value) || 0;
  if (value < 0) {
    alert("Value cannot be less than 0!");
    input.value = 0;
  }

  const row = input.closest("tr");
  calculateRowTotal(row);
}

// calculation of row total of each row in labout report
function calculateRowTotal(row) {
  const inputs = row.querySelectorAll(".cell-input");
  const rowTotalCell = row.querySelector(".row-total");

  let rowTotal = 0;
  inputs.forEach((input) => {
    const value = parseFloat(input.value) || 0; // Default to 0 if empty
    rowTotal += value;
  });

  rowTotalCell.value = rowTotal;
  calculateGrandTotal();
}

// calculation of grand total in labout report
function calculateGrandTotal() {
  const rows = document.querySelectorAll(".data-row");
  const columnTotals = Array(10).fill(0); // 10 columns to sum (excluding Agency Name, Total, Remarks)
  let grandTotal = 0;

  rows.forEach((row) => {
    const inputs = row.querySelectorAll(".cell-input");
    const rowTotalCell = row.querySelector(".row-total");
    const rowTotal = parseFloat(rowTotalCell.value) || 0;
    grandTotal += rowTotal;

    inputs.forEach((input, index) => {
      const value = parseFloat(input.value) || 0;
      columnTotals[index] += value;
    });
  });

  // Update column totals
  columnTotals.forEach((total, index) => {
    const columnTotalCell = document.getElementById(`${index + 1}_total`);
    if (columnTotalCell) {
      columnTotalCell.value = total;
    }
  });

  document.getElementById("grandtotal").value = grandTotal;
}

function addProgressRow(tableId) {
  const table = document.getElementById(tableId).querySelector("tbody");
  const newRow = document.createElement("tr");

  newRow.innerHTML = `
<td><input type="text" placeholder="Enter Task"></td>
<td><input type="number" placeholder="Enter Quantity"></td>
`;
  table.appendChild(newRow);
}

function deleteProgressRow(tableId) {
  const table = document.getElementById(tableId).querySelector("tbody");
  const rows = table.querySelectorAll("tr");
  if (rows.length > 1) {
    table.removeChild(rows[rows.length - 1]);
  } else {
    alert("Cannot delete the last row!");
  }
}

// calculate
// ---- remaining days
// ---- total elapssed days
// ---- total days for project

function calculateDays() {
  function parseDate(dateString) {
    // Split the date string in 'dd-mm-yyyy' format
    const [day, month, year] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day); // Month is 0-based in JS Date
  }

  const startDateText = document.getElementById("startdate").textContent.trim();
  const endDateText = document.getElementById("enddate").textContent.trim();

  // Parse the dates
  const startDate = parseDate(startDateText);
  const endDate = parseDate(endDateText);
  const today = new Date();

  const totalDays =
    Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  const elapsedDays = Math.round((today - startDate) / (1000 * 60 * 60 * 24));
  const remainingDays = totalDays - elapsedDays;

  document.getElementById("TotalDays").textContent = `Total: ${totalDays}`;
  document.getElementById(
    "elapsedDays"
  ).textContent = `Elapsed: ${elapsedDays}`;
  document.getElementById(
    "remainingDays"
  ).textContent = `Remaining: ${remainingDays}`;
}

document.addEventListener("DOMContentLoaded", () => {
  calculateDays();
});

// report date automatically updates daily
document.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("reportDate").textContent = today;
});

// reset the entire labour report
function resetLabourReport() {
  const rows = document.querySelectorAll(".data-row");
  rows.forEach((row, index) => {
    if (index > 0) row.remove(); // Keep only the first row
    const inputs = row.querySelectorAll("input");
    inputs.forEach((input) => (input.value = "0"));
  });
  calculateGrandTotal(); // Reset totals
}

// ------------------------------------------------------- backend logic -------------------------------------------------------

window.onload = () => {
  console.log("Window fully loaded. Loading data from sessionStorage...");
  loadReportFromSessionStorage();
  attachSaveButtonEvent();
};

function attachSaveButtonEvent() {
  console.log("Attaching Save button event...");
  const saveButton = document.getElementById("saveButton");
  if (saveButton) {
    saveButton.addEventListener("click", saveReport);
    console.log("Save button event attached.");
  } else {
    console.error("Save button not found in the DOM.");
  }
}

function saveReport(event) {
  if (event) event.preventDefault();
  console.log("Save button clicked!");

  const reportDate = document.getElementById("reportDate").innerText;
  const approvedBy = document.getElementById("approvedBy").value || null;

  const reportData = {
    reportDate,
    approved_by: approvedBy,
    labourProgress: [
      ...document.querySelectorAll("#labourTable .data-row"),
    ].map((row) => {
      const inputs = row.querySelectorAll("input");
      return {
        agencyName: inputs[0].value || null,
        mason: inputs[1].value || null,
        carp: inputs[2].value || null,
        fitter: inputs[3].value || null,
        electrical: inputs[4].value || null,
        painter: inputs[5].value || null,
        gypsum: inputs[6].value || null,
        plumber: inputs[7].value || null,
        helper: inputs[8].value || null,
        staff: inputs[9].value || null,
        total: inputs[10].value || null,
        remarks: inputs[11].value || null,
      };
    }),
    todaysProgress: [
      ...document.querySelectorAll("#todayProgress tbody tr"),
    ].map((row) => {
      const inputs = row.querySelectorAll("input");
      return {
        task: inputs[0].value || null,
        quantity: inputs[1].value || null,
      };
    }),
    tomorrowsPlanning: [
      ...document.querySelectorAll("#tomorrowPlanning tbody tr"),
    ].map((row) => {
      const inputs = row.querySelectorAll("input");
      return {
        task: inputs[0].value || null,
        quantity: inputs[1].value || null,
      };
    }),
  };

  console.log("Prepared report data:", reportData);

  // Save data to sessionStorage
  sessionStorage.setItem("latestReport", JSON.stringify(reportData));
  console.log("Data saved to sessionStorage!");

  fetch("http://localhost:3000/report/saveReport", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reportData),
  })
    .then((response) => {
      if (!response.ok) throw new Error("Failed to save the report.");
      return response.json();
    })
    .then((data) => {
      console.log("Report saved successfully:", data);
      alert("Report saved successfully.");
    })
    .catch((error) => {
      console.error("Error saving report:", error);
      alert("Failed to save the report. Please try again later.");
    });
}

function loadReportFromSessionStorage() {
  console.log("Attempting to load data from sessionStorage...");
  const reportData = JSON.parse(sessionStorage.getItem("latestReport"));
  if (!reportData) {
    console.log("No data found in sessionStorage.");
    return;
  }
  console.log("Data retrieved from sessionStorage:", reportData);

  // Populate individual fields
  document.getElementById("reportDate").innerText = reportData.reportDate || "";
  document.getElementById("approvedBy").value = reportData.approved_by || "";

  // Populate Labour Table
  const labourTableBody = document.querySelector("#labourTable tbody");
  const totalRow = labourTableBody.querySelector("tr:last-child"); // Save the Total row
  labourTableBody.innerHTML = ""; // Clear existing rows

  // Add reconstructed rows
  reportData.labourProgress.forEach((rowData) => {
    const newRow = document.createElement("tr");
    newRow.classList.add("data-row");
    newRow.innerHTML = `
      <td><input type="text" value="${rowData.agencyName || ""}" /></td>
      <td><input type="number" class="cell-input" value="${
        rowData.mason || ""
      }" /></td>
      <td><input type="number" class="cell-input" value="${
        rowData.carp || ""
      }" /></td>
      <td><input type="number" class="cell-input" value="${
        rowData.fitter || ""
      }" /></td>
      <td><input type="number" class="cell-input" value="${
        rowData.electrical || ""
      }" /></td>
      <td><input type="number" class="cell-input" value="${
        rowData.painter || ""
      }" /></td>
      <td><input type="number" class="cell-input" value="${
        rowData.gypsum || ""
      }" /></td>
      <td><input type="number" class="cell-input" value="${
        rowData.plumber || ""
      }" /></td>
      <td><input type="number" class="cell-input" value="${
        rowData.helper || ""
      }" /></td>
      <td><input type="number" class="cell-input" value="${
        rowData.staff || ""
      }" /></td>
      <td><input type="number" class="row-total" value="${
        rowData.total || ""
      }" disabled /></td>
      <td><input type="text" value="${rowData.remarks || ""}" /></td>
    `;
    labourTableBody.appendChild(newRow);
  });

  // Re-add the Total row
  if (totalRow) {
    labourTableBody.appendChild(totalRow);
  } else {
    const newTotalRow = document.createElement("tr");
    newTotalRow.innerHTML = `
      <td>Total</td>
      ${Array(10).fill(`<td><input type="number" disabled /></td>`).join("")}
      <td><input id="grandtotal" type="number" disabled /></td>
      <td><input id="remarks_total" type="text" /></td>
    `;
    labourTableBody.appendChild(newTotalRow);
  }

  attachValidationToInputs();

  calculateGrandTotal();
}

function validateNonNegativeInput(input) {
  const value = parseFloat(input.value) || 0;
  if (value < 0) {
    alert("Value cannot be negative. Resetting to 0.");
    input.value = 0; // Reset to 0
  }
  calculateRowTotal(input.closest("tr")); // Recalculate totals
}

// Attach validation to all number inputs
function attachValidationToInputs() {
  const inputs = document.querySelectorAll(".cell-input");
  inputs.forEach((input) => {
    input.addEventListener("input", () => validateNonNegativeInput(input));
  });
}
