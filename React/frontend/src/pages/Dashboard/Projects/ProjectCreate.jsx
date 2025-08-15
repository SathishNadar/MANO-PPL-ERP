import React from 'react';

const API_URI = import.meta.env.VITE_API_URI;
const PORT = import.meta.env.VITE_BACKEND_PORT;
function ProjectCreate({ onClose }) {
  const [users, setUsers] = React.useState([]);
  const [approver, setApprover] = React.useState("");
  const [finalApprover, setFinalApprover] = React.useState("");
  const [clients, setClients] = React.useState([]);
  const [reporterName, setReporterName] = React.useState("");

  React.useEffect(() => {
    fetch(`http://${API_URI}:${PORT}/project/eligibleUsers`, { 
      credentials: 'include' 
    })
      .then(res => res.json())
      .then(data => {
        if (data.ok) setUsers(data.users);
      });

    const sessionStr = localStorage.getItem('session');
    const sessionData = JSON.parse(sessionStr);
    if (sessionData?.username) {
      setReporterName(sessionData.username);
    }
  }, []);

  // Handles project creation
  async function handleCreateProject() {
    const requiredFields = [
      "project-name",
      "project-code",
      "description",
      "location",
      "employer",
      "start-date",
      "end-date"
    ];
    for (let id of requiredFields) {
      const el = document.getElementById(id);
      if (!el || !el.value.trim()) {
        alert("Please fill out all required fields.");
        return;
      }
    }

    const sessionStr = localStorage.getItem('session');
    const sessionData = JSON.parse(sessionStr);
    const userId = sessionData.user_id;
    if (!userId) {
      alert("User not logged in or invalid user ID.");
      return;
    }

    const user_roles = {
      reporter: userId,
      approver: approver || null,
      final_approver: finalApprover || null,
      client: {
        insert: clients
      }
    };

    const data = {
      project_name: document.getElementById("project-name").value,
      project_code: document.getElementById("project-code").value,
      project_description: document.getElementById("description").value,
      location: document.getElementById("location").value,
      Employer: document.getElementById("employer").value,
      start_date: document.getElementById("start-date").value,
      end_date: document.getElementById("end-date").value,
      user_id: userId,
      user_roles
    };

    try {
      const response = await fetch(`http://${API_URI}:${PORT}/project/insertProject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(data),
      }); 

      if (!response.ok) throw new Error("Failed to create project");

      alert("Project Created!");
    } catch (err) {
      console.warn("Error creating project:", err.message);
    }
  }
  return (
    <div className="bg-transparent p-8">
      <div className="flex justify-center items-center min-h-full">
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-4xl transform transition-all border border-gray-700">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Create New Project</h2>
            <button
              className="text-gray-400 hover:text-white"
              onClick={onClose}
            >
              <span className="material-icons">close</span>
            </button>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1" htmlFor="project-name">
                Project Name
              </label>
              <input
                id="project-name"
                type="text"
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1" htmlFor="project-code">
                Project Code
              </label>
              <input
                id="project-code"
                type="text"
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-1" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                rows="4"
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-1" htmlFor="location">
                Location
              </label>
              <input
                id="location"
                type="text"
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-4 gap-x-6 md:col-span-2">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-1" htmlFor="employer">
                  Employer
                </label>
                <input
                  id="employer"
                  type="text"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1" htmlFor="start-date">
                  Start Date
                </label>
                <input
                  id="start-date"
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm py-1.5 px-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1" htmlFor="end-date">
                  End Date
                </label>
                <input
                  id="end-date"
                  type="date"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm py-1.5 px-2"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Reporter
              </label>
              <input
                type="text"
                value={reporterName}
                disabled
                className="w-full bg-gray-600 border border-gray-500 rounded-md py-2 px-3 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Approver
              </label>
              <select
                value={approver}
                onChange={(e) => setApprover(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"
              >
                <option value="">Select Approver</option>
                {users.map(user => (
                  <option key={user.user_id} value={user.user_id}>{user.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Final Approver
              </label>
              <select
                value={finalApprover}
                onChange={(e) => setFinalApprover(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"
              >
                <option value="">Select Final Approver</option>
                {users.map(user => (
                  <option key={user.user_id} value={user.user_id}>{user.name}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Clients
              </label>

              {/* Dropdown for selecting one client at a time */}
              <select
                value=""
                onChange={(e) => {
                  const selectedId = e.target.value;
                  if (selectedId && !clients.includes(selectedId)) {
                    setClients([...clients, selectedId]);
                  }
                }}
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"
              >
                <option value="">Select Client</option>
                {users.map((user) => (
                  <option key={user.user_id} value={user.user_id}>
                    {user.name}
                  </option>
                ))}
              </select>

              {/* Display selected clients */}
              <div className="mt-2 space-y-1">
                {clients.map((clientId) => {
                  const clientUser = users.find((u) => u.user_id === parseInt(clientId));
                  return (
                    <div
                      key={clientId}
                      className="flex items-center justify-between bg-gray-800 px-3 py-1 rounded"
                    >
                      <span>{clientUser ? clientUser.name : clientId}</span>
                      <button
                        type="button"
                        onClick={() => setClients(clients.filter((c) => c !== clientId))}
                        className="text-red-400 hover:text-red-200"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8">
            <button
              onClick={handleCreateProject}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center space-x-2"
            >
              <span className="material-icons">add_circle_outline</span>
              <span>Create Project</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default ProjectCreate;