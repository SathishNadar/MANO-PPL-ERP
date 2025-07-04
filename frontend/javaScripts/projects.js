import { ip_address } from "../ip.js";

async function loadProjects(userId) {
  try {
    const response = await fetch(
      `http://${ip_address}:3000/project/userProjects/${userId}`
    );
    if (!response.ok) throw new Error("Failed to fetch projects");

    const projects = await response.json();
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

      card.addEventListener("click", () => {
        localStorage.setItem("selected_project_id", project.project_id);
        window.location.href = "./Project-desc.html";
      });

      container.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading projects:", err);
  }
}

function openNewProjectPopup(userId) {
  if (document.getElementById("new-project-popup-wrapper")) return;

  const popup = document.createElement("div");
  popup.id = "new-project-popup-wrapper";
  popup.className = "new-project-popup-wrapper";
  popup.innerHTML = `
    <div class="new-project-form-card">
      <button id="new-project-close" class="new-project-popup-close">&times;</button>

      <form id="new-project-form" class="new-project-form">
        <div class="new-project-form-group" style="grid-column: 1 / span 2">
          <label for="project_name">Project Name</label>
          <input type="text" id="project_name" name="project_name" required />
        </div>

        <div class="new-project-form-group" style="grid-column: 3 / span 2">
          <label for="project_code">Project Code</label>
          <input type="text" id="project_code" name="project_code" required />
        </div>

        <div class="new-project-form-group" style="grid-column: 1 / span 2; grid-row: 2 / span 2">
          <label for="project_description">Description</label>
          <textarea id="project_description" name="project_description" class="new-project-tall-textarea" required></textarea>
        </div>

        <div class="new-project-form-group" style="grid-column: 3 / span 2; grid-row: 2 / span 2">
          <label for="location">Location</label>
          <textarea id="location" name="location" class="new-project-tall-textarea" required></textarea>
        </div>

        <div class="new-project-form-group" style="grid-column: 1 / span 2; grid-row: 4">
          <label for="Employer">Employer</label>
          <input type="text" id="Employer" name="Employer" required />
        </div>

        <div class="new-project-form-group" style="grid-column: 3; grid-row: 4">
          <label for="start_date">Start Date</label>
          <input type="text" id="start_date" name="start_date" class="date-input" required />
        </div>

        <div class="new-project-form-group" style="grid-column: 4; grid-row: 4">
          <label for="end_date">End Date</label>
          <input type="text" id="end_date" name="end_date" class="date-input" required />
        </div>

        <div class="new-project-form-group" style="grid-column: span 4;">
          <input type="submit" value="Create Project" />
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(popup);

  document.getElementById("new-project-close").addEventListener("click", () => {
    popup.remove();
  });

  flatpickr("#start_date", {
    dateFormat: "Y-m-d",
    altInput: true,
    altFormat: "F j, Y",
    allowInput: true,
  });

  flatpickr("#end_date", {
    dateFormat: "Y-m-d",
    altInput: true,
    altFormat: "F j, Y",
    allowInput: true,
  });

  document
    .getElementById("new-project-form")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      const form = e.target;
      const startDate = new Date(form.start_date.value);
      const endDate = new Date(form.end_date.value);

      if (startDate >= endDate) {
        alert("Start Date must be earlier than End Date.");
        return;
      }

      const data = {
        project_name: form.project_name.value,
        project_code: form.project_code.value,
        project_description: form.project_description.value,
        location: form.location.value,
        Employer: form.Employer.value,
        start_date: form.start_date.value,
        end_date: form.end_date.value,
        user_id: userId,
        user_roles: {
          editors: [1, 3, 4],
          viewers: [10, 11, 15],
          approvals: { 1: true, 3: false },
          created_by: 1,
        },
      };

      try {
        const response = await fetch(
          `http://${ip_address}:3000/project/insertProject`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }
        );

        if (!response.ok) throw new Error("Failed to create project");

        popup.remove();
        const session = JSON.parse(localStorage.getItem("session"));
        if (session?.user_id) {
          loadProjects(session.user_id);
        }
      } catch (err) {
        console.warn("Error creating project: " + err.message);
        console.error(err);
      }
    });

  loadProjects(userId);
}

export { loadProjects, openNewProjectPopup };
