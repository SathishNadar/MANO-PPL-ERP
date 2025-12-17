import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../SidebarComponent/sidebar";
import { toast } from "react-toastify";

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:5001';

const ProjectVendorList = () => {
    const navigate = useNavigate();
    const { projectId } = useParams();

    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    // Add Vendor State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [masterVendors, setMasterVendors] = useState([]);
    const [selectedVendorId, setSelectedVendorId] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [adding, setAdding] = useState(false);

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    // Refs for scrolling
    const listRef = React.useRef(null);
    const itemRefs = React.useRef([]);

    // Scroll highlighted item into view
    useEffect(() => {
        if (highlightedIndex >= 0 && itemRefs.current[highlightedIndex] && listRef.current) {
            const list = listRef.current;
            const item = itemRefs.current[highlightedIndex];

            const itemTop = item.offsetTop;
            const itemBottom = item.offsetTop + item.offsetHeight;
            const listTop = list.scrollTop;
            const listBottom = list.scrollTop + list.offsetHeight;

            if (itemTop < listTop) {
                list.scrollTop = itemTop;
            } else if (itemBottom > listBottom) {
                list.scrollTop = itemBottom - list.offsetHeight;
            }
        }
    }, [highlightedIndex]);

    // Fetch Project Vendors
    const fetchProjectVendors = async () => {
        if (!projectId) return;
        try {
            // Add cache busting
            const response = await fetch(`${API_BASE}/projectVendors/${projectId}?_t=${new Date().getTime()}`, {
                credentials: 'include'
            });
            const data = await response.json();
            if (response.ok) {
                const vendorList = Array.isArray(data.vendors) ? data.vendors : (Array.isArray(data) ? data : []);
                setVendors(vendorList);
            } else {
                toast.error(data.message || "Failed to fetch project vendors");
            }
        } catch (error) {
            console.error("Error fetching vendors:", error);
            toast.error("Error fetching vendors");
        } finally {
            setLoading(false);
        }
    };

    // Fetch Master Vendors (for dropdown)
    const fetchMasterVendors = async () => {
        try {
            const response = await fetch(`${API_BASE}/vendor_api/vendors-jobnature`, {
                credentials: 'include'
            });
            const data = await response.json();
            if (response.ok) {
                const vendorList = Array.isArray(data) ? data : (Array.isArray(data.vendors) ? data.vendors : []);
                setMasterVendors(vendorList);
            } else {
                toast.error("Failed to fetch master vendor list");
            }
        } catch (error) {
            console.error("Error fetching master vendors:", error);
        }
    };

    useEffect(() => {
        if (projectId) {
            fetchProjectVendors();
        } else {
            // handle missing project id if needed, or just don't fetch
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        if (isAddModalOpen) {
            setSearchTerm(""); // Reset search
            if (masterVendors.length === 0) {
                fetchMasterVendors();
            }
        }
    }, [isAddModalOpen]);

    // Handle Add Vendor
    const handleAddVendor = async () => {
        if (!selectedVendorId) {
            toast.warning("Please select a vendor");
            return;
        }

        setAdding(true);
        try {
            const response = await fetch(`${API_BASE}/projectVendors/add/${projectId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ vendors: [parseInt(selectedVendorId)] }),
                credentials: 'include'
            });

            const data = await response.json();
            if (response.ok) {
                toast.success("Vendor added successfully");

                // Optimistic UI Update
                const addedVendor = masterVendors.find(v => v.id === parseInt(selectedVendorId));
                if (addedVendor) {
                    setVendors(prev => [...prev, { ...addedVendor, pv_id: data.pv_ids?.[0] || Date.now() }]);
                }

                setIsAddModalOpen(false);
                setSelectedVendorId("");
                setSearchTerm(""); // Clear search on success

                // Background refresh with delay to ensure backend consistency
                setTimeout(() => {
                    fetchProjectVendors();
                }, 500);
            } else {
                toast.error(data.message || "Failed to add vendor");
            }
        } catch (error) {
            console.error("Error adding vendor:", error);
            toast.error("Error adding vendor");
        } finally {
            setAdding(false);
        }
    };

    // Handle Delete Vendor - Trigger Modal
    const handleDeleteVendor = (pvId) => {
        setDeleteId(pvId);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;

        try {
            const response = await fetch(`${API_BASE}/projectVendors/delete`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ pv_ids: [deleteId] }),
                credentials: 'include'
            });

            const data = await response.json();
            if (response.ok) {
                toast.success("Vendor removed successfully");
                fetchProjectVendors();
            } else {
                toast.error(data.message || "Failed to remove vendor");
            }
        } catch (error) {
            console.error("Error removing vendor:", error);
            toast.error("Error removing vendor");
        } finally {
            setShowDeleteModal(false);
            setDeleteId(null);
        }
    };

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
                            Project Vendor List
                        </h1>
                        <p className="text-[var(--text-secondary)]">
                            List of all vendors and agencies associated with the project.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className={`font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200 flex items-center gap-2 ${isEditing
                                ? 'bg-green-600 hover:bg-green-500 text-white'
                                : 'bg-gray-700 hover:bg-gray-600 text-white'
                                }`}
                        >
                            <span className="material-icons">{isEditing ? 'check' : 'edit'}</span>
                            {isEditing ? 'Done' : 'Edit'}
                        </button>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200 flex items-center gap-2"
                        >
                            <span className="material-icons">add</span>
                            Add Project Vendor
                        </button>
                    </div>
                </header>

                <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-900/50 border-b border-gray-700 text-xs uppercase text-gray-400 font-semibold tracking-wider">
                                    <th className="p-4 text-center w-16 border-r border-gray-700">Sr No</th>
                                    <th className="p-4 border-r border-gray-700">Name of the Vendor/Agency</th>
                                    <th className="p-4 border-r border-gray-700">Nature of the Jobs Carried Out</th>
                                    <th className="p-4 border-r border-gray-700">Contact Person</th>
                                    <th className="p-4 border-r border-gray-700">Telephone No.</th>
                                    <th className="p-4 border-r border-gray-700">Mobile No.</th>
                                    <th className="p-4 border-r border-gray-700">Email ID</th>
                                    <th className="p-4 border-r border-gray-700">Address</th>
                                    <th className={`p-4 ${isEditing ? 'border-r border-gray-700' : ''}`}>Website</th>
                                    {isEditing && (
                                        <th className="p-4 text-center w-24">Action</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan={isEditing ? 10 : 9} className="p-8 text-center text-gray-400">Loading vendors...</td>
                                    </tr>
                                ) : vendors.length === 0 ? (
                                    <tr>
                                        <td colSpan={isEditing ? 10 : 9} className="p-8 text-center text-gray-400">No vendors found for this project.</td>
                                    </tr>
                                ) : (
                                    vendors.map((vendor, index) => (
                                        <tr
                                            key={vendor.pv_id || vendor.id}
                                            className="hover:bg-gray-700/30 transition-colors duration-150 text-sm text-gray-300 border-b border-gray-700 last:border-0"
                                        >
                                            <td className="p-4 text-center text-gray-500 font-medium border-r border-gray-700">
                                                {index + 1}
                                            </td>
                                            <td className="p-4 font-medium text-white border-r border-gray-700">
                                                {vendor.company_name || vendor.name}
                                            </td>
                                            <td className="p-4 border-r border-gray-700">{vendor.job_nature || vendor.natureOfJob}</td>
                                            <td className="p-4 text-white border-r border-gray-700">{vendor.contact_person || vendor.contactPerson}</td>
                                            <td className="p-4 font-mono text-gray-400 border-r border-gray-700">
                                                {vendor.telephone_no || vendor.telephone || '-'}
                                            </td>
                                            <td className="p-4 font-mono text-gray-400 border-r border-gray-700">
                                                {vendor.mobile_no || vendor.mobile}
                                            </td>
                                            <td className="p-4 text-blue-400 hover:text-blue-300 transition-colors border-r border-gray-700">
                                                <a href={`mailto:${vendor.email_id || vendor.email}`}>{vendor.email_id || vendor.email}</a>
                                            </td>
                                            <td className="p-4 max-w-xs truncate border-r border-gray-700" title={vendor.address}>
                                                {vendor.address}
                                            </td>
                                            <td className={`p-4 text-blue-400 hover:text-blue-300 transition-colors ${isEditing ? 'border-r border-gray-700' : ''}`}>
                                                <a
                                                    href={vendor.website ? (vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`) : '#'}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    {vendor.website || '-'}
                                                </a>
                                            </td>
                                            {isEditing && (
                                                <td className="p-4 text-center">
                                                    <button
                                                        onClick={() => handleDeleteVendor(vendor.pv_id || vendor.id)}
                                                        className="text-red-500 hover:text-red-400 transition-colors"
                                                        title="Remove from Project"
                                                    >
                                                        <span className="material-icons">delete</span>
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Add Vendor Modal */}
                {isAddModalOpen && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-md p-6">
                            <h2 className="text-xl font-bold text-white mb-4">Add Vendor to Project</h2>

                            <div className="mb-6">
                                <label className="block text-gray-400 text-sm font-semibold mb-2">Select Vendor</label>
                                <input
                                    type="text"
                                    placeholder="Search vendors"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setHighlightedIndex(0); // Reset highlight on search
                                    }}
                                    onKeyDown={(e) => {
                                        const filtered = masterVendors.filter(v =>
                                            v.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            v.job_nature.toLowerCase().includes(searchTerm.toLowerCase())
                                        );
                                        const filteredCount = filtered.length;

                                        if (e.key === 'ArrowDown') {
                                            e.preventDefault();
                                            setHighlightedIndex(prev => (prev + 1) % filteredCount);
                                        } else if (e.key === 'ArrowUp') {
                                            e.preventDefault();
                                            setHighlightedIndex(prev => (prev - 1 + filteredCount) % filteredCount);
                                        } else if (e.key === 'Enter') {
                                            e.preventDefault();
                                            if (filtered[highlightedIndex]) {
                                                setSelectedVendorId(filtered[highlightedIndex].id);
                                            }
                                        }
                                    }}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 mb-2"
                                />
                                <div
                                    ref={listRef}
                                    className="max-h-60 overflow-y-auto border border-gray-600 rounded-lg bg-gray-750 custom-scrollbar"
                                >
                                    {masterVendors.filter(v =>
                                        v.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        v.job_nature.toLowerCase().includes(searchTerm.toLowerCase())
                                    ).length > 0 ? (
                                        masterVendors.filter(v =>
                                            v.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            v.job_nature.toLowerCase().includes(searchTerm.toLowerCase())
                                        ).map((v, idx) => (
                                            <div
                                                key={v.id}
                                                ref={el => itemRefs.current[idx] = el}
                                                onClick={() => {
                                                    setSelectedVendorId(v.id);
                                                    setHighlightedIndex(idx);
                                                }}
                                                className={`px-4 py-3 cursor-pointer transition-colors border-b border-gray-700 last:border-0 flex justify-between items-center ${highlightedIndex === idx
                                                    ? 'bg-blue-600/30 border-l-4 border-l-blue-500'
                                                    : 'hover:bg-gray-700'
                                                    }`}
                                            >
                                                <div>
                                                    <div className="font-semibold text-white text-sm">{v.company_name}</div>
                                                    <div className="text-xs text-gray-400">{v.job_nature}</div>
                                                </div>
                                                {selectedVendorId === v.id && (
                                                    <span className="material-icons text-blue-400 text-sm">check_circle</span>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-gray-500 text-sm italic">
                                            No matching vendors found.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddVendor}
                                    disabled={adding || !selectedVendorId}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {adding ? "Adding..." : "Add Vendor"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 max-w-sm w-full p-6 animate-fade-in-up">
                        <div className="flex items-center gap-3 mb-4 text-red-400">
                            <span className="material-icons text-3xl">warning</span>
                            <h3 className="text-xl font-bold text-white">Confirm Deletion</h3>
                        </div>
                        <p className="text-gray-300 mb-6">
                            Are you sure you want to remove this vendor from the project? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium shadow-lg transition-colors flex items-center gap-2"
                            >
                                <span className="material-icons text-sm">delete</span>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectVendorList;
