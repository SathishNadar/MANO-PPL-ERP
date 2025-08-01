import { ip_address } from "../ip.js";
console.log("✅ vendor.js has loaded successfully!");

// -----------------------------------------------------------Data storage--------------------------------------------------------------
let itemsPerPage = 25;
let currentVendorPage = 1;
let allVendors = [];
let totalVendorCount = 0;
let appliedFilters = { locationIds: [], jobNatureIds: [] };
let orders = "ASC";
var categoryIds = 0;
let jobNatureDict = {};
let locationDict = {};

let ReverseJobNatureDict = {};
let ReverseLocationDict = {};

let CategoryDict = {
  1: "Consultant",
  2: "Contractor",
  3: "Supplier",
};

let ReversecategoryDict = {
  Consultant: 1,
  Contractor: 2,
  Supplier: 3,
};

// -------------------------------------------------------utility/helper functions------------------------------------------------------------------
const formatValue = (value) => {
  return value === undefined ||
    value === "null" ||
    value === "" ||
    value === "NaN" ||
    value === "-" ||
    value === "nan" ||
    value === "undefined"
    ? "-_-"
    : value;
};

const getValidURL = (url) => {
  if (!url || url === "-" || url.trim() === "") return "#";
  return url.startsWith("http://") || url.startsWith("https://")
    ? url
    : `https://${url}`;
};

function setCategory(id) {
  categoryIds = id;
}

// ---------------------------------------------------------------------------------------------------------------------------------------
async function fetchMetadata() {
  try {
    const response = await fetch(
      `http://${ip_address}:3000/vendor_api/metadata/`
    );
    if (!response.ok) throw new Error("Network response was not ok");

    const data = await response.json();

    totalVendorCount = data.vendorCount || 0;

    jobNatureDict = data.jobNatures || {};
    locationDict = data.locations || {};

    Object.entries(locationDict).forEach(([name, id]) => {
      ReverseLocationDict[id] = name;
    });

    Object.entries(jobNatureDict).forEach(([name, id]) => {
      ReverseJobNatureDict[id] = name;
    });

    renderVendorPagination(totalVendorCount, 1);
  } catch (error) {
    console.error("Error fetching metadata:", error);
  }
}

async function fetchVendorData(tab_no, orders) {
  const searchInput = document.querySelector(".search-field .input");
  let searchText = searchInput?.value?.trim() || "";

  if (searchText.length > 0) {
    search(tab_no, searchText);
    return;
  }

  try {
    const response = await fetch(`http://${ip_address}:3000/vendor_api/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tab: tab_no,
        order: orders,
        locationIds: appliedFilters.locationIds || [],
        jobNatureIds: appliedFilters.jobNatureIds || [],
        category: categoryIds,
        
      }),
    });

    if (!response.ok) throw new Error("Network response was not ok");

    const data = await response.json();

    allVendors = data.vendors || [];
    totalVendorCount = data.vendorCount || 0;

    // 🔹 Update current page correctly
    currentVendorPage = tab_no;

    renderVendorList(currentVendorPage);
    renderVendorPagination(totalVendorCount, tab_no);
  } catch (error) {
    console.error("Error fetching vendor data:", error);
  }
}

async function search(tab_no, searchtext) {
  console.log(categoryIds);
  try {
    let response = await fetch(`http://${ip_address}:3000/vendor_api/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        queryString: `${searchtext}`,
        tab: tab_no,
        order: orders,
        locationIds: appliedFilters.locationIds || [],
        jobNatureIds: appliedFilters.jobNatureIds || [],
        category: categoryIds,
      }),
    });

    if (!response.ok) throw new Error("Network response was not ok");
    let data = await response.json();
    console.log(data);
    allVendors = data.vendors || [];
    totalVendorCount = data.vendorCount || 0;

    currentVendorPage = tab_no;
    renderVendorList(currentVendorPage);
    renderVendorPagination(totalVendorCount, tab_no);
  } catch (error) {
    console.log(error);
  }
}

