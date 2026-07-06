import React, { useState } from "react";
import { motion } from "framer-motion";
import { useEngineData } from "./hooks/useRealTimeData";
import { useLanguage } from "./hooks/useLanguage";
import EngineSectionDiagram from "./components/EngineSectionDiagram";
import { useUnitSystem } from "./hooks/useUnitSystem";

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
  const { formatUnit } = useUnitSystem();
  const [activeEngine, setActiveEngine] = useState("diesel1");
  const engineData = useEngineData(2000);

  const engines = [
    { id: "diesel1", label: t.dieselEngine1 },
    { id: "diesel2", label: t.dieselEngine2 },
    { id: "aux1", label: t.dieselEngine3 },
    { id: "aux2", label: t.dieselEngine4 },
  ];

  // Dynamic bottom metrics based on engine data
  const activeEngineData = engineData[activeEngine] || {};
  const latestDataTimestamp = new Date(activeEngineData.timestamp || engineData.__meta?.timestamp || Date.now());
  const nextRefreshAt = new Date(latestDataTimestamp.getTime() + 2000);
  const voltage = activeEngineData.voltage || 400;
  const current = activeEngineData.current || 450;
  const powerFactor = activeEngineData.powerFactor || 0.84;
  const apparentPower = voltage * current * Math.sqrt(3) / 1000;
  const electricPower = activeEngineData.power || Math.round(apparentPower * powerFactor);
  const dynamicBottomMetrics = [
    { label: "Voltage", value: voltage, unit: "V", barColor: "bg-blue-500", barPct: (voltage / 500) },
    { label: "Current", value: current, unit: "A", barColor: "bg-cyan-500", barPct: (current / 650) },
    { label: "Power Factor", value: powerFactor.toFixed(2), unit: "", barColor: "bg-emerald-500", barPct: powerFactor },
    { label: "Electric Power", value: formatUnit("power", electricPower, 0).value, unit: formatUnit("power", electricPower, 0).unit, barColor: "bg-indigo-500", barPct: (electricPower / 15000) },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-[#F5F6F8] dark:bg-background">

      <main className="flex flex-row flex-1 gap-4 relative items-stretch" style={{ minHeight: 0 }}>

        {/* 3.2 Left Controls */}
        <aside className="flex flex-col w-28 xl:w-32 shrink-0 space-y-2 z-20 justify-center" style={{ minHeight: 0 }}>
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
        </aside>

        {/* 3.3 Center 3D Area */}
        <section
          className="flex-1 flex flex-col relative overflow-hidden z-10"
          style={{ minHeight: 0 }}
        >
          <div className="w-full flex-1" style={{ minHeight: '300px' }}>
            <EngineSectionDiagram
              engine={activeEngineData}
            />
          </div>
        </section>

        {/* 3.4 Right Status Panels */}
        <aside className="w-48 xl:w-52 shrink-0 flex flex-col gap-3 z-20 justify-start overflow-y-auto max-h-full" style={{ minHeight: 0 }}>
          {/* Card 1: Power Output */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#121212] dark:bg-surface-container-lowest rounded-xl p-3 shadow-xl w-full"
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
            className="bg-white dark:bg-surface-container-lowest rounded-xl p-3 shadow-sm w-full"
          >
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
              {t.oilTemp}
            </span>
            <div className="flex items-end justify-between mt-2">
              <div>
                <span className="text-2xl font-bold text-[#0A0A0A]">{(engineData[activeEngine]?.lubeOilTemp ?? engineData[activeEngine]?.coolantTemp ?? 0).toFixed(1)}</span>
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
            className="bg-[#121212] dark:bg-surface-container-lowest rounded-xl p-3 shadow-xl w-full"
          >
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-300">
              {t.diagnosis}
            </span>
            <p className="text-sm font-bold text-green-400 mt-1">
              {engineData[activeEngine]?.status === 'running' ? t.healthySystem : t.standbyMode}
            </p>
            <DiagnoseIndicator active={engineData[activeEngine]?.status === 'running'} />
          </motion.div>

          {/* Card 4: Timestamp Node */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#121212] dark:bg-surface-container-lowest rounded-xl p-3 shadow-xl w-full text-white dark:text-on-surface"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#4CD7D0] shadow-[0_0_8px_rgba(76,215,208,0.9)]" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-300">
                  TIMESTAMP NODE
                </span>
              </div>
              <span className="rounded-full bg-[#4CD7D0]/15 px-2 py-0.5 text-[8px] font-black uppercase text-[#4CD7D0]">
                Online
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 text-[10px]">
              <div className="rounded bg-white/5 p-2">
                <div className="uppercase tracking-wider text-gray-500">Current TS</div>
                <div className="mt-1 font-mono font-bold text-[#4CD7D0]">
                  {latestDataTimestamp.toLocaleString(undefined, { hour12: false })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded bg-white/5 p-2">
                  <div className="uppercase tracking-wider text-gray-500">Refresh</div>
                  <div className="mt-1 font-mono font-bold text-[#4CD7D0]">2.0s</div>
                </div>
                <div className="rounded bg-white/5 p-2">
                  <div className="uppercase tracking-wider text-gray-500">Next</div>
                  <div className="mt-1 font-mono font-bold text-[#4CD7D0]">
                    {nextRefreshAt.toLocaleTimeString(undefined, { hour12: false })}
                  </div>
                </div>
              </div>
              <div className="rounded bg-white/5 p-2">
                <div className="uppercase tracking-wider text-gray-500">Source</div>
                <div className="mt-1 font-mono font-bold text-[#4CD7D0]">MODBUS/RS485</div>
              </div>
            </div>
          </motion.div>
        </aside>

      </main>

      {/* 3.5 Bottom Metrics Bar */}
      <footer className="shrink-0 grid grid-cols-4 gap-4 px-4 pb-3 z-20">
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
      </footer>

    </div>
  );
};

export default EngineSystems;
