import axios from "axios";
import { resolveApiBaseUrl } from "./utils/apiBase";
import { NATLAS_CLIENT_TIMEOUT_MS } from "../../shared/natlasConfig.mjs";

const baseURL = resolveApiBaseUrl();

const api = axios.create({
  baseURL,
  timeout: 120_000,
});

// N-ATLaS can legitimately take longer during a private GPU cold start.
// Keep its longer deadline isolated from ordinary vendor-portal requests.
export const natlasApi = axios.create({
  baseURL,
  timeout: NATLAS_CLIENT_TIMEOUT_MS,
});

const attachVendorToken = (config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

api.interceptors.request.use(attachVendorToken);
natlasApi.interceptors.request.use(attachVendorToken);

export default api;
