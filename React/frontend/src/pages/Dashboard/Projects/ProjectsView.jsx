import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// Chart logic moved into a separate component (create this file)
import ChartAreaComponent from "./../../SmolComponents/chartAreaComponent";
// Budget preview component (you will create BudgetPreviewComponent.jsx)
import BudgetPreviewComponent from "./../../BudgetingComponent/BudgetPreviewComponent";
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
  const [previewProjectId, setPreviewProjectId] = useState(null);
  const [showChart, setShowChart] = useState(true); // true -> show chart, false -> show budget tree preview

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

                    <div
                      className="text-right ml-4"
                      // onClick={(e) => {
                      //   // stop outer card navigation
                      //   e.stopPropagation();
                      //   // show budget preview for this project
                      //   setShowChart(false);
                      //   setPreviewProjectId(project.project_id);
                      // }}
                    >
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

          {/* RIGHT - Chart or Budget Preview */}
          <div className="w-[60%] bg-background p-6 rounded-lg flex flex-col h-full">
            <h2 className="text-xl font-bold mb-6 text-primary">Project Progress Overview</h2>
            <div className="flex-grow relative h-full" style={{ minHeight: "100%" }}>
              {showChart ? (
                <ChartAreaComponent
                  projects={projects}
                  filterProjects={filterProjects}
                  query={query}
                  getDaysInfo={getDaysInfo}
                />
              ) : (
                <BudgetPreviewComponent projectId={previewProjectId} />
              )}

              {!showChart && (
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setShowChart(true);
                      setPreviewProjectId(null);
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-gray-800 text-white rounded-md shadow hover:bg-gray-700 transition-colors"
                  >
                    Back to chart
                  </button>
                </div>
              )}
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