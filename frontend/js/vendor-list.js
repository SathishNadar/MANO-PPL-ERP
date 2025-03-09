console.log("✅ vendor.js has loaded successfully!");


// -----------------------------------------------------------Data storage--------------------------------------------------------------
let itemsPerPage = 25;
let currentVendorPage = 1;
let allVendors = [];
let totalVendorCount = 0; 


let jobNatureDict = {};
let locationDict = {};

let ReverseJobNatureDict = {};
let ReverseLocationDict = {};

let CategoryDict = {
    1:"Consultant",
    2:"Contractor",
    3:"Supplier",
}
let ReversecategoryDict = {
    "Consultant":1,
    "Contractor":2,
    "Supplier":3,
}

// -----------------------------------------------------------------------------------------------------------------------------------------

async function fetchMetadata() {
    try {
        const response = await fetch("http://35.154.101.129:3000/vendor/api/metadata/");
        if (!response.ok) throw new Error("Network response was not ok");

        const data = await response.json();
        console.log("Metadata API Response:", data);

        totalVendorCount = data.vendorCount || 0; 

        jobNatureDict = data.jobNatures || {};
        locationDict = data.locations || {};

        Object.entries(locationDict).forEach(([name, id]) => {
            ReverseLocationDict[id] = name;
        });

        Object.entries(jobNatureDict).forEach(([name, id]) => {
            ReverseJobNatureDict[id] = name;
        });

        console.log("Job Nature Dictionary:", jobNatureDict);
        console.log("reverse Job Nature Dictionary:", ReverseJobNatureDict);
        console.log("Location Dictionary:", locationDict);
        console.log("Reverse Location Dictionary:", ReverseLocationDict);

        renderVendorPagination(totalVendorCount, 1);

    } catch (error) {
        console.error("Error fetching metadata:", error);
    }
}

async function fetchVendorData(filters = {}) {
    try {
        const response = await fetch("http://35.154.101.129:3000/vendor/api/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                tab: 43,
                order: "ASC",
                category: 2,
                locationIds: filters.locationIds || [],
                jobNatureIds: filters.jobNatureIds || [],
                user_name: "Sathish Nadar",
                user_password: "1234",
                email: "sathish.mac23@gmail.com",
                phone_no: "9321945896"
            })
        });

        if (!response.ok) throw new Error("Network response was not ok");

        const data = await response.json();
        console.log("Vendor API Response:", data);

        allVendors = data.vendors || [];
        totalVendorCount = data.vendorCount || 0; // Update vendor count after filters

        renderVendorList(1);
        renderVendorPagination(totalVendorCount, 1);

    } catch (error) {
        console.error("Error fetching vendor data:", error);
    }
}

async function initializeVendorList() {
    await fetchMetadata();  // ✅ Wait for metadata to load
    fetchVendorData();  // ✅ Fetch vendors after metadata is ready
}
initializeVendorList();  // ✅ Calls both in sequence


async function renderVendorList(page) {
    if (allVendors.length === 0) return;

    const tbody = document.getElementById("vendor-data");
    tbody.innerHTML = "";

    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, allVendors.length);

    for (let i = startIndex; i < endIndex; i++) {
        const vendor = allVendors[i];
        const row = document.createElement("tr");

        // ✅ Function to handle empty, NaN, or undefined values
        const formatValue = (value) => {
            return (value === undefined || value === "null" || value === "" || value === "NaN" || value === "-" || value === "nan") ? "-_-" : value;
        };

        row.innerHTML = `
            <td>${formatValue(vendor.contact_person)}</td>
            <td>${formatValue(ReverseJobNatureDict[vendor.job_nature_id])}</td>
            <td>${formatValue(CategoryDict[vendor.category_id])}</td>
            <td>
                <span class="copy-text" data-copy="${formatValue(vendor.mobile)}" style="cursor: pointer;">
                    ${formatValue(vendor.mobile)}
                </span>
            </td>
            <td>
                <span class="copy-text" data-copy="${formatValue(vendor.email)}" style="cursor: pointer;">
                    ${formatValue(vendor.email)}
                </span>
            </td>
            <td>${formatValue(ReverseLocationDict[vendor.location_id])}</td>
            <td>
                <a href="${vendor.website || '#'}" target="_blank" class="website-link copy-text">
                    ${formatValue(vendor.website)}
                </a>
            </td>
        `;

        tbody.appendChild(row);

        // ✅ Copy Phone & Email Functionality
        row.querySelectorAll(".copy-text").forEach(copyItem => {
            copyItem.addEventListener("click", () => {
                navigator.clipboard.writeText(copyItem.dataset.copy)
                    .then(() => console.log("Copied: " + copyItem.dataset.copy))
                    .catch(err => console.error("Failed to copy:", err));
            });
        });

        // ✅ Show Popup on Row Click (Except Copy Clicks)
        row.addEventListener("click", (event) => {
            if (!event.target.classList.contains("copy-text")) {
                showPopup(vendor);
            }
        });
    }

    renderVendorPagination(totalVendorCount, page);
}


