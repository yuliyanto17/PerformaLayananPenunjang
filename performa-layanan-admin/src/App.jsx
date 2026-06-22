import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import AdminLayout from "./components/layout/AdminLayout";

import LoginPage from "./pages/LoginPage";
import ShiftPage from "./pages/ShiftPage";
import KioskPage from "./pages/KioskPage";
import DashboardPage from "./pages/DashboardPage";
import PenilaianPage from "./pages/PenilaianPage";
import KioskFullscreenPage from "./pages/KioskFullscreenPage";

// placeholder dulu
// const DashboardPage = () => <div className="card p-6">Dashboard (coming soon)</div>;
// const PenilaianPage = () => <div className="card p-6">Penilaian (coming soon)</div>;

const RequireAuth = ({ children }) => {
  const token = localStorage.getItem("admin_token");
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {/* Route Kiosk Fullscreen (Tanpa AdminLayout) */}
        <Route path="/kiosk-full" element={<RequireAuth><KioskFullscreenPage /></RequireAuth>} />

        <Route
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/shift" element={<ShiftPage />} />
          <Route path="/kiosk" element={<KioskPage />} />
          <Route path="/penilaian" element={<PenilaianPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      <Toaster position="top-center" />
    </BrowserRouter>
  );
}