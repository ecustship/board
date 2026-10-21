import { apiRequest, buildApiUrl } from "./client";
import { AUTH_FORBIDDEN_EVENT, clearAuthSession, getAuthToken } from "./authSession";

export const listAudits = (query, signal) => apiRequest("/audit-logs", { query, signal, cache: "no-store" });
export const getAuditWriteStatus = (signal) => apiRequest("/audit-logs/status", { signal, cache: "no-store" });

export const downloadAudits = async (query) => {
  const response = await fetch(buildApiUrl("/audit-logs/export", query), {
    headers: { Authorization: `Bearer ${getAuthToken()}`, Accept: "text/csv" },
    cache: "no-store",
  });
  if (!response.ok) {
    if (response.status === 401) clearAuthSession("unauthorized");
    if (response.status === 403) window.dispatchEvent(new CustomEvent(AUTH_FORBIDDEN_EVENT));
    let message = "审计导出失败。";
    try { message = (await response.json())?.message || message; } catch (_) { /* Keep the download error. */ }
    throw new Error(message);
  }
  const url = window.URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  try {
    link.href = url;
    link.download = "audit-log.csv";
    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  }
};
