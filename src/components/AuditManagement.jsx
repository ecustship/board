import React, { useEffect, useState } from "react";
import { listAudits, downloadAudits, getAuditWriteStatus } from "../api/auditApi";
import { useAuth } from "../hooks/useAuth";
import { PERMISSIONS } from "../auth/permissions";
import AuditSourceHealth from "./AuditSourceHealth";

const emptyFilters = { userId: "", action: "", target: "", from: "", to: "" };
const inputClass = "rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900";

export default function AuditManagement({ onExit }) {
  const { hasPermission } = useAuth();
  const canRead = hasPermission(PERMISSIONS.AUDIT_READ);
  const canExport = hasPermission(PERMISSIONS.AUDIT_EXPORT);
  const [draft, setDraft] = useState(emptyFilters);
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [writeStatus, setWriteStatus] = useState(null);
  const [statusError, setStatusError] = useState("");

  useEffect(() => {
    if (!canRead) return undefined;
    const controller = new AbortController();
    let timer;
    const refresh = async () => {
      try {
        const response = await getAuditWriteStatus(controller.signal);
        if (!controller.signal.aborted) {
          setWriteStatus(response.data);
          setStatusError("");
        }
      } catch (_) {
        if (!controller.signal.aborted) {
          setWriteStatus(null);
          setStatusError("无法读取审计写入状态，请检查服务连接。");
        }
      } finally {
        if (!controller.signal.aborted) timer = window.setTimeout(refresh, 30000);
      }
    };
    refresh();
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [canRead, revision]);

  useEffect(() => {
    if (!canRead) return undefined;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setResult({ items: [], total: 0 });
    listAudits({ ...filters, page, pageSize: 20 }, controller.signal)
      .then((response) => { if (!controller.signal.aborted) setResult(response.data || { items: [], total: 0 }); })
      .catch((requestError) => { if (!controller.signal.aborted) setError(requestError.message || "审计查询失败。"); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [canRead, filters, page, revision]);

  const applyFilters = (event) => {
    event.preventDefault();
    if (draft.from && draft.to && new Date(draft.from) > new Date(draft.to)) {
      setError("开始时间不能晚于结束时间。");
      return;
    }
    setPage(1);
    setNotice("");
    setFilters({
      ...draft,
      userId: draft.userId.trim(), action: draft.action.trim(), target: draft.target.trim(),
      from: draft.from ? new Date(draft.from).toISOString() : "",
      to: draft.to ? new Date(draft.to).toISOString() : "",
    });
  };

  const exportCSV = async () => {
    setExporting(true);
    setError("");
    setNotice("");
    try {
      await downloadAudits(filters);
      setNotice("已开始下载全部匹配的审计记录。");
    } catch (requestError) {
      setError(requestError.message || "审计导出失败。");
    } finally { setExporting(false); }
  };

  if (!canRead) return <div role="alert" className="m-6 rounded bg-amber-50 p-6 text-amber-900">当前账户没有审计日志查看权限。</div>;

  return (
    <main className="mx-auto h-full w-full max-w-7xl overflow-y-auto px-4 py-6 text-slate-900 sm:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onExit} className={inputClass}>返回</button>
          <h1 className="text-xl font-bold">审计日志</h1>
        </div>
        <div className="flex gap-2">
          <button className={inputClass} onClick={() => setRevision((value) => value + 1)} disabled={loading}>刷新</button>
          {canExport && <button className={inputClass} onClick={exportCSV} disabled={exporting}>{exporting ? "正在导出…" : "导出全部匹配记录"}</button>}
        </div>
      </div>
      <section aria-label="审计写入状态" className="mb-4 rounded border bg-white p-4 text-sm">
        {statusError ? <p role="alert" className="text-red-800">{statusError}</p> : !writeStatus ? <p>正在读取审计写入状态…</p> : (
          <>
            <p className={writeStatus.state === "DEGRADED" ? "font-semibold text-red-800" : "font-semibold"} role={writeStatus.state === "DEGRADED" ? "alert" : undefined}>
              {writeStatus.scope === "durable-journal" ? (writeStatus.state === "DEGRADED" ? (writeStatus.sources?.some((source) => source.state !== "HEALTHY" || !source.statePersisted) ? "审计来源异常，请检查下方来源状态" : "审计存储异常或补写待完成") : "审计写入正常，待补写队列为空") : ({ HEALTHY: "最近一次审计写入成功", DEGRADED: "审计写入故障：部分事件未保存", UNKNOWN: "尚无审计写入结果", VOLATILE: "审计仅保存在内存，重启后会丢失" })[writeStatus.state] || "审计写入状态未知"}
            </p>
            <p>{writeStatus.scope === "durable-journal" ? "累计" : "本进程"}成功 {writeStatus.successfulWrites || 0} 次，失败 {writeStatus.failedWrites || 0} 次，连续失败 {writeStatus.consecutiveFailures || 0} 次。</p>
            {writeStatus.lastFailureAt && <p>最近失败：{new Date(writeStatus.lastFailureAt).toLocaleString()}</p>}
            {writeStatus.lastSuccessAt && <p>最近成功：{new Date(writeStatus.lastSuccessAt).toLocaleString()}</p>}
            {writeStatus.scope === "durable-journal" ? <>
              <p>待补写 {writeStatus.pendingEvents || 0} 条，故障后已补写 {writeStatus.replayedWrites || 0} 条。</p>
              <p>本地日志失败 {writeStatus.journalFailures || 0} 次，未进入持久化队列 {writeStatus.unpersistedEvents || 0} 条。</p>
              {writeStatus.pendingEvents > 0 && <p className="text-amber-900">待补写事件已保存在本地日志，数据库恢复后自动补写。</p>}
              {writeStatus.unpersistedEvents > 0 && <p className="text-red-800">存在未持久化事件，请按审计故障处置流程追查记录缺口。</p>}
            </> : writeStatus.failedEventsNotReplayed && <p className="text-amber-900">故障期间未保存的事件尚未补录，请按审计故障处置流程处理。</p>}
            <AuditSourceHealth sources={writeStatus.sources} />
          </>
        )}
        <p className="mt-1 text-slate-500">{writeStatus?.scope === "durable-journal" ? "状态每 30 秒刷新；待补写事件和已保存的故障计数在服务重启后保留。" : "状态每 30 秒刷新；只反映当前进程的写入结果，计数在服务重启后清零。"}</p>
      </section>
      <form onSubmit={applyFilters} className="mb-4 flex flex-wrap items-end gap-3">
        {[["userId", "用户 ID"], ["action", "事件类型"], ["target", "目标包含"], ["from", "开始时间"], ["to", "结束时间"]].map(([key, label]) => (
          <label key={key} className="flex flex-col gap-1 text-sm">{label}
            <input className={inputClass} type={key === "from" || key === "to" ? "datetime-local" : "text"} value={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} />
          </label>
        ))}
        <button className={inputClass} type="submit">查询</button>
      </form>
      <p className="mb-3 text-sm text-slate-500">时间按浏览器本地时区输入和显示，导出保留 UTC 时区。导出使用已应用的查询条件。</p>
      {error && <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-red-800">{error}</p>}
      {notice && <p role="status" className="mb-4 text-emerald-800">{notice}</p>}
      {loading ? <p role="status">正在加载审计记录…</p> : (
        <>
          <p className="mb-3 text-sm">共 {result.total} 条，第 {page} 页</p>
          <div className="overflow-x-auto rounded border bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100"><tr>{["时间", "用户 ID", "事件", "目标", "IP", "详情"].map((title) => <th key={title} className="p-3">{title}</th>)}</tr></thead>
              <tbody>{(result.items || []).map((entry) => (
                <tr key={entry.id} className="border-t align-top">
                  <td className="whitespace-nowrap p-3">{new Date(entry.createdAt).toLocaleString()}</td>
                  <td className="p-3">{entry.userId || "—"}</td><td className="p-3">{entry.action}</td>
                  <td className="max-w-xs break-words p-3">{entry.target || "—"}</td><td className="p-3">{entry.ip || "—"}</td>
                  <td className="max-w-md p-3"><details><summary className="cursor-pointer">查看详情</summary><pre className="mt-2 whitespace-pre-wrap break-words">{entry.detail || "无详情"}</pre></details></td>
                </tr>
              ))}</tbody>
            </table>
            {!result.items?.length && <p className="p-6 text-slate-500">没有匹配的审计记录。</p>}
          </div>
          <div className="mt-4 flex gap-3">
            <button className={inputClass} disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>上一页</button>
            <button className={inputClass} disabled={page * 20 >= result.total} onClick={() => setPage((value) => value + 1)}>下一页</button>
          </div>
        </>
      )}
    </main>
  );
}
