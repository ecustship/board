import React, { useMemo } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { useUnitSystem } from "../hooks/useUnitSystem";

const formatPlain = (value, digits = 1) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

const Panel = ({ title, children, className = "", onClick, active }) => {
  const Tag = onClick ? "button" : "section";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`flex min-h-0 flex-col items-stretch justify-start rounded-lg border p-3 text-left transition-all ${
        active
          ? "border-[#4cd7d0] bg-[#edfffd] shadow-[0_0_0_2px_rgba(76,215,208,0.18)] dark:bg-[#123432]"
          : "border-slate-200 bg-white/75 dark:border-white/10 dark:bg-surface-container-low/75"
      } ${className}`}
    >
      <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
        <span className="break-words text-xs font-black uppercase leading-tight tracking-wider text-slate-700 dark:text-on-surface">{title}</span>
        {active && <span className="h-2 w-2 rounded-full bg-[#4cd7d0] shadow-[0_0_8px_rgba(76,215,208,0.8)]" />}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </Tag>
  );
};

const DataCell = ({ label, value, unit, tone = "normal", compact = false }) => {
  const toneClass = {
    normal: "text-slate-800 dark:text-on-surface",
    good: "text-emerald-600 dark:text-emerald-300",
    warn: "text-yellow-600 dark:text-yellow-300",
    alarm: "text-red-600 dark:text-red-300",
    info: "text-blue-600 dark:text-blue-300",
  }[tone];

  return (
    <div
      className={`flex min-w-0 flex-col justify-center rounded-md bg-slate-50/95 dark:bg-black/15 ${
        compact ? "min-h-[42px] gap-1 px-2.5 py-1.5" : "min-h-[66px] gap-2 px-3 py-2.5"
      }`}
    >
      <div className={`whitespace-normal break-words font-bold uppercase leading-tight tracking-wider text-slate-400 ${compact ? "text-[9px]" : "text-[10px]"}`}>{label}</div>
      <div className={`whitespace-normal break-words font-black leading-none ${compact ? "text-base" : "text-xl"} ${toneClass}`}>
        {value}
        {unit && <span className={`ml-1 font-bold text-slate-400 ${compact ? "text-[10px]" : "text-xs"}`}>{unit}</span>}
      </div>
    </div>
  );
};

const StatusCell = ({ label, active = false, alarm = false }) => (
  <div className="flex min-h-[54px] min-w-0 items-center gap-2.5 rounded-md bg-slate-50/95 px-3 py-2 dark:bg-black/15">
    <span
      className={`h-3 w-3 shrink-0 rounded-full ${
        alarm
          ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.65)]"
          : active
          ? "bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"
          : "bg-slate-300"
      }`}
    />
    <span className="whitespace-normal break-words text-[11px] font-bold leading-tight text-slate-600 dark:text-on-surface-variant">{label}</span>
  </div>
);

