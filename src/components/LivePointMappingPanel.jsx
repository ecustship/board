import React, { useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, RefreshCw, Search } from "lucide-react";

const formatTime = (value, language) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString(language === "zh" ? "zh-CN" : "en-US", { hour12: false });
};

const statusCopy = {
  LIVE: { zh: "映射正常", en: "LIVE", tone: "bg-emerald-100 text-emerald-700" },
  DEGRADED: { zh: "质量异常", en: "DEGRADED", tone: "bg-amber-100 text-amber-700" },
  UNMAPPED: { zh: "未映射", en: "UNMAPPED", tone: "bg-red-100 text-red-700" },
  NO_COLLECTOR_VALUE: { zh: "无采集值", en: "NO COLLECTOR VALUE", tone: "bg-red-100 text-red-700" },
  NO_BACKEND_VALUE: { zh: "未入库", en: "NO BACKEND VALUE", tone: "bg-red-100 text-red-700" },
};

const MappingStatus = ({ status, language }) => {
  const item = statusCopy[status] || statusCopy.DEGRADED;
  return <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-black ${item.tone}`}>{item[language] || item.en}</span>;
};

const ValueCell = ({ value, unit, quality, source }) => (
  <div className="min-w-[115px]">
    <div className="font-mono text-xs font-black text-slate-800 dark:text-white">
      {value}{value !== "--" && unit ? ` ${unit}` : ""}
    </div>
    <div className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-400">
      {quality || "--"}{source ? ` · ${source}` : ""}
    </div>
  </div>
);

const LivePointMappingPanel = ({ resource, language = "zh" }) => {
  const [search, setSearch] = useState("");
  const [engine, setEngine] = useState("ALL");
  const [selectedId, setSelectedId] = useState("");
  const isZh = language === "zh";
  const rows = useMemo(() => resource.data?.rows || [], [resource.data?.rows]);
  const summary = resource.data?.summary || {};
  const validation = resource.data?.validation;
  const contract = resource.data?.contract;
  const health = resource.data?.health;
  const term = search.trim().toLowerCase();

  const filteredRows = useMemo(() => rows.filter((row) => {
    if (engine !== "ALL" && row.engineCode !== engine) return false;
    if (!term) return true;
    return [row.sourceTag, row.canonicalPointCode, row.pointName, row.displayNameZh, row.registerAddress]
      .some((value) => String(value || "").toLowerCase().includes(term));
  }), [engine, rows, term]);

  const selected = rows.find((row) => row.id === selectedId) || filteredRows[0] || rows[0];
  const summaryCards = [
    [isZh ? "运行点表" : "Runtime table", summary.runtime ?? 0, "text-slate-900 dark:text-white"],
    [isZh ? "后端已映射" : "Mapped", summary.mapped ?? 0, "text-blue-600"],
    [isZh ? "采集端有值" : "Collector live", summary.collectorLive ?? 0, "text-cyan-600"],
    [isZh ? "后端有值" : "Backend live", summary.backendLive ?? 0, "text-indigo-600"],
    [isZh ? "全链路正常" : "End-to-end GOOD", summary.good ?? 0, "text-emerald-600"],
    [isZh ? "未映射" : "Unmapped", summary.unmapped ?? 0, summary.unmapped ? "text-red-600" : "text-emerald-600"],
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className={`rounded-xl border px-4 py-3 text-xs font-bold ${
        resource.status === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {resource.status === "error" ? <CircleAlert className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            <span>
              {resource.status === "loading"
                ? (isZh ? "正在读取采集端与后端点位..." : "Loading collector and backend points...")
                : resource.status === "error"
                ? resource.error
                : isZh
                ? `实时核对：采集 ${validation?.goodCount ?? 0}/${validation?.pointCount ?? 0} GOOD，契约 ${contract?.pointCount ?? summary.runtime ?? 0} 点，来源 DB / MODBUS`
                : `Live check: collector ${validation?.goodCount ?? 0}/${validation?.pointCount ?? 0} GOOD, contract ${contract?.pointCount ?? summary.runtime ?? 0}, source DB / MODBUS`}
            </span>
          </div>
          <button onClick={resource.reload} className="flex items-center gap-1 rounded-lg border border-current/20 px-2.5 py-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${resource.status === "refreshing" ? "animate-spin" : ""}`} />
            {isZh ? "刷新" : "Refresh"}
          </button>
        </div>
        {health?.recordedAt && <div className="mt-1 text-[10px] opacity-70">{isZh ? "最近采集" : "Latest collection"}: {formatTime(health.recordedAt, language)}</div>}
      </div>

      <div className="grid grid-cols-3 gap-2 xl:grid-cols-6">
        {summaryCards.map(([label, value, tone]) => (
          <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
            <div className="text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</div>
            <div className={`mt-1 text-xl font-black ${tone}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 gap-3">
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 dark:border-white/10 dark:bg-white/5">
          <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-200 p-3 dark:border-white/10">
            <div className="relative min-w-[260px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={isZh ? "搜索 sourceTag、后端 tagCode、名称或地址" : "Search sourceTag, backend tagCode, name or address"} className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-[#4cd7d0] dark:border-white/10 dark:bg-slate-900" />
            </div>
            {["ALL", "CMMS01", "CMMS02", "CMMS03", "CMMS04"].map((code) => (
              <button key={code} onClick={() => setEngine(code)} className={`h-8 rounded-full px-3 text-[10px] font-black ${engine === code ? "bg-slate-900 text-white dark:bg-[#4cd7d0] dark:text-[#00201e]" : "bg-white text-slate-500 dark:bg-white/10 dark:text-slate-300"}`}>{code}</button>
            ))}
          </div>
          <div className="min-h-0 overflow-auto">
            <table className="w-full min-w-[1530px] text-left text-xs">
              <thead className="sticky top-0 z-10 bg-slate-100 text-[9px] uppercase tracking-wider text-slate-500 dark:bg-slate-800">
                <tr>
                  {(isZh
                    ? ["序号", "采集 sourceTag", "后端 tagCode", "名称", "寄存器", "类型/换算", "采集端当前值", "后端入库值", "时间戳", "链路状态"]
                    : ["No.", "Collector sourceTag", "Backend tagCode", "Name", "Register", "Type / scaling", "Collector value", "Backend value", "Timestamp", "Pipeline"]
                  ).map((head) => <th key={head} className="border-b border-slate-200 px-3 py-2 font-black dark:border-white/10">{head}</th>)}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id} onClick={() => setSelectedId(row.id)} className={`cursor-pointer border-b border-slate-100 bg-white transition hover:bg-cyan-50 dark:border-white/5 dark:bg-transparent dark:hover:bg-white/5 ${selected?.id === row.id ? "bg-[#edfffd] dark:bg-[#4cd7d0]/10" : ""}`}>
                    <td className="px-3 py-2 font-bold">{row.sourceNo}</td>
                    <td className="max-w-[240px] px-3 py-2 font-mono text-[10px] font-bold text-blue-700 dark:text-blue-300">{row.sourceTag}</td>
                    <td className="max-w-[260px] px-3 py-2 font-mono text-[10px] font-bold text-indigo-700 dark:text-indigo-300">{row.canonicalPointCode || "--"}</td>
                    <td className="px-3 py-2"><div className="font-bold text-slate-800 dark:text-white">{isZh ? row.displayNameZh : row.pointName}</div><div className="text-[9px] text-slate-400">{row.engineCode}</div></td>
                    <td className="px-3 py-2 font-mono">{row.registerAddress}{row.bitIndex ? `.${row.bitIndex}` : ""}<div className="text-[9px] text-slate-400">PDU {row.pduAddress || "--"} · FC{row.functionCode}</div></td>
                    <td className="px-3 py-2">{row.dataType}<div className="text-[9px] text-slate-400">× {row.scale} + {row.offset}</div></td>
                    <td className="px-3 py-2"><ValueCell value={row.collectorValue} unit={row.unit} quality={row.collectorQuality} source="Java" /></td>
                    <td className="px-3 py-2"><ValueCell value={row.backendValue} unit={row.unit} quality={row.backendQuality} source={row.backendSource || "DB"} /></td>
                    <td className="px-3 py-2 text-[9px] text-slate-500"><div>{formatTime(row.collectorTimestamp, language)}</div><div>{formatTime(row.backendTimestamp, language)}</div></td>
                    <td className="px-3 py-2"><MappingStatus status={row.mappingStatus} language={language} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredRows.length && <div className="p-10 text-center text-xs font-bold text-slate-400">{isZh ? "没有匹配点位" : "No matching points"}</div>}
          </div>
        </div>

        <aside className="w-[300px] shrink-0 overflow-auto rounded-2xl border border-slate-100 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
          <div className="text-xs font-black uppercase tracking-wider text-slate-500">{isZh ? "映射详情" : "Mapping detail"}</div>
          {selected ? (
            <>
              <div className="mt-3"><MappingStatus status={selected.mappingStatus} language={language} /></div>
              <div className="mt-4 space-y-3">
                {[
                  ["sourceTag", selected.sourceTag],
                  ["tagCode", selected.canonicalPointCode || "--"],
                  [isZh ? "寄存器 / PDU" : "Register / PDU", `${selected.registerAddress}${selected.bitIndex ? `.${selected.bitIndex}` : ""} / ${selected.pduAddress || "--"}`],
                  [isZh ? "解码" : "Decode", `${selected.dataType} · ${selected.byteOrder} · ×${selected.scale} + ${selected.offset}`],
                  [isZh ? "采集端值" : "Collector", `${selected.collectorValue}${selected.unit ? ` ${selected.unit}` : ""} · ${selected.collectorQuality}`],
                  [isZh ? "后端值" : "Backend", `${selected.backendValue}${selected.unit ? ` ${selected.unit}` : ""} · ${selected.backendQuality}`],
                  [isZh ? "页面绑定" : "Page binding", selected.pagePath],
                  [isZh ? "契约成员" : "Contract member", selected.contractMember === null ? "--" : selected.contractMember ? "YES" : "NO"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div className="text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</div>
                    <div className="mt-1 break-words rounded-lg bg-slate-50 px-3 py-2 font-mono text-[10px] font-bold text-slate-700 dark:bg-white/5 dark:text-slate-200">{value}</div>
                  </div>
                ))}
              </div>
            </>
          ) : <div className="mt-6 text-xs text-slate-400">--</div>}
        </aside>
      </div>
    </div>
  );
};

export default LivePointMappingPanel;
