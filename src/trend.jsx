import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Settings2 } from "lucide-react";
import { useTrendData } from "./hooks/useRealTimeData";
import { useLanguage } from "./hooks/useLanguage";
import { useUnitSystem } from "./hooks/useUnitSystem";

const metricCatalog = {
  power: { label: "Electric Power", color: "#0058bc", unitType: "power" },
  kw: { label: "Kilowatts", color: "#4cd7d0", unit: "kW" },
  rpm: { label: "RPM", color: "#7c3aed", unit: "RPM" },
  exhaustTemp: { label: "Exhaust Temp", color: "#dc2626", unitType: "temperature" },
  pressure: { label: "Pressure", color: "#0f766e", unitType: "pressure" },
};

const buildSeries = (data, key, formatUnit) =>
  data.map((point) => {
    const raw =
      key === "power" || key === "kw"
        ? point.power
        : key === "rpm"
        ? point.rpm
        : key === "exhaustTemp"
        ? point.temperature
        : point.pressure / 10;
    const meta = metricCatalog[key];
    const converted = meta.unitType ? formatUnit(meta.unitType, raw, key === "power" ? 0 : 1) : { value: raw, unit: meta.unit };
    return {
      time: point.time,
      raw,
      value: Number(String(converted.value).replace(/,/g, "")) || raw,
      unit: converted.unit || meta.unit,
    };
  });

const TrendChart = ({ title, data, metrics, startOffsetMinutes, durationMinutes }) => {
  const { formatUnit } = useUnitSystem();
  const [hover, setHover] = useState(null);
  const width = 720;
  const height = 260;
  const padding = 34;

  const filteredData = useMemo(() => {
    if (!data.length) return [];
    const end = data[data.length - 1].time.getTime() - startOffsetMinutes * 60000;
    const start = end - durationMinutes * 60000;
    return data.filter((point) => point.time.getTime() >= start && point.time.getTime() <= end);
  }, [data, startOffsetMinutes, durationMinutes]);

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
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-on-surface">{title}</h3>
          <p className="text-[10px] text-slate-400">
            {durationMinutes} min / {filteredData[0]?.time.toLocaleTimeString([], { hour12: false }) || "--"} -
            {" "}{filteredData[filteredData.length - 1]?.time.toLocaleTimeString([], { hour12: false }) || "--"}
          </p>
        </div>
        <div className="flex gap-2">
          {series.map((item) => (
            <span key={item.key} className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-500">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-full min-h-[220px] w-full"
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
  const trendData = useTrendData(2, 160);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [startOffsetMinutes, setStartOffsetMinutes] = useState(0);
  const [screenMode, setScreenMode] = useState("split");
  const [screenMetrics, setScreenMetrics] = useState({
    screenA: ["power", "rpm"],
    screenB: ["kw", "exhaustTemp"],
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

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden px-4 pb-4 pt-2 bg-[#F5F6F8] dark:bg-background">
      <div className="mb-3 flex shrink-0 items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-sm dark:bg-surface-container-lowest">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-[#4cd7d0]" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-on-surface">
            {language === "zh" ? "曲线配置" : "Curve Config"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-[10px] font-bold uppercase text-slate-400">
            {language === "zh" ? "起始偏移" : "Start Offset"}
            <input
              type="number"
              min="0"
              max="120"
              value={startOffsetMinutes}
              onChange={(event) => setStartOffsetMinutes(Number(event.target.value))}
              className="ml-2 w-16 rounded border border-slate-200 px-2 py-1 text-slate-700"
            />
          </label>
          <label className="text-[10px] font-bold uppercase text-slate-400">
            {language === "zh" ? "显示长度" : "Window"}
            <select
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(Number(event.target.value))}
              className="ml-2 rounded border border-slate-200 px-2 py-1 text-slate-700"
            >
              {[15, 30, 60, 120].map((minutes) => (
                <option key={minutes} value={minutes}>{minutes} min</option>
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

      <div className={`grid min-h-0 flex-1 gap-3 ${screenMode === "split" ? "grid-cols-2" : "grid-cols-1"}`}>
        {screens.map((screen) => (
          <div key={screen.key} className="flex min-h-0 flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              {Object.entries(metricCatalog).map(([key, meta]) => (
                <button
                  key={key}
                  onClick={() => toggleMetric(screen.key, key)}
                  className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                    screenMetrics[screen.key].includes(key)
                      ? "text-white"
                      : "bg-white text-slate-400 dark:bg-surface-container-lowest"
                  }`}
                  style={screenMetrics[screen.key].includes(key) ? { backgroundColor: meta.color } : {}}
                >
                  {meta.label}
                </button>
              ))}
            </div>
            <TrendChart
              title={screen.title}
              data={trendData}
              metrics={screenMetrics[screen.key]}
              startOffsetMinutes={startOffsetMinutes}
              durationMinutes={durationMinutes}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Trend;