const MiniGauge = ({ label, value, unit, max, color = "#0058bc" }) => {
  const pct = Math.max(0, Math.min((Number(value) || 0) / max, 1));
  const angle = -130 + pct * 260;
  return (
    <div className="flex min-h-[180px] flex-col rounded-lg border border-slate-200 bg-white/75 px-5 py-4 dark:border-white/10 dark:bg-surface-container-low/75">
      <div className="min-h-[28px] break-words text-[13px] font-black uppercase leading-tight tracking-wider text-slate-500">{label}</div>
      <svg viewBox="0 18 92 48" className="mt-0 h-[105px] w-full shrink-0">
        <path d="M 22 50 A 24 24 0 0 1 70 50" fill="none" stroke="#d7dee7" strokeWidth="6" strokeLinecap="round" />
        <path
          d="M 22 50 A 24 24 0 0 1 70 50"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${pct * 76} 76`}
        />
        <line x1="46" y1="50" x2="46" y2="29" stroke="#1f2937" strokeWidth="3" strokeLinecap="round" transform={`rotate(${angle} 46 50)`} />
        <circle cx="46" cy="50" r="3.5" fill={color} />
        <text x="46" y="63" textAnchor="middle" className="fill-slate-700 text-sm font-bold dark:fill-slate-200">
          {value}
        </text>
      </svg>
      <div className="text-center text-sm font-bold leading-none text-slate-400">{unit}</div>
    </div>
  );
};

const EngineSectionMap = ({ cylinders, formatUnit, language }) => {
  const leftBank = cylinders.slice(0, 8);
  const rightBank = cylinders.slice(8, 16);
  const cylinderLabel = language === "zh" ? "缸" : "CYL";
  const sectionLabel = language === "zh" ? "发动机剖面" : "ENGINE SECTION";
  const renderCylinder = (item, index, bank) => {
    const x = 100 + index * 80;
    const y = bank === "top" ? 58 : 278;
    const hot = item.temp >= 450;
    const temp = formatUnit("temperature", item.temp, 0);
    const fill = hot ? "#fee2e2" : bank === "top" ? "#e8f7f5" : "#eef2ff";
    const stroke = hot ? "#ef4444" : bank === "top" ? "#0f766e" : "#2563eb";
    const tag = `${item.id}`.padStart(2, "0");

    return (
      <g key={`${bank}-${item.id}`}>
        {bank === "top" ? (
          <line x1={x} y1={y + 58} x2={x} y2="137" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 4" />
        ) : (
          <line x1={x} y1="252" x2={x} y2={y} stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 4" />
        )}
        <path
          d={`M ${x - 33} ${y + 58} L ${x - 25} ${y} L ${x + 25} ${y} L ${x + 33} ${y + 58} Z`}
          fill={fill}
          stroke={stroke}
          strokeWidth="2"
        />
        <text x={x} y={y + 19} textAnchor="middle" fontSize="13" fontWeight="900" fill="#334155">
          {language === "zh" ? `${tag}${cylinderLabel}` : `${cylinderLabel} ${tag}`}
        </text>
        <text x={x} y={y + 44} textAnchor="middle" fontSize="15" fontWeight="900" fill={hot ? "#dc2626" : stroke}>
          {temp.value}{temp.unit}
        </text>
      </g>
    );
  };

  return (
    <svg viewBox="0 35 760 320" className="h-full min-h-0 w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="engineBody46" x1="0" x2="1">
          <stop offset="0" stopColor="#cfdce5" />
          <stop offset="1" stopColor="#f2f6f9" />
        </linearGradient>
      </defs>

      <rect x="10" y="78" width="46" height="24" rx="5" fill="#dcf7f3" stroke="#0f766e" strokeWidth="1.5" />
      <text x="33" y="94" textAnchor="middle" fontSize="11" fontWeight="900" fill="#0f766e">1-8</text>
      <rect x="10" y="278" width="46" height="24" rx="5" fill="#e8f0ff" stroke="#2563eb" strokeWidth="1.5" />
      <text x="33" y="294" textAnchor="middle" fontSize="11" fontWeight="900" fill="#2563eb">9-16</text>

      <path d="M58 197 L128 132 L632 132 L702 197 L660 252 L100 252 Z" fill="url(#engineBody46)" stroke="#718096" strokeWidth="3" />
      <rect x="112" y="214" width="536" height="48" rx="7" fill="#dbe7ed" stroke="#718096" strokeWidth="2" />
      <line x1="78" y1="198" x2="682" y2="198" stroke="#94a3b8" strokeWidth="2.5" />
      <line x1="150" y1="230" x2="610" y2="230" stroke="#94a3b8" strokeWidth="2.5" />
      <rect x="205" y="154" width="350" height="28" rx="14" fill="#eef6fa" stroke="#94a3b8" strokeWidth="2" />
      <text x="380" y="173" textAnchor="middle" fontSize="13" fontWeight="900" fill="#475569">
        {sectionLabel}
      </text>

      {leftBank.map((item, index) => renderCylinder(item, index, "top"))}
      {rightBank.map((item, index) => renderCylinder(item, index, "bottom"))}
    </svg>
  );
};

const EngineSectionDiagram = ({ engine }) => {
  const { language } = useLanguage();
  const { formatUnit } = useUnitSystem();

  const standard = useMemo(() => {
    const cylinderTemps = engine?.cylinders?.length
      ? engine.cylinders.slice(0, 16)
      : Array.from({ length: 16 }, (_, index) => 405 + index * 3);
    while (cylinderTemps.length < 16) {
      cylinderTemps.push(cylinderTemps[cylinderTemps.length - 1] || 410);
    }

    const lbTemps = cylinderTemps.slice(0, 8);
    const rbTemps = cylinderTemps.slice(8, 16);
    const avg = (items) => items.reduce((sum, item) => sum + item, 0) / items.length;
    const oilPress = engine?.oilPressure || 4.2;
    const coolantTemp = engine?.coolantTemp || 78;
    const lubeOilTemp = coolantTemp + 7;
    const fuelDeliveryPress = 4.5;

    return {
      lubeOilPress: oilPress,
      coolantTemperature: coolantTemp,
      lubricatingOilTemperature: lubeOilTemp,
      coolantPressure: 3.2,
      seaWaterPressure: 2.8,
      expansionTankLowAlarm: false,
      exhaustCylinders: cylinderTemps.map((temp, index) => ({ id: index + 1, temp })),
      fuelRailPressure: 7.6,
      fuelDeliveryPressure: fuelDeliveryPress,
      intakeManifoldPressureLB: 2.4,
      intakeManifoldPressureRB: 2.6,
      intakeManifoldTemperatureLBF: 45,
      intakeManifoldTemperatureLBR: 47,
      intakeManifoldTemperatureRBF: 46,
      intakeManifoldTemperatureRBR: 48,
      exhaustTempLB: avg(lbTemps),
      exhaustTempRB: avg(rbTemps),
      crankcasePressure: 12.1,
      fuelTemperature: 38,
      barometricPressure: 1.0,
      lubeOilFilterDifferentialPressure: 0.52,
      mainControlPower: 24,
      backupControlPower: 24,
      lowLubOilShutdownBelow1500: oilPress < 2.1,
      lowLubOilShutdownAbove1500: oilPress < 2.8,
      highCoolantTemperatureShutdown: coolantTemp > 95,
      fuelLeakageAlarm: false,
      engineSpeed: engine?.rpm || 850,
      overspeedShutdown: (engine?.rpm || 850) > 1100,
      localEmergencyStop: false,
      remoteEmergencyStop: false,
    };
  }, [engine]);

  const labels = {
    overview: language === "zh" ? "46 参数总览" : "46-Parameter Overview",
    cooling: language === "zh" ? "冷却系统" : "Cooling",
    lubrication: language === "zh" ? "滑油系统" : "Lube Oil",
    fuel: language === "zh" ? "燃油系统" : "Fuel",
    intake: language === "zh" ? "进排气歧管" : "Intake / Exhaust",
    cylinders: language === "zh" ? "16 缸排气温度" : "16-Cylinder Exhaust Temp",
    control: language === "zh" ? "控制电源与停机报警" : "Control Power & Shutdown",
  };
  const zh = language === "zh";
  const paramLabels = {
    lubeOilPress: zh ? "滑油压力" : "Lube Oil Press",
    coolantTemp: zh ? "冷却水温度" : "Coolant Temp",
    lubeOilTemp: zh ? "滑油温度" : "Lube Oil Temp",
    coolantPress: zh ? "冷却水压力" : "Coolant Press",
    seaWaterPress: zh ? "海水压力" : "Sea Water Press",
    engineSpeed: zh ? "发动机转速" : "Engine Speed",
    lubOilTemp: zh ? "滑油温度" : "Lub. Oil Temp",
    filterDiffPress: zh ? "滤器压差" : "Filter Diff Press",
    crankcasePress: zh ? "曲轴箱压力" : "Crankcase Press",
    expansionTankLow: zh ? "膨胀水箱液位低" : "Expansion Tank Level Low",
    exhaustTempLB: zh ? "左列排气温度" : "Exhaust Temp. LB",
    exhaustTempRB: zh ? "右列排气温度" : "Exhaust Temp. RB",
    fuelRailPress: zh ? "燃油共轨压力" : "Fuel Rail Press",
    fuelDeliveryPress: zh ? "燃油供给压力" : "Fuel Delivery Press",
    fuelTemp: zh ? "燃油温度" : "Fuel Temp",
    fuelLeakageAlarm: zh ? "燃油泄漏报警" : "Fuel Leakage Alarm",
    manifoldPressLB: zh ? "左列歧管压力" : "Manifold Press LB",
    manifoldPressRB: zh ? "右列歧管压力" : "Manifold Press RB",
    tempLBF: zh ? "左列前端温度" : "Temp LBF",
    tempLBR: zh ? "左列后端温度" : "Temp LBR",
    tempRBF: zh ? "右列前端温度" : "Temp RBF",
    tempRBR: zh ? "右列后端温度" : "Temp RBR",
    barometricPress: zh ? "大气压力" : "Barometric Press",
    mainControlPower: zh ? "主控制电源" : "Main Control Power",
    backupControlPower: zh ? "备用控制电源" : "Backup Control Power",
    lowLOPressBelow1500: zh ? "低滑油压力停机 <1500" : "Low LO Press SD <1500",
    lowLOPressAbove1500: zh ? "低滑油压力停机 >1500" : "Low LO Press SD >1500",
    highCoolantTempSD: zh ? "高冷却水温停机" : "High Coolant Temp SD",
    overspeedShutdown: zh ? "超速停机" : "Overspeed Shutdown",
    localEmergencyStop: zh ? "本地急停" : "Local Emergency Stop",
    remoteEmergencyStop: zh ? "远程急停" : "Remote Emergency Stop",
    engineRunning: zh ? "发动机运行" : "Engine Running",
  };

  const pressure = (value, digits = 1) => formatUnit("pressure", value, digits);
  const temp = (value, digits = 0) => formatUnit("temperature", value, digits);

  const gauges = [
    { label: paramLabels.lubeOilPress, value: pressure(standard.lubeOilPress, 1).value, unit: pressure(standard.lubeOilPress, 1).unit, max: 6, color: "#0058bc" },
    { label: paramLabels.coolantTemp, value: temp(standard.coolantTemperature, 0).value, unit: temp(standard.coolantTemperature, 0).unit, max: 120, color: "#0f766e" },
    { label: paramLabels.lubeOilTemp, value: temp(standard.lubricatingOilTemperature, 0).value, unit: temp(standard.lubricatingOilTemperature, 0).unit, max: 120, color: "#7c3aed" },
    { label: paramLabels.coolantPress, value: pressure(standard.coolantPressure, 1).value, unit: pressure(standard.coolantPressure, 1).unit, max: 6, color: "#2563eb" },
    { label: paramLabels.seaWaterPress, value: pressure(standard.seaWaterPressure, 1).value, unit: pressure(standard.seaWaterPressure, 1).unit, max: 6, color: "#0891b2" },
    { label: paramLabels.engineSpeed, value: standard.engineSpeed, unit: zh ? "r/min" : "RPM", max: 1600, color: "#dc2626" },
  ];

  return (
    <div className="h-full min-h-[300px] overflow-hidden rounded-2xl border border-slate-200 bg-[#eef3f5] p-4 shadow-inner dark:border-white/10 dark:bg-[#15191d]">
      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-3">
        <div className="grid grid-cols-6 gap-3">
          {gauges.map((gauge) => (
            <MiniGauge key={gauge.label} {...gauge} />
          ))}
        </div>

        <div className="grid min-h-0 grid-cols-[1.22fr_2.56fr_1.22fr] gap-3">
          <div className="flex min-h-0 flex-col gap-3">
            <Panel title={labels.lubrication} className="flex-1">
              <div className="grid h-full auto-rows-fr grid-cols-2 gap-3">
                <DataCell label={paramLabels.lubeOilPress} value={pressure(standard.lubeOilPress, 1).value} unit={pressure(standard.lubeOilPress, 1).unit} />
                <DataCell label={paramLabels.lubOilTemp} value={temp(standard.lubricatingOilTemperature, 0).value} unit={temp(standard.lubricatingOilTemperature, 0).unit} />
                <DataCell label={paramLabels.filterDiffPress} value={pressure(standard.lubeOilFilterDifferentialPressure, 2).value} unit={pressure(standard.lubeOilFilterDifferentialPressure, 2).unit} />
                <DataCell label={paramLabels.crankcasePress} value={formatPlain(standard.crankcasePressure, 1)} unit="mmH2O" />
              </div>
            </Panel>

            <Panel title={labels.cooling} className="flex-1">
              <div className="grid h-full auto-rows-fr grid-cols-2 gap-3">
                <DataCell label={paramLabels.coolantTemp} value={temp(standard.coolantTemperature, 0).value} unit={temp(standard.coolantTemperature, 0).unit} />
                <DataCell label={paramLabels.coolantPress} value={pressure(standard.coolantPressure, 1).value} unit={pressure(standard.coolantPressure, 1).unit} />
                <DataCell label={paramLabels.seaWaterPress} value={pressure(standard.seaWaterPressure, 1).value} unit={pressure(standard.seaWaterPressure, 1).unit} />
                <StatusCell label={paramLabels.expansionTankLow} alarm={standard.expansionTankLowAlarm} />
              </div>
            </Panel>
          </div>

          <Panel title={labels.cylinders} className="min-h-0">
            <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3">
              <div className="grid grid-cols-2 gap-3">
                <DataCell label={paramLabels.exhaustTempLB} value={temp(standard.exhaustTempLB, 0).value} unit={temp(standard.exhaustTempLB, 0).unit} tone="info" />
                <DataCell label={paramLabels.exhaustTempRB} value={temp(standard.exhaustTempRB, 0).value} unit={temp(standard.exhaustTempRB, 0).unit} tone="info" />
              </div>

              <div className="flex min-h-0 items-center justify-center">
                <EngineSectionMap cylinders={standard.exhaustCylinders} formatUnit={formatUnit} language={language} />
              </div>
            </div>
          </Panel>

          <div className="flex min-h-0 flex-col gap-3">
            <Panel title={labels.fuel} className="flex-[0.7]">
              <div className="grid h-full auto-rows-fr grid-cols-2 gap-2.5">
                <DataCell label={paramLabels.fuelRailPress} value={pressure(standard.fuelRailPressure, 1).value} unit={pressure(standard.fuelRailPressure, 1).unit} />
                <DataCell label={paramLabels.fuelDeliveryPress} value={pressure(standard.fuelDeliveryPressure, 1).value} unit={pressure(standard.fuelDeliveryPressure, 1).unit} />
                <DataCell label={paramLabels.fuelTemp} value={temp(standard.fuelTemperature, 0).value} unit={temp(standard.fuelTemperature, 0).unit} />
                <StatusCell label={paramLabels.fuelLeakageAlarm} alarm={standard.fuelLeakageAlarm} />
              </div>
            </Panel>

            <Panel title={labels.intake} className="flex-[1.3]">
              <div className="grid h-full auto-rows-fr grid-cols-2 gap-2">
                <DataCell compact label={paramLabels.manifoldPressLB} value={pressure(standard.intakeManifoldPressureLB, 1).value} unit={pressure(standard.intakeManifoldPressureLB, 1).unit} />
                <DataCell compact label={paramLabels.manifoldPressRB} value={pressure(standard.intakeManifoldPressureRB, 1).value} unit={pressure(standard.intakeManifoldPressureRB, 1).unit} />
                <DataCell compact label={paramLabels.tempLBF} value={temp(standard.intakeManifoldTemperatureLBF, 0).value} unit={temp(standard.intakeManifoldTemperatureLBF, 0).unit} />
                <DataCell compact label={paramLabels.tempLBR} value={temp(standard.intakeManifoldTemperatureLBR, 0).value} unit={temp(standard.intakeManifoldTemperatureLBR, 0).unit} />
                <DataCell compact label={paramLabels.tempRBF} value={temp(standard.intakeManifoldTemperatureRBF, 0).value} unit={temp(standard.intakeManifoldTemperatureRBF, 0).unit} />
                <DataCell compact label={paramLabels.tempRBR} value={temp(standard.intakeManifoldTemperatureRBR, 0).value} unit={temp(standard.intakeManifoldTemperatureRBR, 0).unit} />
                <DataCell compact label={paramLabels.barometricPress} value={pressure(standard.barometricPressure, 1).value} unit={pressure(standard.barometricPressure, 1).unit} />
              </div>
            </Panel>
          </div>
        </div>

        <Panel title={labels.control}>
          <div className="grid h-full auto-rows-fr grid-cols-9 gap-3">
            <DataCell label={paramLabels.mainControlPower} value={formatPlain(standard.mainControlPower, 0)} unit="V" tone="good" />
            <DataCell label={paramLabels.backupControlPower} value={formatPlain(standard.backupControlPower, 0)} unit="V" tone="good" />
            <StatusCell label={paramLabels.lowLOPressBelow1500} alarm={standard.lowLubOilShutdownBelow1500} />
            <StatusCell label={paramLabels.lowLOPressAbove1500} alarm={standard.lowLubOilShutdownAbove1500} />
            <StatusCell label={paramLabels.highCoolantTempSD} alarm={standard.highCoolantTemperatureShutdown} />
            <StatusCell label={paramLabels.overspeedShutdown} alarm={standard.overspeedShutdown} />
            <StatusCell label={paramLabels.localEmergencyStop} alarm={standard.localEmergencyStop} />
            <StatusCell label={paramLabels.remoteEmergencyStop} alarm={standard.remoteEmergencyStop} />
            <StatusCell label={paramLabels.engineRunning} active />
          </div>
        </Panel>
      </div>
    </div>
  );
};

export default EngineSectionDiagram;
