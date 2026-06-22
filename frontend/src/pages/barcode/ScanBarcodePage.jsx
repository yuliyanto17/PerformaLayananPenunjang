import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Html5Qrcode } from "html5-qrcode";
import {
  Camera,
  QrCode,
  RefreshCw,
  XCircle,
  CheckCircle2,
  AlertCircle,
  UserCheck,
} from "lucide-react";
import { usePenilaianStore } from "../../store/usePenilaianStore";
import Select from 'react-select';
import toast from 'react-hot-toast';

const ScanBarcodePage = () => {
  const navigate = useNavigate();
  const { selectedLayanan, selectedPasien, setPetugas, sessionId } =
    usePenilaianStore();

  const apiUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

  const [scanning, setScanning] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState(null);

  const [petugasFound, setPetugasFound] = useState(null);

  const [cameras, setCameras] = useState([]);
  const [cameraIndex, setCameraIndex] = useState(0);

  // refs untuk kontrol scanner
  const qrRef = useRef(null); // Html5Qrcode instance
  const startingRef = useRef(false);
  const runningRef = useRef(false);
  const scanLockRef = useRef(false);

  const [manualToken, setManualToken] = useState("");
  const [petugasOptions, setPetugasOptions] = useState([]);

  // Redirect kalau data flow belum lengkap
  useEffect(() => {
    if (!selectedLayanan || !selectedPasien) navigate("/layanan");
  }, [selectedLayanan, selectedPasien, navigate]);

  // Cleanup saat keluar halaman
  useEffect(() => {
    return () => {
      stopInternal();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start/Stop scanner berdasarkan state scanning
  useEffect(() => {
    if (scanning) startInternal();
    else stopInternal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning, cameraIndex]);

  useEffect(() => {
    const fetchPetugas = async () => {
      if (!selectedLayanan) return;
      try {
        const resp = await axios.get(`${apiUrl}/petugas/filter`, {
          params: {
            layanan_id: selectedLayanan.layanan_id,
            layanan_code: selectedLayanan.layanan_code
          }
        });

        const options = resp.data.data.map(p => ({
          value: p, // kirim objek petugas
          label: `${p.nama_petugas} - ${p.jabatan}`
        }));
        setPetugasOptions(options);
      } catch (e) {
        toast.error("Gagal memuat daftar petugas");
      }
    };
    fetchPetugas();
  }, [selectedLayanan]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return String(dateString);
    }
  };

  const normalizeScannerError = (err) => {
    const name = err?.name;
    const message = typeof err?.message === "string" ? err.message : "";

    if (name === "NotAllowedError") {
      return "Akses kamera ditolak. Klik ikon kunci di address bar → Camera → Allow, lalu refresh.";
    }
    if (name === "NotFoundError") return "Kamera tidak ditemukan pada perangkat ini.";
    if (name === "NotReadableError") {
      return "Kamera sedang dipakai aplikasi lain (Zoom/Teams/Camera). Tutup aplikasi lain lalu coba lagi.";
    }
    if (name === "OverconstrainedError") {
      return "Kamera tidak mendukung konfigurasi. Coba ganti kamera.";
    }
    if (message) return message;
    return "Gagal memulai kamera/scanner.";
  };

  const getCameras = async () => {
    const devices = await Html5Qrcode.getCameras();
    if (!devices || devices.length === 0) {
      throw new Error("Tidak ada kamera yang terdeteksi pada perangkat ini.");
    }
    setCameras(devices);
    return devices;
  };

  const startInternal = async () => {
    if (startingRef.current || runningRef.current) return;

    try {
      startingRef.current = true;
      setError(null);

      // reset lock setiap mulai scanning baru
      scanLockRef.current = false;

      // tunggu DOM render <div id="qr-reader" />
      await new Promise((r) => setTimeout(r, 50));

      const el = document.getElementById("qr-reader");
      if (!el) {
        throw new Error("Element #qr-reader belum tersedia. Refresh halaman dan coba lagi.");
      }

      // siapkan instance scanner
      if (!qrRef.current) {
        qrRef.current = new Html5Qrcode("qr-reader");
      }

      // config WAJIB didefinisikan sebelum dipakai
      const config = {
        fps: 10,
        qrbox: { width: 260, height: 260 },
        aspectRatio: 1.0,
      };


      const onSuccess = async (decodedText) => {
        if (scanLockRef.current) return; // cegah multi-trigger
        scanLockRef.current = true;

        await stopInternal();
        await validateBarcode(decodedText);
      };

      const onFailure = () => {
        // sering terjadi ketika QR tidak terlihat, jadi biarkan kosong
      };

      // ✅ 1) Utamakan kamera belakang (mobile)
      try {
        await qrRef.current.start({ facingMode: "environment" }, config, onSuccess, onFailure);
        runningRef.current = true;
        return;
      } catch (e) {
        console.warn("Back camera (facingMode=environment) failed, fallback to cameraId:", e);
      }

      // ✅ 2) Fallback: ambil daftar kamera & pilih yang paling "back"
      const devices = cameras.length ? cameras : await getCameras();
      if (!devices || devices.length === 0) throw new Error("Tidak ada kamera yang terdeteksi.");

      const backCam =
        devices.find((d) => (d.label || "").toLowerCase().includes("back")) ||
        devices.find((d) => (d.label || "").toLowerCase().includes("rear")) ||
        devices.find((d) => (d.label || "").toLowerCase().includes("environment"));

      const selected =
        backCam ||
        devices[Math.min(cameraIndex ?? 0, devices.length - 1)] ||
        devices[0];

      const cameraId = selected?.id;
      if (!cameraId) throw new Error("cameraId tidak ditemukan (undefined).");

      await qrRef.current.start(cameraId, config, onSuccess, onFailure);
      runningRef.current = true;
    } catch (err) {
      console.error("❌ Start scanner error:", err);
      setError(normalizeScannerError(err));
      setScanning(false);
    } finally {
      startingRef.current = false;
    }
  };

  const stopInternal = async () => {
    try {
      if (qrRef.current && runningRef.current) {
        await qrRef.current.stop();
        await qrRef.current.clear();
      }
    } catch {
      // ignore
    } finally {
      runningRef.current = false;
    }
  };

  const validateBarcode = async (raw) => {
    try {
      setValidating(true);
      setError(null);

      let barcodeToken = String(raw).trim();

      // QR bisa berupa JSON { token: "..." }
      try {
        const parsed = JSON.parse(barcodeToken);
        barcodeToken = parsed.token || parsed.barcode_token || barcodeToken;
      } catch {
        // bukan JSON
      }

      const resp = await axios.post(`${apiUrl}/barcode/validate`, {
        barcode_token: barcodeToken,
        layanan_id: selectedLayanan?.layanan_id,
        session_id: sessionId,
        device_type: "desktop",
      });

      if (!resp.data?.success) {
        throw new Error(resp.data?.message || "Barcode tidak valid.");
      }

      setPetugasFound(resp.data.data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Barcode tidak valid.");
    } finally {
      setValidating(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    const token = manualToken.trim();
    if (!token) return;

    // stop kamera dulu (biar tidak double trigger scan)
    try {
      await stopInternal?.();
    } catch { }

    await validateBarcode(token);
  };

  const handleSwitchCamera = async () => {
    try {
      const devices = cameras.length ? cameras : await getCameras();
      if (devices.length <= 1) return;

      // stop dulu, lalu ganti index → effect akan start lagi
      await stopInternal();
      runningRef.current = false;
      setCameraIndex((prev) => (prev + 1) % devices.length);
      setScanning(true);
    } catch (err) {
      setError(normalizeScannerError(err));
    }
  };

  const handleConfirmPetugas = () => {
    setPetugas(petugasFound);
    navigate("/penilaian");
  };

  const handleRescan = () => {
    scanLockRef.current = false;
    setPetugasFound(null);
    setError(null);
    setScanning(false);
  };

  const cameraLabel =
    cameras.find((c, idx) => idx === cameraIndex)?.label || "Default Camera";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Scan Barcode Petugas</h1>
            <p className="text-sm text-gray-600">
              {selectedLayanan?.layanan_name} • {selectedPasien?.Nama_Pasien}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Detail Pasien + Kunjungan */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Detail Pasien / Kunjungan
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-gray-600">Nama</span>
              <span className="font-semibold text-gray-900 text-right">
                {selectedPasien?.Nama_Pasien || "-"}
              </span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-gray-600">Jenis Kelamin</span>
              <span className="font-semibold text-gray-900 text-right">
                {selectedPasien?.Jenis_Kelamin === "L"
                  ? "Laki-laki"
                  : selectedPasien?.Jenis_Kelamin === "P"
                    ? "Perempuan"
                    : "-"}
              </span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-gray-600">No. MR</span>
              <span className="font-semibold text-gray-900 text-right">
                {selectedPasien?.No_MR || "-"}
              </span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-gray-600">No. Registrasi</span>
              <span className="font-semibold text-gray-900 text-right">
                {selectedPasien?.No_Reg || "-"}
              </span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-gray-600">Tanggal Masuk</span>
              <span className="font-semibold text-gray-900 text-right">
                {formatDate(selectedPasien?.Tgl_Masuk)}
              </span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-gray-600">Medis</span>
              <span className="font-semibold text-gray-900 text-right">
                {selectedPasien?.Medis || "-"}
              </span>
            </div>

            <div className="flex justify-between gap-3 sm:col-span-2">
              <span className="text-gray-600">Penjamin</span>
              <span className="font-semibold text-gray-900 text-right">
                {selectedPasien?.NamaRekanan || "-"}
              </span>
            </div>
          </div>
        </div>

        {/* Scanner / Result */}
        {!petugasFound ? (
          <div className="bg-white rounded-xl shadow-md p-6">
            {!scanning ? (
              <div className="py-4 space-y-6">
                {/* Icon + instruksi */}
                <div className="text-center space-y-3">
                  <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                    <QrCode className="w-10 h-10 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Arahkan Kamera ke QR Code
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      QR Code ditampilkan di tablet/komputer petugas yang berjaga.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center mt-2">
                    <button
                      onClick={() => setScanning(true)}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary-600 text-white font-semibold rounded-xl shadow-md hover:bg-primary-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                      disabled={validating}
                    >
                      <Camera className="w-5 h-5" />
                      Mulai Scan
                    </button>
                    <button
                      onClick={handleSwitchCamera}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-gray-700 font-semibold border-2 border-gray-200 rounded-xl shadow-sm hover:border-gray-300 hover:bg-gray-50 hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                      disabled={validating}
                      title="Jika perangkat punya lebih dari 1 kamera"
                    >
                      <RefreshCw className="w-5 h-5 text-gray-500" />
                      Ganti Kamera
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-gray-200" />
                  <span className="text-xs text-gray-400 font-medium">atau pilih manual</span>
                  <div className="flex-1 border-t border-gray-200" />
                </div>

                {/* Pilih Petugas dari dropdown */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-primary-600" />
                    Pilih Petugas
                  </label>
                  <Select
                    options={petugasOptions}
                    placeholder="Ketik atau pilih nama petugas..."
                    isClearable
                    isSearchable
                    noOptionsMessage={() => "Tidak ada petugas ditemukan"}
                    onChange={(selected) => {
                      if (selected) {
                        setPetugasFound(selected.value);
                      }
                    }}
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderRadius: '12px',
                        padding: '4px',
                        borderColor: '#e2e8f0',
                        boxShadow: 'none',
                        '&:hover': { borderColor: '#94a3b8' },
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isSelected
                          ? '#4f46e5'
                          : state.isFocused
                            ? '#eef2ff'
                            : 'white',
                        color: state.isSelected ? 'white' : '#1e293b',
                      }),
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1.5">
                    Hanya menampilkan petugas yang sedang bertugas untuk layanan ini.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex gap-3">
                      <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-red-900">Error</p>
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg overflow-hidden border-4 border-primary-500">
                  <div id="qr-reader" />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4">
                  <button onClick={handleSwitchCamera} className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-gray-700 font-semibold border-2 border-gray-200 rounded-xl shadow-sm hover:border-gray-300 hover:bg-gray-50 hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200 active:scale-95">
                    <RefreshCw className="w-5 h-5 text-gray-500" />
                    Ganti Kamera
                  </button>
                  <button onClick={() => setScanning(false)} className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gray-100 text-gray-700 font-semibold border-2 border-transparent rounded-xl hover:bg-gray-200 hover:shadow-sm transform hover:-translate-y-0.5 transition-all duration-200 active:scale-95">
                    Batal
                  </button>
                </div>

                <p className="text-xs text-gray-600 text-center">
                  Kamera aktif: {cameraLabel}
                </p>

                {validating && (
                  <p className="text-center text-sm text-gray-600">
                    Memvalidasi barcode...
                  </p>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex gap-3">
                      <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-red-900">Error</p>
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mt-3">
                Petugas Terdeteksi
              </h3>
              <p className="text-sm text-gray-600">
                Pastikan petugas yang terdeteksi sesuai
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Nama Petugas</span>
                <span className="font-semibold">{petugasFound.nama_petugas}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">NIP</span>
                <span className="font-semibold">{petugasFound.nip}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Jabatan</span>
                <span className="font-semibold">{petugasFound.jabatan || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Layanan</span>
                <span className="font-semibold">{petugasFound.layanan_name}</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button onClick={handleRescan} className="btn btn-secondary">
                Scan Ulang
              </button>
              <button onClick={handleConfirmPetugas} className="btn btn-primary">
                Ya, Benar
              </button>
            </div>
          </div>
        )}

        {/* Tips Scan */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-2">Tips Scan yang Bagus</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Pastikan QR code tampil jelas di layar petugas</li>
                <li>Jarak ideal 10–30 cm</li>
                <li>Jika blur, tunggu fokus kamera atau mundurkan sedikit</li>
                <li>Kalau perangkat punya 2 kamera, coba tombol “Ganti Kamera”</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ScanBarcodePage;