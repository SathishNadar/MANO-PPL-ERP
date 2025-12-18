import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../SidebarComponent/sidebar";

const DrawingPlannedVsAchieved = () => {
    const navigate = useNavigate();
    const { projectId } = useParams();

    const sections = [
        {
            title: "ARCHITECTURAL",
            rows: [
                { id: 1, name: "Site Plan", architectural: { planned: "01-Jul-25", received: "" } },
                { id: 2, name: "Parking Layout", architectural: { planned: "01-Jul-25", received: "" } },
                { id: 3, name: "Detail of Ramps", architectural: { planned: "01-Jul-25", received: "" } },
                { id: 4, name: "Floor Plans (Basement - Terrace)", architectural: { planned: "01-Jul-25", received: "" } },
                { id: 5, name: "Terrace Plan", architectural: { planned: "01-Jul-25", received: "" } },
                { id: 6, name: "Elevations", architectural: { planned: "01-Aug-25", received: "" } },
                { id: 7, name: "Sections", architectural: { planned: "01-Aug-25", received: "" } },
                { id: 8, name: "Staircase Details", architectural: { planned: "01-Aug-25", received: "" } },
                { id: 9, name: "Lift Fascia Details (Machine Room Less)", architectural: { planned: "01-Aug-25", received: "" } },
                { id: 10, name: "Flooring Layout", architectural: { planned: "01-Sep-25", received: "" } },
                { id: 11, name: "Sections & Elevations", architectural: { planned: "01-Aug-25", received: "" } },
                { id: 12, name: "3D", architectural: { planned: "01-Aug-25", received: "" } }
            ]
        },
        {
            title: "STRUCTURAL",
            rows: [
                { id: 1, name: "Structural Design Base Report", structural: { planned: "01-Jul-25", received: "" } },
                { id: 2, name: "General Drawings", structural: { planned: "01-Jul-25", received: "" } },
                { id: 3, name: "Foundation Layout and RCC Details", structural: { planned: "01-Jul-25", received: "" } },
                { id: 4, name: "Schedule of Raft, Footings & Columns", structural: { planned: "01-Jul-25", received: "" } },
                { id: 5, name: "Passenger & Service Lift", structural: { planned: "01-Jul-25", received: "" } },
                { id: 6, name: "STP Layout, Raft, Wall & Slab", structural: { planned: "01-Jul-25", received: "" } },
                { id: 7, name: "UGT, Pump Room Layout", structural: { planned: "01-Jul-25", received: "" } },
                { id: 8, name: "Plinth Beam / GR level Beam", structural: { planned: "01-Jul-25", received: "" } },
                { id: 9, name: "Graded Slab Sections", structural: { planned: "01-Jul-25", received: "" } },
                { id: 10, name: "1st to Terrace Slab Plan & Sections", structural: { planned: "01-Aug-25", received: "" } },
                { id: 11, name: "1st to Terrace Slab Schedule", structural: { planned: "01-Aug-25", received: "" } },
                { id: 12, name: "Staircase Plan, Section & Reinf", structural: { planned: "01-Aug-25", received: "" } },
                { id: 13, name: "LMR, OHT & Parapet", structural: { planned: "01-Sep-25", received: "" } },
                { id: 14, name: "Infra / External Development Drawings", structural: { planned: "01-Oct-25", received: "" } },
                { id: 15, name: "BOQ, Concrete & Steel Consumption", structural: { planned: "01-Jul-25", received: "" } },
            ]
        },
        {
            title: "MEP",
            rows: [
                { id: "MEP1", name: "MEP Design Base Report", mep: { planned: "01-Jul-25", received: "" } },
                { id: "MEP2", name: "Tender Documents with BOQ", mep: { planned: "01-Aug-25", received: "" } }
            ]
        },
        {
            title: "Plumbing",
            isSubSection: true,
            rows: [
                { id: "P1.1", name: "Schematic Drawing", mep: { planned: "01-Jul-25", received: "" } },
                { id: "P1.2", name: "Plumbing Layout Drawing", mep: { planned: "01-Jul-25", received: "" } },
                { id: "P1.3", name: "Details Of Toilets", mep: { planned: "01-Jul-25", received: "" } }
            ]
        }
    ];

    const thClass = "p-2 border border-gray-600 font-bold text-center text-xs bg-gray-900 text-gray-200";
    const tdClass = "p-2 border border-gray-600 text-center text-gray-300 text-xs";
    const tdNameClass = "p-2 border border-gray-600 text-left text-gray-300 text-xs font-medium";

    return (
        <div className="flex h-screen bg-background">
            <Sidebar />
            <main className="flex-1 p-8 bg-gray-900 overflow-y-auto">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <button
                            className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200 flex items-center space-x-2 mb-4"
                            onClick={() => navigate(-1)}
                        >
                            <span className="material-icons">arrow_back</span>
                            <span>Back</span>
                        </button>
                        <h1 className="text-4xl font-bold text-[var(--text-primary)]">
                            Drawing Planned vs Achieved
                        </h1>
                    </div>
                </header>

                <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-x-auto pb-4">
                    <table className="w-full border-collapse border border-gray-600 min-w-[1400px]">
                        <thead>
                            <tr>
                                <th rowSpan={2} className={`${thClass} w-12`}>Sr. No.</th>
                                <th rowSpan={2} className={`${thClass} w-64`}>Drawing Name</th>
                                <th colSpan={2} className={thClass}>Architectural Drawing</th>
                                <th colSpan={2} className={thClass}>Structural Drawing</th>
                                <th colSpan={2} className={thClass}>MEP Drawing</th>
                                <th colSpan={2} className={thClass}>Interior</th>
                                <th colSpan={2} className={thClass}>Landscape</th>
                                <th rowSpan={2} className={thClass}>Remarks</th>
                            </tr>
                            <tr>
                                <th className={thClass}>Planned</th>
                                <th className={thClass}>Received</th>
                                <th className={thClass}>Planned</th>
                                <th className={thClass}>Received</th>
                                <th className={thClass}>Planned</th>
                                <th className={thClass}>Received</th>
                                <th className={thClass}>Planned</th>
                                <th className={thClass}>Received</th>
                                <th className={thClass}>Planned</th>
                                <th className={thClass}>Received</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sections.map((section, sIndex) => (
                                <React.Fragment key={sIndex}>
                                    {section.title && (
                                        <tr>
                                            <td className={`${tdClass} font-bold bg-gray-700 text-white text-left`} colSpan={14}>
                                                {section.isSubSection ? <span className="pl-4">{section.title}</span> : <span>{String.fromCharCode(65 + sIndex)}. {section.title}</span>}
                                            </td>
                                        </tr>
                                    )}
                                    {section.rows.map((row, rIndex) => (
                                        <tr key={rIndex} className="hover:bg-gray-700/30 transition-colors">
                                            <td className={tdClass}>{row.id}</td>
                                            <td className={tdNameClass}>{row.name}</td>

                                            {/* Architectural */}
                                            <td className={tdClass}>{row.architectural?.planned || ""}</td>
                                            <td className={tdClass}>{row.architectural?.received || ""}</td>

                                            {/* Structural */}
                                            <td className={tdClass}>{row.structural?.planned || ""}</td>
                                            <td className={tdClass}>{row.structural?.received || ""}</td>

                                            {/* MEP */}
                                            <td className={tdClass}>{row.mep?.planned || ""}</td>
                                            <td className={tdClass}>{row.mep?.received || ""}</td>

                                            {/* Interior */}
                                            <td className={tdClass}>{row.interior?.planned || ""}</td>
                                            <td className={tdClass}>{row.interior?.received || ""}</td>

                                            {/* Landscape */}
                                            <td className={tdClass}>{row.landscape?.planned || ""}</td>
                                            <td className={tdClass}>{row.landscape?.received || ""}</td>

                                            <td className={tdClass}>{row.remarks || ""}</td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default DrawingPlannedVsAchieved;
