// ====================== DEBUGGING HELPERS ======================
function debugLog(message, data) {
    console.log(`[DEBUG] ${message}`, data);
}

// ====================== MAIN DATA LOADER ======================
document.addEventListener("DOMContentLoaded", async () => {
    try {
        debugLog("DOM fully loaded, starting data load");
        
        // Check for DPR ID in URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const dprId = urlParams.get('id');
        debugLog("URL Parameters", {dprId});
        
        // Get project ID from localStorage
        const projectId = localStorage.getItem('selected_project_id');
        debugLog("LocalStorage projectId", projectId);
        
        if (dprId) {
            debugLog("Fetching data from API for DPR ID:", dprId);
            await fetchAndPopulateFromAPI(dprId, projectId);
        } else {
            debugLog("No DPR ID in URL, checking session storage");
            const pdfDataString = sessionStorage.getItem('pdfPreviewData');
            if (pdfDataString) {
                debugLog("Found data in session storage");
                const pdfData = JSON.parse(pdfDataString);
                populateAllData(pdfData);
            } else {
                debugLog("No data available, showing error state");
                showErrorState("No data available");
            }
        }
        
        debugLog("Initializing print button");
        setupPrintButton();
    } catch (error) {
        console.error("Error loading data:", error);
        showErrorState("Failed to load data");
    }
});

// ====================== API DATA FETCHING ======================
async function fetchAndPopulateFromAPI(dprId, projectId) {
    try {
        debugLog(`Fetching DPR data for ID: ${dprId}`);
        const dprResponse = await fetch(`http://34.47.131.237:3000/report/getDPR/${dprId}`);
        if (!dprResponse.ok) throw new Error('Failed to fetch DPR data');
        
        const apiData = await dprResponse.json();
        debugLog("API Response Data", apiData);
        
        if (!apiData.success) throw new Error('API returned unsuccessful response');
        
        // Fetch project details using projectId from localStorage
        let projectDetails = {};
        if (projectId) {
            debugLog(`Fetching project details for ID: ${projectId}`);
            const projectResponse = await fetch(`http://34.47.131.237:3000/project/getProject/${projectId}`);
            if (projectResponse.ok) {
                const projectData = await projectResponse.json();
                if (projectData.success) {
                    projectDetails = projectData.data;
                    debugLog("Project Details", projectDetails);
                }
            }
        }
        
        // Merge DPR data with project details
        const mergedData = {
            ...apiData.data,
            projectDetails: projectDetails
        };
        debugLog("Merged Data", mergedData);
        
        // Transform API data to match our expected structure
        const transformedData = transformApiData(mergedData);
        debugLog("Transformed Data", transformedData);
        
        populateAllData(transformedData);
        
    } catch (error) {
        console.error("Error loading data from API:", error);
        showErrorState("Failed to load from API");
        
        // Fallback to session data if available
        const pdfDataString = sessionStorage.getItem('pdfPreviewData');
        if (pdfDataString) {
            const pdfData = JSON.parse(pdfDataString);
            populateAllData(pdfData);
        }
    }
}

function transformApiData(apiData) {
    debugLog("Transforming API Data", apiData);
    
    // Convert API data structure to match what our HTML expects
    const transformed = {
        // Project Information
        project_name: apiData.projectDetails?.project_name || apiData.project_name || "--",
        Employer: apiData.projectDetails?.Employer || apiData.projectDetails?.client_name || apiData.Employer || "--",
        contract_no: apiData.projectDetails?.contract_no || apiData.contract_no || "--",
        location: apiData.projectDetails?.location || apiData.location || "--",
        start_date: apiData.projectDetails?.start_date 
            ? new Date(apiData.projectDetails.start_date).toLocaleDateString('en-GB') 
            : (apiData.start_date ? new Date(apiData.start_date).toLocaleDateString('en-GB') : "--"),
        end_date: apiData.projectDetails?.end_date 
            ? new Date(apiData.projectDetails.end_date).toLocaleDateString('en-GB') 
            : (apiData.end_date ? new Date(apiData.end_date).toLocaleDateString('en-GB') : "--"),
        total_days: calculateTotalDays(
            apiData.projectDetails?.start_date || apiData.start_date, 
            apiData.projectDetails?.end_date || apiData.end_date
        ),
        days_remaining: calculateDaysRemaining(apiData.projectDetails?.end_date || apiData.end_date),
        report_date: apiData.report_date ? new Date(apiData.report_date).toLocaleDateString('en-GB') : "--",
        
        // Site Conditions
        site_conditions: {
            normal_day: !apiData.site_condition?.is_rainy,
            rainy_day: apiData.site_condition?.is_rainy || false,
            slushy_day: apiData.site_condition?.ground_state === "slushy",
            dry_day: apiData.site_condition?.ground_state === "dry",
            time_slots: apiData.site_condition?.rain_timing || []
        },
        
        // Labour Report
        labour_data: formatLabourData(apiData.labour_report, apiData.cumulative_manpower),
        
        // Progress Data
        today_progress: formatProgressData(apiData.today_prog),
        tomorrow_planning: formatProgressData(apiData.tomorrow_plan),
        
        // Events and Remarks
        events_remarks: apiData.report_footer?.events_visit || [],
        general_remarks: apiData.report_footer?.bottom_remarks || ["--"],
        
        // Signatures
        prepared_by: apiData.report_footer?.prepared_by || "MANO PCPL",
        approved_by: apiData.report_footer?.distribute?.join(", ") || "GOYAL"
    };
    
    debugLog("Final Transformed Data", transformed);
    return transformed;
}

