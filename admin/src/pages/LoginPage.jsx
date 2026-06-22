import React, { useState } from "react";
import { adminApi } from "../api/adminApi";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("admin_rad");
  const [password, setPassword] = useState("Admin123!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const resp = await adminApi.login(username, password);
      const token = resp.data.token;

      localStorage.setItem("admin_token", token);
      navigate("/shift");
    } catch (err) {
      setError(err.message || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
        <h1 className="text-2xl font-bold text-gray-900">Login Admin</h1>
        <p className="text-sm text-gray-600 mt-1">
          Masuk untuk mengatur petugas shift dan menampilkan QR.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Username</label>
            <input
              className="w-full mt-2 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin_rad"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              className="w-full mt-2 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">
              {error}
            </div>
          )}

          <button
            disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50"
          >
            {loading ? "Login..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}