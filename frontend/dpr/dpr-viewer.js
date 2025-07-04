
// ====================== DATA FETCH ======================
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
    tbody.innerHTML = '';
    data.forEach(row => {
        const tr = document.createElement('tr');
        row.forEach((cell, index) => {
            const td = document.createElement('td');
            td.textContent = cell || "--";
            td.style.textAlign = index === 0 || isProgress ? "left" : "center";
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

function populateLabourReportTable() {
    const labourData = JSON.parse(sessionStorage.getItem("labourReport"));
    const table = document.getElementById("displayTable");
    const thead = table.querySelector("thead");
    const tbody = table.querySelector("tbody");
    if (!labourData || !table) return;

    const keys = Object.keys(labourData).filter(k => k !== "agency" && k !== "remarks");
    const agencies = labourData.agency || [];
    const remarks = labourData.remarks || [];

    thead.innerHTML = "";
    tbody.innerHTML = "";

    const headerRow = document.createElement("tr");
    headerRow.innerHTML = `<th>Agency Name</th>`;
    keys.forEach(k => headerRow.innerHTML += `<th>${k}</th>`);
    headerRow.innerHTML += `<th>Remarks</th>`;
    thead.appendChild(headerRow);

    for (let i = 0; i < agencies.length; i++) {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${agencies[i]}</td>`;
        keys.forEach(k => row.innerHTML += `<td>${labourData[k]?.[i] ?? "--"}</td>`);
        row.innerHTML += `<td>${remarks[i] || "--"}</td>`;
        tbody.appendChild(row);
    }
}

function handleFormData() {
    const data = JSON.parse(sessionStorage.getItem('form-values')) || [];
    const container = document.getElementById('site-condition-display');
    
    if (!container) return;
    
    // Clear existing content
    container.innerHTML = '';
    
    // Weather condition
    if (data[0] === "Rainy") {
        container.innerHTML += '<div class="active-condition rainy">Rainy Day</div>';
    } else if (data[0] === "Sunny") {
        container.innerHTML += '<div class="active-condition sunny">Normal Day</div>';
    }
    
    // Ground state
    if (data[1] === "slushy") {
        container.innerHTML += '<div class="active-condition slushy">Slushy Ground</div>';
    } else if (data[1] === "dry") {
        container.innerHTML += '<div class="active-condition dry">Dry Ground</div>';
    }
}

function handleTimeSlots() {
    const timeSlots = JSON.parse(sessionStorage.getItem("timeslots")) || [];
    const container = document.getElementById("from-to-container");
    if (!container) return;
    container.innerHTML = '';
    timeSlots.forEach(slot => {
        const div = document.createElement('div');
        div.innerHTML = `<div class="info-label">From</div><div class="info-value">${slot.from}</div>
                         <div class="info-label">To</div><div class="info-value">${slot.to}</div>`;
        container.appendChild(div);
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

// ====================== CUMULATIVE MANPOWER ======================
async function updateCumulativeField() {
    try {
        const response = await fetch('http://34.47.131.237:3000/report/Alldpr/1?limit=10');
        const dprArray = await response.json();
        const latestDPR = dprArray.reduce((latest, current) =>
            new Date(current.report_date) > new Date(latest.report_date) ? current : latest);
        const latestDprId = latestDPR.dpr_id;
        const fullResp = await fetch(`http://34.47.131.237:3000/report/getDPR/${latestDprId}`);
        const fullData = await fullResp.json();
        const previous = fullData?.data?.cumulative_manpower || 0;

        const labour = JSON.parse(sessionStorage.getItem("labourReport")) || {};
        const keys = Object.keys(labour).filter(k => k !== "agency" && k !== "remarks");
        let total = 0;
        keys.forEach(role => {
            total += labour[role].reduce((sum, num) => sum + (parseInt(num) || 0), 0);
        });

        return previous + total;
    } catch (err) {
        console.error("Cumulative manpower error:", err);
        return 0;
    }
}
// ====================== PROJECT DETAILS FETCH ======================
async function fetchAndDisplayProjectDetails() {
    try {
        const response = await fetch('http://34.47.131.237:3000/project/getProject/1');
        if (!response.ok) {
            document.getElementById("project_name").textContent = "DATA UNAVAILABLE";
            throw new Error('Project not found');
        }

        const data = await response.json();
        sessionStorage.setItem('apiProjectData', JSON.stringify(data.data));

        document.getElementById("project_name").textContent = data.data.project_name;
        document.getElementById("Employer").textContent = data.data.Employer;
        document.getElementById("contract_no").textContent = data.data.contract_no;
        document.getElementById("location").textContent = data.data.location;
        document.getElementById("start_date").textContent = new Date(data.data.start_date).toLocaleDateString('en-GB');

        if (data.data.start_date && data.data.end_date) {
            const start = new Date(data.data.start_date);
            const end = new Date(data.data.end_date);
            const today = new Date();

            const totalDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
            const daysPassed = Math.round((today - start) / (1000 * 60 * 60 * 24));
            const daysRemaining = Math.max(totalDays - daysPassed, 0);

            document.getElementById("end_date").textContent = end.toLocaleDateString('en-GB');
            document.getElementById("total_days").textContent = totalDays;
            document.getElementById("days_remaining").textContent = daysRemaining;
        }
    } catch (err) {
        console.error("Project details fetch error:", err);
    }
}


// ====================== GENERATE DPR OBJECT ======================
async function generateCompleteDPRObject() {
    const formValues = JSON.parse(sessionStorage.getItem('form-values')) || [];
    const todayData = JSON.parse(sessionStorage.getItem('todayTableData')) || [];
    const tomorrowData = JSON.parse(sessionStorage.getItem('tomorrowTableData')) || [];
    const bottomRemarksData = JSON.parse(sessionStorage.getItem('remarksData')) || [];
    const eventsData = JSON.parse(sessionStorage.getItem('eventsData')) || [];
    const labourData = JSON.parse(sessionStorage.getItem('labourReport')) || {};

    const cumulativeManpower = await updateCumulativeField();

    return {
        project_id: 1,
        report_date: new Date().toISOString().split('T')[0],
        site_condition: {
            is_rainy: formValues[0] === "Rainy",
            ground_state: formValues[1] || "Unknown",
            rain_timing: formattedSlots || []
        },
        labour_report: labourData,
        cumulative_manpower: cumulativeManpower,
        today_prog: {
            progress: todayData.map(r => r[0] || "--"),
            qty: todayData.map(r => r[1] || "--")
        },
        tomorrow_plan: {
            plan: tomorrowData.map(r => r[0] || "--"),
            qty: tomorrowData.map(r => r[1] || "--")
        },
        user_roles: {
            created_by: 1,
            approvals: { 1: true, 3: false },
            viewers: [10, 11, 15],
            editors: [1, 3, 4]
        },
        report_footer: {
            events_visit: [],
            distribute: ["L&T", "MAPLANI"],
            prepared_by: "Mano Project Pvt. Ltd.",
            bottom_remarks: bottomRemarksData
        }
    };
}

// ====================== UPLOAD ======================
// ====================== UPLOAD DPR ======================
async function postDPRToBackend() {
    try {
        const dprData = await generateCompleteDPRObject();
        console.log("📦 DPR Data Being Sent:", JSON.stringify(dprData, null, 2));

        const response = await fetch('http://34.47.131.237:3000/report/insertDPR', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dprData)
        });

        if (!response.ok) throw new Error("Upload failed");
        const result = await response.json();
        alert("DPR uploaded successfully!");
        return result;
    } catch (err) {
        alert("Error uploading DPR: " + err.message);
        console.error(err);
    }
}


// ====================== INIT ======================
document.addEventListener("DOMContentLoaded", async () => {
    populateLabourReportTable();
    populateTable(todayData, todayTable, true);
    populateTable(tomorrowData, tomorrowTable, true);
    handleFormData();
    handleTimeSlots();
    handleEvents();
    handleRemarks();

    const total = await updateCumulativeField();
    const manpowerEl = document.getElementById("cumulativeManpowerValue");
    if (manpowerEl) manpowerEl.textContent = total;

    await fetchAndDisplayProjectDetails();
    
});
