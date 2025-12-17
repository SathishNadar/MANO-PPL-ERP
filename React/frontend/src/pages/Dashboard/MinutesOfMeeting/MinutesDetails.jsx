import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../../SidebarComponent/sidebar";

const MinutesDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Mock data based on the provided image
    const meetingDetails = {
        meetingNo: "MEETING - 12",
        jobNo: "2223-57",
        project: "Sati Darshan, Malad",
        client: "Goyal Group",
        subject: "Drawing Status & Site Progress",
        venue: "Residency Sarovar Portico",
        date: "12/12/2022",
        participants: [
            {
                responsibility: "Client",
                organization: "Goyal Group",
                representatives: [
                    { name: "Mr. Pranay Goyal", designation: "Director" },
                    { name: "Mr. Devang Kanavia", designation: "Head Strategy" }
                ]
            },
            {
                responsibility: "Client",
                organization: "Malpani Group",
                representatives: [
                    { name: "Mr. Ashish Malpani", designation: "Director" },
                    { name: "Mrs. Rupali Nimbalkar", designation: "Architect" },
                    { name: "Mr. Balasaheb Babar", designation: "Head Construction" },
                    { name: "Malpani Team", designation: "-" }
                ]
            },
            {
                responsibility: "Project Management Consultants",
                organization: "MANO Project Consultants Pvt Ltd.",
                representatives: [
                    { name: "Mr. Mugilan Muthaiah", designation: "CEO & Founder" },
                    { name: "Mr. Santosh Kadam", designation: "Project Manager" },
                    { name: "Ms. Shradha Nimbalkar", designation: "DM - Contracts" }
                ]
            },
            {
                responsibility: "Architect",
                organization: "The Design Studio",
                representatives: [
                    { name: "Mr. Ubaid Pettiwala", designation: "Design Architect" }
                ]
            },
            {
                responsibility: "Structural Consultant",
                organization: "Epicons Consultants Pvt Ltd",
                representatives: [
                    { name: "Mr. Mahendra Patil", designation: "Sr. Structural Engineer" },
                    { name: "Mr. Nikhil H", designation: "Structural Engineer" }
                ]
            },
            {
                responsibility: "MEP Consultant",
                organization: "Clancy Global Consulting Engineers",
                representatives: [
                    { name: "Mr. Ajay Kshirsagar", designation: "Project Manager" },
                    { name: "Mr. Sagar Polad", designation: "Assistant Manager" }
                ]
            }
        ],
        points: [
            { sl: "1", description: "MANO discussed following points with team", status: "", date: "", actionBy: "" },
            { sl: "1.1", description: "Delay in Release of MEP Co-ordinate caused delay in Architectural Ground Floor Plan (GFC).", status: "P", date: "", actionBy: "Info" },
            { sl: "1.2", description: "Tender Documents not done as per revised drawing caused delay for Contractor deployment.", status: "P", date: "", actionBy: "Info" },
            { sl: "1.3", description: "Final Architectural Plan with Sections up to 3 Podiums & Typical Floor Levels are pending", status: "P", date: "", actionBy: "DS" },
            { sl: "1.4", description: "As per planning, Plinth completion is target for end of December. We require 1st Podium Architectural, Structural and MEP drawings (GFC).", status: "P", date: "", actionBy: "DS, Epicons, Clancy" },
            { sl: "1.5", description: "Interior & Landscape designing progress is getting delayed due to all above points.", status: "P", date: "", actionBy: "Info" },
            { sl: "1.6", description: "Improvement required in quality management required prompt action on curing , supervision during concreting on site.", status: "A", date: "", actionBy: "MC" },
            { sl: "1.7", description: "Improvement required in safety management like indication signages on site, daily housekeeping in toilets, fogging in labour colonies etc on site.", status: "A", date: "", actionBy: "MC" },
            { sl: "1.8", description: "Improvement required in documentation like maintaining records of incoming material like cement, sand, steel, concrete etc on site.", status: "A", date: "", actionBy: "MC" },
            { sl: "1.9", description: "Signed Civil work order is still awaited from Client.", status: "P", date: "", actionBy: "Goyal" },
            { sl: "2", description: "MANO asked DS about the updated Architectural plan revised as per column changes for Amended Approvals, DS replied they co-ordinate directly with GOYAL.", status: "F/A", date: "", actionBy: "DS" },
            { sl: "3", description: "MALPANI informed GOYAL and MANO that installation of Man-Material hoist and tower crane at site is complusory and if possible man material hoist utilisation charges to be debited from respective contractor bill on monthly basis, MANO and GOYAL agreed.", status: "F/C", date: "", actionBy: "Info" },
        ]
    };

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
                    // onClick={() => navigate(`/dashboard/minutes/${id}/edit`)} // Placeholder
                    >
                        <span className="material-icons">edit</span>
                        <span>Edit</span>
                    </button>
                </header>



                {/* Re-implementing using Dark Theme to match software uniformity as requested */}
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
                                <h3 className="text-lg font-semibold text-blue-400">{meetingDetails.meetingNo}</h3>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                            <p><span className="text-gray-500 font-semibold">Project:</span> <span className="text-white">{meetingDetails.project}</span></p>
                            <p className="text-right"><span className="text-gray-500 font-semibold">JOB No:</span> <span className="text-white">{meetingDetails.jobNo}</span></p>

                            <p><span className="text-gray-500 font-semibold">Subject:</span> <span className="text-white">{meetingDetails.subject}</span></p>
                            <p className="text-right"><span className="text-gray-500 font-semibold">Date:</span> <span className="text-white">{meetingDetails.date}</span></p>

                            <p className="col-span-2"><span className="text-gray-500 font-semibold">Venue:</span> <span className="text-white">{meetingDetails.venue}</span></p>
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
                                    <th className="p-3 border-r border-b border-gray-700 w-1/4">Responsibility</th>
                                    <th className="p-3 border-r border-b border-gray-700 w-1/4">Organization</th>
                                    <th className="p-3 border-b border-gray-700 w-1/2">Representatives</th>
                                </tr>
                            </thead>
                            <tbody>
                                {meetingDetails.participants.map((group, idx) => (
                                    <tr key={idx} className="border-b border-gray-700 last:border-0 hover:bg-gray-700/20">
                                        <td className="p-3 border-r border-gray-700 align-top text-white font-medium">{group.responsibility}</td>
                                        <td className="p-3 border-r border-gray-700 align-top text-gray-300">{group.organization}</td>
                                        <td className="p-0 align-top">
                                            {group.representatives.map((rep, rIdx) => (
                                                <div key={rIdx} className={`p-3 flex justify-between ${rIdx !== group.representatives.length - 1 ? 'border-b border-gray-700' : ''}`}>
                                                    <span className="text-gray-300">{rep.name}</span>
                                                    <span className="text-gray-500 text-xs uppercase tracking-wider">{rep.designation}</span>
                                                </div>
                                            ))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Legend */}
                    <div className="bg-gray-800 border border-gray-700 p-2 text-center text-xs font-mono text-gray-400 rounded">
                        F= Fresh | A = Active | P = Pending | C = Complete / Closed
                    </div>

                    {/* Points Table */}
                    <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-md overflow-hidden">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="bg-gray-900/40 text-gray-400">
                                    <th className="p-3 border-r border-b border-gray-700 w-16 text-center">Sl No.</th>
                                    <th className="p-3 border-r border-b border-gray-700">Description</th>
                                    <th className="p-3 border-r border-b border-gray-700 w-16 text-center">S</th>
                                    <th className="p-3 border-r border-b border-gray-700 w-24">Date</th>
                                    <th className="p-3 border-b border-gray-700 w-32 text-center">Action By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {meetingDetails.points.map((point, idx) => (
                                    <tr key={idx} className="border-b border-gray-700 last:border-0 hover:bg-gray-700/20">
                                        <td className="p-3 border-r border-gray-700 text-center font-mono text-gray-500">{point.sl}</td>
                                        <td className="p-3 border-r border-gray-700 text-gray-300">{point.description}</td>
                                        <td className="p-3 border-r border-gray-700 text-center font-bold text-white">{point.status}</td>
                                        <td className="p-3 border-r border-gray-700 text-gray-400">{point.date}</td>
                                        <td className="p-3 text-center text-blue-400 font-medium">{point.actionBy}</td>
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

export default MinutesDetails;
