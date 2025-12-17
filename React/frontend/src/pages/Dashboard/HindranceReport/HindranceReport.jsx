import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../SidebarComponent/sidebar";
import { toast } from "react-toastify";

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:5001';

const HindranceReport = () => {
    const navigate = useNavigate();
    const { projectId } = useParams();
    const [reports, setReports] = useState([]);
    const [newRows, setNewRows] = useState([]);
    const [loading, setLoading] = useState(true);

    // Inline Editing State
    const [editingId, setEditingId] = useState(null);
    const [editFormData, setEditFormData] = useState({});

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    // Edit Mode State - Global toggle for Action column
    const [isEditMode, setIsEditMode] = useState(false);

    // Fetch on mount
    useEffect(() => {
        fetchReports();
    }, [projectId]);

    const fetchReports = async () => {
        try {
            const response = await fetch(`${API_BASE}/hindrance/${projectId}`, {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                setReports(data.data || []);
            } else {
                setReports([]);
            }
        } catch (error) {
            console.error("Error fetching hindrance reports:", error);
            // toast.error("Failed to load reports"); 
        } finally {
            setLoading(false);
        }
    };

    //#region Calculations
    const calculateDuration = (start, end) => {
        if (!start || !end) return "";
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffTime = endDate - startDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return isNaN(diffDays) ? "-" : diffDays + 1;
    };

    const calculateDelay = (planned, actual) => {
        if (!planned || !actual) return 0;
        const plannedDate = new Date(planned);
        const actualDate = new Date(actual);
        const diffTime = actualDate - plannedDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return isNaN(diffDays) ? 0 : diffDays;
    }
    //#endregion

    //#region Existing Rows Actions (Edit/Delete)
    const getReportId = (report) => report.hindrance_id || report.id;

    const handleEditClick = (report) => {
        const id = getReportId(report);
        if (!id) {
            console.error("Report ID missing:", report);
            return;
        }
        setEditingId(id);
        setEditFormData({
            description: report.description,
            planned_start_date: formatDateForInput(report.planned_start_date),
            planned_end_date: formatDateForInput(report.planned_end_date),
            actual_start_date: formatDateForInput(report.actual_start_date),
            actual_end_date: formatDateForInput(report.actual_end_date),
            responsible_start: report.responsible_start,
            responsible_finish: report.responsible_finish,
            remarks: report.remarks
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditFormData({});
    };

    const handleEditChange = (e) => {
        setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
    };

    const handleSaveEdit = async () => {
        if (!editingId) return;
        try {
            // Find original report to compare
            const originalReport = reports.find(r => getReportId(r) === editingId);
            if (!originalReport) return;

            // Filter only changed fields
            const payload = {};
            Object.keys(editFormData).forEach(key => {
                if (editFormData[key] !== originalReport[key]) {
                    payload[key] = editFormData[key];
                }
            });

            if (Object.keys(payload).length === 0) {
                toast.info("No changes detected");
                setEditingId(null);
                setEditFormData({});
                return;
            }

            console.log(`Updating Report ${editingId} at ${API_BASE}/hindrance/update/${editingId}`, payload);

            // Updated to use PUT /hindrance/update/:id based on project patterns (BudgetUpdate uses PUT) and User feedback
            const response = await fetch(`${API_BASE}/hindrance/update/${editingId}`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (response.ok) {
                toast.success("Report updated successfully");
                setEditingId(null);
                setEditFormData({});
                setIsEditMode(false); // Auto-exit edit mode
                fetchReports();
            } else {
                toast.error(data.message || "Failed to update report");
                console.error("Update failed:", data);
            }
        } catch (error) {
            console.error("Error updating report:", error);
            toast.error("Error updating report");
        }
    };

    const handleDeleteClick = (id) => {
        setDeleteId(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;

        try {
            console.log(`Deleting Report ${deleteId} at ${API_BASE}/hindrance/delete/${deleteId}`);
            // Reverted to DELETE /hindrance/delete/:id based on previous working state
            const response = await fetch(`${API_BASE}/hindrance/delete/${deleteId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                toast.success("Report deleted successfully");
                setReports(reports.filter(r => getReportId(r) !== deleteId));
                setIsEditMode(false); // Auto-exit edit mode
            } else {
                const data = await response.json();
                toast.error(data.message || "Failed to delete report");
            }
        } catch (error) {
            console.error("Error deleting report:", error);
            toast.error("Error deleting report");
        } finally {
            setShowDeleteModal(false);
            setDeleteId(null);
        }
    };
    //#endregion

    //#region New Rows Actions (Create)
    const addNewRow = () => {
        setNewRows([...newRows, {
            tempId: Date.now(), // Create a local ID
            description: "",
            planned_start_date: "",
            planned_end_date: "",
            actual_start_date: "",
            actual_end_date: "",
            responsible_start: "",
            responsible_finish: "",
            remarks: ""
        }]);
    };

    const removeNewRow = (tempId) => {
        setNewRows(newRows.filter(row => row.tempId !== tempId));
    };

    const handleNewRowChange = (tempId, field, value) => {
        const updatedRows = newRows.map(row =>
            row.tempId === tempId ? { ...row, [field]: value } : row
        );
        setNewRows(updatedRows);
    };

    const saveNewRow = async (row) => {
        if (!row.description || !row.planned_start_date || !row.planned_end_date) {
            toast.warning("Please fill required fields (Description, Planned Dates)");
            return;
        }

        try {
            const body = {
                project_id: parseInt(projectId),
                description: row.description,
                planned_start_date: row.planned_start_date,
                planned_end_date: row.planned_end_date,
                actual_start_date: row.actual_start_date,
                actual_end_date: row.actual_end_date,
                responsible_start: row.responsible_start,
                responsible_finish: row.responsible_finish,
                remarks: row.remarks
            };

            const response = await fetch(`${API_BASE}/hindrance/create`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await response.json();
            if (data.success || response.ok) {
                toast.success("Report created successfully");
                // Remove from newRows and refresh list
                setNewRows(newRows.filter(r => r.tempId !== row.tempId));
                fetchReports();
            } else {
                toast.error(data.message || "Failed to create report");
            }
        } catch (error) {
            console.error("Error creating report:", error);
            toast.error("Error creating report");
        }
    };
    //#endregion

    // Helper: ISO to YYYY-MM-DD
    const formatDateForInput = (isoString) => {
        if (!isoString) return "";
        try {
            return new Date(isoString).toISOString().split('T')[0];
        } catch (e) {
            return "";
        }
    };

    // Helper: Display Date (DD-MM-YYYY)
    const formatDateDisplay = (isoString) => {
        if (!isoString) return "";
        try {
            const date = new Date(isoString);
            return date.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            });
        } catch (e) {
            return isoString;
        }
    };

    const thClass = "p-2 border border-gray-600 font-semibold tracking-wider text-center";
    const tdClass = "p-2 border border-gray-600 text-center text-gray-300 align-middle";
    const inputClass = "w-full bg-transparent border border-transparent hover:border-gray-600 focus:border-blue-500 rounded px-2 py-1 text-white text-center outline-none transition-all duration-200";

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
                            Hindrance Report
                        </h1>
                        <p className="text-[var(--text-secondary)]">
                            Manage all hindrances (View, Create, Edit, Delete)
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => setIsEditMode(!isEditMode)}
                            className={`px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-colors ${isEditMode
                                ? "bg-green-600 hover:bg-green-700 text-white"
                                : "bg-gray-700 hover:bg-gray-600 text-white"
                                }`}
                        >
                            <span className="material-icons">{isEditMode ? "check" : "edit"}</span>
                            {isEditMode ? "Done" : "Edit"}
                        </button>
                        <button
                            onClick={addNewRow}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
                        >
                            <span className="material-icons">add</span>
                            Add New Row
                        </button>
                    </div>
                </header>

                <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-md overflow-hidden pb-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse border border-gray-600 min-w-[1200px]">
                            <thead className="bg-gray-900/50 text-xs uppercase text-gray-400">
                                <tr>
                                    <th rowSpan="2" className={`${thClass} w-12`}>S. No.</th>
                                    <th rowSpan="2" className={`${thClass} w-64`}>Description of Items</th>
                                    <th colSpan="3" className={`${thClass} bg-gray-900/40`}>Planned Dates</th>
                                    <th colSpan="3" className={`${thClass} bg-gray-900/40`}>Actual Dates</th>
                                    <th rowSpan="2" className={`${thClass} w-24`}>No. Of Days Delayed TO START</th>
                                    <th rowSpan="2" className={`${thClass} w-32`}>Responsible (Start)</th>
                                    <th rowSpan="2" className={`${thClass} w-24`}>No. Of Days Delayed TO FINISH</th>
                                    <th rowSpan="2" className={`${thClass} w-32`}>Responsible (Finish)</th>
                                    <th rowSpan="2" className={`${thClass} w-48`}>Remarks</th>
                                    {(isEditMode || newRows.length > 0) && (
                                        <th rowSpan="2" className={`${thClass} w-24`}>Action</th>
                                    )}
                                </tr>
                                <tr>
                                    <th className={thClass}>Start</th>
                                    <th className={thClass}>Finish</th>
                                    <th className={thClass}>Day</th>
                                    <th className={thClass}>Start</th>
                                    <th className={thClass}>Finish</th>
                                    <th className={thClass}>Day</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700 text-sm">
                                {/* Existing Rows */}
                                {reports.map((item, index) => {
                                    const isEditing = editingId === item.hindrance_id;
                                    const pStart = isEditing ? editFormData.planned_start_date : item.planned_start_date;
                                    const pEnd = isEditing ? editFormData.planned_end_date : item.planned_end_date;
                                    const aStart = isEditing ? editFormData.actual_start_date : item.actual_start_date;
                                    const aEnd = isEditing ? editFormData.actual_end_date : item.actual_end_date;

                                    const pDuration = calculateDuration(pStart, pEnd);
                                    const aDuration = calculateDuration(aStart, aEnd);
                                    const dStart = calculateDelay(pStart, aStart);
                                    const dFinish = calculateDelay(pEnd, aEnd);

                                    return (
                                        <tr key={item.hindrance_id} className="hover:bg-gray-700/30 transition-colors duration-150">
                                            <td className={tdClass}>{index + 1}</td>
                                            <td className={tdClass}>
                                                {isEditing ? <textarea name="description" value={editFormData.description} onChange={handleEditChange} className={inputClass} /> : item.description}
                                            </td>
                                            {/* Details Columns */}
                                            <td className={tdClass}>
                                                {isEditing ? <input type="date" name="planned_start_date" value={editFormData.planned_start_date} onChange={handleEditChange} className={inputClass} /> : formatDateDisplay(item.planned_start_date)}
                                            </td>
                                            <td className={tdClass}>
                                                {isEditing ? <input type="date" name="planned_end_date" value={editFormData.planned_end_date} onChange={handleEditChange} className={inputClass} /> : formatDateDisplay(item.planned_end_date)}
                                            </td>
                                            <td className={tdClass}>{pDuration}</td>

                                            <td className={tdClass}>
                                                {isEditing ? <input type="date" name="actual_start_date" value={editFormData.actual_start_date} onChange={handleEditChange} className={inputClass} /> : formatDateDisplay(item.actual_start_date)}
                                            </td>
                                            <td className={tdClass}>
                                                {isEditing ? <input type="date" name="actual_end_date" value={editFormData.actual_end_date} onChange={handleEditChange} className={inputClass} /> : formatDateDisplay(item.actual_end_date)}
                                            </td>
                                            <td className={tdClass}>{aDuration}</td>

                                            <td className={`${tdClass} ${dStart > 0 ? 'text-red-400 font-bold' : ''}`}>{dStart}</td>
                                            <td className={tdClass}>
                                                {isEditing ? <input name="responsible_start" value={editFormData.responsible_start} onChange={handleEditChange} className={inputClass} /> : item.responsible_start}
                                            </td>
                                            <td className={`${tdClass} ${dFinish > 0 ? 'text-red-400 font-bold' : ''}`}>{dFinish}</td>
                                            <td className={tdClass}>
                                                {isEditing ? <input name="responsible_finish" value={editFormData.responsible_finish} onChange={handleEditChange} className={inputClass} /> : item.responsible_finish}
                                            </td>
                                            <td className={tdClass}>
                                                {isEditing ? <textarea name="remarks" value={editFormData.remarks} onChange={handleEditChange} className={inputClass} /> : item.remarks}
                                            </td>

                                            {(isEditMode || newRows.length > 0) && (
                                                <td className={tdClass}>
                                                    {isEditing ? (
                                                        <div className="flex gap-2 justify-center">
                                                            <button onClick={handleSaveEdit} className="text-green-500 hover:text-green-400" title="Update">
                                                                <span className="material-icons">save</span>
                                                            </button>
                                                            <button onClick={handleCancelEdit} className="text-gray-400 hover:text-gray-300" title="Cancel">
                                                                <span className="material-icons">cancel</span>
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex gap-2 justify-center">
                                                            <button onClick={() => handleEditClick(item)} className="text-blue-500 hover:text-blue-400" title="Edit">
                                                                <span className="material-icons text-lg">edit</span>
                                                            </button>
                                                            <button onClick={() => handleDeleteClick(item.hindrance_id)} className="text-red-500 hover:text-red-400" title="Delete">
                                                                <span className="material-icons text-lg">delete</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}

                                {/* New Rows */}
                                {newRows.map((row, index) => {
                                    const pDuration = calculateDuration(row.planned_start_date, row.planned_end_date);
                                    const aDuration = calculateDuration(row.actual_start_date, row.actual_end_date);
                                    const dStart = calculateDelay(row.planned_start_date, row.actual_start_date);
                                    const dFinish = calculateDelay(row.planned_end_date, row.actual_end_date);

                                    return (
                                        <tr key={row.tempId} className="bg-blue-900/10 hover:bg-blue-900/20 transition-colors duration-150 border-l-2 border-l-blue-500">
                                            <td className={tdClass}>New</td>
                                            <td className={tdClass}>
                                                <textarea
                                                    rows={1}
                                                    value={row.description}
                                                    onChange={(e) => handleNewRowChange(row.tempId, 'description', e.target.value)}
                                                    className={inputClass}
                                                    placeholder="Description..."
                                                />
                                            </td>
                                            <td className={tdClass}>
                                                <input type="date"
                                                    value={row.planned_start_date}
                                                    onChange={(e) => handleNewRowChange(row.tempId, 'planned_start_date', e.target.value)}
                                                    className={inputClass}
                                                />
                                            </td>
                                            <td className={tdClass}>
                                                <input type="date"
                                                    value={row.planned_end_date}
                                                    onChange={(e) => handleNewRowChange(row.tempId, 'planned_end_date', e.target.value)}
                                                    className={inputClass}
                                                />
                                            </td>
                                            <td className={tdClass}>{pDuration}</td>

                                            <td className={tdClass}>
                                                <input type="date"
                                                    value={row.actual_start_date}
                                                    onChange={(e) => handleNewRowChange(row.tempId, 'actual_start_date', e.target.value)}
                                                    className={inputClass}
                                                />
                                            </td>
                                            <td className={tdClass}>
                                                <input type="date"
                                                    value={row.actual_end_date}
                                                    onChange={(e) => handleNewRowChange(row.tempId, 'actual_end_date', e.target.value)}
                                                    className={inputClass}
                                                />
                                            </td>
                                            <td className={tdClass}>{aDuration}</td>

                                            <td className={`${tdClass} ${dStart > 0 ? 'text-red-400 font-bold' : ''}`}>{dStart}</td>
                                            <td className={tdClass}>
                                                <input
                                                    value={row.responsible_start}
                                                    onChange={(e) => handleNewRowChange(row.tempId, 'responsible_start', e.target.value)}
                                                    className={inputClass}
                                                    placeholder="Responsible..."
                                                />
                                            </td>
                                            <td className={`${tdClass} ${dFinish > 0 ? 'text-red-400 font-bold' : ''}`}>{dFinish}</td>
                                            <td className={tdClass}>
                                                <input
                                                    value={row.responsible_finish}
                                                    onChange={(e) => handleNewRowChange(row.tempId, 'responsible_finish', e.target.value)}
                                                    className={inputClass}
                                                    placeholder="Responsible..."
                                                />
                                            </td>
                                            <td className={tdClass}>
                                                <textarea
                                                    rows={1}
                                                    value={row.remarks}
                                                    onChange={(e) => handleNewRowChange(row.tempId, 'remarks', e.target.value)}
                                                    className={inputClass}
                                                    placeholder="Remarks..."
                                                />
                                            </td>

                                            {(isEditMode || newRows.length > 0) && (
                                                <td className={tdClass}>
                                                    <div className="flex gap-2 justify-center">
                                                        <button onClick={() => saveNewRow(row)} className="text-green-500 hover:text-green-400" title="Create">
                                                            <span className="material-icons">check_circle</span>
                                                        </button>
                                                        <button onClick={() => removeNewRow(row.tempId)} className="text-red-500 hover:text-red-400" title="Discard">
                                                            <span className="material-icons">delete_outline</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* Empty State */}
                        {!loading && reports.length === 0 && newRows.length === 0 && (
                            <div className="p-8 text-center text-gray-400">
                                <p className="mb-4">No hindrance reports found.</p>
                                <button
                                    onClick={addNewRow}
                                    className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded border border-gray-600"
                                >
                                    Create First Report
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Delete Confirmation Modal */}
            {
                showDeleteModal && (
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50">
                        <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 max-w-sm w-full p-6 animate-fade-in-up">
                            <div className="flex items-center gap-3 mb-4 text-red-400">
                                <span className="material-icons text-3xl">warning</span>
                                <h3 className="text-xl font-bold text-white">Confirm Deletion</h3>
                            </div>
                            <p className="text-gray-300 mb-6">
                                Are you sure you want to delete this report? This action cannot be undone.
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
                )
            }
        </div >
    );
};

export default HindranceReport;