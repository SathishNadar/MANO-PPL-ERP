import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

function DailyProgressReport() {
  const API_URI = import.meta.env.VITE_API_URI;
  const PORT = import.meta.env.VITE_BACKEND_PORT;

  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [condition, setCondition] = React.useState("normal"); // "normal" or "rainy"
  const [timeSlots, setTimeSlots] = React.useState([
    { from: "", to: "" },
    { from: "", to: "" },
    { from: "", to: "" }
  ]);
  const [labourReport, setLabourReport] = React.useState([]); // dynamic labour report rows

  useEffect(() => {
    if (!projectId) return;
    const fetchProjectDetails = async () => {
      try {
        const response = await fetch(`http://${API_URI}:${PORT}/project/getProject/${projectId}`);
        const projectData = await response.json();
        if (projectData.success) {
          const data = projectData.data;
          // Calculate days
          let totalDays = "--";
          let remainingDays = "--";
          if (data.start_date && data.end_date) {
            const startDate = new Date(data.start_date);
            const endDate = new Date(data.end_date);
            const today = new Date();
            totalDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
            const elapsedDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
            remainingDays = totalDays - elapsedDays > 0 ? totalDays - elapsedDays : 0;
          }
          setProject({ ...data, totalDays, remainingDays });

          // If API returns timeSlots, set them
          if (data.timeSlots && Array.isArray(data.timeSlots)) {
            setTimeSlots(data.timeSlots);
          }
          // If API returns condition, set it
          if (data.condition) {
            setCondition(data.condition);
          }
          // If API returns labour report
          if (data.labourReport && Array.isArray(data.labourReport)) {
            setLabourReport(data.labourReport);
          }
        }
      } catch (error) {
        console.error("Error fetching project details:", error);
      }
    };
    fetchProjectDetails();
  }, [projectId]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 px-4 py-6 md:px-12 lg:px-24">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-extrabold text-white mb-2">Daily Progress Report</h1>
        <p className="text-base text-[#BBDEFB]">25th July 2025</p>
      </div>
      {/* Project Details Card */}
      <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-800">
        <h2 className="text-lg font-medium mb-4 text-[#E0E0E0]">Project Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
          <div className="flex justify-between border-b border-gray-700 py-2 ">
            <span className="font-medium text-gray-200">Project Name</span>
            <span className="text-gray-400">{project?.project_name || "--"}</span>
          </div>
          <div className="flex justify-between border-b border-gray-700 py-2 ">
            <span className="font-medium text-gray-200">Employer</span>
            <span className="text-gray-400">{project?.Employer || "--"}</span>
          </div>
          {/* Removed Date row */}
          <div className="flex justify-between border-b border-gray-700 py-2 ">
            <span className="font-medium text-gray-200">Contract No</span>
            <span className="text-gray-400">{project?.project_code || "--"}</span>
          </div>
          <div className="flex justify-between border-b border-gray-700 py-2 ">
            <span className="font-medium text-gray-200">Location</span>
            <span className="text-gray-400">{project?.location || "--"}</span>
          </div>
          <div className="flex justify-between border-b border-gray-700 py-2 ">
            <span className="font-medium text-gray-200">Start Date</span>
            <span className="text-gray-400">{project?.start_date ? new Date(project.start_date).toLocaleDateString() : "--"}</span>
          </div>
          <div className="flex justify-between border-b border-gray-700 py-2 ">
            <span className="font-medium text-gray-200">End Date</span>
            <span className="text-gray-400">{project?.end_date ? new Date(project.end_date).toLocaleDateString() : "--"}</span>
          </div>
          <div className="flex justify-between border-b border-gray-700 py-2 col-span-1 md:col-span-2 ">
            <span className="font-medium text-gray-200">Project Description</span>
            <span className="text-gray-400 text-right">{project?.project_description || "--"}</span>
          </div>
        </div>
        {/* Duration in Days Section moved here */}
        <div className="mt-6">
          <h2 className="text-lg font-medium mb-4 text-[#E0E0E0]">Duration in Days</h2>
          <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:justify-around mt-4">
            <div className="text-center flex-1 bg-gray-800 rounded-lg py-2">
              <div className="text-xl font-bold text-white">{project?.totalDays || "--"}</div>
              <div className="text-sm text-gray-400 mt-1">Total</div>
            </div>
            <div className="text-center flex-1 bg-gray-800 rounded-lg py-2">
              <div className="text-xl font-bold text-white">
                {project?.totalDays && project?.remainingDays !== undefined
                  ? project.totalDays - project.remainingDays
                  : "--"}
              </div>
              <div className="text-sm text-gray-400 mt-1">Days Passed</div>
            </div>
            <div className="text-center flex-1 bg-gray-800 rounded-lg py-2">
              <div className="text-xl font-bold text-white">{project?.remainingDays || "--"}</div>
              <div className="text-sm text-gray-400 mt-1">Balance</div>
            </div>
          </div>
        </div>
      </div>



      {/* <!-- Condition & Time Slots --> */}
      <div className="grid grid-cols-2 md:grid-cols-[500px_minmax(0,1fr)] gap-6">
        {/* <!-- Condition --> */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-4">Condition</h2>
          <div className="flex justify-around text-xs gap-8 text-gray-300">
            <div
              className={`mx-1 text-center cursor-pointer pb-0.5 ${
                condition === "normal" ? "border-b-2 border-blue-400" : ""
              }`}
              onClick={() => setCondition("normal")}
            >
              <span className="material-icons text-yellow-400">wb_sunny</span>
              <p>Normal Day</p>
            </div>
            <div
              className={`mx-1 text-center cursor-pointer pb-0.5 ${
                condition === "normal" ? "border-b-2 border-blue-400" : ""
              }`}
              onClick={() => setCondition("normal")}
            >
              <span className="material-icons text-orange-400">terrain</span>
              <p>Dry</p>
            </div>
            <div
              className={`mx-1 text-center cursor-pointer pb-0.5 ${
                condition === "rainy" ? "border-b-2 border-blue-400" : ""
              }`}
              onClick={() => setCondition("rainy")}
            >
              <span className="material-icons text-blue-400">umbrella</span>
              <p>Rainy Day</p>
            </div>
            <div
              className={`mx-1 text-center cursor-pointer pb-0.5 ${
                condition === "rainy" ? "border-b-2 border-blue-400" : ""
              }`}
              onClick={() => setCondition("rainy")}
            >
              <span className="material-icons text-indigo-300">opacity</span>
              <p>Slushy</p>
            </div>
          </div>
        </div>

        {/* <!-- Time Slots --> */}
        {(condition === "rainy" || condition === "normal") && (
          <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Time Slots</h2>
              <button
                className="bg-blue-500 px-2 py-1 rounded text-sm hover:bg-blue-600"
                onClick={() => {
                  if (timeSlots.length >= 3) {
                    alert("Maximum of 3 time slots allowed");
                    return;
                  }
                  setTimeSlots((prev) => [...prev, { from: "", to: "" }]);
                }}
              >
                Add Time Slot
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {timeSlots.map((slot, idx) => (
                <div
                  className="flex items-center gap-2 bg-gray-700 px-3 py-2 rounded-lg shadow border border-gray-700 hover:border-blue-500 transition"
                  key={idx}
                >
                  <input
                    type="time"
                    className="p-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-200"
                    value={slot.from}
                    onChange={e => {
                      const newSlots = [...timeSlots];
                      newSlots[idx] = { ...newSlots[idx], from: e.target.value };
                      setTimeSlots(newSlots);
                    }}
                  />
                  <span>-</span>
                  <input
                    type="time"
                    className="p-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-200"
                    value={slot.to}
                    onChange={e => {
                      const toValue = e.target.value;
                      if (slot.from && toValue < slot.from) {
                        alert("End time cannot be earlier than start time");
                        return;
                      }
                      const newSlots = [...timeSlots];
                      newSlots[idx] = { ...newSlots[idx], to: toValue };
                      setTimeSlots(newSlots);
                    }}
                  />
                  <span
                    className="material-icons text-red-500 cursor-pointer"
                    onClick={() => {
                      setTimeSlots((prev) => prev.filter((_, i) => i !== idx));
                    }}
                  >
                    delete
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Labour Report Table */}
      <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-800">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">Labour Report Details</h2>
        <div className="overflow-x-auto rounded-lg">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="bg-gray-700 text-gray-300 uppercase text-xs font-semibold px-4 py-2">Agency</th>
                <th className="bg-gray-700 text-gray-300 uppercase text-xs font-semibold px-4 py-2">Help</th>
                <th className="bg-gray-700 text-gray-300 uppercase text-xs font-semibold px-4 py-2">Mason</th>
                <th className="bg-gray-700 text-gray-300 uppercase text-xs font-semibold px-4 py-2">Mill</th>
                <th className="bg-gray-700 text-gray-300 uppercase text-xs font-semibold px-4 py-2">Fitter</th>
                <th className="bg-gray-700 text-gray-300 uppercase text-xs font-semibold px-4 py-2">Carpenter</th>
                <th className="bg-gray-700 text-gray-300 uppercase text-xs font-semibold px-4 py-2">Helper</th>
                <th className="bg-gray-700 text-gray-300 uppercase text-xs font-semibold px-4 py-2">Foreman</th>
                <th className="bg-gray-700 text-gray-300 uppercase text-xs font-semibold px-4 py-2">Mechanic</th>
                <th className="bg-gray-700 text-gray-300 uppercase text-xs font-semibold px-4 py-2">Driver</th>
                <th className="bg-gray-700 text-gray-300 uppercase text-xs font-semibold px-4 py-2">Operator</th>
              </tr>
            </thead>
            <tbody>
              {labourReport && labourReport.length > 0 ? (
                <>
                  {labourReport.map((row, idx) => (
                    <tr className="bg-gray-800" key={row.agency || idx}>
                      <td className="border-b border-gray-800 px-4 py-2">{row.agency || "--"}</td>
                      <td className="border-b border-gray-800 px-4 py-2">{row.help ?? "--"}</td>
                      <td className="border-b border-gray-800 px-4 py-2">{row.mason ?? "--"}</td>
                      <td className="border-b border-gray-800 px-4 py-2">{row.mill ?? "--"}</td>
                      <td className="border-b border-gray-800 px-4 py-2">{row.fitter ?? "--"}</td>
                      <td className="border-b border-gray-800 px-4 py-2">{row.carpenter ?? "--"}</td>
                      <td className="border-b border-gray-800 px-4 py-2">{row.helper ?? "--"}</td>
                      <td className="border-b border-gray-800 px-4 py-2">{row.foreman ?? "--"}</td>
                      <td className="border-b border-gray-800 px-4 py-2">{row.mechanic ?? "--"}</td>
                      <td className="border-b border-gray-800 px-4 py-2">{row.driver ?? "--"}</td>
                      <td className="border-b border-gray-800 px-4 py-2">{row.operator ?? "--"}</td>
                    </tr>
                  ))}
                  {/* Optionally, total row calculation */}
                  <tr>
                    <td className="font-bold text-gray-200 px-4 py-2">Total</td>
                    <td className="font-bold text-gray-200 px-4 py-2">
                      {labourReport.reduce((acc, row) => acc + (Number(row.help) || 0), 0)}
                    </td>
                    <td className="font-bold text-gray-200 px-4 py-2">
                      {labourReport.reduce((acc, row) => acc + (Number(row.mason) || 0), 0)}
                    </td>
                    <td className="font-bold text-gray-200 px-4 py-2">
                      {labourReport.reduce((acc, row) => acc + (Number(row.mill) || 0), 0)}
                    </td>
                    <td className="font-bold text-gray-200 px-4 py-2">
                      {labourReport.reduce((acc, row) => acc + (Number(row.fitter) || 0), 0)}
                    </td>
                    <td className="font-bold text-gray-200 px-4 py-2">
                      {labourReport.reduce((acc, row) => acc + (Number(row.carpenter) || 0), 0)}
                    </td>
                    <td className="font-bold text-gray-200 px-4 py-2">
                      {labourReport.reduce((acc, row) => acc + (Number(row.helper) || 0), 0)}
                    </td>
                    <td className="font-bold text-gray-200 px-4 py-2">
                      {labourReport.reduce((acc, row) => acc + (Number(row.foreman) || 0), 0)}
                    </td>
                    <td className="font-bold text-gray-200 px-4 py-2">
                      {labourReport.reduce((acc, row) => acc + (Number(row.mechanic) || 0), 0)}
                    </td>
                    <td className="font-bold text-gray-200 px-4 py-2">
                      {labourReport.reduce((acc, row) => acc + (Number(row.driver) || 0), 0)}
                    </td>
                    <td className="font-bold text-gray-200 px-4 py-2">
                      {labourReport.reduce((acc, row) => acc + (Number(row.operator) || 0), 0)}
                    </td>
                  </tr>
                </>
              ) : (
                // fallback to no data
                <tr>
                  <td className="text-center text-gray-400 px-4 py-2" colSpan={11}>
                    No Labour Report Data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-800">
          <h2 className="text-lg font-medium mb-4 text-[#E0E0E0]">Today's Progress</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <span className="material-icons text-blue-400 mr-3">construction</span>
                <p>Concrete pouring for foundation</p>
              </div>
              <span className="text-sm text-gray-400">100%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <span className="material-icons text-blue-400 mr-3">square_foot</span>
                <p>Steel framework assembly</p>
              </div>
              <span className="text-sm text-gray-400">75%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <span className="material-icons text-blue-400 mr-3">electrical_services</span>
                <p>Electrical wiring installation</p>
              </div>
              <span className="text-sm text-gray-400">50%</span>
            </div>
          </div>
          <button className="bg-gray-600 text-white hover:bg-gray-700 rounded-lg font-medium cursor-pointer transition-colors duration-300 px-5 py-2 w-full mt-4">Add Task</button>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-800">
          <h2 className="text-lg font-medium mb-4 text-[#E0E0E0]">Tomorrow's Planning</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <span className="material-icons text-yellow-400 mr-3">construction</span>
                <p>Complete steel framework</p>
              </div>
              <span className="text-sm text-gray-400">To Do</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <span className="material-icons text-yellow-400 mr-3">plumbing</span>
                <p>Plumbing rough-in</p>
              </div>
              <span className="text-sm text-gray-400">To Do</span>
            </div>
          </div>
          <button className="bg-gray-600 text-white hover:bg-gray-700 rounded-lg font-medium cursor-pointer transition-colors duration-300 px-5 py-2 w-full mt-4">Add Plan</button>
        </div>
      </div>
      {/* Events & Remarks Section in grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-24">
        {/* Events Section */}
        <div className="bg-gray-800 rounded-2xl p-6 shadow-md border border-gray-800">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <h2 className="text-lg font-medium mb-4 text-[#E0E0E0] mb-2 md:mb-0">Events</h2>
            <div className="flex items-center space-x-4">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="radio"
                  className="appearance-none w-5 h-5 border-2 border-gray-600 rounded-full inline-block relative cursor-pointer mr-2 checked:border-blue-500 checked:bg-blue-500"
                  name="event-occurred"
                  defaultChecked
                />
                <span className="ml-2 text-gray-200">Yes</span>
              </label>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="radio"
                  className="appearance-none w-5 h-5 border-2 border-gray-600 rounded-full inline-block relative cursor-pointer mr-2 checked:border-blue-500 checked:bg-blue-500"
                  name="event-occurred"
                />
                <span className="ml-2 text-gray-200">No</span>
              </label>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <input
              type="text"
              placeholder="Describe event..."
              className="bg-gray-700 border border-gray-700 text-[#E0E0E0] px-3 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="bg-blue-500 text-white hover:bg-blue-700 rounded-lg font-medium cursor-pointer transition-colors duration-300 px-5 py-2 w-full md:w-auto">
              Add Event
            </button>
          </div>
        </div>
        {/* Remarks Section */}
        <div className="bg-gray-800 rounded-2xl p-6 shadow-md border border-gray-800">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <h2 className="text-lg font-medium mb-4 text-[#E0E0E0] mb-2 md:mb-0">Remarks</h2>
            <div className="flex items-center space-x-4">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="radio"
                  className="appearance-none w-5 h-5 border-2 border-gray-600 rounded-full inline-block relative cursor-pointer mr-2 checked:border-blue-500 checked:bg-blue-500"
                  name="remarks-required"
                  defaultChecked
                />
                <span className="ml-2 text-gray-200">Yes</span>
              </label>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="radio"
                  className="appearance-none w-5 h-5 border-2 border-gray-600 rounded-full inline-block relative cursor-pointer mr-2 checked:border-blue-500 checked:bg-blue-500"
                  name="remarks-required"
                />
                <span className="ml-2 text-gray-200">No</span>
              </label>
            </div>
          </div>
          <textarea
            rows={3}
            placeholder="Add remarks..."
            className="bg-gray-700 border border-gray-700 text-[#E0E0E0] px-3 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          ></textarea>
        </div>
      </div>
      {/* Generate & Close Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-colors duration-150"
          onClick={async () => {
            // Example DPR generation logic (replace with actual logic as needed)
            const project_id = projectId;
            // ... rest of logic
            alert(`Generate DPR for project ID: ${project_id}`);
          }}
        >
          Generate &amp; Close
        </button>
      </div>
    </div>
  );
}

export default DailyProgressReport;