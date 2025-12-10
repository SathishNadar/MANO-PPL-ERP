//DONT REMOVE THIS COMMENT
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./context/protection.jsx";

import UserAuth from "./pages/UserAuth/UserAuth.jsx";

import Home from "./pages/Dashboard/Home/home.jsx";
import VendorList from "./pages/Dashboard/VendorList/VendorList.jsx";
import WIP from "./pages/Dashboard/WorkInProgress/workinprogress.jsx";

import DPRCreate from "./pages/DPR/DailyProgressReport.jsx";
import ProjectEdit from "./pages/DPR/DprEditor.jsx";

import ProjectsView from "./pages/Dashboard/Projects/ProjectsView.jsx";
import ProjectDescription from "./pages/Dashboard/Projects/ProjectDescription.jsx";
import DPRList from "./pages/Dashboard/Projects/DPRList.jsx";
import ProjectDirectory from "./pages/Dashboard/ProjectDirectory/ProjectDirectory.jsx";
import ProjectVendorList from "./pages/Dashboard/ProjectVendorList/ProjectVendorList.jsx";
import DprFetchViewer from "./pages/DPR/DprFetchViewer.jsx";
import DprUpdateSubmit from "./pages/DPR/DprUpdateSubmit.jsx";
import StaffRoles from "./pages/Dashboard/StaffRoles/StaffRoles.jsx";
import AgendaMinutes from "./pages/Dashboard/AgendaMinutes/AgendaMinutes.jsx";
import HindranceReport from "./pages/Dashboard/HindranceReport/HindranceReport.jsx";
import Dummy from "./pages/Dashboard/VendorList/VendorFilter.jsx";
import Admin from "./pages/admin/Admin.jsx";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


function App() {
  return (
    <div>
      <Routes>
        <Route exact path="/" element={<UserAuth />} /> // default route set to
        login
        <Route path="/auth" element={<UserAuth />} />
        <Route
          path="/dashboard/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/projects"
          element={
            <ProtectedRoute>
              <ProjectsView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/vendors/"
          element={
            <ProtectedRoute>
              <VendorList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/work-in-progress"
          element={
            <ProtectedRoute>
              <WIP />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/project-description/:projectId"
          element={
            <ProtectedRoute>
              <ProjectDescription />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/project-description/:projectId/:dprId"
          element={
            <ProtectedRoute>
              <DprFetchViewer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/project-description/:projectId/dpr-list"
          element={
            <ProtectedRoute>
              <DPRList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/project-directory"
          element={
            <ProtectedRoute>
              <ProjectDirectory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/project-vendor-list"
          element={
            <ProtectedRoute>
              <ProjectVendorList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/staff-roles"
          element={
            <ProtectedRoute>
              <StaffRoles />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/agenda-minutes"
          element={
            <ProtectedRoute>
              <AgendaMinutes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/hindrance-report"
          element={
            <ProtectedRoute>
              <HindranceReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/project-description/:projectId/dprCreate"
          element={
            <ProtectedRoute>
              <DPRCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/project-description/:projectId/dprEdit"
          element={
            <ProtectedRoute>
              <ProjectEdit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/project-description/dpr-fetch"
          element={
            <ProtectedRoute>
              <DprFetchViewer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/project-description/dprUpdate/:projectId/:dprId"
          element={
            <ProtectedRoute>
              <DprUpdateSubmit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />
        <Route path="/dummy2" element={<Dummy />} />
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={1200}
        pauseOnHover={false}
        pauseOnFocusLoss={false}
        pauseOnClick={false}
      />
    </div>
  );
}

export default App;
