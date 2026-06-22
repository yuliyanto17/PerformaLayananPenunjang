import React, { useState } from "react";
import { adminApi } from "../api/adminApi";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("admin_rad");
  const [password, setPassword] = useState("Admin123!");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const resp = await adminApi.login(username, password);
      localStorage.setItem("admin_token", resp.data.token);
      toast.success("Login berhasil");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950">
      {/* background gradient blobs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/30 blur-3xl rounded-full" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-cyan-500/20 blur-3xl rounded-full" />

      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-md"
        >
          <div className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl border border-white/20 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900">Admin Login</h1>
                <p className="text-sm text-slate-600">
                  Masuk untuk mengatur shift & kiosk QR
                </p>
              </div>
            </div>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">Username</label>
                <input
                  className="input mt-2"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin_rad"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <input
                  type="password"
                  className="input mt-2"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <button
                disabled={loading}
                className="btn btn-primary w-full py-3 rounded-2xl"
              >
                {loading ? "Login..." : "Login"}
              </button>

              <div className="text-xs text-slate-500 text-center">
                Akses terbatas untuk admin layanan.
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}