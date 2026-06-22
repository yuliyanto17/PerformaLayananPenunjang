import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  QrCode,
  ClipboardList,
  LogOut,
  Settings,
} from "lucide-react";

const navItemClass = ({ isActive }) =>
  `flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors
   ${isActive ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-100"}`;

export default function Sidebar({ adminMe, onLogout, onNavigate }) {
  return (
    <aside className="fixed left-0 top-0 h-full w-[280px] border-r border-slate-200 bg-white">
      <div className="p-5 border-b border-slate-200">
        <div className="text-lg font-extrabold text-slate-900">
          Admin Panel
        </div>
        <div className="text-xs text-slate-500 mt-1">
          Performa Layanan Penunjang
        </div>

        <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-3">
          <div className="text-sm font-bold text-slate-900">
            {adminMe?.nama_admin || adminMe?.username || "Admin"}
          </div>
          <div className="text-xs text-slate-600 mt-0.5">
            Layanan ID: {adminMe?.layanan_id ?? "-"}
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-2">
        <NavLink to="/dashboard" className={navItemClass} onClick={onNavigate}>
          <LayoutDashboard className="w-5 h-5" />
          Dashboard
        </NavLink>

        <NavLink to="/shift" className={navItemClass} onClick={onNavigate}>
          <Users className="w-5 h-5" />
          Shift Manager
        </NavLink>

        <NavLink to="/kiosk" className={navItemClass} onClick={onNavigate}>
          <QrCode className="w-5 h-5" />
          Kiosk QR
        </NavLink>

        <NavLink to="/penilaian" className={navItemClass} onClick={onNavigate}>
          <ClipboardList className="w-5 h-5" />
          Penilaian
        </NavLink>

        <div className="pt-3 mt-3 border-t border-slate-200">
          <button
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-slate-700 hover:bg-slate-100"
            onClick={onLogout}
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 text-xs text-slate-500">
        v1.0 • Internal RS
      </div>
    </aside>
  );
}