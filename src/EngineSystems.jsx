import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useEngineData } from "./hooks/useRealTimeData";
import { useLanguage } from "./hooks/useLanguage";
import { EngineSystemsModel } from "./YachtModel";

const TrendIcon = () => (
  <svg width="28" height="14" viewBox="0 0 28 14" className="ml-2">
    <polyline
      points="0,12 8,6 14,9 20,3 28,7"
      fill="none"
      stroke="#ef4444"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <polygon points="25,7 28,7 28,10" fill="#ef4444" />
  </svg>
);

const RingProgress = ({ value, max = 1 }) => {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const filled = circ * Math.min(value / max, 1) * 0.75;
  const startOffset = circ * 0.25;

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" className="shrink-0">
      <circle cx="24" cy="24" r={r} fill="none" stroke="#e5e7eb" strokeWidth="4" />
      <circle
        cx="24"
        cy="24"
        r={r}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circ}`}
        strokeDashoffset={-startOffset}
        transform="rotate(-135 24 24)"
      />
      <text x="24" y="28" textAnchor="middle" fontSize="8" fill="#374151" fontWeight="bold">
        {(value * 100).toFixed(0)}%
      </text>
    </svg>
  );
};

const HalfGauge = ({ value, max = 5000, label }) => {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const dashLen = (circ / 2) * pct;
  const trackLen = circ / 2;

  return (
    <div className="flex flex-col items-center">
      <svg width="75" height="45" viewBox="0 0 75 45">
        <path
          d="M 8 40 A 30 30 0 0 1 67 40"
          fill="none"
          stroke="#2a2a2a"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <motion.path
          d="M 8 40 A 30 30 0 0 1 67 40"
          fill="none"
          stroke="#22c55e"
          strokeWidth="5"
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${trackLen}` }}
          animate={{ strokeDasharray: `${dashLen} ${trackLen}` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        <text x="37" y="36" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">
          {value.toLocaleString()}
        </text>
        <text x="37" y="46" textAnchor="middle" fontSize="6" fill="#9ca3af" fontWeight="bold" letterSpacing="1">
          kW
        </text>
      </svg>
      <span className="text-[8px] text-gray-400 uppercase tracking-widest mt-0.5">{label}</span>
    </div>
  );
};

const DiagnoseIndicator = ({ active }) => (
  <div className="flex items-center gap-1.5 mt-2">
    {["OK", "OK", "OK"].map((_, i) => (
      <div
        key={i}
        className={`h-2 flex-1 rounded-sm ${active ? "bg-green-500 shadow-[0_0_6px_#22c55e]" : "bg-gray-700"}`}
      />
    ))}
  </div>
);

