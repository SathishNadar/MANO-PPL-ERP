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
import AgendaList from "./pages/Dashboard/AgendaOfMeeting/AgendaList.jsx";
import AgendaDetails from "./pages/Dashboard/AgendaOfMeeting/AgendaDetails.jsx";
import MinutesList from "./pages/Dashboard/MinutesOfMeeting/MinutesList.jsx";
import MinutesDetails from "./pages/Dashboard/MinutesOfMeeting/MinutesDetails.jsx";
import HindranceReport from "./pages/Dashboard/HindranceReport/HindranceReport.jsx";
import ProjectSummary from "./pages/Dashboard/ProjectSummary/ProjectSummary.jsx";
import OrganisationChart from "./pages/Dashboard/OrganisationChart/OrganisationChart.jsx";
import Dummy from "./pages/Dashboard/VendorList/VendorFilter.jsx";
import Admin from "./pages/admin/Admin.jsx";

import AttendanceDashboard from "./pages/Dashboard/Attendance/AttendanceDashboard.jsx";
import AdminView from "./pages/Dashboard/Attendance/AdminView.jsx";

import AttendanceUsers from "./pages/Dashboard/Attendance/AttendanceAdmin.jsx"

import BudgetingCreate from "./pages/BudgetingComponent/BudgetCreation.jsx"
import BudgetingView from "./pages/BudgetingComponent/BudgetView.jsx"
import BudgetUpdate from "./pages/BudgetingComponent/BudgetUpdate.jsx"

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
          path="/dashboard/project-description/:projectId/project-vendor-list"
          element={
            <ProtectedRoute>
              <ProjectVendorList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/project-description/:projectId/staff-roles"
          element={
            <ProtectedRoute>
              <StaffRoles />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/agenda"
          element={
            <ProtectedRoute>
              <AgendaList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/agenda/:id"
          element={
            <ProtectedRoute>
              <AgendaDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/minutes"
          element={
            <ProtectedRoute>
              <MinutesList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/minutes/:id"
          element={
            <ProtectedRoute>
              <MinutesDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/project-description/:projectId/hindrance-report"
          element={
            <ProtectedRoute>
              <HindranceReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/project-description/:projectId/project-directory"
          element={
            <ProtectedRoute>
              <ProjectDirectory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/project-summary"
          element={
            <ProtectedRoute>
              <ProjectSummary />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/organisation-chart"
          element={
            <ProtectedRoute>
              <OrganisationChart />
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


        <Route
          path="/dashboard/project-description/:projectId/budgetCreate"
          element={
            <ProtectedRoute>
              <BudgetingCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/project-description/:projectId/budgetView"
          element={
            <ProtectedRoute>
              <BudgetingView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/project-description/:projectId/budgetUpdate"
          element={
            <ProtectedRoute>
              <BudgetUpdate />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/attendance"
          element={
            <ProtectedRoute>
              <AttendanceDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/attendance/admin"
          element={
            <ProtectedRoute>
              <AdminView />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/attendance/users"
          element={
            <ProtectedRoute>
              <AttendanceUsers />
            </ProtectedRoute>
          }
        />

        <Route path="/dummy2"
          element={<Dummy />}
        />
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={1200}
        pauseOnHover={false}
        pauseOnFocusLoss={false}
        pauseOnClick={false}
      />
    </div >
  );
}

export default App;
