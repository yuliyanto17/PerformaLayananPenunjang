import React, { useEffect, useMemo, useState } from "react";
import { adminApi } from "../api/adminApi";
import { formatNumber, formatPercent, formatRating } from "../utils/format";
import { TrendingUp, Users, ClipboardList, Star, RefreshCw } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const StatCard = ({ title, value, sub, icon: Icon }) => (
  <div className="card p-5 group hover:-translate-y-1 hover:shadow-md transition-all duration-300">
    <div className="flex items-center justify-between">
      <div>
        <div className="text-xs font-semibold text-slate-500">{title}</div>
        <div className="text-2xl font-extrabold text-slate-900 mt-1">{value}</div>
        {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
      </div>
      <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center transition-colors group-hover:bg-primary-100">
        <Icon className="w-6 h-6 text-primary-600" />
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);

      const [sumRes, trendRes] = await Promise.all([
        adminApi.dashboardSummary(),        // GET /admin/dashboard/summary
        adminApi.dashboardTrend({ days: 30 }) // GET /admin/dashboard/trend?days=30
      ]);

      setSummary(sumRes.data);
      setTrend(trendRes.data || []);
    } catch (e) {
      setError(e.message || "Gagal memuat dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const chartData = useMemo(() => {
    return (trend || []).map((x) => ({
      tanggal: new Date(x.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
      total: x.total_penilaian,
      rating: x.avg_rating ? Number(x.avg_rating).toFixed(2) : 0,
      persen: x.avg_percentage ? Number(x.avg_percentage).toFixed(2) : 0,
    }));
  }, [trend]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-extrabold text-slate-900">Dashboard</div>
          <div className="text-sm text-slate-600">Ringkasan performa layanan (default 30 hari)</div>
        </div>

        <button className="btn btn-secondary" onClick={load} disabled={loading}>
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="card p-4 border-red-200 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Penilaian"
          value={summary ? formatNumber(summary.total_penilaian) : (loading ? "..." : "0")}
          sub="Submitted"
          icon={ClipboardList}
        />
        <StatCard
          title="Pasien Unik"
          value={summary ? formatNumber(summary.total_pasien_unik) : (loading ? "..." : "0")}
          sub="Berdasarkan No MR"
          icon={Users}
        />
        <StatCard
          title="Rating Rata-rata"
          value={summary ? formatRating(summary.avg_rating) : (loading ? "..." : "-")}
          sub="Normalisasi ke skala 5"
          icon={Star}
        />
        <StatCard
          title="Skor Rata-rata"
          value={summary ? formatPercent(summary.avg_percentage) : (loading ? "..." : "-")}
          sub="Persentase"
          icon={TrendingUp}
        />
      </div>

      {/* Breakdown kepuasan */}
      <div className="card p-6">
        <div className="text-lg font-bold text-slate-900">Breakdown Kepuasan</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
          {[
            ["Sangat Puas", summary?.sangat_puas, "bg-green-50 text-green-800 border-green-200"],
            ["Puas", summary?.puas, "bg-lime-50 text-lime-800 border-lime-200"],
            ["Cukup Puas", summary?.cukup_puas, "bg-yellow-50 text-yellow-800 border-yellow-200"],
            ["Tidak Puas", summary?.tidak_puas, "bg-orange-50 text-orange-800 border-orange-200"],
            ["Sangat Tidak Puas", summary?.sangat_tidak_puas, "bg-red-50 text-red-800 border-red-200"],
          ].map(([label, val, cls]) => (
            <div key={label} className={`rounded-2xl border p-4 ${cls}`}>
              <div className="text-xs font-semibold">{label}</div>
              <div className="text-2xl font-extrabold mt-1">{formatNumber(val || 0)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Trendline */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-slate-900">Trend Harian</div>
            <div className="text-sm text-slate-600">30 hari terakhir</div>
          </div>
        </div>

        <div className="h-[320px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tanggal" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#2FA084" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}