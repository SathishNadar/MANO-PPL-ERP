import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";

const ProtectedRoute = ({ children }) => {
  const session = localStorage.getItem("session");
  const isLoggedIn = session && JSON.parse(session).expiry > Date.now();
  const [showRedirect, setShowRedirect] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      toast.warn("Please login first to access this page!", {
        toastId: "login-required",
      });
      setTimeout(() => setShowRedirect(true), 100); // delay redirect by 100ms
    }
  }, []);

  if (!isLoggedIn && showRedirect) {
    return <Navigate to="/auth" replace />;
  }

  return isLoggedIn ? children : null;
};

export default ProtectedRoute;