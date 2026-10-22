import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Gauge,
  HardDrive,
  Radio,
  RefreshCw,
  Server,
  Wifi,
} from "lucide-react";
import IngestPipelineStatus from "./components/IngestPipelineStatus";
import HostResourceStatus from "./components/HostResourceStatus";
import { useLanguage } from "./hooks/useLanguage";

const browserHost = typeof window === "undefined" ? "127.0.0.1" : window.location.hostname;
const browserProtocol = typeof window === "undefined" ? "http:" : window.location.protocol;
const normalizeShipStatusBase = (value) => value.replace(/\/+$/, "").replace(/\/system-status$/, "");
const SHIP_STATUS_BASE_URL = normalizeShipStatusBase(
  process.env.REACT_APP_SHIP_STATUS_URL || `${browserProtocol}//${browserHost}:${process.env.REACT_APP_SHIP_STATUS_PORT || "8085"}`
);

const statusTone = {
  GOOD: {
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-300",
    value: "text-emerald-600 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-400/20",
  },
  STALE: {
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-300",
    value: "text-amber-600 dark:text-amber-300",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-400/20",
  },
  DEGRADED: {
    dot: "bg-orange-500",
    text: "text-orange-700 dark:text-orange-300",
    value: "text-orange-600 dark:text-orange-300",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    border: "border-orange-200 dark:border-orange-400/20",
  },
  OFFLINE: {
    dot: "bg-red-500",
    text: "text-red-700 dark:text-red-300",
    value: "text-red-600 dark:text-red-300",
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-400/20",
  },
  UNKNOWN: {
    dot: "bg-slate-400",
    text: "text-slate-600 dark:text-slate-300",
    value: "text-slate-600 dark:text-slate-300",
    bg: "bg-slate-50 dark:bg-slate-900/40",
    border: "border-slate-200 dark:border-white/10",
  },
};

const normalizeStatus = (value) => String(value || "UNKNOWN").toUpperCase();

const toneFor = (status) => statusTone[normalizeStatus(status)] || statusTone.UNKNOWN;

const formatTime = (value, language, withSeconds = true) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString(language === "zh" ? "zh-CN" : "en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: withSeconds ? "2-digit" : undefined,
    hour12: false,
  });
};

const formatAge = (ageSeconds, language) => {
  if (ageSeconds === null || ageSeconds === undefined || Number.isNaN(Number(ageSeconds))) return "--";
  const seconds = Math.max(0, Number(ageSeconds));
  if (seconds < 60) return language === "zh" ? `${seconds}s` : `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return language === "zh" ? `${minutes}m` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return language === "zh" ? `${hours}h` : `${hours}h`;
};

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "--";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
};

const statusApiUrl = () => `${SHIP_STATUS_BASE_URL}/system-status/api/status`;

const useShipSystemStatus = (intervalMs = 5000) => {
  const [state, setState] = useState({ data: null, status: "loading", error: "" });
  const loadingRef = useRef(false);

  const load = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setState((current) => ({ ...current, status: current.data ? "refreshing" : "loading", error: "" }));
    try {
      const response = await fetch(statusApiUrl(), {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      setState({ data: await response.json(), status: "success", error: "" });
    } catch (error) {
      setState((current) => ({
        ...current,
        status: "error",
        error: error.message || String(error),
      }));
    } finally {
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    load();
    const timer = intervalMs > 0 ? window.setInterval(load, intervalMs) : null;
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [intervalMs, load]);

  return { ...state, reload: load };
};

const StatusPill = ({ status }) => {
  const normalized = normalizeStatus(status);
  const tone = toneFor(normalized);
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase ${tone.text}`}>
      <span className={`h-2.5 w-2.5 rounded-full ${tone.dot}`} />
      {normalized}
    </span>
  );
};

const SummaryCard = ({ title, value, status, detail, icon: Icon }) => {
  const tone = toneFor(status);
  return (
    <article className="min-h-[112px] rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-surface-container-lowest">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase text-slate-400">{title}</div>
          <div className={`mt-3 truncate text-2xl font-black ${tone.value}`}>{value}</div>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone.bg} ${tone.text}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <StatusPill status={status} />
        <div className="truncate text-xs font-bold text-slate-500 dark:text-slate-300">{detail}</div>
      </div>
    </article>
  );
};

const Section = ({ title, right, children }) => (
  <section className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-surface-container-lowest">
    <div className="flex min-h-11 items-center justify-between gap-4 border-b border-slate-100 px-4 py-3 dark:border-white/10">
      <h3 className="text-sm font-black text-slate-950 dark:text-white">{title}</h3>
      {right && <div className="text-xs font-black text-slate-500 dark:text-slate-300">{right}</div>}
    </div>
    {children}
  </section>
);

