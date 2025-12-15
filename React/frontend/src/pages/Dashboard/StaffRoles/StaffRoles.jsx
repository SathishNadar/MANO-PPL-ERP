import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../SidebarComponent/sidebar";
import { toast } from "react-toastify";

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:5001';

const StaffRoles = () => {
    const navigate = useNavigate();
    const { projectId } = useParams();
    const [project, setProject] = useState(null);
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);

    // UI States
    const [isManagementMode, setIsManagementMode] = useState(false); // Top toggle
    const [editingId, setEditingId] = useState(null); // Row being edited
    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    // Inline Add State
    const [newRows, setNewRows] = useState([]);

    // Forms
    const [editFormData, setEditFormData] = useState({});

    // Fetch Project Details
    useEffect(() => {
        const fetchProjectDetails = async () => {
            try {
                const response = await fetch(`${API_BASE}/project/getProject/${projectId}`, {
                    credentials: 'include'
                });
                const data = await response.json();
                if (data.success && data.data) {
                    setProject(data.data);
                }
            } catch (error) {
                console.error("Error fetching project:", error);
            }
        };

        if (projectId) {
            fetchProjectDetails();
            fetchStaff();
        }
    }, [projectId]);

    // Fetch Staff Roles
    const fetchStaff = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/projectStaffRoles/staff/${projectId}`, {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.staff) {
                setStaff(data.staff);
            } else {
                setStaff([]);
            }
        } catch (error) {
            console.error("Error fetching staff:", error);
            toast.error("Failed to load staff details");
        } finally {
            setLoading(false);
        }
    };

    // Add New Row (UI)
    const addNewRow = () => {
        setNewRows([...newRows, {
            tempId: Date.now(),
            name: "",
            designation: "",
            responsibilities: "",
            mobile: "",
            email: ""
        }]);
        setIsManagementMode(true); // Auto-enable management mode to show actions
    };

    // Handle Change in New Row
    const handleNewRowChange = (tempId, field, value) => {
        setNewRows(newRows.map(row =>
            row.tempId === tempId ? { ...row, [field]: value } : row
        ));
    };

    // Save New Staff (API)
    const saveNewRow = async (tempId) => {
        const rowToSave = newRows.find(r => r.tempId === tempId);
        if (!rowToSave) return;

        if (!rowToSave.name || !rowToSave.designation) {
            toast.warning("Name and Designation are required");
            return;
        }

        try {
            // Construct body excluding tempId
            const { tempId: _, ...bodyData } = rowToSave;

            const response = await fetch(`${API_BASE}/projectStaffRoles/add/${projectId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData),
                credentials: 'include'
            });

            const data = await response.json();
            if (response.ok) {
                toast.success("Staff added successfully");
                // Remove from newRows
                setNewRows(newRows.filter(r => r.tempId !== tempId));
                fetchStaff();
            } else {
                toast.error(data.message || "Failed to add staff");
            }
        } catch (error) {
            console.error("Error adding staff:", error);
            toast.error("Error adding staff");
        }
    };

    // Discard New Row
    const discardNewRow = (tempId) => {
        setNewRows(newRows.filter(r => r.tempId !== tempId));
    };

    // Delete Staff - Trigger Modal
    const handleDeleteStaff = (id) => {
        setDeleteId(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;

        try {
            const response = await fetch(`${API_BASE}/projectStaffRoles/delete/${deleteId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                toast.success("Staff removed successfully");
                fetchStaff();
            } else {
                toast.error("Failed to remove staff");
            }
        } catch (error) {
            console.error("Error deleting staff:", error);
            toast.error("Error deleting staff");
        } finally {
            setShowDeleteModal(false);
            setDeleteId(null);
        }
    };

    // Update Staff (Start Edit)
    const handleEditClick = (staffMember) => {
        setEditingId(staffMember.psrr_id);
        setEditFormData({ ...staffMember });
    };

    // Update Staff (Save)
    const handleUpdateStaff = async () => {
        try {
            const response = await fetch(`${API_BASE}/projectStaffRoles/update/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editFormData),
                credentials: 'include'
            });

            if (response.ok) {
                toast.success("Staff updated successfully");
                setEditingId(null);
                fetchStaff();
            } else {
                toast.error("Failed to update staff");
            }
        } catch (error) {
            console.error("Error updating staff:", error);
            toast.error("Error updating staff");
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
                            {project ? `${project.project_name} - ` : ""}MANO's Staff Role & Responsibilities
                        </h1>
                        <p className="text-[var(--text-secondary)]">
                            Roles and responsibilities of the staff members{project ? ` for ${project.project_name}` : ""}.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsManagementMode(!isManagementMode)}
                            className={`font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200 flex items-center gap-2 ${isManagementMode
                                ? 'bg-green-600 hover:bg-green-500 text-white'
                                : 'bg-gray-700 hover:bg-gray-600 text-white'
                                }`}
                        >
                            <span className="material-icons">{isManagementMode ? 'check' : 'edit'}</span>
                            {isManagementMode ? 'Done' : 'Edit'}
                        </button>
                        <button
                            onClick={addNewRow}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200 flex items-center gap-2"
                        >
                            <span className="material-icons">add</span>
                            Add Staff
                        </button>
                    </div>
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
                                    <th className={`p-4 w-1/6 ${isManagementMode ? 'border-r border-gray-700' : ''}`}>Email ID</th>
                                    {isManagementMode && <th className="p-4 text-center w-24">Action</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700 text-gray-300">
                                {loading && staff.length === 0 ? (
                                    <tr><td colSpan={isManagementMode ? 7 : 6} className="p-8 text-center text-gray-400">Loading staff...</td></tr>
                                ) : staff.length === 0 && newRows.length === 0 ? (
                                    <tr><td colSpan={isManagementMode ? 7 : 6} className="p-8 text-center text-gray-400">No staff found.</td></tr>
                                ) : (
                                    <>
                                        {staff.map((member, index) => {
                                            const isEditing = editingId === member.psrr_id;
                                            return (
                                                <tr key={member.psrr_id} className="hover:bg-gray-700/30 transition-colors duration-150 border-b border-gray-700 last:border-0">
                                                    <td className="p-4 text-center font-medium border-r border-gray-700 bg-gray-900/40 text-gray-400">
                                                        {index + 1}
                                                    </td>
                                                    <td className="p-4 font-medium text-white border-r border-gray-700">
                                                        {isEditing ? (
                                                            <input
                                                                className="w-full bg-gray-700 text-white px-2 py-1 rounded"
                                                                value={editFormData.name}
                                                                onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                                                            />
                                                        ) : member.name}
                                                    </td>
                                                    <td className="p-4 font-medium border-r border-gray-700">
                                                        {isEditing ? (
                                                            <input
                                                                className="w-full bg-gray-700 text-white px-2 py-1 rounded"
                                                                value={editFormData.designation}
                                                                onChange={e => setEditFormData({ ...editFormData, designation: e.target.value })}
                                                            />
                                                        ) : member.designation}
                                                    </td>
                                                    <td className="p-4 border-r border-gray-700">
                                                        {isEditing ? (
                                                            <textarea
                                                                className="w-full bg-gray-700 text-white px-2 py-1 rounded overflow-hidden resize-none"
                                                                rows={1}
                                                                value={editFormData.responsibilities}
                                                                onChange={e => setEditFormData({ ...editFormData, responsibilities: e.target.value })}
                                                                onInput={(e) => {
                                                                    e.target.style.height = 'auto';
                                                                    e.target.style.height = e.target.scrollHeight + 'px';
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="whitespace-pre-line">{member.responsibilities}</div>
                                                        )}
                                                    </td>
                                                    <td className="p-4 font-mono text-gray-400 border-r border-gray-700">
                                                        {isEditing ? (
                                                            <input
                                                                className="w-full bg-gray-700 text-white px-2 py-1 rounded"
                                                                value={editFormData.mobile}
                                                                onChange={e => setEditFormData({ ...editFormData, mobile: e.target.value })}
                                                            />
                                                        ) : member.mobile}
                                                    </td>
                                                    <td className={`p-4 text-blue-400 hover:text-blue-300 transition-colors ${isManagementMode ? 'border-r border-gray-700' : ''}`}>
                                                        {isEditing ? (
                                                            <input
                                                                className="w-full bg-gray-700 text-white px-2 py-1 rounded"
                                                                value={editFormData.email}
                                                                onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                                                            />
                                                        ) : (
                                                            <a href={`mailto:${member.email}`} className="break-all">
                                                                {member.email}
                                                            </a>
                                                        )}
                                                    </td>
                                                    {isManagementMode && (
                                                        <td className="p-4 text-center">
                                                            {isEditing ? (
                                                                <div className="flex gap-2 justify-center">
                                                                    <button onClick={handleUpdateStaff} className="text-green-500 hover:text-green-400"><span className="material-icons">save</span></button>
                                                                    <button onClick={() => setEditingId(null)} className="text-red-500 hover:text-red-400"><span className="material-icons">close</span></button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex gap-2 justify-center">
                                                                    <button onClick={() => handleEditClick(member)} className="text-blue-500 hover:text-blue-400"><span className="material-icons">edit</span></button>
                                                                    <button onClick={() => handleDeleteStaff(member.psrr_id)} className="text-red-500 hover:text-red-400"><span className="material-icons">delete</span></button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                        {/* New Rows for Adding */}
                                        {newRows.map((row, index) => (
                                            <tr key={row.tempId} className="bg-gray-800/80 border-b border-gray-700 last:border-0 border-l-4 border-l-blue-500">
                                                <td className="p-4 text-center font-medium border-r border-gray-700 bg-gray-900/40 text-gray-400">
                                                    {staff.length + index + 1}
                                                </td>
                                                <td className="p-4 font-medium text-white border-r border-gray-700">
                                                    <input
                                                        className="w-full bg-gray-700 text-white px-2 py-1 rounded placeholder-gray-500"
                                                        placeholder="Name"
                                                        value={row.name}
                                                        onChange={e => handleNewRowChange(row.tempId, 'name', e.target.value)}
                                                    />
                                                </td>
                                                <td className="p-4 font-medium border-r border-gray-700">
                                                    <input
                                                        className="w-full bg-gray-700 text-white px-2 py-1 rounded placeholder-gray-500"
                                                        placeholder="Designation"
                                                        value={row.designation}
                                                        onChange={e => handleNewRowChange(row.tempId, 'designation', e.target.value)}
                                                    />
                                                </td>
                                                <td className="p-4 border-r border-gray-700">
                                                    <textarea
                                                        className="w-full bg-gray-700 text-white px-2 py-1 rounded placeholder-gray-500 overflow-hidden resize-none"
                                                        rows={1}
                                                        placeholder="Responsibilities"
                                                        value={row.responsibilities}
                                                        onChange={e => handleNewRowChange(row.tempId, 'responsibilities', e.target.value)}
                                                        onInput={(e) => {
                                                            e.target.style.height = 'auto';
                                                            e.target.style.height = e.target.scrollHeight + 'px';
                                                        }}
                                                    />
                                                </td>
                                                <td className="p-4 font-mono text-gray-400 border-r border-gray-700">
                                                    <input
                                                        className="w-full bg-gray-700 text-white px-2 py-1 rounded placeholder-gray-500"
                                                        placeholder="Mobile"
                                                        value={row.mobile}
                                                        onChange={e => handleNewRowChange(row.tempId, 'mobile', e.target.value)}
                                                    />
                                                </td>
                                                <td className={`p-4 text-blue-400 hover:text-blue-300 transition-colors ${isManagementMode ? 'border-r border-gray-700' : ''}`}>
                                                    <input
                                                        className="w-full bg-gray-700 text-white px-2 py-1 rounded placeholder-gray-500"
                                                        placeholder="Email"
                                                        value={row.email}
                                                        onChange={e => handleNewRowChange(row.tempId, 'email', e.target.value)}
                                                    />
                                                </td>
                                                {isManagementMode && (
                                                    <td className="p-4 text-center">
                                                        <div className="flex gap-2 justify-center">
                                                            <button onClick={() => saveNewRow(row.tempId)} className="text-green-500 hover:text-green-400" title="Save"><span className="material-icons">save</span></button>
                                                            <button onClick={() => discardNewRow(row.tempId)} className="text-red-500 hover:text-red-400" title="Cancel"><span className="material-icons">delete</span></button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
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
                            Are you sure you want to remove this staff member? This action cannot be undone.
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

export default StaffRoles;
