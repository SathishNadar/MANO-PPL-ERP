import React, { useState } from "react";
import Sidebar from "../SidebarComponent/sidebar";

const usersData = [
  { id: 1, name: "Latika", email: "latikasc11@gmail.com", role: "Admin", phone: "1213123" },
  { id: 2, name: "Test", email: "test@gmail.com", role: "Viewer", phone: "1213123" },
  { id: 3, name: "Mano", email: "manobharathi169@gmail.com", role: "Custom", phone: "9876543210" },
  { id: 4, name: "New User", email: "new_user@gmail.com", role: "Custom", phone: "1122334455" },
  { id: 5, name: "Nice Bike", email: "nice@bike.com", role: "Accounts", phone: "9988776655" },
];

// ✅ Reusable Delete Modal (same design style as your DeleteTaskModal)
const DeleteUserModal = ({ show, onClose, onConfirm, user }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-[#1e242c] rounded-lg p-8 w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold text-gray-200 mb-4">Confirm Deletion</h2>
        <p className="text-gray-400 mb-6">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-gray-200">{user?.name}</span>?  
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-md border border-gray-500 text-gray-300 hover:bg-gray-700"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-6 py-2 rounded-md bg-red-600 text-white font-medium hover:bg-red-500"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const Admin = () => {
  const [users, setUsers] = useState(usersData);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setSelectedUser(null);
    setDeleteModalOpen(false);
  };

  const confirmDelete = () => {
    setUsers(users.filter((u) => u.id !== selectedUser.id));
    closeDeleteModal();
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-background-dark text-text-dark">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-text-dark">
              Admin: User Management
            </h1>
            <button className="mt-4 sm:mt-0 flex items-center bg-primary text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition duration-300">
              <span className="material-icons-outlined mr-2">add</span> Add User
            </button>
          </div>

          {/* Table */}
          <div className="bg-card-dark rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="p-4 font-semibold text-text-secondary-dark uppercase text-sm tracking-wider">Username</th>
                    <th className="p-4 font-semibold text-text-secondary-dark uppercase text-sm tracking-wider">Email</th>
                    <th className="p-4 font-semibold text-text-secondary-dark uppercase text-sm tracking-wider">Phone</th>
                    <th className="p-4 font-semibold text-text-secondary-dark uppercase text-sm tracking-wider">Role</th>
                    <th className="p-4 font-semibold text-text-secondary-dark uppercase text-sm tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dark">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="p-4 whitespace-nowrap">{user.name}</td>
                      <td className="p-4 whitespace-nowrap text-text-secondary-dark">{user.email}</td>
                      <td className="p-4 whitespace-nowrap text-text-secondary-dark">{user.phone}</td>
                      <td className="p-4 whitespace-nowrap text-text-secondary-dark">{user.role}</td>
                      <td className="p-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openDeleteModal(user)}
                          className="text-red-400 hover:text-red-300 flex items-center bg-red-900/50 px-3 py-1 rounded-md transition duration-300"
                        >
                          <span className="material-icons-outlined mr-1 text-sm">delete</span>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Delete Modal */}
        <DeleteUserModal
          show={deleteModalOpen}
          onClose={closeDeleteModal}
          onConfirm={confirmDelete}
          user={selectedUser}
        />
      </div>
    </div>
  );
};

export default Admin;
