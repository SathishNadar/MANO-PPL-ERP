import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../../SidebarComponent/sidebar";

const AgendaDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [agendaDetails, setAgendaDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

    useEffect(() => {
        fetchAgendaDetails();
    }, [id]);

    const fetchAgendaDetails = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE}/projectAgenda/agenda/${id}`, {
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Process participants to group by company/organization
            // Expected group structure: { company_name: "Name", participants: [ ... ] }
            const groupedParticipants = {};

            if (data.participants && Array.isArray(data.participants)) {
                data.participants.forEach(p => {
                    const company = p.company_name || 'Unknown Organization';
                    if (!groupedParticipants[company]) {
                        groupedParticipants[company] = {
                            company_name: company,
                            participants: []
                        };
                    }
                    groupedParticipants[company].participants.push(p);
                });
            }

            // Convert to array
            const processedParticipants = Object.values(groupedParticipants);

            // Parse content if it's a string, or use as is if array
            let processedPoints = [];
            if (typeof data.content === 'string') {
                try {
                    processedPoints = JSON.parse(data.content);
                } catch (e) {
                    console.error("Failed to parse content JSON", e);
                    processedPoints = [];
                }
            } else if (Array.isArray(data.content)) {
                processedPoints = data.content;
            }


            setAgendaDetails({
                ...data,
                processedParticipants,
                processedPoints
            });

        } catch (err) {
            console.error("Error fetching agenda details:", err);
            setError("Failed to load agenda details.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-400">Loading details...</div>;
    if (error) return <div className="p-8 text-center text-red-400">{error}</div>;
    if (!agendaDetails) return <div className="p-8 text-center text-gray-400">Agenda not found.</div>;

    const toTitleCase = (str) => {
        if (!str) return "";
        return String(str)
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const dateStr = agendaDetails.date
        ? new Date(agendaDetails.date).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric"
        })
        : "-";

    return (
        <div className="flex h-screen bg-background">
            <Sidebar />
            <main className="flex-1 p-8 bg-gray-900 overflow-y-auto text-gray-300">
                <header className="mb-8 flex justify-between items-center">
                    <button
                        className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200 flex items-center space-x-2"
                        onClick={() => navigate(-1)}
                    >
                        <span className="material-icons">arrow_back</span>
                        <span>Back</span>
                    </button>
                    <button
                        className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all duration-200 flex items-center space-x-2"
                    // onClick={() => navigate(`/dashboard/agenda/${id}/edit`)} // Placeholder
                    >
                        <span className="material-icons">edit</span>
                        <span>Edit</span>
                    </button>
                </header>

                <div className="w-full space-y-6">

                    {/* Header Section */}
                    <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg shadow-md">
                        <div className="grid grid-cols-2 gap-4 border-b border-gray-700 pb-4 mb-4">
                            <div className="flex items-center space-x-4">
                                {/* Placeholders for Logos */}
                                <div className="h-12 w-12 bg-blue-600 rounded flex items-center justify-center font-bold text-white">M</div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">MANO</h2>
                                    <p className="text-xs text-gray-400">Project Consultants Pvt. Ltd.</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <h3 className="text-lg font-semibold text-blue-400">MEETING NO - {agendaDetails.meeting_no}</h3>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                            <p><span className="text-gray-500 font-semibold">Project:</span> <span className="text-white">{agendaDetails.project_name}</span></p>
                            {/* Job No is not in the API response provided, omitting or using placeholder if needed */}
                            {/* <p className="text-right"><span className="text-gray-500 font-semibold">JOB No:</span> <span className="text-white">{agendaDetails.jobNo}</span></p> */}
                            <p className="text-right"><span className="text-gray-500 font-semibold">Date:</span> <span className="text-white">{dateStr}</span></p>

                            <p><span className="text-gray-500 font-semibold">Subject:</span> <span className="text-white">{agendaDetails.subject}</span></p>
                            <p className="col-span-2"><span className="text-gray-500 font-semibold">Venue:</span> <span className="text-white">{agendaDetails.venue}</span></p>
                        </div>
                    </div>

                    {/* Participants Table */}
                    <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-md overflow-hidden">
                        <div className="bg-gray-700/50 p-3 border-b border-gray-700 font-bold text-center text-white">
                            Participants
                        </div>
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="bg-gray-900/40 text-gray-400">
                                    <th className="p-3 border-r border-b border-gray-700 w-1/4">Organization</th>
                                    <th className="p-3 border-r border-b border-gray-700 w-1/4">Responsibility</th>
                                    <th className="p-3 border-b border-gray-700 w-1/2">Representatives</th>
                                </tr>
                            </thead>
                            <tbody>
                                {agendaDetails.processedParticipants.map((group, idx) => (
                                    <tr key={idx} className="border-b border-gray-700 last:border-0 hover:bg-gray-700/20">
                                        <td className="p-3 border-r border-gray-700 align-top text-white font-bold text-lg">{toTitleCase(group.company_name)}</td>
                                        <td className="p-0 align-top border-r border-gray-700">
                                            {/* Since we group by organization, different responsibilities might exist in the same org. 
                                                 However, user request implies a row per org. We will likely list unique responsibilities or map them per person.
                                                 The request said: "all person belonging to same org should be in the same row".
                                                 We will list responsibilities corresponding to representatives or just unique ones.
                                              */}
                                            <div className="flex flex-col">
                                                {group.participants.map((rep, rIdx) => (
                                                    <div key={rIdx} className={`p-3 ${rIdx !== group.participants.length - 1 ? 'border-b border-gray-700' : ''} h-full`}>
                                                        <span className="text-gray-300">{toTitleCase(rep.responsibilities)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-0 align-top">
                                            {group.participants.map((rep, rIdx) => (
                                                <div key={rIdx} className={`p-3 flex justify-between ${rIdx !== group.participants.length - 1 ? 'border-b border-gray-700' : ''}`}>
                                                    <span className="text-gray-300">{toTitleCase(rep.contact_person)}</span>
                                                    <span className="text-gray-500 text-xs uppercase tracking-wider">{rep.designation}</span>
                                                </div>
                                            ))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Points Table */}
                    <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-md overflow-hidden">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="bg-gray-900/40 text-gray-400">
                                    <th className="p-3 border-r border-b border-gray-700 w-16 text-center">Sl No.</th>
                                    <th className="p-3 border-b border-gray-700">Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {agendaDetails.processedPoints.map((point, idx) => (
                                    <tr key={idx} className="border-b border-gray-700 last:border-0 hover:bg-gray-700/20">
                                        <td className="p-3 border-r border-gray-700 text-center font-mono text-gray-500">{point.no || point.sl}</td>
                                        <td className="p-3 text-gray-300">{point.description}</td>
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

export default AgendaDetails;
