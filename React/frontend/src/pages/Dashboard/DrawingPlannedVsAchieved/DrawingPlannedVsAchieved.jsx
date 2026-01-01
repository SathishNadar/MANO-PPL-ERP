import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../SidebarComponent/sidebar";
import { toast } from "react-toastify";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:5001";

const DrawingPlannedVsAchieved = () => {
    const navigate = useNavigate();
    const { projectId } = useParams();

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    const [newRows, setNewRows] = useState([]);

    useEffect(() => {
        const session = localStorage.getItem("session");
        if (session) {
            const sessionData = JSON.parse(session);
            setIsAdmin(sessionData.title_id === 2);
        }
    }, []);

    const handleAuthError = (response) => {
        if (response.status === 401 || response.status === 403) {
            toast.error("Session expired. Please login again.");
            setTimeout(() => {
                localStorage.removeItem("session");
                navigate("/auth");
            }, 1500);
            return true;
        }
        return false;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        } catch (e) {
            return dateString;
        }
    };

    const DRAWING_TYPE_LABEL = {
        A: "ARCHITECTURAL DRAWING",
        S: "STRUCTURAL DRAWING",
        M: "MEP DRAWING",
        EP: "ELECTRICAL & PLUMBING DRAWING",
        E: "ELECTRICAL DRAWING",
        P: "PLUMBING DRAWING",
        FF: "FIRE FIGHTING DRAWING",
        ID: "INTERIOR DESIGN DRAWING",
        IS: "INTERIOR SERVICES DRAWING"
    };


    const transformData = (data) => {
        if (!data || data.length === 0) return [];

        const grouped = {};
        data.forEach(item => {
            const type = DRAWING_TYPE_LABEL[item.drawing_type] || "OTHER";
            if (!grouped[type]) {
                grouped[type] = [];
            }
            grouped[type].push({
                ...item,
                drawing_type_label: DRAWING_TYPE_LABEL[item.drawing_type] || "OTHER"
            });
        });

        const result = [];
        let serialNumber = 1;

        const typeOrder = [
            'ARCHITECTURAL DRAWING',
            'STRUCTURAL DRAWING',
            'MEP DRAWING',
            'ELECTRICAL & PLUMBING DRAWING',
            'ELECTRICAL DRAWING',
            'PLUMBING DRAWING',
            'FIRE FIGHTING DRAWING',
            'INTERIOR DESIGN DRAWING',
            'INTERIOR SERVICES DRAWING',
            'OTHER'
        ];

        const sortedTypes = Object.keys(grouped).sort((a, b) => {
            const indexA = typeOrder.indexOf(a);
            const indexB = typeOrder.indexOf(b);
            const posA = indexA === -1 ? typeOrder.length - 1 : indexA;
            const posB = indexB === -1 ? typeOrder.length - 1 : indexB;
            return posA - posB;
        });

        sortedTypes.forEach(type => {
            result.push({
                id: `header-${type}`,
                isHeader: true,
                title: type.toUpperCase()
            });
            grouped[type].forEach(item => {
                result.push({
                    ...item,
                    serial_no: serialNumber++
                });
            });
        });

        return result;
    };

    const fetchData = async () => {
        if (!projectId) return;

        try {
            setLoading(true);
            const response = await fetch(
                `${API_BASE}/projectDrawingsPA/report/${projectId}`,
                { credentials: 'include' }
            );

            if (handleAuthError(response)) {
                return;
            }

            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.status}`);
            }

            const result = await response.json();
            if (result.ok && result.data) {
                const transformed = transformData(result.data);
                setRows(transformed);
            } else {
                setRows([]);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load data");
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (projectId) {
            fetchData();
        }
    }, [projectId]);

    const handleEditClick = (row) => {
        if (!isAdmin) {
            toast.warning("Only administrators can edit records");
            return;
        }
        if (row.isHeader) return;

        setEditingId(row.drawing_pa_id);
        setEditFormData({
            drawing_type: row.drawing_type || "A",
            drawing_name: row.drawing_name || '',
            planned_date: row.planned_date || '',
            received_date: row.received_date || '',
            remarks: row.remarks || ''
        });

    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditFormData({});
    };

    const handleEditChange = (e) => {
        const value = e.target.value;
        setEditFormData({ ...editFormData, [e.target.name]: value });
    };

    const handleSaveEdit = async () => {
        if (!isAdmin) return;

        const {
            drawing_name,
            drawing_type,
            planned_date
        } = editFormData;

        if (!drawing_name?.trim()) {
            toast.warning("Drawing name is required");
            return;
        }

        if (!drawing_type) {
            toast.warning("Drawing type is required");
            return;
        }

        if (!planned_date) {
            toast.warning("Planned date is required");
            return;
        }

        try {
            const response = await fetch(
                `${API_BASE}/projectDrawingsPA/update/${editingId}`,
                {
                    method: "PUT",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(editFormData)
                }
            );

            if (handleAuthError(response)) return;

            const result = await response.json();
            if (result.ok) {
                toast.success("Record updated successfully");
                await fetchData();
                setEditingId(null);
                setEditFormData({});
            } else {
                toast.error(result.message || "Update failed");
            }
        } catch (err) {
            toast.error("Update failed");
        }
    };


    const addNewRow = () => {
        if (!isAdmin) {
            toast.warning("Only administrators can add new records");
            return;
        }
        const tempId = Date.now();
        setNewRows([...newRows, {
            tempId,
            drawing_type: "A",
            drawing_name: "",
            planned_date: "",
            received_date: "",
            remarks: ""
        }]);
        setIsEditMode(true);
    };

    const removeNewRow = (tempId) => {
        setNewRows(newRows.filter(row => row.tempId !== tempId));
    };

    const handleNewRowChange = (tempId, field, value) => {
        setNewRows(prevRows =>
            prevRows.map(row =>
                row.tempId === tempId ? { ...row, [field]: value } : row
            )
        );
    };

    const saveNewRow = async (row) => {
        if (!isAdmin) return;

        if (!row.drawing_name?.trim()) {
            toast.warning("Drawing name is required");
            return;
        }

        if (!row.drawing_type) {
            toast.warning("Drawing type is required");
            return;
        }

        if (!row.planned_date) {
            toast.warning("Planned date is required");
            return;
        }

        try {
            const { tempId, ...dataToSend } = row;

            const response = await fetch(
                `${API_BASE}/projectDrawingsPA/add/${projectId}`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(dataToSend)
                }
            );

            if (handleAuthError(response)) return;

            const result = await response.json();
            if (result.ok) {
                toast.success("Record added successfully");
                setNewRows(newRows.filter(r => r.tempId !== row.tempId));
                await fetchData();
            } else {
                toast.error(result.message || "Insert failed");
            }
        } catch {
            toast.error("Insert failed");
        }
    };


    const handleEditModeToggle = () => {
        if (!isAdmin) {
            toast.warning("Only administrators can edit records");
            return;
        }
        setIsEditMode(!isEditMode);
    };

    const thClass = "p-2 border border-gray-600 font-semibold tracking-wider text-center text-xs";
    const tdClass = "p-2 border border-gray-600 text-center text-gray-300 align-middle text-sm";
    const inputClass = "w-full bg-transparent border border-transparent hover:border-gray-600 focus:border-blue-500 rounded px-2 py-1 text-white text-center outline-none transition-all duration-200";
    const selectClass = "w-full bg-gray-700 border border-gray-600 hover:border-blue-500 focus:border-blue-500 rounded px-2 py-1 text-white text-center outline-none cursor-pointer transition-all duration-200";

    if (loading) {
        return (
            <div className="flex h-screen bg-gray-900">
                <Sidebar />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-400">Loading...</p>
                    </div>
                </main>
            </div>
        );
    }

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
                            Drawing Planned vs Achieved
                        </h1>
                        <p className="text-[var(--text-secondary)]">
                            Track drawing schedules and deliveries
                        </p>
                    </div>
                    <div className="flex gap-4">
                        {isAdmin ? (
                            <>
                                <button
                                    onClick={handleEditModeToggle}
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
                                    Add New Record
                                </button>
                            </>
                        ) : (
                            <div className="bg-gray-800 text-gray-400 px-4 py-2 rounded-lg flex items-center gap-2 border border-gray-700">
                                <span className="material-icons text-sm">lock</span>
                                <span className="text-sm">View Only</span>
                            </div>
                        )}
                    </div>
                </header>

                {!isAdmin && (
                    <div className="mb-4 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                        <p className="text-sm text-yellow-200 flex items-center gap-2">
                            <span className="material-icons text-lg">info</span>
                            You have view-only access. Contact an administrator to make changes.
                        </p>
                    </div>
                )}

                <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-md overflow-hidden pb-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse border border-gray-600 min-w-[1000px]">
                            <thead className="bg-gray-900/50 text-xs uppercase text-gray-400">
                                <tr>
                                    <th className={`${thClass} w-16`}>S. No.</th>
                                    <th className={thClass}>Drawing Name</th>
                                    {(isEditMode || newRows.length > 0) && <th className={thClass}>Type</th>}
                                    <th className={thClass}>Planned Date</th>
                                    <th className={thClass}>Received Date</th>
                                    <th className={thClass}>Remarks</th>
                                    {(isEditMode || newRows.length > 0) && isAdmin && (
                                        <th className={`${thClass} w-24`}>Action</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {rows.map((row, index) => {
                                    if (row.isHeader) {
                                        const colCount = 5 + ((isEditMode || newRows.length > 0) ? 1 : 0) + ((isEditMode || newRows.length > 0) && isAdmin ? 1 : 0);
                                        return (
                                            <tr key={index}>
                                                <td
                                                    colSpan={colCount}
                                                    className="p-2 border border-gray-600 font-bold bg-gray-700 text-white text-left pl-4 uppercase tracking-wider"
                                                >
                                                    {row.title}
                                                </td>
                                            </tr>
                                        );
                                    }

                                    const isEditing = editingId === row.drawing_pa_id;

                                    return (
                                        <tr key={row.drawing_pa_id} className="hover:bg-gray-700/30 transition-colors duration-150">
                                            <td className={tdClass}>
                                                {row.serial_no || '-'}
                                            </td>

                                            <td className={tdClass}>
                                                {isEditing ? (
                                                    <input
                                                        name="drawing_name"
                                                        value={editFormData.drawing_name}
                                                        onChange={handleEditChange}
                                                        className={inputClass}
                                                    />
                                                ) : (
                                                    row.drawing_name
                                                )}
                                            </td>

                                            {(isEditMode || newRows.length > 0) && (
                                                <td className={tdClass}>
                                                    {isEditing ? (
                                                        <select name="drawing_type" value={editFormData.drawing_type}>
                                                            <option value="A">ARCHITECTURAL DRAWING</option>
                                                            <option value="S">STRUCTURAL DRAWING</option>
                                                            <option value="M">MEP DRAWING</option>
                                                            <option value="E">ELECTRICAL DRAWING</option>
                                                            <option value="P">PLUMBING DRAWING</option>
                                                            <option value="FF">FIRE FIGHTING DRAWING</option>
                                                            <option value="ID">INTERIOR DESIGN DRAWING</option>
                                                            <option value="IS">INTERIOR SERVICES DRAWING</option>
                                                        </select>

                                                    ) : (
                                                        <span>{row.drawing_type_label}</span>
                                                    )}
                                                </td>
                                            )}

                                            <td className={tdClass}>
                                                {isEditing ? (
                                                    <input
                                                        type="date"
                                                        name="planned_date"
                                                        value={editFormData.planned_date}
                                                        onChange={handleEditChange}
                                                        className={inputClass}
                                                    />
                                                ) : (
                                                    formatDate(row.planned_date)
                                                )}
                                            </td>

                                            <td className={tdClass}>
                                                {isEditing ? (
                                                    <input
                                                        type="date"
                                                        name="received_date"
                                                        value={editFormData.received_date}
                                                        onChange={handleEditChange}
                                                        className={inputClass}
                                                    />
                                                ) : (
                                                    formatDate(row.received_date)
                                                )}
                                            </td>

                                            <td className={tdClass}>
                                                {isEditing ? (
                                                    <textarea
                                                        rows={1}
                                                        name="remarks"
                                                        value={editFormData.remarks}
                                                        onChange={handleEditChange}
                                                        className={inputClass}
                                                    />
                                                ) : (
                                                    row.remarks || '-'
                                                )}
                                            </td>

                                            {(isEditMode || newRows.length > 0) && isAdmin && (
                                                <td className={tdClass}>
                                                    {isEditing ? (
                                                        <div className="flex gap-2 justify-center">
                                                            <button onClick={() => handleSaveEdit(row)} class="w-8 h-8 rounded-full bg-green-600 hover:bg-green-500 text-white flex items-center justify-center shadow-lg transition-all" title="Create"><span class="material-icons text-sm font-bold">check</span></button>
                                                            <button onClick={() => handleCancelEdit(row)} class="w-8 h-8 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg transition-all" title="Delete"><span class="material-icons text-sm font-bold">delete</span></button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex gap-2 justify-center">
                                                            <button onClick={() => handleEditClick(row)} class="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg transition-all" title="Edit"><span class="material-icons text-sm font-bold">edit</span></button>
                                                            <button onClick={() => handleDeleteClick(row.drawing_pa_id)} class="w-8 h-8 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg transition-all" title="Delete"><span class="material-icons text-sm font-bold">delete</span></button>
                                                        </div>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}

                                {newRows.map((row) => (
                                    <tr key={row.tempId} className="bg-blue-900/10 hover:bg-blue-900/20 transition-colors duration-150 border-l-2 border-l-blue-500">
                                        <td className={tdClass}>New</td>

                                        <td className={tdClass}>
                                            <input
                                                value={row.drawing_name}
                                                onChange={(e) => handleNewRowChange(row.tempId, 'drawing_name', e.target.value)}
                                                className={inputClass}
                                                placeholder="Drawing Name *"
                                            />
                                        </td>

                                        <td className={tdClass}>
                                            <select
                                                value={row.drawing_type}
                                                onChange={(e) =>
                                                    handleNewRowChange(row.tempId, "drawing_type", e.target.value)
                                                }
                                                className={selectClass}
                                            >
                                                <option value="A">ARCHITECTURAL DRAWING</option>
                                                <option value="S">STRUCTURAL DRAWING</option>
                                                <option value="M">MEP DRAWING</option>
                                                <option value="E">ELECTRICAL & PLUMBING DRAWING</option>
                                                <option value="P">PLUMBING DRAWING</option>
                                                <option value="FF">FIRE FIGHTING DRAWING</option>
                                                <option value="ID">INTERIOR DESIGN DRAWING</option>
                                                <option value="IS">INTERIOR SERVICES DRAWING</option>
                                            </select>

                                        </td>

                                        <td className={tdClass}>
                                            <input
                                                type="date"
                                                value={row.planned_date}
                                                onChange={(e) => handleNewRowChange(row.tempId, 'planned_date', e.target.value)}
                                                className={inputClass}
                                            />
                                        </td>

                                        <td className={tdClass}>
                                            <input
                                                type="date"
                                                value={row.received_date}
                                                onChange={(e) => handleNewRowChange(row.tempId, 'received_date', e.target.value)}
                                                className={inputClass}
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

                                        <td className={tdClass}>
                                            <div className="flex gap-2 justify-center">
                                                <button onClick={() => saveNewRow(row)} className="w-8 h-8 rounded-full bg-green-600 hover:bg-green-500 text-white flex items-center justify-center shadow-lg transition-all" title="Create"><span className="material-icons text-sm font-bold">check</span></button>
                                                <button onClick={() => removeNewRow(row.tempId)} className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg transition-all" title="Delete"><span className="material-icons text-sm font-bold">delete</span></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {!loading && rows.length === 0 && newRows.length === 0 && (
                            <div className="p-8 text-center text-gray-400">
                                <p className="mb-4">No records found.</p>
                                {isAdmin && (
                                    <button
                                        onClick={addNewRow}
                                        className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded border border-gray-600"
                                    >
                                        Add First Record
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DrawingPlannedVsAchieved;