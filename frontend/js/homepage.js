document.addEventListener("DOMContentLoaded", () => {
  const username = getSession();

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
    <!-- From Uiverse.io by Li-Deheng -->
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
    script.src = "../js/vendor-list.js";
    script.onload = () => {
      window.vendorScriptLoaded = true;
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
    script.src = "../js/vendor-list.js";
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
    script.src = "../js/vendor-list.js";
    script.onload = () => {
      window.vendorScriptLoaded = true;
    };
    document.head.appendChild(script);
    // console.log(script)
  } else {
    categoryIds = 2;
    initializeVendorList();
    attachSearchListeners();
  }
}



function loadSupplierList() {
  const mainContent = document.querySelector(".main-content");
  mainContent.innerHTML = setMainContent("Supplier List");

  if (!window.vendorScriptLoaded) {
    const script = document.createElement("script");
    script.src = "../js/vendor-list.js";
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
