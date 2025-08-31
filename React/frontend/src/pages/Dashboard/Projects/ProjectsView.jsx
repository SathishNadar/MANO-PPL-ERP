import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Chart from "chart.js/auto";
import Sidebar from "../../SidebarComponent/sidebar";
import "material-icons/iconfont/material-icons.css";
import "./ProjectsView.css";
import ProjectCreate from "./ProjectCreate";
const ProjectsView = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [showCreateProject, setCreateProject] = useState(false);
  const userId = JSON.parse(localStorage.getItem("session"))?.user_id;
  const API_URI = import.meta.env.VITE_API_URI;
  const PORT = import.meta.env.VITE_BACKEND_PORT;

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch(
          `http://${API_URI}:${PORT}/project/userProjects/${userId}`,
          {
            credentials: "include",
          }
        );
        if (!response.ok) throw new Error("Failed to fetch projects");
        const data = await response.json();
        setProjects(data);

        const projectNames = data.map((p) => p.project_name);
        const progressValues = data.map(() => Math.floor(Math.random() * 100));

        const ctx = document.getElementById("projectChart");
        if (ctx) {
          const chartInstance = Chart.getChart("projectChart");
          if (chartInstance) chartInstance.destroy();

          new Chart(ctx, {
            type: "bar",
            data: {
              labels: projectNames,
              datasets: [
                {
                  label: "Progress %",
                  data: progressValues,
                  backgroundColor: "rgba(59, 130, 246, 0.5)",
                  borderColor: "rgba(59, 130, 246, 1)",
                  borderWidth: 1,
                  borderRadius: 8,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  ticks: { color: "#9CA3AF" },
                  grid: { color: "#374151" },
                },
                x: {
                  ticks: { color: "#9CA3AF" },
                  grid: { display: false },
                },
              },
            },
          });
        }
      } catch (err) {
        console.error("Error loading projects:", err);
      }
    };

    fetchProjects();

    return () => {
      const chartInstance = Chart.getChart("projectChart");
      if (chartInstance) chartInstance.destroy();
    };
  }, [userId]);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Project List</h1>
            <p className="text-secondary">
              An overview of all ongoing projects.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
                search
              </span>
              <input
                className="dashboard-input pl-10 pr-4 py-2 rounded-full border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]"
                placeholder="Search projects..."
                type="search"
              />
            </div>
          </div>
        </header>

        <div className="relative overflow-hidden mb-8 mt-8 pt-4">
          <div
            className="flex gap-8 transition-transform duration-300 scrollbar-hide"
            style={{ overflowX: "auto", scrollbarWidth: "none" }}
          >
            {projects.length === 0 && (
              <div className="text-secondary text-lg mt-8 ml-4">
                🚧 No projects at the moment.
              </div>
            )}
            {projects.length > 0 &&
              projects.map((project, index) => {
                const progress = Math.floor(Math.random() * 100);
                return (
                  <div key={index} className="pt-2">
                    <div
                      onClick={() =>
                        navigate(
                          `/dashboard/project-description/${project.project_id}`
                        )
                      }
                      className="bg-card p-6 rounded-2xl shadow-md hover:shadow-2xl transform transition-transform hover:-translate-y-2 hover:cursor-pointer"
                      style={{
                        minWidth: "600px", // or use a Tailwind class like min-w-[300px]
                        minHeight: "280px",
                        maxHeight: "320px",
                      }}
                    >
                      <h2 className="text-2xl font-bold text-primary mb-2">
                        {project.project_name}
                      </h2>
                      <p className="text-secondary mb-4">
                        {project.project_description}
                      </p>
                      <div className="flex justify-between text-sm text-secondary mb-4">
                        <div>
                          <span className="font-semibold">Start Date:</span>{" "}
                          {new Date(project.start_date).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-semibold">End Date:</span>{" "}
                          {new Date(project.end_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center mb-4">
                        <span className="font-semibold mr-2 text-primary">
                          Status:
                        </span>
                        <span className="bg-blue-900 text-blue-light text-xs font-semibold px-2.5 py-0.5 rounded-full">
                          In Progress
                        </span>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-primary">
                            Progress
                          </span>
                          <span className="text-sm font-medium text-blue-light">
                            {progress}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2.5">
                          <div
                            className="bg-blue h-2.5 rounded-full"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {projects.length > 0 && (
          <div className="bg-card p-6 rounded-2xl shadow-md col-span-1 lg:col-span-2">
            <h3 className="text-xl font-bold text-primary mb-4">
              Project Progress Overview
            </h3>
            <div className="h-64 relative">
              <div className="w-full h-full flex items-center justify-center bg-background rounded-lg">
                <canvas id="projectChart"></canvas>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => setCreateProject(true)}
          className="fixed bottom-8 right-8 bg-blue hover:bg-blue-dark text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform transform hover:scale-110"
        >
          <span className="material-icons text-3xl">add</span>
        </button>
        {showCreateProject && (
          <>
            {/* Dimmed Background */}
            <div className="fixed inset-0 bg-opacity-30 backdrop-blur-[2px] z-40" />

            {/* Modal Content */}
            <div className="absolute inset-0 z-50 flex justify-center px-4 py-8 overflow-y-auto">
              <div className="relative w-full max-w-4xl my-8">
                <ProjectCreate onClose={() => setCreateProject(false)} />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default ProjectsView;
