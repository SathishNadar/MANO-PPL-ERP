import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../SidebarComponent/sidebar";
import { toast } from "react-toastify";

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:5001';

const DrawingDirectory = () => {
    const navigate = useNavigate();
    const { projectId } = useParams();
    const [drawings, setDrawings] = useState([
        { id: "h1", isHeader: true, title: "ARCHITECTURAL DRAWING" },
        { id: 1, s_no: "A1", drawing_date: "2025-04-08", drawing_title: "GROUND FLOOR PLAN", soft_copy: true, remarks: "FRO" },
        { id: 2, s_no: "A2", drawing_date: "2025-04-08", drawing_title: "1ST FLOOR PLAN", soft_copy: true, remarks: "FRO" },
        { id: 3, s_no: "A3", drawing_date: "2025-04-08", drawing_title: "2nd FLOOR PLAN", soft_copy: true, remarks: "FRO" },
        { id: 4, s_no: "A4", drawing_date: "2025-04-08", drawing_title: "3rd FLOOR PLAN", soft_copy: true, remarks: "FRO" },
        { id: 5, s_no: "A5", drawing_date: "2025-04-08", drawing_title: "4th FLOOR PLAN", soft_copy: true, remarks: "FRO" },
        { id: 6, s_no: "A6", drawing_date: "2025-04-08", drawing_title: "5th FLOOR PLAN", soft_copy: true, remarks: "FRO" },
        { id: 7, s_no: "A7", drawing_date: "2025-04-25", drawing_title: "WORKING OF UGWT", soft_copy: true, remarks: "FRO" },
        { id: 8, s_no: "A8", drawing_date: "2025-04-15", drawing_title: "WORKING DRAWING OF GROUND FLOOR", soft_copy: true, remarks: "FRO" },
        { id: 9, s_no: "A9", drawing_date: "2025-04-14", drawing_title: "WORKING DRAWING OF 1ST FLOOR", soft_copy: true, remarks: "FRO" },
        { id: 10, s_no: "A10", drawing_date: "2025-04-14", drawing_title: "WORKING DRAWING OF 2ND FLOOR", soft_copy: true, remarks: "FRO" },
        { id: 11, s_no: "A11", drawing_date: "2025-04-14", drawing_title: "WORKING DRAWING OF 3RD FLOOR", soft_copy: true, remarks: "FRO" },
        { id: 12, s_no: "A12", drawing_date: "2025-04-14", drawing_title: "WORKING DRAWING OF 4TH FLOOR", soft_copy: true, remarks: "FRO" },
        { id: 13, s_no: "A13", drawing_date: "2025-04-14", drawing_title: "WORKING DRAWING OF 5TH FLOOR", soft_copy: true, remarks: "FRO" },
        { id: 14, s_no: "A14", drawing_date: "2025-04-14", drawing_title: "WORKING DRAWING OF TERRACE FLOOR", soft_copy: true, remarks: "FRO" },
        { id: 15, s_no: "A15", drawing_date: "2025-04-16", drawing_title: "SECTIONS - 1", soft_copy: true, remarks: "FRO" },
        { id: 16, s_no: "A16", drawing_date: "2025-04-19", drawing_title: "SECTIONS - 2", soft_copy: true, remarks: "FRO" },
        { id: 17, s_no: "A17", drawing_date: "2025-04-19", drawing_title: "SECTIONS - 3", soft_copy: true, remarks: "FRO" },
        { id: 18, s_no: "A18", drawing_number: "AW02", drawing_date: "2025-06-23", drawing_title: "LINE OUT DETAIL", soft_copy: true, remarks: "GFC" },
        { id: 19, s_no: "A19", drawing_date: "2025-07-03", drawing_title: "35 KLD STP SITE LAYOUT", soft_copy: true },
        { id: 20, s_no: "A20", drawing_date: "2025-07-03", drawing_title: "35 KLD STP SITE LAYOUT AND SETCION", soft_copy: true },

        { id: "h2", isHeader: true, title: "STRUCTURAL DRAWING" },
        { id: 21, s_no: "S1", drawing_number: "STR-G1", drawing_date: "2024-09-13", drawing_title: "GENERAL NOTES AND ABBREVIATION (Page 1 out of 4)", revision: "R0", soft_copy: true, remarks: "IFC" },
        { id: 22, s_no: "S2", drawing_number: "STR-G2", drawing_date: "2024-09-13", drawing_title: "GENERAL NOTES AND ABBREVIATION (Page 2 out of 4)", revision: "R0", soft_copy: true, remarks: "IFC" },
        { id: 23, s_no: "S3", drawing_number: "STR-G3", drawing_date: "2024-09-13", drawing_title: "GENERAL NOTES AND ABBREVIATION (Page 3 out of 4)", revision: "R0", soft_copy: true, remarks: "IFC" },
    ]);
    const [loading, setLoading] = useState(false);

    // Edit Mode State
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editFormData, setEditFormData] = useState({});

    // New Row State
    const [newRows, setNewRows] = useState([]);

    // Temporary fetch simulation (since backend doesn't exist yet)
    useEffect(() => {
        // Data already seeded
    }, [projectId]);

    const handleEditClick = (drawing) => {
        setEditingId(drawing.id || drawing.tempId);
        setEditFormData({ ...drawing });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditFormData({});
    };

    const handleEditChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setEditFormData({ ...editFormData, [e.target.name]: value });
    };

    const handleSaveEdit = async () => {
        // Mock save for frontend-only
        const updatedDrawings = drawings.map(d =>
            (d.id === editingId || d.tempId === editingId) ? { ...editFormData } : d
        );
        setDrawings(updatedDrawings);
        setEditingId(null);
        setEditFormData({});
        toast.success("Drawing updated (Frontend Only)");
    };

    const handleDeleteClick = (id) => {
        if (window.confirm("Are you sure you want to delete this drawing?")) {
            setDrawings(drawings.filter(d => (d.id || d.tempId) !== id));
            toast.success("Drawing deleted (Frontend Only)");
        }
    };

    // New Rows
    const addNewRow = () => {
        setNewRows([...newRows, {
            tempId: Date.now(),
            s_no: "",
            drawing_number: "",
            drawing_date: "",
            drawing_title: "",
            revision: "",
            received_date: "",
            hard_copy: false,
            soft_copy: false,
            remarks: "",
            file: null
        }]);
        setIsEditMode(true); // Auto-enter edit mode when adding
    };

    const removeNewRow = (tempId) => {
        setNewRows(newRows.filter(row => row.tempId !== tempId));
    };

    const handleNewRowChange = (tempId, field, value) => {
        setNewRows(newRows.map(row => row.tempId === tempId ? { ...row, [field]: value } : row));
    };

    const saveNewRow = async (row) => {
        if (!row.drawing_title) {
            toast.warning("Drawing Title is required");
            return;
        }

        // Move from newRows to drawings
        setDrawings([...drawings, { ...row, id: Date.now() }]); // Mock ID
        setNewRows(newRows.filter(r => r.tempId !== row.tempId));
        toast.success("Drawing added (Frontend Only)");
    };

    // File Upload Handler (Mock)
    const handleFileUpload = async (e, rowId, isNew = false) => {
        const file = e.target.files[0];
        if (!file) return;

        if (isNew) {
            handleNewRowChange(rowId, 'file_name', file.name);
        } else {
            setEditFormData({ ...editFormData, file_name: file.name });
        }
        toast.info("File selected: " + file.name);
    };

    const thClass = "p-2 border border-gray-600 font-semibold tracking-wider text-center text-xs";
    const tdClass = "p-2 border border-gray-600 text-center text-gray-300 align-middle text-sm";
    const inputClass = "w-full bg-transparent border border-transparent hover:border-gray-600 focus:border-blue-500 rounded px-2 py-1 text-white text-center outline-none transition-all duration-200";
    const checkboxClass = "w-5 h-5 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700";

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
                            Drawing Management
                        </h1>
                        <p className="text-[var(--text-secondary)]">
                            Manage project drawings and revisions.
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
                            Add New Drawing
                        </button>
                    </div>
                </header>

                <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-md overflow-hidden pb-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse border border-gray-600 min-w-[1200px]">
                            <thead className="bg-gray-900/50 text-xs uppercase text-gray-400">
                                <tr>
                                    <th className={`${thClass} w-16`}>S. No.</th>
                                    <th className={thClass}>Drawing Number</th>
                                    <th className={thClass}>Drawing Date</th>
                                    <th className={thClass}>Drawing Title</th>
                                    <th className={thClass}>Revision</th>
                                    <th className={thClass}>Received Date</th>
                                    <th className={thClass}>Hard Copy</th>
                                    <th className={thClass}>Soft Copy</th>
                                    <th className={thClass}>Remarks</th>
                                    <th className={thClass}>Uploads</th>
                                    {(isEditMode || newRows.length > 0) && (
                                        <th className={`${thClass} w-24`}>Action</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {drawings.map((drawing, index) => {
                                    if (drawing.isHeader) {
                                        return (
                                            <tr key={index}>
                                                <td colSpan={isEditMode ? 11 : 10} className="p-2 border border-gray-600 font-bold bg-gray-700 text-white text-left pl-4 uppercase tracking-wider">
                                                    {drawing.title}
                                                </td>
                                            </tr>
                                        );
                                    }

                                    const id = drawing.id || drawing.tempId;
                                    const isEditing = editingId === id;

                                    return (
                                        <tr key={id} className="hover:bg-gray-700/30 transition-colors duration-150">
                                            {/* S. No */}
                                            <td className={tdClass}>
                                                {isEditing ? <input name="s_no" value={editFormData.s_no} onChange={handleEditChange} className={inputClass} /> : drawing.s_no}
                                            </td>

                                            {/* Drawing Number */}
                                            <td className={tdClass}>
                                                {isEditing ? <input name="drawing_number" value={editFormData.drawing_number} onChange={handleEditChange} className={inputClass} /> : drawing.drawing_number}
                                            </td>

                                            {/* Drawing Date */}
                                            <td className={tdClass}>
                                                {isEditing ? <input type="date" name="drawing_date" value={editFormData.drawing_date} onChange={handleEditChange} className={inputClass} /> : drawing.drawing_date}
                                            </td>

                                            {/* Title */}
                                            <td className={tdClass}>
                                                {isEditing ? <input name="drawing_title" value={editFormData.drawing_title} onChange={handleEditChange} className={inputClass} /> : drawing.drawing_title}
                                            </td>

                                            {/* Revision */}
                                            <td className={tdClass}>
                                                {isEditing ? <input name="revision" value={editFormData.revision} onChange={handleEditChange} className={inputClass} /> : drawing.revision}
                                            </td>

                                            {/* Received Date */}
                                            <td className={tdClass}>
                                                {isEditing ? <input type="date" name="received_date" value={editFormData.received_date} onChange={handleEditChange} className={inputClass} /> : drawing.received_date}
                                            </td>

                                            {/* Hard Copy */}
                                            <td className={tdClass}>
                                                {isEditing ?
                                                    <input type="checkbox" name="hard_copy" checked={editFormData.hard_copy || false} onChange={handleEditChange} className={checkboxClass} />
                                                    : (drawing.hard_copy ? "✅" : "")}
                                            </td>

                                            {/* Soft Copy */}
                                            <td className={tdClass}>
                                                {isEditing ?
                                                    <input type="checkbox" name="soft_copy" checked={editFormData.soft_copy || false} onChange={handleEditChange} className={checkboxClass} />
                                                    : (drawing.soft_copy ? "✅" : "")}
                                            </td>

                                            {/* Remarks */}
                                            <td className={tdClass}>
                                                {isEditing ? <textarea rows={1} name="remarks" value={editFormData.remarks} onChange={handleEditChange} className={inputClass} /> : drawing.remarks}
                                            </td>

                                            {/* Uploads */}
                                            <td className={tdClass}>
                                                {isEditing ? (
                                                    <div className="flex flex-col gap-1 items-center">
                                                        <span className="text-xs text-gray-400 truncate max-w-[100px]">{editFormData.file_name || "No file"}</span>
                                                        <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white text-[10px] px-2 py-1 rounded">
                                                            Upload
                                                            <input type="file" className="hidden" accept=".pdf,.jpg,.png" onChange={(e) => handleFileUpload(e, id)} />
                                                        </label>
                                                    </div>
                                                ) : (
                                                    drawing.file_name ?
                                                        <a href="#" className="text-blue-400 hover:text-blue-300 underline text-xs" onClick={(e) => { e.preventDefault(); toast.info("Download link would go here"); }}>
                                                            {drawing.file_name}
                                                        </a> :
                                                        <span className="text-gray-500">-</span>
                                                )}
                                            </td>

                                            {(isEditMode || newRows.length > 0) && (
                                                <td className={tdClass}>
                                                    {isEditing ? (
                                                        <div className="flex gap-2 justify-center">
                                                            <button onClick={handleSaveEdit} className="text-green-500 hover:text-green-400"><span className="material-icons">check_circle</span></button>
                                                            <button onClick={handleCancelEdit} className="text-gray-400 hover:text-gray-300"><span className="material-icons">cancel</span></button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex gap-2 justify-center">
                                                            <button onClick={() => handleEditClick(drawing)} className="text-blue-500 hover:text-blue-400"><span className="material-icons">edit</span></button>
                                                            <button onClick={() => handleDeleteClick(id)} className="text-red-500 hover:text-red-400"><span className="material-icons">delete</span></button>
                                                        </div>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}

                                {/* New Rows */}
                                {newRows.map((row) => (
                                    <tr key={row.tempId} className="bg-blue-900/10 hover:bg-blue-900/20 transition-colors duration-150 border-l-2 border-l-blue-500">
                                        <td className={tdClass}>New</td>
                                        <td className={tdClass}>
                                            <input value={row.drawing_number} onChange={(e) => handleNewRowChange(row.tempId, 'drawing_number', e.target.value)} className={inputClass} placeholder="No." />
                                        </td>
                                        <td className={tdClass}>
                                            <input type="date" value={row.drawing_date} onChange={(e) => handleNewRowChange(row.tempId, 'drawing_date', e.target.value)} className={inputClass} />
                                        </td>
                                        <td className={tdClass}>
                                            <input value={row.drawing_title} onChange={(e) => handleNewRowChange(row.tempId, 'drawing_title', e.target.value)} className={inputClass} placeholder="Title" />
                                        </td>
                                        <td className={tdClass}>
                                            <input value={row.revision} onChange={(e) => handleNewRowChange(row.tempId, 'revision', e.target.value)} className={inputClass} placeholder="Rev" />
                                        </td>
                                        <td className={tdClass}>
                                            <input type="date" value={row.received_date} onChange={(e) => handleNewRowChange(row.tempId, 'received_date', e.target.value)} className={inputClass} />
                                        </td>
                                        <td className={tdClass}>
                                            <input type="checkbox" checked={row.hard_copy} onChange={(e) => handleNewRowChange(row.tempId, 'hard_copy', e.target.checked)} className={checkboxClass} />
                                        </td>
                                        <td className={tdClass}>
                                            <input type="checkbox" checked={row.soft_copy} onChange={(e) => handleNewRowChange(row.tempId, 'soft_copy', e.target.checked)} className={checkboxClass} />
                                        </td>
                                        <td className={tdClass}>
                                            <textarea rows={1} value={row.remarks} onChange={(e) => handleNewRowChange(row.tempId, 'remarks', e.target.value)} className={inputClass} placeholder="Remarks..." />
                                        </td>
                                        <td className={tdClass}>
                                            <div className="flex flex-col gap-1 items-center">
                                                <span className="text-xs text-gray-400 truncate max-w-[100px]">{row.file_name || "No file"}</span>
                                                <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white text-[10px] px-2 py-1 rounded">
                                                    Upload
                                                    <input type="file" className="hidden" accept=".pdf,.jpg,.png" onChange={(e) => handleFileUpload(e, row.tempId, true)} />
                                                </label>
                                            </div>
                                        </td>
                                        <td className={tdClass}>
                                            <div className="flex gap-2 justify-center">
                                                <button onClick={() => saveNewRow(row)} className="text-green-500 hover:text-green-400"><span className="material-icons">check_circle</span></button>
                                                <button onClick={() => removeNewRow(row.tempId)} className="text-red-500 hover:text-red-400"><span className="material-icons">delete</span></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {!loading && drawings.length === 0 && newRows.length === 0 && (
                            <div className="p-8 text-center text-gray-400">
                                <p className="mb-4">No drawings found.</p>
                                <button onClick={addNewRow} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded border border-gray-600">
                                    Add First Drawing
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DrawingDirectory;