async function initializeVendorList() {
  await fetchMetadata();
  fetchVendorData(1);
  setupAddVendorButton();
}
initializeVendorList();
console.log(jobNatureDict)
async function renderVendorList(page) {
  // const tbody = document.getElementById("vendor-data");
  const thead = document.querySelector("#vendor-table thead tr");
  const tbody = document.getElementById("vendor-data");


  // Ensure the header has the EDIT column
  if (thead && !thead.querySelector("th.edit-column")) {
    const editHeader = document.createElement("th");
    editHeader.className = "edit-column";
    editHeader.textContent = "EDIT";
    thead.appendChild(editHeader);
  }
  if (!tbody) return;

  // Ensure EDIT column exists in header
  const theadRow = document.querySelector("#vendor-table thead tr");
  if (theadRow && !theadRow.querySelector("th.edit-column")) {
    const editHeader = document.createElement("th");
    editHeader.className = "edit-column";
    editHeader.textContent = "EDIT";
    theadRow.appendChild(editHeader);
  }

  if (!allVendors.length) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:red;">No vendors found</td></tr>`;
    return;
  }

  tbody.innerHTML = "";

  allVendors.forEach((vendor, idx) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${formatValue(vendor.name)}</td>
      <td>${formatValue(ReverseJobNatureDict[vendor.job_nature_id] || "")}</td>
      <td>${formatValue(CategoryDict[vendor.category_id] || "")}</td>
      <td><span class="copy-text" data-copy="${formatValue(vendor.mobile)}">${formatValue(vendor.mobile)}</span></td>
      <td><span class="copy-text" style="
        width: 120px;
        min-width: 120px;
         max-width: 120px;
        white-space: normal;
        word-break: break-all;
        overflow: hidden;
        padding: 4px 2px;
      " data-copy="${formatValue(vendor.email)}">${formatValue(vendor.email)}</span></td>
      <td>${formatValue(ReverseLocationDict[vendor.location_id] || "")}</td>
      <td><a href="${getValidURL(vendor.website)}" target="_blank">${formatValue(vendor.website)}</a></td>
      <td class="edit-column">
        <button class="edit-btn">✏️ Edit</button>
      </td>
    `;

    // Copy text functionality
    row.querySelectorAll(".copy-text").forEach(el => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(el.dataset.copy).then(() => {
          Swal.fire({
            toast: true,
            position: "bottom-end",
            icon: "success",
            title: "Text Copied!",
            showConfirmButton: false,
            timer: 1000,
            timerProgressBar: true,
            background: "#333",
            color: "#fff",
            customClass: {
              popup: "small-toast",
              timerProgressBar: "blue-progress-bar",
            }
          });
        });
      });
    });

    // Edit button functionality
    const editBtn = row.querySelector(".edit-btn");
    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openEditModal(vendor);
    });

    // Row click functionality (excluding edit button and copy text)
    row.addEventListener("click", e => {
      if (!e.target.classList.contains("copy-text") &&
          !e.target.classList.contains("edit-btn")) {
        showPopup(vendor);
      }
    });

    tbody.appendChild(row);
  });

  renderVendorPagination(totalVendorCount, page);
}


function renderVendorPagination(totalVendors, activePage) {
  const totalPages = Math.ceil(totalVendors / itemsPerPage);
  const paginationDiv = document.getElementById("vendor-pagination");
  paginationDiv.innerHTML = "";

  if (totalVendors === 0 || totalPages <= 1) return;

  const searchInput = document.querySelector(".search-field .input");
  let searchText = searchInput?.value.trim() || "";

  const goToPage = (page) => {
    if (searchText.length > 0) {
      search(page, searchText);
    } else {
      fetchVendorData(page, orders);
    }
  };

  const createButton = (page, isActive = false) => {
    const btn = document.createElement("button");
    btn.className = "pagination-btn" + (isActive ? " active" : "");
    btn.innerText = page;
    btn.onclick = () => {
      if (currentVendorPage !== page) {
        goToPage(page);
      }
    };
    return btn;
  };

  const left = document.createElement("button");
  left.className = "pagination-btn";
  left.innerText = "<";
  left.disabled = activePage === 1;
  left.onclick = () => {
    if (currentVendorPage > 1) {
      goToPage(currentVendorPage - 1);
    }
  };
  paginationDiv.appendChild(left);

  paginationDiv.appendChild(createButton(1, activePage === 1));

  let start = Math.max(2, activePage - 1);
  let end = Math.min(totalPages - 1, activePage + 1);

  if (start > 2) {
    paginationDiv.appendChild(document.createTextNode("..."));
  }

  for (let i = start; i <= end; i++) {
    paginationDiv.appendChild(createButton(i, activePage === i));
  }

  if (end < totalPages - 1) {
    paginationDiv.appendChild(document.createTextNode("..."));
  }

  paginationDiv.appendChild(
    createButton(totalPages, activePage === totalPages)
  );

  const right = document.createElement("button");
  right.className = "pagination-btn";
  right.innerText = ">";
  right.disabled = activePage === totalPages;
  right.onclick = () => {
    if (currentVendorPage < totalPages) {
      goToPage(currentVendorPage + 1);
    }
  };
  paginationDiv.appendChild(right);
}

function loadFilterData(id) {
  let container = document.getElementById(id);

  if (!container) {
    console.error(`Container with ID "${id}" not found.`);
    return;
  }

  let items = id === "job-options" ? jobNatureDict : locationDict;

  container.innerHTML = "";

  Object.keys(items).forEach((item) => {
    let input = document.createElement("input");
    input.type = "checkbox";
    input.value = item;
    input.classList.add(`${id}-checkbox`);

    if (sessionStorage.getItem(item) === "true") {
      input.checked = true;
    }

    input.addEventListener("change", () => {
      sessionStorage.setItem(item, input.checked);
    });

    let label = document.createElement("label");
    label.appendChild(input);
    label.appendChild(document.createTextNode(" " + item));

    container.appendChild(label);
  });
}

function applyFilters() {
  let selectedJobs = getSelectedValues("job-options-checkbox");
  let selectedLocations = getSelectedValues("location-options-checkbox");

  appliedFilters = {
    locationIds: selectedLocations
      .map((name) => locationDict[name] || null)
      .filter(Boolean),
    jobNatureIds: selectedJobs
      .map((name) => jobNatureDict[name] || null)
      .filter(Boolean),
  };

  fetchVendorData(1, appliedFilters);
}

function changeorder() {
  orders = orders === "ASC" ? "DESC" : "ASC";
  fetchVendorData(1, orders);

  let svgElement = document.querySelector(".order svg");

  if (svgElement) {
    let currentRotation = svgElement.getAttribute("data-rotation") || "0";
    let newRotation = parseInt(currentRotation) + 180;
    svgElement.setAttribute("data-rotation", newRotation);
    svgElement.style.transform = `rotate(${newRotation}deg)`;
    svgElement.style.transformOrigin = "50% 70%";
    svgElement.style.transition = "transform 0.3s ease";
    svgElement.style.position = "relative";
  }
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
  <h2>${formatValue(vendor.name)}</h2>
  <p><strong>Contact Person:</strong> ${formatValue(vendor.contact_person)}</p>
  <p><strong>Job:</strong> ${formatValue(
    ReverseJobNatureDict[vendor.job_nature_id]
  )}</p>
  <p><strong>Category:</strong> ${formatValue(
    CategoryDict[vendor.category_id]
  )}</p>
  <p><strong>Phone:</strong> ${formatValue(vendor.mobile)}</p>
  <p><strong>Tele-Phone:</strong> ${formatValue(vendor.telephone_no)}</p>
  <p><strong>Email:</strong> ${formatValue(vendor.email)}</p>
  <p><strong>Location:</strong> ${formatValue(vendor.location)}</p>
  <p><strong>Address:</strong> ${formatValue(vendor.address)}</p>
  <p><strong>Gst No:</strong> ${formatValue(vendor.gst_no)}</p>
  <p><strong>Constitution:</strong> ${formatValue(vendor.constitution)}</p>
  <p><strong>Reference:</strong> ${formatValue(vendor.reference)}</p>
  <p><strong>Website:</strong> <a href="${getValidURL(
    vendor.website
  )}" target="_blank">${formatValue(vendor.website)}</a></p>
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

function getSelectedValues(className) {
  return Array.from(document.querySelectorAll(`.${className}:checked`)).map(
    (checkbox) => checkbox.value
  );
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

function copyToClipboard() {
  const popup = document.getElementById("vendor-popup");
  if (!popup) return;

  let textToCopy = "";

  const details = popup.querySelectorAll("p");
  details.forEach((p) => {
    textToCopy += p.innerText + "\n";
  });
  navigator.clipboard
    .writeText(textToCopy)
    .then(() => {
      Swal.fire({
        toast: true,
        position: "bottom-end",
        icon: "success",
        title: "Text Copied!",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        showClass: { popup: "swal2-noanimation" },
        hideClass: { popup: "" },
        background: "#333",
        color: "#fff",
        customClass: {
          popup: "small-toast",
          timerProgressBar: "blue-progress-bar",
        },
        didOpen: (toast) => {
          const progressBar = toast.querySelector(".swal2-timer-progress-bar");
          if (progressBar) {
            progressBar.classList.add("animate-progress");
          }
        },
      });
    })
    .catch((err) => {
      console.error("Failed to copy text: ", err);
    });
}

function toggleDropdown(id) {
  loadFilterData(id);
  let section = document.getElementById(id);
  let searchInput = document.getElementById(id.replace("options", "search"));

  if (section.style.display === "block") {
    section.style.display = "none";
    if (searchInput) {
      searchInput.style.display = "none";
    }
  } else {
    section.style.display = "block";
    if (searchInput) {
      searchInput.style.display = "block";
    }
  }
}

function closePopup() {
  document.getElementById("description-overlay").classList.remove("active");
  document.getElementById("vendor-popup").style.display = "none";
}

function filterSearch(inputId, listId) {
  let searchValue = document.getElementById(inputId).value.trim().toLowerCase();
  let checkboxes = document.querySelectorAll(`#${listId} label`);
  if (searchValue.length == 0) {
    checkboxes.forEach((label) => (label.style.display = "block"));
    return;
  }

  let items = Array.from(checkboxes).map((label) => ({
    text: label.innerText.trim(),
    element: label,
  }));

  let fuse = new Fuse(items, {
    keys: ["text"],
    threshold: 0.3,
  });

  let results = searchValue ? fuse.search(searchValue) : items;
  checkboxes.forEach((label) => (label.style.display = "none"));

  if (results.length === 0) {
    return;
  }

  results.forEach((result) => {
    if (result.item && result.item.element) {
      result.item.element.style.display = "block";
    }
  });
}