// ====================== DATA FORMATTING HELPERS ======================
function formatLabourData(labourReport, cumulativeManpower = 0) {
    debugLog("Formatting Labour Data", labourReport);
    
    if (!labourReport) {
        debugLog("No labour report data found");
        return { headers: [], tableData: [], cumulative_manpower: cumulativeManpower };
    }

    // Extract all available labor types from the report
    const laborTypes = Object.keys(labourReport).filter(key => 
        key !== 'agency' && 
        key !== 'remarks' && 
        key !== 'k' && 
        key !== 'ok' &&  // Exclude any non-labor type fields
        Array.isArray(labourReport[key])
    );
    
    debugLog("Detected Labor Types", laborTypes);

    // Create headers array - always start with Agency
    const headers = ['Agency Name', ...laborTypes, 'Total', 'Remarks'];
    debugLog("Generated Headers", headers);

    const tableData = [];
    const maxLength = Math.max(
        labourReport.agency?.length || 0,
        ...laborTypes.map(type => labourReport[type]?.length || 0)
    );
    
    debugLog("Max Rows to Process", maxLength);

    for (let i = 0; i < maxLength; i++) {
        const row = [];
        let total = 0;

        // Agency Name
        const agency = labourReport.agency?.[i] || "--";
        row.push(agency);

        // Labor counts
        laborTypes.forEach(type => {
            const count = parseInt(labourReport[type]?.[i]) || 0;
            row.push(count.toString());
            total += count;
        });

        // Total
        row.push(total.toString());

        // Remarks - Handle both array and string formats
        const remark = Array.isArray(labourReport.remarks) 
            ? labourReport.remarks[i] || labourReport.remarks[0] || "--"
            : labourReport.remarks || "--";
        row.push(remark);

        tableData.push(row);
        debugLog(`Processed Row ${i}`, row);
    }

    const result = { 
        headers, 
        tableData, 
        cumulative_manpower: cumulativeManpower 
    };
    
    debugLog("Formatted Labour Data Result", result);
    return result;
}

function formatProgressData(progressData) {
    if (!progressData) return [["--", "--"]];
    
    const result = [];
    const maxLength = Math.max(
        progressData.progress?.length || 0,
        progressData.plan?.length || 0,
        progressData.qty?.length || 0
    );
    
    for (let i = 0; i < maxLength; i++) {
        const task = progressData.progress?.[i] || progressData.plan?.[i] || "--";
        const qty = progressData.qty?.[i] || "--";
        result.push([task, qty]);
    }
    
    return result.length > 0 ? result : [["--", "--"]];
}

