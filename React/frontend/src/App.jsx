import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './context/protection.jsx'

import Login from "./pages/Login/login.jsx"
import Dashboard from "./pages/Dashboard/dashboard.jsx"
import DPR from "./pages/DPR/dpr.jsx"

import './App.css'

function App() {
  return (
    <div>
      <Routes>
        <Route exact path="/" element={<Login />} /> // default route set to login
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/login" element={<ProtectedRoute><Login /></ProtectedRoute>} />
        <Route path="/dpr" element={<ProtectedRoute><DPR /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}

export default App