const EmptyRow = ({ label }) => (
  <div className="px-4 py-6 text-sm font-bold text-slate-400">{label}</div>
);

const ShipSystemStatus = () => {
  const { language } = useLanguage();
  const isZh = language === "zh";
  const resource = useShipSystemStatus(5000);
  const data = resource.data || {};
  const overall = data.overall || {};
  const collector = data.collector || {};
  const modbus = data.modbus || {};
  const gnss = data.gnss || {};
  const transport = data.transport || {};
  const mqtts = transport.mqtts || {};
  const coap = transport.coap || {};
  const queue = data.queue || {};
  const freshness = data.freshness || {};
  const abnormalEvents = data.abnormalEvents || [];
  const services = data.localServices || [];
  const ports = data.ports || [];

  const summary = [
    {
      title: isZh ? "总体" : "Overall",
      value: normalizeStatus(overall.status),
      status: overall.status,
      detail: isZh ? `${abnormalEvents.length} 个事件` : `${abnormalEvents.length} events`,
      icon: overall.status === "GOOD" ? CheckCircle2 : AlertTriangle,
    },
    {
      title: isZh ? "采集" : "Collector",
      value: `${collector.goodCount ?? 0}/${collector.sampleCount ?? 0}`,
      status: collector.status,
      detail: formatTime(collector.latestSampleAt, language, false),
      icon: Activity,
    },
    {
      title: "SHIP-SHORE",
      value: transport.selected || "--",
      status: transport.status,
      detail: transport.currentClass || transport.currentTransportType || "--",
      icon: Radio,
    },
    {
      title: isZh ? "队列" : "Queue",
      value: `${queue.pending ?? "--"}`,
      status: queue.status,
      detail: isZh ? "pending" : "pending",
      icon: HardDrive,
    },
  ];

  const linkRows = [
    {
      channel: "MQTTs",
      status: mqtts.lastPublishOk === true ? "GOOD" : mqtts.lastPublishOk === false ? "DEGRADED" : transport.selected === "MQTTs" ? transport.status : "UNKNOWN",
      latest: mqtts.lastPublishAt,
      detail: mqtts.target || "--",
      samples: transport.selected === "MQTTs" ? transport.lastSampleCount : "--",
    },
    {
      channel: "CoAP",
      status: coap.lastSendOk === true ? "GOOD" : coap.lastSendOk === false ? "DEGRADED" : transport.selected === "CoAP" ? transport.status : "UNKNOWN",
      latest: coap.lastSendAt,
      detail: coap.target || "--",
      samples: coap.lastFrameCount ? `${coap.lastFrameCount} frames` : "--",
    },
  ];

  const freshnessRows = [
    [isZh ? "全部采集" : "Collector", freshness.collector, collector.latestSampleAt, `${collector.goodCount ?? 0} GOOD, ${collector.badCount ?? 0} BAD`],
    ["PLC/Modbus", freshness.modbus, modbus.latestSampleAt, `${modbus.goodCount ?? 0}/${modbus.expectedCount ?? 184} GOOD`],
    ["GNSS/NMEA", freshness.gnss, gnss.latestSampledAt, `${gnss.goodCount ?? 0}/${gnss.expectedCount ?? 8} GOOD, fix=${formatValue(gnss.fixValid)}`],
    [isZh ? "发送链路" : "Transport", freshness.transport, transport.lastSuccessAt, transport.selected || "--"],
  ];

  return (
    <main className="min-h-0 flex-1 overflow-auto px-4 pb-4 pt-2 text-slate-950 dark:text-white">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[#eef4f7] px-4 py-3 dark:bg-surface-container">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#d7f4f2] text-[#00736f] dark:bg-[#003734] dark:text-[#4cd7d0]">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-black">{isZh ? "系统状态" : "System Status"}</h2>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-300">
                {isZh ? "船端采集、发送、服务、端口、队列与数据新鲜度" : "Ship-side collection, transport, services, ports, queue and freshness"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right text-xs font-bold text-slate-500 dark:text-slate-300">
              <div>{formatTime(data.generatedAt, language)}</div>
              <div className="font-mono text-[10px] opacity-70">{SHIP_STATUS_BASE_URL}</div>
            </div>
            <button
              onClick={resource.reload}
              className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm hover:text-[#0058bc] dark:border-white/10 dark:bg-surface-container-lowest dark:text-slate-200"
              title={resource.error || (isZh ? "刷新" : "Refresh")}
            >
              <RefreshCw className={`h-4 w-4 ${resource.status === "refreshing" ? "animate-spin" : ""}`} />
              {isZh ? "刷新" : "Refresh"}
            </button>
          </div>
        </div>

        {resource.status === "error" && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-400/20 dark:bg-red-950/40 dark:text-red-200">
            {isZh ? "船端状态接口不可用：" : "Ship status API unavailable: "}{resource.error}
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {summary.map((item) => <SummaryCard key={item.title} {...item} />)}
        </div>

        <Section title={isZh ? "实时数据链路" : "Live Pipeline"} right={isZh ? "已移入状态页" : "embedded"}>
          <div className="p-3">
            <IngestPipelineStatus language={language} embedded />
          </div>
        </Section>

        <HostResourceStatus language={language} />

        <Section title={isZh ? "实时异常" : "Live Abnormal Events"} right={`${abnormalEvents.length} ${isZh ? "total" : "total"}`}>
          {abnormalEvents.length === 0 ? (
            <EmptyRow label={isZh ? "当前没有实时异常" : "No live abnormal events"} />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 dark:border-white/10">
                  <tr>
                    <th className="px-4 py-3">{isZh ? "类别" : "Category"}</th>
                    <th className="px-4 py-3">{isZh ? "级别" : "Severity"}</th>
                    <th className="px-4 py-3">{isZh ? "事件" : "Event"}</th>
                    <th className="px-4 py-3">{isZh ? "详情" : "Detail"}</th>
                    <th className="px-4 py-3">{isZh ? "观察时间" : "Observed"}</th>
                  </tr>
                </thead>
                <tbody>
                  {abnormalEvents.map((event, index) => (
                    <tr key={`${event.type}-${event.message}-${index}`} className="border-b border-slate-100 last:border-0 dark:border-white/10">
                      <td className="px-4 py-3 font-black">{event.type}</td>
                      <td className="px-4 py-3"><StatusPill status={event.status} /></td>
                      <td className="px-4 py-3 font-bold">{event.message}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500 dark:text-slate-300">{event.detail || "--"}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-300">{formatTime(event.observedAt, language)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        <div className="grid gap-3 xl:grid-cols-2">
          <Section title={isZh ? "通信链路" : "Communication Links"} right={`mode=${transport.network?.controlMode || "auto"}`}>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 dark:border-white/10">
                  <tr>
                    <th className="px-4 py-3">{isZh ? "通道" : "Channel"}</th>
                    <th className="px-4 py-3">{isZh ? "状态" : "Status"}</th>
                    <th className="px-4 py-3">{isZh ? "最近" : "Latest"}</th>
                    <th className="px-4 py-3">{isZh ? "目标" : "Target"}</th>
                    <th className="px-4 py-3">{isZh ? "样本/帧" : "Samples"}</th>
                  </tr>
                </thead>
                <tbody>
                  {linkRows.map((row) => (
                    <tr key={row.channel} className="border-b border-slate-100 last:border-0 dark:border-white/10">
                      <td className="px-4 py-3 font-black">{row.channel}</td>
                      <td className="px-4 py-3"><StatusPill status={row.status} /></td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatAge(row.latest ? Math.floor((Date.now() - new Date(row.latest).getTime()) / 1000) : null, language)} / {formatTime(row.latest, language, false)}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500 dark:text-slate-300">{row.detail}</td>
                      <td className="px-4 py-3 font-bold">{row.samples}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title={isZh ? "数据新鲜度" : "Data Freshness"}>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 dark:border-white/10">
                  <tr>
                    <th className="px-4 py-3">{isZh ? "数据" : "Data"}</th>
                    <th className="px-4 py-3">{isZh ? "状态" : "Status"}</th>
                    <th className="px-4 py-3">{isZh ? "最近" : "Latest"}</th>
                    <th className="px-4 py-3">{isZh ? "统计" : "Stats"}</th>
                  </tr>
                </thead>
                <tbody>
                  {freshnessRows.map(([label, state, latest, stats]) => (
                    <tr key={label} className="border-b border-slate-100 last:border-0 dark:border-white/10">
                      <td className="px-4 py-3 font-black">{label}</td>
                      <td className="px-4 py-3"><StatusPill status={state?.status} /></td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatTime(latest, language, false)}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500 dark:text-slate-300">{stats}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </div>

        <div className="grid gap-3 xl:grid-cols-2">
          <Section title={isZh ? "本机服务" : "Local Services"}>
            {services.length === 0 ? (
              <EmptyRow label={isZh ? "暂无服务状态" : "No service status"} />
            ) : (
              <div className="grid gap-2 p-3 md:grid-cols-2">
                {services.map((service) => (
                  <div key={service.name} className="rounded-lg border border-slate-100 px-3 py-3 dark:border-white/10">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <Server className="h-4 w-4 shrink-0 text-[#4cd7d0]" />
                        <div className="truncate text-xs font-black">{service.name}</div>
                      </div>
                      <StatusPill status={service.status} />
                    </div>
                    <div className="mt-2 truncate text-[11px] font-bold text-slate-500 dark:text-slate-300">{service.role}</div>
                    <div className="mt-1 truncate font-mono text-[10px] text-slate-400">pid={service.pid || "--"} · expected={String(Boolean(service.expected))}</div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title={isZh ? "端口、队列和目标" : "Ports, Queue and Targets"} right={`${queue.usagePercentage?.toFixed ? queue.usagePercentage.toFixed(1) : formatValue(queue.usagePercentage)}%`}>
            <div className="grid gap-3 p-3">
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-100 p-3 dark:border-white/10">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400"><HardDrive className="h-4 w-4" /> Queue</div>
                  <div className="mt-2 text-lg font-black">{queue.pending ?? "--"} <span className="text-xs text-slate-400">pending</span></div>
                </div>
                <div className="rounded-lg border border-slate-100 p-3 dark:border-white/10">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400"><Database className="h-4 w-4" /> Records</div>
                  <div className="mt-2 text-lg font-black">{queue.totalRecords ?? "--"}</div>
                </div>
                <div className="rounded-lg border border-slate-100 p-3 dark:border-white/10">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400"><Gauge className="h-4 w-4" /> Usage</div>
                  <div className="mt-2 text-lg font-black">{queue.usagePercentage?.toFixed ? queue.usagePercentage.toFixed(1) : formatValue(queue.usagePercentage)}%</div>
                </div>
              </div>
              <div className="max-h-72 overflow-auto rounded-lg border border-slate-100 dark:border-white/10">
                <table className="min-w-full text-left text-xs">
                  <thead className="sticky top-0 bg-white text-[10px] font-black uppercase text-slate-400 dark:bg-surface-container-lowest">
                    <tr>
                      <th className="px-3 py-2">{isZh ? "端口" : "Port"}</th>
                      <th className="px-3 py-2">{isZh ? "状态" : "Status"}</th>
                      <th className="px-3 py-2">{isZh ? "详情" : "Detail"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ports.map((port) => (
                      <tr key={`${port.name}-${port.port}`} className="border-t border-slate-100 dark:border-white/10">
                        <td className="px-3 py-2 font-mono text-[11px]">{port.address}:{port.port}/{port.protocol}</td>
                        <td className="px-3 py-2"><StatusPill status={port.status} /></td>
                        <td className="px-3 py-2 text-slate-500 dark:text-slate-300">{port.name} · {port.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Section>
        </div>

        <Section title={isZh ? "船端采集细节" : "Ship Collection Details"}>
          <div className="grid gap-3 p-3 md:grid-cols-3">
            <div className="rounded-lg border border-slate-100 p-3 dark:border-white/10">
              <div className="flex items-center justify-between"><span className="text-xs font-black">PLC/Modbus</span><StatusPill status={modbus.status} /></div>
              <div className="mt-3 font-mono text-xs text-slate-500 dark:text-slate-300">
                <div>{modbus.targetHost || "--"}:{modbus.targetPort || "--"}</div>
                <div>{modbus.goodCount ?? 0} GOOD / {modbus.badCount ?? 0} BAD</div>
              </div>
            </div>
            <div className="rounded-lg border border-slate-100 p-3 dark:border-white/10">
              <div className="flex items-center justify-between"><span className="text-xs font-black">GNSS/NMEA</span><StatusPill status={gnss.status} /></div>
              <div className="mt-3 font-mono text-xs text-slate-500 dark:text-slate-300">
                <div>{gnss.nmeaTarget || "--"}</div>
                <div>fix={formatValue(gnss.fixValid)} · lat={formatValue(gnss.hasLatitude)} · lon={formatValue(gnss.hasLongitude)}</div>
                <div>source={formatTime(gnss.latestSourceTimestamp, language, false)}</div>
              </div>
            </div>
            <div className="rounded-lg border border-slate-100 p-3 dark:border-white/10">
              <div className="flex items-center justify-between"><span className="text-xs font-black">{isZh ? "网络探测" : "Network Probe"}</span><StatusPill status={transport.status} /></div>
              <div className="mt-3 font-mono text-xs text-slate-500 dark:text-slate-300">
                <div className="flex items-center gap-1"><Wifi className="h-3.5 w-3.5" /> {transport.network?.testHost || "--"}:{transport.network?.testPort || "--"}</div>
                <div>latency={formatValue(transport.network?.latencyMs)}ms · loss={formatValue(transport.network?.packetLoss)}</div>
                <div><Clock className="mr-1 inline h-3.5 w-3.5" />{formatTime(transport.lastSuccessAt, language)}</div>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </main>
  );
};

export default ShipSystemStatus;
