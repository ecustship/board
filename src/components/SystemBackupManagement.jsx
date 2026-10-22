import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { PERMISSIONS } from "../auth/permissions";
import { activateSystemRecovery, createSystemBackup, downloadSystemBackup, listSystemBackups, listSystemRecoveries, reconcileSystemRecovery, restoreSystemBackup, stopSystemRecovery, systemBackupStatus } from "../api/systemBackupApi";

const stageNames = { audit: "捕获审计", "ship-queue": "捕获船端队列", "shore-queue": "捕获岸端队列", database: "处理数据库", encrypting: "加密并校验", verifying: "验证备份", "preparing-components": "恢复文件", completed: "备份完成", "components-restored": "组件恢复完成，等待启动", failed: "操作失败", "partial-failure": "恢复未完成，隔离数据库已写入" };
const buttonClass = "rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold disabled:opacity-40 dark:border-white/20";
const recoveryStates = { restored: "组件已恢复，等待启动", superseded: "已有更新的恢复操作，此副本不可启动", starting: "正在启动隔离系统", running: "隔离系统运行正常", degraded: "隔离系统健康检查异常", stopping: "正在停止隔离系统", stopped: "隔离系统已停止", failed: "隔离系统启动或运行失败", "stop-incomplete": "停止未完成，需要运维核查", "verification-required": "运行状态待核查，请联系运维" };

