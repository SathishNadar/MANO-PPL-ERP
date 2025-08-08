//DONT REMOVE THIS COMMENT
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './context/protection.jsx'

import UserAuth from './pages/UserAuth/UserAuth.jsx'
import DPR from "./pages/DPR/DailyProgressReport.jsx"

import Home from "./pages/Dashboard/Home/home.jsx"
import VendorList from './pages/Dashboard/VendorList/VendorList.jsx'
import WIP from './pages/Dashboard/WorkInProgress/workinprogress.jsx'

import ProjectsView from './pages/Dashboard/Projects/ProjectsView.jsx'
import ProjectDescription from './pages/Dashboard/Projects/ProjectDescription.jsx'
import DprFetchViewer from './pages/DPR/DprFetchViewer.jsx'

import Dummy from './pages/Dashboard/VendorList/VendorFilter.jsx'
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
        
        <Route path="/dashboard/vendors/" element={<ProtectedRoute><VendorList /></ProtectedRoute>} />
        <Route path="/dashboard/work-in-progress" element={<ProtectedRoute><WIP /></ProtectedRoute>} />
        <Route path="/dashboard/project-description" element={<ProtectedRoute><ProjectDescription /></ProtectedRoute>} />
        <Route path="/dashboard/project-description/dpr-fetch" element={<ProtectedRoute><DprFetchViewer /></ProtectedRoute>} />
        <Route path="/dummy" element={<Dummy/>} />
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default App
