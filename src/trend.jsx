import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useEngineData, useTrendData, useVesselData } from "./hooks/useRealTimeData";
import { useLanguage } from "./hooks/useLanguage";
import { TrendEngineModel } from "./YachtModel";

// Simple canvas-based line chart component
const LineChart = ({ data, color = "#4cd7d0", height = 80, showDots = false }) => {
  if (!data || data.length === 0) return <div className="h-20 bg-gray-50 rounded" />;

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const width = 300;
  const padding = 4;

  const points = data.map((d, i) => ({
    x: padding + (i / (data.length - 1)) * (width - padding * 2),
    y: padding + ((maxVal - d.value) / range) * (height - padding * 2),
    value: d.value,
    time: d.time,
  }));

  const pathData = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const lastPoint = points[points.length - 1];

  return (
    <div className="relative" style={{ height }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((pct) => (
          <line
            key={pct}
            x1={padding}
            y1={padding + pct * (height - padding * 2)}
            x2={width - padding}
            y2={padding + pct * (height - padding * 2)}
            stroke="#e5e7eb"
            strokeWidth="0.5"
          />
        ))}
        {/* Area fill */}
        <path
          d={`${pathData} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`}
          fill={color}
          fillOpacity="0.1"
        />
        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {showDots && points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i === points.length - 1 ? 3 : 1.5}
            fill={color}
          />
        ))}
      </svg>
    </div>
  );
};

// Mini stat card
const StatCard = ({ label, value, unit, color = "#1A1A1F" }) => (
  <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
    <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">{label}</p>
    <p className="text-xl font-bold" style={{ color }}>
      {value}
      <span className="text-xs font-normal text-gray-400 ml-1">{unit}</span>
    </p>
  </div>
);

