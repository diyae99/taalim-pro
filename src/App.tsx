import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute, AdminRoute, PublicOnlyRoute } from "./components/ProtectedRoute";
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
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { UpdatePasswordPage } from "./pages/UpdatePasswordPage";
import { AuthStatusPage } from "./pages/AuthStatusPage";

export const App = () => (
  <BrowserRouter>
    <ToastProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>
          <Route path="/update-password" element={<UpdatePasswordPage />} />
          <Route path="/account-pending" element={<AuthStatusPage expectedStatus="pending" title="Compte en attente de validation" message="Votre demande a bien été enregistrée. Un administrateur doit activer votre compte avant que vous puissiez accéder à votre espace." />} />
          <Route path="/account-suspended" element={<AuthStatusPage expectedStatus="suspended" title="Compte suspendu" message="L'accès à votre compte a été suspendu. Contactez l'administrateur de Taalim Pro pour obtenir de l'aide." />} />
          <Route path="/account-rejected" element={<AuthStatusPage expectedStatus="rejected" title="Compte rejeté" message="Votre demande d'accès n'a pas été acceptée. Contactez l'administrateur si vous pensez qu'il s'agit d'une erreur." />} />
          <Route path="/unauthorized" element={<AuthStatusPage title="Accès non autorisé" message="Votre compte ne dispose pas des autorisations nécessaires pour accéder à cette page." />} />
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
