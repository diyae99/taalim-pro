import { Navigate, Outlet } from "react-router-dom";
import { Loading } from "./Loading";
import { useAuth } from "../context/AuthContext";

export const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "client" && user.status !== "active") return <Navigate to="/login" replace />;
  return <Outlet />;
};

export const AdminRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return <Outlet />;
};
