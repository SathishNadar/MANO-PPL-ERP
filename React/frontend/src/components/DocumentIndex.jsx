import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DocumentIndex = () => {
    const [expandedSections, setExpandedSections] = useState({});
    const navigate = useNavigate();

    const toggleSection = (index) => {
        setExpandedSections((prev) => ({
            ...prev,
            [index]: !prev[index],
        }));
    };

    const handleItemClick = (item) => {
        if (item === "Project Directory") {
            navigate('/dashboard/project-directory');
        }
        // Add other document navigations here as needed
    };

    const documentData = [
        {
            title: "GENERAL DOCUMENTS",
            items: [
                "Project Directory",
                "Project Vendor List",
                "MANO's Staff Role & Responsibilties",
                "Project Report / Summary",
                "Organisation Chart",
                "Agenda & Minutes of Meeting",
            ]
        },
        {
            title: "DRAWINGS",
            items: [
                "Drawing Management"
            ]
        },
        {
            title: "PLANNING",
            items: [
                "Drawing Planned vs Achieved",
                "Project Planning & Bar Chart",
                "Logistic Plan",
                "Manpower Histogram",
                "Material Histogram"
            ]
        },
        {
            title: "CONTRACTS MANAGEMENT",
            items: [
                "Quantity Survey",
                "Budget & Cash Flow Chart",
                "Quotation",
                "Tender",
                "Work Order & Purchase Order"
            ]
        },
        {
            title: "QUALITY",
            items: [
                "Methodology",
                "QA/QC Matrix",
                "QA/QC assurance plan",
                "Quality Control lab setup",
                "Checklist & Snaglist"
            ]
        },
        {
            title: "SAFETY",
            items: [
                "EHS Plan, Safety Guideline & Documents"
            ]
        },
        {
            title: "BILLING",
            items: [
                "Invoice - Materials",
                "Invoice - Contractors",
                "Certified Bills Copy",
                "List of Certified Bills (Monthly)"
            ]
        },
        {
            title: "PROGRESS REPORTS",
            items: [
                "Daily Progress report",
                "Weekly Progress report (Sun-Sat closing & report on Monday)",
                "Monthly Progress report (1st of every month)",
                "Site Progress Pictures (1st & 15th of every month)",
                "Events / Hindrance Report"
            ]
        },
        {
            title: "MATERIAL MANAGEMENT",
            items: [
                "Steel",
                "Cement",
                "Bulk Materials",
                "Reconciliation (1st of every month)",
                "Store / Material management",
                "Reinf Steel Rolling Margin"
            ]
        }
    ];

    return (
        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-transform duration-300 p-6">
            <h3 className="text-2xl font-bold text-blue-400 mb-2">
                Document Index
            </h3>
            <p className="text-[var(--text-secondary)] mb-6">
                Browse and manage project documents and reports.
            </p>

            <div className="space-y-3">
                {documentData.map((section, index) => (
                    <div
                        key={index}
                        className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden"
                    >
                        <button
                            onClick={() => toggleSection(index)}
                            className="w-full p-4 flex items-center justify-between cursor-pointer hover:border-blue-500 transition-all duration-200 group"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                                    {index + 1}
                                </div>
                                <span className="text-white font-semibold text-sm uppercase">
                                    {section.title}
                                </span>
                            </div>
                            <span
                                className={`material-icons text-[var(--text-secondary)] group-hover:text-white transition-all duration-200 ${expandedSections[index] ? 'rotate-180' : ''
                                    }`}
                            >
                                expand_more
                            </span>
                        </button>

                        {expandedSections[index] && (
                            <div className="px-4 pb-4 bg-gray-900/50 border-t border-gray-700/50">
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {section.items.map((item, itemIndex) => (
                                        <div
                                            key={itemIndex}
                                            onClick={() => handleItemClick(item)}
                                            className="group relative p-3 bg-gray-700/30 rounded-lg border border-gray-600 hover:border-blue-400 transition-all duration-200 cursor-pointer"
                                        >
                                            <div className="flex items-start space-x-3">
                                                <span className="material-icons text-gray-500 group-hover:text-blue-400 transition-colors text-xl">
                                                    description
                                                </span>
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                                                        {item}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 mt-1 group-hover:text-gray-400 transition-colors">
                                                        Click to view
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DocumentIndex;
