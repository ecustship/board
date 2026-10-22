import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest, buildApiPath } from "./client";
import { API_ENDPOINTS } from "./contracts";

const ENGINE_CODES = ["CMMS01", "CMMS02", "CMMS03", "CMMS04"];
const browserHost = typeof window === "undefined" ? "127.0.0.1" : window.location.hostname;
const browserProtocol = typeof window === "undefined" ? "http:" : window.location.protocol;
export const COLLECTOR_API_BASE_URL = (
  process.env.REACT_APP_COLLECTOR_API_BASE_URL || `${browserProtocol}//${browserHost}:8085`
).replace(/\/+$/, "");

const collectorRequest = async (path) => {
  const response = await fetch(`${COLLECTOR_API_BASE_URL}${path}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`采集端 ${path} 返回 HTTP ${response.status}`);
  return response.json();
};

const valueText = (value) => {
  if (value === null || value === undefined || value === "") return "--";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(4)));
  }
  return String(value);
};

const displayValue = (value, unit) => {
  const text = valueText(value);
  return text === "--" || !unit ? text : `${text} ${unit}`;
};

const pageBindingFor = (tagCode = "") => {
  if (/ALARM|SHUTDOWN|EMERGENCY_STOP/.test(tagCode)) return "Alarm / Engine System";
  if (/EXHAUST_TEMP_CYLINDER/.test(tagCode)) return "Engine System / Trend";
  if (/ENGINE_SPEED|LUBE_OIL_PRESS|COOLANT_TEMPERATURE/.test(tagCode)) {
    return "Main Engine / Engine System / Trend";
  }
  return "Engine System / Trend";
};

const rowId = (pointCode, index) =>
  `${pointCode || `point-${index}`}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export const buildPointMappingRows = ({
  runtimePoints = [],
  collectorPoints = [],
  tags = [],
  realtimePoints = [],
  contractPointCodes = [],
}) => {
  const tagBySource = new Map(tags.map((tag) => [String(tag.sourceTag || "").trim(), tag]));
  const tagByCode = new Map(tags.map((tag) => [String(tag.tagCode || "").trim(), tag]));
  const collectorBySource = new Map(collectorPoints.map((point) => [String(point.pointCode || "").trim(), point]));
  const realtimeByTag = new Map(realtimePoints.map((point) => [String(point.tagCode || "").trim(), point]));
  const contractSet = new Set(contractPointCodes.map((code) => String(code).trim()));

  return runtimePoints.map((runtimePoint, index) => {
    const sourceTag = String(runtimePoint.pointCode || "").trim();
    const tag = tagBySource.get(sourceTag) || tagByCode.get(sourceTag);
    const collectorPoint = collectorBySource.get(sourceTag);
    const backendPoint = tag ? realtimeByTag.get(tag.tagCode) : undefined;
    const collectorValue = collectorPoint?.value;
    const backendValue = backendPoint?.value;
    const collectorQuality = collectorPoint?.quality || "MISSING";
    const backendQuality = backendPoint?.quality || "MISSING";
    const mapped = Boolean(tag);
    const collectorLive = collectorValue !== undefined && collectorValue !== null;
    const backendLive = backendValue !== undefined && backendValue !== null;
    const mappingStatus = !mapped
      ? "UNMAPPED"
      : !collectorLive
      ? "NO_COLLECTOR_VALUE"
      : !backendLive
      ? "NO_BACKEND_VALUE"
      : collectorQuality === "GOOD" && backendQuality === "GOOD"
      ? "LIVE"
      : "DEGRADED";
    const bitIndex = Number(runtimePoint.bitIndex) >= 0 ? String(runtimePoint.bitIndex) : "";
    const unit = runtimePoint.pointType === "DIGITAL" ? (runtimePoint.unit || "") : (tag?.unit || runtimePoint.unit || "");
    const canonicalPointCode = tag?.tagCode || "";

    return {
      id: rowId(sourceTag, index),
      enabled: true,
      sourceNo: String(index + 1),
      pointCode: sourceTag,
      sourceTag,
      canonicalPointCode,
      variableKey: canonicalPointCode.toLowerCase().replace(/_/g, "."),
      pointName: tag?.tagNameEn || runtimePoint.pointName || sourceTag,
      displayNameZh: tag?.tagName || runtimePoint.pointName || sourceTag,
      deviceGroup: tag?.engineCode || sourceTag.slice(0, 6) || "MAIN_GENSET_1",
      engineCode: tag?.engineCode || sourceTag.slice(0, 6),
      pointType: runtimePoint.pointType || tag?.tagType || "ANALOG",
      functionCode: String(runtimePoint.functionCode ?? ""),
      registerAddress: String(runtimePoint.registerAddress ?? ""),
      pduAddress: String(runtimePoint.pduAddress ?? ""),
      bitIndex,
      dataType: runtimePoint.dataType || (bitIndex ? "BIT" : "UINT16"),
      registerCount: String(runtimePoint.registerCount ?? "1"),
      scale: String(runtimePoint.scale ?? "1"),
      offset: String(runtimePoint.offset ?? "0"),
      unit,
      byteOrder: runtimePoint.byteOrder || "ABCD",
      rangeText: "",
      pagePath: pageBindingFor(canonicalPointCode),
      status: "active",
      lastValue: displayValue(backendValue, unit),
      collectorValue: valueText(collectorValue),
      backendValue: valueText(backendValue),
      collectorQuality,
      backendQuality,
      quality: backendQuality,
      collectorTimestamp: collectorPoint?.time || "",
      backendTimestamp: backendPoint?.timestamp || "",
      backendSource: backendPoint?.source || "",
      mappingStatus,
      mapped,
      contractMember: contractSet.size ? contractSet.has(sourceTag) : null,
    };
  });
};

const emptyMapping = {
  rows: [],
  summary: { runtime: 0, mapped: 0, collectorLive: 0, backendLive: 0, good: 0, unmapped: 0 },
  validation: null,
  storage: null,
  health: null,
  contract: null,
  runtimeTable: null,
};

let backendTagsPromise = null;
const loadBackendCatalog = async () => {
  if (!backendTagsPromise) {
    backendTagsPromise = Promise.all(ENGINE_CODES.map((engineCode) =>
      apiRequest(buildApiPath(API_ENDPOINTS.engineTags, { engineCode }))
    )).catch((error) => {
      backendTagsPromise = null;
      throw error;
    });
  }
  const [tagEnvelopes, realtimeEnvelopes] = await Promise.all([
    backendTagsPromise,
    Promise.all(ENGINE_CODES.map((engineCode) =>
      apiRequest(buildApiPath(API_ENDPOINTS.realtimeEngine, { engineCode }))
    )),
  ]);
  return {
    tags: tagEnvelopes.flatMap((envelope) => envelope.data || []),
    realtimePoints: realtimeEnvelopes.flatMap((envelope) => envelope.data?.points || []),
  };
};

export const loadLivePointMapping = async () => {
  const [runtimeTable, collectorSnapshot, validation, storage, health, backendCatalog] = await Promise.all([
    collectorRequest("/api/modbus-points"),
    collectorRequest("/api/v1/ship/points/latest?limit=1000"),
    collectorRequest("/api/modbus-validation"),
    collectorRequest("/api/v1/ship/storage"),
    collectorRequest("/api/v1/ship/health"),
    loadBackendCatalog(),
  ]);

  let contract = null;
  try {
    contract = (await apiRequest(API_ENDPOINTS.ingestPointContract)).data;
  } catch (error) {
    // Mapping remains verifiable through tags when the current role cannot read the ingest contract.
  }

  const rows = buildPointMappingRows({
    runtimePoints: runtimeTable.points || [],
    collectorPoints: collectorSnapshot.points || [],
    tags: backendCatalog.tags,
    realtimePoints: backendCatalog.realtimePoints,
    contractPointCodes: contract?.pointCodes || [],
  });
  const summary = {
    runtime: rows.length,
    mapped: rows.filter((row) => row.mapped).length,
    collectorLive: rows.filter((row) => row.collectorValue !== "--").length,
    backendLive: rows.filter((row) => row.backendValue !== "--").length,
    good: rows.filter((row) => row.mappingStatus === "LIVE").length,
    unmapped: rows.filter((row) => !row.mapped).length,
  };

  return { rows, summary, validation, storage, health, contract, runtimeTable };
};

export const useLivePointMapping = (intervalMs = 3000) => {
  const [state, setState] = useState({ data: emptyMapping, status: "loading", error: "" });
  const mountedRef = useRef(true);
  const loadingRef = useRef(false);

  const load = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setState((current) => ({ ...current, status: current.data.rows.length ? "refreshing" : "loading", error: "" }));
    try {
      const data = await loadLivePointMapping();
      if (mountedRef.current) setState({ data, status: "success", error: "" });
    } catch (error) {
      if (mountedRef.current) setState((current) => ({ ...current, status: "error", error: error.message }));
    } finally {
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    load();
    const timer = intervalMs > 0 ? window.setInterval(load, intervalMs) : null;
    return () => {
      mountedRef.current = false;
      if (timer) window.clearInterval(timer);
    };
  }, [intervalMs, load]);

  return { ...state, reload: load };
};

export const loadPipelineStatus = async () => {
  const [health, storage, validation, batchesEnvelope] = await Promise.all([
    collectorRequest("/api/v1/ship/health"),
    collectorRequest("/api/v1/ship/storage"),
    collectorRequest("/api/modbus-validation"),
    apiRequest(API_ENDPOINTS.ingestBatches, { query: { page: 1, pageSize: 5 } }),
  ]);
  return { health, storage, validation, batches: batchesEnvelope.data || {}, source: batchesEnvelope.source || "DB" };
};

export const usePipelineStatus = (intervalMs = 5000, enabled = true) => {
  const [state, setState] = useState({ data: null, status: enabled ? "loading" : "idle", error: "" });
  const load = useCallback(async () => {
    if (!enabled) return;
    setState((current) => ({ ...current, status: current.data ? "refreshing" : "loading", error: "" }));
    try {
      setState({ data: await loadPipelineStatus(), status: "success", error: "" });
    } catch (error) {
      setState((current) => ({ ...current, status: "error", error: error.message }));
    }
  }, [enabled]);
  useEffect(() => {
    load();
    const timer = enabled && intervalMs > 0 ? window.setInterval(load, intervalMs) : null;
    return () => { if (timer) window.clearInterval(timer); };
  }, [enabled, intervalMs, load]);
  return { ...state, reload: load };
};
