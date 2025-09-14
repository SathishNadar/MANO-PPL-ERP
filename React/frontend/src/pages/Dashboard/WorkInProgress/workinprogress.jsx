import React, { useEffect, useState, useMemo } from "react";
import Sidebar from "../../SidebarComponent/sidebar";
import { toast } from "react-toastify";
import Fuse from "fuse.js";

import {
  CreateTaskModal,
  EditTaskModal,
  DeleteTaskModal,
  control_access,
} from "./TaskModals";

const API_URI = import.meta.env.VITE_API_URI;
const PORT = import.meta.env.VITE_BACKEND_PORT;

const WorkInProgress = () => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]); // self + controlled
  const [selectedUser, setSelectedUser] = useState(null); // dropdown filter
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showEditModal, setShowEditModal] = useState(null);

  const session = JSON.parse(localStorage.getItem("session"));
  const UserId = session.user_id;

  const currentUser = users.find((u) => u.controlled_id === selectedUser);
  const role = currentUser?.control_type || "viewer";
  const permissions = control_access[role];

  const [newTask, setNewTask] = useState({
    task_name: "",
    task_description: "",
    assigned_to: UserId,
    assigned_date: "",
    due_date: "",
    status: "not_started",
  });

  // Fetch controlled users
  const fetchUsers = async () => {
    try {
      const res = await fetch(
        `http://${API_URI}:${PORT}/tasks/controlled_users/${UserId}`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (data.ok) {
        const allUsers = [
          {
            controlled_id: UserId,
            user_name: "Myself",
            control_type: "manager",
          },
          ...data.data,
        ];
        setUsers(allUsers);
        setSelectedUser(UserId); // default to self
      }
    } catch (err) {
      toast.error("Error fetching users");
    }
  };

  // Fetch tasks for selected user
  const fetchTasks = async (uid) => {
    try {
      const res = await fetch(`http://${API_URI}:${PORT}/tasks/user/${uid}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.ok) setTasks(data.data);
      else toast.error("Failed to load tasks");
    } catch (err) {
      toast.error("Error fetching tasks");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [UserId]);

  useEffect(() => {
    if (selectedUser) {
      fetchTasks(selectedUser);
    }
  }, [selectedUser]);

  // Create task
  const onCreate = async (task) => {
    try {
      const res = await fetch(`http://${API_URI}:${PORT}/tasks/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(task),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Something went wrong");
      }
      toast.success("Task created successfully");
      setShowCreateModal(false);
      setNewTask({
        task_name: "",
        task_description: "",
        assigned_to: selectedUser || UserId,
        assigned_date: "",
        due_date: "",
        status: "not_started",
      });
      fetchTasks(selectedUser);
    } catch (err) {
      toast.error("Error creating task");
    }
  };

  // Update task
  const onUpdate = async (task) => {
    try {
      const res = await fetch(
        `http://${API_URI}:${PORT}/tasks/${task.task_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            task_name: task.task_name,
            task_description: task.task_description,
            assigned_to: task.assigned_to,
            assigned_date: task.assigned_date,
            due_date: task.due_date,
            status: task.status,
          }),
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Something went wrong");
      }

      toast.success("Task updated successfully");
      setTasks((prev) =>
        prev.map((t) => (t.task_id === task.task_id ? task : t))
      );
      setShowEditModal(null);
    } catch (err) {
      toast.error("Error updating task");
      console.error(err);
    }
  };

  // Delete task
  const onRemove = async (taskId) => {
    try {
      const res = await fetch(`http://${API_URI}:${PORT}/tasks/${taskId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete task");
      toast.success("Task deleted successfully");
      setTasks((prev) => prev.filter((t) => t.task_id !== taskId));
    } catch (err) {
      toast.error("Error deleting task");
    }
  };

  // Fuzzy search config
  const fuse = useMemo(
    () =>
      new Fuse(tasks, {
        keys: ["task_name", "task_description"],
        threshold: 0.4,
      }),
    [tasks]
  );

  const filteredTasks =
    searchQuery.trim() === ""
      ? tasks
      : fuse.search(searchQuery).map((result) => result.item);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const statusClasses = {
    not_started: "bg-gray-500/10 text-gray-400",
    in_progress: "bg-yellow-500/10 text-yellow-400",
    under_review: "bg-blue-500/10 text-blue-400",
    completed: "bg-green-500/10 text-green-400",
    canceled: "bg-red-500/10 text-red-400",
    failed: "bg-red-700/10 text-red-500",
  };

  const statusLabels = {
    not_started: "Not Started",
    in_progress: "In Progress",
    under_review: "Under Review",
    completed: "Completed",
    canceled: "Canceled",
    failed: "Failed",
    default: "Unknown",
  };

  return (
    <div className="flex h-screen bg-[var(--background-color)]">
      <Sidebar />

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
                  <input
                    type="search"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="form-input block w-full md:w-64 px-4 py-3 rounded-lg text-[var(--text-primary)] bg-[var(--card-background)] border-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] placeholder:text-[var(--text-secondary)]"
                  />

                  {/* User Filter */}
                  <select
                    value={selectedUser || ""}
                    onChange={(e) => setSelectedUser(Number(e.target.value))}
                    className="px-4 py-3 rounded-lg 
             bg-[#1e242c] text-white 
             border border-gray-700 
             focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {users.map((u) => (
                      <option
                        key={u.controlled_id}
                        value={u.controlled_id}
                        className="bg-[#1e242c] text-white"
                      >
                        {u.user_name}
                      </option>
                    ))}
                  </select>

                  {/* Create Task Button */}
                  <button
                    disabled={!permissions.create}
                    onClick={() => setShowCreateModal(true)}
                    className={`rounded-md px-6 py-3 inline-flex items-center justify-center gap-2 whitespace-nowrap
                            ${
                              !permissions.create
                                ? "bg-gray-600 cursor-not-allowed opacity-50"
                                : "bg-blue-600 hover:bg-blue-500 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                            }`}
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
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
                    Tasks
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
                          <th className="px-6 py-4 text-sm font-semibold text-[var(--text-primary)] text-center">
                            Status
                          </th>
                          <th className="px-6 py-4 text-sm font-semibold text-[var(--text-primary)]">
                            Deadline
                          </th>
                          <th className="px-6 py-4 text-sm font-semibold text-[var(--text-primary)] text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {filteredTasks.length > 0 ? (
                          filteredTasks.map((task) => (
                            <tr
                              key={task.task_id}
                              className="hover:bg-gray-800/30 transition-colors cursor-pointer"
                              onClick={() => setShowEditModal(task)}
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-lg font-medium text-[var(--text-primary)]">
                                {task.task_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-[var(--text-secondary)]">
                                {task.task_description.length > 90
                                  ? task.task_description.slice(0, 90) + "..."
                                  : task.task_description}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span
                                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                                    statusClasses[task.status] || ""
                                  }`}
                                >
                                  {statusLabels[task.status] ||
                                    statusLabels.default}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {formatDate(task.due_date)}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDeleteModal(task.task_id);
                                  }}
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
            </div>
          </main>
        </div>
      </div>

      {/* Create Modal */}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className="relative w-full max-w-xl bg-[var(--card-background)] rounded-lg shadow-lg 
                    p-6 m-4 max-h-[100vh] overflow-y-auto
                    scrollbar-hide"
          >
            <CreateTaskModal
              show={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              onSubmit={onCreate}
              newTask={newTask}
              setNewTask={setNewTask}
              users={users}
              role={role}
            />
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className="relative w-full max-w-xl bg-[var(--card-background)] rounded-lg shadow-lg 
                 p-6 m-4 max-h-[90vh] overflow-y-auto scrollbar-hide"
          >
            <EditTaskModal
              show={!!showEditModal}
              onClose={() => setShowEditModal(null)}
              onSubmit={onUpdate}
              task={showEditModal}
              setTask={setShowEditModal}
              users={users}
              role={role}
            />
          </div>
        </div>
      )}

      <DeleteTaskModal
        show={!!showDeleteModal}
        onClose={() => setShowDeleteModal(null)}
        onConfirm={() => {
          onRemove(showDeleteModal);
          setShowDeleteModal(null);
        }}
        role={role}
      />
    </div>
  );
};

export default WorkInProgress;
