import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Settings2, SlidersHorizontal } from "lucide-react";
import { useTrendData } from "./hooks/useRealTimeData";
import { useLanguage } from "./hooks/useLanguage";
import { useUnitSystem } from "./hooks/useUnitSystem";

const metricCatalog = {
  power: { label: "Electric Power", color: "#0058bc", unitType: "power", apiMetrics: ["power"] },
  kw: { label: "Kilowatts", color: "#4cd7d0", unit: "kW", apiMetrics: ["power"] },
  rpm: { label: "RPM", color: "#7c3aed", unit: "RPM", apiMetrics: ["CMMS01_Engine Speed"] },
  exhaustTemp: {
    label: "Exhaust Temp",
    color: "#dc2626",
    unitType: "temperature",
    apiMetrics: ["CMMS01_Exhaust Temp. LB", "CMMS01_Exhaust Temp. RB "],
  },
  pressure: { label: "Pressure", color: "#0f766e", unitType: "pressure", apiMetrics: ["CMMS01_Lube Oil Press"] },
  lubeOilPressure: { label: "Lube Oil Press", color: "#2563eb", unitType: "pressure", apiMetrics: ["CMMS01_Lube Oil Press"] },
  coolantTemp: { label: "Coolant Temp", color: "#0891b2", unitType: "temperature", apiMetrics: ["CMMS01_Coolant Temperature"] },
  lubeOilTemp: {
    label: "Lube Oil Temp",
    color: "#9333ea",
    unitType: "temperature",
    apiMetrics: ["CMMS01_Lubricating Oil Temperature"],
  },
  fuelPressure: { label: "Fuel Pressure", color: "#ca8a04", unitType: "pressure", apiMetrics: ["CMMS01_Fuel CMMSlivery Pressure"] },
  fuelTemp: { label: "Fuel Temp", color: "#f97316", unitType: "temperature", apiMetrics: ["CMMS01_Fuel Temperature"] },
  load: { label: "Engine Load", color: "#16a34a", unit: "%", apiMetrics: ["load"] },
  vesselSpeed: { label: "Vessel Speed", color: "#14b8a6", unit: "kn", apiMetrics: ["vesselSpeed"] },
  windSpeed: { label: "Wind Speed", color: "#64748b", unit: "kn", apiMetrics: ["windSpeed"] },
};

const buildSeries = (data, key, formatUnit) =>
  data.map((point) => {
    const raw =
      {
        power: point.power,
        kw: point.power,
        rpm: point.rpm,
        exhaustTemp: point.exhaustTemp ?? point.temperature,
        pressure: point.pressure > 20 ? point.pressure / 10 : point.pressure,
        lubeOilPressure: point.lubeOilPressure,
        coolantTemp: point.coolantTemp,
        lubeOilTemp: point.lubeOilTemp,
        fuelPressure: point.fuelPressure,
        fuelTemp: point.fuelTemp,
        load: point.load,
        vesselSpeed: point.vesselSpeed,
        windSpeed: point.windSpeed,
      }[key] ?? point.power;
    const meta = metricCatalog[key];
    const converted = meta.unitType ? formatUnit(meta.unitType, raw, key === "power" ? 0 : 1) : { value: raw, unit: meta.unit };
    return {
      time: point.time,
      raw,
      value: Number(String(converted.value).replace(/,/g, "")) || raw,
      unit: converted.unit || meta.unit,
    };
  });

const pad2 = (value) => String(value).padStart(2, "0");