const Trend = () => {
  const { t } = useLanguage();
  const [activeEngine, setActiveEngine] = useState("diesel1");
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState(null);
  const [isAILoading, setIsAILoading] = useState(false);

  // Curve visibility toggles
  const [curveVisibility, setCurveVisibility] = useState({
    fuel: true,
    power: true,
    rpm: false,
    temp: false,
  });

  const engines = useEngineData(2000);
  const vesselData = useVesselData(1000);
  const engine = engines[activeEngine];

  // Historical trend data (last 30 data points)
  const trendData = useTrendData(1, 30);

  // Build chart datasets
  const fuelChartData = useMemo(() =>
    trendData.map((d, i) => ({ value: d.pressure * 3 + Math.random() * 20, time: d.time })),
    [trendData]
  );
  const powerChartData = useMemo(() =>
    trendData.map((d) => ({ value: d.power, time: d.time })),
    [trendData]
  );
  const rpmChartData = useMemo(() =>
    trendData.map((d) => ({ value: d.rpm, time: d.time })),
    [trendData]
  );
  const tempChartData = useMemo(() =>
    trendData.map((d) => ({ value: d.temperature, time: d.time })),
    [trendData]
  );

  // Generate cylinder data from engine exhaust temperatures
  const cylinderData = useMemo(() => {
    if (!engine?.cylinders) return [];
    return engine.cylinders.map((temp, idx) => {
      const minTemp = 350;
      const maxTemp = 500;
      const height = Math.round(((temp - minTemp) / (maxTemp - minTemp)) * 30 + 60);
      return {
        id: `${t.cylinder}${String(idx + 1).padStart(2, '0')}`,
        height,
        temp,
      };
    });
  }, [engine?.cylinders, t.cylinder]);

  // Bottom metrics
  const bottomMetrics = useMemo(() => {
    if (!engine?.cylinders) {
      return [
        { label: t.maxExhTemp, value: "0", unit: "°C", detail: `${t.cylinder} --`, detailColor: "#0f6b00" },
        { label: t.minExhTemp, value: "0", unit: "°C", detail: `${t.cylinder} --`, detailColor: "#0f6b00" },
        { label: t.avgExhTemp, value: "0", unit: "°C", detail: t.normalRange, detailColor: "#0058bc" },
        { label: t.tempDev, value: "0", unit: "ΔT", detail: t.stable, detailColor: "#1A1A1F" },
        { label: t.turbochargerSpeed, value: "0", unit: "krpm", detail: t.loadOptimized, detailColor: "#0058bc" },
      ];
    }
    const temps = engine.cylinders;
    const maxTemp = Math.max(...temps);
    const minTemp = Math.min(...temps);
    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
    const deviation = maxTemp - minTemp;
    const maxIdx = temps.indexOf(maxTemp);
    const minIdx = temps.indexOf(minTemp);

    return [
      { label: t.maxExhTemp, value: maxTemp.toFixed(1), unit: "°C", detail: `${t.cylinder} ${String(maxIdx + 1).padStart(2, '0')}`, detailColor: maxTemp > 450 ? "#ba1a1a" : "#0f6b00" },
      { label: t.minExhTemp, value: minTemp.toFixed(1), unit: "°C", detail: `${t.cylinder} ${String(minIdx + 1).padStart(2, '0')}`, detailColor: "#0f6b00" },
      { label: t.avgExhTemp, value: avgTemp.toFixed(1), unit: "°C", detail: t.normalRange, detailColor: "#0058bc" },
      { label: t.tempDev, value: deviation.toFixed(1), unit: "ΔT", detail: deviation > 50 ? t.warning : t.stable, detailColor: deviation > 50 ? "#ba1a1a" : "#1A1A1F" },
      { label: t.turbochargerSpeed, value: engine.turboSpeed?.toFixed(1) || "0", unit: "krpm", detail: t.loadOptimized, detailColor: "#0058bc" },
    ];
  }, [engine, t]);

  const engineTypeButtons = [
    { key: "diesel1", label: t.diesel1 },
    { key: "diesel2", label: t.diesel2 },
    { key: "aux1", label: t.auxGen1 },
    { key: "aux2", label: t.auxGen2 },
  ];

  const toggleCurve = (key) => {
    setCurveVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // AI query handler — placeholder for future AI integration
  const handleAIQuery = async () => {
    if (!aiQuery.trim()) return;
    setIsAILoading(true);
    setAiResponse(null);
    // Simulate AI response
    setTimeout(() => {
      setAiResponse({
        tip: t.energySavingTip,
        suggestion: `Based on current load of ${engine?.load || 0}%, reducing RPM by 5% could save approximately ${Math.round((engine?.fuelRate || 0) * 0.08)} L/h while maintaining optimal propulsion efficiency.`,
        rpmAdvice: `Optimal RPM: ${Math.round((engine?.rpm || 850) * 0.97)} - ${Math.round((engine?.rpm || 850) * 1.02)}`,
        confidence: 87,
      });
      setIsAILoading(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden px-4 pb-4 pt-2 bg-[#F5F6F8] dark:bg-background">
      {/* Main Content Area */}
      <main className="flex flex-row flex-1 min-h-0 gap-3 relative items-stretch">
        {/* Left Sidebar - Engine Selection */}
        <aside className="flex flex-col w-24 xl:w-28 shrink-0 space-y-2 z-20 justify-center">
          {engineTypeButtons.map((btn) => (
            <button
              key={btn.key}
              onClick={() => setActiveEngine(btn.key)}
              className={`${
                activeEngine === btn.key
                  ? "bg-[#1a1b1f] text-white rounded-full px-3 py-2 text-xs font-bold tracking-wider uppercase shadow-lg text-left flex items-center justify-between border-2 border-[#4cd7d0]"
                  : "bg-white text-[#1A1B1F]/60 rounded-full px-3 py-2 text-xs font-bold tracking-wider uppercase shadow-sm text-left hover:bg-gray-50 transition-colors"
              }`}
            >
              {btn.label}
              {activeEngine === btn.key && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7d0] shadow-[0_0_8px_rgba(76,215,208,0.8)]"></span>
              )}
            </button>
          ))}

          {/* AI Button */}
          <button
            onClick={() => setShowAIPanel(!showAIPanel)}
            className={`mt-2 rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              showAIPanel
                ? "bg-[#4cd7d0] text-[#00201e] shadow-lg"
                : "bg-white text-[#1A1B1F]/60 shadow-sm"
            }`}
          >
            <span className="material-symbols-outlined text-sm">psychology</span>
            {t.aiOptimization}
          </button>
        </aside>

        {/* Center: Main Visualization */}
        <section className="flex-1 flex flex-col min-h-0 bg-white dark:bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden pt-3 pb-3 px-4 gap-3">
          {/* Engine Type Buttons + Curve Toggles */}
          <div className="flex flex-wrap gap-2 justify-between items-center shrink-0">
            <div className="flex flex-wrap gap-2 justify-center">
              {engineTypeButtons.map((btn) => (
            <button
              key={btn.key}
              onClick={() => setActiveEngine(btn.key)}
              className={`rounded-full px-4 py-1.5 text-[10px] font-bold tracking-wider uppercase shadow-sm transition-colors ${
                activeEngine === btn.key
                  ? "bg-[#1a1b1f] dark:bg-surface-container-low text-white dark:text-on-surface"
                  : "bg-[#dfe4ea] dark:bg-surface-container-low text-[#1A1B1F]/60 dark:text-on-surface/60 hover:bg-gray-200 dark:hover:bg-dark-surface-container"
              }`}
            >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Curve toggles */}
            <div className="flex gap-2 items-center">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{t.selectMetrics}:</span>
              {[
                { key: "fuel", label: t.fuelConsumptionCurve, color: "#f59e0b" },
                { key: "power", label: t.actualPowerCurve, color: "#4cd7d0" },
                { key: "rpm", label: t.rpm, color: "#8b5cf6" },
                { key: "temp", label: t.exhTemp, color: "#ef4444" },
              ].map((curve) => (
                <button
                  key={curve.key}
                  onClick={() => toggleCurve(curve.key)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all ${
                    curveVisibility[curve.key]
                      ? "text-white shadow-sm"
                      : "bg-gray-100 text-gray-400"
                  }`}
                  style={curveVisibility[curve.key] ? { backgroundColor: curve.color } : {}}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: curveVisibility[curve.key] ? "rgba(255,255,255,0.8)" : curve.color,
                      opacity: curveVisibility[curve.key] ? 0.9 : 0.4,
                    }}
                  />
                  {curve.label}
                </button>
              ))}
            </div>
          </div>

          {/* Trend Charts Row */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            {curveVisibility.fuel && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#fffbeb] rounded-xl p-3 border border-yellow-100"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span className="text-[9px] font-bold text-gray-600 uppercase tracking-wider">
                    {t.fuelConsumptionCurve}
                  </span>
                  <span className="ml-auto text-[10px] font-bold text-yellow-600">
                    {engine?.fuelRate?.toFixed(1) || 0} L/h
                  </span>
                </div>
                <LineChart data={fuelChartData} color="#f59e0b" height={70} />
              </motion.div>
            )}
            {curveVisibility.power && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#f0fffe] rounded-xl p-3 border border-teal-100"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-[#4cd7d0]" />
                  <span className="text-[9px] font-bold text-gray-600 uppercase tracking-wider">
                    {t.actualPowerCurve}
                  </span>
                  <span className="ml-auto text-[10px] font-bold text-teal-600">
                    {(engine?.power || 0).toLocaleString()} {t.kw}
                  </span>
                </div>
                <LineChart data={powerChartData} color="#4cd7d0" height={70} />
              </motion.div>
            )}
            {curveVisibility.rpm && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#faf5ff] rounded-xl p-3 border border-purple-100"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <span className="text-[9px] font-bold text-gray-600 uppercase tracking-wider">{t.rpm}</span>
                  <span className="ml-auto text-[10px] font-bold text-purple-600">{engine?.rpm || 0}</span>
                </div>
                <LineChart data={rpmChartData} color="#8b5cf6" height={70} />
              </motion.div>
            )}
            {curveVisibility.temp && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 rounded-xl p-3 border border-red-100"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-[9px] font-bold text-gray-600 uppercase tracking-wider">{t.exhTemp}</span>
                  <span className="ml-auto text-[10px] font-bold text-red-600">{engine?.exhaustTemp?.toFixed(1) || 0}°C</span>
                </div>
                <LineChart data={tempChartData} color="#ef4444" height={70} />
              </motion.div>
            )}
          </div>

          {/* Vertical Cylinder Bars */}
          <div className="flex justify-between items-end h-20 px-4 w-full shrink-0">
            {cylinderData.map((cylinder, idx) => (
              <motion.div
                key={cylinder.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="flex flex-col items-center gap-0.5"
              >
                <div className="w-2.5 h-16 bg-[#c8ccd4] rounded-full relative overflow-hidden">
                  <motion.div
                    className="absolute bottom-0 w-full rounded-full"
                    initial={{ height: 0 }}
                    animate={{ height: `${cylinder.height}%` }}
                    transition={{ duration: 0.5, delay: idx * 0.03, ease: "easeOut" }}
                    style={{
                      backgroundColor: cylinder.temp > 450 ? '#ba1a1a' : cylinder.temp > 420 ? '#0058bc' : '#0f6b00',
                      boxShadow: `0 0 8px ${cylinder.temp > 450 ? 'rgba(186,26,26,0.6)' : 'rgba(0,112,235,0.6)'}`,
                    }}
                  />
                </div>
                <span className="text-[8px] font-bold text-[#414755]">{cylinder.id}</span>
              </motion.div>
            ))}
          </div>

          {/* Engine Image + Temperature Panel */}
          <div className="flex-1 min-h-0 flex gap-3">
            <div className="relative flex-1 min-h-0 rounded-xl overflow-hidden border border-[#c8ccd4] shadow-sm bg-[#f8f9fb] flex items-center justify-center" style={{ minHeight: '200px' }}>
              <div className="w-full h-full">
                <TrendEngineModel />
              </div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="absolute bottom-2 left-1/2 -translate-x-1/2"
              >
                <div className="bg-white border border-gray-200 rounded-full px-3 py-1 flex items-center gap-2 shadow-md">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#79ff5b] animate-pulse"></div>
                  <span className="text-[8px] font-medium text-[#1A1B1F]">{t.thermalAnalysis}</span>
                  <div className="w-px h-2 bg-gray-300 mx-1"></div>
                  <span className="text-[7px] uppercase tracking-wider text-gray-500">
                    {new Date().toLocaleTimeString('en-US', { hour12: false })}
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Temperature Comparison Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="w-56 bg-white/90 backdrop-blur-md rounded-xl p-3 shadow-lg border border-gray-200 shrink-0"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-[#0058bc] text-sm">analytics</span>
                <h3 className="text-[9px] font-bold text-[#191c1e] uppercase tracking-wider">
                  {t.cylinderTemperature}
                </h3>
              </div>
              <div className="space-y-2">
                {["MAX", "MIN"].map((label, idx) => {
                  const val = label === "MAX"
                    ? engine?.cylinders ? Math.max(...engine.cylinders) : 0
                    : engine?.cylinders ? Math.min(...engine.cylinders) : 0;
                  return (
                    <div key={label} className="flex items-center gap-2">
                      <span className="text-[8px] font-bold w-6 text-[#414755]">{label}</span>
                      <div className="flex-1 h-3 bg-[#dfe4ea] rounded-sm overflow-hidden">
                        <motion.div
                          className="h-full bg-[#0058bc]"
                          initial={{ width: 0 }}
                          animate={{ width: `${(val / 500) * 100}%` }}
                          transition={{ duration: 1, delay: 0.7 + idx * 0.2, ease: "easeOut" }}
                        />
                      </div>
                      <span className="text-[10px] font-bold w-10 text-right text-[#191c1e]">{val}°C</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 pt-2 border-t border-[#191c1e]/10 flex justify-between">
                <div className="text-center">
                  <p className="text-[7px] uppercase tracking-widest text-[#414755]">{t.sensors}</p>
                  <p className="text-[9px] font-bold text-[#0f6b00]">{t.active}</p>
                </div>
                <div className="text-center">
                  <p className="text-[7px] uppercase tracking-widest text-[#414755]">{t.deviation}</p>
                  <p className="text-[9px] font-bold text-[#191c1e]">
                    {engine?.cylinders ? (Math.max(...engine.cylinders) - Math.min(...engine.cylinders)).toFixed(0) : 0}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[7px] uppercase tracking-widest text-[#414755]">{t.threshold}</p>
                  <p className="text-[9px] font-bold text-[#ba1a1a]">450°C</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Right Sidebar - Status + AI Panel */}
        <aside className="w-48 xl:w-52 shrink-0 flex flex-col gap-2 z-20 justify-center">
          {/* Power Output Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#2e3132] dark:bg-surface-container-lowest rounded-xl p-3 shadow-xl"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-[9px] font-bold text-gray-300 uppercase tracking-wider">{t.operationStatus}</span>
              <span className="material-symbols-outlined text-[#79ff5b] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>radar</span>
            </div>
            <div className="bg-white/10 rounded-lg p-2 border border-white/10">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-[8px] text-gray-400 uppercase tracking-wider">{t.powerOutput}</p>
                  <p className="text-base font-bold text-[#79ff5b]">{(engine?.power || 0).toLocaleString()} {t.kw}</p>
                </div>
                <p className="text-[10px] font-bold text-[#79ff5b]">{engine?.load || 0}% {t.load}</p>
              </div>
              <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#79ff5b]"
                  initial={{ width: 0 }}
                  animate={{ width: `${engine?.load || 0}%` }}
                  transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                  style={{ boxShadow: "0 0 6px #79ff5b" }}
                />
              </div>
            </div>
          </motion.div>

          {/* Diagnostics Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#2e3132] rounded-xl p-3 shadow-xl border border-white/10"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-gray-400 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
              <span className="text-[9px] font-bold text-gray-300 uppercase tracking-wider">{t.diagnosis}</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-[9px] text-gray-400">{t.tempDeviation}</span>
                <span className="text-[9px] font-bold text-[#79ff5b]">{t.normal}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-[9px] text-gray-400">{t.firingPressure}</span>
                <span className="text-[9px] text-gray-300">{engine?.torque?.toFixed(1) || 0} {t.bar}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-[9px] text-gray-400">{t.lubOilPressure}</span>
                <span className="text-[9px] text-gray-300">{engine?.oilPressure?.toFixed(1) || 0} {t.bar}</span>
              </div>
            </div>
          </motion.div>

          {/* Vitals Status */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#2e3132] rounded-xl p-3 shadow-xl mt-auto"
          >
            <div className="flex items-center gap-2 text-[#79ff5b] font-bold mb-1.5">
              <span className="material-symbols-outlined text-sm">vital_signs</span>
              <span className="text-[8px] uppercase tracking-wider">{t.vitalsNominal}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400 opacity-60">
              <span className="material-symbols-outlined text-sm">error</span>
              <span className="text-[8px] uppercase tracking-wider">{t.activeAlarmsZero}</span>
            </div>
          </motion.div>
        </aside>
      </main>

      {/* Bottom: 5 Status Cards */}
      <footer className="grid grid-cols-5 gap-3 mt-2 w-full">
        {bottomMetrics.map((metric, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white dark:bg-surface-container-lowest rounded-xl p-3 shadow-sm border border-gray-100 dark:border-dark-surface-variant flex flex-col justify-between"
          >
            <span className="text-[9px] font-bold text-gray-400 dark:text-on-surface-variant uppercase tracking-wider">{metric.label}</span>
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-0.5">
                <span className="text-lg font-bold text-[#1A1B1F] dark:text-on-surface">{metric.value}</span>
                <span className="text-[10px] text-gray-400">{metric.unit}</span>
              </div>
              <span className="text-[8px] font-bold" style={{ color: metric.detailColor }}>{metric.detail}</span>
            </div>
          </motion.div>
        ))}
      </footer>
    </div>
  );
};

export default Trend;
