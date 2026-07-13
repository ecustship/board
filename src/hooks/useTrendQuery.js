import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "../api/client";
import { API_ENDPOINTS } from "../api/contracts";

const MAX_WINDOW_MS = 90 * 24 * 60 * 60 * 1000;

const splitTimeRange = (startTime, endTime) => {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return [];
  const windows = [];
  let cursor = start;
  while (cursor <= end) {
    const windowEnd = Math.min(cursor + MAX_WINDOW_MS, end);
    windows.push({ startTime: new Date(cursor).toISOString(), endTime: new Date(windowEnd).toISOString() });
    cursor = windowEnd + 1;
  }
  return windows;
};

const mergeSeries = (responses) => {
  const byTag = new Map();
  responses.forEach((response) => {
    (response?.data?.series || []).forEach((series) => {
      if (!byTag.has(series.tagCode)) {
        byTag.set(series.tagCode, { ...series, pointsByTime: new Map() });
      }
      const target = byTag.get(series.tagCode);
      (series.points || []).forEach((point) => target.pointsByTime.set(point.timestamp, point));
    });
  });
  return Array.from(byTag.values()).map(({ pointsByTime, ...series }) => ({
    ...series,
    points: Array.from(pointsByTime.values()).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
  }));
};

export const useTrendTags = (engineCode) => {
  const [state, setState] = useState({ data: [], status: "loading", error: "" });
  const load = useCallback(async () => {
    setState((current) => ({ ...current, status: "loading", error: "" }));
    try {
      const envelope = await apiRequest(API_ENDPOINTS.trendTags, { query: { engineCode } });
      setState({ data: envelope.data || [], status: "success", error: "" });
    } catch (error) {
      setState({ data: [], status: "error", error: error.message });
    }
  }, [engineCode]);
  useEffect(() => { load(); }, [load]);
  return { ...state, reload: load };
};

export const useTrendSeries = ({ engineCode, tagCodes, startTime, endTime, interval = "1m" }) => {
  const [state, setState] = useState({ data: [], status: "idle", error: "" });
  const requestId = useRef(0);

  const load = useCallback(async () => {
    if (!engineCode || !tagCodes.length || !startTime || !endTime) {
      setState({ data: [], status: "idle", error: "" });
      return;
    }
    const windows = splitTimeRange(startTime, endTime);
    if (!windows.length) {
      setState({ data: [], status: "error", error: "日期范围无效" });
      return;
    }
    const currentRequest = ++requestId.current;
    setState((current) => ({ ...current, status: "loading", error: "" }));
    try {
      const responses = await Promise.all(
        windows.map((window) => apiRequest(API_ENDPOINTS.trendQuery, {
          method: "POST",
          body: { engineCode, tagCodes, ...window, interval },
        }))
      );
      if (requestId.current !== currentRequest) return;
      setState({ data: mergeSeries(responses), status: "success", error: "" });
    } catch (error) {
      if (requestId.current !== currentRequest) return;
      setState({ data: [], status: "error", error: error.message });
    }
  }, [endTime, engineCode, interval, startTime, tagCodes]);

  useEffect(() => {
    const timer = setTimeout(load, 200);
    return () => clearTimeout(timer);
  }, [load]);

  return { ...state, reload: load };
};

export { splitTimeRange };
