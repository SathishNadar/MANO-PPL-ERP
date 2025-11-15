import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, authChecked } = useAuth();

  if (!authChecked) return null;

  if (!user) {
    toast.warn("Please login first!", { toastId: "login-required" });
    return <Navigate to="/auth" replace />;
  }

  const userRole = user?.title?.title_name;

  if (allowedRoles.length === 0) {
    return children;
  }

  const isAllowed = allowedRoles.includes(userRole);

  if (!isAllowed) {
    toast.error("You don’t have permission to access this page!", {
      toastId: "permission-denied",
    });
    return <Navigate to="/dashboard/home" replace />;
  }

  return children;
};


export const PublicRoute = ({ children }) => {
  const { user, authChecked } = useAuth();

  if (!authChecked) return null;

  const isLoggedIn = user !== null;

  if (isLoggedIn) {
    return <Navigate to="/dashboard/home" replace />;
  }

  return children;
};

