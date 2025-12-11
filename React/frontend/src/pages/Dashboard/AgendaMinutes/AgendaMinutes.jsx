import React from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../SidebarComponent/sidebar";

const AgendaMinutes = () => {
    const navigate = useNavigate();

    // Mock data based on the requirements
    const meetingData = [
        {
            id: 1,
            subject: "Weekly Progress Review",
            date: "2023-10-26",
            time: "10:00 AM",
            keyDiscussions: "Reviewed timeline for Phase 2. Discussed budget constraints.",
        },
        {
            id: 2,
            subject: "Client Feedback Session",
            date: "2023-10-24",
            time: "02:30 PM",
            keyDiscussions: "Client requested changes to the lobby layout.",
        },
        {
            id: 3,
            subject: "Vendor Negotiation - HVAC",
            date: "2023-10-20",
            time: "11:00 AM",
            keyDiscussions: "Finalized terms for AC installation contract.",
        },
        {
            id: 4,
            subject: "Site Safety Audit",
            date: "2023-10-18",
            time: "09:00 AM",
            keyDiscussions: "Identified need for additional signage in the north wing.",
        },
        {
            id: 5,
            subject: "Electrical Plan Review",
            date: "2023-10-15",
            time: "03:00 PM",
            keyDiscussions: "Approved the final wiring diagram for the main hall.",
        },
        {
            id: 6,
            subject: "Bi-Weekly Standup",
            date: "2023-10-12",
            time: "09:30 AM",
            keyDiscussions: "Team updates on individual task progress.",
        },
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
                        Agenda & Minutes of Meeting
                    </h1>
                    <p className="text-[var(--text-secondary)]">
                        A log of all project-related meetings and key discussions.
                    </p>
                </header>

                <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-900/50 border-b border-gray-700 text-xs uppercase text-gray-400 font-semibold tracking-wider">
                                    <th className="p-4 text-center w-16 border-r border-gray-700">Sr. No</th>
                                    <th className="p-4 border-r border-gray-700">Meeting Subject</th>
                                    <th className="p-4 w-32 border-r border-gray-700">Date</th>
                                    <th className="p-4 w-32 border-r border-gray-700">Time</th>
                                    <th className="p-4">Key Discussions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700 text-gray-300">
                                {meetingData.map((meeting, index) => (
                                    <tr key={meeting.id} className="hover:bg-gray-700/30 transition-colors duration-150">
                                        <td className="p-4 text-center font-medium border-r border-gray-700 bg-gray-900/40 text-gray-400">
                                            {index + 1}
                                        </td>
                                        <td className="p-4 font-medium text-white border-r border-gray-700">
                                            {meeting.subject}
                                        </td>
                                        <td className="p-4 font-mono text-gray-400 border-r border-gray-700">
                                            {meeting.date}
                                        </td>
                                        <td className="p-4 font-mono text-gray-400 border-r border-gray-700">
                                            {meeting.time}
                                        </td>
                                        <td className="p-4 text-gray-300">
                                            {meeting.keyDiscussions}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AgendaMinutes;
