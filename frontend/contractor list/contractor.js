async function getNatureOfJobs() {
  const response = await fetch("nature.json");
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  const data = await response.json();

  return data;
}

async function fetchEmployeeData() {
  const response = await fetch("/backend/data/contracto.json");
  return await response.json();
}

const itemsPerPage = 26;
let currentPage = 1;

function renderTable(employees, page) {
  const tbody = document.getElementById("employee-data");
  tbody.innerHTML = "";
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, employees.length);

  for (let i = startIndex; i < endIndex; i++) {
    const emp = employees[i];
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${emp.contact_person}</td>
        <td>${emp.job_nature}</td>
        <td>
          <span class="copy-text" data-copy="${emp.mobile}" style="cursor: pointer; text-decoration: none;">
            ${emp.mobile}
          </span>
        </td>
        <td>
          <span class="copy-text" data-copy="${emp.email}" style="cursor: pointer; text-decoration: none;">
            ${emp.email}
          </span>
        </td>
        <td>${emp.location}</td>
        <td>
          <a href="${emp.website}" target="_blank" class="website-link" style="text-decoration: none; color: inherit;">
            ${emp.website}
          </a>
        </td>
      `;

    tbody.appendChild(row);

    let localcopyToClipboard = (text) => {
      if (!text) return; 
      navigator.clipboard.writeText(text)
        .then(() => console.log(`Copied: ${text}`))
        .catch(err => console.error("Failed to copy text: ", err));
    };
    
    // Attach event listener to row but prevent popup when clicking website, phone, or email
    row.addEventListener("click", (event) => {
      const target = event.target;
      
      if (target.classList.contains("website-link")) {
        event.stopPropagation(); 
      } else if (target.classList.contains("copy-text")) {
        localcopyToClipboard(target.dataset.copy);
        event.stopPropagation(); 
      } else {
        showPopup(emp);
      }
    });
  }
  renderPagination(employees, page);
}


function showPopup(employee) {
  let overlay = document.getElementById("overlay");
  let popup = document.getElementById("custom-popup");

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "overlay";
    overlay.className = "overlay";
    document.body.appendChild(overlay);
    overlay.addEventListener("click", closePopup);
  }
  if (!popup) {
    popup = document.createElement("div");
    popup.id = "custom-popup";
    popup.className = "custom-popup";
    document.body.appendChild(popup);
  }

 

  popup.innerHTML = `
    <span class="custom-close-btn" onclick="closePopup()">&times;</span>
    <h2>${employee.name}</h2>
    <p><strong>Contact Person:</strong> ${employee.contact_person}</p>
    <p><strong>Job:</strong> ${employee.job_nature}</p>
    <p><strong>Phone:</strong> ${employee.mobile}</p>
    <p><strong>Tele-Phone:</strong> ${employee.telephone_no}</p>
    <p><strong>Email:</strong> ${employee.email}</p>
    <p><strong>Location:</strong> ${employee.location}</p>
    <p><strong>Address:</strong> ${employee.address}</p>
    <p><strong>Gst No:</strong> ${employee.gst_no}</p>
    <p><strong>Constitution:</strong> ${employee.constitution}</p>
    <p><strong>Reference:</strong> ${employee.reference}</p>
    <p><strong>Website:</strong> <a href="${employee.website}"  target="_blank">${employee.website}</a></p>
  `;
  let copybtn = document.createElement("button");
  copybtn.className = "copy-btn";
  copybtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  `;
  copybtn.addEventListener("click", () => copyToClipboard());

  popup.appendChild(copybtn);
  let closeBtn = document.createElement("span");
  closeBtn.innerHTML = "&times;";
  closeBtn.className = "custom-close-btn";
  closeBtn.addEventListener("click", closePopup);
  popup.appendChild(closeBtn);

  overlay.classList.add("active");
  popup.style.display = "block";
}

function copyToClipboard() {
  const popup = document.getElementById("custom-popup");
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
  overlay.classList.remove("active");
  document.getElementById("custom-popup").style.display = "none";
}

function renderPagination(employees, activePage) {
  const totalPages = Math.ceil(2000 / itemsPerPage);
  if (totalPages <= 1) return;

  const paginationDiv = document.getElementById("pagination");
  paginationDiv.innerHTML = "";

  const left = document.createElement("button");
  left.className = "controls";
  left.innerText = "<";
  left.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable(employees, currentPage);
    }
  };
  paginationDiv.appendChild(left);

  const firstBtn = document.createElement("button");
  firstBtn.innerText = "1";
  firstBtn.className = "pagination-btn" + (activePage === 1 ? " active" : "");
  firstBtn.onclick = () => {
    currentPage = 1;
    renderTable(employees, 1);
  };
  paginationDiv.appendChild(firstBtn);

  if (activePage > 2) {
    const dots = document.createElement("span");
    dots.innerText = "...";
    paginationDiv.appendChild(dots);
  }

  if (activePage !== 1 && activePage !== totalPages) {
    const currentBtn = document.createElement("button");
    currentBtn.innerText = activePage;
    currentBtn.className = "pagination-btn active";
    currentBtn.onclick = () => {
      currentPage = activePage;
      renderTable(employees, activePage);
    };
    paginationDiv.appendChild(currentBtn);
  }

  if (activePage < totalPages - 1) {
    const dots = document.createElement("span");
    dots.innerText = "...";
    paginationDiv.appendChild(dots);
  }

  if (totalPages > 1) {
    const lastBtn = document.createElement("button");
    lastBtn.innerText = totalPages;
    lastBtn.className =
      "pagination-btn" + (activePage === totalPages ? " active" : "");
    lastBtn.onclick = () => {
      currentPage = totalPages;
      renderTable(employees, totalPages);
    };
    paginationDiv.appendChild(lastBtn);
  }

  const right = document.createElement("button");
  right.className = "controls";
  right.innerText = ">";
  right.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderTable(employees, currentPage);
    }
  };
  paginationDiv.appendChild(right);
}

