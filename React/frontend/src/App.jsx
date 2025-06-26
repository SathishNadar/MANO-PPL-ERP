import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { Routes, Route } from 'react-router-dom'

import Login from "./pages/Login/login.jsx"
import Dashboard from "./pages/Dashboard/dashboard.jsx"
import Dpr from "./pages/DPR/dpr.jsx"

import './App.css'

function App() {
  return (
    <div>
      <Routes>
        <Route exact path="/" element={<Login />} /> // default route set to login
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dpr" element={<Dpr />} />
      </Routes>
    </div>
  );
}

export default App
