import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "../hooks/useLanguage";
import { useUnitSystem } from "../hooks/useUnitSystem";

const arcPath = (cx, cy, r) => `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

const MiniGauge = ({ label, value, unit, max, accent = "#0058bc" }) => {
  const pct = Math.max(0, Math.min(Number(value) / max, 1));
  const angle = -150 + pct * 120;
  const rad = (angle * Math.PI) / 180;
  const needleX = 48 + Math.cos(rad) * 30;
  const needleY = 48 + Math.sin(rad) * 30;

  return (
    <div className="rounded-lg border border-slate-200 bg-white/70 p-2 shadow-sm dark:border-white/10 dark:bg-surface-container-low/70">
      <div className="text-[8px] font-bold uppercase tracking-wider text-slate-500 dark:text-on-surface-variant">{label}</div>
      <svg viewBox="0 0 96 70" className="mt-1 h-16 w-full">
        <path d={arcPath(48, 48, 34)} fill="none" stroke="#d8dee6" strokeWidth="7" strokeLinecap="round" />
        <path
          d={arcPath(48, 48, 34)}
          fill="none"
          stroke={accent}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${pct * 107} 107`}
        />
        <line x1="48" y1="48" x2={needleX} y2={needleY} stroke="#18202a" strokeWidth="3" strokeLinecap="round" />
        <circle cx="48" cy="48" r="4" fill={accent} />
        <text x="48" y="66" textAnchor="middle" className="fill-slate-700 text-[10px] font-bold dark:fill-slate-200">
          {value}
        </text>
      </svg>
      <div className="text-center text-[8px] font-semibold text-slate-400">{unit}</div>
    </div>
  );
};

const VerticalMeter = ({ label, value, unit, max = 100, color = "#0058bc" }) => {
  const pct = Math.max(8, Math.min((Number(value) / max) * 100, 100));
  return (
    <div className="flex min-w-[32px] flex-col items-center gap-1">
      <div className="flex h-20 w-4 items-end rounded border border-slate-300 bg-white dark:border-white/10 dark:bg-surface-container-low">
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: `${pct}%` }}
          className="w-full rounded-b"
          style={{ backgroundColor: color }}
        />
      </div>
      <div className="text-[8px] font-bold text-slate-600 dark:text-on-surface">{value}</div>
      <div className="text-[7px] text-slate-400">{unit}</div>
      <div className="max-w-[44px] text-center text-[7px] font-bold uppercase leading-tight text-slate-500">{label}</div>
    </div>
  );
};

