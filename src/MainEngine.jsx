import React, { useState } from "react";
import { motion } from "framer-motion";
import { EngineModel } from "./YachtModel";
import { useEngineData, useVesselData, useAlarmsData } from "./hooks/useRealTimeData";
import { useLanguage } from "./hooks/useLanguage";
import { AlarmDot } from "./components/AlarmBadge";

const MainEngine = () => {
  const { t, language } = useLanguage();
  const [activeEngine, setActiveEngine] = useState("diesel1");
  const [autoRotate, setAutoRotate] = useState(true);
  const engines = useEngineData(2000);
  const vesselData = useVesselData(1000);
  const { alarms } = useAlarmsData(5000, language);
  const engine = engines[activeEngine];

  // Determine if any unacknowledged high-priority alarm exists for fault highlighting
  const hasUnacknowledgedAlarm = alarms.active.some(
    (a) => !a.acknowledged && (a.priority === "critical" || a.priority === "high" || a.type === "alarm")
  );

  // Find the active alarm for the current engine (if any)
  const engineAlarm = alarms.active.find(
    (a) =>
      !a.acknowledged &&
      (a.priority === "critical" || a.priority === "high" || a.type === "alarm") &&
      (a.source?.toLowerCase().includes(activeEngine.toLowerCase()) ||
        a.source?.toLowerCase().includes("engine") ||
        a.source?.toLowerCase().includes("diesel"))
  );
  const showFaultHighlight = !!engineAlarm;

  // Calculate propulsion power (approximate thrust based on RPM and load)
  const propulsionPower = Math.round(
    ((engine?.rpm || 0) / 1000) * ((engine?.power || 0) / 10000) * 4500
  );

  // Operating angle (derived from pitch and heading data)
  const operatingAngle = vesselData.pitch.toFixed(1);

  const engineButtons = [
    { key: "diesel1", label: t.engine1, status: engines.diesel1.status },
    { key: "diesel2", label: t.engine2, status: engines.diesel2.status },
    { key: "aux1", label: t.gen1, status: engines.aux1.status },
    { key: "aux2", label: t.gen2, status: engines.aux2.status },
  ];

  return (
    <div className="flex flex-col flex-1 overflow-hidden px-4 pb-4 pt-2 bg-[#F5F6F8] dark:bg-background" style={{ minHeight: 0 }}>
      {/* Main Content Row */}
      <main className="flex flex-row flex-1 gap-4 relative items-stretch" style={{ minHeight: 0 }}>
        {/* Left: Engine Selection Buttons */}
        <aside className="flex flex-col w-28 xl:w-32 shrink-0 space-y-2 z-20 justify-center" style={{ minHeight: 0 }}>
          {engineButtons.map((btn) => (
            <button
              key={btn.key}
              onClick={() => setActiveEngine(btn.key)}
              className={`${
                activeEngine === btn.key
                  ? "bg-[#1A1B1F] dark:bg-surface-container-lowest text-white dark:text-on-surface rounded-full px-3 py-2 text-xs font-bold tracking-wider uppercase shadow-lg text-left flex items-center justify-between"
                  : "bg-white dark:bg-surface-container-lowest text-[#1A1B1F]/60 dark:text-on-surface/60 rounded-full px-3 py-2 text-xs font-bold tracking-wider uppercase shadow-sm text-left hover:bg-gray-50 dark:hover:bg-dark-surface-container-low transition-colors"
              }`}
            >
              {btn.label}
              {activeEngine === btn.key && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#79ff5b] shadow-[0_0_8px_rgba(121,255,91,0.8)]"></span>
              )}
              {activeEngine !== btn.key && btn.status === "running" && (
                <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
              )}
              {activeEngine !== btn.key && btn.status === "standby" && (
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
              )}
            </button>
          ))}

          {/* Auto-Rotation Toggle */}
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-white dark:bg-surface-container-lowest rounded-full shadow-sm">
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`relative w-9 h-5 rounded-full transition-colors duration-300 ${
                autoRotate ? "bg-[#4cd7d0]" : "bg-gray-300 dark:bg-surface-container-high"
              }`}
              aria-label={t.autoRotate3D}
            >
              <motion.div
                className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow"
                animate={{ left: autoRotate ? 20 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-on-surface-variant">
              {t.autoRotate3D}
            </span>
          </div>
        </aside>

        {/* Center: Engine 3D Visualization */}
        <section
          className="flex-1 flex flex-col relative overflow-hidden z-10"
          style={{ minHeight: 0 }}
        >
          {/*
            IMPORTANT: `@react-three/fiber`'s Canvas needs a parent with a concrete height.
            Without an explicit min-height, flex layouts can collapse, making the canvas appear
            as a small strip in the middle.
          */}
          <div className="w-full flex-1" style={{ minHeight: '300px' }}>
            <EngineModel autoRotate={autoRotate} faultAlarm={showFaultHighlight} />
          </div>
          {/* RPM Tag */}
          <div className="absolute top-[15%] left-[58%] flex flex-col items-center">
            <div className="backdrop-blur-md bg-white/75 dark:bg-surface-container-lowest/80 border border-white/60 dark:border-white/10 shadow-lg rounded-xl p-3 flex flex-col items-center justify-center">
              <span className="text-xs text-slate-500 dark:text-on-surface-variant font-semibold tracking-wider uppercase">{t.rpm}</span>
              <span className="text-xl font-bold text-blue-600 dark:text-primary">{engine?.rpm || 0}</span>
            </div>
            <div className="h-12 w-px bg-gray-300 dark:bg-surface-variant mt-1.5 rotate-[45deg] origin-top relative">
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full bg-blue-500 dark:bg-primary shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
            </div>
          </div>
          {/* Exhaust Temp Tag */}
          <div className="absolute bottom-[25%] left-[20%] flex flex-col items-center">
            <div className="backdrop-blur-md bg-white/75 dark:bg-surface-container-lowest/80 border border-white/60 dark:border-white/10 shadow-lg rounded-xl p-3 flex flex-col items-center justify-center">
              <span className="text-xs text-slate-500 dark:text-on-surface-variant font-semibold tracking-wider uppercase">{t.exhTemp}</span>
              <span className="text-xl font-bold text-slate-800 dark:text-on-surface">{engine?.exhaustTemp?.toFixed(1) || 0}°C</span>
            </div>
            <div className="h-10 w-px bg-gray-300 dark:bg-surface-variant mb-1.5 -rotate-[30deg] origin-bottom relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500 dark:bg-primary shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
            </div>
          </div>
          {/* Oil Pressure Tag */}
          <div className="absolute top-[30%] left-[10%] flex flex-col items-end">
            <div className="backdrop-blur-md bg-white/75 dark:bg-surface-container-lowest/80 border border-white/60 dark:border-white/10 shadow-lg rounded-xl p-3 flex flex-col items-center justify-center">
              <span className="text-xs text-slate-500 dark:text-on-surface-variant font-semibold tracking-wider uppercase">{t.oilPress}</span>
              <span className="text-xl font-bold text-green-600 dark:text-green-500">{engine?.oilPressure?.toFixed(1) || 0} {t.bar}</span>
            </div>
            <div className="h-14 w-px bg-gray-300 dark:bg-surface-variant mt-1.5 rotate-[60deg] origin-top relative">
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full bg-blue-500 dark:bg-primary shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
            </div>
          </div>
          {/* Turbo Speed Tag */}
          <div className="absolute top-[20%] right-[15%] flex flex-col items-start">
            <div className="backdrop-blur-md bg-white/75 dark:bg-surface-container-lowest/80 border border-white/60 dark:border-white/10 shadow-lg rounded-xl p-3 flex flex-col items-center justify-center">
              <span className="text-xs text-slate-500 dark:text-on-surface-variant font-semibold tracking-wider uppercase">{t.turbo}</span>
              <span className="text-xl font-bold text-purple-600 dark:text-purple-400">{engine?.turboSpeed?.toFixed(1) || 0}</span>
              <span className="text-[8px] text-slate-400 dark:text-on-surface-variant">{t.kRpm}</span>
            </div>
            <div className="h-10 w-px bg-gray-300 dark:bg-surface-variant mt-1.5 -rotate-[60deg] origin-top relative">
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full bg-purple-500 dark:bg-purple-400 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
            </div>
          </div>
          {/* Fault Highlight Overlay */}
          {showFaultHighlight && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 pointer-events-none z-30"
            >
              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-white"></span>
                {t.faultDetected}: {engineAlarm?.message}
              </div>
            </motion.div>
          )}
        </section>

        {/* Right: Status Panels */}
        <aside className="w-48 xl:w-52 shrink-0 flex flex-col gap-3 z-20 justify-start overflow-y-auto max-h-full" style={{ minHeight: 0 }}>
          {/* Propulsion Power — Fixed Viewport */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-[#1A1A1A] dark:bg-surface-container-lowest text-white dark:text-on-surface rounded-xl p-3 shadow-xl flex flex-col items-center"
          >
            <div className="w-full flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">{t.propulsionPower}</span>
              <span className="material-symbols-outlined text-[#4cd7d0] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>directions_boat</span>
            </div>
            <div className="relative w-24 h-24 flex items-center justify-center mb-1">
              <svg className="w-full h-full -rotate-90">
                <circle className="text-gray-700" cx="50%" cy="50%" fill="transparent" r="40%" stroke="currentColor" strokeWidth="5"></circle>
                <motion.circle
                  className="text-[#4cd7d0]"
                  cx="50%"
                  cy="50%"
                  fill="transparent"
                  r="40%"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeDasharray="201"
                  initial={{ strokeDashoffset: 201 }}
                  animate={{ strokeDashoffset: 201 - (propulsionPower / 4500) * 201 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-light text-white">{propulsionPower.toLocaleString()}</span>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">kW</span>
              </div>
            </div>
            <div className="text-[10px] font-medium text-gray-400">{t.operatingAngle}: {operatingAngle}°</div>
          </motion.div>

          {/* Operating Angle — Fixed Viewport */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-surface-container-lowest rounded-xl p-3 shadow-sm border border-slate-100/50 dark:border-dark-surface-variant flex flex-col items-center"
          >
            <div className="w-full flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.operatingAngle}</span>
              <span className="material-symbols-outlined text-[#4cd7d0] text-sm">straighten</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 60 60">
                  <circle cx="30" cy="30" r="24" fill="transparent" stroke="#e5e7eb" strokeWidth="4" />
                  <motion.circle
                    cx="30"
                    cy="30"
                    r="24"
                    fill="transparent"
                    stroke="#4cd7d0"
                    strokeWidth="4"
                    strokeDasharray="150.8"
                    initial={{ strokeDashoffset: 150.8 }}
                    animate={{ strokeDashoffset: 150.8 - ((Math.abs(parseFloat(operatingAngle)) / 10) * 150.8) }}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-lg font-bold text-[#1A1B1F]">{operatingAngle}°</span>
              </div>
              <div className="text-[9px] text-gray-400 leading-tight">
                <div>Pitch: {vesselData.pitch.toFixed(2)}°</div>
                <div>Heading: {vesselData.heading}°</div>
              </div>
            </div>
          </motion.div>

          {/* Power Output Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-[#1A1A1A] dark:bg-surface-container-lowest text-white dark:text-on-surface rounded-xl p-3 shadow-xl flex flex-col items-center"
          >
            <div className="w-full flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">{t.powerOutput}</span>
              <span className="material-symbols-outlined text-[#79ff5b] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
            </div>
            <div className="relative w-24 h-24 flex items-center justify-center mb-1">
              <svg className="w-full h-full -rotate-90">
                <circle className="text-gray-700" cx="50%" cy="50%" fill="transparent" r="40%" stroke="currentColor" strokeWidth="5"></circle>
                <motion.circle
                  className="text-[#79ff5b]"
                  cx="50%"
                  cy="50%"
                  fill="transparent"
                  r="40%"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeDasharray="201"
                  initial={{ strokeDashoffset: 201 }}
                  animate={{ strokeDashoffset: 201 - (engine?.power || 0) / 50 }}
                  transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-light text-white">{(engine?.power || 0).toLocaleString()}</span>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{t.kw}</span>
              </div>
            </div>
            <div className="text-[10px] font-medium text-gray-400">{engine?.load || 0}{t.percent} {t.load}</div>
          </motion.div>

          {/* Coolant Temp Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-surface-container-lowest rounded-xl p-3 shadow-sm"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.coolantTemp}</span>
              <span className="material-symbols-outlined text-gray-400 text-sm">thermostat</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-[#1A1A1F]">{engine?.coolantTemp?.toFixed(1) || 0}</span>
              <span className="text-xs text-gray-400">°C</span>
            </div>
            <div className="w-full h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
              <motion.div
                className="h-full bg-[#0058bc] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((engine?.coolantTemp || 0) / 100) * 100}%` }}
                transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
              />
            </div>
          </motion.div>

          {/* Diagnosis Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#1A1A1A] text-white rounded-xl p-3 shadow-xl"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">{t.diagnosis}</span>
              <span className="text-[9px] font-bold text-[#79ff5b] px-1.5 py-0.5 bg-[#79ff5b]/10 rounded uppercase tracking-wider">{t.optimal}</span>
            </div>
            <div className="space-y-2">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-medium text-gray-300">
                  <span>{t.fuelRate}</span>
                  <span>{engine?.fuelRate?.toFixed(1) || 0} {t.lh}</span>
                </div>
                <div className="h-0.5 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-green-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${((engine?.fuelRate || 0) / 400) * 100}%` }}
                    transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-medium text-gray-300">
                  <span>{t.torque}</span>
                  <span>{engine?.torque?.toFixed(1) || 0} kNm</span>
                </div>
                <div className="h-0.5 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${((engine?.torque || 0) / 200) * 100}%` }}
                    transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </aside>
      </main>

      {/* Bottom: 5 Status Cards */}
      <footer className="grid grid-cols-5 gap-4 mt-3 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
            className="bg-white dark:bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-slate-100/50 dark:border-dark-surface-variant hover:shadow-md transition-shadow flex flex-col justify-between"
        >
          <span className="text-[10px] font-semibold text-slate-400 dark:text-on-surface-variant uppercase tracking-wider">
            {t.engineSpeed}
          </span>
          <div className="flex items-baseline mt-1">
            <span className="text-2xl font-semibold text-[#1A1B1F] dark:text-on-surface">{engine?.rpm || 0}</span>
            <span className="text-[10px] text-slate-400 ml-1 font-normal">{t.rpm}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
            className="bg-white dark:bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-slate-100/50 dark:border-dark-surface-variant hover:shadow-md transition-shadow flex flex-col justify-between"
        >
          <span className="text-[10px] font-semibold text-slate-400 dark:text-on-surface-variant uppercase tracking-wider">
            {t.fuelRate}
          </span>
          <div className="flex items-baseline mt-1">
            <span className="text-2xl font-semibold text-[#1A1B1F] dark:text-on-surface">{engine?.fuelRate?.toFixed(1) || 0}</span>
            <span className="text-[10px] text-slate-400 ml-1 font-normal">{t.lh}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
            className="bg-white dark:bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-slate-100/50 dark:border-dark-surface-variant hover:shadow-md transition-shadow flex flex-col justify-between"
        >
          <span className="text-[10px] font-semibold text-slate-400 dark:text-on-surface-variant uppercase tracking-wider">
            {t.lubeOilPress}
          </span>
          <div className="flex items-baseline mt-1">
            <span className="text-2xl font-semibold text-[#1A1B1F] dark:text-on-surface">{engine?.oilPressure?.toFixed(1) || 0}</span>
            <span className="text-[10px] text-slate-400 ml-1 font-normal">{t.bar}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
            className="bg-white dark:bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-slate-100/50 dark:border-dark-surface-variant hover:shadow-md transition-shadow flex flex-col justify-between"
        >
          <span className="text-[10px] font-semibold text-slate-400 dark:text-on-surface-variant uppercase tracking-wider">
            {t.coolantTemp}
          </span>
          <div className="flex items-baseline mt-1">
            <span className="text-2xl font-semibold text-[#1A1B1F] dark:text-on-surface">{engine?.coolantTemp?.toFixed(1) || 0}</span>
            <span className="text-[10px] text-slate-400 ml-1 font-normal">°C</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
            className="bg-white dark:bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-slate-100/50 dark:border-dark-surface-variant hover:shadow-md transition-shadow flex flex-col justify-between"
        >
          <span className="text-[10px] font-semibold text-slate-400 dark:text-on-surface-variant uppercase tracking-wider">
            {t.loadFactor}
          </span>
          <div className="flex items-baseline mt-1">
            <span className="text-2xl font-semibold text-blue-600 dark:text-primary">{engine?.load || 0}</span>
            <span className="text-[10px] text-slate-400 ml-1 font-normal">{t.percent}</span>
          </div>
        </motion.div>
      </footer>
    </div>
  );
};

export default MainEngine;
