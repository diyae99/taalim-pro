import { Navigate, Outlet } from "react-router-dom";
import { Loading } from "./Loading";
import { useAuth } from "../context/AuthContext";
import type { User } from "../types";

const statusPath = (user: User) => {
  if (user.status === "pending") return "/account-pending";
  if (user.status === "suspended") return "/account-suspended";
  if (user.status === "rejected") return "/account-rejected";
  return null;
};

const GuardLoading = () => <div className="min-h-screen"><Loading /></div>;

export const PublicOnlyRoute = () => {
  const { session, user, loading, profileUnavailable } = useAuth();
  if (loading) return <GuardLoading />;
  if (!session) return <Outlet />;
  if (profileUnavailable || !user) return <Navigate to="/unauthorized" replace />;
  const restrictedPath = statusPath(user);
  if (restrictedPath) return <Navigate to={restrictedPath} replace />;
  if (user.role === "teacher" && user.mustChangePassword) return <Navigate to="/update-password" replace />;
  return <Navigate to={user.role === "platform_admin" ? "/admin" : "/dashboard"} replace />;
};

export const ProtectedRoute = () => {
  const { session, user, loading, profileUnavailable } = useAuth();
  if (loading) return <GuardLoading />;
  if (!session) return <Navigate to="/login" replace />;
  if (profileUnavailable || !user) return <Navigate to="/unauthorized" replace />;
  const restrictedPath = statusPath(user);
  if (restrictedPath) return <Navigate to={restrictedPath} replace />;
  if (user.role !== "teacher" || user.status !== "active") return <Navigate to="/unauthorized" replace />;
  if (user.mustChangePassword) return <Navigate to="/update-password" replace />;
  return <Outlet />;
};

export const AdminRoute = () => {
  const { session, user, loading, profileUnavailable } = useAuth();
  if (loading) return <GuardLoading />;
  if (!session) return <Navigate to="/login" replace />;
  if (profileUnavailable || !user) return <Navigate to="/unauthorized" replace />;
  const restrictedPath = statusPath(user);
  if (restrictedPath) return <Navigate to={restrictedPath} replace />;
  if (user.role !== "platform_admin" || user.status !== "active") return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
};
