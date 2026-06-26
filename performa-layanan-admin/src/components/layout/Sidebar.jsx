import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  QrCode,
  ClipboardList,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/shift",     icon: Users,           label: "Shift Manager" },
  { to: "/kiosk",     icon: QrCode,          label: "Kiosk QR" },
  { to: "/penilaian", icon: ClipboardList,   label: "Penilaian" },
];

export default function Sidebar({ adminMe, onLogout, onNavigate, collapsed, onToggle }) {
  return (
    <aside
      className={`fixed left-0 top-0 h-full border-r border-slate-200 bg-white flex flex-col transition-all duration-300 z-40
        ${collapsed ? "w-[72px]" : "w-[280px]"}`}
    >
      {/* Header */}
      <div className={`flex items-center border-b border-slate-200 h-[64px] shrink-0
        ${collapsed ? "justify-center px-0" : "justify-between px-5"}`}
      >
        {!collapsed && (
          <div>
            <div className="text-base font-extrabold text-slate-900 leading-tight">Admin Panel</div>
            <div className="text-[11px] text-slate-500">Performa Layanan</div>
          </div>
        )}

        {/* Toggle button — selalu tampil */}
        {onToggle && (
          <button
            onClick={onToggle}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
            title={collapsed ? "Buka sidebar" : "Tutup sidebar"}
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        )}
      </div>

      {/* Admin info — hanya tampil saat expanded */}
      {!collapsed && (
        <div className="px-4 pt-4 pb-2 shrink-0">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="text-sm font-bold text-slate-900 truncate">
              {adminMe?.nama_admin || adminMe?.username || "Admin"}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Layanan ID: {adminMe?.layanan_id ?? "-"}
            </div>
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav className={`flex-1 overflow-y-auto py-3 ${collapsed ? "px-2" : "px-4"} space-y-1`}>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl font-semibold transition-colors
               ${collapsed ? "justify-center px-0 py-3" : "px-4 py-3"}
               ${isActive
                 ? "bg-primary-50 text-primary-700"
                 : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
               }`
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}

        {/* Logout */}
        <div className={`pt-3 mt-2 border-t border-slate-200`}>
          <button
            onClick={onLogout}
            title={collapsed ? "Logout" : undefined}
            className={`w-full flex items-center gap-3 rounded-xl font-semibold text-slate-600
              hover:bg-red-50 hover:text-red-600 transition-colors
              ${collapsed ? "justify-center px-0 py-3" : "px-4 py-3"}`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </nav>

      {/* Footer version */}
      {!collapsed && (
        <div className="shrink-0 px-5 py-3 border-t border-slate-200 text-[10px] text-slate-400">
          v1.0 • Internal RS
        </div>
      )}
    </aside>
  );
}