const toDateInputValue = (date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const toApiDateTime = (dateValue, endOfDay = false) => {
  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(year, month - 1, day, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0);
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absOffset = Math.abs(offsetMinutes);
  const offset = `${sign}${pad2(Math.floor(absOffset / 60))}:${pad2(absOffset % 60)}`;

  return `${toDateInputValue(date)}T${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}${offset}`;
};

const rangeOptions = [
  { key: "week", days: 7, zh: "一星期", en: "Week" },
  { key: "month", days: 31, zh: "一个月", en: "Month" },
  { key: "quarter", days: 92, zh: "季度", en: "Quarter" },
  { key: "halfYear", days: 183, zh: "半年", en: "Half Year" },
  { key: "year", days: 365, zh: "一年", en: "Year" },
];

const TrendChart = ({ title, data, metrics, startDate, endDate, rangeLabel, onOpenSettings }) => {
  const { formatUnit } = useUnitSystem();
  const [hover, setHover] = useState(null);
  const width = 720;
  const height = 260;
  const padding = 34;

  const filteredData = useMemo(() => {
    if (!data.length) return [];
    const start = new Date(`${startDate}T00:00:00`).getTime();
    const end = new Date(`${endDate}T23:59:59`).getTime();
    return data.filter((point) => point.time.getTime() >= start && point.time.getTime() <= end);
  }, [data, startDate, endDate]);

  const series = metrics.map((key) => ({
    key,
    ...metricCatalog[key],
    points: buildSeries(filteredData, key, formatUnit),
  }));

  const allValues = series.flatMap((item) => item.points.map((point) => point.value));
  const min = Math.min(...allValues, 0);
  const max = Math.max(...allValues, 1);
  const range = max - min || 1;
  const pointCount = Math.max(filteredData.length - 1, 1);

  const pathFor = (points) =>
    points
      .map((point, index) => {
        const x = padding + (index / pointCount) * (width - padding * 2);
        const y = padding + ((max - point.value) / range) * (height - padding * 2);
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");

  const hoverIndex = hover === null ? null : Math.round((hover / width) * pointCount);
  const hoverX = hoverIndex === null ? null : padding + (hoverIndex / pointCount) * (width - padding * 2);

  return (
    <div className="flex min-h-0 flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-surface-container-lowest">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-on-surface">{title}</h3>
          <p className="text-[10px] text-slate-400">
            {rangeLabel} / {filteredData[0]?.time.toLocaleDateString() || "--"} -
            {" "}{filteredData[filteredData.length - 1]?.time.toLocaleDateString() || "--"}
          </p>
        </div>
        <div className="flex items-start gap-2">
          <div className="flex max-w-[520px] flex-wrap justify-end gap-2">
            {series.map((item) => (
              <span key={item.key} className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-500">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                {item.label}
              </span>
            ))}
          </div>
          <button
            onClick={onOpenSettings}
            className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-500 transition hover:border-[#4cd7d0] hover:text-[#0058bc] dark:border-white/10 dark:bg-surface-container-low"
            title="Curve Settings"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-full min-h-0 w-full"
          preserveAspectRatio="none"
          onMouseMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            setHover(((event.clientX - rect.left) / rect.width) * width);
          }}
          onMouseLeave={() => setHover(null)}
        >
          {[0.25, 0.5, 0.75].map((pct) => (
            <line
              key={pct}
              x1={padding}
              x2={width - padding}
              y1={padding + pct * (height - padding * 2)}
              y2={padding + pct * (height - padding * 2)}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
          ))}
          {series.map((item) => (
            <motion.path
              key={item.key}
              d={pathFor(item.points)}
              fill="none"
              stroke={item.color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6 }}
            />
          ))}
          {hoverX !== null && (
            <line x1={hoverX} x2={hoverX} y1={padding} y2={height - padding} stroke="#1f2937" strokeDasharray="4 4" />
          )}
        </svg>

        {hoverIndex !== null && filteredData[hoverIndex] && (
          <div className="absolute right-3 top-3 rounded-lg border border-slate-200 bg-white/95 p-2 text-[10px] shadow-lg dark:border-white/10 dark:bg-surface-container-low">
            <div className="mb-1 font-bold text-slate-600 dark:text-on-surface">
              {filteredData[hoverIndex].time.toLocaleString([], { hour12: false })}
            </div>
            {series.map((item) => {
              const point = item.points[hoverIndex];
              return (
                <div key={item.key} className="flex min-w-[150px] justify-between gap-3">
                  <span style={{ color: item.color }}>{item.label}</span>
                  <b>{point?.value?.toLocaleString?.() || "--"} {point?.unit}</b>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const Trend = () => {
  const { language } = useLanguage();
  const now = useMemo(() => new Date(), []);
  const defaultStart = useMemo(() => new Date(now.getFullYear(), 0, 1), [now]);
  const defaultEnd = useMemo(() => new Date(now.getFullYear(), 2, 31), [now]);
  const [startDate, setStartDate] = useState(toDateInputValue(defaultStart));
  const [endDate, setEndDate] = useState(toDateInputValue(defaultEnd));
  const [rangeKey, setRangeKey] = useState("quarter");
  const [screenMode, setScreenMode] = useState("split");
  const [settingsScreen, setSettingsScreen] = useState(null);
  const [screenMetrics, setScreenMetrics] = useState({
    screenA: ["power", "rpm"],
    screenB: ["kw", "exhaustTemp"],
  });

  const activeScreenKeys = useMemo(
    () => (screenMode === "single" ? ["screenA"] : ["screenA", "screenB"]),
    [screenMode]
  );
  const requestedMetrics = useMemo(
    () =>
      Array.from(
        new Set(
          activeScreenKeys
            .flatMap((screenKey) => screenMetrics[screenKey] || [])
            .flatMap((metricKey) => metricCatalog[metricKey]?.apiMetrics || [metricKey])
        )
      ),
    [activeScreenKeys, screenMetrics]
  );
  const trendData = useTrendData({
    start: toApiDateTime(startDate),
    end: toApiDateTime(endDate, true),
    metrics: requestedMetrics,
    points: 730,
    engineCode: "CMMS01",
  });

  const toggleMetric = (screen, key) => {
    setScreenMetrics((prev) => {
      const current = prev[screen];
      const next = current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key];
      return { ...prev, [screen]: next.length ? next : current };
    });
  };

  const screens = screenMode === "single"
    ? [{ key: "screenA", title: language === "zh" ? "趋势屏幕 1" : "Trend Screen 1" }]
    : [
        { key: "screenA", title: language === "zh" ? "趋势屏幕 1" : "Trend Screen 1" },
        { key: "screenB", title: language === "zh" ? "趋势屏幕 2" : "Trend Screen 2" },
      ];

  const selectedRange = rangeOptions.find((option) => option.key === rangeKey) || rangeOptions[2];
  const rangeLabel = language === "zh" ? selectedRange.zh : selectedRange.en;
  const applyRangeLength = (key) => {
    const option = rangeOptions.find((item) => item.key === key) || rangeOptions[2];
    setRangeKey(key);
    const start = new Date(`${startDate}T00:00:00`);
    const nextEnd = new Date(start.getTime() + (option.days - 1) * 86400000);
    setEndDate(toDateInputValue(nextEnd));
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden px-4 pb-4 pt-2 bg-[#F5F6F8] dark:bg-background">
      <div className="mb-3 flex shrink-0 items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-sm dark:bg-surface-container-lowest">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-[#4cd7d0]" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-on-surface">
            {language === "zh" ? "曲线配置" : "Curve Config"}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <label className="text-[10px] font-bold uppercase text-slate-400">
            {language === "zh" ? "起始日期" : "Start Date"}
            <input
              type="date"
              value={startDate}
              onChange={(event) => {
                setStartDate(event.target.value);
                const option = rangeOptions.find((item) => item.key === rangeKey) || rangeOptions[2];
                const start = new Date(`${event.target.value}T00:00:00`);
                setEndDate(toDateInputValue(new Date(start.getTime() + (option.days - 1) * 86400000)));
              }}
              className="ml-2 rounded border border-slate-200 px-2 py-1 text-slate-700"
            />
          </label>
          <label className="text-[10px] font-bold uppercase text-slate-400">
            {language === "zh" ? "结束日期" : "End Date"}
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="ml-2 rounded border border-slate-200 px-2 py-1 text-slate-700"
            />
          </label>
          <label className="text-[10px] font-bold uppercase text-slate-400">
            {language === "zh" ? "时间长度" : "Range Length"}
            <select
              value={rangeKey}
              onChange={(event) => applyRangeLength(event.target.value)}
              className="ml-2 rounded border border-slate-200 px-2 py-1 text-slate-700"
            >
              {rangeOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {language === "zh" ? option.zh : option.en}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={() => setScreenMode(screenMode === "single" ? "split" : "single")}
            className="rounded-lg bg-[#1A1B1F] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white"
          >
            {screenMode === "single" ? (language === "zh" ? "分屏" : "Split") : (language === "zh" ? "单屏" : "Single")}
          </button>
        </div>
      </div>

      <div className={`grid min-h-0 flex-1 gap-3 ${screenMode === "split" ? "grid-cols-1 grid-rows-2" : "grid-cols-1 grid-rows-1"}`}>
        {screens.map((screen) => (
          <div key={screen.key} className="flex min-h-0 flex-col gap-2">
            {settingsScreen === screen.key && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-surface-container-lowest"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    {language === "zh" ? `${screen.title} 参数配置` : `${screen.title} Metrics`}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {language === "zh" ? `已选 ${screenMetrics[screen.key].length} 项` : `${screenMetrics[screen.key].length} selected`}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 lg:grid-cols-5 xl:grid-cols-7">
                  {Object.entries(metricCatalog).map(([key, meta]) => {
                    const selected = screenMetrics[screen.key].includes(key);
                    return (
                      <button
                        key={key}
                        onClick={() => toggleMetric(screen.key, key)}
                        className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-[10px] font-bold uppercase tracking-wider transition ${
                          selected
                            ? "border-transparent text-white"
                            : "border-slate-200 bg-slate-50 text-slate-500 hover:border-[#4cd7d0] dark:border-white/10 dark:bg-surface-container-low"
                        }`}
                        style={selected ? { backgroundColor: meta.color } : {}}
                      >
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-current" />
                        <span className="min-w-0 leading-tight">{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
            <TrendChart
              title={screen.title}
              data={trendData}
              metrics={screenMetrics[screen.key]}
              startDate={startDate}
              endDate={endDate}
              rangeLabel={rangeLabel}
              onOpenSettings={() => setSettingsScreen(settingsScreen === screen.key ? null : screen.key)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Trend;
