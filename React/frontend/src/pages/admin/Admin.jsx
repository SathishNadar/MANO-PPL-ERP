import React, { useEffect, useState } from "react";
import Sidebar from "../SidebarComponent/sidebar";
import { DeleteModal } from "../Dashboard/WorkInProgress/TaskModals";
import { toast } from "react-toastify";

const API_URI = import.meta.env.VITE_API_URI;
const PORT = import.meta.env.VITE_BACKEND_PORT;

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`http://${API_URI}:${PORT}/admin/users`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.users)) {
          setUsers(data.users);
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

  // Delete user
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

  const startEdit = (user) => {
    setEditingUser({ ...user });
  };

  const cancelEdit = () => {
    setEditingUser(null);
  };

  // Save edited user
  const saveUser = async (userId) => {
    try {
      const res = await fetch(
        `http://${API_URI}:${PORT}/admin/user/${userId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(editingUser),
        }
      );

      if (res.ok) {
        setUsers(users.map((u) => (u.user_id === userId ? editingUser : u)));
        toast.success(`User "${editingUser.user_name}" updated successfully!`);
        setEditingUser(null);
      } else {
        toast.error("Failed to update user.");
      }
    } catch (error) {
      console.error("Failed to update user:", error);
      toast.error("Error updating user.");
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
                  <button
                    onClick={() => toast.info("TODO: Add user modal")}
                    className="rounded-md px-6 py-3 inline-flex items-center justify-center gap-2 whitespace-nowrap
                            bg-blue-600 hover:bg-blue-500 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
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
                    <span>Add User</span>
                  </button>
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
                                  {editingUser?.user_id === user.user_id ? (
                                    <input
                                      type="text"
                                      value={editingUser.user_name}
                                      onChange={(e) =>
                                        setEditingUser({
                                          ...editingUser,
                                          user_name: e.target.value,
                                        })
                                      }
                                      className="bg-gray-900 text-white px-2 py-1 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  ) : (
                                    user.user_name
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-[var(--text-secondary)]">
                                  {editingUser?.user_id === user.user_id ? (
                                    <input
                                      type="email"
                                      value={editingUser.email}
                                      onChange={(e) =>
                                        setEditingUser({
                                          ...editingUser,
                                          email: e.target.value,
                                        })
                                      }
                                      className="bg-gray-900 text-white px-2 py-1 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  ) : (
                                    user.email
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-[var(--text-secondary)]">
                                  {editingUser?.user_id === user.user_id ? (
                                    <input
                                      type="text"
                                      value={editingUser.phone_no}
                                      onChange={(e) =>
                                        setEditingUser({
                                          ...editingUser,
                                          phone_no: e.target.value,
                                        })
                                      }
                                      className="bg-gray-900 text-white px-2 py-1 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  ) : (
                                    user.phone_no
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-[var(--text-secondary)]">
                                  {editingUser?.user_id === user.user_id ? (
                                    <input
                                      type="text"
                                      value={editingUser.title_name}
                                      onChange={(e) =>
                                        setEditingUser({
                                          ...editingUser,
                                          title_name: e.target.value,
                                        })
                                      }
                                      className="bg-gray-900 text-white px-2 py-1 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  ) : (
                                    user.title_name
                                  )}
                                </td>
                                <td className="px-6 py-4 text-center flex justify-center gap-4">
                                  {editingUser?.user_id === user.user_id ? (
                                    <>
                                      {/* Save button */}
                                      <button
                                        type="button"
                                        onClick={() => saveUser(user.user_id)}
                                        className="text-green-400 hover:text-green-500"
                                        title="Save changes"
                                      >
                                        <span className="material-icons text-md">
                                          save
                                        </span>
                                      </button>

                                      {/* Cancel button */}
                                      <button
                                        type="button"
                                        onClick={cancelEdit}
                                        className="text-gray-400 hover:text-gray-500"
                                        title="Cancel edit"
                                      >
                                        <span className="material-icons text-md">
                                          close
                                        </span>
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      {/* Edit button */}
                                      <button
                                        type="button"
                                        onClick={() => startEdit(user)}
                                        className="text-blue-400 hover:text-blue-500"
                                        title="Edit user"
                                      >
                                        <span className="material-icons text-md">
                                          edit
                                        </span>
                                      </button>

                                      {/* Delete button (unchanged) */}
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
                                    </>
                                  )}
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
      </div>
    </div>
  );
};

export default Admin;
