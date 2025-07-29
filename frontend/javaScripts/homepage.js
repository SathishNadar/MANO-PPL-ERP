import {
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
  filterSearch,
} from "./vendor-list.js";

import { loadProjects, openNewProjectPopup } from "./projects.js";

// Session check
document.addEventListener("DOMContentLoaded", () => {
  const { username, _, __ } = getSession();

  if (!username) {
    alert("Session expired or user not logged in. Please log in again.");
    window.location.href = "../login/index.html";
  } else {
    document.querySelector(".user-info span").textContent = username;
  }
});

function getSession() {
  const sessionData = JSON.parse(localStorage.getItem("session"));
  if (!sessionData) return null;

  const { username, expiry, user_id } = sessionData;

  if (Date.now() > expiry) {
    localStorage.removeItem("session");
    return null;
  }

  return sessionData;
}

function setActivePage(page) {
  const menuItems = document.querySelectorAll(".sidebar li");
  const mainContent = document.querySelector(".main-content");
  localStorage.setItem("activePage", page);

  menuItems.forEach((item) => item.classList.remove("active-menu"));
  const selectedItem = [...menuItems].find(
    (item) => item.dataset.page === page
  );
  if (selectedItem) selectedItem.classList.add("active-menu");

  switch (page) {
    case "vendor":
      loadVendorList();
      break;
    case "vendor-consultants":
      loadConsultantList();
      break;
    case "vendor-contractors":
      loadContractorList();
      break;
    case "vendor-suppliers":
      loadSupplierList();
      break;
    case "client-list":
      loadclientlist();
      break;
    case "Projects":
      loadProjectList();
      break;
    default:
      // Hide the floating button every time we land on "home" or unknown page
      toggleFloatingAddButton(false);

      // Show homepage or fallback content
      mainContent.innerHTML = selectedItem
        ? `<h2>${selectedItem.dataset.text}</h2>` // shows sidebar text as title
        : `<h2>Welcome! Select an option from the menu.</h2>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const menuItems = document.querySelectorAll(".sidebar li");

  menuItems.forEach((item) => {
    item.addEventListener("click", () => {
      const page = item.dataset.page;
      if (localStorage.getItem("activePage") !== page) {
        setActivePage(page);
      }
    });
  });

  const vendorMenu = document.querySelector(".vendor-menu");
  const vendorToggle = document.querySelector(".vendor-toggle");
  const vendorSubItems = document.querySelectorAll(".vendor-sublist");

  vendorSubItems.forEach((item) => (item.style.display = "none"));

  vendorToggle.addEventListener("click", () => {
    const isExpanded = vendorMenu.classList.contains("expanded");
    vendorMenu.classList.toggle("expanded");
    vendorSubItems.forEach(
      (item) => (item.style.display = isExpanded ? "none" : "block")
    );
  });

  document.querySelectorAll(".vendor-sublist").forEach((item) => {
    item.addEventListener("click", () => {
      setActivePage(item.dataset.page);
    });
  });

  const savedPage = localStorage.getItem("activePage") || "home";
  setActivePage(savedPage);
});

function setMainContent(listname) {
  return `
    <div class="vendor-header">
      <h2>${listname}</h2>
      <div class="options">
        <div class="search">
          <div class="search-box">
            <div class="search-field">
              <input placeholder="Search..." class="input" type="text" />
              <div class="search-box-icon">
                <button class="btn-icon-content">
                  <i class="search-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                      <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z" fill="#000000"></path>
                    </svg>
                  </i>
                </button>
              </div>
            </div>
          </div>
        </div>
        <button class="filters" onclick="openFilterDialog()">Filter</button>
      </div>
    </div>
    <table class="employee-table">
      <thead>
        <tr>
          <th class="order" onclick="changeorder()">
            <span class="order-container">
              <span>Company Name</span>
              <svg class="order-icon" width="20" height="20" viewBox="0 0 24 24">
                <path d="M18 15L12 20L6 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
          </th>
          <th>Nature of Job</th>
          <th>Category</th>
          <th>Phone</th>
          <th class="email-column" style="
            width: 120px;
            min-width: 120px;
            max-width: 120px;
            white-space: normal;
            word-break: break-all;
            overflow: hidden;
            padding: 4px 2px;
          ">Email</th>
          <th>Location</th>
          <th>Website</th>
        </tr>
      </thead>
      <tbody id="vendor-data"></tbody>
    </table>
    <div id="vendor-pagination"></div>
  `;
}

function loadVendorList() {
  const mainContent = document.querySelector(".main-content");
  mainContent.innerHTML = setMainContent("Vendor List");

  if (!window.vendorScriptLoaded) {
    const script = document.createElement("script");
    script.src = "../javaScripts/vendor-list.js";
    script.type = "module";
    script.onload = () => {
      window.vendorScriptLoaded = true;
      initializeVendorList();
      attachSearchListeners();
    };
    document.head.appendChild(script);
  } else {
    setCategory(0);
    initializeVendorList();
    attachSearchListeners();
  }
  toggleFloatingAddButton(true); 
}

function loadConsultantList() {
  const mainContent = document.querySelector(".main-content");
  mainContent.innerHTML = setMainContent("Consultant List");

  if (!window.vendorScriptLoaded) {
    const script = document.createElement("script");
    script.src = "../javaScripts/vendor-list.js";
    script.type = "module";
    script.onload = () => {
      window.vendorScriptLoaded = true;
    };
    document.head.appendChild(script);
  } else {
    setCategory(1);
    attachSearchListeners();
    initializeVendorList();
  }
  toggleFloatingAddButton(true);
}

function loadContractorList() {
  const mainContent = document.querySelector(".main-content");
  mainContent.innerHTML = setMainContent("Contractor List");

  if (!window.vendorScriptLoaded) {
    const script = document.createElement("script");
    script.src = "../javaScripts/vendor-list.js";
    script.type = "module";
    script.onload = () => {
      window.vendorScriptLoaded = true;
    };
    document.head.appendChild(script);
  } else {
    setCategory(2);
    initializeVendorList();
    attachSearchListeners();
  }
  toggleFloatingAddButton(true);
}

function loadSupplierList() {
  const mainContent = document.querySelector(".main-content");
  mainContent.innerHTML = setMainContent("Supplier List");

  if (!window.vendorScriptLoaded) {
    const script = document.createElement("script");
    script.src = "../javaScripts/vendor-list.js";
    script.type = "module";
    script.onload = () => {
      window.vendorScriptLoaded = true;
    };
    document.head.appendChild(script);
  } else {
    setCategory(3);
    initializeVendorList();
    attachSearchListeners();
  }
  toggleFloatingAddButton(true);
}

function loadProjectList() {
  const mainContent = document.querySelector(".main-content");
  mainContent.innerHTML = `
    <h2 class="section-header">Project List</h2>
    <div id="projects-container" class="project-list-wrapper"></div>
    <div id="new-project-btn">
      <button class="icon-btn add-btn">
        <div class="add-icon"></div>
        <div class="btn-txt">Add Project</div>
      </button>
    </div>
  `;

  const session = JSON.parse(localStorage.getItem("session"));

  const loadAndAttach = () => {
    if (session?.user_id) {
      loadProjects(session.user_id);
    }

    const addBtn = document.querySelector(".icon-btn");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        openNewProjectPopup(session.user_id);
      });
    }
  };

  if (!window.projectScriptLoaded) {
    const script = document.createElement("script");
    script.src = "../javaScripts/projects.js";
    script.type = "module";
    script.onload = () => {
      window.projectScriptLoaded = true;
      loadAndAttach();
    };
    document.head.appendChild(script);
  } else {
    loadAndAttach();
  }
  toggleFloatingAddButton(false);
}

function toggleUserMenu() {
  let userdiv = document.querySelector(".user-dropdown");
  if (userdiv) {
    userdiv.style.display =
      userdiv.style.display === "block" ? "none" : "block";
    return;
  }

  userdiv = document.createElement("div");
  userdiv.className = "user-dropdown";
  userdiv.innerHTML = `
    <div class="user-dropdown-content">
      <button class="dropdown-btn settings-btn" onclick="openSettings()">Profile</button>
      <button class="dropdown-btn logout-btn" onclick="logout()">Logout</button>
    </div>
  `;
  document.querySelector(".user-info").appendChild(userdiv);
  userdiv.style.display = "block";
}

function loadclientlist() {
  const SetClientMainClient = () => {
    return `
      <div class="client-header">
        <h2>Client List</h2>
        <div class="options">
          <input class="client-search-input" placeholder="Search..." onkeypress="handleSearch(event)" />
          <button class="client-search-btn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
              <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z" fill="Black"></path>
            </svg>
          </button>
          <button class="filters" onclick="openFilterDialog()">Filter</button>
        </div>
      </div>
      <div class="client-table-wrapper">
        <table class="client-table">
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Nature of Job</th>
              <th>Category</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Location</th>
              <th>Website</th>
              <th>Emailed On</th>
              <th>WhatsApp Texted On</th>
              <th>Called On</th>
              <th>Visited On</th>
              <th>Self Remark</th>
              <th>Other Remark</th>
              <th>Ref</th>
              <th>Responsibility</th>
              <th>Remark Dec</th>
              <th>Month</th>
              <th>Remark May</th>
            </tr>
          </thead>
          <tbody id="client-data"></tbody>
        </table>
      </div>
      <div id="client-pagination"></div>
    `;
  };

  const mainContent = document.querySelector(".main-content");
  mainContent.innerHTML = SetClientMainClient();

  if (!window.clientScriptLoaded) {
    const script = document.createElement("script");
    script.src = "../javaScripts/client-list.js";
    script.onload = () => {
      window.clientScriptLoaded = true;
      renderClientList(clients);
    };
    document.head.appendChild(script);
  } else {
    renderClientList(clients);
  }
  toggleFloatingAddButton(false);
}

function logout() {
  localStorage.removeItem("session");
  window.location.href = "../login/index.html";
}

//FOR THE VISIBILITY OF BUTTON ONLY ON A VENDOR LIST OAGE AND NOT ANYOTHER
function toggleFloatingAddButton(show = true) {
  const btn = document.querySelector(".floating-add-btn");
  if (btn) {
    btn.style.display = show ? "block" : "none";
  }
}


// 👇️ Export functions to global scope for inline onclick="..." usage
window.openFilterDialog = openFilterDialog;
window.closeFilterDialog = closeFilterDialog;
window.changeorder = changeorder;
window.toggleUserMenu = toggleUserMenu;
window.logout = logout;
window.clearFilters = clearFilters;
window.toggleDropdown = toggleDropdown;
window.applyFilters = applyFilters;
window.closePopup = closePopup;
window.filterSearch = filterSearch;
window.loadProjects = loadProjects;
window.openNewProjectPopup = openNewProjectPopup;
