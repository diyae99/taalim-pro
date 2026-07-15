import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute, AdminRoute } from "./components/ProtectedRoute";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/client/DashboardPage";
import { ProfilePage } from "./pages/client/ProfilePage";
import { LevelsPage } from "./pages/client/LevelsPage";
import { SemestersPage } from "./pages/client/SemestersPage";
import { SubjectsPage } from "./pages/client/SubjectsPage";
import { ExamListPage } from "./pages/client/ExamListPage";
import { PreviewPage } from "./pages/client/PreviewPage";
import { AdminOverviewPage } from "./pages/admin/AdminOverviewPage";
import { UsersPage } from "./pages/admin/UsersPage";
import { ExamsPage } from "./pages/admin/ExamsPage";
import { AddExamPage } from "./pages/admin/AddExamPage";
import { EditExamPage } from "./pages/admin/EditExamPage";

export const App = () => (
  <BrowserRouter>
    <ToastProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/complete-profile" element={<RegisterPage googleMode />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard/profile" element={<ProfilePage />} />
            <Route path="/dashboard/levels" element={<LevelsPage />} />
            <Route path="/dashboard/semesters/:level" element={<SemestersPage />} />
            <Route path="/dashboard/subjects/:level/:semester" element={<SubjectsPage />} />
            <Route path="/dashboard/exams/:level/:semester/:subject" element={<ExamListPage />} />
            <Route path="/dashboard/exams/preview/:id" element={<PreviewPage />} />
          </Route>
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminOverviewPage />} />
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/exams" element={<ExamsPage />} />
            <Route path="/admin/exams/new" element={<AddExamPage />} />
            <Route path="/admin/exams/edit/:id" element={<EditExamPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </ToastProvider>
  </BrowserRouter>
);
