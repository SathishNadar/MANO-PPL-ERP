import React from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../SidebarComponent/sidebar";

const StaffRoles = () => {
    const navigate = useNavigate();

    // Data from the provided image
    const staffData = [
        {
            slNo: 1,
            name: "Mugilan Muthaiah",
            designation: "Director",
            responsibilities: [
                "Final decision, approval on WO & PO."
            ],
            mobile: "98677 06633",
            email: "mano@mano.co.in"
        },
        {
            slNo: 3,
            name: "Ms.Shaveena Mathialagan",
            designation: "Project Co-ordinator",
            responsibilities: [
                "1) Co-ordination with site team on daily basis.",
                "2) Scheduling meeting, preparing agenda & MOM.",
                "3) Raising the WO/PO sharing the same to concern staff",
                "4) Documentation at HO."
            ],
            mobile: "9159110884",
            email: "mano@mano.co.in"
        },
        {
            slNo: 2,
            name: "Mr.Manoj Kumar",
            designation: "Project Manager",
            responsibilities: [
                "1) Overall Project Incharge.",
                "2) Execution, Planning, Material & labour management.",
                "3) Confirmation to HO over material/ work specification to be finalised,providing workfront to the contractors on site.",
                "4) Co-ordination with Architects, Consultants, Contractors & every person involved in project.",
                "5) Maintaining monthly progress report (1st of every month)"
            ],
            mobile: "8268268769",
            email: "30juinhotel@mano.co.in"
        },
        {
            slNo: 4,
            name: "Mr. Vinay Kumar",
            designation: "Senior Engineer",
            responsibilities: [
                "Planning-Tracking & Monitoring, Budget & Cost Control, Material Histogram, Labour Histogram, Progress chart",
                "3) Drawing management.",
                "4) Assisting the PM in site execution, Sharing Site pictures every 15 days to HO.",
                "Quality Control, Site Execution,etc.."
            ],
            mobile: "7071885002",
            email: "30juinhotel@mano.co.in"
        },
        {
            slNo: 5,
            name: "Mr. Surya Senthilkumar",
            designation: "Junior Engineer",
            responsibilities: [
                "Documentation & Overall Responsibilities"
            ],
            mobile: "8828043022",
            email: "30juinhotel@mano.co.in"
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
                        MANO's Staff Role & Responsibilities
                    </h1>
                    <p className="text-[var(--text-secondary)]">
                        Roles and responsibilities of the staff members.
                    </p>
                </header>

                <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-900/50 border-b border-gray-700 text-xs uppercase text-gray-400 font-semibold tracking-wider">
                                    <th className="p-4 text-center w-16 border-r border-gray-700">Sl. No.</th>
                                    <th className="p-4 w-1/6 border-r border-gray-700">Name of Person</th>
                                    <th className="p-4 w-1/6 border-r border-gray-700">Designation</th>
                                    <th className="p-4 w-1/3 border-r border-gray-700">Responsibilities</th>
                                    <th className="p-4 w-1/6 border-r border-gray-700">Mobile No</th>
                                    <th className="p-4 w-1/6">Email ID</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700 text-gray-300">
                                {staffData.map((staff, index) => (
                                    <tr key={staff.slNo} className="hover:bg-gray-700/30 transition-colors duration-150">
                                        <td className="p-4 text-center font-medium border-r border-gray-700 bg-gray-900/40 text-gray-400">
                                            {staff.slNo}
                                        </td>
                                        <td className="p-4 font-medium text-white border-r border-gray-700">
                                            {staff.name}
                                        </td>
                                        <td className="p-4 font-medium border-r border-gray-700">
                                            {staff.designation}
                                        </td>
                                        <td className="p-4 border-r border-gray-700">
                                            <ul className="list-none space-y-1">
                                                {staff.responsibilities.map((resp, idx) => (
                                                    <li key={idx} className="text-sm">
                                                        {resp}
                                                    </li>
                                                ))}
                                            </ul>
                                        </td>
                                        <td className="p-4 font-mono text-gray-400 border-r border-gray-700">
                                            {staff.mobile}
                                        </td>
                                        <td className="p-4 text-blue-400 hover:text-blue-300 transition-colors">
                                            <a href={`mailto:${staff.email}`} className="break-all">
                                                {staff.email}
                                            </a>
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

export default StaffRoles;
