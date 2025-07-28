//DONT REMOVE THIS COMMENT
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './context/protection.jsx'

import Login from "./pages/Login/login.jsx"
import Forgotpassword from './pages/ForgotPassword/forgotpassword.jsx'

import DPR from "./pages/DPR/dpr.jsx"

import Home from "./pages/Dashboard/Home/home.jsx"
import ProjectsView from './pages/Dashboard/Projects/ProjectsView.jsx'
import WIP from './pages/Dashboard/WorkInProgress/workinprogress.jsx'
// import './App.css'

function App() {
  return (
    <div>
      <Routes>
        <Route exact path="/" element={<Login />} /> // default route set to login
        <Route path="/login" element={<ProtectedRoute><Login /></ProtectedRoute>} />
        <Route path="/forgotpassword" element={<Forgotpassword/>}/> 
        <Route path="/dpr" element={<ProtectedRoute><DPR /></ProtectedRoute>} />
        
        <Route path="/dashboard/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/dashboard/projects" element={<ProtectedRoute><ProjectsView /></ProtectedRoute>} />
        <Route path="/dashboard/work-in-progress" element={<ProtectedRoute><WIP /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}

export default App