function calculateTotalDays(startDate, endDate) {
    if (!startDate || !endDate) return "--";
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

function calculateDaysRemaining(endDate) {
    if (!endDate) return "--";
    const end = new Date(endDate);
    const today = new Date();
    const diff = Math.round((end - today) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
}

// ====================== DATA POPULATION ======================
function populateAllData(data) {
    debugLog("Populating all data", data);
    
    // 1. Populate Project Information
    populateProjectInfo(data);
    
    // 2. Populate Site Conditions
    if (data.site_conditions) {
        populateSiteConditions(data.site_conditions);
    }
    
    // 3. Populate Labour Report
    if (data.labour_data) {
        populateLabourReport(data.labour_data);
    }
    
    // 4. Populate Progress Tables
    populateProgressTables(data);
    
    // 5. Populate Remarks and Events
    populateRemarksAndEvents(data);
}

function populateProjectInfo(data) {
    debugLog("Populating Project Info", data);
    
    // Basic project info
    document.getElementById("project_name").textContent = data.project_name || "--";
    document.getElementById("Employer").textContent = data.Employer || "--";
    document.getElementById("contract_no").textContent = data.contract_no || "--";
    document.getElementById("location").textContent = data.location || "--";
    document.getElementById("start_date").textContent = data.start_date || "--";
    document.getElementById("end_date").textContent = data.end_date || "--";
    
    // Report date in header
    const reportDateElement = document.querySelector(".daily-progress-report-table tr:nth-child(2) td:nth-child(2)");
    if (reportDateElement) {
        reportDateElement.textContent = data.report_date || "--";
    }
    
    // Duration info
    const totalDaysElement = document.querySelector(".total-value");
    if (totalDaysElement) {
        totalDaysElement.textContent = data.total_days || "--";
    }
    
    const daysRemainingElement = document.querySelector(".balance-right");
    if (daysRemainingElement) {
        daysRemainingElement.textContent = data.days_remaining || "--";
    }
}

function populateSiteConditions(conditions) {
    if (!conditions) return;
    
    // Weather conditions
    setCheckboxState("normal-day-checkbox", conditions.normal_day);
    setCheckboxState("rainy-day-checkbox", conditions.rainy_day);
    
    // Ground conditions
    setCheckboxState("slushy-day-checkbox", conditions.slushy_day);
    setCheckboxState("dry-day-checkbox", conditions.dry_day);
    
    // Time slots
    const timeSlotsContainer = document.querySelector(".from-to");
    if (timeSlotsContainer && conditions.time_slots) {
        timeSlotsContainer.innerHTML = conditions.time_slots
            .map(slot => {
                const [from, to] = slot.split('-');
                return `
                    <div class="time-slot">
                        <span>From: ${from || "--"}</span>
                        <span>To: ${to || "--"}</span>
                    </div>
                `;
            })
            .join('');
    }
}

function populateLabourReport(labourData) {
    debugLog("Populating Labour Report", labourData);
    
    if (!labourData || !labourData.headers || !labourData.tableData) {
        debugLog("Invalid labour data received", labourData);
        return;
    }
    
    const table = document.getElementById('displayTable');
    if (!table) {
        debugLog("Labour table element not found");
        return;
    }
    
    const tbody = table.querySelector('tbody') || table.createTBody();
    tbody.innerHTML = '';
    
    // Create header row dynamically
    const headerRow = document.createElement('tr');
    labourData.headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header.toUpperCase(); // Capitalize header text
        headerRow.appendChild(th);
    });
    tbody.appendChild(headerRow);
    debugLog("Added table headers", labourData.headers);
    
    // Add data rows
    labourData.tableData.forEach((row, index) => {
        const tr = document.createElement('tr');
        row.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
        debugLog(`Added row ${index}`, row);
    });
    
        // Populate cumulative manpower fields
    if (labourData.cumulative_manpower) {
        // Step 1: Calculate today's total manpower from labour tableData
        let todayTotal = 0;
        labourData.tableData.forEach(row => {
            // The second last cell is the total (before remarks)
            const totalCell = row[labourData.headers.length - 2];
            const total = parseInt(totalCell) || 0;
            todayTotal += total;
        });

        // Step 2: Calculate yesterday's cumulative by subtracting today's from total
        const cumulativeToday = parseInt(labourData.cumulative_manpower) || 0;
        const cumulativeYesterday = cumulativeToday - todayTotal;

        // Step 3: Populate the fields
        const cumulativeYesterdayEl = document.getElementById('cumulative-manpower-untill-yesterday');
        if (cumulativeYesterdayEl) {
            cumulativeYesterdayEl.textContent = cumulativeYesterday.toString();
        }

        const cumulativeTodayEl = document.getElementById('cumulative-manpower-4');
        if (cumulativeTodayEl) {
            cumulativeTodayEl.textContent = cumulativeToday.toString();
        }

        debugLog("Cumulative manpower breakdown", {
            todayTotal,
            cumulativeToday,
            cumulativeYesterday
        });
    }

}

