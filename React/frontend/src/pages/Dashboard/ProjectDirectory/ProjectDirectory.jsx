import React from "react";
import Sidebar from "../../SidebarComponent/sidebar";

const ProjectDirectory = () => {
    // Mock data based on the user's image
    const contacts = [
        {
            id: 1,
            company: "Spark Electricals",
            natureOfJob: "Wiring & Fixtures",
            name: "Rajesh Kumar",
            designation: "Lead Electrician",
            responsibilities: "Site Execution",
            mobile: "9876543210",
            email: "rajesh.k@spark.co",
            address: "123 Indu Area, Mumbai",
        },
        {
            id: 2,
            company: "PowerGrid Solutions",
            natureOfJob: "Panel Installation",
            name: "Sunita Sharma",
            designation: "Project Manager",
            responsibilities: "Coordination",
            mobile: "9876543211",
            email: "sunita.s@powergrid.com",
            address: "456 Tech Park, Bangalore",
        },
        {
            id: 3,
            company: "AquaFlow Pipes",
            natureOfJob: "Piping & Drainage",
            name: "Amit Singh",
            designation: "Senior Plumber",
            responsibilities: "Installation Lead",
            mobile: "9876543212",
            email: "amit.singh@aquaflow.in",
            address: "789 Garden Nagar, Delhi",
        },
        {
            id: 4,
            company: "BuildWell Concrete",
            natureOfJob: "Concrete Supply",
            name: "Priya Mehta",
            designation: "Sales Head",
            responsibilities: "Supply Management",
            mobile: "9876543213",
            email: "priya.m@buildwell.net",
            address: "101 Construction Hub, Pune",
        },
        {
            id: 5,
            company: "Evergreen Landscaping",
            natureOfJob: "Landscaping",
            name: "Manoj Verma",
            designation: "Owner",
            responsibilities: "Overall Supervision",
            mobile: "9876543214",
            email: "manoj.v@evergreen.com",
            address: "21 Green Valley, Hyderabad",
        },
        {
            id: 6,
            company: "CoolBreeze AC",
            natureOfJob: "AC",
            name: "Deepak",
            designation: "HVAC",
            responsibilities: "System Design",
            mobile: "9876543215",
            email: "deepak.r@coolbreeze.in",
            address: "345 Tech Avenue",
        },
    ];

    return (
        <div className="flex h-screen bg-background">
            <Sidebar />
            <main className="flex-1 p-8 bg-gray-900 overflow-y-auto">
                <header className="mb-8">
                    <h1 className="text-4xl font-bold text-[var(--text-primary)]">
                        Project Contact List
                    </h1>
                    <p className="text-[var(--text-secondary)]">
                        A continuous list of all project-related vendors and contacts.
                    </p>
                </header>

                <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-900/50 border-b border-gray-700 text-xs uppercase text-gray-400 font-semibold tracking-wider">
                                    <th className="p-4 text-center w-16">Sr No</th>
                                    <th className="p-4">Company</th>
                                    <th className="p-4">Nature of the Job</th>
                                    <th className="p-4">Name of the Person</th>
                                    <th className="p-4">Designation</th>
                                    <th className="p-4">Responsibilities</th>
                                    <th className="p-4">Mobile No</th>
                                    <th className="p-4">Email ID</th>
                                    <th className="p-4">Address</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {contacts.map((contact, index) => (
                                    <tr
                                        key={contact.id}
                                        className="hover:bg-gray-700/30 transition-colors duration-150 text-sm text-gray-300"
                                    >
                                        <td className="p-4 text-center text-gray-500 font-medium">
                                            {index + 1}
                                        </td>
                                        <td className="p-4 font-medium text-white">
                                            {contact.company}
                                        </td>
                                        <td className="p-4">{contact.natureOfJob}</td>
                                        <td className="p-4 text-white">{contact.name}</td>
                                        <td className="p-4">{contact.designation}</td>
                                        <td className="p-4">{contact.responsibilities}</td>
                                        <td className="p-4 font-mono text-gray-400">
                                            {contact.mobile}
                                        </td>
                                        <td className="p-4 text-blue-400 hover:text-blue-300 transition-colors">
                                            <a href={`mailto:${contact.email}`}>{contact.email}</a>
                                        </td>
                                        <td className="p-4 max-w-xs truncate" title={contact.address}>
                                            {contact.address}
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

export default ProjectDirectory;
