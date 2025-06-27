import { ip_address } from "../ip.js";

document.addEventListener("DOMContentLoaded", () => {
  const session = getSession();
  if (!session?.username) {
    alert("Session expired or user not logged in. Please log in again.");
    window.location.href = "../login/index.html";
    return;
  }

  document.querySelector(".user-info span").textContent = session.username;

  const selectedProjectId = localStorage.getItem("selected_project_id");

  if (!selectedProjectId) {
    alert("No project selected. Please go back and choose a project.");
    return;
  }

  fetch(`http://${ip_address}:3000/project/getProject/${selectedProjectId}`)
    .then((res) => res.json())
    .then((data) => {
      if (!data.success) throw new Error("Project fetch failed");

      const project = data.data;
      document.querySelector(
        ".project-title"
      ).innerHTML = `${project.project_name}`;
      document.querySelector(".profile-description").innerHTML = `
        <p><strong>Project:</strong> ${project.project_name}</p>
        <p><strong>Client:</strong> ${project.Employer}</p>
        <p><strong>Location:</strong> ${project.location}</p>
        <p><strong>Contract No:</strong> ${project.contract_no}</p>
        <p><strong>Start:</strong> ${new Date(
          project.start_date
        ).toLocaleDateString()}</p>
        <p><strong>End:</strong> ${new Date(
          project.end_date
        ).toLocaleDateString()}</p>
      `;
    })
    .catch((err) => {
      console.error("Error loading project details:", err);
      alert("Failed to load project details.");
    });

    loadDPRList(selectedProjectId);
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

function logout() {
  localStorage.removeItem("session");
  window.location.href = "../login/index.html";
}

function goHome() {
  localStorage.removeItem("selected_project_id");
  window.location.href = "./homepage.html";
}

function daysAgoFromToday(dateString) {
  const today = new Date();
  const reportDate = new Date(dateString);
  const diffTime = Math.abs(today - reportDate);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

async function loadDPRList(projectId) {
  try {
    const response = await fetch(`http://${ip_address}:3000/report/Alldpr/${projectId}`);
    if (!response.ok) throw new Error("Failed to fetch DPRs");

    const dprs = await response.json();

    const recentDprs = dprs.filter(dpr => {
      const daysAgo = daysAgoFromToday(dpr.report_date);
      return daysAgo <= 10 && daysAgo >= 0;
    });

    // Sort descending by date
    recentDprs.sort((a, b) => new Date(b.report_date) - new Date(a.report_date));

    const entryList = document.querySelector(".entry-list");
    entryList.innerHTML = ""; 

    if (recentDprs.length === 0) {
      entryList.innerHTML = `<p>No DPRs in the last 10 days.</p>`;
      return;
    }

    recentDprs.forEach((dpr) => {
      const date = new Date(dpr.report_date);
      const dateStr = date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      });
      const daysAgo = daysAgoFromToday(dpr.report_date);

      const entry = document.createElement("a");
      entry.className = "entry";
      entry.href = `/dpr/${date.toISOString().split("T")[0]}`;

      entry.innerHTML = `
        <span class="task-title">DPR - ${dateStr}</span>
        <span class="task-meta">🕒 ${daysAgo} day${daysAgo !== 1 ? "s" : ""} ago</span>
      `;
      entryList.appendChild(entry);
    });
  } catch (err) {
    console.error("Error loading DPR list:", err);
  }
}
window.logout = logout;
window.toggleUserMenu = toggleUserMenu;
window.goHome = goHome
