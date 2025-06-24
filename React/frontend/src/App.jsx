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
        <Route exact path="/" element={<Dashboard />} /> // badlna hai baadme 
        <Route path="/login" element={<Login />} />
        <Route path="/dpr" element={<Dpr />} />
      </Routes>
    </div>
  );
}

export default App
