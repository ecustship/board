import React, { useEffect, useState } from "react";
import { useApiResource } from "../api/useApiResource";

const labels = {
  NORMAL: ["正常", "Normal"], WARNING: ["超限计时中", "Threshold pending"],
  PROTECTED: ["资源超限", "Resource threshold reached"], RECOVERING: ["恢复计时中", "Recovery pending"],
  PENDING: ["超限计时中", "Threshold pending"], UNKNOWN: ["读数未知", "Unknown reading"],
  STALE: ["读数已过期", "Stale readings"], STOPPED: ["监测已停止", "Monitor stopped"],
};
const percent = (value) => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100 ? `${value.toFixed(1)}%` : "--";
const mib = (value) => typeof value === "number" && Number.isFinite(value) && value >= 0 ? `${(value / 1048576).toFixed(1)} MiB` : "--";

export default function HostResourceStatus({ language = "zh" }) {
  const zh = language === "zh";
  const resource = useApiResource("/system/resources", { intervalMs: 2000 });
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const data = resource.data;
  const valid = data?.schema === "system-resources.host.v1" && data?.source === "local-os" && ["ship", "shore"].includes(data?.role);
  const checked = data?.checkedAt ? new Date(data.checkedAt).getTime() : NaN;
  const ageLimit = data?.policy?.maxAgeMs;
  const fresh = valid && Number.isFinite(checked) && typeof ageLimit === "number" && ageLimit > 0 && Math.abs(now - checked) <= ageLimit;
  const usable = fresh && resource.online && !["STALE", "STOPPED"].includes(data?.state);
  const state = !valid || !resource.online ? "UNKNOWN" : !fresh ? "STALE" : data.state;
  const text = (value) => (labels[value] || labels.UNKNOWN)[zh ? 0 : 1];
  return <section aria-label={zh ? "后端主机资源" : "Backend host resources"} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-surface-container-lowest">
    <div className="flex items-center justify-between gap-3">
      <h3 className="font-bold">{zh ? "后端主机资源" : "Backend host resources"}</h3>
      <button type="button" onClick={resource.reload}>{zh ? "刷新资源" : "Refresh resources"}</button>
    </div>
    {!valid ? <p role="alert">{zh ? "主机资源监测尚未配置或当前不可用。" : "Host resource monitoring is not configured or unavailable."}</p> : <>
      <p>{zh ? "实例" : "Instance"}：{data.instance} · {data.role === "ship" ? (zh ? "船端" : "Ship") : (zh ? "岸端" : "Shore")}</p>
      <p role={state === "NORMAL" ? undefined : "alert"}>{text(state)}</p>
      {!resource.online && <p>{zh ? "资源状态接口不可用，上一批读数无法确认。" : "Resource API unavailable; previous readings are unconfirmed."}</p>}
      <p>{zh ? "CPU（全主机）" : "CPU (whole host)"}：{usable ? percent(data.cpu?.percent) : "--"} · {text(usable ? data.cpu?.state : state)}</p>
      <p>{zh ? "CPU采样窗口" : "CPU sample window"}：{data.cpuWindowMs ?? "--"} ms</p>
      <ul>{(Array.isArray(data.disks) ? data.disks : []).map((disk) => <li key={disk.label}>
        {disk.label}：{usable ? percent(disk.percent) : "--"} · {text(usable ? disk.state : state)} · {zh ? "可用" : "Available"} {usable && disk.percent !== null ? mib(disk.availableBytes) : "--"}
      </li>)}</ul>
      <p>{data.mode === "PROTECT" ? (zh ? "保护模式：超限或监测失效时拒绝新审计导出、备份和恢复，取消在途受控任务；并发受限。" : "Protection mode: threshold or monitoring failure rejects new audit exports, backups and restores, cancels guarded tasks and limits concurrency.") : (zh ? "仅观察模式：显示超限状态，不执行任务保护。" : "Observe mode: shows thresholds without enforcing task protection.")}</p>
      <p>{zh ? "受控任务" : "Guarded tasks"}：{data.activeTasks ?? 0}/{data.policy?.maxConcurrent ?? "--"}；{zh ? "本进程拒绝/取消" : "Rejected/cancelled this process"}：{data.rejectedTasks ?? 0}/{data.cancelledTasks ?? 0}</p>
      <p>{zh ? "阈值/恢复" : "Trigger/recovery"}：CPU {percent(data.policy?.cpuHighPercent)}/{percent(data.policy?.cpuRecoverPercent)}；{zh ? "磁盘" : "Disk"} {percent(data.policy?.diskHighPercent)}/{percent(data.policy?.diskRecoverPercent)}；{zh ? "持续" : "Duration"} {data.policy?.triggerMs}/{data.policy?.recoverMs} ms；{zh ? "最低可用空间" : "Minimum free space"} {mib(data.policy?.minFreeBytes)}</p>
      <p>{zh ? "最近主机检查" : "Last host check"}：{Number.isFinite(checked) ? new Date(checked).toLocaleString() : "--"}</p>
    </>}
    <p className="mt-2 text-xs text-slate-500">{zh ? "来源为当前连接的后端主机；此处的磁盘读数与船端待发送队列占用分别显示。" : "Values describe the connected backend host. Disk usage and the ship sender queue are separate measurements."}</p>
  </section>;
}
