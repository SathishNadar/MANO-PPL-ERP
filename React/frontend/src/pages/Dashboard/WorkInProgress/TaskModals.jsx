import React from "react";

export const CreateTaskModal = ({
  show,
  onClose,
  onSubmit,
  newTask,
  setNewTask,
  users, // 👈 controlled users + self
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-[#1e242c] rounded-lg p-8 w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-gray-200">Create New Work</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(newTask);
            onClose();
          }}
          className="space-y-5"
        >
          {/* Task Name */}
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
              className="w-full bg-[#2b3440] text-gray-200 rounded-md py-3 px-4 border border-transparent placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full bg-[#2b3440] text-gray-200 rounded-md py-3 px-4 border border-transparent placeholder-gray-500 h-28 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Assigned To */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">
              Assign To
            </label>
            <select
              value={newTask.assigned_to}
              onChange={(e) =>
                setNewTask({ ...newTask, assigned_to: Number(e.target.value) })
              }
              className="w-full bg-[#2b3440] text-gray-200 rounded-md py-3 px-4 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {users.map((u) => (
                <option key={u.controlled_id} value={u.controlled_id}>
                  {u.user_name}
                </option>
              ))}
            </select>
          </div>

          {/* Dates + Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                Assigned Date
              </label>
              <input
                type="date"
                value={newTask.assigned_date}
                onChange={(e) =>
                  setNewTask({ ...newTask, assigned_date: e.target.value })
                }
                className="w-full bg-[#2b3440] text-gray-200 rounded-md py-3 px-4 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
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
                className="w-full bg-[#2b3440] text-gray-200 rounded-md py-3 px-4 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">Status</label>
            <select
              value={newTask.status}
              onChange={(e) =>
                setNewTask({ ...newTask, status: e.target.value })
              }
              className="w-full bg-[#2b3440] text-gray-200 rounded-md py-3 px-4 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="canceled">Canceled</option>
              <option value="failed">Failed</option>
              <option value="not_started">Not started</option>
              <option value="under_review">Under Review</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-md border border-gray-500 text-gray-300 hover:bg-gray-700 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-500 cursor-pointer hover:scale-105 transition"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const EditTaskModal = ({
  show,
  onClose,
  onSubmit,
  task,
  setTask,
  users,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-[#1e242c] rounded-lg p-8 w-full max-w-lg shadow-2xl">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-gray-200">Edit Task</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(task);
            onClose();
          }}
          className="space-y-5"
        >
          {/* Task Name */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">
              Task Title
            </label>
            <input
              type="text"
              value={task.task_name}
              onChange={(e) => setTask({ ...task, task_name: e.target.value })}
              className="w-full bg-[#2b3440] text-gray-200 rounded-md py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">
              Description
            </label>
            <textarea
              value={task.task_description}
              onChange={(e) =>
                setTask({ ...task, task_description: e.target.value })
              }
              className="w-full bg-[#2b3440] text-gray-200 rounded-md py-3 px-4 h-28 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Assign To */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">
              Assign To
            </label>
            <select
              value={task.assigned_to}
              onChange={(e) =>
                setTask({ ...task, assigned_to: Number(e.target.value) })
              }
              className="w-full bg-[#2b3440] text-gray-200 rounded-md py-3 px-4 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {users.map((u) => (
                <option key={u.controlled_id} value={u.controlled_id}>
                  {u.user_name}
                </option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                Assigned Date
              </label>
              <input
                type="date"
                value={task.assigned_date?.split("T")[0]}
                onChange={(e) =>
                  setTask({ ...task, assigned_date: e.target.value })
                }
                className="w-full bg-[#2b3440] text-gray-200 rounded-md py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={task.due_date?.split("T")[0]}
                onChange={(e) => setTask({ ...task, due_date: e.target.value })}
                className="w-full bg-[#2b3440] text-gray-200 rounded-md py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">Status</label>
            <select
              value={task.status}
              onChange={(e) => setTask({ ...task, status: e.target.value })}
              className="w-full bg-[#2b3440] text-gray-200 rounded-md py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="canceled">Canceled</option>
              <option value="failed">Failed</option>
              <option value="not_started">Not started</option>
              <option value="under_review">Under Review</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-md border border-gray-500 text-gray-300 hover:bg-gray-700 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-500 hover:scale-105 transition"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const DeleteTaskModal = ({ show, onClose, onConfirm }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-[#1e242c] rounded-lg p-8 w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold text-gray-200 mb-4">
          Confirm Deletion
        </h2>
        <p className="text-gray-400 mb-6">
          Are you sure you want to delete this task? This action cannot be
          undone.
        </p>
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-md border border-gray-500 text-gray-300 hover:bg-gray-700 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-6 py-2 rounded-md bg-red-600 text-white font-medium hover:bg-red-500 hover:scale-105 transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
