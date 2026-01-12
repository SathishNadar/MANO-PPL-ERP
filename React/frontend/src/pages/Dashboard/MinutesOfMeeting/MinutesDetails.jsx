import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../../SidebarComponent/sidebar";
import { toast } from "react-toastify";
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import MinutesPDF from './MinutesPDF';

const MinutesDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();


    // -- VIEW STATE --
    const [minutesDetails, setMinutesDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // -- PREVIEW STATE --
    const [showPreview, setShowPreview] = useState(false);


    // -- EDIT STATE --
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    const [editForm, setEditForm] = useState({});
    const [editContent, setEditContent] = useState([]);
    const [editParticipants, setEditParticipants] = useState([]);

    // -- DIRECTORY STATE --
    const [directory, setDirectory] = useState([]);
    const [directoryLoading, setDirectoryLoading] = useState(false);
    const [showDirectoryModal, setShowDirectoryModal] = useState(false);

    // -- DND STATE --
    const [draggedGroupIndex, setDraggedGroupIndex] = useState(null);

    const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

    // -- PROJECT STATE --
    const [project, setProject] = useState(null);

    useEffect(() => {
        fetchMinutesDetails();
    }, [id]);

    const fetchMinutesDetails = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE}/projectMoM/mom/${id}`, {
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Fetch Project Details if project_id exists
            if (data.project_id) {
                try {
                    const projectRes = await fetch(`${API_BASE}/project/getProject/${data.project_id}`, {
                        credentials: "include",
                    });
                    if (projectRes.ok) {
                        const projectData = await projectRes.json();
                        if (projectData.success) {
                            setProject(projectData.data);
                        }
                    }
                } catch (err) {
                    console.error("Failed to load project details:", err);
                }
            }

            // Re-use logic: Process participants for View Mode
            const processViewParticipants = (rawParticipants) => {
                const grouped = {};
                if (rawParticipants && Array.isArray(rawParticipants)) {
                    rawParticipants.forEach(p => {
                        const company = p.organization || p.company_name || 'Unknown Organization';
                        if (!grouped[company]) {
                            grouped[company] = {
                                company_name: company,
                                participants: []
                            };
                        }
                        grouped[company].participants.push(p);
                    });
                }
                return Object.values(grouped);
            };

            const processedParticipants = processViewParticipants(data.participants);

            // Parse content
            let content = [];
            if (typeof data.content === 'string') {
                try { content = JSON.parse(data.content); }
                catch (e) { content = []; }
            } else if (Array.isArray(data.content)) {
                content = data.content;
            }

            setMinutesDetails({
                ...data,
                processedParticipants,
                content // Direct content array in minutes
            });

        } catch (err) {
            console.error("Error fetching minutes details:", err);
            setError(`Failed to load minutes details: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const toTitleCase = (str) => {
        if (!str) return "";
        return String(str)
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    // --- Edit Handlers ---
    const handleEditClick = async () => {
        // Initialize Edit State
        setEditForm({
            subject: minutesDetails.subject,
            venue: minutesDetails.venue,
            date: minutesDetails.date ? new Date(minutesDetails.date).toISOString().split('T')[0] : "",
            meeting_no: minutesDetails.meeting_no,
        });

        // Initialize content - clone deeper if needed
        const clonedContent = minutesDetails.content ? JSON.parse(JSON.stringify(minutesDetails.content)) : [];
        setEditContent(clonedContent);

        // Participants
        setEditParticipants([...(minutesDetails.participants || [])]);

        setIsEditing(true);

        // Fetch directory if needed
        if (directory.length === 0 && minutesDetails.project_id) {
            setDirectoryLoading(true);
            try {
                // Assuming directory endpoint is same as for Agenda
                const res = await fetch(`${API_BASE}/projectDirectory/list/${minutesDetails.project_id}`, { credentials: "include" });
                if (res.ok) {
                    const data = await res.json();
                    setDirectory(data.directory || []);
                }
            } catch (e) {
                console.error("Directory fetch error", e);
            } finally {
                setDirectoryLoading(false);
            }
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditForm({});
        setEditContent([]);
        setEditParticipants([]);
    };

    // --- Content Logic (MoM specific fields) ---
    const handlePointChange = (index, field, value) => {
        const newContent = [...editContent];
        if (field === 'status') {
            // Allow only F, A, P, C (case insensitive)
            const upperVal = value.toUpperCase();
            if (value === '' || ['F', 'A', 'P', 'C'].includes(upperVal)) {
                newContent[index][field] = upperVal;
            } else if (value.length === 1 && ['F', 'A', 'P', 'C'].includes(upperVal)) {
                newContent[index][field] = upperVal;
            }
            // If user types invalid char, do nothing (reject)
        } else {
            newContent[index][field] = value;
        }
        setEditContent(newContent);
    };

    const addMainPoint = () => {
        // Simple heuristic for sl_no if needed, or just let backend/user handle
        // Using "next integer" logic based on existing
        const lastNo = editContent.length > 0 ? parseFloat(editContent[editContent.length - 1].si_no) : 0;
        const newNo = (Math.floor(lastNo) + 1).toString();

        setEditContent([...editContent, {
            si_no: newNo,
            description: "",
            status: "",
            action_by: "",
            target_date: ""
        }]);
    };

    // Helper to add row - specific to MoM usually users just add rows, hierarchy strictly via 1.1 might be manual
    // Let's replicate Add Subpoint logic if desired, or just generic Add Row
    // Based on user request "similar to agenda", I'll keep the Add Main/Sub point structure logic from Agenda if possible,
    // but the provided MoM body has `si_no` as string "1.1".

    const addSubPoint = (parentIndex) => {
        const parentNo = String(editContent[parentIndex].si_no);
        const subPoints = editContent.filter(p => String(p.si_no).startsWith(`${parentNo}.`));
        const newNo = `${parentNo}.${subPoints.length + 1}`;

        const newContent = [...editContent];
        // Insert after last subpoint of this parent
        let insertIndex = parentIndex + 1;
        for (let i = parentIndex + 1; i < newContent.length; i++) {
            if (String(newContent[i].si_no).startsWith(`${parentNo}.`)) {
                insertIndex = i + 1;
            } else {
                break;
            }
        }
        newContent.splice(insertIndex, 0, {
            si_no: newNo,
            description: "",
            status: "",
            action_by: "",
            target_date: ""
        });
        setEditContent(newContent);
    };

    const removePoint = (index) => {
        setEditContent(editContent.filter((_, i) => i !== index));
    };

    // --- Participant Logic ---
    const handleAddParticipant = (person) => {
        if (editParticipants.find(p => p.pd_id === person.pd_id)) return;
        setEditParticipants([...editParticipants, person]);
        // Do NOT close modal as per user preference (multi-select)
    };

    const handleRemoveParticipant = (pd_id) => {
        setEditParticipants(editParticipants.filter(p => p.pd_id !== pd_id));
    };

    // --- DnD Logic ---
    const getEditGroups = () => {
        // Group by organization based on current editParticipants order
        const groups = [];
        const seenCompanies = new Set();
        editParticipants.forEach(p => {
            const company = p.organization || p.company_name || 'Unknown Organization'; // normalize key
            if (!seenCompanies.has(company)) {
                seenCompanies.add(company);
                groups.push({ company_name: company, participants: [p] });
            } else {
                const g = groups.find(g => g.company_name === company);
                g.participants.push(p);
            }
        });
        return groups;
    };

    const handleGroupDragStart = (index) => {
        setDraggedGroupIndex(index);
    };

    const handleGroupDragOver = (e) => {
        e.preventDefault();
    };

    const handleGroupDrop = (dropIndex) => {
        if (draggedGroupIndex === null || draggedGroupIndex === dropIndex) return;

        const groups = getEditGroups();
        const draggedGroup = groups[draggedGroupIndex];

        const newGroups = groups.filter((_, i) => i !== draggedGroupIndex);
        newGroups.splice(dropIndex, 0, draggedGroup);

        const newParticipants = newGroups.flatMap(g => g.participants);
        setEditParticipants(newParticipants);
        setDraggedGroupIndex(null);
    };

    // --- Save Logic ---
    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                venue: editForm.venue,
                meeting_no: parseInt(editForm.meeting_no, 10),
                date: editForm.date, // User didn't specify in payload example, but generally needed
                // Note: user said "this is the body structure" and listed venue, meeting_no, participants, content.
                // Assuming date and subject are also allowed or retained. 
                // To be safe, I'll send everything relevant.
                subject: editForm.subject,
                participants: editParticipants.map(p => p.pd_id),
                content: editContent
            };

            const response = await fetch(`${API_BASE}/projectMoM/update/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                credentials: "include"
            });

            if (!response.ok) throw new Error("Update failed");

            // Optimistic update of view state
            const grouped = {};
            editParticipants.forEach(p => {
                const company = p.organization || p.company_name || 'Unknown Organization';
                if (!grouped[company]) grouped[company] = { company_name: company, participants: [] };
                grouped[company].participants.push(p);
            });

            setMinutesDetails(prev => ({
                ...prev,
                ...editForm,
                content: editContent,
                participants: editParticipants,
                processedParticipants: Object.values(grouped)
            }));

            setIsEditing(false);
            toast.success("Minutes updated successfully");

        } catch (error) {
            console.error("Save error:", error);
            setError("Failed to save changes.");
            toast.error("Failed to save changes");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-400">Loading details...</div>;
    if (error) return <div className="p-8 text-center text-red-400">{error}</div>;
    if (!minutesDetails) return <div className="p-8 text-center text-gray-400">Minutes not found.</div>;

    const dateStr = minutesDetails.date
        ? new Date(minutesDetails.date).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric"
        })
        : "-";

    // In edit mode we need groups
    const editModeGroups = isEditing ? getEditGroups() : [];

    return (
        <div className="flex h-screen bg-background">
            <Sidebar />
            <main className="flex-1 p-8 bg-gray-900 overflow-y-auto text-gray-300">
                <header className="mb-8 flex justify-between items-center">
                    <button
                        className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200 flex items-center space-x-2"
                        onClick={() => isEditing ? handleCancel() : navigate(-1)}
                    >
                        <span className="material-icons">{isEditing ? 'close' : 'arrow_back'}</span>
                        <span>{isEditing ? 'Cancel Edit' : 'Back'}</span>
                    </button>

                    {!isEditing ? (
                        <div className="flex gap-4">
                            <button
                                className="bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all duration-200 flex items-center space-x-2"
                                onClick={() => setShowPreview(true)}
                            >
                                <span className="material-icons">visibility</span>
                                <span>Preview & Print</span>
                            </button>
                            <button
                                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all duration-200 flex items-center space-x-2"
                                onClick={handleEditClick}
                            >
                                <span className="material-icons">edit</span>
                                <span>Edit</span>
                            </button>
                        </div>
                    ) : (
                        <button
                            className="bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all duration-200 flex items-center space-x-2"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            <span className="material-icons">save</span>
                            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                        </button>
                    )}
                </header>

                <div className="w-full space-y-6">

                    {/* Header Section */}
                    {isEditing ? (
                        <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg shadow-md border-blue-500/50">
                            <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2">Edit Details</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">Subject</label>
                                    <input className="w-full bg-gray-700 rounded p-2 text-white outline-none focus:ring-1 focus:ring-blue-500" value={editForm.subject} onChange={e => setEditForm({ ...editForm, subject: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">Meeting No</label>
                                    <input type="number" className="w-full bg-gray-700 rounded p-2 text-white outline-none focus:ring-1 focus:ring-blue-500" value={editForm.meeting_no} onChange={e => setEditForm({ ...editForm, meeting_no: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">Venue</label>
                                    <input className="w-full bg-gray-700 rounded p-2 text-white outline-none focus:ring-1 focus:ring-blue-500" value={editForm.venue} onChange={e => setEditForm({ ...editForm, venue: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">Date</label>
                                    <input type="date" className="w-full bg-gray-700 rounded p-2 text-white outline-none focus:ring-1 focus:ring-blue-500" value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg shadow-md">
                            <div className="grid grid-cols-2 gap-4 border-b border-gray-700 pb-4 mb-4">
                                <div className="flex items-center space-x-4">
                                    <div className="h-12 w-12 bg-blue-600 rounded flex items-center justify-center font-bold text-white">M</div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">MANO</h2>
                                        <p className="text-xs text-gray-400">Project Consultants Pvt. Ltd.</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <h3 className="text-lg font-semibold text-blue-400">MEETING NO - {minutesDetails.meeting_no}</h3>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-y-2 text-sm">
                                <p><span className="text-gray-500 font-semibold">Project:</span> <span className="text-white">{minutesDetails.project_name}</span></p>
                                <p className="text-right"><span className="text-gray-500 font-semibold">Date:</span> <span className="text-white">{dateStr}</span></p>

                                <p><span className="text-gray-500 font-semibold">Subject:</span> <span className="text-white">{minutesDetails.subject}</span></p>
                                <p className="col-span-2"><span className="text-gray-500 font-semibold">Venue:</span> <span className="text-white">{minutesDetails.venue}</span></p>
                            </div>
                        </div>
                    )}

                    {/* Participants Table */}
                    <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-md overflow-hidden">
                        <div className="bg-gray-700/50 p-3 border-b border-gray-700 font-bold text-center text-white flex justify-between items-center px-6">
                            <span>Participants</span>
                            {isEditing && (
                                <button onClick={() => setShowDirectoryModal(true)} className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-xs flex items-center gap-1">
                                    <span className="material-icons text-sm">add</span> Add
                                </button>
                            )}
                        </div>
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="bg-gray-900/40 text-gray-400">
                                    <th className="p-3 border-r border-b border-gray-700 w-1/4">Organization</th>
                                    <th className="p-3 border-r border-b border-gray-700 w-1/4">Responsibility</th>
                                    <th className="p-3 border-b border-gray-700 w-1/2">Representatives</th>
                                </tr>
                            </thead>
                            {isEditing ? (
                                editModeGroups.map((group, idx) => (
                                    <tbody
                                        key={idx}
                                        draggable
                                        onDragStart={() => handleGroupDragStart(idx)}
                                        onDragOver={handleGroupDragOver}
                                        onDrop={() => handleGroupDrop(idx)}
                                        className={`transition-colors cursor-move ${draggedGroupIndex === idx ? 'bg-gray-700/50 opacity-50' : 'hover:bg-gray-700/10'}`}
                                        title="Drag to reorder organization"
                                    >
                                        {group.participants.map((rep, rIdx) => (
                                            <tr key={rep.pd_id || rIdx} className="border-b border-gray-700 hover:bg-gray-700/20">
                                                {/* Organization Cell: First row of group only */}
                                                {rIdx === 0 && (
                                                    <td
                                                        rowSpan={group.participants.length}
                                                        className="p-3 border-r border-gray-700 align-top text-white font-bold bg-gray-800/30"
                                                    >
                                                        <div className="flex items-start gap-2">
                                                            <span className="material-icons text-gray-600 text-sm mt-1 cursor-grab">drag_indicator</span>
                                                            {toTitleCase(group.company_name)}
                                                        </div>
                                                    </td>
                                                )}

                                                {/* Responsibility Cell: Individual per row */}
                                                <td className="p-3 border-r border-gray-700 align-top text-gray-300">
                                                    {toTitleCase(rep.responsibilities)}
                                                </td>

                                                <td className="p-3 align-top">
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <span className="text-gray-300 mr-2 font-medium">{toTitleCase(rep.contact_person || rep.name)}</span>
                                                            <span className="text-gray-500 text-xs uppercase tracking-wider">{rep.designation}</span>
                                                        </div>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleRemoveParticipant(rep.pd_id); }}
                                                            className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/10"
                                                        >
                                                            <span className="material-icons text-sm">close</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                ))
                            ) : (
                                <tbody>
                                    {minutesDetails.processedParticipants.length === 0 ? (
                                        <tr><td colSpan="3" className="p-4 text-center text-gray-500">No participants found.</td></tr>
                                    ) : (
                                        minutesDetails.processedParticipants.map((group, idx) => (
                                            <tr key={idx} className="border-b border-gray-700 last:border-0 hover:bg-gray-700/20">
                                                <td className="p-3 border-r border-gray-700 align-top text-white font-bold text-lg">{toTitleCase(group.company_name)}</td>
                                                <td className="p-0 align-top border-r border-gray-700">
                                                    <div className="flex flex-col">
                                                        {group.participants.map((rep, rIdx) => (
                                                            <div key={rIdx} className={`p-3 ${rIdx !== group.participants.length - 1 ? 'border-b border-gray-700' : ''} h-full`}>
                                                                <span className="text-gray-300">{toTitleCase(rep.responsibilities)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="p-0 align-top">
                                                    {group.participants.map((rep, rIdx) => (
                                                        <div key={rIdx} className={`p-3 flex justify-between ${rIdx !== group.participants.length - 1 ? 'border-b border-gray-700' : ''}`}>
                                                            <span className="text-gray-300">{toTitleCase(rep.contact_person)}</span>
                                                            <span className="text-gray-500 text-xs uppercase tracking-wider">{rep.designation}</span>
                                                        </div>
                                                    ))}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            )}
                        </table>
                    </div>

                    {/* Legend */}
                    <div className="bg-gray-800 border border-gray-700 p-2 text-center text-xs font-mono text-gray-400 rounded">
                        F= Fresh | A = Active | P = Pending | C = Complete / Closed
                    </div>

                    {/* Points Table */}
                    <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-md overflow-hidden">
                        <div className="bg-gray-700/50 p-3 border-b border-gray-700 font-bold flex justify-between items-center text-white px-6">
                            <span>Points</span>
                            {isEditing && <button onClick={addMainPoint} className="text-xs bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded">Add Main Point</button>}
                        </div>
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="bg-gray-900/40 text-gray-400">
                                    <th className="p-3 border-r border-b border-gray-700 w-16 text-center">Sl No.</th>
                                    <th className="p-3 border-r border-b border-gray-700">Description</th>
                                    <th className="p-3 border-r border-b border-gray-700 w-16 text-center">S</th>
                                    <th className="p-3 border-r border-b border-gray-700 w-32 border-box">Target Date</th>
                                    <th className="p-3 border-b border-gray-700 w-32 text-center">Action By</th>
                                    {isEditing && <th className="p-3 border-l border-b border-gray-700 w-16">Act</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {(isEditing ? editContent : minutesDetails.content || []).map((point, idx) => (
                                    <tr key={idx} className="border-b border-gray-700 last:border-0 hover:bg-gray-700/20">
                                        <td className="p-3 border-r border-gray-700 text-center font-mono text-gray-500 align-top pt-4">
                                            {isEditing ? (
                                                <input
                                                    className="w-full bg-gray-900/50 text-white p-1 rounded border-b border-gray-700 text-center"
                                                    value={point.si_no}
                                                    onChange={e => handlePointChange(idx, 'si_no', e.target.value)}
                                                />
                                            ) : point.si_no}
                                        </td>

                                        <td className="p-3 border-r border-gray-700 text-gray-300 align-top">
                                            {isEditing ? (
                                                <textarea
                                                    className="w-full bg-gray-900/50 text-white p-2 rounded border border-gray-700 focus:border-blue-500 outline-none resize-none"
                                                    rows={Math.max(2, Math.ceil((point.description || "").length / 50))}
                                                    value={point.description}
                                                    onChange={e => handlePointChange(idx, 'description', e.target.value)}
                                                />
                                            ) : point.description}
                                        </td>

                                        <td className="p-3 border-r border-gray-700 text-center font-bold text-white align-top">
                                            {isEditing ? (
                                                <input
                                                    className="w-full bg-gray-900/50 text-white p-1 rounded border-b border-gray-700 text-center uppercase"
                                                    maxLength={3}
                                                    value={point.status}
                                                    onChange={e => handlePointChange(idx, 'status', e.target.value)}
                                                />
                                            ) : point.status}
                                        </td>

                                        <td className="p-3 border-r border-gray-700 text-gray-400 align-top text-xs">
                                            {isEditing ? (
                                                <input
                                                    type="date"
                                                    className="w-full bg-gray-900/50 text-white p-1 rounded border-b border-gray-700"
                                                    value={point.target_date ? String(point.target_date).split('T')[0] : ""}
                                                    onChange={e => handlePointChange(idx, 'target_date', e.target.value)}
                                                />
                                            ) : (point.target_date ? new Date(point.target_date).toLocaleDateString("en-GB") : "-")}
                                        </td>

                                        <td className="p-3 text-center text-blue-400 font-medium align-top">
                                            {isEditing ? (
                                                <input
                                                    className="w-full bg-gray-900/50 text-blue-400 p-1 rounded border-b border-gray-700 text-center"
                                                    value={point.action_by}
                                                    onChange={e => handlePointChange(idx, 'action_by', e.target.value)}
                                                />
                                            ) : point.action_by}
                                        </td>

                                        {isEditing && (
                                            <td className="p-3 align-top pt-4 flex flex-col gap-2 border-l border-gray-700">
                                                <button onClick={() => addSubPoint(idx)} className="text-blue-400 hover:text-blue-300" title="Add Subpoint">
                                                    <span className="material-icons text-base">playlist_add</span>
                                                </button>
                                                <button onClick={() => removePoint(idx)} className="text-red-400 hover:text-red-300" title="Remove">
                                                    <span className="material-icons text-base">delete</span>
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Note */}
                    <div className="mt-8 bg-yellow-900/40 border border-yellow-700/50 p-4 rounded-lg shadow-sm">
                        <h4 className="text-yellow-500 font-extrabold mb-2 uppercase tracking-wide border-b border-yellow-700/30 pb-1 w-max">Note :</h4>
                        <ul className="list-decimal list-inside space-y-2 text-sm text-gray-300">
                            <li>
                                In case of any missing points or discrepancy, the respective stakeholders are requested to highlight the issue within <strong className="text-white">24 hours</strong> of circulation of this MOM and unless notified, the essence of this MOM stands final and fully justified.
                            </li>
                            <li>
                                All conversations / correspondance shall be done via <strong className="text-white">mail strictly</strong>. Other mode of communication will not be entertained.
                            </li>
                        </ul>
                    </div>

                </div>

            </main>


            {/* Directory Modal */}
            {showDirectoryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-gray-800 w-full max-w-2xl rounded-lg shadow-2xl border border-gray-700 max-h-[80vh] flex flex-col">
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">Add Participant</h3>
                            <button onClick={() => setShowDirectoryModal(false)} className="text-gray-400 hover:text-white"><span className="material-icons">close</span></button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 space-y-2">
                            {directoryLoading ? <p className="text-center p-4">Loading directory...</p> :
                                directory.filter(p => !editParticipants.some(sp => sp.pd_id === p.pd_id)).length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">All loaded directory members are already added.</p>
                                ) : (
                                    directory
                                        .filter(p => !editParticipants.some(sp => sp.pd_id === p.pd_id))
                                        .map(person => (
                                            <div key={person.pd_id} className="flex justify-between items-center p-3 bg-gray-700/50 rounded hover:bg-gray-700 transition-colors">
                                                <div>
                                                    <p className="font-bold text-white">{toTitleCase(person.contact_person)}</p>
                                                    <p className="text-xs text-gray-400">{toTitleCase(person.company_name)} • {person.designation}</p>
                                                </div>
                                                <button onClick={() => handleAddParticipant(person)} className="text-blue-400 hover:text-blue-300 font-bold border border-blue-600 px-3 py-1 rounded hover:bg-blue-600/20">Add</button>
                                            </div>
                                        ))
                                )
                            }
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm no-print p-4">
                    <div className="bg-gray-900 w-full max-w-6xl h-[95vh] rounded-xl shadow-2xl border border-gray-700 flex flex-col overflow-hidden">
                        {/* Modal Header */}
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <span className="material-icons text-cyan-400">print</span>
                                Print Preview (PDF)
                            </h3>
                            <div className="flex items-center gap-3">
                                <PDFDownloadLink
                                    document={<MinutesPDF minutesDetails={minutesDetails} project={project} />}
                                    fileName={`mom-${minutesDetails.meeting_no}_${String(minutesDetails.project_name || "Minutes").replace(/[/\\?%*:|"<>]/g, '-')}.pdf`}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-md"
                                >
                                    {({ loading }) => (
                                        <>
                                            <span className="material-icons">{loading ? 'sync' : 'download'}</span>
                                            <span>{loading ? 'Preparing...' : 'Download PDF'}</span>
                                        </>
                                    )}
                                </PDFDownloadLink>
                                <button onClick={() => setShowPreview(false)} className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors">
                                    <span className="material-icons">close</span>
                                </button>
                            </div>
                        </div>

                        {/* PDF Viewer */}
                        <div className="flex-1 bg-gray-800 flex justify-center items-center overflow-hidden">
                            <PDFViewer width="100%" height="100%" className="w-full h-full border-none">
                                <MinutesPDF minutesDetails={minutesDetails} project={project} />
                            </PDFViewer>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};


export default MinutesDetails;
