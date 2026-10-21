import React from "react";
import { CircleAlert, Database, Radio, RefreshCw } from "lucide-react";
import { usePipelineStatus } from "../api/pointMappingApi";
import { useAuth } from "../hooks/useAuth";
import { PERMISSIONS } from "../auth/permissions";

const formatTime = (value, language) => {
  if (!value) return "--";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "--" : date.toLocaleTimeString(language === "zh" ? "zh-CN" : "en-US", { hour12: false });
};

const IngestPipelineStatus = ({ language = "zh", embedded = false }) => {
  const { hasPermission } = useAuth();
  const canRead = hasPermission(PERMISSIONS.INGEST_BATCH_READ) || hasPermission(PERMISSIONS.INGEST_TELEMETRY_WRITE);
  const resource = usePipelineStatus(5000, canRead);
  if (!canRead) return null;

  const data = resource.data || {};
  const latest = data.batches?.items?.[0];
  const health = data.health || {};
  const storage = data.storage || {};
  const validation = data.validation || {};
  const isZh = language === "zh";
  const cells = [
    [isZh ? "Java 采集" : "Java collector", health.status || "--", `${health.sampleCount ?? 0} points`],
    [isZh ? "点表读取" : "Point validation", `${validation.goodCount ?? 0}/${validation.pointCount ?? 0}`, validation.success ? "GOOD" : "CHECK"],
    [isZh ? "SQLite 队列" : "SQLite queue", storage.unsentRecords ?? "--", isZh ? "待投递" : "pending"],
    [isZh ? "后端 ACK" : "Backend ACK", latest ? `${latest.accepted ?? 0}/${latest.rejected ?? 0}` : "--", latest?.status || "--"],
    [isZh ? "最近入库" : "Latest DB batch", formatTime(latest?.finishedAt, language), data.source || "DB"],
  ];

  return (
    <section className={embedded
      ? "rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-surface-container-lowest"
      : "mx-4 mb-2 rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm dark:border-white/10 dark:bg-surface-container-lowest"
    }>
      <div className="flex items-center gap-4">
        <div className="flex shrink-0 items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-200">
          {resource.status === "error" ? <CircleAlert className="h-4 w-4 text-red-500" /> : <Radio className="h-4 w-4 text-emerald-500" />}
          <span>{isZh ? "实时数据链路" : "Live pipeline"}</span>
          <Database className="h-3.5 w-3.5 text-blue-500" />
        </div>
        <div className="grid min-w-0 flex-1 grid-cols-5 gap-3">
          {cells.map(([label, value, hint]) => (
            <div key={label} className="min-w-0">
              <div className="truncate text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
              <div className="truncate text-[11px] font-black text-slate-800 dark:text-white">{value} <span className="font-semibold text-slate-400">{hint}</span></div>
            </div>
          ))}
        </div>
        <button onClick={resource.reload} title={resource.error || (isZh ? "刷新" : "Refresh")}><RefreshCw className={`h-3.5 w-3.5 text-slate-400 ${resource.status === "refreshing" ? "animate-spin" : ""}`} /></button>
      </div>
      {resource.status === "error" && <div className="mt-1 text-[10px] font-bold text-red-600">{resource.error}</div>}
    </section>
  );
};

export default IngestPipelineStatus;
