import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Sidebar from "../../SidebarComponent/sidebar";

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:5001';

const ProjectSummary = () => {
    const navigate = useNavigate();
    const { projectId } = useParams();

    const [summaryData, setSummaryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    // Add Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newItem, setNewItem] = useState({ title: "", details: "" });
    const [adding, setAdding] = useState(false);

    // Fetch Data
    const fetchSummary = async () => {
        try {
            const response = await fetch(`${API_BASE}/projectSummary/${projectId}`, {
                credentials: 'include'
            });
            const data = await response.json();
            if (response.ok) {
                // Ensure data is an array
                const list = Array.isArray(data) ? data : (data.summary ? data.summary : []);
                setSummaryData(list);
            } else {
                // If it's a 404 or empty, just show empty list, don't necessarily error out loudly if it's just "no data yet"
                setSummaryData([]);
            }
        } catch (error) {
            console.error("Error fetching summary:", error);
            toast.error("Error loading project summary");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (projectId) {
            fetchSummary();
        }
    }, [projectId]);

    // Add Summary Item
    const handleAddItem = async () => {
        if (!projectId) {
            toast.error("Project ID is missing");
            return;
        }
        if (!newItem.title || !newItem.details) {
            toast.warning("Please fill in both Title and Details");
            return;
        }

        setAdding(true);
        try {
            const response = await fetch(`${API_BASE}/projectSummary/add/${projectId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify([{
                    title: newItem.title,
                    details: newItem.details
                }]),
                credentials: 'include'
            });

            const data = await response.json();
            if (response.ok) {
                toast.success("Summary item added");
                setNewItem({ title: "", details: "" });
                setIsAddModalOpen(false);
                fetchSummary();
            } else {
                toast.error(data.message || "Failed to add item");
            }
        } catch (error) {
            console.error("Error adding item:", error);
            toast.error("Error adding item");
        } finally {
            setAdding(false);
        }
    };

    // Update Summary Logic (Save all changes)
    const handleSaveUpdates = async () => {
        // Prepare payload: filter out items that haven't changed? no, just send all is fine or better yet, simple approach:
        // The API expects an array of objects with ids. 
        // We will send the current state of summaryData.

        try {
            const updates = summaryData.map(item => ({
                id: item.id,
                title: item.title,
                details: item.details || item.description // handle both keys if legacy data exists
            }));

            const response = await fetch(`${API_BASE}/projectSummary/update/`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
                credentials: 'include'
            });

            if (response.ok) {
                toast.success("Changes saved successfully");
                setIsEditing(false);
                fetchSummary();
            } else {
                const data = await response.json();
                toast.error(data.message || "Failed to update summary");
            }
        } catch (error) {
            console.error("Error updating summary:", error);
            toast.error("Error saving changes");
        }
    };

    // Handle Inline Edit Change
    const handleInputChange = (index, field, value) => {
        setSummaryData(prev => {
            const newData = [...prev];
            newData[index] = { ...newData[index], [field]: value };
            return newData;
        });
    };

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    if (!projectId) {
        return (
            <div className="flex h-screen bg-background">
                <Sidebar />
                <main className="flex-1 p-8 bg-gray-900 flex flex-col items-center justify-center text-center">
                    <span className="material-icons text-6xl text-gray-500 mb-4">folder_off</span>
                    <h1 className="text-3xl font-bold text-white mb-2">No Project Selected</h1>
                    <p className="text-gray-400 mb-6 max-w-md">
                        This page requires a valid Project ID. Please navigate here from a specific project's dashboard.
                    </p>
                    <button
                        onClick={() => navigate('/dashboard/projects')}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                    >
                        Go to Projects
                    </button>
                </main>
            </div>
        );
    }

    // Trigger Delete Modal
    const handleDeleteItem = (id) => {
        setDeleteId(id);
        setShowDeleteModal(true);
    };

    // Confirm Delete
    const confirmDelete = async () => {
        if (!deleteId) return;

        try {
            const response = await fetch(`${API_BASE}/projectSummary/delete/`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify([deleteId]),
                credentials: 'include'
            });

            if (response.ok) {
                toast.success("Item deleted");
                fetchSummary();
            } else {
                const data = await response.json();
                toast.error(data.message || "Failed to delete item");
            }
        } catch (error) {
            console.error("Error deleting item:", error);
            toast.error("Error deleting item");
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
                            Project Summary
                        </h1>
                        <p className="text-[var(--text-secondary)]">
                            Detailed tabular report of project status and metrics.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                if (isEditing) handleSaveUpdates();
                                else setIsEditing(true);
                            }}
                            className={`font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200 flex items-center gap-2 ${isEditing
                                ? 'bg-green-600 hover:bg-green-500 text-white'
                                : 'bg-gray-700 hover:bg-gray-600 text-white'
                                }`}
                        >
                            <span className="material-icons">{isEditing ? 'save' : 'edit'}</span>
                            {isEditing ? 'Save Changes' : 'Edit'}
                        </button>
                        <button
                            onClick={() => setIsAddModalOpen(!isAddModalOpen)} // Toggles the inline row state actually, let's reuse isAddModalOpen variable for inline toggle or rename it. I'll stick to isAddModalOpen for now as a toggle for the "New" row
                            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200 flex items-center gap-2"
                        >
                            <span className="material-icons">add</span>
                            Add Item
                        </button>
                    </div>
                </header>

                <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-900/50 border-b border-gray-700 text-xs uppercase text-gray-400 font-semibold tracking-wider">
                                    <th className="p-4 w-16 text-center border-r border-gray-700">Sr No.</th>
                                    <th className="p-4 w-1/4 border-r border-gray-700">Title</th>
                                    <th className="p-4 w-3/4 border-r border-gray-700">Details</th>
                                    {(isEditing || isAddModalOpen) && <th className="p-4 w-16 text-center">Action</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">


                                {loading ? (
                                    <tr><td colSpan="4" className="p-8 text-center text-gray-400">Loading summary...</td></tr>
                                ) : summaryData.length === 0 && !isAddModalOpen ? (
                                    <tr><td colSpan={(isEditing || isAddModalOpen) ? "4" : "3"} className="p-8 text-center text-gray-400">No project summary data found. Add items to get started.</td></tr>
                                ) : (
                                    summaryData.map((row, index) => (
                                        <tr key={row.id || index} className="hover:bg-gray-700/30 transition-colors duration-150 text-sm text-gray-300 border-b border-gray-700 last:border-0">
                                            <td className="p-4 text-center text-gray-500 font-medium border-r border-gray-700 align-middle">
                                                {index + 1}
                                            </td>
                                            <td className={isEditing ? "p-2 font-medium text-white border-r border-gray-700 align-top" : "p-4 font-medium text-white border-r border-gray-700 align-top"}>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={row.title}
                                                        onChange={(e) => handleInputChange(index, 'title', e.target.value)}
                                                        className="w-full h-10 bg-gray-900 border border-gray-600 rounded px-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                                                        placeholder="Title..."
                                                    />
                                                ) : (
                                                    row.title
                                                )}
                                            </td>
                                            <td className={isEditing ? "p-2 text-gray-300 border-r border-gray-700 align-top" : "p-4 text-gray-300 border-r border-gray-700 align-top"}>
                                                {isEditing ? (
                                                    <textarea
                                                        value={row.details || row.description}
                                                        onChange={(e) => handleInputChange(index, 'details', e.target.value)}
                                                        className="w-full min-h-[40px] bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-y transition-colors leading-relaxed"
                                                        placeholder="Details..."
                                                        rows={1}
                                                        onInput={(e) => {
                                                            e.target.style.height = 'auto';
                                                            e.target.style.height = e.target.scrollHeight + 'px';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="whitespace-pre-wrap">{row.details || row.description}</div>
                                                )}
                                            </td>
                                            {(isEditing || isAddModalOpen) && (
                                                <td className="p-4 text-center align-middle">
                                                    {isEditing ? (
                                                        <button
                                                            onClick={() => handleDeleteItem(row.id)}
                                                            className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg transition-all mx-auto"
                                                            title="Delete Item"
                                                        >
                                                            <span className="material-icons text-sm font-bold">delete</span>
                                                        </button>
                                                    ) : (
                                                        <span></span>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                                {/* Inline Add Row (Active when Add Item is clicked) */}
                                {isAddModalOpen && (
                                    <tr className="bg-gray-800 border-b border-gray-700">
                                        <td className="p-4 text-center font-bold text-gray-400 border-r border-gray-700 align-middle">
                                            New
                                        </td>
                                        <td className="p-2 border-r border-gray-700 align-top">
                                            <input
                                                type="text"
                                                value={newItem.title}
                                                onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                                                className="w-full h-10 bg-gray-900 border border-gray-600 rounded px-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                                                placeholder="Title..."
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        // Optional: move focus to details or submit
                                                    }
                                                }}
                                            />
                                        </td>
                                        <td className="p-2 border-r border-gray-700 align-top">
                                            <textarea
                                                value={newItem.details}
                                                onChange={(e) => setNewItem({ ...newItem, details: e.target.value })}
                                                className="w-full min-h-[40px] bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-y transition-colors leading-relaxed"
                                                placeholder="Details..."
                                                rows={1}
                                                onInput={(e) => {
                                                    e.target.style.height = 'auto';
                                                    e.target.style.height = e.target.scrollHeight + 'px';
                                                }}
                                            />
                                        </td>
                                        <td className="p-2 text-center align-middle whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        if (!newItem.title.trim() && !newItem.details.trim()) {
                                                            setIsAddModalOpen(false); // Discard if empty
                                                            return;
                                                        }
                                                        handleAddItem();
                                                    }}
                                                    disabled={adding}
                                                    className="w-8 h-8 rounded-full bg-green-600 hover:bg-green-500 text-white flex items-center justify-center shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Save Item"
                                                >
                                                    <span className="material-icons text-sm font-bold">check</span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setNewItem({ title: '', details: '' }); // Clear field
                                                        setIsAddModalOpen(false); // Discard row
                                                    }}
                                                    className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg transition-all"
                                                    title="Discard Row"
                                                >
                                                    <span className="material-icons text-sm font-bold">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 max-w-sm w-full p-6 animate-fade-in-up">
                            <div className="flex items-center gap-3 mb-4 text-red-400">
                                <span className="material-icons text-3xl">warning</span>
                                <h3 className="text-xl font-bold text-white">Confirm Deletion</h3>
                            </div>
                            <p className="text-gray-300 mb-6">
                                Are you sure you want to delete this summary item? This action cannot be undone.
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
            </main>
        </div>
    );
};

export default ProjectSummary;
