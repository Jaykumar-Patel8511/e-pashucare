import { Navigate, Route, Routes } from "react-router-dom";
import { Footer } from "./components/Footer";
import { Navbar } from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminDashboard } from "./dashboard/AdminDashboard";
import { DashboardHome } from "./dashboard/DashboardHome";
import { DashboardLayout } from "./dashboard/DashboardLayout";
import { DoctorDashboard } from "./dashboard/DoctorDashboard";
import { FarmerDashboard } from "./dashboard/FarmerDashboard";
import { useAuth } from "./context/AuthContext";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { VerifyOtpPage } from "./pages/VerifyOtpPage";
import { setAuthToken } from "./utils/api";

function App() {
  const { token } = useAuth();
  setAuthToken(token);

  return (
    <div className="min-h-screen bg-app-gradient bg-fixed">
      <Navbar />
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
      <Footer />
    </div>
  );
}

export default App;
