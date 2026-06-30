import { useEffect, useRef, useState } from "react";
import { apiRequest } from "./client";

export const useApiResource = (path, options = {}) => {
  const {
    enabled = true,
    intervalMs = 0,
    initialData = null,
    query,
    transform = (data) => data,
  } = options;
  const [data, setData] = useState(initialData);
  const [status, setStatus] = useState(enabled ? "loading" : "idle");
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!enabled || !path) {
      setStatus("idle");
      return undefined;
    }

    let mounted = true;

    const load = async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setStatus((prev) => (prev === "success" ? "refreshing" : "loading"));

      try {
        const envelope = await apiRequest(path, { query, signal: controller.signal });
        if (!mounted) return;
        setData(transform(envelope.data, envelope));
        setError(null);
        setStatus("success");
      } catch (err) {
        if (!mounted || err.name === "AbortError") return;
        setError(err);
        setStatus("error");
      }
    };

    load();
    const timer = intervalMs > 0 ? setInterval(load, intervalMs) : null;

    return () => {
      mounted = false;
      abortRef.current?.abort();
      if (timer) clearInterval(timer);
    };
  }, [enabled, path, intervalMs, query, transform]);

  return {
    data,
    status,
    error,
    loading: status === "loading",
    refreshing: status === "refreshing",
    online: status === "success" || status === "refreshing",
  };
};
