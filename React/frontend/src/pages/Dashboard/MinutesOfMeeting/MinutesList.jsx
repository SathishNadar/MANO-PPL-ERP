import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../../SidebarComponent/sidebar";

const MinutesList = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { projectId } = location.state || {};

    const [minutes, setMinutes] = useState([]);
    const [agendas, setAgendas] = useState([]);
    const [loading, setLoading] = useState(true);

    const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

    useEffect(() => {
        if (projectId) {
            fetchData();
        } else {
            console.warn("No projectId found in location state.");
            setLoading(false);
        }
    }, [projectId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [minRes, agRes] = await Promise.all([
                fetch(`${API_BASE}/projectMoM/moms/${projectId}`, { credentials: "include" }),
                fetch(`${API_BASE}/projectAgenda/agendas/${projectId}`, { credentials: "include" })
            ]);

            if (minRes.ok) {
                const data = await minRes.json();
                if (data.moms && Array.isArray(data.moms)) setMinutes(data.moms);
            }

            if (agRes.ok) {
                const data = await agRes.json();
                if (data.agendas && Array.isArray(data.agendas)) setAgendas(data.agendas);
            }

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const canCreateMoM = agendas.length > minutes.length;

    return (
        <div className="flex h-screen bg-background">
            <Sidebar />
            <main className="flex-1 p-6 bg-gray-900 overflow-y-auto">
                <header className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg shadow-md transition-all duration-200 border border-gray-700"
                            onClick={() => navigate(-1)}
                        >
                            <span className="material-icons">arrow_back</span>
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">
                                Minutes of Meeting
                            </h1>
                            <p className="text-gray-400 text-sm mt-1">
                                A log of project-related meetings and key discussions.
                            </p>
                        </div>
                    </div>
                    <div className="relative group/btn">
                        <button
                            className={`font-semibold py-2.5 px-6 rounded-lg shadow-lg transition-all duration-200 flex items-center space-x-2 
                            ${canCreateMoM
                                    ? "bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/20 text-white"
                                    : "bg-gray-700 text-gray-500 cursor-not-allowed opacity-75"}`}
                            onClick={() => canCreateMoM && navigate('/dashboard/minutes/create', { state: { projectId } })}
                            disabled={!canCreateMoM}
                        >
                            <span className="material-icons text-xl">add</span>
                            <span>New MoM</span>
                        </button>
                        {!canCreateMoM && !loading && (
                            <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 w-48 bg-gray-800 text-xs text-gray-300 p-2 rounded shadow-xl border border-gray-700 pointer-events-none opacity-0 group-hover/btn:opacity-100 transition-opacity z-10 text-center">
                                Create an Agenda first to create a MoM.
                            </div>
                        )}
                    </div>
                </header>

                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center text-gray-400 py-10">Loading minutes...</div>
                    ) : minutes.length === 0 ? (
                        <div className="text-center text-gray-400 py-10">
                            No minutes found for this project.
                        </div>
                    ) : (
                        minutes.map((item) => {
                            const date = new Date(item.date);
                            const dateStr = date.toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                            });

                            return (
                                <a
                                    key={item.mom_id}
                                    onClick={() => navigate(`/dashboard/minutes/${item.mom_id}`)}
                                    className={`group flex justify-between items-center p-5 rounded-xl transition-all duration-300 cursor-pointer 
                                    bg-gray-800/40 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600 hover:shadow-lg hover:translate-x-1`}
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="h-10 w-10 rounded-full bg-gray-900/50 flex items-center justify-center border border-gray-700 group-hover:border-gray-600 transition-colors">
                                            <span className="material-icons text-gray-400 group-hover:text-white transition-colors text-xl">description</span>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-lg text-gray-200 group-hover:text-white transition-colors">
                                                {item.subject}
                                            </p>
                                            <div className="flex gap-4 text-sm text-gray-500 mt-1">
                                                <span>Meeting No: {item.meeting_no}</span>
                                                {item.venue && <span>| Venue: {item.venue}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3 text-sm text-gray-500 group-hover:text-gray-400 transition-colors">
                                        <span className="material-icons text-base">event</span>
                                        <span className="font-medium">{dateStr}</span>
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
};

export default MinutesList;
