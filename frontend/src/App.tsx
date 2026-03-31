import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Footer } from "./components/Footer";
import { Navbar } from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DashboardLayout } from "./dashboard/DashboardLayout";
import { useAuth } from "./context/AuthContext";
import { setAuthToken } from "./utils/api";
import { Box, CircularProgress } from "@mui/material";

// Lazy load pages
const LandingPage = lazy(() => import("./pages/LandingPage").then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import("./pages/LoginPage").then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("./pages/RegisterPage").then(m => ({ default: m.RegisterPage })));
const VerifyOtpPage = lazy(() => import("./pages/VerifyOtpPage").then(m => ({ default: m.VerifyOtpPage })));
const DashboardHome = lazy(() => import("./dashboard/DashboardHome").then(m => ({ default: m.DashboardHome })));
const FarmerDashboard = lazy(() => import("./dashboard/FarmerDashboard").then(m => ({ default: m.FarmerDashboard })));
const DoctorDashboard = lazy(() => import("./dashboard/DoctorDashboard").then(m => ({ default: m.DoctorDashboard })));
const AdminDashboard = lazy(() => import("./dashboard/AdminDashboard").then(m => ({ default: m.AdminDashboard })));

const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </Box>
);

function App() {
  const { token } = useAuth();
  setAuthToken(token);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-otp" element={<VerifyOtpPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardHome />} />
              <Route
                path="farmer"
                element={
                  <ProtectedRoute roles={["farmer"]}>
                    <FarmerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="doctor"
                element={
                  <ProtectedRoute roles={["doctor"]}>
                    <DoctorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Box>
      <Footer />
    </Box>
  );
}

export default App;
