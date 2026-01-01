import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../SidebarComponent/sidebar";
import { toast } from "react-toastify";
import { createPortal } from "react-dom";
const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:5001';

const DrawingDirectory = () => {
    const navigate = useNavigate();
    const { projectId } = useParams();
    const [drawings, setDrawings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewerFile, setViewerFile] = useState(null);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [selectedRevision, setSelectedRevision] = useState(null);
    const [revisionAnchorEl, setRevisionAnchorEl] = useState(null);
    const PortalPopover = ({ children, anchorEl, isOpen, onClose }) => {
        if (!isOpen || !anchorEl) return null;

        const rect = anchorEl.getBoundingClientRect();
        const style = {
            position: 'absolute',
            left: rect.left + window.scrollX,
            top: rect.bottom + window.scrollY + 5,
            transform: 'translateX(-50%)',
            zIndex: 9999,
            maxWidth: '500px',
            width: 'max-content',
            minWidth: '400px',
        };

        return createPortal(
            <>
                <div
                    style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
                    onClick={onClose}
                />
                <div
                    style={style}
                    className="bg-gray-800 rounded-lg shadow-2xl border-2 border-blue-500"
                    onClick={e => e.stopPropagation()}
                >
                    {children}
                </div>
            </>,
            document.body
        );
    };

    useEffect(() => {
        const session = localStorage.getItem("session");
        if (session) {
            const sessionData = JSON.parse(session);
            setIsAdmin(sessionData.title_id === 2);
        }
    }, []);



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

    const getFileType = (url) => {
        if (!url) return null;
        const ext = url.split('.').pop()?.toLowerCase();

        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
        if (['pdf'].includes(ext)) return 'pdf';
        if (['dwg', 'dxf'].includes(ext)) return 'cad';

        return 'other';
    };


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

    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    const [newRows, setNewRows] = useState([]);
    const [fileUploads, setFileUploads] = useState({});

    // Missing state variables added
    const [showRevisionHistory, setShowRevisionHistory] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const [revisionHistory, setRevisionHistory] = useState([]);
    const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);


    const transformDrawings = (data) => {
        if (!data || data.length === 0) return [];

        const grouped = {};
        data.forEach(drawing => {
            const type = drawing.drawing_type || "OTHER";
            if (!grouped[type]) {
                grouped[type] = [];
            }
            grouped[type].push({
                id: drawing.drawing_id,
                s_no: drawing.drawing_no || "",
                drawing_number: drawing.drawing_no || "",
                drawing_date: drawing.drawing_date || "",
                drawing_title: drawing.drawing_title || "",
                revision: drawing.revision ? `R${drawing.revision}` : "R0",
                revision_num: drawing.revision || 1,
                received_date: drawing.received_date || "",
                hard_copy: drawing.hard_copy || 0,
                soft_copy: drawing.soft_copy === 1,
                remarks: drawing.remarks || "",
                file_name: drawing.drawing_key || null,
                preview_url: drawing.preview_url || null,
                download_url: drawing.download_url || null,
                drawing_type: drawing.drawing_type || "OTHER"
            });
        });

        const result = [];
        let serialNumber = 1;

        const typeOrder = [
            'ARCHITECTURAL DRAWING',
            'STRUCTURAL DRAWING',
            'MEP DRAWING',
            'CIVIL DRAWING',
            'OTHER'
        ];

        // Sort by custom order, putting OTHER last
        const sortedTypes = Object.keys(grouped).sort((a, b) => {
            const indexA = typeOrder.indexOf(a);
            const indexB = typeOrder.indexOf(b);

            // If type not in order array, put it before OTHER
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
            grouped[type].forEach(drawing => {
                result.push({
                    ...drawing,
                    serial_no: serialNumber++
                });
            });
        });

        return result;
    };

    const fetchDrawings = async () => {
        if (!projectId) return;

        try {
            setLoading(true);
            const response = await fetch(`${API_BASE}/projectDrawings/drawings/${projectId}`, {
                credentials: 'include'
            });

            if (handleAuthError(response)) {
                return;
            }

            if (!response.ok) {
                throw new Error(`Failed to fetch drawings: ${response.status}`);
            }

            const result = await response.json();
            if (result.ok && result.data) {
                const transformed = transformDrawings(result.data);
                setDrawings(transformed);
            } else {
                setDrawings([]);
            }
        } catch (error) {
            console.error("Error fetching drawings:", error);
            toast.error("Failed to load drawings");
            setDrawings([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (projectId) {
            fetchDrawings();
        }
    }, [projectId]);

    const handleEditClick = (drawing) => {
        if (!isAdmin) {
            toast.warning("Only administrators can edit drawings");
            return;
        }
        if (drawing.isHeader) return;
        setEditingId(drawing.id || drawing.tempId);
        setEditFormData({
            ...drawing,
            drawing_no: drawing.drawing_no || drawing.drawing_number || drawing.s_no || '',
            drawing_number: drawing.drawing_number || drawing.s_no || drawing.drawing_no || '',
            drawing_type: drawing.drawing_type || 'OTHER',
            revision: '',
            hard_copy: drawing.hard_copy || 0
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditFormData({});
    };

    const handleEditChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked :
            e.target.type === 'number' ? parseInt(e.target.value) || 0 :
                e.target.value;
        const updates = { [e.target.name]: value };

        if (e.target.name === 'drawing_number' || e.target.name === 's_no') {
            updates.drawing_no = value;
            updates.drawing_number = value;
            updates.s_no = value;
        }

        setEditFormData({ ...editFormData, ...updates });
    };

    const handleSaveEdit = async () => {
        if (!isAdmin) {
            toast.warning("Only administrators can save changes");
            return;
        }
        if (!editingId || editingId.toString().startsWith('header-')) return;

        try {
            const formData = new FormData();
            formData.append('drawing_no', editFormData.drawing_no || editFormData.s_no || editFormData.drawing_number || '');
            formData.append('drawing_date', editFormData.drawing_date || '');
            formData.append('drawing_title', editFormData.drawing_title || '');
            formData.append('drawing_type', editFormData.drawing_type || 'OTHER');
            formData.append('hard_copy', editFormData.hard_copy || '0');
            formData.append('soft_copy', editFormData.soft_copy ? '1' : '0');
            formData.append('remarks', editFormData.remarks || '');

            if (editFormData.file) {
                formData.append('file', editFormData.file);
            }

            const response = await fetch(`${API_BASE}/projectDrawings/update/${editingId}`, {
                method: 'PUT',
                credentials: 'include',
                body: formData
            });

            if (handleAuthError(response)) {
                return;
            }

            const result = await response.json();
            if (result.ok) {
                toast.success("Drawing updated successfully");
                await fetchDrawings();
                setEditingId(null);
                setEditFormData({});
            } else {
                toast.error(result.message || "Failed to update drawing");
            }
        } catch (error) {
            console.error("Error updating drawing:", error);
            toast.error("Failed to update drawing");
        }
    };

    const handleDeleteClick = async (id) => {
        if (!isAdmin) {
            toast.warning("Only administrators can delete drawings");
            return;
        }
        if (id.toString().startsWith('header-')) return;

        if (!window.confirm("Are you sure you want to delete this drawing?")) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/projectDrawings/delete/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (handleAuthError(response)) {
                return;
            }

            const result = await response.json();
            if (result.ok) {
                toast.success("Drawing deleted successfully");
                await fetchDrawings();
            } else {
                toast.error(result.message || "Failed to delete drawing");
            }
        } catch (error) {
            console.error("Error deleting drawing:", error);
            toast.error("Failed to delete drawing");
        }
    };

    const addNewRow = () => {
        if (!isAdmin) {
            toast.warning("Only administrators can add new drawings");
            return;
        }
        const tempId = Date.now();
        setNewRows([...newRows, {
            tempId,
            drawing_number: "",
            drawing_date: "",
            drawing_title: "",
            drawing_type: "ARCHITECTURAL DRAWING",
            revision: "R0",
            received_date: "",
            hard_copy: 0,
            soft_copy: false,
            remarks: "",
            file: null
        }]);
        setIsEditMode(true);
    };

    const removeNewRow = (tempId) => {
        setNewRows(newRows.filter(row => row.tempId !== tempId));
    };

    const handleNewRowChange = (tempId, field, value) => {
        setNewRows(prevRows => prevRows.map(row => row.tempId === tempId ? { ...row, [field]: value } : row));
    };

    const saveNewRow = async (row) => {
        if (!isAdmin) {
            toast.warning("Only administrators can save new drawings");
            return;
        }
        if (!row.drawing_title) {
            toast.warning("Drawing Title is required");
            return;
        }

        if (!projectId) {
            toast.error("Project ID is missing");
            return;
        }

        try {
            const formData = new FormData();
            formData.append('drawing_date', row.drawing_date || '');
            formData.append('drawing_title', row.drawing_title);
            formData.append('drawing_type', row.drawing_type || 'OTHER');
            formData.append('received_date', row.received_date || '');
            formData.append('hard_copy', row.hard_copy || '0');
            formData.append('soft_copy', row.soft_copy ? '1' : '0');
            formData.append('remarks', row.remarks || '');

            if (fileUploads[row.tempId]) {
                formData.append('file', fileUploads[row.tempId]);
            }

            const response = await fetch(`${API_BASE}/projectDrawings/add/${projectId}`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            if (handleAuthError(response)) {
                return;
            }

            const result = await response.json();
            if (result.ok) {
                toast.success("Drawing added successfully");
                setNewRows(newRows.filter(r => r.tempId !== row.tempId));
                delete fileUploads[row.tempId];
                await fetchDrawings();
            } else {
                toast.error(result.message || "Failed to add drawing");
            }
        } catch (error) {
            console.error("Error adding drawing:", error);
            toast.error("Failed to add drawing");
        }
    };

    const handleFileUpload = async (e, rowId, isNew = false) => {
        const file = e.target.files[0];
        if (!file) return;

        if (isNew) {
            setFileUploads({ ...fileUploads, [rowId]: file });
            handleNewRowChange(rowId, 'file_name', file.name);
            handleNewRowChange(rowId, 'soft_copy', true);
        } else {
            setEditFormData({ ...editFormData, file: file, file_name: file.name, soft_copy: true });
        }
        toast.info("File selected: " + file.name);
    };

    const handleEditModeToggle = () => {
        if (!isAdmin) {
            toast.warning("Only administrators can edit drawings");
            return;
        }
        setIsEditMode(!isEditMode);
    };

    // Replace fetchRevisions with:
    // Replace fetchRevisions with:
    const fetchRevisionHistory = async (drawingId) => {
        try {
            setLoadingHistory(true);
            const response = await fetch(`${API_BASE}/projectDrawings/revision-history/${drawingId}`, {
                credentials: 'include'
            });

            if (handleAuthError(response)) {
                return;
            }

            if (!response.ok) {
                throw new Error(`Failed to fetch revision history: ${response.status}`);
            }

            const result = await response.json();
            if (result.ok && result.data) {
                // Ensure data is an array
                const history = Array.isArray(result.data) ? result.data : [result.data];
                setRevisionHistory(history);
                setSelectedHistoryItem(history[0] || null);
            } else {
                setRevisionHistory([]);
            }
        } catch (error) {
            console.error("Error fetching revision:", error);
            toast.error("Failed to load revision details");
            setRevisionHistory([]);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleRevisionClick = async (drawing, event) => {
        if (!isAdmin) {
            toast.info("Only administrators can view revision history");
            return;
        }

        if (drawing.isHeader) return;

        setRevisionAnchorEl(event.currentTarget);
        setShowRevisionHistory(true);
        await fetchRevisionHistory(drawing.id);
    };

    const thClass = "p-2 border border-gray-600 font-semibold tracking-wider text-center text-xs";
    const tdClass = "p-2 border border-gray-600 text-center text-gray-300 align-middle text-sm";
    const inputClass = "w-full bg-transparent border border-transparent hover:border-gray-600 focus:border-blue-500 rounded px-2 py-1 text-white text-center outline-none transition-all duration-200";
    const selectClass = "w-full bg-gray-700 border border-gray-600 hover:border-blue-500 focus:border-blue-500 rounded px-2 py-1 text-white text-center outline-none cursor-pointer transition-all duration-200";

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
                                    Add New Drawing
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

                {/* Admin Status Banner */}
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
                        <table className="w-full text-left border-collapse border border-gray-600 min-w-[1200px]">
                            <thead className="bg-gray-900/50 text-xs uppercase text-gray-400">
                                <tr>
                                    <th className={`${thClass} w-16`}>S. No.</th>
                                    <th className={thClass}>Drawing Number</th>
                                    <th className={thClass}>Drawing Date</th>
                                    <th className={thClass}>Drawing Title</th>
                                    {isEditMode && <th className={thClass}>Type</th>}
                                    <th className={thClass}>Revision</th>
                                    <th className={thClass}>Received Date</th>
                                    <th className={thClass}>Hard Copy</th>
                                    <th className={thClass}>Soft Copy</th>
                                    <th className={thClass}>Remarks</th>
                                    {(isEditMode || newRows.length > 0) && isAdmin && (
                                        <th className={`${thClass} w-24`}>Action</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {drawings.map((drawing, index) => {
                                    if (drawing.isHeader) {
                                        const colCount = 9 + (isEditMode ? 1 : 0) + ((isEditMode || newRows.length > 0) && isAdmin ? 1 : 0);
                                        return (
                                            <tr key={index}>
                                                <td colSpan={colCount} className="p-2 border border-gray-600 font-bold bg-gray-700 text-white text-left pl-4 uppercase tracking-wider">
                                                    {drawing.title}
                                                </td>
                                            </tr>
                                        );
                                    }

                                    const id = drawing.id || drawing.tempId;
                                    const isEditing = editingId === id;

                                    return (
                                        <tr key={id} className="hover:bg-gray-700/30 transition-colors duration-150">
                                            <td className={tdClass}>
                                                {drawing.serial_no || '-'}
                                            </td>

                                            <td className={tdClass}>
                                                {isEditing ? <input name="drawing_number" value={editFormData.drawing_number || editFormData.drawing_no || editFormData.s_no || ''} onChange={handleEditChange} className={inputClass} /> : (drawing.drawing_number || drawing.s_no || '')}
                                            </td>

                                            <td className={tdClass}>
                                                {isEditing ? <input type="date" name="drawing_date" value={editFormData.drawing_date} onChange={handleEditChange} className={inputClass} /> : formatDate(drawing.drawing_date)}
                                            </td>

                                            <td className={tdClass}>
                                                {isEditing ? <input name="drawing_title" value={editFormData.drawing_title} onChange={handleEditChange} className={inputClass} /> : drawing.drawing_title}
                                            </td>

                                            {isEditMode && (
                                                <td className={tdClass}>
                                                    {isEditing ? (
                                                        <select name="drawing_type" value={editFormData.drawing_type || 'OTHER'} onChange={handleEditChange} className={selectClass}>
                                                            <option value="ARCHITECTURAL DRAWING">ARCHITECTURAL DRAWING</option>
                                                            <option value="STRUCTURAL DRAWING">STRUCTURAL DRAWING</option>
                                                            <option value="MEP DRAWING">MEP DRAWING</option>
                                                            <option value="CIVIL DRAWING">CIVIL DRAWING</option>
                                                            <option value="OTHER">OTHERS</option>
                                                        </select>
                                                    ) : (
                                                        <span>{drawing.drawing_type || 'OTHER'}</span>
                                                    )}
                                                </td>
                                            )}
                                            <td className={tdClass}>
                                                {isEditing ? (
                                                    <input
                                                        name="revision"
                                                        value={editFormData.revision}
                                                        onChange={handleEditChange}
                                                        className={inputClass}
                                                        placeholder="Auto (R1→R2)"
                                                    />
                                                ) : (
                                                    isAdmin ? (
                                                        <button
                                                            onClick={(e) => handleRevisionClick(drawing, e)}
                                                            className="relative cursor-pointer hover:bg-blue-600 hover:text-white px-3 py-1 rounded transition-colors duration-200 font-semibold"
                                                            title="Click to view revision details"
                                                        >
                                                            {drawing.revision}
                                                        </button>
                                                    ) : (
                                                        <span className="px-3 py-1 font-semibold text-gray-300">
                                                            {drawing.revision}
                                                        </span>
                                                    )
                                                )}
                                            </td>

                                            <td className={tdClass}>
                                                {isEditing ? <input type="date" name="received_date" value={editFormData.received_date} onChange={handleEditChange} className={inputClass} /> : formatDate(drawing.received_date)}
                                            </td>

                                            <td className={tdClass}>
                                                {isEditing ? (
                                                    <input
                                                        type="number"
                                                        name="hard_copy"
                                                        value={editFormData.hard_copy || 0}
                                                        onChange={handleEditChange}
                                                        className={inputClass}
                                                        min="0"
                                                        placeholder="0"
                                                    />
                                                ) : (drawing.hard_copy || 0)}
                                            </td>

                                            <td className={tdClass}>
                                                {isEditing ? (
                                                    <div className="flex flex-col gap-1 items-center">
                                                        <span className="text-xs text-gray-400 truncate max-w-[100px]">
                                                            {editFormData.file_name || (drawing.file_name || "No file")}
                                                        </span>
                                                        <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white text-[10px] px-2 py-1 rounded">
                                                            Upload
                                                            <input
                                                                type="file"
                                                                className="hidden"
                                                                accept=".pdf,.jpg,.jpeg,.png,.dwg,.dxf"
                                                                onChange={(e) => handleFileUpload(e, id)}
                                                            />
                                                        </label>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col gap-1 items-center">
                                                        {drawing.preview_url ? (
                                                            <button
                                                                onClick={() => {
                                                                    setViewerFile(drawing.preview_url);
                                                                    setDownloadUrl(drawing.download_url || drawing.preview_url);
                                                                    setZoomLevel(1);
                                                                    setPan({ x: 0, y: 0 });
                                                                }}
                                                                className="text-whit-600 hover:text-blue-500 hover:underline text-[10px] px-3 py-1 flex items-center gap-1"
                                                            >
                                                                View File
                                                            </button>
                                                        ) : (
                                                            <span className="text-gray-500 text-xs">No file</span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>

                                            <td className={tdClass}>
                                                {isEditing ? <textarea rows={1} name="remarks" value={editFormData.remarks} onChange={handleEditChange} className={inputClass} /> : drawing.remarks}
                                            </td>

                                            {
                                                (isEditMode || newRows.length > 0) && isAdmin && (
                                                    <td className={tdClass}>
                                                        {isEditing ? (
                                                            <div className="flex gap-2 justify-center">
                                                                <button onClick={handleSaveEdit} class="w-8 h-8 rounded-full bg-green-600 hover:bg-green-500 text-white flex items-center justify-center shadow-lg transition-all" title="Update"><span class="material-icons text-sm font-bold">check</span></button>
                                                                <button onClick={handleCancelEdit} class="w-8 h-8 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg transition-all" title="Cancel"><span class="material-icons text-sm font-bold">close</span></button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex gap-2 justify-center">
                                                                <button onClick={() => handleEditClick(drawing)} class="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg transition-all" title="Edit"><span class="material-icons text-sm font-bold">edit</span></button>
                                                                <button onClick={() => handleDeleteClick(id)} class="w-8 h-8 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg transition-all" title="Delete"><span class="material-icons text-sm font-bold">delete</span></button>
                                                            </div>
                                                        )}
                                                    </td>
                                                )
                                            }
                                        </tr>
                                    );
                                })}

                                {/* New Rows */}
                                {newRows.map((row) => (
                                    <tr key={row.tempId} className="bg-blue-900/10 hover:bg-blue-900/20 transition-colors duration-150 border-l-2 border-l-blue-500">
                                        <td className={tdClass}>New</td>
                                        <td className={tdClass}>
                                            <span className="text-gray-400 text-xs italic">Auto (A1, S1, etc.)</span>
                                        </td>
                                        <td className={tdClass}>
                                            <input type="date" value={row.drawing_date} onChange={(e) => handleNewRowChange(row.tempId, 'drawing_date', e.target.value)} className={inputClass} />
                                        </td>
                                        <td className={tdClass}>
                                            <input value={row.drawing_title} onChange={(e) => handleNewRowChange(row.tempId, 'drawing_title', e.target.value)} className={inputClass} placeholder="Title *" />
                                        </td>
                                        <td className={tdClass}>
                                            <select value={row.drawing_type || 'OTHER'} onChange={(e) => handleNewRowChange(row.tempId, 'drawing_type', e.target.value)} className={selectClass}>
                                                <option value="ARCHITECTURAL DRAWING">Architectural</option>
                                                <option value="STRUCTURAL DRAWING">Structural</option>
                                                <option value="MEP DRAWING">MEP</option>
                                                <option value="CIVIL DRAWING">Civil</option>
                                                <option value="OTHER">Other</option>
                                            </select>
                                        </td>
                                        <td className={tdClass}>
                                            <span className="text-gray-400 text-xs italic">R0 (Auto)</span>
                                        </td>
                                        <td className={tdClass}>
                                            <input type="date" value={row.received_date} onChange={(e) => handleNewRowChange(row.tempId, 'received_date', e.target.value)} className={inputClass} />
                                        </td>
                                        <td className={tdClass}>
                                            <input
                                                type="number"
                                                value={row.hard_copy || 0}
                                                onChange={(e) => handleNewRowChange(row.tempId, 'hard_copy', parseInt(e.target.value) || 0)}
                                                className={inputClass}
                                                min="0"
                                                placeholder="0"
                                            />
                                        </td>
                                        <td className={tdClass}>
                                            <div className="flex flex-col gap-1 items-center">
                                                <span className="text-xs text-gray-400 truncate max-w-[100px]">{row.file_name || "No file"}</span>
                                                <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white text-[10px] px-2 py-1 rounded">
                                                    Upload
                                                    <input type="file" className="hidden" accept=".pdf,.jpg,.png,.dwg,.dxf" onChange={(e) => handleFileUpload(e, row.tempId, true)} />
                                                </label>
                                            </div>
                                        </td>
                                        <td className={tdClass}>
                                            <textarea rows={1} value={row.remarks} onChange={(e) => handleNewRowChange(row.tempId, 'remarks', e.target.value)} className={inputClass} placeholder="Remarks..." />
                                        </td>
                                        <td className={tdClass}>
                                            <div className="flex gap-2 justify-center">
                                                <button onClick={() => saveNewRow(row)} class="w-8 h-8 rounded-full bg-green-600 hover:bg-green-500 text-white flex items-center justify-center shadow-lg transition-all" title="Create"><span class="material-icons text-sm font-bold">check</span></button>
                                                <button onClick={() => removeNewRow(row.tempId)} class="w-8 h-8 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg transition-all" title="Delete"><span class="material-icons text-sm font-bold">delete</span></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {!loading && drawings.length === 0 && newRows.length === 0 && (
                            <div className="p-8 text-center text-gray-400">
                                <p className="mb-4">No drawings found.</p>
                                {isAdmin && (
                                    <button onClick={addNewRow} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded border border-gray-600">
                                        Add First Drawing
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main >
            <PortalPopover
                anchorEl={revisionAnchorEl}
                isOpen={showRevisionHistory}
                onClose={() => {
                    setShowRevisionHistory(false);
                    setRevisionHistory([]);
                    setRevisionAnchorEl(null);
                }}
            >
                {/* Header */}
                <div className="flex justify-between items-center px-4 py-3 border-b border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800 rounded-t-lg">
                    <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                        <span className="material-icons text-blue-400 text-base">history</span>
                        Revision History
                    </h3>
                    <button
                        className="text-gray-400 hover:text-white transition-colors"
                        onClick={() => {
                            setShowRevisionHistory(false);
                            setRevisionHistory([]);
                            setSelectedHistoryItem(null);
                            setRevisionAnchorEl(null);
                        }}
                    >
                        <span className="material-icons text-base">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 w-96">
                    {loadingHistory ? (
                        <div className="text-center text-gray-400 py-6 flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                            <span className="text-sm">Loading history...</span>
                        </div>
                    ) : revisionHistory.length === 0 ? (
                        <div className="text-center text-gray-400 py-6 flex flex-col items-center gap-2">
                            <span className="material-icons text-3xl text-gray-600">history_toggle_off</span>
                            <p className="text-sm">No revision history found</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Dropdown Selector */}
                            <div className="relative">
                                <label className="text-xs text-gray-500 mb-1 block uppercase tracking-wider font-semibold">Select Revision</label>
                                <select
                                    value={selectedHistoryItem?.drawing_id || ''}
                                    onChange={(e) => {
                                        const selected = revisionHistory.find(r => r.drawing_id === parseInt(e.target.value));
                                        setSelectedHistoryItem(selected || null);
                                    }}
                                    className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white focus:border-blue-500 focus:outline-none appearance-none cursor-pointer"
                                >
                                    {revisionHistory.map((rev) => (
                                        <option key={rev.drawing_id} value={rev.drawing_id}>
                                            Revision R{rev.revision} {rev.revision === Math.max(...revisionHistory.map(r => r.revision)) ? '(Latest)' : ''}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-[26px] pointer-events-none text-gray-400">
                                    <span className="material-icons text-sm">arrow_drop_down</span>
                                </div>
                            </div>

                            {selectedHistoryItem && (
                                <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700 animate-fade-in">
                                    {/* Selected Details */}
                                    <div className="flex items-center justify-between pb-2 border-b border-gray-700 mb-3">
                                        <span className={`font-bold text-lg ${selectedHistoryItem.revision === Math.max(...revisionHistory.map(r => r.revision)) ? 'text-green-400' : 'text-blue-400'}`}>
                                            R{selectedHistoryItem.revision}
                                        </span>
                                        <span className="text-xs text-gray-500">{formatDate(selectedHistoryItem.updated_at)}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm mb-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase text-gray-500 tracking-wider">Drawing No</span>
                                            <span className="text-gray-300 font-medium">{selectedHistoryItem.drawing_no}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase text-gray-500 tracking-wider">Drawing Date</span>
                                            <span className="text-gray-300">{formatDate(selectedHistoryItem.drawing_date)}</span>
                                        </div>
                                        <div className="flex flex-col col-span-2">
                                            <span className="text-[10px] uppercase text-gray-500 tracking-wider">Title</span>
                                            <span className="text-gray-300">{selectedHistoryItem.drawing_title}</span>
                                        </div>
                                        <div className="flex flex-col col-span-2">
                                            <span className="text-[10px] uppercase text-gray-500 tracking-wider">Remarks</span>
                                            <span className="text-gray-400 italic text-xs">{selectedHistoryItem.remarks || 'No remarks'}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {selectedHistoryItem.drawing_key ? (
                                        <div className="flex gap-2 pt-2 border-t border-gray-700/50">
                                            <button
                                                onClick={() => {
                                                    setViewerFile(selectedHistoryItem.preview_url);
                                                    setDownloadUrl(selectedHistoryItem.download_url || selectedHistoryItem.preview_url);
                                                    setZoomLevel(1);
                                                    setPan({ x: 0, y: 0 });
                                                    setShowRevisionHistory(false);
                                                }}
                                                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20"
                                            >
                                                <span className="material-icons text-base">visibility</span>
                                                View
                                            </button>
                                            {selectedHistoryItem.download_url && (
                                                <a
                                                    href={selectedHistoryItem.download_url}
                                                    download
                                                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 hover:text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-2 transition-colors border border-gray-600"
                                                >
                                                    <span className="material-icons text-base">download</span>
                                                    Download
                                                </a>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center text-xs text-gray-500 py-2 bg-gray-900/30 rounded border border-gray-800 border-dashed">
                                            No file attached
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </PortalPopover>


            {/* File Viewer Modal */}
            {
                viewerFile && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm p-4"
                        onClick={() => {
                            setViewerFile(null);
                            setDownloadUrl(null);
                            setZoomLevel(1);
                            setPan({ x: 0, y: 0 });
                        }}
                    >
                        <div
                            className="bg-gray-900 rounded-xl shadow-2xl border border-gray-700 flex flex-col w-full max-w-7xl"
                            style={{ height: '90vh' }}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900 flex-shrink-0">
                                <h3 className="text-white font-semibold text-xl flex items-center gap-3">
                                    <span className="material-icons text-blue-400">description</span>
                                    File Preview
                                </h3>

                                <div className="flex gap-3 items-center">
                                    {/* Zoom Controls (Images only) */}
                                    {/\.(jpg|jpeg|png|gif|webp)$/i.test(viewerFile) && (
                                        <div className="flex items-center gap-2 mr-4 bg-gray-800 rounded-lg p-1 border border-gray-700">
                                            <button
                                                className="p-1 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors"
                                                onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                                                title="Zoom Out"
                                            >
                                                <span className="material-icons text-lg">remove</span>
                                            </button>
                                            <span className="text-xs text-gray-400 w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                                            <button
                                                className="p-1 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors"
                                                onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
                                                title="Zoom In"
                                            >
                                                <span className="material-icons text-lg">add</span>
                                            </button>
                                            <button
                                                className="p-1 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors ml-1"
                                                onClick={() => {
                                                    setZoomLevel(1);
                                                    setPan({ x: 0, y: 0 });
                                                }}
                                                title="Reset Zoom & Pan"
                                            >
                                                <span className="material-icons text-lg">restart_alt</span>
                                            </button>
                                        </div>
                                    )}

                                    {downloadUrl && (
                                        <a
                                            href={downloadUrl}
                                            download
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                                        >
                                            <span className="material-icons text-sm">download</span>
                                            Download
                                        </a>
                                    )}

                                    <button
                                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                                        onClick={() => {
                                            setViewerFile(null);
                                            setDownloadUrl(null);
                                            setZoomLevel(1);
                                            setPan({ x: 0, y: 0 });
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

                            {/* Body - Image or PDF */}
                            <div
                                className={`bg-black/50 p-4 overflow-hidden select-none ${zoomLevel > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minHeight: 0
                                }}
                                onMouseDown={(e) => {
                                    if (zoomLevel > 1) {
                                        setIsDragging(true);
                                        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
                                    }
                                }}
                                onMouseMove={(e) => {
                                    if (isDragging && zoomLevel > 1) {
                                        e.preventDefault();
                                        setPan({
                                            x: e.clientX - dragStart.x,
                                            y: e.clientY - dragStart.y
                                        });
                                    }
                                }}
                                onMouseUp={() => setIsDragging(false)}
                                onMouseLeave={() => setIsDragging(false)}
                            >
                                {(() => {
                                    // Extract file path without query parameters
                                    const filePath = viewerFile.split('?')[0];

                                    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(filePath)) {
                                        return (
                                            <img
                                                src={viewerFile}
                                                alt="Preview"
                                                className="rounded-lg shadow-lg"
                                                style={{
                                                    maxWidth: '100%',
                                                    maxHeight: '100%',
                                                    objectFit: 'contain',
                                                    transform: zoomLevel > 1 ? `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})` : 'none',
                                                    transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                                                    transformOrigin: 'center center'
                                                }}
                                                draggable={false}
                                            />
                                        );
                                    }
                                    else if (/\.(dxf)$/i.test(filePath) || /\.(dwg)$/i.test(filePath)) {
                                        return (
                                            <div className="flex flex-col items-center justify-center gap-4 text-center p-8">
                                                <span className="material-icons text-6xl text-gray-500">description</span>
                                                <div>
                                                    <h3 className="text-white text-xl font-semibold mb-2">DWG or DXF File Preview Not Available</h3>
                                                    <p className="text-gray-400 text-sm mb-4">DWG or DXF files cannot be previewed in the browser.<br />Please download the file to view it in AutoCAD or a compatible viewer.</p>
                                                </div>
                                                {downloadUrl && (
                                                    <a
                                                        href={downloadUrl}
                                                        download
                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2 font-semibold"
                                                    >
                                                        <span className="material-icons">download</span>
                                                        Download DWG or DXF File
                                                    </a>
                                                )}
                                            </div>
                                        );
                                    } else if (/\.(pdf)$/i.test(filePath)) {
                                        return (
                                            <iframe
                                                src={viewerFile}
                                                className="w-full h-full rounded-lg bg-white"
                                                title="Document Preview"
                                            />
                                        );
                                    } else {
                                        return (
                                            <div className="flex flex-col items-center justify-center gap-4 text-center p-8">
                                                <span className="material-icons text-6xl text-gray-500">insert_drive_file</span>
                                                <div>
                                                    <h3 className="text-white text-xl font-semibold mb-2">Preview Not Available</h3>
                                                    <p className="text-gray-400 text-sm mb-4">This file type cannot be previewed in the browser.</p>
                                                </div>
                                                {downloadUrl && (
                                                    <a
                                                        href={downloadUrl}
                                                        download
                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2 font-semibold"
                                                    >
                                                        <span className="material-icons">download</span>
                                                        Download File
                                                    </a>
                                                )}
                                            </div>
                                        );
                                    }
                                })()}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
export default DrawingDirectory;