const EngineSystems = () => {
  const { t } = useLanguage();
  const [activeEngine, setActiveEngine] = useState("diesel1");
  const [activeSystem, setActiveSystem] = useState(null);
  const [showParamCard, setShowParamCard] = useState(true);
  const engineData = useEngineData(2000);

  const handleSystemClick = (systemId) => {
    if (activeSystem === systemId) {
      setShowParamCard(false);
      setTimeout(() => {
        setActiveSystem(null);
        setShowParamCard(true);
      }, 200);
    } else {
      setActiveSystem(systemId);
      setShowParamCard(true);
    }
  };

  const systemMenu = [
    { id: "lubrication", label: t.lubrication, systemName: t.lubricationSystem },
    { id: "cooling", label: t.cooling, systemName: t.coolingSystem },
    { id: "fuel", label: t.fuel, systemName: t.fuelSystem },
    { id: "airIntake", label: t.airIntake, systemName: t.airIntakeSystem },
  ];

  const engines = [
    { id: "diesel1", label: t.dieselEngine1 },
    { id: "diesel2", label: t.dieselEngine2 },
    { id: "diesel3", label: t.dieselEngine3 },
    { id: "diesel4", label: t.dieselEngine4 },
  ];

  const systemParameters = {
    lubrication: [
      { label: t.lubeOilTemp, value: 85, unit: "°C", trend: "up" },
      { label: t.filterDiffPress, value: 0.52, unit: "bar", ring: 0.52 },
      { label: t.crankcasePress, value: 12.1, unit: "mmH2O" },
    ],
    cooling: [
      { label: t.coolantPressure, value: 3.2, unit: "bar" },
      { label: t.seaWaterPressure, value: 2.8, unit: "bar" },
    ],
    fuel: [
      { label: t.fuelDeliveryPress, value: 4.5, unit: "bar" },
      { label: t.fuelTemp, value: 38, unit: "°C" },
    ],
    airIntake: [
      { label: t.intakeManifoldPressLB, value: 2.4, unit: "bar" },
      { label: t.intakeManifoldTempLBF, value: 45, unit: "°C" },
      { label: t.barometricPress, value: 1.0, unit: "bar" },
    ],
  };

  const params = activeSystem ? systemParameters[activeSystem] || [] : [];
  const currentMeta = systemMenu.find((s) => s.id === activeSystem);

  // Dynamic bottom metrics based on engine data
  const dynamicBottomMetrics = [
    { label: t.coolantPress, value: engineData[activeEngine]?.coolantTemp?.toFixed(1) || "0", unit: "°C", barColor: "bg-blue-500", barPct: ((engineData[activeEngine]?.coolantTemp || 0) / 100) },
    { label: t.seaWaterPress, value: engineData[activeEngine]?.oilPressure?.toFixed(1) || "0", unit: "bar", barColor: "bg-blue-500", barPct: ((engineData[activeEngine]?.oilPressure || 0) / 5) },
    { label: t.manifoldPressLB, value: engineData[activeEngine]?.turboSpeed?.toFixed(1) || "0", unit: "krpm", barColor: "bg-green-500", barPct: ((engineData[activeEngine]?.turboSpeed || 0) / 25) },
    { label: t.exhaustTemp, value: engineData[activeEngine]?.exhaustTemp?.toFixed(0) || "0", unit: "°C", barColor: "bg-gray-400", barPct: ((engineData[activeEngine]?.exhaustTemp || 0) / 500) },
    { label: t.engineLoad, value: engineData[activeEngine]?.load || "0", unit: "%", barColor: "bg-green-500", barPct: ((engineData[activeEngine]?.load || 0) / 100) },
  ];

  // Hotspot positions (percentage-based on image)
  const hotspots = [
    { id: "lubrication", top: "35%", left: "25%", label: t.lubrication },
    { id: "cooling", top: "45%", left: "45%", label: t.cooling },
    { id: "fuel", top: "55%", left: "65%", label: t.fuel },
    { id: "airIntake", top: "25%", left: "75%", label: t.airIntake },
  ];

  return (
    <div className="flex-1 min-h-0 overflow-hidden relative bg-[#F5F6F8] dark:bg-background">

      {/* ─── Main Content ─────────────────────────────────── */}
      <main className="relative w-full h-[calc(100vh-11rem)] mt-3 px-6 pr-8">

        {/* 3.2 Left Controls */}
        <aside className="absolute left-6 top-0 bottom-[8rem] flex flex-col gap-6 z-30 justify-center">
          {/* Engine Selection */}
          <div className="flex flex-col gap-2">
            {engines.map((eng) => (
              <button
                key={eng.id}
                onClick={() => setActiveEngine(eng.id)}
                className={`rounded-full px-4 py-2.5 text-[10px] font-bold tracking-widest uppercase transition-all duration-200 whitespace-nowrap ${
                  activeEngine === eng.id
                    ? "bg-[#0A0A0A] dark:bg-surface-container-lowest text-white dark:text-on-surface shadow-lg"
                    : "bg-white dark:bg-surface-container-lowest text-[#0A0A0A] dark:text-on-surface/50 shadow-sm hover:bg-gray-50 dark:hover:bg-dark-surface-container-low"
                }`}
              >
                {eng.label}
              </button>
            ))}
          </div>

          {/* System Selection */}
          <div className="flex flex-col gap-1.5 mt-4">
            {systemMenu.map((sys) => (
              <button
                key={sys.id}
                onClick={() => handleSystemClick(sys.id)}
                className={`relative flex items-center gap-3 pl-4 pr-5 py-2.5 rounded-xl text-left transition-all duration-200 ${
                  activeSystem === sys.id
                    ? "bg-white dark:bg-surface-container-low shadow-md"
                    : "hover:bg-white/50 dark:hover:bg-dark-surface-container-low/50"
                }`}
              >
                {activeSystem === sys.id && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-blue-600 rounded-r-full"
                  />
                )}
                <span
                  className={`text-[11px] font-bold tracking-wider uppercase transition-colors duration-200 ${
                    activeSystem === sys.id ? "text-blue-600" : "text-gray-500"
                  }`}
                >
                  {sys.label}
                </span>
              </button>
            ))}
          </div>
        </aside>

        {/* 3.3 Center 3D Area - Higher z-index than bottom bar */}
        <section className="absolute inset-0 left-[20rem] right-[16rem] z-10 flex items-center justify-center" style={{ minHeight: '300px' }}>
          <div className="relative w-full h-full flex items-center justify-center">
            <EngineSystemsModel />

            {/* Interactive Hotspots */}
            {hotspots.map((hotspot) => (
              <button
                key={hotspot.id}
                onClick={() => handleSystemClick(hotspot.id)}
                className={`absolute w-14 h-14 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-all duration-300 cursor-pointer ${
                  activeSystem === hotspot.id
                    ? "border-blue-500 bg-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.6)]"
                    : "border-transparent hover:border-blue-400/60 hover:bg-blue-400/10"
                } ${activeSystem === null || activeSystem !== hotspot.id ? "animate-pulse" : ""}`}
                style={{ top: hotspot.top, left: hotspot.left }}
                title={hotspot.label}
              >
                <span className={`absolute inset-0 flex items-center justify-center text-[8px] font-bold uppercase tracking-wider ${
                  activeSystem === hotspot.id ? "text-white" : "text-white/70"
                }`}>
                  {hotspot.label.split(" ")[0]}
                </span>
              </button>
            ))}

            {/* Glassmorphism Floating Modal - High z-index, appears above bottom bar */}
            <AnimatePresence mode="wait">
              {activeSystem && showParamCard && (
                <motion.div
                  key={activeSystem}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -10 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className="absolute top-1/2 right-2 -translate-y-1/2 backdrop-blur-md bg-white/80 dark:bg-surface-container-low/90 border border-white/60 dark:border-dark-surface-variant shadow-2xl rounded-xl p-4 w-56 z-50"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shadow-[0_0_6px_#3b82f6]" />
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-700">
                      {currentMeta?.systemName}
                    </h3>
                    <button
                      onClick={() => handleSystemClick(activeSystem)}
                      className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {params.map((param, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center justify-between"
                      >
                        <div className="flex flex-col">
                          <span className="text-[9px] text-gray-400 uppercase tracking-wider">{param.label}</span>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="text-lg font-bold text-[#0A0A0A]">{param.value}</span>
                            <span className="text-[10px] text-gray-400 font-medium">{param.unit}</span>
                            {param.trend === "up" && <TrendIcon />}
                          </div>
                        </div>
                        {param.ring !== undefined && <RingProgress value={param.ring} />}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* 3.4 Right Status Panels — 3 compact cards with animation */}
        <aside className="absolute right-6 top-0 bottom-[8rem] flex flex-col gap-3 z-30 justify-center">
          {/* Card 1: Power Output */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#121212] dark:bg-surface-container-lowest rounded-xl p-3 shadow-xl w-44"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_6px_#22c55e] ${engineData[activeEngine]?.status === 'running' ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <span className="text-[9px] font-bold uppercase tracking-wider text-gray-300">
                {t.operationStatus}
              </span>
            </div>
            <HalfGauge value={engineData[activeEngine]?.power || 0} max={5000} label={t.powerOutputLabel} />
            <div className="mt-2 pt-2 border-t border-white/10">
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-gray-500 uppercase tracking-wider">{t.load}</span>
                <span className="text-xs font-bold text-white">{engineData[activeEngine]?.load || 0}%</span>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Oil Temp */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-surface-container-lowest rounded-xl p-3 shadow-sm w-44"
          >
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
              {t.oilTemp}
            </span>
            <div className="flex items-end justify-between mt-2">
              <div>
                <span className="text-2xl font-bold text-[#0A0A0A]">{engineData[activeEngine]?.coolantTemp?.toFixed(1) || 0}</span>
                <span className="text-xs text-gray-400 ml-0.5">°C</span>
              </div>
              <div className="flex items-center gap-1 text-green-500">
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path d="M7 3L11 8H3L7 3Z" fill="currentColor" />
                </svg>
                <span className="text-[9px] font-bold">{t.normal}</span>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Diagnosis */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#121212] dark:bg-surface-container-lowest rounded-xl p-3 shadow-xl w-44"
          >
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-300">
              {t.diagnosis}
            </span>
            <p className="text-sm font-bold text-green-400 mt-1">
              {engineData[activeEngine]?.status === 'running' ? t.healthySystem : t.standbyMode}
            </p>
            <DiagnoseIndicator active={engineData[activeEngine]?.status === 'running'} />
          </motion.div>
        </aside>

      </main>

      {/* 3.5 Bottom Metrics Bar - Lower z-index than floating card */}
      <footer className="absolute bottom-0 left-0 right-0 px-6 pb-3 z-20">
        <div className="grid grid-cols-5 gap-4 max-w-[1400px] mx-auto">
          {dynamicBottomMetrics.map((metric, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white dark:bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-slate-100/50 dark:border-dark-surface-variant hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                {metric.label}
              </span>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-2xl font-semibold text-slate-800">{metric.value}</span>
                <span className="text-xs text-slate-400 font-normal">{metric.unit}</span>
              </div>
              <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${metric.barColor}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(metric.barPct * 100, 100)}%` }}
                  transition={{ duration: 1, delay: idx * 0.1 + 0.3, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </footer>

    </div>
  );
};

export default EngineSystems;
