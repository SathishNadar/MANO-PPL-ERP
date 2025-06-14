document.addEventListener("DOMContentLoaded", () => {
  const username = getSession();

  // if (!username) {
  //   alert("Session expired or user not logged in. Please log in again.");
  //   window.location.href = "../login/index.html";
  // } else {
  //   document.querySelector(".user-info span").textContent = username;
  // }
});

function getSession() {
  const sessionData = JSON.parse(localStorage.getItem("session"));
  if (!sessionData) return null;

  const { username, expiry } = sessionData;

  if (Date.now() > expiry) {
    localStorage.removeItem("session");
    return null;
  }

  setSession(username);
  return username;
}

function setSession(username) {
  const expiryTime = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
  const sessionData = { username, expiry: expiryTime };
  localStorage.setItem("session", JSON.stringify(sessionData));
}

function setActivePage(page) {
  const menuItems = document.querySelectorAll(".sidebar li"); // Select all sidebar items
  const mainContent = document.querySelector(".main-content");
  localStorage.setItem("activePage", page);

  menuItems.forEach((item) => item.classList.remove("active-menu"));

  const selectedItem = [...menuItems].find(
    (item) => item.dataset.page === page
  );
  if (selectedItem) {
    selectedItem.classList.add("active-menu");
  }

  if (page === "vendor") {
    loadVendorList();
  } else if (page === "vendor-consultants") {
    loadConsultantList();
  } else if (page === "vendor-contractors") {
    loadContractorList();
  } else if (page === "vendor-suppliers") {
    loadSupplierList();
  } else if (page === "client-list") {
    loadclientlist();
  } else if (selectedItem) {
    mainContent.innerHTML = `<h2>${selectedItem.dataset.text}</h2>`;
  } else {
    mainContent.innerHTML = `<h2>Page Not Found</h2>`; // or handle the error
    console.warn(`No menu item found with data-page="${page}"`);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const menuItems = document.querySelectorAll(".sidebar li");

  // Attach event listeners to all sidebar items
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
  // Toggle Vendor List expansion
  vendorToggle.addEventListener("click", () => {
    const isExpanded = vendorMenu.classList.contains("expanded");

    if (isExpanded) {
      vendorMenu.classList.remove("expanded");
      vendorSubItems.forEach((item) => (item.style.display = "none"));
    } else {
      vendorMenu.classList.add("expanded");
      vendorSubItems.forEach((item) => (item.style.display = "block"));
    }
  });

  document.querySelectorAll(".vendor-sublist").forEach((item) => {
    item.addEventListener("click", () => {
      setActivePage(item.dataset.page);
    });
  });

  // Restore active page on reload
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
                <svg
                  xmlns="://www.w3.org/2000/svg"
                  version="1.1"
                  viewBox="0 0 512 512"
                >
                  <path
                    d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"
                    fill="#0000000"
                  ></path>
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
          <svg
            class="order-icon"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 15L12 20L6 15"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
      </th>
      <th>Nature of Job</th>
      <th>Category</th>
      <th>Phone</th>
      <th>Email</th>
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
    script.onload = () => {
      window.vendorScriptLoaded = true;
      initializeVendorList();
      attachSearchListeners();
    };
    document.head.appendChild(script);
  } else {
    categoryIds = 0;
    initializeVendorList();
    attachSearchListeners();
  }
}

function loadConsultantList() {
  const mainContent = document.querySelector(".main-content");
  mainContent.innerHTML = setMainContent("Consultant List");

  if (!window.vendorScriptLoaded) {
    const script = document.createElement("script");
    script.src = "../javaScripts/vendor-list.js";
    script.onload = () => {
      window.vendorScriptLoaded = true;
    };
    document.head.appendChild(script);
  } else {
    categoryIds = 1;
    attachSearchListeners();
    initializeVendorList();
  }
}

function loadContractorList() {
  const mainContent = document.querySelector(".main-content");
  mainContent.innerHTML = setMainContent("Contractor List");

  if (!window.vendorScriptLoaded) {
    const script = document.createElement("script");
    script.src = "../javaScripts/vendor-list.js";
    script.onload = () => {
      window.vendorScriptLoaded = true;
    };
    document.head.appendChild(script);
  } else {
    categoryIds = 2;
    initializeVendorList();
    attachSearchListeners();
  }
}

