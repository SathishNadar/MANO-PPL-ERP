import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

function DprEditor() {
  const { projectId } = useParams();

  const [project, setProject] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [employer, setEmployer] = useState("");
  const [location, setLocation] = useState("");
  const [projectCode, setProjectCode] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [metadata, setMetadata] = useState({ agency: [], labour_type: [] });
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingDetails, setSavingDetails] = useState(false);
  const [savingMetadata, setSavingMetadata] = useState(false);

  const [userRoles, setUserRoles] = useState({
    reporter: [],
    client: [],
    final_approver: null,
    approver: null,
  });
  const [eligibleUsers, setEligibleUsers] = useState([]);

  const agencyInputRef = useRef(null);
  const labourInputRef = useRef(null);

  const agencyDict = [
    "A TO Z GRILL FABRICATION",
    "AAKASH UNIVERSAL",
    "ABHISHEK SHIRKE",
    "ADITYA ENTERPRISES",
    "AETREUM CONCRETE",
    "AP INTERIOR",
    "AP INTERIORS",
    "ART DECORATOR",
    "ASTECH ENGINEERS",
    "ATERUM CONCRETE",
    "BANDU PRABHU NARWADE",
    "BANNAPPA PUJARI",
    "BASANT FLOORING PVTLTD",
    "BATH DÉCOR",
    "BATH JEWELS",
    "BHOOMI ROAD CONTRACTOR",
    "BRIGHT LIGHT",
    "CERA HUB",
    "D & K WATER TANK CLEANER",
    "DARSHIL FABMET PVTLTD",
    "DHANJI PANGAM",
    "EARTHSTONE INFRA PVTLTD",
    "ELLAPPA BABULAL PAWAR",
    "EMMACE CORPORATION",
    "GAUD WATER PUMP SERVICE",
    "GAYATRI GLASS",
    "GOEL POWER ENGINEERS",
    "HALLMARK HUDRO PROJECTS",
    "HELARAM MANDAL",
    "HIMALAYA TRADERS",
    "HKS FLOORING LLP",
    "INDIA WATER PUMP",
    "JATIN CORPORATION",
    "JESUS ENTERPRISE",
    "JESUS ENTERPRISES",
    "KALIMI ENTERPRISES",
    "KAY TEE INTERNATIONAL",
    "LABDHI TRADING CO",
    "LABHDI TRADER",
    "LEE TILES CERAMICS",
    "LIME LIGHT",
    "M D ENTERPRISES",
    "MALACH CONSTRUCTION",
    "MALLAPPA PUJARI",
    "MAP WORLDWIDE SERVICES",
    "MAYUR CONSTRUCTION",
    "MD ENTERPRISE",
    "MIDAS CONSTRUCTION",
    "MIRA MACHINE TOOLS",
    "MK ENTERPRISE",
    "MK ENTERPRISES",
    "NAIK ENVIRONMENTAL ENGINEERS",
    "NARAYAN WATER SUPPLIES",
    "NATIONAL ELECTRICAL WORLD",
    "NATIONAL PLY LAMINATE",
    "NEAT 'N' CLEAN",
    "NJ ENTERPRISES",
    "OM SAI APPLIANCE",
    "OM SAI APPLIANCES",
    "ORANGE MACHINETECH PVT LTD",
    "PARTH HIGH RISE SAFETY",
    "PIE ENTERPRISES",
    "PIYALI DAS MANDAL",
    "PLUMTECH ENGINEERING",
    "POLLUCON ENVIRO ENGINEERS",
    "POLLUCON ENVIRONMENT ENGINEERS PVTLTD",
    "PRIYAL FABRICATION",
    "R TECH ENGINEERING",
    "RAKHI MANDAL",
    "RAM PRAVESH GUPTA",
    "RAYEES IMPEX PVTLTD",
    "RISHAB STONE",
    "S M ENTERPRISE",
    "SAGAR CONSTRUCTION LIFTS",
    "SAMARTH CONSTRUCTION",
    "SAMBHAV TRADERS",
    "SAMRAT ENTERPRISES",
    "SHAMBHAV TRADERS",
    "SHAMSUDDIN SHAIKH",
    "SHREEJI ENTERPRISES",
    "SHRI SATGURU KRIPA EARTH MOVERS",
    "SIDDHI ENTERPRISE",
    "SJASSOCIATES",
    "SK HARDWARE",
    "SM ENTERPRISES",
    "SNMANE ROAD CONTRACTOR",
    "SOLANKI TRADER",
    "SOLANKI TRADERS",
    "SOLGEN GREENTECH LLP",
    "SPLENDID ENTERPRISES",
    "TAG CONSTRUCTION AND GREEN SOLUTION",
    "TK ENTERPRISES",
    "TOSHIBA JOHNSON ELEVATORS INDIA PVT LTD",
    "UN COPORATION",
    "VIVAN WATER & ENVIRO SOLUTION",
    "WELCOME COLOURS AND CHEMICALS",
    "YASH ENTERPRISE",
  ];
  const labourDict = [
    "mason",
    "electrical",
    "painter",
    "welder",
    "carpenter",
    "fitter",
    "gypsum",
    "plumber",
    "helper",
    "staff",
  ];

  const [availableAgencies, setAvailableAgencies] = useState(agencyDict);
  const [availableLabourTypes, setAvailableLabourTypes] = useState(labourDict);
  const [initialRoles, setInitialRoles] = useState(null);
  // Fetch project and metadata
  useEffect(() => {
    if (!projectId) return;
    async function fetchProject() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/project/getProject/${projectId}`,
          { credentials: "include" }
        );
        const data = await res.json();
        if (res.ok && data.success) {
          setProject(data.data);
          setProjectName(data.data.project_name || "");
          setEmployer(data.data.Employer || "");
          setLocation(data.data.location || "");
          setProjectCode(data.data.project_code || "");
          setProjectDescription(data.data.project_description || "");

          setStartDate(
            data.data.start_date
              ? new Date(
                  new Date(data.data.start_date).setDate(
                    new Date(data.data.start_date).getDate() + 1
                  )
                )
                  .toISOString()
                  .split("T")[0]
              : ""
          );
          setEndDate(
            data.data.end_date
              ? new Date(
                  new Date(data.data.end_date).setDate(
                    new Date(data.data.end_date).getDate() + 1
                  )
                )
                  .toISOString()
                  .split("T")[0]
              : ""
          );

          if (data.data.metadata) {
            setMetadata({
              agency: data.data.metadata.agency || [],
              labour_type: data.data.metadata.labour_type || [],
            });
            // remove already-selected items from available lists
            setAvailableAgencies((prev) =>
              prev.filter((a) => !(data.data.metadata.agency || []).includes(a))
            );
            setAvailableLabourTypes((prev) =>
              prev.filter(
                (b) => !(data.data.metadata.labour_type || []).includes(b)
              )
            );
          }
        }
      } catch (e) {
        console.error("Error fetching project:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchProject();

    async function fetchRoles() {
      try {
        const [rolesRes, usersRes] = await Promise.all([
          fetch(`${API_BASE}/project/getuserroles/${projectId}`, {
            credentials: "include",
          }),
          fetch(`${API_BASE}/Project/eligibleUsers`, {
            credentials: "include",
          }),
        ]);

        const rolesData = await rolesRes.json();
        const usersData = await usersRes.json();

        if (rolesData.ok && usersData.ok) {
          setEligibleUsers(usersData.users);

          const usersMap = new Map(usersData.users.map((u) => [u.user_id, u]));
          const mapUser = (id) =>
            usersMap.get(id) || { user_id: id, name: `Unknown (${id})` };

          const loadedRoles = {
            reporter: (rolesData.data?.reporter || []).map(mapUser),
            client: (rolesData.data?.client || []).map(mapUser),
            approver: rolesData.data?.approver
              ? mapUser(rolesData.data.approver)
              : null,
            final_approver: rolesData.data?.final_approver
              ? mapUser(rolesData.data.final_approver)
              : null,
          };

          // 👇 don’t wrap in { loadedRoles: ... }
          setUserRoles(loadedRoles);
          setInitialRoles(loadedRoles);
        }
      } catch (err) {
        console.error("Error fetching roles:", err);
      }
    }

    fetchRoles();
  }, [projectId]);

  function buildUserRoleUpdatePayload(initialRoles, userRoles) {
    if (!initialRoles) return {};

    const ids = (arr) => arr.map((u) => u.user_id);

    const oldReporters = ids(initialRoles.reporter);
    const newReporters = ids(userRoles.reporter);

    const oldClients = ids(initialRoles.client);
    const newClients = ids(userRoles.client);

    return {
      reporter: {
        insert: newReporters.filter((id) => !oldReporters.includes(id)),
        delete: oldReporters.filter((id) => !newReporters.includes(id)),
      },
      client: {
        insert: newClients.filter((id) => !oldClients.includes(id)),
        delete: oldClients.filter((id) => !newClients.includes(id)),
      },
      approver: userRoles.approver?.user_id || null,
      final_approver: userRoles.final_approver?.user_id || null,
    };
  }

  function handleRoleChange(role, target, isMulti = false) {
    if (isMulti) {
      // Collect all selected options
      const selected = Array.from(target.selectedOptions, (opt) =>
        parseInt(opt.value, 10)
      );
      setUserRoles((prev) => ({
        ...prev,
        [role]: eligibleUsers.filter((u) => selected.includes(u.user_id)),
      }));
    } else {
      const val = parseInt(target.value, 10);
      setUserRoles((prev) => ({
        ...prev,
        [role]: val ? eligibleUsers.find((u) => u.user_id === val) : null,
      }));
    }
  }

  // Save project details
  async function saveProject() {
    setSavingDetails(true);
    const userRoleChanges = buildUserRoleUpdatePayload(initialRoles, userRoles);

    try {
      const res = await fetch(`${API_BASE}/project/updateProject/${projectId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            project_name: projectName,
            Employer: employer,
            location,
            project_code: projectCode,
            project_description: projectDescription,
            start_date: startDate || null,
            end_date: endDate || null,
            metadata,
            user_roles: userRoleChanges, // merge metadata into the same payload
          }),
        }
      );

      const data = await res.json();
      if (res.ok && (data.ok || data.success)) {
        toast.success("Project details & metadata saved successfully!");
        setInitialRoles(userRoles);
      } else {
        toast.error(data.message || "Failed to save project data");
      }
    } catch (e) {
      console.error("Error saving project:", e);
      alert("Error saving project");
    }
    setSavingDetails(false);
  }

  // Add / remove agency (row)
  function handleAddAgency(val, inputRef) {
    const trimmed = (val || "").toString().trim();
    if (
      trimmed &&
      !metadata.agency.includes(trimmed) &&
      availableAgencies.includes(trimmed)
    ) {
      setMetadata((prev) => ({ ...prev, agency: [...prev.agency, trimmed] }));
      setAvailableAgencies((prev) => prev.filter((a) => a !== trimmed));
    }
    if (inputRef) {
      inputRef.value = "";
      inputRef.focus();
    }
  }

  function removeAgency(idx) {
    setMetadata((prev) => {
      const removed = prev.agency[idx];
      const newAgency = prev.agency.filter((_, i) => i !== idx);
      setAvailableAgencies((list) =>
        list.includes(removed) ? list : [...list, removed]
      );
      return { ...prev, agency: newAgency };
    });
  }

  // Add / remove labour_type (col)

  function handleAddLabourType(val, inputRef) {
    const trimmed = (val || "").toString().trim();
    if (
      trimmed &&
      !metadata.labour_type.includes(trimmed) &&
      availableLabourTypes.includes(trimmed)
    ) {
      setMetadata((prev) => ({
        ...prev,
        labour_type: [...prev.labour_type, trimmed],
      }));
      setAvailableLabourTypes((prev) => prev.filter((b) => b !== trimmed));
    }
    if (inputRef) {
      inputRef.value = "";
      inputRef.focus();
    }
  }

  function removeLabourType(idx) {
    setMetadata((prev) => {
      const removed = prev.labour_type[idx];
      const newLabour = prev.labour_type.filter((_, i) => i !== idx);
      setAvailableLabourTypes((list) =>
        list.includes(removed) ? list : [...list, removed]
      );
      return { ...prev, labour_type: newLabour };
    });
  }

  // Drag and drop handlers
  function onDragStart(e, index, type) {
    e.dataTransfer.setData("text/plain", JSON.stringify({ index, type }));
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function onDrop(e, dropIndex, dropType) {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData("text/plain"));
    if (data.type !== dropType) return;
    if (dropType === "row") {
      setMetadata((prev) => {
        const newAgency = [...prev.agency];
        const [moved] = newAgency.splice(data.index, 1);
        newAgency.splice(dropIndex, 0, moved);
        return { ...prev, agency: newAgency };
      });
    } else {
      setMetadata((prev) => {
        const newLabour = [...prev.labour_type];
        const [moved] = newLabour.splice(data.index, 1);
        newLabour.splice(dropIndex, 0, moved);
        return { ...prev, labour_type: newLabour };
      });
    }
  }

  if (loading)
    return <div className="text-center text-white mt-20">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 px-6 py-8 md:px-16 lg:px-28">
      <h1 className="text-3xl font-extrabold mb-8 text-white text-center">
        Daily Progress Report Editor
      </h1>

      {/* Project Details */}
      <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700 shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-[#BBDEFB]">
          Project Details
        </h2>
        <form>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="projectName"
                className="block text-gray-300 mb-1 font-semibold"
              >
                Project Name
              </label>
              <input
                id="projectName"
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full bg-transparent border-b border-gray-500 focus:border-blue-500 outline-none text-white py-1 transition-colors"
                placeholder="Project Name"
              />
            </div>
            <div>
              <label
                htmlFor="employer"
                className="block text-gray-300 mb-1 font-semibold"
              >
                Employer
              </label>
              <input
                id="employer"
                type="text"
                value={employer}
                onChange={(e) => setEmployer(e.target.value)}
                className="w-full bg-transparent border-b border-gray-500 focus:border-blue-500 outline-none text-white py-1 transition-colors"
                placeholder="Enter employer"
              />
            </div>
            <div>
              <label
                htmlFor="projectCode"
                className="block text-gray-300 mb-1 font-semibold"
              >
                Project Code
              </label>
              <input
                id="projectCode"
                type="text"
                value={projectCode}
                onChange={(e) => setProjectCode(e.target.value)}
                className="w-full bg-transparent border-b border-gray-500 focus:border-blue-500 outline-none text-white py-1 transition-colors"
                placeholder="Enter project code"
              />
            </div>
            <div>
              <label
                htmlFor="location"
                className="block text-gray-300 mb-1 font-semibold"
              >
                Location
              </label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-transparent border-b border-gray-500 focus:border-blue-500 outline-none text-white py-1 transition-colors"
                placeholder="Enter location"
              />
            </div>
            <div>
              <label
                htmlFor="startDate"
                className="block text-gray-300 mb-1 font-semibold"
              >
                Start Date
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-transparent border-b border-gray-500 focus:border-blue-500 outline-none text-white py-1 transition-colors"
                style={{ colorScheme: "dark" }}
              />
            </div>
            <div>
              <label
                htmlFor="endDate"
                className="block text-gray-300 mb-1 font-semibold"
              >
                End Date
              </label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-transparent border-b border-gray-500 focus:border-blue-500 outline-none text-white py-1 transition-colors"
                style={{ colorScheme: "dark" }}
              />
            </div>
            <div className="md:col-span-2">
              <label
                htmlFor="projectDescription"
                className="block text-gray-300 mb-1 font-semibold"
              >
                Project Description
              </label>
              <textarea
                id="projectDescription"
                rows={4}
                className="w-full bg-transparent border-b border-gray-500 focus:border-blue-500 outline-none text-white py-1 transition-colors resize-y"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Enter project description"
              />
            </div>
          </div>
        </form>
      </div>

      {/* Metadata Editor */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg mb-8">
        <h2 className="text-xl font-semibold mb-4 text-[#BBDEFB]">
          Agency & Labour Type Metadata
        </h2>

        <div className="mb-4 flex flex-wrap gap-4 items-end">
          <div>
            <label
              htmlFor="agencyInput"
              className="block mb-1 font-semibold text-gray-300"
            >
              Add Agency
            </label>
            <input
              ref={agencyInputRef}
              id="agencyInput"
              list="agency-list"
              placeholder="Select or type agency"
              onChange={(e) =>
                handleAddAgency(e.target.value, agencyInputRef.current)
              }
              className="bg-gray-700 text-white rounded px-3 py-1 w-64 outline-none"
            />
            <datalist id="agency-list">
              {availableAgencies.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
          </div>
          <div className="flex flex-row items-end gap-2">
            <div>
              <label
                htmlFor="labourInput"
                className="block mb-1 font-semibold text-gray-300"
              >
                Add Labour Type
              </label>
              <input
                ref={labourInputRef}
                id="labourInput"
                list="labour-list"
                placeholder="Select or type labour type"
                onChange={(e) =>
                  handleAddLabourType(e.target.value, labourInputRef.current)
                }
                className="bg-gray-700 text-white rounded px-3 py-1 w-64 outline-none"
              />
              <datalist id="labour-list">
                {availableLabourTypes.map((l) => (
                  <option key={l} value={l} />
                ))}
              </datalist>
            </div>
            <button
              type="button"
              onClick={() => setEditMode((em) => !em)}
              className={`ml-2 mb-1 px-2 py-1 rounded text-xs flex items-center gap-1 ${
                editMode
                  ? "bg-yellow-500 text-gray-900 hover:bg-yellow-400"
                  : "bg-gray-600 text-gray-200 hover:bg-gray-500"
              }`}
              title={editMode ? "Exit Edit Mode" : "Enter Edit Mode"}
            >
              {/* Pencil icon SVG */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="inline-block w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.232 5.232l3.536 3.536M9 13l6.768-6.768a2 2 0 112.828 2.828L11.828 15.828A4 4 0 018 17H5v-3a4 4 0 011.172-2.828z"
                />
              </svg>
              <span>{editMode ? "Done" : "Edit"}</span>
            </button>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="min-w-full border border-gray-600 table-auto">
            <thead className="bg-gray-700 select-none">
              <tr>
                <th className="border border-gray-600 p-2 text-left text-sm font-semibold">
                  Agency / Labour Type
                </th>
                {metadata.labour_type.map((labour, i) => (
                  <th
                    key={i}
                    className="border border-gray-600 p-2 text-sm font-semibold relative cursor-move group"
                    draggable
                    onDragStart={(e) => onDragStart(e, i, "col")}
                    onDragOver={onDragOver}
                    onDrop={(e) => onDrop(e, i, "col")}
                    title="Drag to reorder"
                  >
                    <span className="flex items-center gap-1">
                      {labour}
                      {editMode && (
                        <button
                          type="button"
                          className="ml-1 text-xs text-red-400 hover:text-red-600 px-1"
                          title="Remove Labour Type"
                          onClick={() => removeLabourType(i)}
                          tabIndex={-1}
                        >
                          ×
                        </button>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metadata.agency.length === 0 ? (
                <tr>
                  <td
                    colSpan={metadata.labour_type.length + 1}
                    className="text-center py-4 text-gray-400 italic"
                  >
                    No agencies added yet.
                  </td>
                </tr>
              ) : (
                metadata.agency.map((agency, i) => (
                  <tr
                    key={i}
                    className="hover:bg-gray-700 select-none"
                    draggable
                    onDragStart={(e) => onDragStart(e, i, "row")}
                    onDragOver={onDragOver}
                    onDrop={(e) => onDrop(e, i, "row")}
                    title="Drag to reorder"
                  >
                    <td className="border border-gray-600 p-2 font-semibold">
                      <span className="flex items-center gap-1">
                        {agency}
                        {editMode && (
                          <button
                            type="button"
                            className="ml-1 text-xs text-red-400 hover:text-red-600 px-1"
                            title="Remove Agency"
                            onClick={() => removeAgency(i)}
                            tabIndex={-1}
                          >
                            ×
                          </button>
                        )}
                      </span>
                    </td>
                    {metadata.labour_type.map((_, j) => (
                      <td
                        key={j}
                        className="border border-gray-600 p-2 bg-gray-800"
                      />
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Roles Editor */}
      <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700 shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-[#BBDEFB]">
          User Roles
        </h2>

        {/* Reporters -multi selct */}
        <div className="mb-4">
          <label className="block text-gray-300 mb-1 font-semibold">
            Reporter(s)
          </label>

          {/* Add Reporter Dropdown */}
          <select
            className="bg-gray-700 text-white rounded px-3 py-2 w-full mb-2"
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (val) {
                const selectedUser = eligibleUsers.find(
                  (u) => u.user_id === val
                );
                setUserRoles((prev) => ({
                  ...prev,
                  reporter: [...prev.reporter, selectedUser].filter(
                    (v, i, arr) =>
                      arr.findIndex((x) => x.user_id === v.user_id) === i // avoid duplicates
                  ),
                }));
              }
              e.target.value = ""; // reset dropdown
            }}
          >
            <option value="">+ Add Reporter</option>
            {eligibleUsers
              .filter(
                (u) => !userRoles.reporter.some((r) => r.user_id === u.user_id)
              )
              .map((u) => (
                <option key={u.user_id} value={u.user_id}>
                  {u.name}
                </option>
              ))}
          </select>

          {/* Selected Reporters */}
          <div className="space-y-1">
            {userRoles.reporter.map((user) => (
              <div
                key={user.user_id}
                className="flex items-center justify-between bg-gray-800 px-3 py-1 rounded"
              >
                <span>{user.name}</span>
                <button
                  type="button"
                  onClick={() =>
                    setUserRoles((prev) => ({
                      ...prev,
                      reporter: prev.reporter.filter(
                        (u) => u.user_id !== user.user_id
                      ),
                    }))
                  }
                  className="text-red-400 hover:text-red-200"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Approver (single select) */}
        <div className="mb-4">
          <label className="block text-gray-300 mb-1 font-semibold">
            Approver
          </label>
          <select
            className="bg-gray-700 text-white rounded px-3 py-2 w-full"
            value={userRoles.approver?.user_id || ""}
            onChange={(e) => handleRoleChange("approver", e.target)}
          >
            <option value="">-- Select --</option>
            {eligibleUsers.map((u) => (
              <option key={u.user_id} value={u.user_id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        {/* Final Approver (single select) */}
        <div className="mb-2">
          <label className="block text-gray-300 mb-1 font-semibold">
            Final Approver
          </label>
          <select
            className="bg-gray-700 text-white rounded px-3 py-2 w-full"
            value={userRoles.final_approver?.user_id || ""}
            onChange={(e) => handleRoleChange("final_approver", e.target)}
          >
            <option value="">-- Select --</option>
            {eligibleUsers.map((u) => (
              <option key={u.user_id} value={u.user_id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        {/* Clients Multi select */}
        <div className="mb-4">
          <label className="block text-gray-300 mb-1 font-semibold">
            Client(s)
          </label>

          {/* Add Client Dropdown */}
          <select
            className="bg-gray-700 text-white rounded px-3 py-2 w-full mb-2"
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (val) {
                const selectedUser = eligibleUsers.find(
                  (u) => u.user_id === val
                );
                setUserRoles((prev) => ({
                  ...prev,
                  client: [...prev.client, selectedUser].filter(
                    (v, i, arr) =>
                      arr.findIndex((x) => x.user_id === v.user_id) === i
                  ),
                }));
              }
              e.target.value = "";
            }}
          >
            <option value="">+ Add Client</option>
            {eligibleUsers
              .filter(
                (u) => !userRoles.client.some((c) => c.user_id === u.user_id)
              )
              .map((u) => (
                <option key={u.user_id} value={u.user_id}>
                  {u.name}
                </option>
              ))}
          </select>

          {/* Selected Clients */}
          <div className="space-y-1">
            {userRoles.client.map((user) => (
              <div
                key={user.user_id}
                className="flex items-center justify-between bg-gray-800 px-3 py-1 rounded"
              >
                <span>{user.name}</span>
                <button
                  type="button"
                  onClick={() =>
                    setUserRoles((prev) => ({
                      ...prev,
                      client: prev.client.filter(
                        (u) => u.user_id !== user.user_id
                      ),
                    }))
                  }
                  className="text-red-400 hover:text-red-200"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={saveProject}
        disabled={savingDetails}
        className="px-4 py-2 mt-4 bg-blue-600 hover:bg-blue-700 rounded text-white w-[100%] hover:cursor-pointer"
      >
        {savingDetails ? "Saving..." : "Save Project"}
      </button>
    </div>
  );
}

export default DprEditor;
