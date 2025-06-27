import { ip_address } from "../ip.js";

async function loadProjects(userId) {
  try {
    const response = await fetch(
      `http://${ip_address}:3000/project/userProjects/${userId}`
    );
    if (!response.ok) throw new Error("Failed to fetch projects");

    const projects = await response.json();
    console.log(projects);
    const container = document.getElementById("projects-container");
    container.innerHTML = "";

    projects.forEach((project) => {
      const progressPercent = Math.floor(Math.random() * 100) + 1;
      const card = document.createElement("div");
      card.className = "project-card";
      card.id = "project-" + project.project_id;
      card.style.setProperty("--progress-percent", `${progressPercent}%`);

      card.innerHTML = `
        <div class="project-title">${project.project_name}</div>
        <div class="project-description">${project.project_description}</div>
        <div class="project-details">
          <div class="detail-item"><strong>Start Date:</strong> ${new Date(
            project.start_date
          ).toLocaleDateString()}</div>
          <div class="detail-item"><strong>End Date:</strong> ${new Date(
            project.end_date
          ).toLocaleDateString()}</div>
          <div class="detail-item">
            <strong>Status:</strong>
            <span class="status-badge">In Progress</span>
          </div>
        </div>
        <div class="progress-section">
          <div class="progress-bar"><div class="progress-fill"></div></div>
          <div class="progress-text">${progressPercent}%</div>
        </div>
      `;
      container.appendChild(card);

      card.addEventListener("click", () => {
        localStorage.setItem("selected_project_id", project.project_id);
        window.location.href = "./Project-desc.html";
      });XMLDocument
    });
  } catch (err) {
    console.error("Error loading projects:", err);
  }
}

export { loadProjects };
