import { API_VERSION, DEFAULT_API_CONTEXT, normalizeApiEnvelope } from "./contracts";

const trimSlashes = (value) => String(value || "").replace(/^\/+|\/+$/g, "");

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || `/api/${API_VERSION}`;

export const buildApiPath = (template, params = {}) => {
  const context = { ...DEFAULT_API_CONTEXT, ...params };
  return template.replace(/\{(\w+)\}/g, (_, key) => encodeURIComponent(context[key] ?? ""));
};

export const buildApiUrl = (path, query = {}) => {
  const base = trimSlashes(API_BASE_URL);
  const url = new URL(`${base ? `/${base}` : ""}/${trimSlashes(path)}`, window.location.origin);

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
};

export const apiRequest = async (path, options = {}) => {
  const { query, signal, headers, ...fetchOptions } = options;
  const response = await fetch(buildApiUrl(path, query), {
    ...fetchOptions,
    signal,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...headers,
    },
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  const envelope = normalizeApiEnvelope(payload);

  if (!response.ok || envelope.success === false) {
    const error = new Error(envelope.message || `Request failed: ${response.status}`);
    error.status = response.status;
    error.payload = envelope;
    throw error;
  }

  return envelope;
};