function toggleTheme() {
  document.body.classList.toggle("dark-mode");
}

function toggleMenu() {
  const menu = document.getElementById("side-menu");
  const overlay = document.getElementById("menu-overlay") || createOverlay();

  if (menu.classList.contains("open")) {
    menu.classList.remove("open");
    overlay.classList.remove("active"); // Hide overlay
    document.removeEventListener("click", handleOutsideClick);
    document.removeEventListener("scroll", handleScroll);
  } else {
    menu.classList.add("open");
    overlay.classList.add("active"); // Show overlay

    setTimeout(() => {
      document.addEventListener("click", handleOutsideClick);
      document.addEventListener("scroll", handleScroll);
    }, 100);
  }

  function handleOutsideClick(event) {
    if (
      !menu.contains(event.target) &&
      !event.target.classList.contains("menu-toggle")
    ) {
      closeMenu();
    }
  }

  function handleScroll() {
    closeMenu();
  }

  function closeMenu() {
    menu.classList.remove("open");
    overlay.classList.remove("active"); // Hide overlay
    document.removeEventListener("click", handleOutsideClick);
    document.removeEventListener("scroll", handleScroll);
  }
}

// Function to create the overlay if it doesn't exist
function createOverlay() {
  const overlay = document.createElement("div");
  overlay.id = "menu-overlay";
  overlay.classList.add("overlay");
  document.body.appendChild(overlay);

  // Clicking the overlay also closes the menu
  overlay.onclick = () => closeMenu();

  return overlay;
}

function closeMenu() {
  const menu = document.getElementById("side-menu");
  const overlay = document.getElementById("menu-overlay");

  if (menu) menu.classList.remove("open");
  if (overlay) overlay.classList.remove("active");

  document.removeEventListener("click", handleOutsideClick);
  document.removeEventListener("scroll", handleScroll);
}

async function openFilterDialog() {
  const naturedata = await getNatureOfJobs();
  const menu = document.getElementById("side-menu");
  if (menu.classList.contains("open")) {
    toggleMenu();
  }
  const overlay =
    document.getElementById("overlay") || createOverlay(closeFilterDialog);
  overlay.classList.add("active");

  let dialog = document.getElementById("filter-dialog");
  if (!dialog) {
    dialog = document.createElement("div");
    dialog.id = "filter-dialog";
    dialog.style.zIndex = "1001";
    dialog.innerHTML = `
        <div class="dialog-content">
          <h3>Filter Employees</h3>
  
          <div class="dropdown">
            <button class="dropdown-btn">Contractor Nature of Job ▼</button>
            <div class="dropdown-content">
              <input type="text" placeholder="Search" class="dropdownsearch">
              <div class="jobholder"></div>
            </div>
          </div>
          <div class="dropdown">
            <button class="dropdown-btn">Location ▼</button>
            <div class="dropdown-content">
              <input type="text" placeholder="Search" class="dropdownsearch">
              <div class="locationholder"></div>
            </div>
          </div>
  
          <button onclick="applyFilters()">Apply Filters</button>
          <button onclick="closeFilterDialog()">close</button>
        </div>
      `;
    document.body.appendChild(dialog);

    const dropdownButtons = dialog.querySelectorAll(".dropdown-btn");
    dropdownButtons.forEach((button) => {
      button.addEventListener("click", function () {
        this.nextElementSibling.classList.toggle("show");
      });
    });

    const jobHolder = document.querySelector(".jobholder");
    jobHolder.innerHTML = "";
    naturedata["jobCategories"].forEach((job) => {
      jobHolder.innerHTML += `
          <label><input type="checkbox" value="${job}" class="workCategory"> ${job}</label>
        `;
    });
  }
}

function closeFilterDialog() {
  const overlay = document.getElementById("overlay");
  const dialog = document.getElementById("filter-dialog");

  if (overlay) overlay.classList.remove("active");
  if (dialog) dialog.remove();
}

function createOverlay(closeCallback) {
  const overlay = document.createElement("div");
  overlay.id = "overlay";
  overlay.onclick = () => closeCallback();
  document.body.appendChild(overlay);
  return overlay;
}

function applyFilters() {
  //   const selectedWorkHours = Array.from(
  //     document.querySelectorAll(".workHours:checked")
  //   ).map((cb) => cb.value);
  //   const selectedStatus = Array.from(
  //     document.querySelectorAll(".status:checked")
  //   ).map((cb) => cb.value);
  //   const selectedDepartment = Array.from(
  //     document.querySelectorAll(".department:checked")
  //   ).map((cb) => cb.value);

  //   const filteredData = employeesData.filter((emp) => {
  //     return (
  //       (selectedWorkHours.length === 0 ||
  //         selectedWorkHours.includes(emp.workHours)) &&
  //       (selectedStatus.length === 0 || selectedStatus.includes(emp.status)) &&
  //       (selectedDepartment.length === 0 ||
  //         selectedDepartment.includes(emp.department))
  //     );
  //   });

  //   renderTable(filteredData, 1);
  closeFilterDialog();
}

fetchEmployeeData().then((employees) =>
  renderTable(employees["vendors"], currentPage)
);
