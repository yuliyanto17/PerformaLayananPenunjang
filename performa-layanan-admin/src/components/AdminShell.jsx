import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function AdminShell({ title, children }) {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("admin_token");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="w-full px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-gray-900">{title}</div>
            <div className="text-xs text-gray-500">Admin Panel Per Layanan</div>
          </div>

          <nav className="flex items-center gap-3">
            <Link className="text-sm text-gray-700 hover:text-gray-900" to="/dashboard">
              Dashboard
            </Link>
            <Link className="text-sm text-gray-700 hover:text-gray-900" to="/shift">
              Shift
            </Link>
            <Link className="text-sm text-gray-700 hover:text-gray-900" to="/kiosk">
              Kiosk QR
            </Link>
            <Link className="text-sm text-gray-700 hover:text-gray-900" to="/penilaian">
              Penilaian
            </Link>

            <button
              onClick={logout}
              className="px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-sm font-medium"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="w-full px-6 py-6">{children}</main>
    </div>
  );
}