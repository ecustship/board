import React, { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Download, HardDriveDownload, RefreshCw, RotateCcw, ShieldCheck } from "lucide-react";
import { createBackup, downloadBackup, listBackups, restoreBackup } from "../api/accessManagementApi";
import { useAuth } from "../hooks/useAuth";
import { PERMISSIONS } from "../auth/permissions";
import SystemBackupManagement from "./SystemBackupManagement";

const formatBytes = (value) => {
  const bytes = Number(value || 0);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

const BackupManagement = ({ onExit }) => {
  const { hasPermission } = useAuth();
  const canRead = hasPermission(PERMISSIONS.BACKUP_READ);
  const canCreate = hasPermission(PERMISSIONS.BACKUP_CREATE);
  const canExport = hasPermission(PERMISSIONS.BACKUP_EXPORT);
  const canRestore = hasPermission(PERMISSIONS.BACKUP_RESTORE);
  const [items, setItems] = useState([]);
  const [scope, setScope] = useState("");
  const [restoreTarget, setRestoreTarget] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [databaseConfigured, setDatabaseConfigured] = useState(false);
  const [working, setWorking] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await listBackups();
      setDatabaseConfigured(true);
      setItems(response.data?.items || []);
      setScope(response.data?.scope || "");
      setRestoreTarget(response.data?.restoreTargetDatabase || "");
    } catch (requestError) {
      if (requestError.status === 503) {
        setDatabaseConfigured(false);
        setNotice("独立数据库备份尚未配置；完整系统备份请使用上方入口。");
      } else setError(requestError.message || "读取备份记录失败。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canRead) refresh();
    else setLoading(false);
  }, [canRead, refresh]);

  const handleCreate = async () => {
    setWorking("backup");
    setError("");
    setNotice("数据库备份正在生成并校验完整性，请保持页面打开。");
    try {
      const response = await createBackup();
      setNotice(`备份已完成，SHA-256：${response.data?.sha256 || "已生成"}`);
      await refresh();
    } catch (requestError) {
      setNotice("");
      setError(requestError.message || "创建备份失败。");
    } finally {
      setWorking("");
    }
  };

  const handleDownload = async (id) => {
    setWorking(`download:${id}`);
    setError("");
    try {
      await downloadBackup(id);
      setNotice(`备份 ${id} 已开始下载。`);
    } catch (requestError) {
      setError(requestError.message || "备份下载失败。");
    } finally {
      setWorking("");
    }
  };

  const handleRestore = async () => {
    if (!selectedId || !confirmed) return;
    setWorking("restore");
    setError("");
    setNotice(`正在恢复到隔离数据库 ${restoreTarget} 并执行完整性校验，请保持页面打开。`);
    try {
      const response = await restoreBackup(selectedId);
      setNotice(`隔离恢复已完成：${response.data?.targetDatabase}，耗时 ${response.data?.durationMs ?? 0} ms。`);
      setConfirmed(false);
    } catch (requestError) {
      setNotice("");
      setError(requestError.message || "隔离恢复失败。");
    } finally {
      setWorking("");
    }
  };

  if (!canRead) {
    return <div className="mx-auto mt-12 max-w-xl rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">当前账户没有系统备份管理权限。</div>;
  }

  return (
    <main className="mx-auto h-full w-full max-w-6xl overflow-y-auto px-4 py-6 sm:px-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={onExit} className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label="返回"><ArrowLeft className="h-5 w-5" /></button>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">系统备份与恢复</h1>
            <p className="mt-1 text-xs text-slate-500">管理完整系统加密备份和数据库备份，并恢复到预先配置的隔离目标。</p>
          </div>
        </div>
        <button onClick={refresh} disabled={loading || Boolean(working)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50 dark:border-white/10 dark:text-white"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />刷新</button>
      </div>

      <SystemBackupManagement />

      <section className="mb-5 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100">
        <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /><div><h2 className="font-black">备份范围</h2><p className="mt-1 leading-6">{scope || "应用 PostgreSQL 数据库结构和行数据；不包含数据库对象的所有权/ACL、集群级角色、运行配置、队列、证书、密钥和服务定义。"}</p><p className="mt-2 text-xs font-bold">恢复目标：{restoreTarget || "未配置隔离恢复数据库"}。恢复不会覆盖应用当前数据库。</p></div></div>
      </section>

      {(error || notice) && <div role="status" className={`mb-5 rounded-lg border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>{error || notice}</div>}

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-surface-container-lowest">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><h2 className="font-black text-slate-900 dark:text-white">创建数据库备份</h2><p className="mt-1 text-xs text-slate-500">生成 custom-format dump、验证归档并记录大小和 SHA-256。</p></div>
          {canCreate && <button onClick={handleCreate} disabled={!databaseConfigured || Boolean(working)} className="inline-flex items-center gap-2 rounded-lg bg-[#0058bc] px-4 py-2.5 text-sm font-black text-white disabled:opacity-50"><HardDriveDownload className="h-4 w-4" />{working === "backup" ? "备份处理中…" : "立即备份"}</button>}
        </div>
      </section>

      <section className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-surface-container-lowest">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-white/10"><h2 className="font-black text-slate-900 dark:text-white">备份记录</h2></div>
        {loading ? <div className="p-8 text-center text-sm text-slate-500">正在读取备份目录…</div> : items.length === 0 ? <div className="p-8 text-center text-sm text-slate-500">暂无可用备份。</div> : (
          <div className="divide-y divide-slate-100 dark:divide-white/10">
            {items.map((item) => (
              <article key={item.id} className="grid gap-3 p-5 lg:grid-cols-[minmax(0,1fr)_auto]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-sm font-black text-slate-800 dark:text-white">{item.id}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${item.integrityValid ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>{item.integrityValid ? "完整性有效" : "完整性异常"}</span></div>
                  <p className="mt-1 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()} · {formatBytes(item.sizeBytes)}</p>
                  <p className="mt-2 break-all font-mono text-[10px] leading-5 text-slate-500">SHA-256: {item.sha256}</p>
                </div>
                <div className="flex items-center gap-2">
                  {canExport && <button onClick={() => handleDownload(item.id)} disabled={!item.integrityValid || Boolean(working)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-40 dark:border-white/10 dark:text-white"><Download className="h-4 w-4" />导出</button>}
                  {canRestore && <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 dark:border-white/10 dark:text-white"><input type="radio" name="restore-backup" checked={selectedId === item.id} onChange={() => { setSelectedId(item.id); setConfirmed(false); }} disabled={!item.integrityValid || Boolean(working)} />选择恢复</label>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {canRestore && <section className="rounded-xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-700 dark:bg-amber-950/30">
        <div className="flex items-start gap-3"><RotateCcw className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" /><div className="min-w-0 flex-1"><h2 className="font-black text-amber-950 dark:text-amber-100">隔离恢复演练</h2><p className="mt-1 text-xs leading-5 text-amber-900 dark:text-amber-100">目标数据库必须由运维预先创建、为空且独立于应用数据库。恢复会写入该隔离目标；请确认其中没有需要保留的数据。</p><label className="mt-4 flex cursor-pointer items-start gap-2 text-xs font-bold text-amber-950 dark:text-amber-100"><input type="checkbox" className="mt-0.5" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} disabled={!selectedId || Boolean(working)} />我已核实目标为独立空数据库，并同意执行隔离恢复。</label><button onClick={handleRestore} disabled={!selectedId || !confirmed || Boolean(working) || !restoreTarget} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-black text-white disabled:opacity-40"><RotateCcw className="h-4 w-4" />{working === "restore" ? "恢复处理中…" : "恢复所选备份"}</button></div></div>
      </section>}
    </main>
  );
};

export default BackupManagement;