function clearFilters() {
  document.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
    console.log(checkbox);
    checkbox.checked = false;
    sessionStorage.removeItem(checkbox.value);
  });

  document.querySelectorAll("input[type='radio']").forEach((radio) => {
    radio.checked = false;
    sessionStorage.removeItem(radio.value);
  });

  appliedFilters = {
    locationIds: [],
    jobNatureIds: [],
  };

  console.log("Filters cleared:", appliedFilters);

  fetchVendorData(1, orders);
}

function closeFilterDialog() {
  document.getElementById("filter-overlay").classList.remove("active");
  document.getElementById("filter-dialog").classList.remove("active");
}

function handleSearch() {
  const searchInput = document.querySelector(".search-field input");
  let searchText = searchInput.value.trim();
  if (!searchInput || searchText.length == 0) {
    return;
  }
  if (searchText.length > 0) {
    search(1, searchText);
  }
}

function attachSearchListeners() {
  console.log("yo");
  const searchInput = document.querySelector(".search-field .input");
  const searchButton = document.querySelector(".search-box-icon");

  if (searchInput && searchButton) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        handleSearch();
      }
    });

    searchButton.addEventListener("click", () => {
      handleSearch();
    });
  }
}

// ✅ Add/Edit Vendor Functions
function setupAddVendorButton() {
  // Check if button already exists
  if (document.getElementById("add-vendor-btn")) return;

  // Inject styles
  const styles = `
    /* Table Container & Structure */
  #vendor-table {
    width: 100%;
    table-layout: fixed;
    border-collapse: collapse;
    font-size: 14px;
  }

  /* Column Widths */
  #vendor-table th:nth-child(1),
  #vendor-table td:nth-child(1) { width: 15%; } /* Name */
  #vendor-table th:nth-child(2),
  #vendor-table td:nth-child(2) { width: 12%; } /* Job Nature */
  #vendor-table th:nth-child(3),
  #vendor-table td:nth-child(3) { width: 10%; } /* Category */
  #vendor-table th:nth-child(4),
  #vendor-table td:nth-child(4) { width: 10%; } /* Mobile */
  #vendor-table th:nth-child(6),
  #vendor-table td:nth-child(6) { width: 12%; } /* Location */
  #vendor-table th:nth-child(7),
  #vendor-table td:nth-child(7) { width: 15%; } /* Website */
  #vendor-table th:nth-child(8),
  #vendor-table td:nth-child(8) { width: 10%; } /* EDIT */

  /* Cell Styling */
  #vendor-table th, 
  #vendor-table td {
    padding: 8px 6px;
    border-bottom: 1px solid #ddd;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* EDIT Column Specific */
  .edit-column {
    text-align: center !important;
    padding: 8px 2px !important;
  }

  .edit-btn {
    background: #2196F3;
    color: white;
    border: none;
    padding: 5px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    white-space: nowrap;
    width: 100%;
    max-width: 80px;
  }

  /* Responsive Fallback */
  @media (max-width: 1200px) {
    #vendor-table {
      font-size: 13px;
    }
    #vendor-table th, 
    #vendor-table td {
      padding: 6px 4px;
    }
  }
    .floating-add-btn { 
    position: fixed; 
    bottom: 20px; 
    right: 20px; 
    background:#2196f3; 
    color:#fff; 
    font-size:28px; 
    border:none; 
    border-radius:50%; 
    width:60px; 
    height:60px; 
    cursor:pointer; 
    z-index:999; 
    box-shadow:0 4px 10px rgba(0,0,0,0.3);
  }
    .modal-overlay { 
      position:fixed; 
      display:none; 
      top:0; left:0; right:0; bottom:0; 
      background:rgba(0,0,0,0.5); 
      z-index:998; 
      justify-content:center; 
      align-items:center; 
    } 
    .modal-overlay.active { 
      display:flex; 
    } 
    .modal-content { 
      background:#fff; 
      padding:20px; 
      border-radius:10px; 
      width:90%; 
      max-width:500px; 
      position:relative; 
    } 
    .close-modal { 
      position:absolute; 
      top:10px; 
      right:15px; 
      font-size:22px; 
      cursor:pointer; 
    } 
    .edit-column {
  width: 100px;
  text-align: center;
}

.edit-btn {
  background: #2196F3;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.edit-btn:hover {
  background: #0b7dda;
} 
    .actions-cell {
      display: flex;
      justify-content: center;
      align-items: center;
    }
  `;
  const styleEl = document.createElement("style"); 
  styleEl.innerHTML = styles; 
  document.head.appendChild(styleEl);

  // Floating Add Button
  const addBtn = document.createElement("button");
  addBtn.id = "add-vendor-btn"; 
  addBtn.innerText = "+"; 
  addBtn.className = "floating-add-btn";
  addBtn.style.display = "none"; //Hiding it by default

  document.body.appendChild(addBtn);

  // Modal HTML
  const modalHTML = `
    <div id="add-vendor-modal" class="modal-overlay">
      <div class="modal-content">
        <span class="close-modal">&times;</span>
        <h2>Add New Vendor</h2>
        <form id="add-vendor-form">
          <input name="name" placeholder="Name" required />
          <input name="contact_person" placeholder="Contact Person" />
          <input name="telephone_no" placeholder="Telephone" />
          <input name="mobile" placeholder="Mobile" required />
          <input name="email" placeholder="Email" />
          <input name="address" placeholder="Address" />
          <input name="gst_no" placeholder="GST Number" />
          <input name="constitution" placeholder="Constitution" />
          <input name="website" placeholder="Website" />
          <input name="reference" placeholder="Reference" />
          <textarea name="remarks" placeholder="Remarks"></textarea>
          <select name="job_nature_id" id="job-nature-select"></select>
          <select name="location_id" id="location-select"></select>
          <select name="category_id">
            <option value="1">Consultant</option>
            <option value="2">Contractor</option>
            <option value="3">Supplier</option>
          </select>
          <button type="submit">Submit</button>
        </form>
      </div>
    </div>
  `;
  const modalContainer = document.createElement("div"); 
  modalContainer.innerHTML = modalHTML; 
  document.body.appendChild(modalContainer);

  // Event Listeners
  addBtn.addEventListener("click", () => {
  const form = document.getElementById("add-vendor-form");
  form.reset(); // Explicitly reset the form
  delete form.dataset.mode; 
  delete form.dataset.id;
  document.querySelector("#add-vendor-modal h2").innerText = "Add New Vendor";
  populateVendorDropdowns();
  document.getElementById("add-vendor-modal").classList.add("active");
});

  document.addEventListener("click", e => {
    if (e.target.matches(".close-modal")) { 
      document.getElementById("add-vendor-modal").classList.remove("active"); 
    }
  });

  document.getElementById("add-vendor-form").addEventListener("submit", async e => {
    e.preventDefault();
    const form = e.target;
    const isEdit = form.dataset.mode === "edit";
    const payload = {
      name: form.name.value,
      contact_person: form.contact_person.value,
      telephone_no: form.telephone_no.value,
      mobile: form.mobile.value,
      email: form.email.value,
      address: form.address.value,
      gst_no: form.gst_no.value,
      constitution: form.constitution.value,
      website: form.website.value,
      reference: form.reference.value,
      remarks: form.remarks.value,
      job_nature_id: +form.job_nature_id.value,
      location_id: +form.location_id.value,
      category_id: +form.category_id.value
    };

    try {
      let url, method;
      if (isEdit) {
        // Use PUT for updates
        url = `http://${ip_address}:3000/vendor_api/update/${form.dataset.id}`;
        method = "PUT";
      } else {
        // Use POST for new vendors
        url = `http://${ip_address}:3000/vendor_api/add`;
        method = "POST";
      }

      const res = await fetch(url, { 
        method,
        headers: {"Content-Type":"application/json"}, 
        body: JSON.stringify(payload) 
      });
      
      if (!res.ok) throw new Error(await res.text());
      
      Swal.fire({ 
        icon: "success", 
        title: isEdit ? "Vendor Updated" : "Vendor Added", 
        toast: true, 
        position: "top-end", 
        timer: 1500, 
        showConfirmButton: false 
      });
      
      form.reset(); 
      delete form.dataset.mode; 
      delete form.dataset.id;
      document.getElementById("add-vendor-modal").classList.remove("active");
      fetchVendorData(currentVendorPage);
    } catch(err) {
      Swal.fire({ 
        icon: "error", 
        title: "Error", 
        text: err.message 
      });
    }
  });
}

