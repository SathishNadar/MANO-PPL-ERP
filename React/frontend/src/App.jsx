//DONT REMOVE THIS COMMENT
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './context/protection.jsx'

import UserAuth from './pages/UserAuth/UserAuth.jsx'
import DPR from "./pages/DPR/DailyProgressReport.jsx"

import Home from "./pages/Dashboard/Home/home.jsx"
import ProjectsView from './pages/Dashboard/Projects/ProjectsView.jsx'
import WIP from './pages/Dashboard/WorkInProgress/workinprogress.jsx'
// import './App.css'

import ProjectDescription from './pages/ProjectDescription/ProjectDescription.jsx'
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <div>
      <Routes>
        <Route exact path="/" element={<UserAuth />} /> // default route set to login
        <Route path="/auth" element={<UserAuth />} />
      
        <Route path="/daily-progress-report" element={<ProtectedRoute><DPR /></ProtectedRoute>} />
        
        <Route path="/dashboard/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/dashboard/projects" element={<ProtectedRoute><ProjectsView /></ProtectedRoute>} />
        <Route path="/dashboard/work-in-progress" element={<ProtectedRoute><WIP /></ProtectedRoute>} />
        <Route path="/dashboard/projects/project-description" element={<ProtectedRoute><ProjectDescription /></ProtectedRoute>} />
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default App
