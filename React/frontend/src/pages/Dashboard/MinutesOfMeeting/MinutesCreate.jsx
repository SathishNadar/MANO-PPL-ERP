import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../../SidebarComponent/sidebar";
import { toast } from "react-toastify";

const MinutesCreate = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { projectId } = location.state || {}; // Expect projectId passed via route state

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // -- FORM STATE --
    const [form, setForm] = useState({
        subject: "",
        venue: "",
        date: new Date().toISOString().split('T')[0],
        meeting_no: "",
    });
    const [content, setContent] = useState([]); // [{si_no: "1.1", description: "...", status: "", action_by: "", target_date: ""}]
    const [participants, setParticipants] = useState([]); // Array of person objects for UI handling

    // -- DIRECTORY STATE --
    const [directory, setDirectory] = useState([]);
    const [directoryLoading, setDirectoryLoading] = useState(false);
    const [showDirectoryModal, setShowDirectoryModal] = useState(false);

    // -- DND STATE --
    const [draggedGroupIndex, setDraggedGroupIndex] = useState(null);

    const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

    useEffect(() => {
        if (!projectId) {
            toast.error("Project ID missing. Redirecting...");
            navigate(-1);
            return;
        }
        fetchDirectory();
    }, [projectId]);

    const fetchDirectory = async () => {
        setDirectoryLoading(true);
        try {
            const res = await fetch(`${API_BASE}/projectDirectory/list/${projectId}`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setDirectory(data.directory || []);
            } else {
                toast.error("Failed to load project directory.");
            }
        } catch (e) {
            console.error("Directory fetch error", e);
            toast.error("Error loading directory.");
        } finally {
            setDirectoryLoading(false);
        }
    };

    // --- Helpers ---
    const toTitleCase = (str) => {
        if (!str) return "";
        return String(str)
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    // --- Content Logic ---
    const handleContentChange = (index, field, value) => {
        const newContent = [...content];
        if (field === 'status') {
            // Allow only F, A, P, C (case insensitive)
            const upperVal = value.toUpperCase();
            if (value === '' || ['F', 'A', 'P', 'C'].includes(upperVal)) {
                newContent[index][field] = upperVal;
            } else if (value.length === 1 && ['F', 'A', 'P', 'C'].includes(upperVal)) {
                newContent[index][field] = upperVal;
            }
        } else {
            newContent[index][field] = value;
        }
        setContent(newContent);
    };

    const addMainPoint = () => {
        // Find next main number (si_no)
        // Simplified logic: get max number start from existing and increment
        // Assuming format is just numbers or 1, 1.1 etc.
        const lastNo = content.length > 0 ? parseFloat(content[content.length - 1].si_no) : 0;
        const nextNo = (Math.floor(lastNo) + 1).toString(); // Start new block

        setContent([...content, {
            si_no: nextNo,
            description: "",
            status: "",
            action_by: "",
            target_date: ""
        }]);
    };

    const addSubPoint = (parentIndex) => {
        const parentNo = String(content[parentIndex].si_no);
        const subPoints = content.filter(p => String(p.si_no).startsWith(`${parentNo}.`));
        const newNo = `${parentNo}.${subPoints.length + 1}`;

        const newContent = [...content];

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
        setContent(newContent);
    };

    const removePoint = (index) => {
        setContent(content.filter((_, i) => i !== index));
    };

    // --- Participant Logic ---
    const handleAddParticipant = (person) => {
        if (participants.find(p => p.pd_id === person.pd_id)) return;
        setParticipants([...participants, person]);
        // Keeps modal open intentionally
    };

    const handleRemoveParticipant = (pd_id) => {
        setParticipants(participants.filter(p => p.pd_id !== pd_id));
    };

    // --- DnD Logic (Organization Level) ---
    const getGroups = () => {
        const groups = [];
        const seenCompanies = new Set();

        participants.forEach(p => {
            const company = p.company_name || 'Unknown Organization';
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

        const groups = getGroups();
        const draggedGroup = groups[draggedGroupIndex];

        const newGroups = groups.filter((_, i) => i !== draggedGroupIndex);
        newGroups.splice(dropIndex, 0, draggedGroup);

        const newParticipants = newGroups.flatMap(g => g.participants);
        setParticipants(newParticipants);
        setDraggedGroupIndex(null);
    };

    // --- Save Logic ---
    const handleCreate = async () => {
        if (!form.subject || !form.date || !form.meeting_no || !form.venue) {
            toast.warn("Please fill in all Header details (Subject, Meeting No, Venue, Date).");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                subject: form.subject,
                venue: form.venue,
                date: form.date,
                meeting_no: parseInt(form.meeting_no, 10),
                content: content,
                participants: participants.map(p => p.pd_id)
            };

            const response = await fetch(`${API_BASE}/projectMoM/add/${projectId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                credentials: "include"
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || "Creation failed");
            }

            const data = await response.json();
            toast.success("MoM created successfully");
            navigate(-1); // Go back to list

        } catch (error) {
            console.error("Create error:", error);
            toast.error(error.message || "Failed to create MoM.");
        } finally {
            setSaving(false);
        }
    };

    const groups = getGroups();

    return (
        <div className="flex h-screen bg-background">
            <Sidebar />
            <main className="flex-1 p-8 bg-gray-900 overflow-y-auto text-gray-300">
                <header className="mb-8 flex justify-between items-center">
                    <button
                        className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200 flex items-center space-x-2"
                        onClick={() => navigate(-1)}
                    >
                        <span className="material-icons">arrow_back</span>
                        <span>Back</span>
                    </button>

                    <button
                        className="bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all duration-200 flex items-center space-x-2"
                        onClick={handleCreate}
                        disabled={saving}
                    >
                        <span className="material-icons">save</span>
                        <span>{saving ? 'Creating...' : 'Create MoM'}</span>
                    </button>
                </header>

                <div className="w-full space-y-6">
                    {/* Header Details Form */}
                    <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg shadow-md border-blue-500/50">
                        <div className="flex justify-between mb-4 border-b border-gray-700 pb-2">
                            <h3 className="text-lg font-bold text-white">New Minutes Details</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Subject</label>
                                <input
                                    className="w-full bg-gray-700 rounded p-2 text-white outline-none focus:ring-1 focus:ring-blue-500"
                                    value={form.subject}
                                    onChange={e => setForm({ ...form, subject: e.target.value })}
                                    placeholder="e.g. Weekly Review"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Meeting No</label>
                                <input
                                    type="number"
                                    className="w-full bg-gray-700 rounded p-2 text-white outline-none focus:ring-1 focus:ring-blue-500"
                                    value={form.meeting_no}
                                    onChange={e => setForm({ ...form, meeting_no: e.target.value })}
                                    placeholder="e.g. 42"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Venue</label>
                                <input
                                    className="w-full bg-gray-700 rounded p-2 text-white outline-none focus:ring-1 focus:ring-blue-500"
                                    value={form.venue}
                                    onChange={e => setForm({ ...form, venue: e.target.value })}
                                    placeholder="e.g. Conference Room"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Date</label>
                                <input
                                    type="date"
                                    className="w-full bg-gray-700 rounded p-2 text-white outline-none focus:ring-1 focus:ring-blue-500"
                                    value={form.date}
                                    onChange={e => setForm({ ...form, date: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Participants Table */}
                    <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-md overflow-hidden">
                        <div className="bg-gray-700/50 p-3 border-b border-gray-700 font-bold flex justify-between items-center text-white px-6">
                            <span>Participants</span>
                            <button onClick={() => setShowDirectoryModal(true)} className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-xs flex items-center gap-1">
                                <span className="material-icons text-sm">add</span> Add
                            </button>
                        </div>
                        {participants.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">No participants added yet.</div>
                        ) : (
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="bg-gray-900/40 text-gray-400">
                                        <th className="p-3 border-r border-b border-gray-700 w-1/4">Organization</th>
                                        <th className="p-3 border-r border-b border-gray-700 w-1/4">Responsibility</th>
                                        <th className="p-3 border-b border-gray-700 w-1/2">Representatives</th>
                                    </tr>
                                </thead>
                                {groups.map((group, idx) => (
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
                                                {/* Start with Org/Resp which need rowspan */}
                                                {rIdx === 0 && (
                                                    <td
                                                        rowSpan={group.participants.length}
                                                        className="p-3 border-r border-gray-700 align-top text-white font-bold text-lg bg-gray-800/30"
                                                    >
                                                        <div className="flex items-start gap-2">
                                                            <span className="material-icons text-gray-600 text-sm mt-1 cursor-grab">drag_indicator</span>
                                                            {toTitleCase(group.company_name)}
                                                        </div>
                                                    </td>
                                                )}

                                                {rIdx === 0 && (
                                                    <td
                                                        rowSpan={group.participants.length}
                                                        className="p-3 border-r border-gray-700 align-top text-gray-300 bg-gray-800/20"
                                                    >
                                                        {toTitleCase(rep.responsibilities)}
                                                    </td>
                                                )}

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
                                ))}
                            </table>
                        )}
                    </div>

                    {/* Legend */}
                    <div className="bg-gray-800 border border-gray-700 p-2 text-center text-xs font-mono text-gray-400 rounded">
                        F= Fresh | A = Active | P = Pending | C = Complete / Closed
                    </div>

                    {/* Points Table */}
                    <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-md overflow-hidden">
                        <div className="bg-gray-700/50 p-3 border-b border-gray-700 font-bold flex justify-between items-center text-white px-6">
                            <span>Points</span>
                            <button onClick={addMainPoint} className="text-xs bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded">Add Main Point</button>
                        </div>
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="bg-gray-900/40 text-gray-400">
                                    <th className="p-3 border-r border-b border-gray-700 w-16 text-center">Sl No.</th>
                                    <th className="p-3 border-r border-b border-gray-700">Description</th>
                                    <th className="p-3 border-r border-b border-gray-700 w-16 text-center">S</th>
                                    <th className="p-3 border-r border-b border-gray-700 w-32 border-box">Target Date</th>
                                    <th className="p-3 border-b border-gray-700 w-32 text-center">Action By</th>
                                    <th className="p-3 border-l border-b border-gray-700 w-16" >Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {content.map((point, idx) => (
                                    <tr key={idx} className="border-b border-gray-700 last:border-0 hover:bg-gray-700/20">
                                        <td className="p-3 border-r border-gray-700 text-center font-mono text-gray-500 align-top pt-4">
                                            <input
                                                className="w-full bg-gray-900/50 text-white p-1 rounded border-b border-gray-700 text-center"
                                                value={point.si_no}
                                                onChange={e => handleContentChange(idx, 'si_no', e.target.value)}
                                            />
                                        </td>

                                        <td className="p-3 border-r border-gray-700 text-gray-300 align-top">
                                            <textarea
                                                className="w-full bg-gray-900/50 text-white p-2 rounded border border-gray-700 focus:border-blue-500 outline-none resize-none"
                                                rows={Math.max(2, Math.ceil(point.description.length / 50))}
                                                value={point.description}
                                                onChange={e => handleContentChange(idx, 'description', e.target.value)}
                                                placeholder="Description..."
                                            />
                                        </td>

                                        <td className="p-3 border-r border-gray-700 text-center font-bold text-white align-top">
                                            <input
                                                className="w-full bg-gray-900/50 text-white p-1 rounded border-b border-gray-700 text-center uppercase"
                                                maxLength={1}
                                                value={point.status}
                                                onChange={e => handleContentChange(idx, 'status', e.target.value)}
                                                placeholder="S"
                                            />
                                        </td>

                                        <td className="p-3 border-r border-gray-700 text-gray-400 align-top text-xs">
                                            <input
                                                type="date"
                                                className="w-full bg-gray-900/50 text-white p-1 rounded border-b border-gray-700"
                                                value={point.target_date} // Assuming format YYYY-MM-DD
                                                onChange={e => handleContentChange(idx, 'target_date', e.target.value)}
                                            />
                                        </td>

                                        <td className="p-3 text-center text-blue-400 font-medium align-top">
                                            <input
                                                className="w-full bg-gray-900/50 text-blue-400 p-1 rounded border-b border-gray-700 text-center"
                                                value={point.action_by}
                                                onChange={e => handleContentChange(idx, 'action_by', e.target.value)}
                                                placeholder="Who?"
                                            />
                                        </td>

                                        <td className="p-3 align-top pt-4 flex flex-col gap-2 border-l border-gray-700">
                                            <button onClick={() => addSubPoint(idx)} className="text-blue-400 hover:text-blue-300" title="Add Subpoint">
                                                <span className="material-icons text-base">playlist_add</span>
                                            </button>
                                            <button onClick={() => removePoint(idx)} className="text-red-400 hover:text-red-300" title="Remove">
                                                <span className="material-icons text-base">delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {content.length === 0 && (
                            <div className="p-8 text-center text-gray-500">No points added. Click "Add Main Point" to start.</div>
                        )}
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
                                directory.filter(p => !participants.some(sp => sp.pd_id === p.pd_id)).length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">All loaded directory members are already added.</p>
                                ) : (
                                    directory
                                        .filter(p => !participants.some(sp => sp.pd_id === p.pd_id))
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
        </div>
    );
};

export default MinutesCreate;
