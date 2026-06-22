import React, { useEffect, useMemo, useRef, useState } from "react";
import AdminShell from "../components/AdminShell";
import { adminApi } from "../api/adminApi";
import QRCode from "qrcode";
import { Maximize2, RefreshCw } from "lucide-react";

export default function KioskPage() {
  const [loading, setLoading] = useState(false);
  const [petugas, setPetugas] = useState([]);
  const [error, setError] = useState(null);

  // cache QR base64 agar tidak generate ulang tiap refresh (token static)
  const qrCacheRef = useRef(new Map()); // key=barcode_token, value=dataUrl

  const load = async () => {
    try {
      setLoading(true);
      setError(null);

      const resp = await adminApi.kioskOnDuty();
      const list = resp.data || [];

      // generate QR hanya untuk token yang belum ada di cache
      for (const p of list) {
        if (!p.barcode_token) continue;
        if (!qrCacheRef.current.has(p.barcode_token)) {
          const dataUrl = await QRCode.toDataURL(p.barcode_token, {
            width: 320,
            margin: 1,
            errorCorrectionLevel: "M",
          });
          qrCacheRef.current.set(p.barcode_token, dataUrl);
        }
      }

      setPetugas(list);
    } catch (e) {
      setError(e.message || "Gagal memuat data on duty");
    } finally {
      setLoading(false);
    }
  };

  // load pertama + interval 30 detik
  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // ignore
    }
  };

  return (
    <AdminShell title="Kiosk QR (On Duty)">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600">
          Refresh otomatis setiap <b>30 detik</b>. Menampilkan hanya petugas <b>On Duty</b>.
        </div>

        <div className="flex gap-2">
          <button
            onClick={load}
            className="px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-sm font-medium inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>

          <button
            onClick={enterFullscreen}
            className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium inline-flex items-center gap-2"
          >
            <Maximize2 className="w-4 h-4" />
            Fullscreen
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-xl p-3 mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow p-6">
        {loading && <div className="text-sm text-gray-600 mb-4">Loading...</div>}

        {petugas.length === 0 ? (
          <div className="text-center py-16 text-gray-600">
            Tidak ada petugas on duty. Atur dulu di menu <b>Shift</b>.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {petugas.map((p) => {
              const qr = p.barcode_token ? qrCacheRef.current.get(p.barcode_token) : null;

              return (
                <div
                  key={p.petugas_id}
                  className="border rounded-2xl p-4 flex flex-col items-center bg-gray-50"
                >
                  <div className="bg-white rounded-xl p-3 shadow">
                    {qr ? (
                      <img src={qr} alt={`QR-${p.nama_petugas}`} className="w-64 h-64" />
                    ) : (
                      <div className="w-64 h-64 flex items-center justify-center text-gray-500">
                        No QR
                      </div>
                    )}
                  </div>

                  <div className="mt-4 text-center">
                    <div className="font-bold text-gray-900">{p.nama_petugas}</div>
                    <div className="text-xs text-gray-600">{p.jabatan || "-"}</div>
                    <div className="text-xs text-gray-500 mt-1">{p.nip}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminShell>
  );
}