import axios from "axios";
import { resolveApiBaseUrl } from "./utils/apiBase";
import { ASSISTANT_CLIENT_TIMEOUT_MS } from "../../shared/assistantConfig.mjs";
import { getAssistantVisitorId } from "../../shared/assistantVisitor.mjs";

const baseURL = resolveApiBaseUrl();

const api = axios.create({
  baseURL,
  timeout: 120_000,
});

// Assistant requests can include model reasoning and speech transcription.
// Keep its longer deadline isolated from ordinary vendor-portal requests.
export const assistantApi = axios.create({
  baseURL,
  timeout: ASSISTANT_CLIENT_TIMEOUT_MS,
});

const attachVendorToken = (config) => {
  const token = localStorage.getItem("token");
  config.headers = config.headers || {};
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config === undefined) return config;
  if (config.url?.includes("/api/assistant/")) {
    config.headers["X-Elevoni-Visitor-ID"] = getAssistantVisitorId();
  }
  return config;
};

api.interceptors.request.use(attachVendorToken);
assistantApi.interceptors.request.use(attachVendorToken);

export default api;