// ✅ Function to Render Pagination Buttons
function renderVendorPagination(totalVendors, activePage) {
    const totalPages = Math.ceil(totalVendors / itemsPerPage);
    const paginationDiv = document.getElementById("vendor-pagination");
    paginationDiv.innerHTML = "";

    if (totalVendors === 0) {
        paginationDiv.innerHTML = "<p>No vendors available.</p>";
        return;
    }

    if (totalPages <= 1) return; // Hide pagination if only one page

    // ✅ Previous Button (Disabled on first page)
    const left = document.createElement("button");
    left.className = "pagination-btn";
    left.innerText = "<";
    left.disabled = activePage === 1; // Disable if on first page
    left.onclick = () => {
        if (currentVendorPage > 1) {
            currentVendorPage--;
            renderVendorList(currentVendorPage);
            renderVendorPagination(totalVendors, currentVendorPage);
        }
    };
    paginationDiv.appendChild(left);

    // ✅ First Page (Always show)
    const firstPage = document.createElement("button");
    firstPage.className = "pagination-btn" + (activePage === 1 ? " active" : "");
    firstPage.innerText = "1";
    firstPage.onclick = () => {
        currentVendorPage = 1;
        renderVendorList(1);
        renderVendorPagination(totalVendors, 1);
    };
    paginationDiv.appendChild(firstPage);

    // ✅ Left Ellipsis if activePage is far from page 1
    if (activePage > 2) {
        const leftDots = document.createElement("span");
        leftDots.innerText = "...";
        leftDots.style.margin = "0 5px";
        paginationDiv.appendChild(leftDots);
    }

    // ✅ Middle Page (Current Page)
    if (activePage !== 1 && activePage !== totalPages) {
        const middlePage = document.createElement("button");
        middlePage.className = "pagination-btn active";
        middlePage.innerText = activePage;
        paginationDiv.appendChild(middlePage);
    }

    // ✅ Right Ellipsis if activePage is far from last page
    if (activePage < totalPages - 2) {
        const rightDots = document.createElement("span");
        rightDots.innerText = "...";
        rightDots.style.margin = "0 5px";
        paginationDiv.appendChild(rightDots);
    }

    // ✅ Last Page (Always show)
    if (totalPages > 1) {
        const lastPage = document.createElement("button");
        lastPage.className = "pagination-btn" + (activePage === totalPages ? " active" : "");
        lastPage.innerText = totalPages;
        lastPage.onclick = () => {
            currentVendorPage = totalPages;
            renderVendorList(totalPages);
            renderVendorPagination(totalVendors, totalPages);
        };
        paginationDiv.appendChild(lastPage);
    }

    // ✅ Next Button (Disabled on last page)
    const right = document.createElement("button");
    right.className = "pagination-btn";
    right.innerText = ">";
    right.disabled = activePage === totalPages; // Disable if on last page
    right.onclick = () => {
        if (currentVendorPage < totalPages) {
            currentVendorPage++;
            renderVendorList(currentVendorPage);
            renderVendorPagination(totalVendors, currentVendorPage);
        }
    };
    paginationDiv.appendChild(right);
}







function loadFilterData(id) {
    let items;

    if (id === "job-options") {
        items = jobNatureDict; 
    } else if(id == "category-options"){
        items = ReversecategoryDict;
    } 
    else {
        items = locationDict; 
    }

    populateFilterOptions(id, items, id);
}






function populateFilterOptions(containerId, items, type) {
    items = Object.keys(items);
    // console.log(items);
    let container = document.getElementById(containerId);
    // console.log(type);
    container.innerHTML = ""; 
    items.forEach(item => {
        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = item;
        checkbox.classList.add(`${type}-checkbox`);

        if (sessionStorage.getItem(item) === "true") {
            checkbox.checked = true;
        }

        checkbox.addEventListener("change", () => {
            sessionStorage.setItem(item, checkbox.checked);
        });

        let label = document.createElement("label");
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(" " + item));

        container.appendChild(label);
    });
}

function applyFilters() {
    let selectedJobs = getSelectedValues("job-options-checkbox"); 
    let selectedLocations = getSelectedValues("location-options-checkbox");

    console.log("Selected Jobs:", selectedJobs);
    console.log("Selected Locations:", selectedLocations);
}





// do  not Touch-------------------------------------------------------------------------------------------