function populateProgressTables(data) {
    // Today's Progress
    const todayTable = document.getElementById('today-table');
    if (todayTable && data.today_progress) {
        const tbody = todayTable.querySelector('tbody') || todayTable.createTBody();
        tbody.innerHTML = '';
        
        // Add header
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = `
            <th style="text-align: center;">Task</th>
            <th>Quantity</th>
        `;
        tbody.appendChild(headerRow);
        
        // Add data rows
        data.today_progress.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="text-align: left;">${row[0] || "--"}</td>
                <td style="text-align: center;">${row[1] || "--"}</td>
            `;
            tbody.appendChild(tr);
        });
    }
    
    // Tomorrow's Planning
    const tomorrowTable = document.getElementById('tomorrow-table');
    if (tomorrowTable && data.tomorrow_planning) {
        const tbody = tomorrowTable.querySelector('tbody') || tomorrowTable.createTBody();
        tbody.innerHTML = '';
        
        // Add header
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = `
            <th style="text-align: center;">Task</th>
            <th>Quantity</th>
        `;
        tbody.appendChild(headerRow);
        
        // Add data rows
        data.tomorrow_planning.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="text-align: left;">${row[0] || "--"}</td>
                <td style="text-align: center;">${row[1] || "--"}</td>
            `;
            tbody.appendChild(tr);
        });
    }
}

function populateRemarksAndEvents(data) {
    debugLog("Populating Remarks and Events", data);
    
    // Events
    const eventsContainer = document.querySelector('.events-container');
    if (eventsContainer) {
        eventsContainer.innerHTML = '';
        const events = data.events_remarks || [];
        const minEvents = 6;
        
        for (let i = 0; i < Math.max(events.length, minEvents); i++) {
            const div = document.createElement('div');
            div.className = 'events-content';
            div.textContent = events[i] || "--";
            eventsContainer.appendChild(div);
        }
        debugLog("Added events", events);
    }
    
    // Remarks
    const remarksContainer = document.querySelector('.remarks-content-container');
    if (remarksContainer) {
        remarksContainer.innerHTML = '';
        
        const remarks = data.general_remarks || [];
        const minRemarks = 3;
        
        for (let i = 0; i < Math.max(remarks.length, minRemarks); i++) {
            const div = document.createElement('div');
            div.className = 'remarks-content';
            div.textContent = remarks[i] || "--";
            remarksContainer.appendChild(div);
        }
        debugLog("Added remarks", remarks);
    }
    
    // Signatures
    if (data.prepared_by) {
        document.getElementById('prepared-by').textContent = data.prepared_by;
    }
    if (data.approved_by) {
        document.getElementById('distribution').textContent = data.approved_by;
    }
}

// ====================== HELPER FUNCTIONS ======================
function setCheckboxState(elementId, isActive) {
    const element = document.getElementById(elementId);
    if (element) {
        if (isActive) {
            element.style.backgroundColor = "green";
            element.textContent = "✓";
            element.style.color = "white";
        } else {
            element.style.backgroundColor = "";
            element.textContent = "";
        }
    }
}

function setupPrintButton() {
    const printButton = document.getElementById('download-pdf');
    if (printButton) {
        printButton.addEventListener('click', () => {
            const style = document.createElement('style');
            style.innerHTML = `
                @page {
                    size: A4;
                    margin: 10mm;
                }
                body {
                    margin: 0;
                    padding: 0;
                }
                table {
                    page-break-inside: auto;
                }
                tr {
                    page-break-inside: avoid;
                    page-break-after: auto;
                }
                .remarks-content, .events-content {
                    page-break-inside: avoid;
                }
            `;
            document.head.appendChild(style);
            
            window.print();
            
            setTimeout(() => {
                document.head.removeChild(style);
            }, 1000);
        });
    }
}

function showErrorState(message = "Failed to load report data") {
    // Mark all fields as unavailable
    document.querySelectorAll('.info-value, td').forEach(el => {
        if (el.textContent.trim() === "") {
            el.textContent = "UNAVAILABLE";
            el.style.color = "red";
        }
    });
    
    // Show error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.color = 'red';
    errorDiv.style.padding = '10px';
    errorDiv.style.margin = '10px 0';
    errorDiv.style.border = '1px solid red';
    errorDiv.style.textAlign = 'center';
    
    document.body.insertBefore(errorDiv, document.body.firstChild);
}