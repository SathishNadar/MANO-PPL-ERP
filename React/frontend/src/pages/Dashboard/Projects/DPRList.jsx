import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../SidebarComponent/sidebar";

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

function DPRList() {
    const navigate = useNavigate();
    const { projectId } = useParams();
    const [dprs, setDprs] = useState([]);
    const [usersMap, setUsersMap] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!projectId) return;

        // fetch DPRs + role
        fetch(`${API_BASE}/report/Alldpr/${projectId}`, {
            credentials: "include",
        })
            .then((res) => res.json())
            .then((data) => {
                if (!data || !data.projects) {
                    console.error("Unexpected DPRs response:", data);
                    setLoading(false);
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
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to load DPRs:", err);
                setLoading(false);
            });

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
                        const id = u.user_id ?? u.id ?? u.userId;
                        const name = u.user_name ?? u.userName ?? u.name ?? u.full_name ?? `${id}`;
                        if (id !== undefined && id !== null) map[id] = name;
                    });
                    setUsersMap(map);
                }
            } catch (err) {
                console.info("Users fetch skipped or failed:", err);
            }
        };

        fetchUsers();
    }, [projectId]);

    //#region helpers
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

    const getActorIdFromDpr = (dpr, status) => {
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
        if (dpr.created_by) return dpr.created_by;
        if (dpr.approved_by) return dpr.approved_by;
        return null;
    };

    const getUserNameById = (id) => {
        if (!id && id !== 0) return "Unknown";
        const key = id;
        return usersMap[key] || usersMap[String(key)] || "Unknown";
    };
    //#endregion

    return (
        <div className="flex h-screen bg-background">
            <Sidebar />
            <main className="flex-1 p-6 bg-gray-900 overflow-y-auto">
                <header className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg shadow-md transition-all duration-200 border border-gray-700"
                            onClick={() => navigate(`/dashboard/project-description/${projectId}`)}
                        >
                            <span className="material-icons">arrow_back</span>
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">
                                Daily Progress Reports
                            </h1>
                            <p className="text-gray-400 text-sm mt-1">
                                View and manage all daily progress reports
                            </p>
                        </div>
                    </div>
                </header>

                <div className="space-y-4">
                    {loading ? (
                        <p className="text-[var(--text-secondary)]">Loading reports...</p>
                    ) : dprs.length === 0 ? (
                        <p className="text-[var(--text-secondary)]">
                            No DPR Data found.
                        </p>
                    ) : (
                        dprs.map((dpr) => {
                            const date = new Date(dpr.report_date);
                            const dateStr = date.toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                            });
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            date.setHours(0, 0, 0, 0);
                            const diffDays = Math.floor(
                                (today - date) / (1000 * 60 * 60 * 24)
                            );
                            const label =
                                diffDays === 0
                                    ? "Today"
                                    : diffDays === 1
                                        ? "Yesterday"
                                        : `${diffDays} days ago`;

                            const userId = JSON.parse(
                                localStorage.getItem("session") || "{}"
                            ).user_id;
                            const isHandler =
                                dpr.current_handler?.toString() === userId?.toString();

                            // Enhanced border logic for active items
                            const activeBorderClass = isHandler
                                ? "border-l-4 border-l-green-500 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                                : "";

                            const actorLabel = getActorLabelForStatus(dpr.dpr_status);
                            const actorId = getActorIdFromDpr(dpr, dpr.dpr_status);
                            const actorName = getUserNameById(actorId);

                            return (
                                <a
                                    key={dpr.dpr_id}
                                    id={dpr.dpr_id}
                                    href={`/dashboard/project-description/${projectId}/${dpr.dpr_id}`}
                                    className={`group flex justify-between items-center p-5 rounded-xl transition-all duration-300 cursor-pointer 
                                        bg-gray-800/40 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600 hover:shadow-lg hover:translate-x-1 ${activeBorderClass}`}
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="h-10 w-10 rounded-full bg-gray-900/50 flex items-center justify-center border border-gray-700 group-hover:border-gray-600 transition-colors">
                                            <span className="material-icons text-gray-400 group-hover:text-white transition-colors text-xl">description</span>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-lg text-gray-200 group-hover:text-white transition-colors">
                                                DPR - {dateStr}
                                            </p>
                                            <p className="text-sm text-gray-500 group-hover:text-gray-400">
                                                {actorLabel} {actorName}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-4 text-sm">
                                        <span
                                            className={`text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide ${getStatusClasses(
                                                dpr.dpr_status
                                            )}`}
                                        >
                                            {totitlecase(dpr.dpr_status)}
                                        </span>
                                        <div className="flex items-center space-x-2 text-gray-500 group-hover:text-gray-400 transition-colors">
                                            <span className="material-icons text-base">today</span>
                                            <span>{label}</span>
                                        </div>
                                        <span className="material-icons text-gray-600 group-hover:text-gray-400 group-hover:translate-x-1 transition-all duration-300">chevron_right</span>
                                    </div>
                                </a>
                            );
                        })
                    )}
                </div>
            </main>
        </div>
    );
}

export default DPRList;
