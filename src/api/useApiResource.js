import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiRequest } from "./client";

const defaultTransform = (data) => data;

export const useApiResource = (path, options = {}) => {
  const {
    enabled = true,
    intervalMs = 0,
    initialData = null,
    query,
    transform = defaultTransform,
  } = options;
  const [data, setData] = useState(initialData);
  const [status, setStatus] = useState(enabled ? "loading" : "idle");
  const [error, setError] = useState(null);
  const abortRef = useRef(null);
  const inFlightRef = useRef(false);
  const queryKey = JSON.stringify(query || {});
  const stableQuery = useMemo(() => JSON.parse(queryKey), [queryKey]);

  const load = useCallback(async ({ force = false } = {}) => {
    if (inFlightRef.current && !force) return;
    if (inFlightRef.current && force) {
      abortRef.current?.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;
    inFlightRef.current = true;
    setStatus((prev) => (prev === "success" ? "refreshing" : "loading"));

    try {
      const envelope = await apiRequest(path, { query: stableQuery, signal: controller.signal });
      setData(transform(envelope.data, envelope));
      setError(null);
      setStatus("success");
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err);
      setStatus("error");
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        inFlightRef.current = false;
      }
    }
  }, [path, stableQuery, transform]);

  const reload = useCallback(() => load({ force: true }), [load]);

  useEffect(() => {
    if (!enabled || !path) {
      abortRef.current?.abort();
      setStatus("idle");
      return undefined;
    }

    load();
    const timer = intervalMs > 0 ? setInterval(load, intervalMs) : null;

    return () => {
      abortRef.current?.abort();
      if (timer) clearInterval(timer);
    };
  }, [enabled, path, intervalMs, load]);

  return {
    data,
    status,
    error,
    reload,
    loading: status === "loading",
    refreshing: status === "refreshing",
    online: status === "success" || status === "refreshing",
  };
};
