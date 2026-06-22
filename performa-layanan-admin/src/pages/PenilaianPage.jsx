import React, { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { adminApi } from "../api/adminApi";
import AdminShell from "../components/AdminShell";
import PenilaianDetailModal from "../components/ui/PenilaianDetailModal";
import { formatDateID, formatRating } from "../utils/format";
import { RefreshCw, Search, Eye, Download, X } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

const STATUS_OPTIONS = [
  { value: "", label: "Semua Status" },
  { value: "submitted", label: "Submitted" },
  { value: "draft", label: "Draft" },
];

const Badge = ({ children, variant = "gray" }) => {
  const map = {
    gray: "bg-slate-100 text-slate-600 border border-slate-200",
    green: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    primary: "bg-primary-50 text-primary-700 border border-primary-200",
    blue: "bg-blue-50 text-blue-700 border border-blue-200",
  };
  return (
    <span className={`${map[variant]} px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider`}>
      {children}
    </span>
  );
};

const EMPTY_FILTERS = {
  q: "",
  status_penilaian: "",
  date_from: "",
  date_to: "",
};

export default function PenilaianPage() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [detailData, setDetailData] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [adminMe, setAdminMe] = useState(null);
  const [layananList, setLayananList] = useState([]);

  const didInit = useRef(false);

  // ─── Load list ────────────────────────────────────────────────────────────
  const load = async (page = 1, overrideFilters) => {
    try {
      setLoading(true);
      const f = overrideFilters !== undefined ? overrideFilters : filters;
      const resp = await adminApi.penilaianList({ page, ...f });
      setRows(resp.data || []);
      setPagination(resp.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch (e) {
      toast.error(e.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  // ─── Init ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const [resAdmin, resLayanan] = await Promise.all([
          adminApi.me(),
          adminApi.layananList(),
        ]);
        const admin = resAdmin.data;
        setAdminMe(admin);
        setLayananList(resLayanan.data || []);

        const initFilters = { ...EMPTY_FILTERS };
        if (admin.role !== "SUPER_ADMIN") {
          initFilters.layanan_id = admin.layanan_id;
        }
        setFilters(initFilters);
        await load(1, initFilters);
        didInit.current = true;
      } catch (e) {
        toast.error("Gagal memuat konfigurasi");
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Reload saat filter/tab berubah ───────────────────────────────────────
  useEffect(() => {
    if (!didInit.current) return;
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // ─── Reset filter ─────────────────────────────────────────────────────────
  const handleReset = () => {
    const base = { ...EMPTY_FILTERS };
    if (adminMe?.role !== "SUPER_ADMIN") base.layanan_id = adminMe?.layanan_id;
    setFilters(base);
  };

  // ─── Export Excel ─────────────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      const resp = await adminApi.penilaianExport(filters);
      const data = resp.data || [];

      if (data.length === 0) {
        toast("Tidak ada data untuk diexport", { icon: "⚠️" });
        return;
      }

      const ws = XLSX.utils.json_to_sheet(data);

      // Auto lebar kolom berdasarkan panjang isi
      const colWidths = Object.keys(data[0] || {}).map(key => ({
        wch: Math.max(key.length, ...data.map(r => String(r[key] ?? "").length)) + 2,
      }));
      ws["!cols"] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Penilaian");

      const today = new Date().toISOString().split("T")[0];
      XLSX.writeFile(wb, `laporan-penilaian-${today}.xlsx`);

      toast.success(`${data.length} data berhasil diexport`);
    } catch (e) {
      toast.error("Gagal export data");
    } finally {
      setExporting(false);
    }
  };

  // ─── Detail modal ─────────────────────────────────────────────────────────
  const openDetail = async (id) => {
    try {
      const resp = await adminApi.penilaianDetail(id);
      setDetailData(resp.data);
      setIsDetailOpen(true);
    } catch {
      toast.error("Gagal memuat detail");
    }
  };

  // ─── Kolom tabel ──────────────────────────────────────────────────────────
  const columns = useMemo(() => [
    {
      key: "penilaian_no",
      title: "No. Penilaian",
      render: (r) => (
        <div className="font-mono font-medium text-slate-700 whitespace-nowrap">
          {r.penilaian_no}
        </div>
      ),
    },
    {
      key: "tanggal",
      title: "Tanggal",
      render: (r) => (
        <div className="text-sm text-slate-600 whitespace-nowrap">
          {formatDateID(r.tanggal_penilaian)}
        </div>
      ),
    },
    {
      key: "pasien",
      title: "Pasien",
      render: (r) => (
        <div>
          <div className="font-semibold text-slate-900">{r.nama_pasien}</div>
          <div className="text-xs text-slate-500">MR: {r.no_mr}</div>
        </div>
      ),
    },
    {
      key: "petugas",
      title: "Petugas",
      render: (r) => (
        <div>
          <div className="font-semibold text-slate-900">{r.nama_petugas || "-"}</div>
          <div className="text-xs text-slate-500">{r.nip || "-"}</div>
        </div>
      ),
    },
    {
      key: "rating",
      title: "Rating",
      render: (r) => (
        <div className="font-bold text-blue-600 whitespace-nowrap">
          {formatRating(r.rating_average)}
        </div>
      ),
    },
    {
      key: "status_penilaian",
      title: "Status",
      render: (r) => {
        const variant = r.status_penilaian === "submitted" ? "green" : "blue";
        return <Badge variant={variant}>{r.status_penilaian?.toUpperCase()}</Badge>;
      },
    },
    {
      key: "saran",
      title: "Saran",
      render: (r) => (
        <div
          className="text-slate-500 text-xs italic max-w-[160px] truncate"
          title={r.saran}
        >
          {r.saran || "-"}
        </div>
      ),
    },
    {
      key: "aksi",
      title: "",
      render: (r) => (
        <button
          onClick={() => openDetail(r.penilaian_id)}
          className="p-2 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  const hasActiveFilter =
    filters.q || filters.status_penilaian || filters.date_from || filters.date_to;

  return (
    <AdminShell title="Monitoring Penilaian">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

        {/* ── Filter Card ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4 hover:shadow-md transition-shadow duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">

            {/* Search */}
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Cari
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  className="input pl-9"
                  placeholder="Nama pasien, No. MR, No. Penilaian..."
                  value={filters.q}
                  onChange={e => setFilters({ ...filters, q: e.target.value })}
                  onKeyDown={e => e.key === "Enter" && load(1)}
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Status
              </label>
              <select
                className="input"
                value={filters.status_penilaian}
                onChange={e => setFilters({ ...filters, status_penilaian: e.target.value })}
              >
                {STATUS_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Dari Tanggal */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Dari Tanggal
              </label>
              <input
                type="date"
                className="input"
                value={filters.date_from}
                onChange={e => setFilters({ ...filters, date_from: e.target.value })}
              />
            </div>

            {/* Sampai Tanggal */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Sampai Tanggal
              </label>
              <input
                type="date"
                className="input"
                value={filters.date_to}
                onChange={e => setFilters({ ...filters, date_to: e.target.value })}
              />
            </div>
          </div>

          {/* Action row */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="text-sm text-slate-500">
              <span className="font-semibold text-slate-700">{pagination.total ?? 0}</span> data ditemukan
            </div>
            <div className="flex items-center gap-2">
              {hasActiveFilter && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X size={14} /> Reset
                </button>
              )}
              <button
                className="btn btn-ghost"
                onClick={() => load(1)}
                title="Refresh"
              >
                <RefreshCw size={16} />
              </button>
              <button
                className="btn btn-primary"
                onClick={() => load(1)}
              >
                <Search size={16} /> Cari
              </button>
              <button
                className="btn btn-secondary flex items-center gap-2"
                onClick={handleExport}
                disabled={exporting}
              >
                <Download size={16} />
                {exporting ? "Mengexport..." : "Export Excel"}
              </button>
            </div>
          </div>
        </div>

        {/* ── Tab Layanan — hanya Super Admin ── */}
        {adminMe?.role === "SUPER_ADMIN" && (
          <div className="bg-slate-100 rounded-2xl p-1.5 border border-slate-200/60 overflow-x-auto">
            <div className="flex gap-0.5 min-w-max">
              {[
                { value: undefined, label: "Semua Layanan" },
                ...layananList.map(l => ({ value: l.layanan_id, label: l.layanan_name })),
              ].map(tab => {
                const isActive = tab.value === undefined
                  ? !filters.layanan_id
                  : String(filters.layanan_id) === String(tab.value);
                return (
                  <button
                    key={tab.value ?? "all"}
                    onClick={() => setFilters({ ...filters, layanan_id: tab.value })}
                    className={`relative px-5 py-2.5 text-sm font-semibold whitespace-nowrap rounded-xl transition-colors duration-150 ${isActive ? "text-primary-700" : "text-slate-500 hover:text-slate-700"
                      }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-pill"
                        className="absolute inset-0 bg-white rounded-xl"
                        style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.08), 0 0 0 1px rgba(47,160,132,0.2)" }}
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Tabel ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                {columns.map(c => (
                  <th key={c.key} className="px-4 py-3 font-semibold text-left whitespace-nowrap">
                    {c.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin" />
                      <span className="text-sm">Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-16 text-center text-slate-400 text-sm">
                    Tidak ada data ditemukan
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={i} className="hover:bg-primary-50/50 transition-colors">
                    {columns.map(c => (
                      <td key={c.key} className="px-4 py-3">
                        {c.render(row)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <PenilaianDetailModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          data={detailData}
        />

        {/* Pagination manual menggunakan total dari backend */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Halaman {pagination.page} dari {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                className="btn btn-ghost text-sm"
                disabled={pagination.page <= 1}
                onClick={() => load(pagination.page - 1)}
              >
                ← Sebelumnya
              </button>
              <button
                className="btn btn-ghost text-sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => load(pagination.page + 1)}
              >
                Berikutnya →
              </button>
            </div>
          </div>
        )}

      </motion.div>
    </AdminShell>
  );
}
