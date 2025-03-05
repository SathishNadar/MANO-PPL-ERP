document.addEventListener("DOMContentLoaded", () => {
  const username = getSession();

  if (!username) {
    alert("Session expired or user not logged in. Please log in again.");
    window.location.href = "/frontend/login/index.html";
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
  } else {
    mainContent.innerHTML = `<h2>${selectedItem.dataset.text}</h2>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const menuItems = document.querySelectorAll(".sidebar li"); 
  const mainContent = document.querySelector(".main-content");

  // Attach event listeners to all sidebar items
  menuItems.forEach((item) => {
    item.addEventListener("click", () => {
      const page = item.dataset.page;
      if (localStorage.getItem("activePage") !== page) {
        setActivePage(page);
      }
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
          <button class="filters" onclick="openFilterDialog()">Filter</button>
      </div>
      <table class="employee-table">
          <thead>
              <tr>
                  <th>Name</th>
                  <th>Nature of Job</th>
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
    script.src = "/frontend/js/vendor.js";
    script.onload = () => {
      window.vendorScriptLoaded = true;
    };
    document.head.appendChild(script);
    // console.log(script)
  } else {
    renderVendorList(1);
  }
}

async function fetchVendorData() {
  const response = await fetch("/backend/data/contracto.json");
  return await response.json();
}

async function main() {
  const emp = await fetchVendorData(); // Await the promise
  console.log(emp["vendors"]); // Now it's properly resolved
}

main()