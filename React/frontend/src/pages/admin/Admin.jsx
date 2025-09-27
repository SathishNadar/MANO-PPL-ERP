import React, { useEffect, useState } from "react";
import Sidebar from "../SidebarComponent/sidebar";
import { DeleteModal } from "../Dashboard/WorkInProgress/TaskModals";
import { toast } from "react-toastify";

const API_URI = import.meta.env.VITE_API_URI;
const PORT = import.meta.env.VITE_BACKEND_PORT;

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [titles, setTitles] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editingUser, setEditingUser] = useState(null);
  const [passwordInputs, setPasswordInputs] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`http://${API_URI}:${PORT}/admin/users`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.users)) {
          setUsers(data.users);
          setTitles(data.titles || {});
        } else {
          toast.error("Failed to load users.");
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const q = searchQuery.toLowerCase();
    return (
      user.user_name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.phone_no.toLowerCase().includes(q) ||
      user.title_name.toLowerCase().includes(q)
    );
  });

  // -------- Delete User --------
  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setSelectedUser(null);
    setDeleteModalOpen(false);
  };

  const confirmDelete = async () => {
    try {
      await fetch(
        `http://${API_URI}:${PORT}/admin/user/${selectedUser.user_id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      setUsers(users.filter((u) => u.user_id !== selectedUser.user_id));
      toast.success(`User "${selectedUser.user_name}" deleted.`);
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error("Error deleting user.");
    } finally {
      closeDeleteModal();
    }
  };

  // -------- Edit User --------
  const openEditModal = (user) => {
    setEditingUser({ ...user });
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setEditModalOpen(false);
  };

  const saveUser = async () => {
    if (!editingUser) return;

    const trimmedName = editingUser.user_name.trim();
    if (!trimmedName) {
      toast.error("Username cannot be empty.");
      return;
    }

    const phoneRegex = /^\+\d{1,3}\d{10,}$/; // must be +countrycode + at least 10 digits
    if (editingUser.phone_no && !phoneRegex.test(editingUser.phone_no)) {
      toast.error("Phone number must be in format +[countrycode][number].");
      return;
    }

    const originalUser = users.find((u) => u.user_id === editingUser.user_id);
    const payload = {};
    if (trimmedName !== originalUser.user_name) payload.user_name = trimmedName;
    if (editingUser.email !== originalUser.email)
      payload.email = editingUser.email;
    if (editingUser.phone_no !== originalUser.phone_no)
      payload.phone_no = editingUser.phone_no;
    if (editingUser.title_name !== originalUser.title_name) {
      const entry = Object.entries(titles).find(
        ([, value]) => value === editingUser.title_name
      );
      if (entry) payload.title_id = parseInt(entry[0]);
    }

    if (Object.keys(payload).length === 0) {
      toast.info("No changes to save.");
      closeEditModal();
      return;
    }

    try {
      const res = await fetch(
        `http://${API_URI}:${PORT}/admin/user/${editingUser.user_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      if (res.ok) {
        setUsers(
          users.map((u) =>
            u.user_id === editingUser.user_id ? { ...u, ...editingUser } : u
          )
        );
        toast.success(`User "${editingUser.user_name}" updated successfully!`);
        closeEditModal();
      } else {
        toast.error("Failed to update user.");
      }
    } catch (error) {
      console.error("Failed to update user:", error);
      toast.error("Error updating user.");
    }
  };

  // -------- Password Modal --------
  const openPasswordModal = (user) => {
    setSelectedUser(user);
    setPasswordInputs({ password: "", confirmPassword: "" });
    setPasswordModalOpen(true);
  };
  const closePasswordModal = () => {
    setPasswordModalOpen(false);
    setSelectedUser(null);
  };

  const savePassword = async () => {
    if (passwordInputs.password !== passwordInputs.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (passwordInputs.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    try {
      const res = await fetch(
        `http://${API_URI}:${PORT}/admin/user/${selectedUser.user_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ user_password: passwordInputs.password }),
        }
      );

      if (res.ok) {
        toast.success(`Password updated for "${selectedUser.user_name}".`);
        closePasswordModal();
      } else {
        toast.error("Failed to update password.");
      }
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("Error updating password.");
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="relative flex size-full min-h-screen flex-col bg-[var(--background-color)] overflow-x-hidden">
        <div className="layout-container flex h-full grow flex-col mt-10">
          <main className="main_container">
            <div className="layout-content-container flex flex-col max-w-7xl mx-auto flex-1">
              {/* Header Section */}
              <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">
                  Admin: User Management
                </h1>
                <div className="flex items-center gap-4">
                  <input
                    type="search"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="form-input block w-full md:w-64 px-4 py-3 rounded-lg text-[var(--text-primary)] bg-[var(--card-background)] border-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] placeholder:text-[var(--text-secondary)]"
                  />
                </div>
              </div>

              {/* Users Table */}
              <div className="space-y-12">
                <div>
                  <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">
                    Users
                  </h2>
                  <div className="overflow-x-auto rounded-lg border border-gray-800 bg-[var(--card-background)]">
                    {loading ? (
                      <p className="p-6 text-center text-[var(--text-secondary)]">
                        Loading users...
                      </p>
                    ) : (
                      <table className="w-full text-left">
                        <thead className="bg-gray-800/50">
                          <tr>
                            <th className="px-6 py-4">Username</th>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4">Phone</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => (
                              <tr
                                key={user.user_id}
                                className="hover:bg-gray-800/30 transition-colors"
                              >
                                <td className="px-6 py-4 whitespace-nowrap text-lg font-medium text-[var(--text-primary)]">
                                  {user.user_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-[var(--text-secondary)]">
                                  {user.email}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-[var(--text-secondary)]">
                                  {user.phone_no}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-[var(--text-secondary)]">
                                  {user.title_name}
                                </td>
                                <td className="px-6 py-4 text-center flex justify-center gap-4">
                                  {/* Edit button */}
                                  <button
                                    type="button"
                                    onClick={() => openEditModal(user)}
                                    className="text-blue-400 hover:text-blue-500"
                                    title="Edit user"
                                  >
                                    <span className="material-icons text-md">
                                      edit
                                    </span>
                                  </button>

                                  {/* Password change button */}
                                  <button
                                    type="button"
                                    onClick={() => openPasswordModal(user)}
                                    className="text-cyan-400 hover:text-cyan-500"
                                    title="Change password"
                                  >
                                    <span className="material-icons text-md">
                                      lock_reset
                                    </span>
                                  </button>

                                  {/* Delete button */}
                                  <button
                                    type="button"
                                    onClick={() => openDeleteModal(user)}
                                    className="text-red-400 hover:text-red-500 hover:cursor-pointer"
                                    title="Delete user"
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
                                No users found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* Delete Modal */}
        <DeleteModal
          show={deleteModalOpen}
          onClose={closeDeleteModal}
          onConfirm={confirmDelete}
          entityName="user"
        />

        {/* Edit Modal */}
        {editModalOpen && editingUser && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
            <div className="bg-[#1e242c] rounded-lg p-8 w-full max-w-lg shadow-2xl">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-200">
                  Edit User: {editingUser.user_name}
                </h2>
                <button
                  onClick={closeEditModal}
                  className="text-gray-400 hover:text-gray-200 cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  saveUser();
                }}
                className="space-y-5"
              >
                {/* Username */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={editingUser.user_name}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        user_name: e.target.value,
                      })
                    }
                    className="w-full bg-[#2b3440] text-gray-200 rounded-md py-3 px-4"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editingUser.email}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, email: e.target.value })
                    }
                    className="w-full bg-[#2b3440] text-gray-200 rounded-md py-3 px-4"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={editingUser.phone_no}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        phone_no: e.target.value,
                      })
                    }
                    className="w-full bg-[#2b3440] text-gray-200 rounded-md py-3 px-4"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    Role
                  </label>
                  <select
                    value={editingUser.title_name}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        title_name: e.target.value,
                      })
                    }
                    className="w-full bg-[#2b3440] text-gray-200 rounded-md py-3 px-4"
                  >
                    {Object.entries(titles).map(([id, name]) => (
                      <option key={id} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-4 pt-6">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="px-6 py-2 rounded-md border border-gray-500 text-gray-300 hover:bg-gray-700 hover:cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-500 hover:cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Password Modal */}
        {passwordModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
            <div className="bg-[#1e242c] rounded-lg p-8 w-full max-w-md shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-4">
                Change Password for {selectedUser?.user_name}
              </h2>

              <div className="relative mb-3">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="New Password"
                  value={passwordInputs.password}
                  onChange={(e) =>
                    setPasswordInputs({
                      ...passwordInputs,
                      password: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded bg-gray-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span
                  className="material-icons absolute right-3 top-2 cursor-pointer text-gray-400"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </div>

              <div className="relative mb-3">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={passwordInputs.confirmPassword}
                  onChange={(e) =>
                    setPasswordInputs({
                      ...passwordInputs,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded bg-gray-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span
                  className="material-icons absolute right-3 top-2 cursor-pointer text-gray-400"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? "visibility_off" : "visibility"}
                </span>
              </div>

              <div className="flex justify-end gap-4 mt-4">
                <button
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 hover:cursor-pointer"
                  onClick={closePasswordModal}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 hover:cursor-pointer"
                  onClick={savePassword}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
