import React from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();

  const handleRedirect = () => {
    navigate('/Wip'); // Change as needed
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-3xl font-semibold mb-6 text-gray-800">
        Welcome to Dashboard
      </h1>
      <button
        onClick={handleRedirect}
        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
      >
        Go to Route
      </button>
    </div>
  );
};

export default Dashboard;
