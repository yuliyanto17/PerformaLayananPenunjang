import React, { useEffect, useMemo, useRef, useState } from "react";
import { adminApi } from "../api/adminApi";
import AdminShell from "../components/AdminShell";
import DataTable from "../components/ui/DataTable";
import Pagination from "../components/ui/Pagination";
import { Search } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

const SHIFT_OPTIONS = ["PAGI", "SIANG", "MALAM"];

const Badge = ({ children, variant = "gray" }) => {
  const map = {
    gray: "bg-slate-100 text-slate-700",
    green: "bg-green-100 text-green-800",
    primary: "bg-primary-100 text-primary-800",
  };
  return <span className={`badge ${map[variant]}`}>{children}</span>;
};

export default function ShiftPage() {
  const [shiftDate, setShiftDate] = useState(new Date().toISOString().split('T')[0]);
  const [shiftName, setShiftName] = useState("PAGI");
  const [q, setQ] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, totalPages: 1 });
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Role + layanan tabs
  const [adminMe, setAdminMe] = useState(null);
  const [layananList, setLayananList] = useState([]);
  const [selectedLayananId, setSelectedLayananId] = useState(null);

  const didInit = useRef(false);

  // layananId yang efektif dikirim ke API:
  // SUPER_ADMIN → selectedLayananId (dari tab)
  // ADMIN_LAYANAN → undefined (backend pakai JWT layanan_id)
  const getLayananId = (adminRole, layananId) =>
    adminRole === 'SUPER_ADMIN' ? layananId : undefined;

  const load = async (page = 1, layananIdOvr, adminRoleOvr) => {
    try {
      setLoading(true);
      setError(null);

      const role = adminRoleOvr ?? adminMe?.role;
      const layananId = layananIdOvr !== undefined
        ? layananIdOvr
        : getLayananId(role, selectedLayananId);

      const [statusRes, listRes] = await Promise.all([
        adminApi.shiftStatus(shiftDate, shiftName, layananId),
        adminApi.petugasList({ page, limit: pagination.limit, q, layanan_id: layananId }),
      ]);

      setSelectedIds(new Set(statusRes.data?.selected_petugas_ids || []));
      setRows(listRes.data || []);
      setPagination(listRes.pagination || { page: 1, limit: 50, totalPages: 1 });
    } catch (e) {
      setError(e.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  // Init: fetch admin profile + layanan list (untuk SUPER_ADMIN)
  useEffect(() => {
    const init = async () => {
      try {
        const [resAdmin, resLayanan] = await Promise.all([
          adminApi.me(),
          adminApi.layananList(),
        ]);

        const admin = resAdmin.data;
        setAdminMe(admin);

        let initLayananId;
        if (admin.role === 'SUPER_ADMIN') {
          const list = resLayanan.data || [];
          setLayananList(list);
          initLayananId = list[0]?.layanan_id ?? null;
          setSelectedLayananId(initLayananId);
        }

        await load(1, initLayananId, admin.role);
        didInit.current = true;
      } catch (e) {
        toast.error("Gagal memuat konfigurasi");
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload saat filter tanggal/shift/tab layanan berubah — skip sebelum init selesai
  useEffect(() => {
    if (!didInit.current) return;
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shiftDate, shiftName, selectedLayananId]);

  const toggleOne = (id, checked) => {
    const next = new Set(selectedIds);
    checked ? next.add(id) : next.delete(id);
    setSelectedIds(next);
  };

  const isAllChecked = rows.length > 0 && rows.every((r) => selectedIds.has(r.petugas_id));

  const toggleAll = (checked) => {
    const next = new Set(selectedIds);
    rows.forEach((r) => checked ? next.add(r.petugas_id) : next.delete(r.petugas_id));
    setSelectedIds(next);
  };

  const applyShift = async () => {
    try {
      setSaving(true);
      setError(null);
      setMessage(null);

      const ids = Array.from(selectedIds);
      const layananId = getLayananId(adminMe?.role, selectedLayananId);

      const todayStr = new Date().toISOString().split('T')[0];
      if (shiftDate === todayStr && ids.length === 0) {
        const ok = window.confirm(
          'Tidak ada petugas yang dipilih. Menerapkan shift kosong akan membuat SEMUA petugas off-duty hari ini. Lanjutkan?'
        );
        if (!ok) { setSaving(false); return; }
      }

      await adminApi.shiftApply(shiftDate, shiftName, ids, layananId);
      toast.success("Shift berhasil diterapkan!");
      setSelectedIds(new Set());
      await load(pagination.page);
      setMessage(`Shift ${shiftName} berhasil diperbarui.`);
    } catch (e) {
      const errorMsg = e.response?.data?.message || e.message || "Gagal menerapkan shift";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo(() => [
    {
      key: "check",
      title: (
        <input
          type="checkbox"
          checked={isAllChecked}
          onChange={(e) => toggleAll(e.target.checked)}
          className="h-4 w-4"
        />
      ),
      render: (r) => (
        <input
          type="checkbox"
          checked={selectedIds.has(r.petugas_id)}
          onChange={(e) => toggleOne(r.petugas_id, e.target.checked)}
          className="h-4 w-4"
        />
      ),
    },
    {
      key: "nama",
      title: "Petugas",
      render: (r) => (
        <div>
          <div className="font-semibold text-slate-900">{r.nama_petugas}</div>
          <div className="text-xs text-slate-500">{r.jabatan || "-"}</div>
        </div>
      ),
    },
    // Kolom layanan hanya muncul saat SUPER_ADMIN (ada banyak layanan)
    ...(adminMe?.role === 'SUPER_ADMIN' ? [] : []),
    {
      key: "status",
      title: "Status",
      render: (r) => (
        <Badge variant={r.is_on_duty ? "green" : "gray"}>
          {r.is_on_duty ? "ON DUTY" : "OFF"}
        </Badge>
      ),
    },
    {
      key: "aksi",
      title: "Aksi",
      render: (r) => r.is_on_duty ? (
        <button
          onClick={async () => {
            try {
              setSaving(true);
              await adminApi.toggleDuty(r.petugas_id, false);
              toast.success("Shift petugas selesai");
              load(pagination.page);
            } catch (e) {
              toast.error(e.message);
            } finally {
              setSaving(false);
            }
          }}
          className="btn btn-secondary text-xs px-3 py-1.5 hover:bg-red-100 hover:text-red-700 hover:border-red-200"
        >
          Selesaikan Shift
        </button>
      ) : null,
    },
  ], [rows, selectedIds, isAllChecked, adminMe]);

  return (
    <AdminShell title="Shift Manager">
      <div className="space-y-5">

        {/* Tab Layanan — hanya Super Admin */}
        {adminMe?.role === 'SUPER_ADMIN' && layananList.length > 0 && (
          <div className="bg-slate-100 rounded-2xl p-1.5 border border-slate-200/60 overflow-x-auto">
            <div className="flex gap-0.5 min-w-max">
              {layananList.map(l => {
                const isActive = String(selectedLayananId) === String(l.layanan_id);
                return (
                  <button
                    key={l.layanan_id}
                    onClick={() => setSelectedLayananId(l.layanan_id)}
                    className={`relative px-5 py-2.5 text-sm font-semibold whitespace-nowrap rounded-xl transition-colors duration-150 ${isActive ? 'text-primary-700' : 'text-slate-500 hover:text-slate-700'
                      }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="shift-tab-pill"
                        className="absolute inset-0 bg-white rounded-xl"
                        style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.08), 0 0 0 1px rgba(47,160,132,0.2)" }}
                        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                      />
                    )}
                    <span className="relative z-10">{l.layanan_name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="card p-5 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Tanggal</label>
            <input
              type="date"
              value={shiftDate}
              onChange={e => setShiftDate(e.target.value)}
              className="input mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Shift</label>
            <select
              value={shiftName}
              onChange={e => setShiftName(e.target.value)}
              className="input mt-1"
            >
              {SHIFT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Cari Petugas</label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                className="input pl-10"
                placeholder="Nama atau NIP..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && load(1)}
              />
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-slate-600">
            Terpilih: <b>{selectedIds.size}</b> petugas
          </div>
          <button
            onClick={applyShift}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? "Menyimpan..." : "Terapkan Shift"}
          </button>
        </div>

        {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}
        {message && <div className="p-4 bg-green-50 text-green-700 rounded-xl text-sm">{message}</div>}

        <DataTable columns={columns} rows={rows} loading={loading} />

        <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={load} />
      </div>
    </AdminShell>
  );
}
