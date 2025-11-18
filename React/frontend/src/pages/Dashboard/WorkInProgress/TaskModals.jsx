const formatDateInputValue = (dateString) => {
  if (!dateString) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const isPastDeadline = (task) => {
  if (!task?.due_date) return false; // no due date -> editable
  const due = new Date(task.due_date);
  if (Number.isNaN(due.getTime())) return false;
  const dueDateOnly = new Date(
    due.getFullYear(),
    due.getMonth(),
    due.getDate()
  );
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return today.getTime() > dueDateOnly.getTime();
};

/* CreateTaskModal */
export const CreateTaskModal = ({
  show,
  onClose,
  onSubmit,
  newTask,
  setNewTask,
  users,
  role, // role still accepted but unused
}) => {
  if (!show) return null;
  // control_access removed — grant all permissions by default
  const permissions = { view: true, create: true, edit: true, delete: true };

  return (
    <div className="bg-[#1e242c] rounded-lg p-8 w-full max-w-lg shadow-2xl">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-2xl font-bold text-gray-200">Create New Work</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-200 cursor-pointer transition-colors"
        >
          ✕
        </button>
      </div>

      {!permissions.create ? (
        <div className="text-gray-400">
          <p>You don’t have permission to create tasks.</p>
          <div className="flex justify-end pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-md border border-gray-500 text-gray-300 hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(newTask);
            onClose();
          }}
          className="space-y-5"
        >
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
              placeholder="Add a detailed description..."
              className="w-full bg-[#2b3440] text-gray-200 rounded-md py-3 px-4 border border-transparent h-28 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Assign To */}
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
                <option key={String(u.controlled_id)} value={u.controlled_id}>
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
                value={
                  newTask.assigned_date
                    ? formatDateInputValue(newTask.assigned_date)
                    : formatDateInputValue(new Date())
                }
                onChange={(e) =>
                  setNewTask({ ...newTask, assigned_date: e.target.value })
                }
                className="w-full bg-[#2b3440] text-gray-200 rounded-md py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                Deadline
              </label>
              <input
                type="date"
                value={
                  newTask.due_date
                    ? formatDateInputValue(newTask.due_date)
                    : formatDateInputValue(
                        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
                      )
                }
                onChange={(e) =>
                  setNewTask({ ...newTask, due_date: e.target.value })
                }
                className="w-full bg-[#2b3440] text-gray-200 rounded-md py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <option value="not_started">Not started</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-md border border-gray-500 text-gray-300 hover:bg-gray-700"
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
      )}
    </div>
  );
};

export const EditTaskModal = ({
  show,
  onClose,
  onSubmit,
  task,
  setTask,
  role,
}) => {
  if (!show) return null;
  if (!task) return null;

  // control_access removed — grant all permissions by default
  const permissions = { view: true, create: true, edit: true, delete: true };

  const past = isPastDeadline(task);
  const readOnly = !permissions.edit || past;

  const assignedDateInput = formatDateInputValue(task.assigned_date);
  const dueDateInput = formatDateInputValue(task.due_date);

  return (
    <div className="bg-[#1e242c] rounded-lg p-8 w-full max-w-lg shadow-2xl">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-2xl font-bold text-gray-200">
          {readOnly ? "View Task" : "Edit Task"}
        </h2>
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
          if (past) {
            toast.error("This task is past its deadline and cannot be edited.");
            return;
          }
          if (!permissions.edit) {
            toast.error("You don't have permission to edit this task.");
            return;
          }
          onSubmit(task);
          onClose();
        }}
        className="space-y-5"
      >
        <div>
          <label className="block text-gray-400 text-sm mb-2">Task Title</label>
          <input
            type="text"
            value={task.task_name}
            onChange={(e) => setTask({ ...task, task_name: e.target.value })}
            readOnly={readOnly}
            className="w-full bg-[#2b3440] text-gray-200 rounded-md py-3 px-4 disabled:opacity-60"
          />
        </div>

        <div>
          <label className="block text-gray-400 text-sm mb-2">
            Description
          </label>
          <textarea
            value={task.task_description}
            onChange={(e) =>
              setTask({ ...task, task_description: e.target.value })
            }
            readOnly={readOnly}
            className="w-full bg-[#2b3440] text-gray-200 rounded-md py-3 px-4 h-28 resize-none disabled:opacity-60"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-gray-400 text-sm mb-2">
              Assigned Date
            </label>
            <input
              type="date"
              value={assignedDateInput}
              onChange={(e) =>
                setTask({ ...task, assigned_date: e.target.value })
              }
              readOnly={readOnly}
              disabled={readOnly}
              className="w-full bg-[#2b3440] text-gray-200 rounded-md py-3 px-4 disabled:opacity-60"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-2">Due Date</label>
            <input
              type="date"
              value={dueDateInput}
              onChange={(e) => setTask({ ...task, due_date: e.target.value })}
              readOnly={readOnly}
              disabled={readOnly}
              className="w-full bg-[#2b3440] text-gray-200 rounded-md py-3 px-4 disabled:opacity-60"
            />
            {past && (
              <div className="text-sm text-yellow-400 mt-2">
                Deadline passed — this task is view-only.
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-gray-400 text-sm mb-2">Status</label>
          <select
            value={task.status}
            onChange={(e) => setTask({ ...task, status: e.target.value })}
            disabled={readOnly}
            className="w-full bg-[#2b3440] text-gray-200 rounded-md py-3 px-4 disabled:opacity-60"
          >
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="not_started">Not started</option>
          </select>
        </div>

        <div className="flex justify-end gap-4 pt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-md border border-gray-500 text-gray-300 hover:bg-gray-700"
          >
            Close
          </button>
          {!past && permissions.edit && (
            <button
              type="submit"
              className="px-6 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-500"
            >
              Save Changes
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export const DeleteModal = ({
  show,
  onClose,
  onConfirm,
  role,
  entityName = "item",
}) => {
  if (!show) return null;
  const permissions = { view: true, create: true, edit: true, delete: true };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-[#1e242c] rounded-lg p-8 w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold text-gray-200 mb-4">
          {permissions.delete
            ? `Confirm Delete ${entityName}`
            : `View ${entityName}`}
        </h2>
        <p className="text-gray-400 mb-6">
          {permissions.delete
            ? `Are you sure you want to delete this ${entityName}? This action cannot be undone.`
            : `You don’t have permission to delete ${entityName}s.`}
        </p>
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-md border border-gray-500 text-gray-300 hover:bg-gray-700"
          >
            Close
          </button>
          {permissions.delete && (
            <button
              type="button"
              onClick={onConfirm}
              className="px-6 py-2 rounded-md bg-red-600 text-white font-medium hover:bg-red-500"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
