import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Chart from "chart.js/auto";
import Sidebar from "../../SidebarComponent/sidebar";
import "material-icons/iconfont/material-icons.css";
import "./ProjectsView.css";
import ProjectCreate from "./ProjectCreate";

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";
const DEFAULT_AVATAR = "https://www.gravatar.com/avatar/?d=mp&s=80";

const ProjectsView = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [showCreateProject, setCreateProject] = useState(false);
  const [query, setQuery] = useState("");
  const userId = JSON.parse(localStorage.getItem("session"))?.user_id;
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  // compute elapsed & total days and completion flag
  const getDaysInfo = (project) => {
    if (!project?.start_date || !project?.end_date)
      return { elapsed: 0, total: 0, completed: false };
    const start = new Date(project.start_date);
    const end = new Date(project.end_date);
    if (isNaN(start) || isNaN(end)) return { elapsed: 0, total: 0, completed: false };

    const total = Math.max(
      0,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    );
    const today = new Date();
    let elapsed;
    if (today < start) elapsed = 0;
    else if (today >= end) elapsed = total;
    else elapsed = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    return { elapsed, total, completed: elapsed >= total };
  };

  // fetch & normalize projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch(`${API_BASE}/project/userProjects/${userId}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch projects");
        const data = await res.json();

        const normalized = (data || []).map((p) => ({
          ...p,
          project_id: p.project_id ?? p.id,
          project_name: p.project_name ?? p.name ?? "Untitled Project",
          project_code: p.project_code ?? p.code ?? p.projectCode ?? "",
          location: p.location ?? p.city ?? "",
          login: p.login ?? p.leader_login ?? "",
          leader_avatar: p.leader_avatar ?? p.avatar ?? DEFAULT_AVATAR,
        }));

        setProjects(normalized);
      } catch (err) {
        console.error("Error loading projects:", err);
        setProjects([]);
      }
    };

    if (userId) fetchProjects();
  }, [userId]);

  // fuzzy-ish token filter (AND of tokens). Matches project_name, location, project_code, login
  const filterProjects = (list, q) => {
    if (!q || !q.trim()) return list;
    const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
    return list.filter((p) => {
      const hay = `${p.project_name || ""} ${p.location || ""} ${p.project_code || ""} ${p.login || ""}`.toLowerCase();
      return tokens.every((t) => hay.includes(t));
    });
  };

  // Build chart whenever projects or query change
  useEffect(() => {
    const visible = filterProjects(projects, query);
    const labels = visible.map((p) => p.project_name);
    const elapsedValues = visible.map((p) => getDaysInfo(p).elapsed);
    const totalValues = visible.map((p) => getDaysInfo(p).total);

    const barColors = visible.map((p) => (getDaysInfo(p).completed ? "rgba(34,197,94,0.85)" : "rgba(59,130,246,0.8)"));

    const maxVal = Math.max(10, ...elapsedValues);

    // dynamic axis max: start at 365 and grow in steps of 50 when needed
    const axisStep = 50;
    const axisBase = 365;
    let axisMax = axisBase;
    while (maxVal > axisMax) axisMax += axisStep;

    // destroy old chart cleanly
    try {
      const existing = chartInstanceRef.current || (chartRef.current && Chart.getChart(chartRef.current));
      if (existing) existing.destroy();
    } catch (e) {
    }

    if (!chartRef.current) return;

    // plugin: draw values (e.g. "12d") to the right of each horizontal bar
    const valueLabels = {
      id: "valueLabels",
      afterDatasetsDraw: (chart) => {
        const ctx = chart.ctx;
        chart.data.datasets.forEach((dataset, i) => {
          const meta = chart.getDatasetMeta(i);
          meta.data.forEach((bar, idx) => {
            const value = dataset.data[idx];
            const x = bar.x + 8; // a little padding
            const y = bar.y;
            ctx.save();
            ctx.fillStyle = "#D1D5DB";
            ctx.font = "12px Poppins, sans-serif";
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.fillText(`${value}days`, x, y);
            ctx.restore();
          });
        });
      },
    };

    chartInstanceRef.current = new Chart(chartRef.current, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Elapsed Days",
            data: elapsedValues,
            backgroundColor: barColors,
            borderColor: "rgba(59,130,246,1)",
            borderWidth: 1,
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        indexAxis: "y", // horizontal bars
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}days`,
            },
          },
        },
        scales: {
          y: {
            grid: { display: false },
            ticks: { color: "#9CA3AF" },
          },
          x: {
            beginAtZero: true,
            max: axisMax,
            ticks: {
              color: "#9CA3AF",
              stepSize: 50,
            },
            grid: {
              color: "rgba(255,255,255,0.04)",
            },
          },
        },
      },
      plugins: [valueLabels],
    });

    // cleanup when effect re-runs or component unmounts
    return () => {
      try {
        chartInstanceRef.current?.destroy();
        chartInstanceRef.current = null;
      } catch (e) {}
    };
  }, [projects, query]);

  const visibleProjects = filterProjects(projects, query);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8 overflow-hidden">
        <div className="flex gap-8 h-full">
          {/* LEFT */}
          <div className="w-[40%] flex flex-col">
            <div className="flex-shrink-0 mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-primary">Project List</h1>
                <p className="text-secondary">An overview of all ongoing projects.</p>
              </div>
              <div className="ml-4">
                <button
                  onClick={() => setCreateProject(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue text-white rounded-md shadow hover:bg-blue-dark transition-colors"
                >
                  <span className="material-icons">post_add</span>
                  <span className="text-sm font-medium">Create Project...</span>
                </button>
              </div>
            </div>

            <div className="relative w-full mb-6 flex-shrink-0">
              <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-secondary">search</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-card border border-gray-700 focus:ring-2 focus:ring-[var(--accent-blue)]"
                placeholder="Search projects..."
                type="search"
              />
            </div>

            <div className="flex-grow overflow-y-auto pr-2 space-y-4">
              {visibleProjects.length === 0 && (
                <div className="text-secondary text-lg mt-8 ml-4">No matching projects.</div>
              )}

              {visibleProjects.map((project) => {
                const { elapsed, total, completed } = getDaysInfo(project);
                return (
                  <div
                    key={project.project_id}
                    onClick={() => navigate(`/dashboard/project-description/${project.project_id}`)}
                    className="bg-card p-4 rounded-lg shadow-md flex items-center justify-between hover:cursor-pointer hover:shadow-lg transition"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <img alt="leader" className="w-10 h-10 rounded-full" src={project.leader_avatar} />
                      <div className="min-w-0">
                        <h2 className="font-bold text-primary truncate">{project.project_name}</h2>

                        <div className="flex items-center space-x-2 text-xs text-secondary mt-1 truncate">
                          <span className="material-icons text-sm">location_on</span>
                          <span className="truncate">{project.location || "—"}</span>
                        </div>

                        <div className="text-xs text-secondary mt-1 truncate">
                          Code: {project.project_code || "—"} • {project.login || ""}
                        </div>
                      </div>
                    </div>

                    <div className="text-right ml-4">
                      {completed ? (
                        <div className="text-sm font-semibold text-green-400">Completed</div>
                      ) : (
                        <>
                          <div className="text-sm font-medium text-primary">
                            {total === 0 ? "0%" : `${Math.min(100, Math.round((elapsed / Math.max(1, total)) * 100))}%`}
                          </div>
                          <div className="text-xs text-secondary mt-1">{elapsed} days / {total} days</div>
                        </>
                      )}

                      <div className="w-24 mt-2 bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${completed ? "bg-green-500" : "bg-blue-500"}`}
                          style={{
                            width: `${total === 0 ? 0 : Math.min(100, Math.round((elapsed / Math.max(1, total)) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT - Chart */}
          <div className="w-[60%] bg-background p-6 rounded-lg flex flex-col">
            <h2 className="text-xl font-bold mb-6 text-primary">Project Progress Overview</h2>
            <div className="flex-grow relative" style={{ minHeight: 320 }}>
              <canvas id="projectChart" ref={chartRef} />
            </div>
          </div>
        </div>


        {showCreateProject && (
          <>
            <div className="fixed inset-0 bg-opacity-30 backdrop-blur-[2px] z-40" />
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