import React from "react";
import { Menu, LogOut } from "lucide-react";

export default function Topbar({ adminMe, onMenu, onLogout }) {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenu}
            className="lg:hidden p-2 rounded-xl hover:bg-slate-100"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 text-slate-700" />
          </button>

          <div>
            <div className="text-sm font-bold text-slate-900">Admin Panel</div>
            <div className="text-xs text-slate-500">
              {adminMe?.username ? `Login: ${adminMe.username}` : "Loading..."}
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="btn btn-secondary"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </header>
  );
}