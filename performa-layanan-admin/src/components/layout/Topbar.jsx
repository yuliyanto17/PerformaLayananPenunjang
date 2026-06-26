import React from "react";
import { Menu, LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";

export default function Topbar({ adminMe, onMenu, onToggle, sidebarCollapsed, onLogout }) {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200 h-[64px] flex items-center">
      <div className="w-full px-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Mobile: hamburger buka drawer */}
          <button
            onClick={onMenu}
            className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-600"
            aria-label="Buka menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop: toggle collapse sidebar */}
          <button
            onClick={onToggle}
            className="hidden lg:flex p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
            title={sidebarCollapsed ? "Buka sidebar" : "Tutup sidebar"}
          >
            {sidebarCollapsed
              ? <PanelLeftOpen className="w-5 h-5" />
              : <PanelLeftClose className="w-5 h-5" />
            }
          </button>

          <div className="text-sm font-semibold text-slate-700">
            {adminMe?.username ? `${adminMe.username}` : ""}
          </div>
        </div>

        <button onClick={onLogout} className="btn btn-secondary text-sm">
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </header>
  );
}