export default function SystemBackupManagement() {
  const { hasPermission } = useAuth();
  const canRead = hasPermission(PERMISSIONS.BACKUP_READ);
  const canCreate = hasPermission(PERMISSIONS.BACKUP_CREATE);
  const canExport = hasPermission(PERMISSIONS.BACKUP_EXPORT);
  const canRestore = hasPermission(PERMISSIONS.BACKUP_RESTORE);
  const [view, setView] = useState(null);
  const [items, setItems] = useState([]);
  const [recoveries, setRecoveries] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [working, setWorking] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [scope, setScope] = useState("");
  const [saveArea, setSaveArea] = useState("");
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    const response = await listSystemBackups();
    setView(response.data); setItems(response.data?.items || []);
    setScope(response.data?.scope || ""); setSaveArea(response.data?.saveArea || "");
    if (response.data?.configured) {
      const restored = await listSystemRecoveries(); setRecoveries(restored.data?.items || []);
    }
  }, []);
  useEffect(() => {
    if (!canRead) { setLoading(false); return; }
    refresh().catch(e => setError(e.message || "完整备份服务不可用。")).finally(() => setLoading(false));
  }, [canRead, refresh]);
  const running = Boolean(working || view?.progress?.running);
  useEffect(() => {
    if (!canRead || !view?.configured) return;
    let active = true, timer;
    const poll = async () => {
      try { const response = await listSystemRecoveries(); if (active) setRecoveries(response.data?.items || []); }
      catch (e) { if (active) setError(e.message || "无法读取隔离系统状态。"); }
      if (active) timer = setTimeout(poll, 2000);
    };
    timer = setTimeout(poll, 2000);
    return () => { active = false; clearTimeout(timer); };
  }, [canRead, view?.configured]);
  useEffect(() => {
    if (!running) return;
    let active = true, timer;
    const poll = async () => {
      try {
        const response = await systemBackupStatus();
        if (active) setView(previous => ({ ...previous, ...response.data }));
      } catch (e) { if (active) setError(e.message || "无法读取处理进度。"); }
      if (active) timer = setTimeout(poll, 1000);
    };
    poll();
    return () => { active = false; clearTimeout(timer); };
  }, [running]);
  const perform = async (kind, action) => {
    setWorking(kind); setError(""); setNotice("");
    try {
      const result = await action();
      if (kind === "restore") {
        const data = result?.data;
        if (!data?.databaseRestored || !data?.componentsRestored) throw new Error("恢复结果未确认完整，请检查隔离恢复状态。");
        setNotice(data.runtimeStarted ? "隔离系统已恢复并启动。" : "隔离数据库和系统文件已恢复，服务尚未启动；请完成隔离环境激活与运行验证。");
        setConfirmed(false);
      } else if (kind === "backup") { setNotice(`完整系统备份已完成：${result?.data?.id}。请导出到受控第二存储并比对 SHA-256。`); }
      else if (kind === "activate") {
        if (result?.data?.state !== "running" || !result?.data?.runtimeStarted) throw new Error("隔离系统尚未确认运行正常，请检查启动状态。");
        setNotice("隔离系统已启动，全部预装服务健康检查通过。");
      } else if (kind === "stop") {
        if (result?.data?.state !== "stopped") throw new Error("隔离系统停止未完成，请检查运行状态。");
        setNotice("本次激活的隔离服务已全部停止。");
      } else if (kind === "reconcile") {
        const state = result?.data?.state;
        if (!["running", "degraded", "failed", "stopped"].includes(state)) throw new Error("隔离系统仍待核查，请联系运维。");
        setNotice(["running", "degraded"].includes(state) ? "隔离服务身份已核实，运行监督已恢复。" : "隔离服务身份已核实，已处理退出或未完成的停止操作。");
      }
      else { setNotice("加密备份已导出；请核对第二存储文件的 SHA-256 和访问权限。"); }
      await refresh();
    } catch (e) { setError(e.message || "完整系统备份操作失败。"); }
    finally { setWorking(""); }
  };
  if (!canRead) return null;
  const selected = items.find(item => item.id === selectedId);
  return <section aria-labelledby="system-backup-title" data-testid="system-backup-panel" className="mb-8 rounded-xl border border-sky-300 bg-white p-5 text-slate-900 dark:bg-surface-container-lowest dark:text-white">
    <div className="flex items-center justify-between gap-3"><h2 id="system-backup-title" className="text-lg font-black">完整系统加密备份</h2><button className={buttonClass} disabled={running || loading} onClick={() => { setError(""); refresh().catch(e => setError(e.message)); }}>刷新完整备份</button></div>
    {loading ? <p className="mt-3 text-sm">正在读取完整备份配置…</p> : !view?.configured ? <p className="mt-3 text-sm">{view?.configurationRejected ? "完整系统备份配置未通过校验，请联系运维检查受控配置。" : "完整系统备份尚未配置。"}</p> : <>
      <p className="mt-3 text-sm leading-6">范围包括数据库、船岸队列、审计、应用程序、前端、配置和服务定义；具体文件由运维预先确认。在线依次捕获各组件，并记录捕获时间窗口。</p>
      <div className="mt-4 flex flex-wrap items-end gap-4">
        <label className="text-sm">备份内容<select aria-label="完整备份内容" value={scope} onChange={e => setScope(e.target.value)} disabled={running} className="mt-1 block rounded border p-2 text-slate-900"><option value={view.scope}>{view.scope}</option></select></label>
        <label className="text-sm">受控保存区<select aria-label="完整备份保存区" value={saveArea} onChange={e => setSaveArea(e.target.value)} disabled={running} className="mt-1 block rounded border p-2 text-slate-900"><option value={view.saveArea}>{view.saveArea}</option></select></label>
        {canCreate && <button className={buttonClass} disabled={running || !scope || !saveArea} onClick={() => perform("backup", () => createSystemBackup(scope, saveArea))}>创建完整系统备份</button>}
      </div>
      <p className="mt-3 text-xs">隔离恢复区：{view.restoreArea}。恢复写入预配置的独立空数据库和新文件目录。</p>
      {(running || view.progress?.stage) && <p role="status" aria-live="polite" className="mt-3 text-sm">处理状态：{working === "activate" ? "正在启动隔离系统" : working === "stop" ? "正在停止隔离系统" : stageNames[view.progress?.stage] || (working === "download" ? "正在导出" : "准备处理")} {view.progress?.stage && view.progress?.startedAt && !view.progress.startedAt.startsWith("0001-") && `· ${new Date(view.progress.startedAt).toLocaleString()}`}</p>}
      <div className="mt-4 divide-y divide-slate-200">
        {items.length === 0 && <p className="py-4 text-sm">暂无完整系统备份。</p>}
        {items.map(item => <article key={item.id} className="py-4">
          <p className="break-all font-mono text-sm font-bold">{item.id}</p>
          <p className="mt-1 text-xs">{new Date(item.createdAt).toLocaleString()} · {item.scope} · {(item.sizeBytes / 1048576).toFixed(2)} MB · {item.integrityValid ? "完整性有效" : "完整性异常"}</p>
          <p className="mt-2 break-all font-mono text-xs">SHA-256: {item.sha256}</p>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            {canExport && <button className={buttonClass} disabled={running || !item.integrityValid} onClick={() => perform("download", () => downloadSystemBackup(item.id))}>导出加密系统备份</button>}
            {canRestore && view.restoreEnabled && <label className="text-sm"><input type="radio" name="restore-system-backup" checked={selectedId === item.id} disabled={running || !item.integrityValid} onChange={() => { setSelectedId(item.id); setConfirmed(false); }} /> 选择完整备份恢复</label>}
          </div>
        </article>)}
      </div>
      {canRestore && view.restoreEnabled && <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950">
        <h3 className="font-bold">恢复完整系统到隔离目标</h3>
        {selected && <p className="mt-2 break-all text-xs">所选备份：{selected.id} · {new Date(selected.createdAt).toLocaleString()} · {selected.scope} · {selected.integrityValid ? "完整性有效" : "完整性异常"}</p>}
        <label className="mt-3 flex items-start gap-2 text-sm"><input type="checkbox" checked={confirmed} disabled={running || !selected?.integrityValid} onChange={e => setConfirmed(e.target.checked)} />我已核实隔离恢复区 {view.restoreArea} 和独立空数据库，并确认恢复所选完整备份。</label>
        <button className={`${buttonClass} mt-3`} disabled={running || !confirmed || !selected?.integrityValid} onClick={() => perform("restore", () => restoreSystemBackup(selectedId, view.restoreArea))}>执行完整系统隔离恢复</button>
      </div>}
      {recoveries.length > 0 && <div className="mt-5 border-t border-slate-300 pt-4" data-testid="system-recoveries">
        <h3 className="font-bold">已恢复的隔离系统</h3>
        {!view.activationEnabled && <p className="mt-2 text-sm">隔离系统启动方案尚未配置，请联系运维。</p>}
        {recoveries.map(recovery => <article key={recovery.operationId} className="mt-4 rounded-lg border border-slate-300 p-3">
          <p className="break-all font-mono text-xs">恢复操作：{recovery.operationId}</p>
          <p className="mt-1 break-all font-mono text-xs">备份：{recovery.backupId}</p>
          <p role="status" className="mt-2 text-sm">{recoveryStates[recovery.state] || "运行状态待核查，请联系运维"}</p>
          <p className="mt-1 text-xs">目标：{view.restoreArea} · {(recovery.processes || []).map(process => `${process.name}：${process.healthy ? "健康" : "未就绪"}`).join("；")}</p>
          {canRestore && view.activationEnabled && ["restored", "stopped", "failed"].includes(recovery.state) && <button className={`${buttonClass} mt-3`} disabled={running} onClick={() => perform("activate", () => activateSystemRecovery(recovery.operationId, view.restoreArea))}>启动已恢复的隔离系统</button>}
          {canRestore && view.activationEnabled && ["running", "degraded"].includes(recovery.state) && <button className={`${buttonClass} mt-3`} disabled={running} onClick={() => perform("stop", () => stopSystemRecovery(recovery.operationId, view.restoreArea))}>停止本次隔离系统</button>}
          {canRestore && view.activationEnabled && ["verification-required", "stop-incomplete"].includes(recovery.state) && <button className={`${buttonClass} mt-3`} disabled={running} onClick={() => perform("reconcile", () => reconcileSystemRecovery(recovery.operationId, view.restoreArea))}>核查并接管隔离系统</button>}
        </article>)}
      </div>}
    </>}
    {notice && <p role="status" className="mt-4 text-sm text-emerald-700">{notice}</p>}
    {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
  </section>;
}
