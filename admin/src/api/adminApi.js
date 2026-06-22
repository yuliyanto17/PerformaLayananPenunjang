import adminAxios from "./adminAxios";

export const adminApi = {
  login: (username, password) =>
    adminAxios.post("/admin/auth/login", { username, password }),

  me: () => adminAxios.get("/admin/auth/me"),

  petugasSearch: (q) =>
    adminAxios.get("/admin/petugas/search", { params: { q, limit: 20 } }),

  shiftStatus: (shift_date, shift_name) =>
    adminAxios.get("/admin/shift/status", { params: { shift_date, shift_name } }),

  shiftApply: (shift_date, shift_name, petugas_ids) =>
    adminAxios.post("/admin/shift/apply", { shift_date, shift_name, petugas_ids }),

  kioskOnDuty: () => adminAxios.get("/admin/kiosk/on-duty"),

  penilaianList: (params) => adminAxios.get("/admin/penilaian", { params }),

  dashboardSummary: (params) => adminAxios.get("/admin/dashboard/summary", { params }),
  dashboardTrend: (params) => adminAxios.get("/admin/dashboard/trend", { params }),
};