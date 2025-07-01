// ====================== DATA FETCH ======================
const tableData = JSON.parse(sessionStorage.getItem('userTableData')) || [];
const todayData = JSON.parse(sessionStorage.getItem('todayTableData')) || [];
const tomorrowData = JSON.parse(sessionStorage.getItem('tomorrowTableData')) || [];

const displayTable = document.getElementById('displayTable')?.getElementsByTagName('tbody')[0];
const todayTable = document.getElementById('today-table')?.getElementsByTagName('tbody')[0];
const tomorrowTable = document.getElementById('tomorrow-table')?.getElementsByTagName('tbody')[0];

// Format timeslots for backend
const timeSlotsInProperFormat = JSON.parse(sessionStorage.getItem("timeslots")) || [];
const formattedSlots = timeSlotsInProperFormat.map(slot => `${slot.from}-${slot.to}`);

// ====================== HELPER FUNCTIONS ======================
function populateTable(data, tbody, isProgress = false) {
    if (!data || !tbody) return;

    tbody.innerHTML = ''; // Clear existing rows

    data.forEach(row => {
        const tr = document.createElement('tr');
        row.forEach((cell, index) => {
            const td = document.createElement('td');
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

function handleFormData() {
    const data = JSON.parse(sessionStorage.getItem('form-values'));
    if (!Array.isArray(data)) return;

    const conditionContainer = document.getElementById('site-condition-display');
    
    // Hide all checkbox elements if they exist
    document.querySelectorAll('.condition-checkbox').forEach(el => el.style.display = 'none');
    
    // Show only the active condition
    if (data[0] === "Rainy") {
        conditionContainer.innerHTML = '<div class="active-condition rainy">Rainy Day</div>';
    } 
    else if (data[0] === "Sunny") {
        conditionContainer.innerHTML = '<div class="active-condition sunny">Normal Day</div>';
    }
    
    if (data[1] === "slushy") {
        conditionContainer.innerHTML += '<div class="active-condition slushy">Slushy Ground</div>';
    } 
    else if (data[1] === "dry") {
        conditionContainer.innerHTML += '<div class="active-condition dry">Dry Ground</div>';
    }
}

function handleTimeSlots() {
    const timeSlots = JSON.parse(sessionStorage.getItem("timeslots")) || [];
    const container = document.getElementById("from-to-container");
    if (!container) return;

    container.innerHTML = '';
    
    timeSlots.forEach(slot => {
        const timeSlotDiv = document.createElement('div');
        const fromDiv = document.createElement('div');
        const toDiv = document.createElement('div');
        
        fromDiv.innerHTML = `<div class="info-label">From</div><div class="info-value">${slot.from}</div>`;
        toDiv.innerHTML = `<div class="info-label">To</div><div class="info-value">${slot.to}</div>`;
        
        timeSlotDiv.appendChild(fromDiv);
        timeSlotDiv.appendChild(toDiv);
        container.appendChild(timeSlotDiv);
    });
}

function handleEvents() {
    const container = document.getElementById('events-container');
    if (!container) return;

    const data = JSON.parse(sessionStorage.getItem('eventsData')) || [];
    container.innerHTML = '';

    const count = Math.max(data.length, 6);
    for (let i = 0; i < count; i++) {
        const div = document.createElement('div');
        div.className = 'remarks-item';
        div.textContent = data[i] || '--';
        container.appendChild(div);
    }
}

function handleRemarks() {
    const container = document.getElementById('remarks-content-container');
    if (!container) return;

    const data = JSON.parse(sessionStorage.getItem('remarksData')) || [];
    container.innerHTML = '';

    const count = Math.max(data.length, 3);
    for (let i = 0; i < count; i++) {
        const div = document.createElement('div');
        div.className = 'remarks-item';
        div.textContent = data[i] || '--';
        container.appendChild(div);
    }
}

// ====================== MANPOWER CALCULATION ======================

//-------------------------------to get the latest ID using latest date of the dpr-----------------------//
async function updateCumulativeField() {
    console.log("🔥 updateCumulativeField started...");

  console.log("🛠 Starting cumulative manpower calculation...");
  try {
    // 1. Fetch previous cumulative manpower
    const response = await fetch('http://34.47.131.237:3000/report/Alldpr/1?limit=10');
    const dprArray = await response.json();

    const latestDPR = dprArray.reduce((latest, current) =>
      new Date(current.report_date) > new Date(latest.report_date) ? current : latest
    );
    const latestDprId = latestDPR.dpr_id;

    const fullDprResponse = await fetch(`http://34.47.131.237:3000/report/getDPR/${latestDprId}`);
    const fullDprData = await fullDprResponse.json();

    const previousCumulative = fullDprData?.data?.cumulative_manpower || 0;
    console.log("🟡 Previous Cumulative Manpower:", previousCumulative);

    // 2. Calculate today's manpower from sessionStorage (userTableData)
    const tableData = JSON.parse(sessionStorage.getItem('userTableData')) || [];
    const filteredData = tableData.slice(0, -1); // remove TOTAL row

    let todaysManpower = 0;

    filteredData.forEach((row, rowIndex) => {
      for (let i = 1; i <= 9; i++) {
        const value = parseInt(row[i]);
        if (!isNaN(value)) {
          todaysManpower += value;
          console.log(`Row ${rowIndex + 1}, Col ${i} → +${value}`);
        }
      }
    });

    console.log("🔵 Today's Manpower:", todaysManpower);

    const total = previousCumulative + todaysManpower;
    console.log("🟢 New Cumulative Manpower:", total);



    return total;

  } catch (err) {
    console.error("❌ Failed to update cumulative manpower:", err);
    return 0;
  }
}


//---------------------for calculation of cumulative man power upto today using previous data------------------\\







// ====================== DPR OBJECT GENERATION ======================
async function generateCompleteDPRObject() {
    const apiData = JSON.parse(sessionStorage.getItem('apiProjectData')) || {};
    const tableData = JSON.parse(sessionStorage.getItem('userTableData')) || [];
    const todayData = JSON.parse(sessionStorage.getItem('todayTableData')) || [];
    const tomorrowData = JSON.parse(sessionStorage.getItem('tomorrowTableData')) || [];
    const formValues = JSON.parse(sessionStorage.getItem('form-values')) || [];
    const remarksData = JSON.parse(sessionStorage.getItem('remarksData')) || [];
    const eventsData = JSON.parse(sessionStorage.getItem('eventsData')) || [];

    const filteredData = tableData.slice(0, -1);
    const transformedData = {
        agency: filteredData.map(row => row[0] || "--"),
        mason: filteredData.map(row => parseInt(row[1]) || 0),
        carp: filteredData.map(row => parseInt(row[2]) || 0),
        fitter: filteredData.map(row => parseInt(row[3]) || 0),
        electrical: filteredData.map(row => parseInt(row[4]) || 0),
        painter: filteredData.map(row => parseInt(row[5]) || 0),
        gypsum: filteredData.map(row => parseInt(row[6]) || 0),
        plumber: filteredData.map(row => parseInt(row[7]) || 0),
        helper: filteredData.map(row => parseInt(row[8]) || 0),
        staff: filteredData.map(row => parseInt(row[9]) || 0),
        remarks: filteredData.map(row => row[11] || "--")
    };

    const cumulativeManpower = await updateCumulativeField();
    return {
        project_id: 1,
        report_date: new Date().toISOString().split('T')[0],
        site_condition: {
            is_rainy: formValues[0] === "Rainy",
            ground_state: formValues[1] || "Unknown",
            rain_timing: formattedSlots || "No time slots available"
        },  
        labour_report: transformedData,
        cumulative_manpower: cumulativeManpower,
        today_prog: {
            progress: todayData.map(row => row[0] || "--"),
            qty: todayData.map(row => row[1] || "--")
        },
        tomorrow_plan: {
            plan: tomorrowData.map(row => row[0] || "--"),
            qty: tomorrowData.map(row => row[1] || "--")
        },
        user_roles: {
            created_by: 1,
            approvals: {
                1: true,
                3: false
            },
            viewers: [10, 11, 15],
            editors: [1, 3, 4]
        },
        report_footer: {
            events_visit: eventsData || [],
            distribute: ["L&T", "MAPLANI"],
            prepared_by: "Mano Project Pvt. Ltd."
        }
    };
}

// ====================== API COMMUNICATION ======================
async function postDPRToBackend() {
    try {
        const dprData = await generateCompleteDPRObject();
        console.log("DPR Data:", JSON.stringify(dprData, null, 2));

        const response = await fetch('http://34.47.131.237:3000/report/insertDPR', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dprData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Upload failed: ${errorText}`);
        }

        const result = await response.json();
        console.log("Uploaded:", result);
        alert("DPR uploaded successfully!");
        return result;
    } catch (err) {
        console.error("Error:", err);
        alert("Error uploading DPR: " + err.message);
        throw err;
    }
}

// ====================== INITIALIZATION ======================
document.addEventListener("DOMContentLoaded", async () => {
    // Populate tables
    populateTable(tableData, displayTable);
    populateTable(todayData, todayTable, true);
    populateTable(tomorrowData, tomorrowTable, true);
    
    // Handle form data
    handleFormData();
    handleTimeSlots();
    handleEvents();
    handleRemarks();
    
    //to display the cumulative manpower on screen
    const total = await updateCumulativeField();
    const cumulativeManpower_display_field = document.getElementById("cumulativeManpowerValue");
    if (cumulativeManpower_display_field) {
        cumulativeManpower_display_field.textContent = total;
    }

    // Fetch project data
    try {
        const response = await fetch('http://34.47.131.237:3000/project/getProject/1');
        if (!response.ok) {
            document.getElementById("project_name").textContent = "DATA UNAVAILABLE";
            document.getElementById("project_name").classList.add("error_state");
            throw new Error('Project not found');
        }

        const Apidata = await response.json();
        sessionStorage.setItem('apiProjectData', JSON.stringify(Apidata.data));
        
        // Update project info
        document.getElementById("project_name").textContent = Apidata.data.project_name;
        document.getElementById("Employer").textContent = Apidata.data.Employer;
        document.getElementById("contract_no").textContent = Apidata.data.contract_no;
        document.getElementById("location").textContent = Apidata.data.location;
        document.getElementById("start_date").textContent = new Date(Apidata.data.start_date).toLocaleDateString('en-GB');
        
        // Calculate and display duration
        if (Apidata.data.start_date && Apidata.data.end_date) {
            const startDate = new Date(Apidata.data.start_date);
            const end_date = new Date(Apidata.data.end_date);
            const today = new Date();
            
            const totalDays = Math.round((end_date - startDate) / (1000 * 60 * 60 * 24));
            const daysPassed = Math.round((today - startDate) / (1000 * 60 * 60 * 24));
            const daysRemaining = totalDays - daysPassed;
            
            document.getElementById("end_date").textContent = end_date.toLocaleDateString('en-GB');
            document.getElementById("total_days").textContent = totalDays;
            document.getElementById("days_remaining").textContent = daysRemaining > 0 ? daysRemaining : 0;
        }
    } catch (error) {
        console.error('Error:', error);
    }

    // Set current date
    const today = new Date();
    document.getElementById("report_date").textContent = today.toLocaleDateString('en-GB');
});