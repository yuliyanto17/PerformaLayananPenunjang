import axios from "axios";

const adminAxios = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
});

adminAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

adminAxios.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err?.response?.data?.message || err.message || "Error";
    return Promise.reject(new Error(msg));
  }
);

export default adminAxios;