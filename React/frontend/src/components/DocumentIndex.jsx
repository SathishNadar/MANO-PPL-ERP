import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const DocumentIndex = () => {
    const [expandedSections, setExpandedSections] = useState(() => {
        const saved = sessionStorage.getItem('documentIndexExpanded');
        return saved ? JSON.parse(saved) : {};
    });
    const navigate = useNavigate();
    const { projectId } = useParams();

    const toggleSection = (index) => {
        setExpandedSections((prev) => {
            const newState = {
                ...prev,
                [index]: !prev[index],
            };
            sessionStorage.setItem('documentIndexExpanded', JSON.stringify(newState));
            return newState;
        });
    };

    const handleItemClick = (item) => {
        if (item === "Project Directory") {
            navigate(`/dashboard/project-description/${projectId}/project-directory`);
        } else if (item === "Project Vendor List") {
            navigate(`/dashboard/project-description/${projectId}/project-vendor-list`);
        } else if (item === "MANO's Staff Role & Responsibilties") {
            navigate(`/dashboard/project-description/${projectId}/staff-roles`);
        } else if (item === "Agenda of Meeting") {
            navigate('/dashboard/agenda');
        } else if (item === "Minutes of Meeting") {
            navigate('/dashboard/minutes');
        } else if (item === "Events / Hindrance Report") {
            navigate(`/dashboard/project-description/${projectId}/hindrance-report`);
            navigate(`/dashboard/project-description/${projectId}/hindrance-report`);
        } else if (item === "Project Report / Summary") {
            navigate('/dashboard/project-summary');
        } else if (item === "Organisation Chart") {
            navigate('/dashboard/organisation-chart');
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
                "Project Report",
                "Organisation Chart",
                "Agenda of Meeting",
                "Minutes of Meeting",
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
                "Material Histogram",
                "Events / Hindrance Report"
            ]
        },
        {
            title: "CONTRACTS MANAGEMENT",
            items: [
                "Quantity Survey",
                "Budget",
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
                "Site Progress Pictures (1st & 15th of every month)"
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
                                    {section.items.map((item, itemIndex) => {
                                        if (item === "Budget") {
                                            return (
                                                <div
                                                    key={itemIndex}
                                                    className="p-3 bg-gray-700/30 rounded-lg border border-gray-600 hover:border-blue-400 transition-all duration-200"
                                                >
                                                    <div className="flex items-start space-x-3 mb-3">
                                                        <span className="material-icons text-gray-500 text-xl">
                                                            monetization_on
                                                        </span>
                                                        <div className="flex-1">
                                                            <h4 className="text-sm font-medium text-gray-200 transition-colors">
                                                                {item}
                                                            </h4>
                                                        </div>
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/dashboard/project-description/${projectId}/budgetUpdate`);
                                                            }}
                                                            className="flex-1 flex items-center justify-center space-x-1 bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-400 py-1.5 rounded transition-colors text-xs font-medium"
                                                        >
                                                            <span className="material-icons text-sm">edit</span>
                                                            <span>Edit</span>
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/dashboard/project-description/${projectId}/budgetView`);
                                                            }}
                                                            className="flex-1 flex items-center justify-center space-x-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 py-1.5 rounded transition-colors text-xs font-medium"
                                                        >
                                                            <span className="material-icons text-sm">visibility</span>
                                                            <span>View</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        if (item === "Daily Progress report") {
                                            return (
                                                <div
                                                    key={itemIndex}
                                                    className="p-3 bg-gray-700/30 rounded-lg border border-gray-600 hover:border-blue-400 transition-all duration-200"
                                                >
                                                    <div className="flex items-start space-x-3 mb-3">
                                                        <span className="material-icons text-gray-500 text-xl">
                                                            description
                                                        </span>
                                                        <div className="flex-1">
                                                            <h4 className="text-sm font-medium text-gray-200 transition-colors">
                                                                {item}
                                                            </h4>
                                                        </div>
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/dashboard/project-description/${projectId}/dprCreate`);
                                                            }}
                                                            className="flex-1 flex items-center justify-center space-x-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 py-1.5 rounded transition-colors text-xs font-medium"
                                                        >
                                                            <span className="material-icons text-sm">edit</span>
                                                            <span>Create</span>
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/dashboard/project-description/${projectId}/dpr-list`);
                                                            }}
                                                            className="flex-1 flex items-center justify-center space-x-1 bg-gray-600/20 hover:bg-gray-600/40 text-gray-300 py-1.5 rounded transition-colors text-xs font-medium"
                                                        >
                                                            <span className="material-icons text-sm">visibility</span>
                                                            <span>View</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        if (item === "Weekly Progress report (Sun-Sat closing & report on Monday)") {
                                            return (
                                                <div
                                                    key={itemIndex}
                                                    className="p-3 bg-gray-700/30 rounded-lg border border-gray-600 hover:border-blue-400 transition-all duration-200"
                                                >
                                                    <div className="flex items-start space-x-3 mb-3">
                                                        <span className="material-icons text-gray-500 text-xl">
                                                            description
                                                        </span>
                                                        <div className="flex-1">
                                                            <h4 className="text-sm font-medium text-gray-200 transition-colors">
                                                                {item}
                                                            </h4>
                                                        </div>
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // navigate(`/dashboard/project-description/${projectId}/wprCreate`);
                                                            }}
                                                            className="flex-1 flex items-center justify-center space-x-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 py-1.5 rounded transition-colors text-xs font-medium"
                                                        >
                                                            <span className="material-icons text-sm">edit</span>
                                                            <span>Create</span>
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // navigate(`/dashboard/project-description/${projectId}/wpr-list`);
                                                            }}
                                                            className="flex-1 flex items-center justify-center space-x-1 bg-gray-600/20 hover:bg-gray-600/40 text-gray-300 py-1.5 rounded transition-colors text-xs font-medium"
                                                        >
                                                            <span className="material-icons text-sm">visibility</span>
                                                            <span>View</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        if (item === "Monthly Progress report (1st of every month)") {
                                            return (
                                                <div
                                                    key={itemIndex}
                                                    className="p-3 bg-gray-700/30 rounded-lg border border-gray-600 hover:border-blue-400 transition-all duration-200"
                                                >
                                                    <div className="flex items-start space-x-3 mb-3">
                                                        <span className="material-icons text-gray-500 text-xl">
                                                            description
                                                        </span>
                                                        <div className="flex-1">
                                                            <h4 className="text-sm font-medium text-gray-200 transition-colors">
                                                                {item}
                                                            </h4>
                                                        </div>
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // navigate(`/dashboard/project-description/${projectId}/mprCreate`);
                                                            }}
                                                            className="flex-1 flex items-center justify-center space-x-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 py-1.5 rounded transition-colors text-xs font-medium"
                                                        >
                                                            <span className="material-icons text-sm">edit</span>
                                                            <span>Create</span>
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // navigate(`/dashboard/project-description/${projectId}/mpr-list`);
                                                            }}
                                                            className="flex-1 flex items-center justify-center space-x-1 bg-gray-600/20 hover:bg-gray-600/40 text-gray-300 py-1.5 rounded transition-colors text-xs font-medium"
                                                        >
                                                            <span className="material-icons text-sm">visibility</span>
                                                            <span>View</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return (
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
                                        );
                                    })}
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