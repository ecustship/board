import { apiRequest, buildApiPath, buildApiUrl } from "./client";
import { API_ENDPOINTS } from "./contracts";
import { clearAuthSession, getAuthToken } from "./authSession";

export const listUsers = (query) => apiRequest(API_ENDPOINTS.users, { query });
export const getUser = (userId) => apiRequest(buildApiPath(API_ENDPOINTS.user, { userId }));
export const createUser = (body) => apiRequest(API_ENDPOINTS.users, { method: "POST", body });
export const updateUser = (userId, body) =>
  apiRequest(buildApiPath(API_ENDPOINTS.user, { userId }), { method: "PATCH", body });
export const resetUserPassword = (userId, newPassword) =>
  apiRequest(buildApiPath(API_ENDPOINTS.resetUserPassword, { userId }), {
    method: "POST",
    body: { newPassword },
  });
export const unlockUser = (userId) =>
  apiRequest(buildApiPath(API_ENDPOINTS.unlockUser, { userId }), { method: "POST" });
export const deleteUser = (userId) =>
  apiRequest(buildApiPath(API_ENDPOINTS.user, { userId }), { method: "DELETE" });

export const listRoles = () => apiRequest(API_ENDPOINTS.roles);
export const createRole = (body) => apiRequest(API_ENDPOINTS.roles, { method: "POST", body });
export const updateRole = (roleCode, body) =>
  apiRequest(buildApiPath(API_ENDPOINTS.role, { roleCode }), { method: "PATCH", body });
export const deleteRole = (roleCode) =>
  apiRequest(buildApiPath(API_ENDPOINTS.role, { roleCode }), { method: "DELETE" });
export const listPermissions = () => apiRequest(API_ENDPOINTS.permissions);

export const changeOwnPassword = (body) =>
  apiRequest(API_ENDPOINTS.changePassword, { method: "POST", body });

export const listBackups = () => apiRequest(API_ENDPOINTS.backups);
export const createBackup = () => apiRequest(API_ENDPOINTS.backups, { method: "POST", body: {} });
export const restoreBackup = (backupId) =>
  apiRequest(buildApiPath(API_ENDPOINTS.backupRestore, { backupId }), {
    method: "POST",
    body: { confirmation: "RESTORE_ISOLATED_DATABASE" },
  });
export const downloadBackup = async (backupId) => {
  const response = await fetch(buildApiUrl(buildApiPath(API_ENDPOINTS.backupDownload, { backupId })), {
    headers: { Authorization: `Bearer ${getAuthToken()}`, Accept: "application/octet-stream" },
    cache: "no-store",
  });
  if (!response.ok) {
    if (response.status === 401) clearAuthSession("unauthorized");
    let message = "备份下载失败。";
    try {
      const payload = await response.json();
      message = payload?.message || message;
    } catch (error) {
      // Keep the local error when the download endpoint returns a non-JSON response.
    }
    const requestError = new Error(message);
    requestError.status = response.status;
    throw requestError;
  }
  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = `${backupId}.dump`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
};
