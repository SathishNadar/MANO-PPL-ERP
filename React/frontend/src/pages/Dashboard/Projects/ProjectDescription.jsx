import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Sidebar from "../../SidebarComponent/sidebar";
import DocumentIndex from "../../../components/DocumentIndex";

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

function ProjectDescription() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
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

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8 bg-gray-900 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[var(--text-primary)]">
              {project?.project_name || "Project"}
            </h1>
            <p className="text-[var(--text-secondary)]">
              Welcome back, let's get to work!
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center space-x-2"
              onClick={() => navigate("/dashboard/home")}
            >
              <span className="material-icons">home</span>
              <span>Home</span>
            </button>
            <div className="relative">
              <img
                alt="user avatar"
                className="w-12 h-12 rounded-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCzZrALTDtNtoKllECNeqa-KoCN3A3yAA9_l9U090P2qBGmuGd2sTXowj5ERtTyWBKsabMMLDKN2yvh5fs5vmv9BGyibq6-CvXy_dBvBywiGsXeBSbdxaYz9c3P82YPwtCzPLDyJYxTwcljuLX_aJu5tsw9ix3-A85mYi0S35mJNShmb5HaBZFguOZLtWfn1xI5a_nwj5FlApnATfVTO9AvOfVoxD0mqrb6hvV3oad2HofH0PbXsM_JRpiUn9T36C-TkH1_JAvLpCI"
              />
              <span className="absolute right-0 bottom-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            {/* Project Details Card */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-transform duration-300 p-6">
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-full bg-gray-900 mb-4 flex items-center justify-center border-4 border-[var(--accent-blue)]">
                  <span className="material-icons text-5xl text-[var(--accent-blue)]">
                    flight
                  </span>
                </div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                  {project?.project_name || "Project"}
                </h2>
              </div>
              <div className="mt-6 space-y-2 text-[var(--text-secondary)]">
                <p>
                  <strong className="text-[var(--text-primary)]">
                    Project:
                  </strong>{" "}
                  {project?.project_name || "-"}
                </p>
                <p>
                  <strong className="text-[var(--text-primary)]">
                    Employer:
                  </strong>{" "}
                  {project?.Employer || "-"}
                </p>
                <p>
                  <strong className="text-[var(--text-primary)]">
                    Location:
                  </strong>{" "}
                  {project?.location || "-"}
                </p>
                <p>
                  <strong className="text-[var(--text-primary)]">
                    Project Code:
                  </strong>{" "}
                  {project?.project_code || "-"}
                </p>
                <p>
                  <strong className="text-[var(--text-primary)]">
                    Project Description:
                  </strong>{" "}
                  {project?.project_description || "-"}
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
              </div>

              {/* Edit Project Button */}
              <button
                onClick={() =>
                  navigate(
                    `/dashboard/project-description/${projectId}/dprEdit`
                  )
                }
                className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              >
                Edit Project
              </button>
            </div>

            {/* Project Progress Card - Always Expanded */}
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
          </div>

          <div className="lg:col-span-2 space-y-8">
            {/* Document Index Component */}
            <DocumentIndex />
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProjectDescription;