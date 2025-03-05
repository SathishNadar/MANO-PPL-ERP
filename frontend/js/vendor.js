

console.log("✅ vendor.js has loaded successfully!");

async function fetchVendorData() {
    const response = await fetch("/backend/data/contracto.json");
    return await response.json();
}

const itemsPerPage = 25;
let currentVendorPage = 1;
let allVendors = [];

// ✅ Function to Render Vendor List
async function renderVendorList(page, filteredVendors = null) {
    if (allVendors.length === 0) {
        allVendors = (await fetchVendorData())["vendors"];
    }

    const vendors = filteredVendors || allVendors;
    const tbody = document.getElementById("vendor-data");
    tbody.innerHTML = "";

    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, vendors.length);

    for (let i = startIndex; i < endIndex; i++) {
        const vendor = vendors[i];
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${vendor.contact_person}</td>
            <td>${vendor.job_nature}</td>
            <td>
                <span class="copy-text" data-copy="${vendor.mobile}" style="cursor: pointer;">
                    ${vendor.mobile}
                </span>
            </td>
            <td>
                <span class="copy-text" data-copy="${vendor.email}" style="cursor: pointer;">
                    ${vendor.email}
                </span>
            </td>
            <td>${vendor.location}</td>
            <td>
                <a href="${vendor.website}" target="_blank" class="website-link">
                    ${vendor.website}
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

    renderVendorPagination(vendors, page);
}

// ✅ Function to Render Pagination Buttons
function renderVendorPagination(vendors, activePage) {
    const totalPages = Math.ceil(vendors.length / itemsPerPage);
    const paginationDiv = document.getElementById("vendor-pagination");
    paginationDiv.innerHTML = "";

    if (totalPages <= 1) return;

    const left = document.createElement("button");
    left.className = "pagination-btn";
    left.innerText = "<";
    left.onclick = () => {
        if (currentVendorPage > 1) {
            currentVendorPage--;
            renderVendorList(currentVendorPage);
        }
    };
    paginationDiv.appendChild(left);

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("button");
        btn.innerText = i;
        btn.className = "pagination-btn" + (activePage === i ? " active" : "");
        btn.onclick = () => {
            currentVendorPage = i;
            renderVendorList(i);
        };
        paginationDiv.appendChild(btn);
    }

    const right = document.createElement("button");
    right.className = "pagination-btn";
    right.innerText = ">";
    right.onclick = () => {
        if (currentVendorPage < totalPages) {
            currentVendorPage++;
            renderVendorList(currentVendorPage);
        };
    };
    paginationDiv.appendChild(right);
}

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
    <p><strong>Job:</strong> ${vendor.job_nature}</p>
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

function copyToClipboard() {
    const popup = document.getElementById("vendor-popup");
    if (!popup) return;
  
    let textToCopy = "";
  
    const details = popup.querySelectorAll("p");
    details.forEach(p => {
      textToCopy += p.innerText + "\n"; 
    });
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        console.log("Text copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  }
  
function closePopup() {
    document.getElementById("description-overlay").classList.remove("active");
    document.getElementById("vendor-popup").style.display = "none";
    
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

function loadFilterData(id) {
    // let jsonFile = id === "job-options" ? "/contractor list/nature.json" : "/contractor list/locations.json";
    let jsonFile ="/contractor list/nature.json";

    fetch(jsonFile)
        .then(response => response.json())
        .then(data => {
            // console.log(data);
            let items = id === "job-options" ? data.jobCategories : data.locations; 
            populateFilterOptions(id, items, `${id}`);
        });
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


function populateFilterOptions(containerId, items, type) {
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

function filterSearch(inputId, listId) {
    let searchValue = document.getElementById(inputId).value.trim().toLowerCase();
    if (searchValue.length == 0){
        loadFilterData(listId);
    } 
    let checkboxes = document.querySelectorAll(`#${listId} label`);

    let items = Array.from(checkboxes).map(label => ({
        text: label.innerText.trim(),
        element: label
    }));

    let fuse = new Fuse(items, {
        keys: ['text'],
        threshold: 0.3 
    });

    let results = searchValue ? fuse.search(searchValue) : items;
    // console.log(results);
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

// Function to get selected checkbox values
function getSelectedValues(className) {
    return Array.from(document.querySelectorAll(`.${className}:checked`))
        .map(checkbox => checkbox.value);
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



// ✅ Load Vendor List Initially
fetchVendorData().then(() => {
  renderVendorList(1);
}
)

