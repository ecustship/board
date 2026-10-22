import React from "react";

const reasons = {
  RESTART_PENDING: "服务刚启动，正在确认来源状态。",
  WORKER_STOPPED: "来源监测已停止。",
  READ_FAILED: "无法读取日志来源，请检查访问权限和服务连接。",
  CURSOR_UNAVAILABLE: "上次读取位置已不可用。读取已暂停，请检查日志保留情况和记录缺口。",
  INVALID_BATCH: "来源返回的批次超过限制，读取已暂停。",
  INVALID_RECORD: "来源记录未通过校验，后续读取已暂停。",
  ADMISSION_BLOCKED: "审计事件无法进入持久化队列，读取位置保持在最后成功记录。",
};
const states = { HEALTHY: "来源读取正常", DEGRADED: "来源读取异常", STARTING: "等待首次检查", STOPPED: "来源监测已停止" };
const time = (value) => value ? new Date(value).toLocaleString() : "尚无记录";

export default function AuditSourceHealth({ sources }) {
  return <section aria-label="审计来源状态" className="mt-4 border-t pt-3">
    <h2 className="font-semibold">审计来源状态</h2>
    {!Array.isArray(sources) ? <p>本次响应未提供来源监测状态，无法确认来源覆盖情况。</p> : sources.length === 0 ? <p>本实例未启用系统服务日志来源监测。</p> : sources.map((source) => {
      const warning = source.state !== "HEALTHY" || !source.statePersisted;
      return <article key={source.sourceId} className="mt-2 rounded border p-3" aria-label="系统服务日志来源">
        <p className={warning ? "font-semibold text-red-800" : "font-semibold text-emerald-800"} role={warning ? "alert" : undefined}>{states[source.state] || "来源状态未知"}</p>
        <p>服务：{source.units?.join("、") || "未提供"}</p>
        {source.state !== "HEALTHY" && <p>{reasons[source.reason] || "请检查来源监测服务。"}</p>}
        {!source.statePersisted && <p className="text-red-800">当前来源状态尚未持久化，服务重启后可能丢失，请检查审计存储。</p>}
        <p>最近检查：{time(source.checkedAt)}</p>
        <p>最近成功：{time(source.lastSuccessAt)}；最近失败：{time(source.lastFailureAt)}；最近恢复：{time(source.lastRecoveryAt)}</p>
        <p>累计读取失败 {source.failures || 0} 次，恢复 {source.recoveries || 0} 次；本次接收 {source.lastBatch || 0} 条。</p>
        <p>最近接收的原记录时间：{time(source.lastRecordAt)}</p>
      </article>;
    })}
    <p className="mt-1 text-slate-500">仅显示本实例已启用的来源；读取恢复不代表历史记录缺口已补齐。</p>
  </section>;
}
