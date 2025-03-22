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
  } 
  else if (page === "vendor-consultants") {
    loadConsultantList();
  } 
  else if (page === "vendor-contractors") {
    loadContractorList();
  } 
  else if (page === "vendor-suppliers") {
    loadSupplierList()
  } 
  else if (selectedItem) {
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

function loadVendorList() {
  const mainContent = document.querySelector(".main-content");

  mainContent.innerHTML = `
      <div class="vendor-header">
      <h2>Vendor List</h2>
      <div class="options">
        <button class="filters" onclick="openFilterDialog()">Filter</button>
      </div>
    </div>
    <table class="employee-table">
      <thead>
          <tr>
              <th class="order" onclick="changeorder()" ><svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 15L12 21L6 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
Company Name</th>
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

  if (!window.vendorScriptLoaded) {
    const script = document.createElement("script");
    script.src = "../js/vendor-list.js";
    script.onload = () => {
      window.vendorScriptLoaded = true;
    };
    document.head.appendChild(script);
    // console.log(script)
  } else {
    categoryIds = 0;
    initializeVendorList();
  }
}

function loadContractorList() {
  const mainContent = document.querySelector(".main-content");

  mainContent.innerHTML = `
      <div class="vendor-header">
      <h2>Vendor List</h2>
      <div class="options">
        <button class="filters" onclick="openFilterDialog()">Filter</button>
      </div>
    </div>
    <table class="employee-table">
      <thead>
          <tr>
              <th class="order" onclick="changeorder()" ><svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 15L12 21L6 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
Company Name</th>
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
  }
}

function loadSupplierList() {
  const mainContent = document.querySelector(".main-content");

  mainContent.innerHTML = `
      <div class="vendor-header">
      <h2>Vendor List</h2>
      <div class="options">
        <button class="filters" onclick="openFilterDialog()">Filter</button>
      </div>
    </div>
    <table class="employee-table">
      <thead>
          <tr>
              <<th class="order" onclick="changeorder()" ><svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 15L12 21L6 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
Company Name</th>
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

  if (!window.vendorScriptLoaded) {
    const script = document.createElement("script");
    script.src = "../js/vendor-list.js";
    script.onload = () => {
      window.vendorScriptLoaded = true;
    };
    document.head.appendChild(script);
    // console.log(script)
  } else {
    categoryIds = 3;
    initializeVendorList();
  }
}

function loadConsultantList() {
  const mainContent = document.querySelector(".main-content");

  mainContent.innerHTML = `
      <div class="vendor-header">
      <h2>Vendor List</h2>
      <div class="options">
        <button class="filters" onclick="openFilterDialog()">Filter</button>
      </div>
    </div>
    <table class="employee-table">
      <thead>
          <tr>
              <th class="order" onclick="changeorder()" ><svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 15L12 21L6 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
Company Name</th>
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

  if (!window.vendorScriptLoaded) {
    const script = document.createElement("script");
    script.src = "../js/vendor-list.js";
    script.onload = () => {
      window.vendorScriptLoaded = true;
    };
    document.head.appendChild(script);
    // console.log(script)
  } else {
    categoryIds = 1;
    initializeVendorList();
  }
}
