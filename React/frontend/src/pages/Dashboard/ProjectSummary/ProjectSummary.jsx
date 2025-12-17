import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../SidebarComponent/sidebar";
import Chart from "chart.js/auto";

const ProjectSummary = () => {
    const navigate = useNavigate();
    const progressChartRef = useRef(null);
    const financialChartRef = useRef(null);
    const progressChartInstance = useRef(null);
    const financialChartInstance = useRef(null);

    useEffect(() => {
        // --- Progress Chart (Doughnut) ---
        if (progressChartInstance.current) {
            progressChartInstance.current.destroy();
        }

        const progressCtx = progressChartRef.current.getContext("2d");
        progressChartInstance.current = new Chart(progressCtx, {
            type: "doughnut",
            data: {
                labels: ["Completed", "In Progress", "Not Started"],
                datasets: [{
                    data: [65, 20, 15],
                    backgroundColor: [
                        "rgba(34, 197, 94, 0.8)", // Green
                        "rgba(59, 130, 246, 0.8)", // Blue
                        "rgba(75, 85, 99, 0.5)"   // Gray
                    ],
                    borderColor: "rgba(17, 24, 39, 1)",
                    borderWidth: 2,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#9ca3af', padding: 20 }
                    },
                    title: {
                        display: true,
                        text: 'Overall Project Completion',
                        color: '#f3f4f6',
                        font: { size: 16 }
                    }
                }
            }
        });

        // --- Financial Chart (Bar) ---
        if (financialChartInstance.current) {
            financialChartInstance.current.destroy();
        }

        const financialCtx = financialChartRef.current.getContext("2d");
        financialChartInstance.current = new Chart(financialCtx, {
            type: "bar",
            data: {
                labels: ["Civil Work", "Plumbing", "Electrical", "HVAC", "Interiors"],
                datasets: [
                    {
                        label: "Budget Allocated",
                        data: [500000, 200000, 250000, 150000, 300000],
                        backgroundColor: "rgba(59, 130, 246, 0.6)",
                        borderColor: "rgba(59, 130, 246, 1)",
                        borderWidth: 1
                    },
                    {
                        label: "Actual Spent",
                        data: [420000, 180000, 120000, 50000, 50000],
                        backgroundColor: "rgba(245, 158, 11, 0.6)", // Amber
                        borderColor: "rgba(245, 158, 11, 1)",
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(75, 85, 99, 0.2)' },
                        ticks: { color: '#9ca3af' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#9ca3af' }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: '#9ca3af' }
                    }
                }
            }
        });

        // Cleanup function
        return () => {
            if (progressChartInstance.current) progressChartInstance.current.destroy();
            if (financialChartInstance.current) financialChartInstance.current.destroy();
        };
    }, []);

    // Summary Cards Data
    const summaryCards = [
        { title: "Days Completed", value: "145", sub: "out of 365 Days", icon: "calendar_today", color: "text-blue-400" },
        { title: "Pending Hindrances", value: "12", sub: "Issues Reported", icon: "warning", color: "text-red-400" },
        { title: "Manpower on Site", value: "85", sub: "Workers Today", icon: "groups", color: "text-green-400" },
        { title: "Active Work Orders", value: "8", sub: "Contractors Assigned", icon: "assignment", color: "text-purple-400" },
    ];

    return (
        <div className="flex h-screen bg-background">
            <Sidebar />
            <main className="flex-1 p-8 bg-gray-900 overflow-y-auto">
                <header className="mb-8">
                    <button
                        className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200 flex items-center space-x-2 mb-4"
                        onClick={() => navigate(-1)}
                    >
                        <span className="material-icons">arrow_back</span>
                        <span>Back</span>
                    </button>
                    <h1 className="text-4xl font-bold text-[var(--text-primary)]">
                        Project Summary & Overview
                    </h1>
                    <p className="text-[var(--text-secondary)]">
                        High-level metrics, financial status, and progress charts.
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {summaryCards.map((card, index) => (
                        <div key={index} className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-md hover:-translate-y-1 transition-transform">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-gray-400 text-sm uppercase tracking-wide font-semibold">{card.title}</h3>
                                    <div className="text-3xl font-bold text-white mt-1">{card.value}</div>
                                </div>
                                <span className={`material-icons text-3xl ${card.color}`}>{card.icon}</span>
                            </div>
                            <div className="text-sm text-gray-500">{card.sub}</div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Progress Chart Container */}
                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-md">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                            <span className="material-icons mr-2 text-green-500">donut_large</span>
                            Progress Overview
                        </h3>
                        <div className="relative h-64 w-full">
                            <canvas ref={progressChartRef}></canvas>
                        </div>
                    </div>

                    {/* Financial Chart Container */}
                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-md">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                            <span className="material-icons mr-2 text-blue-500">bar_chart</span>
                            Financial Status
                        </h3>
                        <div className="relative h-64 w-full">
                            <canvas ref={financialChartRef}></canvas>
                        </div>
                    </div>
                </div>

                <div className="mt-8 bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-md">
                    <h3 className="text-lg font-bold text-white mb-4">Executive Summary</h3>
                    <p className="text-gray-300 leading-relaxed">
                        The project is currently proceeding with a <span className="text-green-400 font-semibold">Healthy</span> status overall.
                        Civil works are nearing 60% completion. However, delays in <span className="text-red-400">Excavation work</span> due to geotech consultancy
                        and material shortages in <span className="text-red-400">Column Casting</span> (Steel) have been noted as critical hindrances.
                        Budget utilization is within limits for electrical and interiors, but plumbing expenses are tracking slightly lower than planned.
                        Immediate attention is required for the "Borewell CF4" decision pending status.
                    </p>
                </div>
            </main>
        </div>
    );
};

export default ProjectSummary;
