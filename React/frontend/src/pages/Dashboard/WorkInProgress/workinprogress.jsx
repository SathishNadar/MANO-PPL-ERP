import React, { useEffect, useState, useMemo } from "react";
import Sidebar from "../../SidebarComponent/sidebar";
import { toast } from "react-toastify";
import Fuse from "fuse.js";

import { CreateTaskModal, EditTaskModal, DeleteModal } from "./TaskModals";

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

const WorkInProgress = () => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showEditModal, setShowEditModal] = useState(null);

  const sessionRaw = localStorage.getItem("session");
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const UserId = session?.user_id;

  // newTask default
  const defaultDueDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    // set a consistent time to match server expectation (18:30 local)
    d.setHours(18, 30, 0, 0);
    return d.toISOString();
  })();

  const [newTask, setNewTask] = useState({
    task_name: "",
    task_description: "",
    assigned_to: UserId,
    assigned_date: "",
    // default deadline is 14 days from today unless user changes it
    due_date: defaultDueDate,
    status: "not_started",
  });

  const [dateOrder, setDateOrder] = useState("asc");
  const [statusSort, setStatusSort] = useState("none");
  const statusSequence = ["none", "not_started", "in_progress", "completed","failed"];

  // cycle status filter
  const cycleStatusSort = () => {
    const idx = statusSequence.indexOf(statusSort);
    const next = statusSequence[(idx + 1) % statusSequence.length];
    setStatusSort(next);
  };

  // toggle date order
  const toggleDateOrder = () =>
    setDateOrder((o) => (o === "asc" ? "desc" : "asc"));

  // compute display tasks (star + sorting + filtering)
  const displayTasks = useMemo(() => {
    const enriched = tasks.map((t) => {
      const hasAssignedBy =
        t.assigned_by !== null &&
        t.assigned_by !== undefined &&
        t.assigned_by !== "";
      const assignedByOther =
        hasAssignedBy && String(t.assigned_by) !== String(t.assigned_to);
      return { ...t, __assignedByOther: !!assignedByOther };
    });

    const todayStart = (() => {
      const n = new Date();
      return new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime();
    })();

    // safe due timestamp (missing due_date => +inf)
    const dueTs = (item) =>
      item?.due_date
        ? new Date(item.due_date).getTime()
        : Number.POSITIVE_INFINITY;

    /**
     * Compare tasks by "deadline proximity" with rule:
     * - Tasks with future (or today) deadlines come first.
     * - Among future/today tasks: sort by absolute distance to today (nearest first)
     * - Past deadlines (due < today) are placed after future tasks, but among themselves
     *   they're also ordered by proximity to today (so yesterday appears above last week).
     * - If dateOrder === 'desc' we invert the proximity ordering.
     */
    const compareByDate = (a, b) => {
      const aTs = dueTs(a);
      const bTs = dueTs(b);

      const aIsPast = aTs < todayStart;
      const bIsPast = bTs < todayStart;

      // If one is past and the other is not, past goes after
      if (aIsPast !== bIsPast) {
        return aIsPast ? 1 : -1;
      }

      // both same side (both future/today OR both past)
      const aDist = Math.abs(aTs - todayStart);
      const bDist = Math.abs(bTs - todayStart);

      // asc => nearest first, desc => farthest first
      return dateOrder === "asc" ? aDist - bDist : bDist - aDist;
    };

    // If a status is selected, show ONLY tasks with that status (ignore star)
    if (statusSort && statusSort !== "none") {
      const only = enriched.filter(
        (t) => String(t.status) === String(statusSort)
      );
      only.sort(compareByDate);
      return only;
    }

    // otherwise show all, starred first then by date
    enriched.sort((a, b) => {
      if (a.__assignedByOther !== b.__assignedByOther) {
        return a.__assignedByOther ? -1 : 1;
      }
      return compareByDate(a, b);
    });

    return enriched;
  }, [tasks, dateOrder, statusSort]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/tasks/controlled_users/${UserId}`,
        { credentials: "include" }
      );
      const data = await res.json();

      if (data.ok) {
        const allUsers = [
          { controlled_id: String(UserId), user_name: "Myself" },
          ...data.data.map((u, i) => ({
            controlled_id: String(u.user_id ?? u.id ?? `user-${i}`),
            user_name: u.user_name ?? u.name ?? `User ${i + 1}`,

            ...u,
          })),
        ];

        setUsers(allUsers);

        // only set default selected if none already set (avoids overwriting user choice)
        setSelectedUser((prev) => (prev ? prev : String(UserId)));
      } else {
        toast.error("Failed to fetch controlled users");
      }
    } catch (err) {
      console.error("fetchUsers error:", err);
      toast.error("Error fetching users");
    }
  };

  // Fetch tasks for selected user
  const fetchTasks = async (uid) => {
    try {
      const uidNum = Number(uid);
      console.log(
        "[fetchTasks] loading tasks for uid:",
        uid,
        "-> uidNum:",
        uidNum,
        typeof uidNum
      );
      const res = await fetch(`${API_BASE}/tasks/user/${uid}`, {
        credentials: "include",
      });

      console.log("[fetchTasks] response status:", res.status, res.statusText);
      const data = await res.json();

      console.log(data);
      if (data.ok) setTasks(data.data);
      else toast.error("Failed to load tasks");
    } catch (err) {
      toast.error("Error fetching tasks");
    }
  };

  useEffect(() => {
    if (!UserId) {
      toast.error("No session found. Please login.");
      return;
    }
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
      // Do not auto-read or coerce any placeholder/default from the DOM.
      // Only send due_date if the user explicitly provided one.
      const payload = { ...task, assigned_to: Number(task.assigned_to) };
      if (!task?.due_date) {
        // ensure we don't accidentally include an empty due_date property
        delete payload.due_date;
      }

      // Remove any UI-only properties (internal flags starting with __) before sending
      Object.keys(payload).forEach((k) => { if (k.startsWith("__")) delete payload[k]; });

      const res = await fetch(`${API_BASE}/tasks/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      console.log(payload);
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
      console.error(err);
    }
  };

  // Update task
  const onUpdate = async (task) => {
    try {
      // Do not auto-read or coerce any placeholder/default from the DOM.
      // Only include due_date if the user explicitly provided one in `task`.
      const payload = { ...task, assigned_to: Number(task.assigned_to) };
      if (!task?.due_date) {
        delete payload.due_date;
      }

      // Remove UI-only computed properties before sending to backend
      Object.keys(payload).forEach((k) => { if (k.startsWith("__")) delete payload[k]; });

      const res = await fetch(`${API_BASE}/tasks/${task.task_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      console.log(payload);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Something went wrong");
      }

      toast.success("Task updated successfully");
      setTasks((prev) => prev.map((t) => (t.task_id === task.task_id ? task : t)));
      setShowEditModal(null);
    } catch (err) {
      toast.error("Error updating task");
      console.error(err);
    }
  };

  // Delete task
  const onRemove = async (taskId) => {
    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
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

  // Search (Fuse) — run against displayTasks
  const fuse = useMemo(
    () =>
      new Fuse(displayTasks, {
        keys: ["task_name", "task_description"],
        threshold: 0.4,
      }),
    [displayTasks]
  );

  const filteredTasks =
    searchQuery.trim() === ""
      ? displayTasks
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
    default: "bg-gray-500/10 text-gray-400",
    in_progress: "bg-yellow-500/10 text-yellow-400",
    completed: "bg-green-500/10 text-green-400",
    failed: "bg-red-700/10 text-red-500",
  };

  const statusLabels = {
    not_started: "Not Started",
    in_progress: "In Progress",
    completed: "Completed",
    failed:"Failed",
    default: "Not Started",
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
                    value={selectedUser ?? ""}
                    onChange={(e) => {
                      const val = e?.target?.value;
                      if (!val) return; // defensive
                      setSelectedUser(val);
                    }}
                    className="px-4 py-3 rounded-lg bg-[#1e242c] text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {users.map((u, idx) => (
                      <option
                        key={String(u.controlled_id ?? `user-${idx}`)}
                        value={String(u.controlled_id ?? `user-${idx}`)}
                        className="bg-[#1e242c] text-white"
                      >
                        {u.user_name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      setNewTask((prev) => ({
                        ...prev,
                        task_name: "",
                        task_description: "",
                        assigned_to: selectedUser || UserId,
                        assigned_date: "",
                        due_date: defaultDueDate,
                        status: "not_started",
                      }));
                      setShowCreateModal(true);
                    }}
                    className="rounded-md px-6 py-3 inline-flex items-center justify-center gap-2 whitespace-nowrap bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
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
                          <th className="pl-13 py-4 text-sm font-semibold text-[var(--text-primary)] w-1/5 ">
                            Task
                          </th>
                          <th className="px-6 py-4 text-sm font-semibold text-[var(--text-primary)] w-2/5">
                            Task Description
                          </th>
                          <th
                            className="px-6 py-4 text-sm font-semibold text-[var(--text-primary)] text-center w-1/5"
                            onClick={cycleStatusSort}
                          >
                            {statusSort === "none"
                              ? "Status"
                              : `Status: ${statusLabels[statusSort]}`}
                          </th>
                          <th
                            className="px-6 py-4 text-sm font-semibold text-[var(--text-primary)] w-1/5"
                            onClick={toggleDateOrder}
                          >
                            {dateOrder === "asc" ? "Deadline ↑" : "Deadline ↓"}
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
                              <td className="px-6 py-4 whitespace-nowrap text-lg font-medium text-[var(--text-primary)] flex items-center gap-3">
                                {/* Star marker (left) when assigned_by != assigned_to */}
                                {task.__assignedByOther ? (
                                  <svg
                                    className="h-4 w-4 text-yellow-400"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                  >
                                    <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.402 8.169L12 18.896 4.664 23.166l1.402-8.169L.132 9.21l8.2-1.192z" />
                                  </svg>
                                ) : (
                                  /* keep alignment consistent */
                                  <span className="inline-block w-4" />
                                )}

                                <span>{task.task_name}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-[var(--text-secondary)]">
                                {task.task_description?.length > 90
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
            />
          </div>
        </div>
      )}

      {/* Edit Modal */}
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
            />
          </div>
        </div>
      )}

      <DeleteModal
        show={!!showDeleteModal}
        onClose={() => setShowDeleteModal(null)}
        onConfirm={() => {
          onRemove(showDeleteModal);
          setShowDeleteModal(null);
        }}
        entityName="task"
      />
    </div>
  );
};

export default WorkInProgress;
