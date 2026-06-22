import React, { useEffect, useMemo, useState } from "react";
import AsyncSelect from "react-select/async";
import AdminShell from "../components/AdminShell";
import { adminApi } from "../api/adminApi";
import { todayISO } from "../utils/date";

const SHIFT_OPTIONS = [
  { value: "PAGI", label: "PAGI" },
  { value: "SIANG", label: "SIANG" },
  { value: "MALAM", label: "MALAM" },
];

export default function ShiftPage() {
  const [shiftDate, setShiftDate] = useState(todayISO());
  const [shiftName, setShiftName] = useState("PAGI");

  const [selectedPetugas, setSelectedPetugas] = useState([]); // react-select value
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const loadShiftStatus = async () => {
    try {
      setLoadingStatus(true);
      setError(null);
      setMessage(null);

      const resp = await adminApi.shiftStatus(shiftDate, shiftName);
      const ids = resp.data.selected_petugas_ids || [];
      const onDuty = resp.data.on_duty_petugas || [];

      // Preselect: buat option object untuk react-select
      const preselected = onDuty.map((p) => ({
        value: p.petugas_id,
        label: `${p.nama_petugas} — (${p.nip})`,
        raw: p,
      }));

      // kalau backend return hanya ids tanpa detail (harusnya ada detail), kita fallback:
      setSelectedPetugas(preselected);

      setMessage(
        ids.length > 0
          ? `Shift ${shiftName} ${shiftDate}: ${ids.length} petugas on duty`
          : `Shift ${shiftName} ${shiftDate}: belum diatur`
      );
    } catch (e) {
      setError(e.message || "Gagal load status shift");
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    loadShiftStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shiftDate, shiftName]);

  const loadOptions = async (inputValue) => {
    const q = (inputValue || "").trim();
    if (q.length < 2) return [];

    const resp = await adminApi.petugasSearch(q);
    const list = resp.data || [];

    return list.map((p) => ({
      value: p.petugas_id,
      label: `${p.nama_petugas} — ${p.jabatan || "-"} (${p.nip})`,
      raw: p,
    }));
  };

  const applyShift = async () => {
    try {
      setSaving(true);
      setError(null);
      setMessage(null);

      const petugas_ids = selectedPetugas.map((x) => x.value);

      const resp = await adminApi.shiftApply(shiftDate, shiftName, petugas_ids);

      setMessage(
        `Berhasil diterapkan: ${resp.data.on_duty_petugas.length} petugas on duty (${shiftName} - ${shiftDate})`
      );
    } catch (e) {
      setError(e.message || "Gagal menerapkan shift");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell title="Shift Manager">
      <div className="bg-white rounded-2xl shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Date */}
          <div>
            <label className="text-sm font-medium text-gray-700">Tanggal</label>
            <input
              type="date"
              value={shiftDate}
              onChange={(e) => setShiftDate(e.target.value)}
              className="w-full mt-2 px-4 py-3 border rounded-xl"
            />
          </div>

          {/* Shift */}
          <div>
            <label className="text-sm font-medium text-gray-700">Shift</label>
            <select
              value={shiftName}
              onChange={(e) => setShiftName(e.target.value)}
              className="w-full mt-2 px-4 py-3 border rounded-xl"
            >
              {SHIFT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Action */}
          <div className="flex items-end gap-3">
            <button
              onClick={loadShiftStatus}
              disabled={loadingStatus}
              className="px-4 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-sm font-semibold"
            >
              {loadingStatus ? "Loading..." : "Refresh Status"}
            </button>

            <button
              onClick={applyShift}
              disabled={saving}
              className="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
            >
              {saving ? "Menyimpan..." : "Terapkan Shift"}
            </button>
          </div>
        </div>

        {/* Select Petugas */}
        <div className="mt-6">
          <label className="text-sm font-medium text-gray-700">
            Petugas On Duty (Searchable, Multi-select)
          </label>
          <div className="mt-2">
            <AsyncSelect
              isMulti
              cacheOptions
              defaultOptions={false}
              loadOptions={loadOptions}
              value={selectedPetugas}
              onChange={(val) => setSelectedPetugas(val || [])}
              placeholder="Ketik minimal 2 karakter (nama/NIP)..."
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: "50px",
                  borderRadius: "14px",
                }),
              }}
            />
          </div>

          <p className="text-xs text-gray-500 mt-2">
            Catatan: Saat “Terapkan Shift”, petugas yang tidak dipilih otomatis OFF duty untuk layanan ini.
          </p>
        </div>

        {/* Message */}
        {(message || error) && (
          <div className="mt-6">
            {message && (
              <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-xl p-3">
                {message}
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-xl p-3 mt-3">
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminShell>
  );
}