function loadclientlist() {
  const SetClientMainClient = () => {
    return `
    <div class="client-header">
      <h2>Client List</h2>
      <div class="options">
        <input
          class="client-search-input"
          placeholder="Search..."
          onkeypress="handleSearch(event)"
        />
        <button class="client-search-btn">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <path
              d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"
              fill="white"
            ></path>
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
}

function loadSupplierList() {
  const mainContent = document.querySelector(".main-content");
  mainContent.innerHTML = setMainContent("Supplier List");

  if (!window.vendorScriptLoaded) {
    const script = document.createElement("script");
    script.src = "../javaScripts/vendor-list.js";
    script.onload = () => {
      window.vendorScriptLoaded = true;
    };
    document.head.appendChild(script);
  } else {
    categoryIds = 3;
    initializeVendorList();
    attachSearchListeners();
  }
}

function toggleUserMenu() {
  let userdiv = document.querySelector(".user-dropdown");

  if (userdiv) {
    // If dropdown already exists, toggle visibility
    userdiv.style.display =
      userdiv.style.display === "block" ? "none" : "block";
    return;
  }

  // Create the dropdown menu
  userdiv = document.createElement("div");
  userdiv.className = "user-dropdown";

  userdiv.innerHTML = `
    <div class="user-dropdown-content">
      <button class="dropdown-btn settings-btn" onclick="openSettings()">
        <svg class="dropdown-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M12 1.5C17.2467 1.5 21.5 5.75329 21.5 11C21.5 16.2467 17.2467 20.5 12 20.5C6.75329 20.5 2.5 16.2467 2.5 11C2.5 5.75329 6.75329 1.5 12 1.5ZM12 3.5C7.85786 3.5 4.5 6.85786 4.5 11C4.5 15.1421 7.85786 18.5 12 18.5C16.1421 18.5 19.5 15.1421 19.5 11C19.5 6.85786 16.1421 3.5 12 3.5Z"></path>
        </svg>
        Profile
      </button>

      <button class="dropdown-btn logout-btn" onclick="logout()">
       <svg class="dropdown-icon"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          class="size-6"
        >
          <g stroke-width="0" id="SVGRepo_bgCarrier"></g>
          <g
            stroke-linejoin="round"
            stroke-linecap="round"
            id="SVGRepo_tracerCarrier"
          ></g>
          <g id="SVGRepo_iconCarrier">
            <path
              class="group-focus:fill-white"
              fill="#000000"
              d="M17.2929 14.2929C16.9024 14.6834 16.9024 15.3166 17.2929 15.7071C17.6834 16.0976 18.3166 16.0976 18.7071 15.7071L21.6201 12.7941C21.6351 12.7791 21.6497 12.7637 21.6637 12.748C21.87 12.5648 22 12.2976 22 12C22 11.7024 21.87 11.4352 21.6637 11.252C21.6497 11.2363 21.6351 11.2209 21.6201 11.2059L18.7071 8.29289C18.3166 7.90237 17.6834 7.90237 17.2929 8.29289C16.9024 8.68342 16.9024 9.31658 17.2929 9.70711L18.5858 11H13C12.4477 11 12 11.4477 12 12C12 12.5523 12.4477 13 13 13H18.5858L17.2929 14.2929Z"
            ></path>
            <path
        fill="#ffffff" 
        stroke="#000000" 
        stroke-width="2"
        d="M5 2C3.34315 2 2 3.34315 2 5V19C2 20.6569 3.34315 22 5 22H14.5C15.8807 22 17 20.8807 17 19.5V16.7326C16.8519 16.647 16.7125 16.5409 16.5858 16.4142C15.9314 15.7598 15.8253 14.7649 16.2674 14H13C11.8954 14 11 13.1046 11 12C11 10.8954 11.8954 10 13 10H16.2674C15.8253 9.23514 15.9314 8.24015 16.5858 7.58579C16.7125 7.4591 16.8519 7.35296 17 7.26738V4.5C17 3.11929 15.8807 2 14.5 2H5Z"
      ></path>
          </g>
        </svg>

        Logout
      </button>
    </div>
  `;

  document.querySelector(".user-info").appendChild(userdiv);
  userdiv.style.display = "block";
}

function logout() {
  localStorage.removeItem("session");
  window.location.href = "../login/index.html";
}
