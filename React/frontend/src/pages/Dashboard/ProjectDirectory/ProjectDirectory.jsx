import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../SidebarComponent/sidebar";
import { toast } from "react-toastify";

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:5001';

// Portal Dropdown Component to render outside table overflow
const PortalDropdown = ({ children, anchorEl, isOpen, onClose }) => {
    if (!isOpen || !anchorEl) return null;

    const rect = anchorEl.getBoundingClientRect();
    const style = {
        position: 'absolute', // Use absolute to scroll with the page
        left: rect.left + window.scrollX,
        top: rect.bottom + window.scrollY,
        width: rect.width,
        zIndex: 9999, // High z-index to stay on top
        maxHeight: '200px',
        overflowY: 'auto'
    };

    return createPortal(
        <>
            <div
                style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
                onClick={onClose}
            />
            <ul
                style={style}
                className="bg-gray-800 border border-gray-600 rounded shadow-xl"
            >
                {children}
            </ul>
        </>,
        document.body
    );
};


const ProjectDirectory = () => {
    const navigate = useNavigate();
    const { projectId } = useParams();
    const [contacts, setContacts] = useState([]);
    const [newRows, setNewRows] = useState([]);
    const [loading, setLoading] = useState(true);

    // Inline Editing State
    const [editingId, setEditingId] = useState(null);
    const [editFormData, setEditFormData] = useState({});

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    // Autocomplete State
    const [allVendors, setAllVendors] = useState([]);
    const [activeDropdownRow, setActiveDropdownRow] = useState(null); // tempId of row with active dropdown
    const [anchorEl, setAnchorEl] = useState(null); // Store ref to input for Portal positioning
    const [highlightedIndex, setHighlightedIndex] = useState(0); // For keyboard navigation

    // Edit Mode State
    const [isEditMode, setIsEditMode] = useState(false);

    // Fetch on mount
    useEffect(() => {
        fetchContacts();
        fetchVendorList();
    }, [projectId]);

    const fetchVendorList = async () => {
        try {
            const response = await fetch(`${API_BASE}/vendor_api/vendors-jobnature`, { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                setAllVendors(data.vendors || []);
            }
        } catch (error) {
            console.error("Error fetching vendor list:", error);
        }
    };

    const fetchContacts = async () => {
        try {
            // Using correct GET endpoint: /projectContacts/contacts/:project_id
            const response = await fetch(`${API_BASE}/projectContacts/contacts/${projectId}`, {
                credentials: 'include'
            });
            const data = await response.json();
            // API returns {contacts: [...], contactCount: N }
            if (data.contacts) {
                setContacts(data.contacts || []);
            } else {
                setContacts([]);
            }
        } catch (error) {
            console.error("Error fetching project contacts:", error);
        } finally {
            setLoading(false);
        }
    };

    // Helper: Robust ID extraction using pc_id
    const getContactId = (contact) => contact.pc_id || contact.id;

    const handleVendorSelect = (tempId, vendor) => {
        setNewRows(newRows.map(row =>
            row.tempId === tempId ? {
                ...row,
                company_name: vendor.company_name,
                job_nature: vendor.job_nature || "", // Auto-fill Job Nature
                vendor_id: vendor.id // Store vendor_id for backend
            } : row
        ));
        setActiveDropdownRow(null); // Close dropdown
        setAnchorEl(null);
        setHighlightedIndex(0);
    };

    const handleEditVendorSelect = (vendor) => {
        setEditFormData({
            ...editFormData,
            company_name: vendor.company_name,
            job_nature: vendor.job_nature || "",
            vendor_id: vendor.id
        });
        setActiveDropdownRow(null); // Close dropdown
        setAnchorEl(null);
        setHighlightedIndex(0);
    };

    // Keyboard Navigation Handler
    const handleKeyDown = (e, searchTerm, isEditContext, rowId) => {
        if (!activeDropdownRow) return;

        const filtered = allVendors.filter(v =>
            v.company_name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex(prev => (prev < filtered.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filtered.length > 0) {
                const selected = filtered[highlightedIndex];
                if (selected) {
                    if (isEditContext) {
                        handleEditVendorSelect(selected);
                    } else {
                        handleVendorSelect(rowId, selected);
                    }
                }
            }
        } else if (e.key === 'Escape') {
            setActiveDropdownRow(null);
            setAnchorEl(null);
        }
    };

    //#region Actions (Edit/Delete)




    //#region Actions (Edit/Delete)
    const handleEditClick = (contact) => {
        const id = getContactId(contact);
        if (!id) return;
        setEditingId(id);
        setEditFormData({
            company_name: contact.company_name,
            job_nature: contact.job_nature,
            contact_person: contact.contact_person, // "Name"
            designation: contact.designation,
            responsibilities: contact.responsibilities,
            mobile_no: contact.mobile_no,
            email: contact.email,
            address_line: contact.address_line,
            vendor_id: contact.vendor_id // Add vendor_id
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditFormData({});
        setActiveDropdownRow(null);
        setAnchorEl(null);
    };

    const handleEditChange = (e) => {
        setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
    };

    const handleSaveEdit = async () => {
        if (!editingId) return;
        try {
            const original = contacts.find(c => getContactId(c) === editingId);
            if (!original) return;

            const payload = {};
            // Include vendor_id as per API requirement
            // Include vendor_id from form data to ensure updates are captured
            if (editFormData.vendor_id) {
                payload.vendor_id = editFormData.vendor_id;
            }

            // Check for changes in editable fields
            Object.keys(editFormData).forEach(key => {
                if (editFormData[key] !== original[key]) {
                    payload[key] = editFormData[key];
                }
            });

            // If no changes (other than vendor_id), we might want to skip or verify.
            // But if vendor_id is required, we always send it. 
            // Let's assume we proceed if there are actual edits OR if we just want to save.
            // The previous logic checked for keys length. Now payload has vendor_id, so length > 0.
            // We should check if any *other* field changed.
            console.log("DEBUG: Original:", original);
            console.log("DEBUG: EditForm:", editFormData);
            console.log("DEBUG: Payload:", payload);

            // We should check if any *other* field changed.
            const hasChanges = Object.keys(editFormData).some(key => editFormData[key] !== original[key]);

            // Specifically check if vendor_id changed (it might not be visible in text comparison if names are same but IDs differ, or if we rely on IDs)
            // But since we rely on `vendor_id` for company name, if `editFormData.vendor_id` differs, we must save.

            if (!hasChanges) {
                toast.info("No changes detected");
                setEditingId(null);
                setEditFormData({});
                return;
            }

            // Using PUT for updates as per project pattern: /projectContacts/update/:pc_id
            const response = await fetch(`${API_BASE}/projectContacts/update/${editingId}`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (response.ok) {
                toast.success("Contact updated successfully");
                setEditingId(null);
                setEditFormData({});
                setIsEditMode(false); // Auto-exit edit mode
                fetchContacts();
            } else {
                toast.error(data.message || "Failed to update contact");
            }
        } catch (error) {
            console.error("Error updating contact:", error);
            toast.error("Error updating contact");
        }
    };

    const handleDeleteClick = (id) => {
        setDeleteId(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            // Using DELETE for deletion
            const response = await fetch(`${API_BASE}/projectContacts/delete/${deleteId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (response.ok) {
                toast.success("Contact deleted successfully");
                setContacts(contacts.filter(c => getContactId(c) !== deleteId));
                setIsEditMode(false); // Auto-exit edit mode
            } else {
                const data = await response.json();
                toast.error(data.message || "Failed to delete contact");
            }
        } catch (error) {
            console.error("Error deleting contact:", error);
            toast.error("Error deleting contact");
        } finally {
            setShowDeleteModal(false);
            setDeleteId(null);
        }
    };
    //#endregion

    //#region New Rows (Create)
    const addNewRow = () => {
        setNewRows([...newRows, {
            tempId: Date.now(),
            company_name: "",
            job_nature: "",
            contact_person: "",
            designation: "",
            responsibilities: "",
            mobile_no: "",
            email: "",
            address_line: ""
        }]);
    };

    const removeNewRow = (tempId) => {
        setNewRows(newRows.filter(row => row.tempId !== tempId));
    };

    const handleNewRowChange = (tempId, field, value) => {
        setNewRows(newRows.map(row => row.tempId === tempId ? { ...row, [field]: value } : row));
    };

    const saveNewRow = async (row) => {
        if (!row.company_name || !row.contact_person) {
            toast.warning("Company Name and Contact Person are required");
            return;
        }

        try {
            const body = {
                project_id: parseInt(projectId),
                vendor_id: row.vendor_id, // Include vendor_id
                company_name: row.company_name,
                job_nature: row.job_nature,
                contact_person: row.contact_person,
                designation: row.designation,
                responsibilities: row.responsibilities,
                mobile_no: row.mobile_no,
                email: row.email,
                address_line: row.address_line
            };

            // Using POST /projectContacts/add/:project_id based on backend definition
            console.log(`Creating contact at ${API_BASE}/projectContacts/add/${projectId}`);
            const response = await fetch(`${API_BASE}/projectContacts/add/${projectId}`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await response.json();
            if (data.success || response.ok) {
                toast.success("Contact added successfully");
                setNewRows(newRows.filter(r => r.tempId !== row.tempId));
                fetchContacts();
            } else {
                toast.error(data.message || "Failed to add contact");
            }
        } catch (error) {
            console.error("Error adding contact:", error);
            toast.error("Error adding contact");
        }
    };
    //#endregion

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
                            Project Directory
                        </h1>
                        <p className="text-[var(--text-secondary)]">
                            Manage all project-related contacts and vendors.
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
                            Add New Contact
                        </button>
                    </div>
                </header>

                <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-md overflow-hidden pb-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse border border-gray-600 min-w-[1200px]">
                            <thead className="bg-gray-900/50 text-xs uppercase text-gray-400">
                                <tr>
                                    <th className={`${thClass} w-12 text-center`}>S. No.</th>
                                    <th className={thClass}>Company Name</th>
                                    <th className={thClass}>Nature of Job</th>
                                    <th className={thClass}>Name of Person</th>
                                    <th className={thClass}>Designation</th>
                                    <th className={thClass}>Responsibilities</th>
                                    <th className={thClass}>Mobile No</th>
                                    <th className={thClass}>Email ID</th>
                                    <th className={thClass}>Address</th>
                                    {(isEditMode || newRows.length > 0) && (
                                        <th className={`${thClass} w-24 text-center`}>Action</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {contacts.map((contact, index) => {
                                    const id = getContactId(contact);
                                    const isEditing = editingId === id;

                                    return (
                                        <tr key={id} className="hover:bg-gray-700/30 transition-colors duration-150">
                                            <td className={`${tdClass} text-center`}>{index + 1}</td>
                                            <td className={tdClass}>
                                                {isEditing ? (
                                                    <div>
                                                        <input
                                                            name="company_name"
                                                            value={editFormData.company_name || ""}
                                                            onChange={(e) => {
                                                                handleEditChange(e);
                                                                setActiveDropdownRow(id);
                                                                setAnchorEl(e.currentTarget);
                                                                setHighlightedIndex(0);
                                                            }}
                                                            onKeyDown={(e) => handleKeyDown(e, editFormData.company_name || "", true, id)}
                                                            onFocus={(e) => {
                                                                setActiveDropdownRow(id);
                                                                setAnchorEl(e.currentTarget);
                                                            }}
                                                            className={inputClass}
                                                            autoComplete="off"
                                                        />
                                                        {activeDropdownRow === id && editFormData.company_name && (
                                                            <PortalDropdown
                                                                anchorEl={anchorEl}
                                                                isOpen={activeDropdownRow === id}
                                                                onClose={() => { setActiveDropdownRow(null); setAnchorEl(null); }}
                                                            >
                                                                {allVendors.filter(v => v.company_name.toLowerCase().includes(editFormData.company_name.toLowerCase())).map((vendor, vIndex) => (
                                                                    <li
                                                                        key={vendor.id}
                                                                        onClick={() => handleEditVendorSelect(vendor)}
                                                                        className={`px-3 py-2 cursor-pointer text-gray-200 text-xs border-b border-gray-700 last:border-0 ${vIndex === highlightedIndex ? "bg-blue-600" : "hover:bg-gray-700"
                                                                            }`}
                                                                    >
                                                                        <div className="font-bold">{vendor.company_name}</div>
                                                                        <div className="text-gray-400 text-[10px]">{vendor.job_nature}</div>
                                                                    </li>
                                                                ))}
                                                                {allVendors.filter(v => v.company_name.toLowerCase().includes(editFormData.company_name.toLowerCase())).length === 0 && (
                                                                    <li className="px-3 py-2 text-gray-500 text-xs italic">No matching vendors</li>
                                                                )}
                                                            </PortalDropdown>
                                                        )}
                                                    </div>
                                                ) : contact.company_name}
                                            </td>
                                            <td className={tdClass}>
                                                {isEditing ? <input name="job_nature" value={editFormData.job_nature || ""} onChange={handleEditChange} className={inputClass} readOnly /> : contact.job_nature}
                                            </td>
                                            <td className={tdClass}>
                                                {isEditing ? <input name="contact_person" value={editFormData.contact_person || ""} onChange={handleEditChange} className={inputClass} /> : contact.contact_person}
                                            </td>
                                            <td className={tdClass}>
                                                {isEditing ? <input name="designation" value={editFormData.designation} onChange={handleEditChange} className={inputClass} /> : contact.designation}
                                            </td>
                                            <td className={tdClass}>
                                                {isEditing ? <textarea rows={1} name="responsibilities" value={editFormData.responsibilities} onChange={handleEditChange} className={inputClass} /> : contact.responsibilities}
                                            </td>
                                            <td className={tdClass}>
                                                {isEditing ? <input name="mobile_no" value={editFormData.mobile_no} onChange={handleEditChange} className={inputClass} /> : contact.mobile_no}
                                            </td>
                                            <td className={tdClass}>
                                                {isEditing ? <input name="email" value={editFormData.email} onChange={handleEditChange} className={inputClass} /> : (
                                                    <a href={`mailto:${contact.email}`} className="text-blue-400 hover:text-blue-300">{contact.email}</a>
                                                )}
                                            </td>
                                            <td className={tdClass}>
                                                {isEditing ? <textarea rows={1} name="address_line" value={editFormData.address_line} onChange={handleEditChange} className={inputClass} /> : contact.address_line}
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
                                                            <button onClick={() => handleEditClick(contact)} className="text-blue-500 hover:text-blue-400" title="Edit">
                                                                <span className="material-icons text-lg">edit</span>
                                                            </button>
                                                            <button onClick={() => handleDeleteClick(id)} className="text-red-500 hover:text-red-400" title="Delete">
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
                                {newRows.map((row) => (
                                    <tr key={row.tempId} className="bg-blue-900/10 hover:bg-blue-900/20 transition-colors duration-150 border-l-2 border-l-blue-500">
                                        <td className={`${tdClass} text-center`}>New</td>
                                        <td className={tdClass}>
                                            <input
                                                value={row.company_name}
                                                onChange={(e) => {
                                                    handleNewRowChange(row.tempId, 'company_name', e.target.value);
                                                    setActiveDropdownRow(row.tempId);
                                                    setAnchorEl(e.currentTarget);
                                                    setHighlightedIndex(0);
                                                }}
                                                onKeyDown={(e) => handleKeyDown(e, row.company_name || "", false, row.tempId)}
                                                onFocus={(e) => {
                                                    setActiveDropdownRow(row.tempId);
                                                    setAnchorEl(e.currentTarget);
                                                }}
                                                className={inputClass}
                                                placeholder="Company..."
                                                autoComplete="off"
                                            />
                                            {/* Dropdown - Portal based */}
                                            {activeDropdownRow === row.tempId && row.company_name && (
                                                <PortalDropdown
                                                    anchorEl={anchorEl}
                                                    isOpen={activeDropdownRow === row.tempId}
                                                    onClose={() => { setActiveDropdownRow(null); setAnchorEl(null); }}
                                                >
                                                    {allVendors.filter(v => v.company_name.toLowerCase().includes(row.company_name.toLowerCase())).map((vendor, vIndex) => (
                                                        <li
                                                            key={vendor.id}
                                                            onClick={() => handleVendorSelect(row.tempId, vendor)}
                                                            className={`px-3 py-2 cursor-pointer text-gray-200 text-xs border-b border-gray-700 last:border-0 ${vIndex === highlightedIndex ? "bg-blue-600" : "hover:bg-gray-700"
                                                                }`}
                                                        >
                                                            <div className="font-bold">{vendor.company_name}</div>
                                                            <div className="text-gray-400 text-[10px]">{vendor.job_nature}</div>
                                                        </li>
                                                    ))}
                                                    {allVendors.filter(v => v.company_name.toLowerCase().includes(row.company_name.toLowerCase())).length === 0 && (
                                                        <li className="px-3 py-2 text-gray-500 text-xs italic">No matching vendors</li>
                                                    )}
                                                </PortalDropdown>
                                            )}
                                        </td>
                                        <td className={tdClass}><input value={row.job_nature} onChange={(e) => handleNewRowChange(row.tempId, 'job_nature', e.target.value)} className={inputClass} placeholder="Job..." /></td>
                                        <td className={tdClass}><input value={row.contact_person} onChange={(e) => handleNewRowChange(row.tempId, 'contact_person', e.target.value)} className={inputClass} placeholder="Name..." /></td>
                                        <td className={tdClass}><input value={row.designation} onChange={(e) => handleNewRowChange(row.tempId, 'designation', e.target.value)} className={inputClass} placeholder="Role..." /></td>
                                        <td className={tdClass}><textarea rows={1} value={row.responsibilities} onChange={(e) => handleNewRowChange(row.tempId, 'responsibilities', e.target.value)} className={inputClass} placeholder="Calculations..." /></td>
                                        <td className={tdClass}><input value={row.mobile_no} onChange={(e) => handleNewRowChange(row.tempId, 'mobile_no', e.target.value)} className={inputClass} placeholder="Mobile..." /></td>
                                        <td className={tdClass}><input value={row.email} onChange={(e) => handleNewRowChange(row.tempId, 'email', e.target.value)} className={inputClass} placeholder="Email..." /></td>
                                        <td className={tdClass}><textarea rows={1} value={row.address_line} onChange={(e) => handleNewRowChange(row.tempId, 'address_line', e.target.value)} className={inputClass} placeholder="Address..." /></td>
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
                                ))}
                            </tbody>
                        </table>

                        {!loading && contacts.length === 0 && newRows.length === 0 && (
                            <div className="p-8 text-center text-gray-400">
                                <p className="mb-4">No project contacts found.</p>
                                <button onClick={addNewRow} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded border border-gray-600">
                                    Add First Contact
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Custom Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 max-w-sm w-full p-6 animate-fade-in-up">
                        <div className="flex items-center gap-3 mb-4 text-red-400">
                            <span className="material-icons text-3xl">warning</span>
                            <h3 className="text-xl font-bold text-white">Confirm Deletion</h3>
                        </div>
                        <p className="text-gray-300 mb-6">
                            Are you sure you want to delete this contact? This action cannot be undone.
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

export default ProjectDirectory;
