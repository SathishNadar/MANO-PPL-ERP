import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const API_URI = import.meta.env.VITE_API_URI;
const PORT = import.meta.env.VITE_BACKEND_PORT;

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
    "Mason",
    "Electrical",
    "Painter",
    "Welder",
    "Carp",
    "Fitter",
    "Gypsum",
    "Plumber",
    "Helper",
    "Staff",
  ];

  // Fetch project and metadata
  useEffect(() => {
    if (!projectId) return;

    async function fetchProject() {
      setLoading(true);
      try {
        const res = await fetch(
          `http://${API_URI}:${PORT}/project/getProject/${projectId}`,
          {
            credentials: "include",
          }
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
            data.data.start_date ? data.data.start_date.split("T")[0] : ""
          );
          setEndDate(
            data.data.end_date ? data.data.end_date.split("T")[0] : ""
          );

          if (data.data.metadata) {
            setMetadata({
              agency: data.data.metadata.agency || [],
              labour_type: data.data.metadata.labour_type || [],
            });
          } else {
            setMetadata({ agency: [], labour_type: [] });
          }
        } else {
          alert(data.message || "Failed to fetch project data");
        }
      } catch (e) {
        console.error("Error fetching project:", e);
        alert("Error fetching project data");
      } finally {
        setLoading(false);
      }
    }
    fetchProject();
  }, [projectId]);

  // Save project details
  async function saveProjectDetails() {
    setSavingDetails(true);
    try {
      const res = await fetch(
        `http://${API_URI}:${PORT}/project/updateProject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            project_id: projectId,
            project_name: projectName,
            Employer: employer,
            location,
            project_code: projectCode,
            project_description: projectDescription,
            start_date: project?.start_date
              ? new Date(project.start_date).toISOString().split("T")[0]
              : startDate
              ? new Date(startDate).toISOString().split("T")[0]
              : null,
            end_date: endDate
              ? new Date(endDate).toISOString().split("T")[0]
              : null,
          }),
        }
      );
      const data = await res.json();
      if (res.ok && data.ok) {
        alert("Project details saved!");
      } else {
        alert(data.message || "Failed to save project details");
      }
    } catch (e) {
      alert("Error saving project details");
    }
    setSavingDetails(false);
  }

  // Add / remove agency (row)
  function addAgency() {
    setMetadata((prev) => ({ ...prev, agency: [...prev.agency, ""] }));
  }
  function removeAgency(idx) {
    setMetadata((prev) => ({
      ...prev,
      agency: prev.agency.filter((_, i) => i !== idx),
    }));
  }
  function updateAgency(idx, val) {
    setMetadata((prev) => {
      const newAgency = [...prev.agency];
      newAgency[idx] = val;
      return { ...prev, agency: newAgency };
    });
  }

  // Add / remove labour_type (col)
  function addLabourType() {
    setMetadata((prev) => ({
      ...prev,
      labour_type: [...prev.labour_type, ""],
    }));
  }
  function removeLabourType(idx) {
    setMetadata((prev) => ({
      ...prev,
      labour_type: prev.labour_type.filter((_, i) => i !== idx),
    }));
  }
  function updateLabourType(idx, val) {
    setMetadata((prev) => {
      const newLabour = [...prev.labour_type];
      newLabour[idx] = val;
      return { ...prev, labour_type: newLabour };
    });
  }

  // Save metadata (you can extend to call backend update API for metadata)
  // Save metadata
  async function saveMetadata() {
    setSavingMetadata(true);
    try {
      const res = await fetch(
        `http://${API_URI}:${PORT}/project/updateMetadata`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: projectId,
            metadata, // already in { agency: [...], labour_type: [...] }
          }),
        }
      );

      const data = await res.json();
      if (res.ok && data.success) {
        alert("Metadata saved successfully!");
      } else {
        alert(data.message || "Failed to save metadata");
      }
    } catch (e) {
      console.error("Error saving metadata:", e);
      alert("Error saving metadata");
    }
    setSavingMetadata(false);
  }

  // Handle adding agency from input
  function handleAddAgency(e) {
    const val = e.target.value.trim();
    if (val && !metadata.agency.includes(val) && agencyDict.includes(val)) {
      setMetadata((prev) => ({ ...prev, agency: [...prev.agency, val] }));
    }
    e.target.value = "";
  }

  // Handle adding labour type from input
  function handleAddLabourType(e) {
    const val = e.target.value.trim();
    if (
      val &&
      !metadata.labour_type.includes(val) &&
      labourDict.includes(val)
    ) {
      setMetadata((prev) => ({
        ...prev,
        labour_type: [...prev.labour_type, val],
      }));
    }
    e.target.value = "";
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
    if (data.type !== dropType) return; // only reorder within same type

    if (dropType === "row") {
      if (data.index === dropIndex) return;
      setMetadata((prev) => {
        const newAgency = [...prev.agency];
        const [moved] = newAgency.splice(data.index, 1);
        newAgency.splice(dropIndex, 0, moved);
        return { ...prev, agency: newAgency };
      });
    } else if (dropType === "col") {
      if (data.index === dropIndex) return;
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
          <button
            type="button"
            onClick={saveProjectDetails}
            disabled={savingDetails}
            className={`mt-6 w-full px-5 py-2 rounded font-semibold ${
              savingDetails
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {savingDetails ? "Saving..." : "Save Project Details"}
          </button>
        </form>
      </div>

      {/* Metadata Editor */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
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
              id="agencyInput"
              list="agency-list"
              placeholder="Select or type agency"
              onBlur={handleAddAgency}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddAgency(e);
                }
              }}
              className="bg-gray-700 text-white rounded px-3 py-1 w-64 outline-none"
            />
            <datalist id="agency-list">
              {agencyDict.map((agency, idx) => (
                <option key={idx} value={agency} />
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
                id="labourInput"
                list="labour-list"
                placeholder="Select or type labour type"
                onBlur={handleAddLabourType}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddLabourType(e);
                  }
                }}
                className="bg-gray-700 text-white rounded px-3 py-1 w-64 outline-none"
              />
              <datalist id="labour-list">
                {labourDict.map((labour, idx) => (
                  <option key={idx} value={labour} />
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

        <button
          onClick={saveMetadata}
          disabled={savingMetadata}
          className={`mt-4 px-6 py-2 rounded font-semibold ${
            savingMetadata
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {savingMetadata ? "Saving..." : "Save Metadata"}
        </button>
      </div>
    </div>
  );
}

export default DprEditor;