const StatusLamp = ({ label, active, tone = "green" }) => {
  const colors = {
    green: active ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-slate-300",
    yellow: active ? "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]" : "bg-slate-300",
    red: active ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" : "bg-slate-300",
  };
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${colors[tone]}`} />
      <span className="truncate text-[9px] text-slate-500 dark:text-on-surface-variant">{label}</span>
    </div>
  );
};

const SystemBlock = ({ title, children, active, onClick }) => (
  <button
    onClick={onClick}
    className={`rounded-lg border p-2 text-left transition-all ${
      active
        ? "border-[#4cd7d0] bg-[#ecfffd] shadow-[0_0_0_2px_rgba(76,215,208,0.15)] dark:bg-[#123432]"
        : "border-slate-200 bg-white/70 hover:border-[#4cd7d0]/60 dark:border-white/10 dark:bg-surface-container-low/70"
    }`}
  >
    <div className="mb-2 text-[9px] font-black uppercase tracking-wider text-slate-700 dark:text-on-surface">{title}</div>
    <div className="flex gap-2">{children}</div>
  </button>
);

const EngineSectionDiagram = ({ engine, activeSystem, onSystemClick }) => {
  const { language } = useLanguage();
  const { formatUnit } = useUnitSystem();

  const cylinders = useMemo(() => {
    const temps = engine?.cylinders || [];
    return temps.slice(0, 8).map((temp, index) => ({
      id: `A${index + 1}`,
      exhaust: temp,
      linerTop: 118 + Math.round((index % 4) * 2 + Math.random() * 2),
      linerBottom: 116 + Math.round((index % 3) * 2 + Math.random() * 2),
    }));
  }, [engine?.cylinders]);

  const gauges = [
    { label: "Voltage", value: engine?.voltage || 400, unit: "V", max: 500, accent: "#2563eb" },
    { label: "Current", value: engine?.current || 462, unit: "A", max: 600, accent: "#0f766e" },
    { label: "Frequency", value: engine?.frequency?.toFixed?.(1) || "50.0", unit: "Hz", max: 60, accent: "#7c3aed" },
    { label: "Load", value: engine?.power || 0, unit: "kW", max: 15000, accent: "#0891b2" },
    { label: "Speed", value: engine?.rpm || 0, unit: "RPM", max: 1600, accent: "#1d4ed8" },
    { label: "Fuel Rack", value: Math.round((engine?.load || 0) * 0.42), unit: "mm", max: 50, accent: "#ca8a04" },
    { label: "Load PPT", value: engine?.load || 0, unit: "%", max: 120, accent: "#dc2626" },
  ];

  const systemLabels = {
    fuel: language === "zh" ? "燃油" : "Fuel Oil",
    lubrication: language === "zh" ? "滑油" : "Lube Oil",
    cooling: language === "zh" ? "冷却水" : "Cooling Water",
    airIntake: language === "zh" ? "进排气" : "Charge Air",
  };

  const exhaustMean = cylinders.length
    ? cylinders.reduce((sum, item) => sum + item.exhaust, 0) / cylinders.length
    : 0;

  return (
    <div className="h-full min-h-[300px] overflow-hidden rounded-2xl border border-slate-200 bg-[#eef3f5] p-3 shadow-inner dark:border-white/10 dark:bg-[#15191d]">
      <div className="grid h-full min-h-0 grid-rows-[auto_1fr_auto] gap-3">
        <div className="grid grid-cols-7 gap-2">
          {gauges.map((gauge) => (
            <MiniGauge key={gauge.label} {...gauge} />
          ))}
        </div>

        <div className="grid min-h-0 grid-cols-[1fr_2.2fr_.8fr] gap-3">
          <div className="flex min-h-0 flex-col gap-3">
            <div className="rounded-xl border border-slate-200 bg-white/70 p-3 dark:border-white/10 dark:bg-surface-container-low/70">
              <div className="mb-3 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-on-surface">
                {language === "zh" ? "发电机与轴承温度" : "Generator & Bearing Temp"}
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[
                  ["BRG NDE", 65],
                  ["U", 72],
                  ["V", 73],
                  ["W", 73],
                  ["BRG DE", 58],
                ].map(([label, value]) => (
                  <VerticalMeter key={label} label={label} value={value} unit="°C" max={100} color="#0058bc" />
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/70 p-3 dark:border-white/10 dark:bg-surface-container-low/70">
              <div className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-on-surface">
                {language === "zh" ? "状态" : "Status"}
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                <StatusLamp label={language === "zh" ? "本地控制" : "Local Control"} active />
                <StatusLamp label={language === "zh" ? "转速开关 90%" : "Speed Switch 90%"} active />
                <StatusLamp label={language === "zh" ? "准备启动" : "Ready To Start"} active={false} tone="yellow" />
                <StatusLamp label={language === "zh" ? "AVR 故障" : "AVR Failure"} active={false} tone="red" />
              </div>
            </div>
          </div>

          <div className="relative min-h-0 rounded-xl border border-slate-200 bg-white/60 p-3 dark:border-white/10 dark:bg-surface-container-low/60">
            <div className="absolute left-4 top-3 text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-on-surface">
              {language === "zh" ? "柴油机剖面监控" : "Diesel Engine Section"}
            </div>
            <svg viewBox="0 0 720 260" className="h-full w-full pt-6">
              <defs>
                <linearGradient id="sectionBody" x1="0" x2="1">
                  <stop offset="0" stopColor="#c9d6df" />
                  <stop offset="1" stopColor="#eef3f7" />
                </linearGradient>
              </defs>
              <path d="M45 155 L95 105 L625 105 L675 155 L640 190 L80 190 Z" fill="url(#sectionBody)" stroke="#718096" strokeWidth="2" />
              <rect x="75" y="185" width="570" height="32" fill="#dbe4ea" stroke="#718096" strokeWidth="1.5" />
              <line x1="45" y1="155" x2="675" y2="155" stroke="#94a3b8" strokeWidth="2" />
              {cylinders.map((cylinder, index) => {
                const x = 115 + index * 70;
                const temp = formatUnit("temperature", cylinder.exhaust, 0);
                const hot = cylinder.exhaust > 450;
                return (
                  <g key={cylinder.id}>
                    <path d={`M ${x - 24} 150 L ${x - 12} 118 L ${x + 24} 118 L ${x + 36} 150 Z`} fill={hot ? "#fee2e2" : "#e8f7f5"} stroke={hot ? "#dc2626" : "#0f766e"} />
                    <text x={x + 6} y="111" textAnchor="middle" fontSize="12" fontWeight="700" fill="#334155">{cylinder.id}</text>
                    <text x={x + 6} y="139" textAnchor="middle" fontSize="11" fontWeight="700" fill={hot ? "#dc2626" : "#0f766e"}>{temp.value}{temp.unit}</text>
                    <line x1={x + 6} y1="155" x2={x + 6} y2="218" stroke="#94a3b8" strokeWidth="1" />
                    <text x={x + 6} y="177" textAnchor="middle" fontSize="10" fill="#475569">{formatUnit("temperature", cylinder.linerTop, 0).value}</text>
                    <text x={x + 6} y="205" textAnchor="middle" fontSize="10" fill="#475569">{formatUnit("temperature", cylinder.linerBottom, 0).value}</text>
                  </g>
                );
              })}
              <text x="360" y="88" textAnchor="middle" fontSize="14" fontWeight="800" fill="#1e293b">EXHAUST GAS TEMP</text>
              <text x="360" y="172" textAnchor="middle" fontSize="14" fontWeight="800" fill="#1e293b">CYLINDER LINER TEMP</text>
              <text x="360" y="239" textAnchor="middle" fontSize="13" fontWeight="800" fill="#1e293b">MAIN BEARING TEMP</text>
            </svg>
          </div>

          <div className="flex min-h-0 flex-col gap-3">
            <div className="rounded-xl border border-slate-200 bg-white/70 p-3 dark:border-white/10 dark:bg-surface-container-low/70">
              <div className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-on-surface">
                Exhaust Gas Deviation
              </div>
              <div className="flex items-end justify-between gap-1">
                {cylinders.map((cylinder) => {
                  const deviation = Math.round(cylinder.exhaust - exhaustMean);
                  return (
                    <div key={cylinder.id} className="flex flex-col items-center gap-1">
                      <div className="relative h-20 w-3 rounded bg-slate-200 dark:bg-surface-container-high">
                        <div
                          className="absolute left-0 w-full rounded bg-[#79ff5b]"
                          style={{
                            bottom: deviation >= 0 ? "50%" : `${50 + deviation}%`,
                            height: `${Math.min(Math.abs(deviation) * 2, 45)}%`,
                          }}
                        />
                      </div>
                      <span className="text-[7px] text-slate-500">{cylinder.id.replace("A", "")}</span>
                      <span className="text-[7px] font-bold text-slate-600">{deviation}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 text-center text-[9px] text-slate-500">
                Mean {formatUnit("temperature", exhaustMean, 0).text}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white/70 p-3 dark:border-white/10 dark:bg-surface-container-low/70">
              <div className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-on-surface">
                Turbocharger
              </div>
              <div className="space-y-2 text-[10px]">
                <div className="flex justify-between"><span>TC OUT</span><b>{formatUnit("temperature", engine?.exhaustTemp || 0, 0).text}</b></div>
                <div className="flex justify-between"><span>TC IN</span><b>{formatUnit("temperature", (engine?.exhaustTemp || 0) + 140, 0).text}</b></div>
                <div className="flex justify-between"><span>T/C Speed</span><b>{Math.round((engine?.turboSpeed || 0) * 1400)} rpm</b></div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <SystemBlock title={systemLabels.fuel} active={activeSystem === "fuel"} onClick={() => onSystemClick("fuel")}>
            <VerticalMeter label="Press In" value={formatUnit("pressure", 7.6, 1).value} unit={formatUnit("pressure", 7.6, 1).unit} max={10} color="#ca8a04" />
            <VerticalMeter label="Temp In" value={formatUnit("temperature", 100, 0).value} unit={formatUnit("temperature", 100, 0).unit} max={130} color="#ca8a04" />
            <VerticalMeter label="Filter Diff" value={formatUnit("pressure", 0.3, 1).value} unit={formatUnit("pressure", 0.3, 1).unit} max={2} color="#ca8a04" />
          </SystemBlock>
          <SystemBlock title={systemLabels.lubrication} active={activeSystem === "lubrication"} onClick={() => onSystemClick("lubrication")}>
            <VerticalMeter label="Press In" value={formatUnit("pressure", engine?.oilPressure || 0, 1).value} unit={formatUnit("pressure", engine?.oilPressure || 0, 1).unit} max={6} color="#0058bc" />
            <VerticalMeter label="Temp In" value={formatUnit("temperature", 65, 0).value} unit={formatUnit("temperature", 65, 0).unit} max={110} color="#0058bc" />
            <VerticalMeter label="Temp Out" value={formatUnit("temperature", 95, 0).value} unit={formatUnit("temperature", 95, 0).unit} max={120} color="#0058bc" />
          </SystemBlock>
          <SystemBlock title={systemLabels.airIntake} active={activeSystem === "airIntake"} onClick={() => onSystemClick("airIntake")}>
            <VerticalMeter label="Press In" value={formatUnit("pressure", 2.9, 1).value} unit={formatUnit("pressure", 2.9, 1).unit} max={5} color="#0f766e" />
            <VerticalMeter label="Temp In" value={formatUnit("temperature", 54.3, 1).value} unit={formatUnit("temperature", 54.3, 1).unit} max={90} color="#0f766e" />
            <VerticalMeter label="Ctrl Air" value={formatUnit("pressure", 25.5, 1).value} unit={formatUnit("pressure", 25.5, 1).unit} max={35} color="#0f766e" />
          </SystemBlock>
          <SystemBlock title={systemLabels.cooling} active={activeSystem === "cooling"} onClick={() => onSystemClick("cooling")}>
            <VerticalMeter label="HT In" value={formatUnit("temperature", engine?.coolantTemp || 0, 1).value} unit={formatUnit("temperature", engine?.coolantTemp || 0, 1).unit} max={120} color="#2563eb" />
            <VerticalMeter label="HT Out" value={formatUnit("temperature", (engine?.coolantTemp || 0) + 7, 1).value} unit={formatUnit("temperature", (engine?.coolantTemp || 0) + 7, 1).unit} max={120} color="#2563eb" />
            <VerticalMeter label="LT Out" value={formatUnit("temperature", 49.6, 1).value} unit={formatUnit("temperature", 49.6, 1).unit} max={80} color="#2563eb" />
          </SystemBlock>
        </div>
      </div>
    </div>
  );
};

export default EngineSectionDiagram;
