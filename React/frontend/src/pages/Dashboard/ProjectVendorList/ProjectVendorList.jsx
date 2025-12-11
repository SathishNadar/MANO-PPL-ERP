import React from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../SidebarComponent/sidebar";

const ProjectVendorList = () => {
    const navigate = useNavigate();
    // Mock data - 10 dummy records
    const vendors = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `Vendor Agency ${i + 1}`,
        natureOfJob: i % 2 === 0 ? "Electrical Works" : "Plumbing & Sanitary",
        contactPerson: `Contact Person ${i + 1}`,
        telephone: `022-2456${1000 + i}`,
        mobile: `98765${43210 + i}`,
        email: `vendor${i + 1}@example.com`,
        address: `${100 + i}, Industrial Estate, City - ${400001 + i}`,
        website: `www.vendor${i + 1}.com`,
        reference: `Ref-${202500 + i}`,
    }));

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
                        Project Vendor List
                    </h1>
                    <p className="text-[var(--text-secondary)]">
                        List of all vendors and agencies associated with the project.
                    </p>
                </header>

                <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-900/50 border-b border-gray-700 text-xs uppercase text-gray-400 font-semibold tracking-wider">
                                    <th className="p-4 text-center w-16">Sr No</th>
                                    <th className="p-4">Name of the Vendor/Agency</th>
                                    <th className="p-4">Nature of the Jobs Carried Out</th>
                                    <th className="p-4">Contact Person</th>
                                    <th className="p-4">Telephone No.</th>
                                    <th className="p-4">Mobile No.</th>
                                    <th className="p-4">Email ID</th>
                                    <th className="p-4">Address</th>
                                    <th className="p-4">Website</th>
                                    <th className="p-4">Reference</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {vendors.map((vendor, index) => (
                                    <tr
                                        key={vendor.id}
                                        className="hover:bg-gray-700/30 transition-colors duration-150 text-sm text-gray-300"
                                    >
                                        <td className="p-4 text-center text-gray-500 font-medium">
                                            {index + 1}
                                        </td>
                                        <td className="p-4 font-medium text-white">
                                            {vendor.name}
                                        </td>
                                        <td className="p-4">{vendor.natureOfJob}</td>
                                        <td className="p-4 text-white">{vendor.contactPerson}</td>
                                        <td className="p-4 font-mono text-gray-400">
                                            {vendor.telephone}
                                        </td>
                                        <td className="p-4 font-mono text-gray-400">
                                            {vendor.mobile}
                                        </td>
                                        <td className="p-4 text-blue-400 hover:text-blue-300 transition-colors">
                                            <a href={`mailto:${vendor.email}`}>{vendor.email}</a>
                                        </td>
                                        <td className="p-4 max-w-xs truncate" title={vendor.address}>
                                            {vendor.address}
                                        </td>
                                        <td className="p-4 text-blue-400 hover:text-blue-300 transition-colors">
                                            <a
                                                href={`https://${vendor.website}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {vendor.website}
                                            </a>
                                        </td>
                                        <td className="p-4">{vendor.reference}</td>
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

export default ProjectVendorList;
