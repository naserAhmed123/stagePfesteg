import { Navigate } from "react-router-dom";
import { useAuth } from "./layout/AuthContext";
import { JSX } from "react";

const ProtectedRoute = ({ role, children }: { role: string; children: JSX.Element }) => {
  const { user } = useAuth(); 
  const userRole = user?.role || "client";

  if (userRole !== role) {
    return <Navigate to="/not-found" />;
  }

  return children;
};

export default ProtectedRoute;
