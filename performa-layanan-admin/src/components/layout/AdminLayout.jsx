import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { adminApi } from "../../api/adminApi";

export default function AdminLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem("sidebar_collapsed") === "true"
  );
  const [adminMe, setAdminMe] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const me = await adminApi.me();
        setAdminMe(me.data);
      } catch {
        localStorage.removeItem("admin_token");
        navigate("/login");
      }
    };
    init();
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("admin_token");
    navigate("/login");
  };

  const toggleCollapse = () => {
    setSidebarCollapsed(prev => {
      localStorage.setItem("sidebar_collapsed", String(!prev));
      return !prev;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar desktop */}
      <div className="hidden lg:block">
        <Sidebar
          adminMe={adminMe}
          onLogout={logout}
          collapsed={sidebarCollapsed}
          onToggle={toggleCollapse}
        />
      </div>

      {/* Sidebar mobile drawer */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 top-0 h-full w-[280px] bg-white shadow-2xl"
          >
            <Sidebar
              adminMe={adminMe}
              onLogout={logout}
              onNavigate={() => setSidebarOpen(false)}
              collapsed={false}
            />
          </motion.div>
        </div>
      )}

      {/* Main area — padding kiri menyesuaikan state sidebar */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-[280px]"}`}>
        <Topbar
          adminMe={adminMe}
          onMenu={() => setSidebarOpen(true)}
          onToggle={toggleCollapse}
          sidebarCollapsed={sidebarCollapsed}
          onLogout={logout}
        />

        <main className="w-full px-6 py-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