// ✅ Function to Show Vendor Details Popup
function showPopup(vendor) {
    let popup = document.getElementById("vendor-popup");
    let overlay = document.getElementById("description-overlay");

    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "description-overlay";
        overlay.className = "description-overlay";
        document.body.appendChild(overlay);
        overlay.addEventListener("click", closePopup);
    }

    if (!popup) {
        popup = document.createElement("div");
        popup.id = "vendor-popup";
        popup.className = "vendor-popup";
        document.body.appendChild(popup);
    }

    popup.innerHTML = `
    <span class="custom-close-btn" onclick="closePopup()">&times;</span>
    <h2>${vendor.name}</h2>
    <p><strong>Contact Person:</strong> ${vendor.contact_person}</p>
    <p><strong>Job:</strong> ${ReverseJobNatureDict[vendor.job_nature_id]}</p>
    <p><strong>Category:</strong> ${CategoryDict[vendor.category_id]}</p>
    <p><strong>Phone:</strong> ${vendor.mobile}</p>
    <p><strong>Tele-Phone:</strong> ${vendor.telephone_no}</p>
    <p><strong>Email:</strong> ${vendor.email}</p>
    <p><strong>Location:</strong> ${vendor.location}</p>
    <p><strong>Address:</strong> ${vendor.address}</p>
    <p><strong>Gst No:</strong> ${vendor.gst_no}</p>
    <p><strong>Constitution:</strong> ${vendor.constitution}</p>
    <p><strong>Reference:</strong> ${vendor.reference}</p>
    <p><strong>Website:</strong> <a href="${vendor.website}" target="_blank">${vendor.website}</a></p>
  `;
    
  let copybtn = document.createElement("button");
    copybtn.className = "copy-btn";
    copybtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
    `;
    copybtn.addEventListener("click", () => copyToClipboard());
    popup.appendChild(copybtn);
    overlay.classList.add("active");
    popup.style.display = "block";
}

// Function to get selected checkbox values
function getSelectedValues(className) {
    return Array.from(document.querySelectorAll(`.${className}:checked`))
        .map(checkbox => checkbox.value);
}

function openFilterDialog() {
    let existingDialog = document.getElementById("filter-dialog");
    let overlay = document.getElementById("filter-overlay");

    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "filter-overlay";
        overlay.className = "filter-overlay";
        document.body.appendChild(overlay);
        overlay.addEventListener("click", closeFilterDialog);

        overlay.addEventListener("click", (event) => {
            if (!existingDialog.contains(event.target)) {
                closeFilterDialog();
            }
        });
    }

    if (!existingDialog) {
        existingDialog = document.createElement("div");
        existingDialog.id = "filter-dialog";
        existingDialog.className = "filter-dialog";
        existingDialog.innerHTML = `
            <div class="filter-header">
                <h2>Filters</h2>
                <span class="close-btn" onclick="closeFilterDialog()">&times;</span>
            </div>

            <div class="filter-content">
                <div class="filter-section">
                    <div class="filter-title" onclick="toggleDropdown('job-options')">Nature of Job ▼</div>
                    <input type="text" id="job-search" class="filter-search" placeholder="Search Jobs..." onkeyup="filterSearch('job-search', 'job-options')">
                    <div id="job-options" class="filter-options"></div>
                </div>

                <div class="filter-section">
                    <div class="filter-title" onclick="toggleDropdown('category-options')">Category▼</div>
                    <div id="category-options" class="filter-options"></div>
                </div>

                <div class="filter-section">
                    <div class="filter-title" onclick="toggleDropdown('location-options')">Location ▼</div>
                    <input type="text" id="location-search" class="filter-search" placeholder="Search Locations..." onkeyup="filterSearch('location-search', 'location-options')">
                    <div id="location-options" class="filter-options" ></div>
                </div>
            </div>

            <div class="filter-footer">
                <button id="apply-filters" class="apply-btn" onclick="applyFilters()">Apply Filters</button>
                <button id="clear-filters" class="clear-btn" onclick = "clearFilters()" >Clear Filters</button>
            </div> 
        `;
        document.body.appendChild(existingDialog);
    }

    overlay.classList.add("active");
    existingDialog.classList.add("active");

}



function toggleDropdown(id) {
    loadFilterData(id);
    let section = document.getElementById(id);
    let searchInput = document.getElementById(id.replace("options", "search")); 

    if (section.style.display === "block") {
        section.style.display = "none";
        searchInput.style.display = "none";
    } else {
        section.style.display = "block";
        searchInput.style.display = "block"; 
    }
}

function closePopup() {
    document.getElementById("description-overlay").classList.remove("active");
    document.getElementById("vendor-popup").style.display = "none";
    
}


function filterSearch(inputId, listId) {
    let searchValue = document.getElementById(inputId).value.trim().toLowerCase();
    let checkboxes = document.querySelectorAll(`#${listId} label`);
    if (searchValue.length == 0){
        checkboxes.forEach(label => label.style.display = "block");
        return;
    } 

    let items = Array.from(checkboxes).map(label => ({
        text: label.innerText.trim(),
        element: label
    }));

    let fuse = new Fuse(items, {
        keys: ['text'],
        threshold: 0.3 
    });

    let results = searchValue ? fuse.search(searchValue) : items;
    checkboxes.forEach(label => label.style.display = "none");
    
    if (results.length === 0) {
        return;
    }
    
    results.forEach(result => {
        if (result.item && result.item.element) { // ✅ Check if 'item' and 'item.element' exist
            result.item.element.style.display = "block";
        }
    });
    
}


function clearFilters() {
    document.querySelectorAll(".job-options-checkbox, .location-options-checkbox").forEach(checkbox => {
        checkbox.checked = false;
        sessionStorage.removeItem(checkbox.value);
    });
}

function closeFilterDialog() {
    document.getElementById("filter-overlay").classList.remove("active");
    document.getElementById("filter-dialog").classList.remove("active");
}