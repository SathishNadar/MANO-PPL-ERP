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
      document.querySelector(".project-title").innerHTML = `${project.project_name}`;
      document.querySelector(".profile-description").innerHTML = `
        <p><strong>Project:</strong> ${project.project_name}</p>
        <p><strong>Client:</strong> ${project.Employer}</p>
        <p><strong>Location:</strong> ${project.location}</p>
        <p><strong>Contract No:</strong> ${project.contract_no}</p>
        <p><strong>Start:</strong> ${new Date(project.start_date).toLocaleDateString()}</p>
        <p><strong>End:</strong> ${new Date(project.end_date).toLocaleDateString()}</p>
      `;
    })
    .catch((err) => {
      console.error("Error loading project details:", err);
      alert("Failed to load project details.");
    });
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

window.logout = logout;
window.toggleUserMenu = toggleUserMenu;