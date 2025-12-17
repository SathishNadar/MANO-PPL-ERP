import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Sidebar from "../../SidebarComponent/sidebar";
import DocumentIndex from "../../../components/DocumentIndex";

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

function ProjectDescription() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [dprs, setDprs] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [expandedReports, setExpandedReports] = useState({});

  const toggleReport = (reportType) => {
    setExpandedReports((prev) => ({
      ...prev,
      [reportType]: !prev[reportType],
    }));
  };




  useEffect(() => {
    if (!projectId) return;

    // fetch project
    fetch(`${API_BASE}/project/getProject/${projectId}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setProject(data.data);
      })
      .catch((err) => console.error("Failed to load project:", err));

    // fetch DPRs + role
    fetch(`${API_BASE}/report/Alldpr/${projectId}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data || !data.projects) {
          console.error("Unexpected DPRs response:", data);
          return;
        }

        let dprsList = data.projects;
        const role = data.role?.role.role_name || "";

        // special case for client
        if (role.toLowerCase() === "client") {
          dprsList = dprsList.filter((d) => d.dpr_status === "approved");
        }

        dprsList.sort(
          (a, b) => new Date(b.report_date) - new Date(a.report_date)
        );
        setDprs(dprsList);
      })
      .catch((err) => console.error("Failed to load DPRs:", err));

    // fetch users for mapping ids -> names (if permitted)
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/users`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data && data.success && Array.isArray(data.users)) {
          const map = {};
          data.users.forEach((u) => {
            // prefer the explicit user_id and user_name columns; fall back to common alternatives
            const id = u.user_id ?? u.id ?? u.userId;
            const name = u.user_name ?? u.userName ?? u.name ?? u.full_name ?? `${id}`;
            if (id !== undefined && id !== null) map[id] = name;
          });
          setUsersMap(map);
        } else {
          // likely not permitted for this user (non-admin) or unexpected shape
          console.info("Users fetch returned no users or not permitted.", data);
        }
      } catch (err) {
        // non-admins will likely get a 403 — that's fine, we'll just show Unknown
        console.info("Users fetch skipped or failed:", err);
      }
    };

    fetchUsers();


  }, [projectId]);

  // Calculate project progress percentage
  const getProgressPercentage = () => {
    if (!project?.start_date || !project?.end_date) return "0%";
    const start = new Date(project.start_date);
    const end = new Date(project.end_date);
    const today = new Date();

    if (today < start) return "0%";
    if (today > end) return "100%";

    const total = end - start;
    const elapsed = today - start;
    const percent = Math.floor((elapsed / total) * 100);
    return `${percent}%`;
  };



  //#region  helpers
  const getStatusClasses = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-900 text-green-300";
      case "under_review":
        return "bg-yellow-900 text-yellow-300";
      case "final_review":
        return "bg-blue-900 text-blue-300";
      case "in_progress":
        return "bg-orange-900 text-orange-300";
      default:
        return "bg-gray-700 text-gray-300";
    }
  };

  const totitlecase = (input) => {
    return input
      .split(/[_\s-]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Given DPR status, return the label to display
  const getActorLabelForStatus = (status) => {
    switch (status) {
      case "in_progress":
        return "Created by";
      case "under_review":
        return "Submitted by";
      case "final_review":
        return "Reviewed by";
      case "approved":
        return "Approved by";
      default:
        return "Submitted by";
    }
  };

  // Given DPR object and status, try to pick the correct user id field
  const getActorIdFromDpr = (dpr, status) => {
    // Preferential order of fields to check (best-effort)
    const fieldPriority = {
      in_progress: ["created_by", "createdBy", "creator_id", "user_id"],
      under_review: ["submitted_by", "submittedBy", "submitted_id", "created_by"],
      final_review: ["final_approved_by", "reviewed_by", "finalApprovedBy", "final_approved_id", "submitted_by"],
      approved: ["approved_by", "approvedBy", "approver_id", "final_approved_by", "reviewed_by"],
    };

    const candidates = fieldPriority[status] || [
      "submitted_by",
      "created_by",
      "approved_by",
    ];

    for (const f of candidates) {
      if (dpr[f] !== undefined && dpr[f] !== null && dpr[f] !== "") {
        return dpr[f];
      }
    }
    // fallback: check common numeric fields
    if (dpr.created_by) return dpr.created_by;
    if (dpr.approved_by) return dpr.approved_by;
    return null;
  };

  const getUserNameById = (id) => {
    if (!id && id !== 0) return "Unknown";
    // usersMap keys might be numbers or strings depending on API; normalize to string first
    const key = id;
    return usersMap[key] || usersMap[String(key)] || "Unknown";
  };
  //#endregion

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8 bg-gray-900 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <button
              className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200 flex items-center space-x-2 mb-4"
              onClick={() => navigate("/dashboard/projects")}
            >
              <span className="material-icons">arrow_back</span>
              <span>Back to Projects</span>
            </button>
            <h1 className="text-4xl font-bold text-[var(--text-primary)]">
              {project?.project_name || "Project"}
            </h1>
            <p className="text-[var(--text-secondary)]">
              Welcome back, let's get to work!
            </p>
          </div>

        </header>

        <div className="flex flex-col gap-8">
          <div className="w-full space-y-8">
            {/* Project Details Card */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-transform duration-300 p-6 relative">
              <div className="flex flex-col md:flex-row items-start gap-8">
                {/* Logo Section */}
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 rounded-full bg-gray-900 flex items-center justify-center border-4 border-[var(--accent-blue)]">
                    <span className="material-icons text-5xl text-[var(--accent-blue)]">
                      flight
                    </span>
                  </div>
                </div>

                {/* Details Section */}
                <div className="flex-1 space-y-4">
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                    {project?.project_name || "Project"}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[var(--text-secondary)]">
                    <p>
                      <strong className="text-[var(--text-primary)]">Project:</strong>{" "}
                      {project?.project_name || "-"}
                    </p>
                    <p>
                      <strong className="text-[var(--text-primary)]">Employer:</strong>{" "}
                      {project?.Employer || "-"}
                    </p>
                    <p>
                      <strong className="text-[var(--text-primary)]">Location:</strong>{" "}
                      {project?.location || "-"}
                    </p>
                    <p>
                      <strong className="text-[var(--text-primary)]">Project Code:</strong>{" "}
                      {project?.project_code || "-"}
                    </p>
                    <p>
                      <strong className="text-[var(--text-primary)]">Start:</strong>{" "}
                      {project?.start_date
                        ? new Date(project.start_date).toLocaleDateString("en-GB")
                        : "-"}
                    </p>
                    <p>
                      <strong className="text-[var(--text-primary)]">End:</strong>{" "}
                      {project?.end_date
                        ? new Date(project.end_date).toLocaleDateString("en-GB")
                        : "-"}
                    </p>
                    <div className="col-span-1 md:col-span-2">
                      <strong className="text-[var(--text-primary)] block mb-1">Project Description:</strong>
                      <span>{project?.project_description || "-"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit Project Button - Absolute Top Right */}
              <div className="absolute top-6 right-6">
                <button
                  onClick={() =>
                    navigate(
                      `/dashboard/project-description/${projectId}/dprEdit`
                    )
                  }
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
                >
                  <span className="material-icons text-sm">edit</span>
                  <span>Edit Project</span>
                </button>
              </div>
            </div>


            {/* Project Progress Card - Always Expanded - HIDDEN */}
            {false && (
              <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-transform duration-300 p-6">
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">
                  Project Progress
                </h3>

                <div className="space-y-3">
                  {/* DPR Dropdown */}
                  <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleReport('dpr')}
                      className="w-full p-4 flex items-center justify-between hover:bg-gray-800 transition-colors group"
                    >
                      <span className="text-white font-semibold text-sm uppercase">DPR</span>
                      <span
                        className={`material-icons text-gray-400 group-hover:text-white transition-all duration-200 ${expandedReports.dpr ? 'rotate-180' : ''
                          }`}
                      >
                        expand_more
                      </span>
                    </button>
                    {expandedReports.dpr && (
                      <div className="px-4 pb-4 bg-gray-900/50 border-t border-gray-700/50">
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div
                            onClick={() => navigate(`/dashboard/project-description/${projectId}/dprCreate`)}
                            className="group relative p-3 bg-gray-700/30 rounded-lg border border-gray-600 hover:border-blue-400 transition-all duration-200 cursor-pointer"
                          >
                            <div className="flex items-start space-x-3">
                              <span className="material-icons text-gray-500 group-hover:text-blue-400 transition-colors text-xl">
                                edit
                              </span>
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                                  Create
                                </h4>
                                <p className="text-xs text-gray-500 mt-1 group-hover:text-gray-400 transition-colors">
                                  Create DPR
                                </p>
                              </div>
                            </div>
                          </div>
                          <div
                            onClick={() => navigate(`/dashboard/project-description/${projectId}/dpr-list`)}
                            className="group relative p-3 bg-gray-700/30 rounded-lg border border-gray-600 hover:border-blue-400 transition-all duration-200 cursor-pointer"
                          >
                            <div className="flex items-start space-x-3">
                              <span className="material-icons text-gray-500 group-hover:text-blue-400 transition-colors text-xl">
                                visibility
                              </span>
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                                  View
                                </h4>
                                <p className="text-xs text-gray-500 mt-1 group-hover:text-gray-400 transition-colors">
                                  View all DPRs
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* WPR Dropdown */}
                  <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleReport('wpr')}
                      className="w-full p-4 flex items-center justify-between hover:bg-gray-800 transition-colors group"
                    >
                      <span className="text-white font-semibold text-sm uppercase">WPR</span>
                      <span
                        className={`material-icons text-gray-400 group-hover:text-white transition-all duration-200 ${expandedReports.wpr ? 'rotate-180' : ''
                          }`}
                      >
                        expand_more
                      </span>
                    </button>
                    {expandedReports.wpr && (
                      <div className="px-4 pb-4 bg-gray-900/50 border-t border-gray-700/50">
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div
                            onClick={() => {/* Navigate to edit WPR */ }}
                            className="group relative p-3 bg-gray-700/30 rounded-lg border border-gray-600 hover:border-blue-400 transition-all duration-200 cursor-pointer"
                          >
                            <div className="flex items-start space-x-3">
                              <span className="material-icons text-gray-500 group-hover:text-blue-400 transition-colors text-xl">
                                edit
                              </span>
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                                  Create
                                </h4>
                                <p className="text-xs text-gray-500 mt-1 group-hover:text-gray-400 transition-colors">
                                  Create WPR
                                </p>
                              </div>
                            </div>
                          </div>
                          <div
                            onClick={() => {/* Navigate to view WPR */ }}
                            className="group relative p-3 bg-gray-700/30 rounded-lg border border-gray-600 hover:border-blue-400 transition-all duration-200 cursor-pointer"
                          >
                            <div className="flex items-start space-x-3">
                              <span className="material-icons text-gray-500 group-hover:text-blue-400 transition-colors text-xl">
                                visibility
                              </span>
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                                  View
                                </h4>
                                <p className="text-xs text-gray-500 mt-1 group-hover:text-gray-400 transition-colors">
                                  View all WPRs
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* MPR Dropdown */}
                  <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleReport('mpr')}
                      className="w-full p-4 flex items-center justify-between hover:bg-gray-800 transition-colors group"
                    >
                      <span className="text-white font-semibold text-sm uppercase">MPR</span>
                      <span
                        className={`material-icons text-gray-400 group-hover:text-white transition-all duration-200 ${expandedReports.mpr ? 'rotate-180' : ''
                          }`}
                      >
                        expand_more
                      </span>
                    </button>
                    {expandedReports.mpr && (
                      <div className="px-4 pb-4 bg-gray-900/50 border-t border-gray-700/50">
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div
                            onClick={() => {/* Navigate to edit MPR */ }}
                            className="group relative p-3 bg-gray-700/30 rounded-lg border border-gray-600 hover:border-blue-400 transition-all duration-200 cursor-pointer"
                          >
                            <div className="flex items-start space-x-3">
                              <span className="material-icons text-gray-500 group-hover:text-blue-400 transition-colors text-xl">
                                edit
                              </span>
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                                  Create
                                </h4>
                                <p className="text-xs text-gray-500 mt-1 group-hover:text-gray-400 transition-colors">
                                  Create MPR
                                </p>
                              </div>
                            </div>
                          </div>
                          <div
                            onClick={() => {/* Navigate to view MPR */ }}
                            className="group relative p-3 bg-gray-700/30 rounded-lg border border-gray-600 hover:border-blue-400 transition-all duration-200 cursor-pointer"
                          >
                            <div className="flex items-start space-x-3">
                              <span className="material-icons text-gray-500 group-hover:text-blue-400 transition-colors text-xl">
                                visibility
                              </span>
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                                  View
                                </h4>
                                <p className="text-xs text-gray-500 mt-1 group-hover:text-gray-400 transition-colors">
                                  View all MPRs
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="w-full space-y-8">
            {/* Document Index Component */}
            <DocumentIndex />
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProjectDescription;