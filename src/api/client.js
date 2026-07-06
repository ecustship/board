import { API_VERSION, DEFAULT_API_CONTEXT, normalizeApiEnvelope } from "./contracts";
import { clearAuthSession, getAuthToken } from "./authSession";

const trimSlashes = (value) => String(value || "").replace(/^\/+|\/+$/g, "");
const isAbsoluteUrl = (value) => /^https?:\/\//i.test(String(value || ""));

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || `/api/${API_VERSION}`;

export const buildApiPath = (template, params = {}) => {
  const context = { ...DEFAULT_API_CONTEXT, ...params };
  return template.replace(/\{(\w+)\}/g, (_, key) => encodeURIComponent(context[key] ?? ""));
};

export const buildApiUrl = (path, query = {}) => {
  const cleanPath = trimSlashes(path);
  const url = isAbsoluteUrl(API_BASE_URL)
    ? new URL(`${API_BASE_URL.replace(/\/+$/g, "")}/${cleanPath}`)
    : new URL(`/${trimSlashes(API_BASE_URL)}/${cleanPath}`, window.location.origin);

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
};

export const apiRequest = async (path, options = {}) => {
  const { query, signal, headers, skipAuth = false, ...fetchOptions } = options;
  const body =
    fetchOptions.body && typeof fetchOptions.body !== "string"
      ? JSON.stringify(fetchOptions.body)
      : fetchOptions.body;
  const token = skipAuth ? "" : getAuthToken();
  const response = await fetch(buildApiUrl(path, query), {
    ...fetchOptions,
    body,
    signal,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  const envelope = normalizeApiEnvelope(payload);

  if (!response.ok || envelope.success === false) {
    if (response.status === 401) {
      clearAuthSession("unauthorized");
    }
    const error = new Error(envelope.message || `Request failed: ${response.status}`);
    error.status = response.status;
    error.payload = envelope;
    throw error;
  }

  return envelope;
};