function populateVendorDropdowns() {
  const jobSel = document.getElementById("job-nature-select");
  const locSel = document.getElementById("location-select");
  jobSel.innerHTML = ""; 
  locSel.innerHTML = "";
  Object.entries(jobNatureDict).forEach(([name,id]) => { 
    const o = document.createElement("option"); 
    o.value = id; 
    o.text = name; 
    jobSel.appendChild(o);
  });
  Object.entries(locationDict).forEach(([name,id]) => { 
    const o = document.createElement("option"); 
    o.value = id; 
    o.text = name; 
    locSel.appendChild(o);
  });
}

function openEditModal(vendor) {
  const modal = document.getElementById("add-vendor-modal");
  const form = document.getElementById("add-vendor-form");
  form.dataset.mode = "edit";
  form.dataset.id = vendor.id;
  document.querySelector("#add-vendor-modal h2").innerText = "Edit Vendor";
  
  // Prefill form
  ["name","contact_person","telephone_no","mobile","email","address",
   "gst_no","constitution","website","reference","remarks"].forEach(field => {
    form[field].value = vendor[field] || "";
  });
  
  form.job_nature_id.value = vendor.job_nature_id;
  form.location_id.value = vendor.location_id;
  form.category_id.value = vendor.category_id;
  
  populateVendorDropdowns();
  modal.classList.add("active");
}

export {
  initializeVendorList,
  attachSearchListeners,
  setCategory,
  changeorder,
  clearFilters,
  closeFilterDialog,
  openFilterDialog,
  toggleDropdown,
  applyFilters,
  closePopup,
  filterSearch
};