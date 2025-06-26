// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const session = localStorage.getItem("session");
  const isLoggedIn = session && JSON.parse(session).expiry > Date.now();

  return isLoggedIn ? children : <Navigate to="/" replace />;
};

export default ProtectedRoute;