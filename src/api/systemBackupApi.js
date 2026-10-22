import { apiRequest, buildApiUrl } from "./client";
import { clearAuthSession, getAuthToken } from "./authSession";

const base = "system-backups";
export const listSystemBackups = () => apiRequest(base);
export const systemBackupStatus = () => apiRequest(`${base}/status`);
export const listSystemRecoveries = () => apiRequest(`${base}/recoveries`);
export const reconcileSystemRecovery = (operationId, restoreArea) => apiRequest(`${base}/recoveries/${encodeURIComponent(operationId)}/reconcile`, {
  method: "POST", body: { confirmation: "RECONCILE_ISOLATED_SYSTEM", restoreArea },
});
export const activateSystemRecovery = (operationId, restoreArea) => apiRequest(`${base}/recoveries/${encodeURIComponent(operationId)}/activate`, {
  method: "POST", body: { confirmation: "ACTIVATE_ISOLATED_SYSTEM", restoreArea },
});
export const stopSystemRecovery = (operationId, restoreArea) => apiRequest(`${base}/recoveries/${encodeURIComponent(operationId)}/stop`, {
  method: "POST", body: { confirmation: "STOP_ISOLATED_SYSTEM", restoreArea },
});
export const createSystemBackup = (scope, saveArea) => apiRequest(base, { method: "POST", body: { scope, saveArea } });
export const restoreSystemBackup = (id, restoreArea) => apiRequest(`${base}/${encodeURIComponent(id)}/restore`, {
  method: "POST", body: { confirmation: "RESTORE_ISOLATED_SYSTEM", restoreArea },
});
export const downloadSystemBackup = async (id) => {
  const response = await fetch(buildApiUrl(`${base}/${encodeURIComponent(id)}/download`), {
    headers: { Authorization: `Bearer ${getAuthToken()}`, Accept: "application/octet-stream" }, cache: "no-store",
  });
  if (!response.ok) {
    if (response.status === 401) clearAuthSession("unauthorized");
    throw new Error("完整系统备份导出失败，请刷新记录并核对权限及完整性。");
  }
  const objectUrl = window.URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = objectUrl; link.download = `${id}.age`;
  document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
};
