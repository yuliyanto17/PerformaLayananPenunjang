import adminAxios from "./adminAxios";

export const adminApi = {
  login: (username, password) =>
    adminAxios.post("/admin/auth/login", { username, password }),

  me: () => adminAxios.get("/admin/auth/me"),

  layananList: () => adminAxios.get("/layanan"),

  petugasSearch: (q) =>
    adminAxios.get("/admin/petugas/search", { params: { q, limit: 20 } }),

  shiftStatus: (shift_date, shift_name, layanan_id) =>
    adminAxios.get("/admin/shift/status", { params: { shift_date, shift_name, layanan_id } }),

  shiftApply: (shift_date, shift_name, petugas_ids, layanan_id) =>
    adminAxios.post("/admin/shift/apply", { shift_date, shift_name, petugas_ids, layanan_id }),

  kioskOnDuty: () => adminAxios.get("/admin/kiosk/on-duty"),

  penilaianList: (params) => adminAxios.get("/admin/penilaian", { params }),
  penilaianExport: (params) => adminAxios.get("/admin/penilaian/export", { params }),

  dashboardSummary: (params) => adminAxios.get("/admin/dashboard/summary", { params }),
  dashboardTrend: (params) => adminAxios.get("/admin/dashboard/trend", { params }),

  petugasList: (params) => adminAxios.get("/admin/petugas", { params }),

  toggleDuty: (petugas_id, status) =>
    adminAxios.patch(`/admin/petugas/${petugas_id}/toggle-duty`, { status }),

  shiftEndAll: () => adminAxios.post("/admin/shift/end-all"),

  penilaianDetail: (id) => adminAxios.get(`/admin/penilaian/${id}`),

};