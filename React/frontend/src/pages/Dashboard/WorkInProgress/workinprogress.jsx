import React, { useEffect, useState } from "react";
import Sidebar from "../../SidebarComponent/sidebar";
import { ToastContainer, toast } from "react-toastify";
import Fuse from "fuse.js"; // fuzzy search

const API_URI = import.meta.env.VITE_API_URI;
const PORT = import.meta.env.VITE_BACKEND_PORT;

const WorkInProgress = () => {
  const [tasks, setTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTask, setNewTask] = useState({
    task_name: "",
    task_description: "",
    assigned_to: 6,
    assigned_date: new Date().toISOString().split("T")[0],
    due_date: "",
    status: "pending",
  });

  const UserId = JSON.parse(localStorage.getItem("session")).user_id;

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      const res = await fetch(
        `http://${API_URI}:${PORT}/tasks/user/${UserId}`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (data.ok) {
        setTasks(data.data);
      } else {
        toast.error("Failed to load tasks");
      }
    } catch (err) {
      toast.error("Error fetching tasks");
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [UserId]);

  // Delete task
  const onRemove = async (taskId) => {
    try {
      const res = await fetch(`http://${API_URI}:${PORT}/tasks/${taskId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.task_id !== taskId));
        toast.success("Task deleted successfully");
      } else {
        toast.error("Failed to delete task");
      }
    } catch (err) {
      toast.error("Error deleting task");
      console.error(err);
    }
  };

  // Create task
  const onCreate = async (e) => {
    console.log(newTask);
    e.preventDefault();
    try {
      const res = await fetch(`http://${API_URI}:${PORT}/tasks/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newTask),
      });
      if (res.ok) {
        toast.success("Task created successfully");
        setShowCreateModal(false);
        setNewTask({
          task_name: "",
          task_description: "",
          // *nikalna hai isko
          assigned_to: 6, 
          assigned_date: "",
          due_date: "",
          status: "pending",
        });
        fetchTasks();
      } else {
        toast.error("Failed to create task");
      }
    } catch (err) {
      toast.error("Error creating task");
      console.error(err);
    }
  };

  // Fuzzy search config
  const fuse = new Fuse(tasks, {
    keys: ["task_name", "task_description"],
    threshold: 0.4, // lower = stricter, higher = fuzzier
  });

  const filteredTasks =
    searchQuery.trim() === ""
      ? tasks
      : fuse.search(searchQuery).map((result) => result.item);

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="flex h-screen bg-[var(--background-color)]">
      <ToastContainer />
      <Sidebar />

      {/* Main Content */}
      <div className="relative flex size-full min-h-screen flex-col bg-[var(--background-color)] overflow-x-hidden">
        <div className="layout-container flex h-full grow flex-col mt-10">
          <main className="main_container">
            <div className="layout-content-container flex flex-col max-w-7xl mx-auto flex-1">
              {/* Header Section */}
              <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">
                  Work in Progress
                </h1>
                <div className="flex items-center gap-4">
                  {/* Search Bar */}
                  <div className="relative w-full md:w-64">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-[var(--text-secondary)]">
                      <svg
                        fill="currentColor"
                        height="20px"
                        viewBox="0 0 256 256"
                        width="20px"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
                      </svg>
                    </div>
                    <input
                      type="search"
                      placeholder="Search tasks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="form-input block w-full pl-12 pr-4 py-3 rounded-lg text-[var(--text-primary)] bg-[var(--card-background)] border-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] placeholder:text-[var(--text-secondary)]"
                    />
                  </div>
                  {/* Create Task Button */}
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600  rounded-md px-6 py-3 inline-flex items-center justify-center gap-2 whitespace-nowrap hover:bg-blue-500 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <line x1="12" x2="12" y1="5" y2="19"></line>
                      <line x1="5" x2="19" y1="12" y2="12"></line>
                    </svg>
                    <span>Create Task</span>
                  </button>
                </div>
              </div>

              {/* Employee Tasks Table */}
              <div className="space-y-12">
                <div>
                  <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">
                    Employee Tasks
                  </h2>
                  <div className="overflow-x-auto rounded-lg border border-gray-800 bg-[var(--card-background)]">
                    <table className="w-full text-left">
                      <thead className="bg-gray-800/50">
                        <tr>
                          <th className="px-6 py-4 text-sm font-semibold text-[var(--text-primary)]">
                            Task
                          </th>
                          <th className="px-6 py-4 text-sm font-semibold text-[var(--text-primary)]">
                            Task Description
                          </th>
                          <th className="px-6 py-4 text-sm font-semibold text-[var(--text-primary)]">
                            Status
                          </th>
                          <th className="px-6 py-4 text-sm font-semibold text-[var(--text-primary)]">
                            Deadline
                          </th>
                          <th className="px-6 py-4 text-sm font-semibold text-[var(--text-primary)] text-center">
                            {/* Actions */}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {filteredTasks.length > 0 ? (
                          filteredTasks.map((task) => (
                            <tr
                              key={task.task_id}
                              className="hover:bg-gray-800/30 transition-colors"
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-lg font-medium text-[var(--text-primary)]">
                                {task.task_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-[var(--text-secondary)]">
                                {task.task_description}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-3 py-1 text-xs font-medium rounded-full 
                                  ${
                                    task.status === "Completed"
                                      ? "bg-green-500/10 text-green-400"
                                      : task.status === "In Progress"
                                      ? "bg-yellow-500/10 text-yellow-400"
                                      : "bg-red-500/10 text-red-400"
                                  }`}
                                >
                                  {task.status || "Pending"}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {formatDate(task.due_date)}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => onRemove(task.task_id)}
                                  className="text-red-400 hover:text-red-500 hover:cursor-pointer"
                                  title="Delete row"
                                >
                                  <span className="material-icons text-md">
                                    delete
                                  </span>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="5"
                              className="px-6 py-6 text-center text-[var(--text-secondary)]"
                            >
                              No tasks found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              {/* End Employee Tasks */}
            </div>
          </main>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-[#1e242c] rounded-lg p-8 w-full max-w-lg shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-gray-200">
                Create New Work
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-200 cursor-pointer transition-colors duration-200"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={onCreate} className="space-y-5">
              {/* Task Title */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Task Title
                </label>
                <input
                  type="text"
                  value={newTask.task_name}
                  onChange={(e) =>
                    setNewTask({ ...newTask, task_name: e.target.value })
                  }
                  placeholder="e.g., Design the new dashboard"
                  className="w-full bg-[#2b3440] text-gray-200 rounded-md py-3 px-4 border border-transparent placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Description
                </label>
                <textarea
                  value={newTask.task_description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, task_description: e.target.value })
                  }
                  placeholder="Add a more detailed description..."
                  className="w-full bg-[#2b3440] text-gray-200 rounded-md py-3 px-4 border border-transparent placeholder-gray-500 h-28 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                  required
                />
              </div>

              {/* Due Date + Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) =>
                      setNewTask({ ...newTask, due_date: e.target.value })
                    }
                    className="w-full bg-[#2b3440] text-gray-200 rounded-md py-3 px-4 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    Status
                  </label>
                  <select
                    value={newTask.status}
                    onChange={(e) =>
                      setNewTask({ ...newTask, status: e.target.value })
                    }
                    className="w-full bg-[#2b3440] text-gray-200 rounded-md py-3 px-4 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                  >
                    <option value="pending">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 rounded-md border border-gray-500 text-gray-300 
                       hover:bg-gray-700 cursor-pointer hover:text-white 
                       transition duration-200 ease-in-out"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-md bg-blue-600 text-white font-medium 
                       hover:bg-blue-500 cursor-pointer hover:scale-105 
                       transition duration-200 ease-in-out"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkInProgress;
