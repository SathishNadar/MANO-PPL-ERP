import React from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../SidebarComponent/sidebar";

const HindranceReport = () => {
    const navigate = useNavigate();

    // Mock data based on the provided image
    const reportData = [
        {
            sNo: 1,
            description: "Mobilisation of Excavator",
            planned: { start: "04-10-2022", finish: "04-10-2022", day: 1 },
            actual: { start: "04-Oct-22", finish: "21-10-2022", day: 18 },
            delayStart: 0,
            respStart: "Vira Buildtech",
            delayFinish: 13,
            respFinish: "Vira Buildtech",
            remarks: "Personal Reason"
        },
        {
            sNo: 2,
            description: "Excavation work",
            planned: { start: "04-Oct-22", finish: "25-Nov-22", day: 53 },
            actual: { start: "05-Nov-22", finish: "21-Jan-23", day: 78 },
            delayStart: 32,
            respStart: "Geotech consultant",
            delayFinish: 57,
            respFinish: "Geotech consultant",
            remarks: "Decision pending from geotech consultant, he is not responding properly"
        },
        {
            sNo: 3,
            description: "Eccentricity report",
            planned: { start: "", finish: "", day: "" },
            actual: { start: "05-Oct-22", finish: "10-Nov-22", day: 37 },
            delayStart: "",
            respStart: "Vira Buildtech",
            delayFinish: "",
            respFinish: "Vira Buildtech",
            remarks: "Work laziness"
        },
        {
            sNo: 4,
            description: "Borewell CF4",
            planned: { start: "", finish: "", day: "" },
            actual: { start: "13-Nov-22", finish: "17-Nov-22", day: 5 },
            delayStart: "",
            respStart: "Epicoins",
            delayFinish: "",
            respFinish: "Epicons",
            remarks: "Borewell regarding decision pending"
        },
        {
            sNo: 5,
            description: "P77 PILE",
            planned: { start: "", finish: "", day: "" },
            actual: { start: "05-Oct-22", finish: "03-Dec-22", day: 60 },
            delayStart: "",
            respStart: "Client & consultants",
            delayFinish: "",
            respFinish: "Client & consultants",
            remarks: "No one was making the right decision"
        }
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
                        Hindrance Report
                    </h1>
                    <p className="text-[var(--text-secondary)]">
                        Tracking project hindrances and delays.
                    </p>
                </header>

                <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse border border-gray-600">
                            <thead>
                                {/* Main Header Row */}
                                <tr className="bg-gray-900/50 text-xs uppercase text-gray-400 font-semibold tracking-wider text-center">
                                    <th rowSpan="2" className="p-2 border border-gray-600 w-12">S. No.</th>
                                    <th rowSpan="2" className="p-2 border border-gray-600 w-64">Description of Items</th>
                                    <th colSpan="3" className="p-2 border border-gray-600 bg-gray-900/40">Planned Dates</th>
                                    <th colSpan="3" className="p-2 border border-gray-600 bg-gray-900/40">Actual Dates</th>
                                    <th rowSpan="2" className="p-2 border border-gray-600 w-24">No. Of Days Delayed TO START</th>
                                    <th rowSpan="2" className="p-2 border border-gray-600 w-32">Responsible</th>
                                    <th rowSpan="2" className="p-2 border border-gray-600 w-24">No. Of Days Delayed TO FINISH</th>
                                    <th rowSpan="2" className="p-2 border border-gray-600 w-32">Responsible</th>
                                    <th rowSpan="2" className="p-2 border border-gray-600 w-64">Remarks</th>
                                </tr>
                                {/* Sub Header Row */}
                                <tr className="bg-gray-900/50 text-xs uppercase text-gray-400 font-semibold tracking-wider text-center">
                                    <th className="p-2 border border-gray-600 w-24">Start</th>
                                    <th className="p-2 border border-gray-600 w-24">Finish</th>
                                    <th className="p-2 border border-gray-600 w-16">Day</th>
                                    <th className="p-2 border border-gray-600 w-24">Start</th>
                                    <th className="p-2 border border-gray-600 w-24">Finish</th>
                                    <th className="p-2 border border-gray-600 w-16">Day</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700 text-gray-300 text-sm">
                                {reportData.map((item, index) => (
                                    <tr key={item.sNo} className="hover:bg-gray-700/30 transition-colors duration-150">
                                        <td className="p-2 text-center border border-gray-600 font-medium text-gray-400">{item.sNo}</td>
                                        <td className="p-2 border border-gray-600 text-white font-medium">{item.description}</td>

                                        {/* Planned Dates */}
                                        <td className="p-2 border border-gray-600 text-center font-mono text-gray-400">{item.planned.start || ""}</td>
                                        <td className="p-2 border border-gray-600 text-center font-mono text-gray-400">{item.planned.finish || ""}</td>
                                        <td className="p-2 border border-gray-600 text-center">{item.planned.day}</td>

                                        {/* Actual Dates */}
                                        <td className="p-2 border border-gray-600 text-center font-mono text-gray-400">{item.actual.start}</td>
                                        <td className="p-2 border border-gray-600 text-center font-mono text-gray-400">{item.actual.finish}</td>
                                        <td className="p-2 border border-gray-600 text-center">{item.actual.day}</td>

                                        {/* Delays & Resp */}
                                        <td className="p-2 border border-gray-600 text-center font-medium text-red-400">{item.delayStart}</td>
                                        <td className="p-2 border border-gray-600 text-center">{item.respStart}</td>
                                        <td className="p-2 border border-gray-600 text-center font-medium text-red-400">{item.delayFinish}</td>
                                        <td className="p-2 border border-gray-600 text-center">{item.respFinish}</td>
                                        <td className="p-2 border border-gray-600">{item.remarks}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 bg-gray-800 text-gray-400 text-sm border-t border-gray-700">
                        <div className="flex justify-between items-center">
                            <span>Total Project Delay: </span>
                            <span className="font-bold text-white mr-8"> - </span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default HindranceReport;
