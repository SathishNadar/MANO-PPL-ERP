import React, { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";
import {
    Plus,
    Trash2,
    Save,
    ChevronLeft,
    FileText,
    AlertCircle,
    CheckCircle2,
    Loader2,
    History,
    Calendar,
    Clock,
    User as UserIcon
} from "lucide-react";
import Sidebar from "../SidebarComponent/sidebar";

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";
const DAR_API = `${API_BASE}/dailyActivityReport`;

const DailyActivityReport = () => {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Navigation: 'date-list' | 'report-detail'
    const [view, setView] = useState("date-list");

    // Data for listing
    const [reportHistory, setReportHistory] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null); // Used primarily by Admin
    const [darUsers, setDarUsers] = useState([]); // List of users for Admin to pick

    // Current Report working state
    const [activeDate, setActiveDate] = useState("");
    const [activities, setActivities] = useState([{ time: "", task: "" }]);
    const [currentDarId, setCurrentDarId] = useState(null);

    useEffect(() => {
        const session = localStorage.getItem("session");
        if (session) {
            const sessionData = JSON.parse(session);
            setUser(sessionData);
            // Use title_name from session (from Login.jsx)
            const is_admin = String(sessionData.title_name || "").toLowerCase() === "admin";
            setIsAdmin(is_admin);

            if (is_admin) {
                fetchDarUsers();
            } else {
                fetchReportsForUser(sessionData.user_id);
            }
        }
        setLoading(false);
    }, []);

    const fetchDarUsers = async () => {
        try {
            const res = await fetch(`${DAR_API}/users`, { credentials: "include" });
            const data = await res.json();
            if (data.ok) setDarUsers(data.data);
        } catch (err) {
            console.error("Error fetching DAR users", err);
        }
    };

    const fetchReportsForUser = async (userId) => {
        if (!userId) return;
        setLoading(true);
        try {
            const res = await fetch(`${DAR_API}/user/${userId}`, { credentials: "include" });
            const data = await res.json();
            if (data.ok) {
                setReportHistory(data.data);
            }
        } catch (err) {
            setError("Failed to fetch reports list");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectUserByAdmin = (u) => {
        setSelectedUser(u);
        fetchReportsForUser(u.user_id);
    };

    const openReport = (report) => {
        setActiveDate(report.date);
        setCurrentDarId(report.dar_id);

        // Parse the JSON report: expected format {"10:00": "Task", ...}
        let parsed = report.activity_report;
        if (typeof parsed === "string") {
            try {
                parsed = JSON.parse(parsed);
            } catch (e) {
                console.error("Error parsing report JSON:", e);
                parsed = {};
            }
        }

        const activityArray = Object.entries(parsed || {}).map(([time, task]) => ({ time, task }));
        setActivities(activityArray.length > 0 ? activityArray : [{ time: "", task: "" }]);

        setView("report-detail");
    };

    const startNewReport = () => {
        if (isAdmin) return;
        const today = new Date().toISOString().split('T')[0];
        setActiveDate(today);
        setActivities([{ time: "", task: "" }]);
        setCurrentDarId(null);
        setView("report-detail");
    };

    const addRow = () => {
        setActivities([...activities, { time: "", task: "" }]);
    };

    const removeRow = (index) => {
        const next = [...activities];
        next.splice(index, 1);
        setActivities(next.length > 0 ? next : [{ time: "", task: "" }]);
    };

    const updateRow = (index, field, value) => {
        const next = [...activities];
        next[index][field] = value;
        setActivities(next);
    };

    const saveReport = async () => {
        if (isAdmin) return;
        setLoading(true);
        setError(null);
        setSuccess(null);

        // Filter out empty rows
        const filledActivities = activities.filter(a => a.time.trim() || a.task.trim());

        // Convert array to object mapping: {"time": "task"}
        const reportObj = {};
        filledActivities.forEach(a => {
            reportObj[a.time] = a.task;
        });

        try {
            const payload = {
                date: activeDate,
                activity_report: reportObj
            };

            const url = currentDarId
                ? `${DAR_API}/update/${currentDarId}`
                : `${DAR_API}/add`;
            const method = currentDarId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                credentials: "include"
            });
            const data = await res.json();

            if (data.ok) {
                setSuccess("Report saved successfully!");
                // Refresh list
                fetchReportsForUser(user.user_id);
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError(data.message || "Failed to save report");
            }
        } catch (err) {
            setError("Failed to save report");
        } finally {
            setLoading(false);
        }
    };

    const deleteReport = async (id) => {
        if (isAdmin) return;
        if (!window.confirm("Are you sure you want to delete this report?")) return;

        try {
            const res = await fetch(`${DAR_API}/delete/${id}`, {
                method: "DELETE",
                credentials: "include"
            });
            const data = await res.json();
            if (data.ok) {
                fetchReportsForUser(user.user_id);
                if (view === "report-detail") setView("date-list");
            }
        } catch (err) {
            setError("Failed to delete report");
        }
    };

    return (
        <div className="flex h-screen bg-[#0F172A] text-slate-200 font-sans overflow-hidden">
            <Sidebar />

            <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                <div className="max-w-5xl mx-auto space-y-8">
                    {/* Header */}
                    <header className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                                <FileText className="text-blue-400 w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white leading-tight">Daily Activity Report</h1>
                                <p className="text-slate-400 text-sm">
                                    {isAdmin ? "Admin Read-Only Monitoring" : "Official daily task records"}
                                </p>
                            </div>
                        </div>

                        {!isAdmin && view === "date-list" && (
                            <button
                                onClick={startNewReport}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold transition-all shadow-lg active:scale-95"
                            >
                                <Plus size={18} />
                                Submit New Report
                            </button>
                        )}

                        {view === "report-detail" && (
                            <button
                                onClick={() => setView("date-list")}
                                className="px-4 py-2 hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-2 text-sm text-slate-400"
                            >
                                <ChevronLeft size={18} />
                                Back to List
                            </button>
                        )}
                    </header>

                    {/* Notifications */}
                    <div className="space-y-3">
                        {success && (
                            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <CheckCircle2 size={18} />
                                <span className="text-sm font-medium">{success}</span>
                            </div>
                        )}
                        {error && (
                            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <AlertCircle size={18} />
                                <span className="text-sm font-medium">{error}</span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* Admin Sidebar: Select User */}
                        {isAdmin && view === "date-list" && (
                            <div className="lg:col-span-4 space-y-4">
                                <div className="bg-slate-800/80 rounded-2xl border border-slate-700/50 overflow-hidden backdrop-blur-md shadow-xl">
                                    <div className="p-4 border-b border-slate-700/50 bg-slate-800/50">
                                        <h2 className="font-bold text-sm tracking-widest uppercase text-slate-500 flex items-center gap-2">
                                            <UserIcon size={14} /> Team Members
                                        </h2>
                                    </div>
                                    <div className="max-h-[600px] overflow-y-auto p-2 space-y-1">
                                        {darUsers.map(u => (
                                            <button
                                                key={u.user_id}
                                                onClick={() => handleSelectUserByAdmin(u)}
                                                className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${selectedUser?.user_id === u.user_id
                                                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                                                    : "hover:bg-slate-700/50 text-slate-400 border border-transparent"
                                                    }`}
                                            >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${selectedUser?.user_id === u.user_id ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                                    {u.user_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="font-semibold text-sm">{u.user_name}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Main Area */}
                        <div className={`${(isAdmin && view === "date-list") ? 'lg:col-span-8' : 'lg:col-span-12'}`}>

                            {/* View 1: Date List */}
                            {view === "date-list" && (
                                <div className="bg-slate-800/80 rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl backdrop-blur-md min-h-[400px]">
                                    <div className="p-6 border-b border-slate-700/50 bg-slate-800/50 flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            <History size={20} className="text-blue-400" />
                                            {isAdmin ? (selectedUser ? `Reports: ${selectedUser.user_name}` : "Select a member to view reports") : "Your Submission History"}
                                        </h3>
                                    </div>

                                    <div className="p-6">
                                        {reportHistory.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {reportHistory.map(report => (
                                                    <div
                                                        key={report.dar_id}
                                                        className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-700/30 rounded-xl hover:border-blue-500/50 hover:bg-slate-900/80 transition-all cursor-pointer group"
                                                        onClick={() => openReport(report)}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-3 bg-slate-800 rounded-lg text-slate-400 group-hover:text-blue-400 transition-colors">
                                                                <Calendar size={20} />
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-white">{format(new Date(report.date), 'MMMM do, yyyy')}</div>
                                                                <div className="text-xs text-slate-500 italic">Report ID: #{report.dar_id}</div>
                                                            </div>
                                                        </div>
                                                        {!isAdmin && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); deleteReport(report.dar_id); }}
                                                                className="p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-4">
                                                <div className="p-6 bg-slate-900/50 rounded-full border border-slate-800">
                                                    <History size={40} className="opacity-20" />
                                                </div>
                                                <p className="text-sm font-medium">No records found for this user.</p>
                                                {!isAdmin && <button onClick={startNewReport} className="text-blue-400 text-sm underline underline-offset-4 hover:text-blue-300">Submit your first report</button>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* View 2: Report Detail / Form */}
                            {view === "report-detail" && (
                                <div className="bg-slate-800/80 rounded-[2rem] border border-slate-700/50 overflow-hidden shadow-2xl backdrop-blur-md animate-in slide-in-from-right-4 duration-500">
                                    <div className="p-8 border-b border-slate-700/50 bg-slate-900/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex items-center gap-5">
                                            <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
                                                <Calendar size={28} />
                                            </div>
                                            <div>
                                                <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Target Date</div>
                                                {isAdmin || currentDarId ? (
                                                    <h3 className="text-2xl font-bold text-white">{format(new Date(activeDate), 'EEEE, MMMM do yyyy')}</h3>
                                                ) : (
                                                    <input
                                                        type="date"
                                                        value={activeDate}
                                                        onChange={(e) => setActiveDate(e.target.value)}
                                                        className="bg-transparent border-none text-2xl font-bold text-white focus:ring-0 p-0 cursor-pointer hover:text-blue-400 transition-colors"
                                                    />
                                                )}
                                            </div>
                                        </div>

                                        {!isAdmin && (
                                            <div className="flex items-center gap-3">
                                                {currentDarId && (
                                                    <button
                                                        onClick={() => deleteReport(currentDarId)}
                                                        className="px-5 py-2.5 rounded-xl border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 font-bold text-sm transition-all"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                                <button
                                                    onClick={saveReport}
                                                    disabled={loading}
                                                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-xl active:scale-95 text-sm"
                                                >
                                                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                                    {currentDarId ? "Update Report" : "Submit Report"}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-8 space-y-4">
                                        <div className="grid grid-cols-12 gap-4 pb-2 border-b border-slate-700/30">
                                            <div className="col-span-4 text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                                <Clock size={12} /> Time Slot / Schedule
                                            </div>
                                            <div className="col-span-8 text-xs font-black uppercase tracking-wider text-slate-500">
                                                Activity Description
                                            </div>
                                        </div>

                                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                            {activities.map((item, idx) => (
                                                <div key={idx} className="grid grid-cols-12 gap-4 group items-start">
                                                    <div className="col-span-4 relative">
                                                        <input
                                                            disabled={isAdmin}
                                                            placeholder="e.g. 10:30 - 11:00"
                                                            value={item.time}
                                                            onChange={(e) => updateRow(idx, 'time', e.target.value)}
                                                            className="w-full bg-slate-900/50 border border-slate-700 text-sm rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-700 disabled:opacity-50"
                                                        />
                                                    </div>
                                                    <div className="col-span-7 md:col-span-7">
                                                        <textarea
                                                            disabled={isAdmin}
                                                            rows="1"
                                                            placeholder="Describe achievement..."
                                                            value={item.task}
                                                            onChange={(e) => updateRow(idx, 'task', e.target.value)}
                                                            className="w-full bg-slate-900/50 border border-slate-700 text-sm rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-700 disabled:opacity-50 resize-none"
                                                            onInput={(e) => {
                                                                e.target.style.height = 'inherit';
                                                                e.target.style.height = `${e.target.scrollHeight}px`;
                                                            }}
                                                        ></textarea>
                                                    </div>
                                                    {!isAdmin && (
                                                        <div className="col-span-1 flex justify-end">
                                                            <button
                                                                onClick={() => removeRow(idx)}
                                                                className="p-3 text-slate-600 hover:text-rose-500 transition-all rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {!isAdmin && (
                                            <button
                                                onClick={addRow}
                                                className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-700/50 text-slate-500 hover:text-blue-400 hover:border-blue-400/50 hover:bg-blue-400/5 transition-all flex items-center justify-center gap-2 group"
                                            >
                                                <Plus size={18} className="group-hover:scale-125 transition-transform" />
                                                <span className="text-sm font-bold">Add Another Activity Log</span>
                                            </button>
                                        )}
                                    </div>

                                    {isAdmin && (
                                        <div className="p-8 bg-amber-500/5 border-t border-amber-500/10">
                                            <p className="text-xs text-amber-500/70 font-medium flex items-center gap-2">
                                                <AlertCircle size={14} /> This is a submitted record for monitoring. Modification is restricted to the owning team member.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DailyActivityReport;
