import React, { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "./hooks/useLanguage";
import { useFullscreen } from "./hooks/useFullscreen";
import { useUnitSystem } from "./hooks/useUnitSystem";

const DEFAULT_MODBUS_CONFIG = {
  protocol: "MODBUS RTU",
  port: "RS485-1",
  baudRate: "9600",
  dataBits: "8",
  parity: "None",
  stopBits: "2",
  slaveId: "1",
  functionCode: "03",
  pollInterval: "1000",
  timeout: "1000",
  retries: "3",
  byteOrder: "ABCD",
  addressBase: "1-based",
};

const DEFAULT_SIGNAL_ROWS = [
  {
    id: "engine-speed",
    enabled: true,
    no: 1,
    name: "Engine Speed",
    zhName: "发动机转速",
    key: "genset.engineSpeed",
    group: "主发电机",
    type: "Analog",
    functionCode: "03",
    address: "40262",
    bit: "",
    dataType: "UInt16",
    range: "0-3000",
    scale: "1",
    unit: "rpm",
    decimals: 0,
    page: "Main Engine / Engine System",
    trend: true,
    status: "Good",
    value: "849 rpm",
  },
  {
    id: "coolant-temp",
    enabled: true,
    no: 2,
    name: "Coolant Temperature",
    zhName: "冷却水温度",
    key: "genset.coolantTemperature",
    group: "冷却系统",
    type: "Analog",
    functionCode: "03",
    address: "40263",
    bit: "",
    dataType: "UInt16",
    range: "0-150",
    scale: "1",
    unit: "°C",
    decimals: 0,
    page: "Engine System",
    trend: true,
    status: "Good",
    value: "83 °C",
  },
  {
    id: "oil-pressure",
    enabled: true,
    no: 4,
    name: "Oil Pressure",
    zhName: "滑油压力",
    key: "genset.oilPressure",
    group: "滑油系统",
    type: "Analog",
    functionCode: "03",
    address: "40267",
    bit: "",
    dataType: "UInt16",
    range: "0-1000",
    scale: "1",
    unit: "kPa",
    decimals: 0,
    page: "Main Engine / Engine System",
    trend: true,
    status: "Good",
    value: "390 kPa",
  },
  {
    id: "local-mode",
    enabled: true,
    no: 42,
    name: "Local Mode",
    zhName: "本地模式",
    key: "genset.localMode",
    group: "控制状态",
    type: "Status",
    functionCode: "03",
    address: "40001",
    bit: "8",
    dataType: "Boolean",
    range: "/",
    scale: "1",
    unit: "",
    decimals: 0,
    page: "Engine System",
    trend: false,
    status: "Good",
    value: "0",
  },
];

const DEFAULT_ALARM_ROWS = [
  {
    id: "common-alarm",
    enabled: true,
    no: 1,
    name: "Common Alarm",
    zhName: "综合报警",
    key: "genset.commonAlarm",
    address: "40001",
    bit: "0",
    functionCode: "03",
    triggerState: "1",
    display: "Global Banner / Alarm Page",
    sound: true,
    status: "Active",
    note: "船端已完成报警判断，UI 只显示该 bit 状态",
  },
  {
    id: "common-shutdown",
    enabled: true,
    no: 2,
    name: "Common Shutdown Alarm",
    zhName: "综合停机报警",
    key: "genset.commonShutdownAlarm",
    address: "40001",
    bit: "1",
    functionCode: "03",
    triggerState: "1",
    display: "Global Banner / Alarm Page",
    sound: true,
    status: "Normal",
    note: "不在 UI 端做停机逻辑判断",
  },
  {
    id: "coolant-level-low",
    enabled: true,
    no: 29,
    name: "Coolant Level Low Alarm",
    zhName: "冷却液位低报警",
    key: "genset.coolantLevelLowAlarm",
    address: "40034",
    bit: "12",
    functionCode: "03",
    triggerState: "1",
    display: "Alarm Page",
    sound: true,
    status: "Normal",
    note: "数字报警",
  },
  {
    id: "fuel-leakage",
    enabled: true,
    no: 30,
    name: "Fuel leakage alarm",
    zhName: "燃油泄漏报警",
    key: "genset.fuelLeakageAlarm",
    address: "40034",
    bit: "11",
    functionCode: "03",
    triggerState: "1",
    display: "Global Banner / Alarm Page",
    sound: true,
    status: "Normal",
    note: "数字报警",
  },
];

const ConfigPage = () => {
  const { t, language, setLanguage } = useLanguage();
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const { unitSystem, setUnitSystem } = useUnitSystem();
  const [activeSection, setActiveSection] = useState("display");
  const [signalTab, setSignalTab] = useState("signals");
  const [signalSearch, setSignalSearch] = useState("");
  const [selectedSignalId, setSelectedSignalId] = useState(DEFAULT_SIGNAL_ROWS[0].id);
  const [modbusConfig, setModbusConfig] = useState(DEFAULT_MODBUS_CONFIG);
  const [theme, setTheme] = useState("system");
  const [syncMode, setSyncMode] = useState("local");
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState(new Date());

  const sections = [
    { id: "display", label: t.displaySettings, icon: "palette" },
    { id: "signals", label: language === "zh" ? "通信映射" : "Signal Mapping", icon: "hub" },
    { id: "sync", label: t.envSync, icon: "cloud_sync" },
    { id: "about", label: t.about, icon: "info" },
  ];

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setLastSynced(new Date());
      setIsSyncing(false);
    }, 2000);
  };

  const signalTabs = [
    { key: "comm", label: language === "zh" ? "通信参数" : "Communication", icon: "settings_ethernet" },
    { key: "signals", label: language === "zh" ? "信号点表" : "Signal Table", icon: "table_rows" },
    { key: "alarms", label: language === "zh" ? "报警映射" : "Alarm Mapping", icon: "notifications_active" },
    { key: "debug", label: language === "zh" ? "实时调试" : "Live Debug", icon: "bug_report" },
  ];

  const visibleSignals = DEFAULT_SIGNAL_ROWS.filter((signal) => {
    const term = signalSearch.trim().toLowerCase();
    if (!term) return true;
    return [signal.name, signal.zhName, signal.key, signal.address, signal.group]
      .some((item) => String(item).toLowerCase().includes(term));
  });
  const selectedSignal =
    DEFAULT_SIGNAL_ROWS.find((signal) => signal.id === selectedSignalId) || DEFAULT_SIGNAL_ROWS[0];
  const activeAlarmCount = DEFAULT_ALARM_ROWS.filter((alarm) => alarm.status === "Active").length;

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden px-4 pb-4 pt-2">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <span className="material-symbols-outlined text-[#4cd7d0] text-2xl">settings</span>
        <h1 className="text-xl font-headline font-black tracking-tight">{t.configParameters}</h1>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 min-h-0 gap-4">
        {/* Sidebar */}
        <aside className="w-48 xl:w-52 shrink-0 flex flex-col gap-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                activeSection === section.id
                  ? "bg-white dark:bg-surface-container-low shadow-md"
                  : "hover:bg-white/50 dark:hover:bg-dark-surface-container-low"
              }`}
            >
              {activeSection === section.id && (
                <motion.div
                  layoutId="activeSection"
                  className="absolute left-0 w-1 h-8 bg-[#4cd7d0] rounded-r-full"
                />
              )}
              <span
                className={`material-symbols-outlined text-lg ${
                  activeSection === section.id ? "text-[#4cd7d0]" : "text-gray-400"
                }`}
              >
                {section.icon}
              </span>
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  activeSection === section.id ? "text-[#1A1B1F]" : "text-gray-500"
                }`}
              >
                {section.label}
              </span>
            </button>
          ))}
        </aside>

        {/* Content */}
        <section className="flex-1 bg-white dark:bg-surface-container-lowest rounded-2xl p-6 shadow-sm min-h-0 overflow-y-auto">
          {/* Display Settings */}
          {activeSection === "display" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h2 className="text-lg font-bold text-gray-800">{t.displaySettings}</h2>

              {/* Fullscreen Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-bold text-sm text-gray-800">{t.fullscreenMode}</p>
                  <p className="text-xs text-gray-500 mt-1">Enable fullscreen display</p>
                </div>
                <button
                  onClick={toggleFullscreen}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                    isFullscreen ? "bg-[#4cd7d0]" : "bg-gray-300"
                  }`}
                >
                  <motion.div
                    className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow"
                    animate={{ left: isFullscreen ? 26 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* Theme Selection */}
              <div>
                <p className="font-bold text-sm text-gray-800 mb-3">{t.dayNightMode}</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: "light", label: t.lightMode, icon: "light_mode", color: "#f59e0b" },
                    { key: "dark", label: t.darkMode, icon: "dark_mode", color: "#4b5563" },
                    { key: "system", label: t.systemDefault, icon: "settings_suggest", color: "#6b7280" },
                  ].map((mode) => (
                    <button
                      key={mode.key}
                      onClick={() => setTheme(mode.key)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        theme === mode.key
                          ? "border-[#4cd7d0] bg-[#f0fffe] shadow-md"
                          : "border-gray-200 bg-gray-50 hover:border-gray-300"
                      }`}
                    >
                      <span
                        className="material-symbols-outlined text-2xl"
                        style={{ color: mode.color }}
                      >
                        {mode.icon}
                      </span>
                      <span className="text-xs font-bold text-gray-700">{mode.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Language Selection */}
              <div>
                <p className="font-bold text-sm text-gray-800 mb-3">{t.language}</p>
                <div className="flex gap-3">
                  {[
                    { key: "en", label: t.english, flag: "EN" },
                    { key: "zh", label: t.chinese, flag: "中" },
                  ].map((lang) => (
                    <button
                      key={lang.key}
                      onClick={() => setLanguage(lang.key)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                        language === lang.key
                          ? "border-[#4cd7d0] bg-[#f0fffe] text-[#1A1B1F]"
                          : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      <span>{lang.flag}</span>
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-bold text-sm text-gray-800 mb-3">
                  {language === "zh" ? "单位制" : "Unit System"}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "metric", label: language === "zh" ? "公制" : "Metric", detail: "°C / bar / kW / L/h" },
                    { key: "imperial", label: language === "zh" ? "英制" : "Imperial", detail: "°F / psi / hp / gal/h" },
                  ].map((mode) => (
                    <button
                      key={mode.key}
                      onClick={() => setUnitSystem(mode.key)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        unitSystem === mode.key
                          ? "border-[#4cd7d0] bg-[#f0fffe] shadow-md"
                          : "border-gray-200 bg-gray-50 hover:border-gray-300"
                      }`}
                    >
                      <span className="block text-sm font-bold text-gray-800">{mode.label}</span>
                      <span className="mt-1 block text-[11px] text-gray-500">{mode.detail}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {language === "zh" ? "切换后主要页面会统一换算温度、压力、功率、流量和距离单位。" : "Switching applies conversion to temperature, pressure, power, flow, and distance displays across the dashboard."}
                </p>
              </div>
            </motion.div>
          )}

          {/* Communication & Signal Mapping */}
          {activeSection === "signals" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex h-full min-h-[620px] flex-col gap-4"
            >
              <div className="flex shrink-0 items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">
                    {language === "zh" ? "通信与信号映射" : "Communication & Signal Mapping"}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {[
                    { label: language === "zh" ? "导入 Excel" : "Import Excel", icon: "upload_file" },
                    { label: language === "zh" ? "导出配置" : "Export", icon: "download" },
                    { label: language === "zh" ? "测试通信" : "Test Link", icon: "cable" },
                    { label: language === "zh" ? "保存并应用" : "Save & Apply", icon: "save" },
                  ].map((action) => (
                    <button
                      key={action.label}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                        action.icon === "save"
                          ? "bg-[#4cd7d0] text-[#00201e] hover:bg-[#3bc4bc]"
                          : "border border-gray-200 bg-gray-50 text-gray-600 hover:border-[#4cd7d0]/60 hover:bg-[#f0fffe]"
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">{action.icon}</span>
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid shrink-0 grid-cols-5 gap-3">
                {[
                  { label: language === "zh" ? "协议" : "Protocol", value: modbusConfig.protocol, tone: "text-blue-600" },
                  { label: language === "zh" ? "串口" : "Port", value: modbusConfig.port, tone: "text-slate-800" },
                  { label: language === "zh" ? "通信参数" : "Frame", value: `${modbusConfig.baudRate} / 8N2`, tone: "text-slate-800" },
                  { label: language === "zh" ? "信号点" : "Signals", value: DEFAULT_SIGNAL_ROWS.length, tone: "text-emerald-600" },
                  { label: language === "zh" ? "活动报警" : "Active Alarms", value: activeAlarmCount, tone: activeAlarmCount ? "text-red-600" : "text-emerald-600" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                    <div className="text-[10px] font-black uppercase tracking-wider text-gray-400">{item.label}</div>
                    <div className={`mt-1 text-lg font-black ${item.tone}`}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="flex shrink-0 gap-2 rounded-full bg-gray-100 p-1">
                {signalTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setSignalTab(tab.key)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                      signalTab === tab.key ? "bg-white text-[#1A1B1F] shadow-sm" : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {signalTab === "comm" && (
                <div className="min-h-0 flex-1">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-sm font-black text-gray-800">
                        {language === "zh" ? "MODBUS 通信参数" : "MODBUS Communication"}
                      </h3>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700">
                        {language === "zh" ? "来自协议表默认值" : "From protocol sheet"}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        ["protocol", language === "zh" ? "协议" : "Protocol", ["MODBUS RTU", "MODBUS TCP"]],
                        ["port", language === "zh" ? "端口" : "Port", ["RS485-1", "RS485-2", "/dev/ttyUSB0"]],
                        ["baudRate", language === "zh" ? "波特率" : "Baud Rate", ["9600", "19200", "38400", "115200"]],
                        ["dataBits", language === "zh" ? "数据位" : "Data Bits", ["8", "7"]],
                        ["parity", language === "zh" ? "校验位" : "Parity", ["None", "Even", "Odd"]],
                        ["stopBits", language === "zh" ? "停止位" : "Stop Bits", ["1", "2"]],
                        ["functionCode", language === "zh" ? "默认功能码" : "Default Function", ["03", "04", "01", "02"]],
                        ["byteOrder", language === "zh" ? "字节序" : "Byte Order", ["ABCD", "BADC", "CDAB", "DCBA"]],
                        ["addressBase", language === "zh" ? "地址基准" : "Address Base", ["1-based", "0-based"]],
                      ].map(([key, label, options]) => (
                        <label key={key} className="block">
                          <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-gray-400">{label}</span>
                          <select
                            value={modbusConfig[key]}
                            onChange={(event) => setModbusConfig((prev) => ({ ...prev, [key]: event.target.value }))}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-800 outline-none focus:border-[#4cd7d0]"
                          >
                            {options.map((option) => <option key={option}>{option}</option>)}
                          </select>
                        </label>
                      ))}
                      {[
                        ["slaveId", language === "zh" ? "从站地址" : "Slave ID"],
                        ["pollInterval", language === "zh" ? "轮询周期 ms" : "Poll ms"],
                        ["timeout", language === "zh" ? "超时 ms" : "Timeout ms"],
                        ["retries", language === "zh" ? "重试次数" : "Retries"],
                      ].map(([key, label]) => (
                        <label key={key} className="block">
                          <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-gray-400">{label}</span>
                          <input
                            value={modbusConfig[key]}
                            onChange={(event) => setModbusConfig((prev) => ({ ...prev, [key]: event.target.value }))}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-800 outline-none focus:border-[#4cd7d0]"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {signalTab === "signals" && (
                <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_320px] gap-4">
                  <div className="flex min-h-0 flex-col rounded-2xl border border-gray-100 bg-gray-50">
                    <div className="flex shrink-0 items-center gap-3 border-b border-gray-200 p-3">
                      <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base text-gray-400">search</span>
                        <input
                          value={signalSearch}
                          onChange={(event) => setSignalSearch(event.target.value)}
                          placeholder={language === "zh" ? "搜索信号名、地址、变量 Key..." : "Search signal, address, variable key..."}
                          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#4cd7d0]"
                        />
                      </div>
                      <button className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-black uppercase text-gray-600">
                        {language === "zh" ? "批量编辑" : "Batch Edit"}
                      </button>
                    </div>
                    <div className="min-h-0 overflow-auto">
                      <table className="w-full min-w-[980px] text-left text-xs">
                        <thead className="sticky top-0 bg-gray-100 text-[10px] uppercase tracking-wider text-gray-500">
                          <tr>
                            {["启用", "NO.", "Signal Content", "变量 Key", "功能码", "地址", "Bit", "数据类型", "范围", "单位", "当前值", "质量", "页面"].map((head) => (
                              <th key={head} className="border-b border-gray-200 px-3 py-2 font-black">{head}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {visibleSignals.map((signal) => (
                            <tr
                              key={signal.id}
                              onClick={() => setSelectedSignalId(signal.id)}
                              className={`cursor-pointer border-b border-gray-100 transition-colors ${
                                selectedSignalId === signal.id ? "bg-[#edfffd]" : "bg-white hover:bg-gray-50"
                              }`}
                            >
                              <td className="px-3 py-2"><input type="checkbox" checked={signal.enabled} readOnly /></td>
                              <td className="px-3 py-2 font-bold">{signal.no}</td>
                              <td className="px-3 py-2">
                                <div className="font-black text-gray-800">{signal.name}</div>
                                <div className="text-[10px] text-gray-400">{signal.zhName}</div>
                              </td>
                              <td className="px-3 py-2 font-mono text-[11px] text-blue-700">{signal.key}</td>
                              <td className="px-3 py-2">{signal.functionCode}</td>
                              <td className="px-3 py-2 font-mono font-bold">{signal.address}</td>
                              <td className="px-3 py-2">{signal.bit || "-"}</td>
                              <td className="px-3 py-2">{signal.dataType}</td>
                              <td className="px-3 py-2">{signal.range}</td>
                              <td className="px-3 py-2">{signal.unit || "-"}</td>
                              <td className="px-3 py-2 font-black text-gray-800">{signal.value}</td>
                              <td className="px-3 py-2"><span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">{signal.status}</span></td>
                              <td className="px-3 py-2 text-gray-500">{signal.page}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <aside className="min-h-0 overflow-auto rounded-2xl border border-gray-100 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-gray-800">{language === "zh" ? "信号详情" : "Signal Detail"}</h3>
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-700">{selectedSignal.type}</span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {[
                        [language === "zh" ? "英文名称" : "Name", selectedSignal.name],
                        [language === "zh" ? "中文名称" : "Chinese Name", selectedSignal.zhName],
                        [language === "zh" ? "变量 Key" : "Variable Key", selectedSignal.key],
                        [language === "zh" ? "设备分组" : "Group", selectedSignal.group],
                        [language === "zh" ? "地址" : "Address", selectedSignal.bit ? `${selectedSignal.address}.${selectedSignal.bit}` : selectedSignal.address],
                        [language === "zh" ? "数据类型" : "Data Type", selectedSignal.dataType],
                        [language === "zh" ? "缩放/单位" : "Scale / Unit", `${selectedSignal.scale} ${selectedSignal.unit}`],
                        [language === "zh" ? "页面绑定" : "Page Binding", selectedSignal.page],
                      ].map(([label, value]) => (
                        <label key={label} className="block">
                          <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-gray-400">{label}</span>
                          <input readOnly value={value} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-800" />
                        </label>
                      ))}
                    </div>
                  </aside>
                </div>
              )}

              {signalTab === "alarms" && (
                <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-gray-100 bg-gray-50">
                  <div className="flex shrink-0 items-center justify-between border-b border-gray-200 p-3">
                    <div>
                      <h3 className="text-sm font-black text-gray-800">{language === "zh" ? "船端报警信号映射" : "Vessel-Side Alarm Signal Mapping"}</h3>
                      <p className="mt-1 text-xs text-gray-500">
                        {language === "zh" ? "这里只配置报警 bit 的名称和显示行为，不配置报警阈值、不做报警判断。" : "Only map alarm bit names and display behavior. No threshold or judgement is configured here."}
                      </p>
                    </div>
                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-600">
                      {language === "zh" ? `${activeAlarmCount} 个活动报警` : `${activeAlarmCount} active`}
                    </span>
                  </div>
                  <div className="min-h-0 overflow-auto">
                    <table className="w-full min-w-[980px] text-left text-xs">
                      <thead className="sticky top-0 bg-gray-100 text-[10px] uppercase tracking-wider text-gray-500">
                        <tr>
                          {["启用", "NO.", "报警名称", "变量 Key", "地址", "Bit", "触发状态", "当前状态", "声音", "显示位置", "备注"].map((head) => (
                            <th key={head} className="border-b border-gray-200 px-3 py-2 font-black">{head}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {DEFAULT_ALARM_ROWS.map((alarm) => (
                          <tr key={alarm.id} className="border-b border-gray-100 bg-white hover:bg-gray-50">
                            <td className="px-3 py-2"><input type="checkbox" checked={alarm.enabled} readOnly /></td>
                            <td className="px-3 py-2 font-bold">{alarm.no}</td>
                            <td className="px-3 py-2">
                              <div className="font-black text-gray-800">{alarm.name}</div>
                              <div className="text-[10px] text-gray-400">{alarm.zhName}</div>
                            </td>
                            <td className="px-3 py-2 font-mono text-[11px] text-blue-700">{alarm.key}</td>
                            <td className="px-3 py-2 font-mono font-bold">{alarm.address}</td>
                            <td className="px-3 py-2">{alarm.bit}</td>
                            <td className="px-3 py-2">bit = {alarm.triggerState}</td>
                            <td className="px-3 py-2">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                                alarm.status === "Active" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                              }`}>
                                {alarm.status}
                              </span>
                            </td>
                            <td className="px-3 py-2">{alarm.sound ? "ON" : "OFF"}</td>
                            <td className="px-3 py-2 text-gray-500">{alarm.display}</td>
                            <td className="px-3 py-2 text-gray-500">{alarm.note}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {signalTab === "debug" && (
                <div className="grid min-h-0 flex-1 grid-cols-[1fr_1fr] gap-4">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <h3 className="text-sm font-black text-gray-800">{language === "zh" ? "实时通信状态" : "Live Communication Status"}</h3>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {[
                        [language === "zh" ? "连接状态" : "Connection", "Online", "text-emerald-600"],
                        [language === "zh" ? "响应时间" : "Response", "38 ms", "text-blue-600"],
                        [language === "zh" ? "成功率" : "Success Rate", "99.7%", "text-emerald-600"],
                        [language === "zh" ? "CRC 错误" : "CRC Errors", "0", "text-slate-800"],
                        [language === "zh" ? "超时次数" : "Timeouts", "1", "text-yellow-600"],
                        [language === "zh" ? "最后轮询" : "Last Poll", "2s ago", "text-slate-800"],
                      ].map(([label, value, color]) => (
                        <div key={label} className="rounded-xl bg-white p-3">
                          <div className="text-[10px] font-black uppercase tracking-wider text-gray-400">{label}</div>
                          <div className={`mt-1 text-lg font-black ${color}`}>{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-[#0f172a] p-4 text-white">
                    <h3 className="text-sm font-black">{language === "zh" ? "原始帧日志" : "Raw Frame Log"}</h3>
                    <div className="mt-4 space-y-2 font-mono text-xs text-white/70">
                      {[
                        "TX 01 03 9D 46 00 06 1A C4",
                        "RX 01 03 0C 03 51 00 53 00 5A 01 86 01 40 7B 29",
                        "TX 01 03 9C 41 00 01 CB 16",
                        "RX 01 03 02 00 01 79 84",
                      ].map((line) => (
                        <div key={line} className="rounded-lg bg-white/5 px-3 py-2">{line}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Environment & Sync */}
          {activeSection === "sync" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h2 className="text-lg font-bold text-gray-800">{t.envSync}</h2>

              {/* Sync Mode Toggle */}
              <div className="flex gap-2 p-1 bg-gray-100 rounded-full">
                {[
                  { key: "local", label: t.localConfig, icon: "memory" },
                  { key: "cloud", label: t.cloudConfig, icon: "cloud" },
                ].map((mode) => (
                  <button
                    key={mode.key}
                    onClick={() => setSyncMode(mode.key)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                      syncMode === mode.key
                        ? "bg-white text-[#1A1B1F] shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {mode.icon}
                    </span>
                    {mode.label}
                  </button>
                ))}
              </div>

              {/* Last Synced */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-bold text-sm text-gray-800">{t.lastSynced}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {lastSynced.toLocaleString(language === "zh" ? "zh-CN" : "en-US")}
                  </p>
                </div>
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    isSyncing
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-[#4cd7d0] text-[#00201e] hover:bg-[#3bc4bc]"
                  }`}
                >
                  {isSyncing ? (
                    <span className="flex items-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="material-symbols-outlined text-sm"
                      >
                        progress_activity
                      </motion.span>
                      Syncing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">sync</span>
                      {t.syncNow}
                    </span>
                  )}
                </button>
              </div>

              {/* Sync Status */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Settings", status: "synced", icon: "settings" },
                  { label: "Alarms", status: "pending", icon: "notifications" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`p-4 rounded-xl border ${
                      item.status === "synced"
                        ? "bg-green-50 border-green-200"
                        : "bg-yellow-50 border-yellow-200"
                    }`}
                  >
                    <span className={`material-symbols-outlined text-lg ${
                      item.status === "synced" ? "text-green-500" : "text-yellow-500"
                    }`}>
                      {item.icon}
                    </span>
                    <p className="text-xs font-bold text-gray-700 mt-2">{item.label}</p>
                    <p className={`text-[10px] font-bold uppercase ${
                      item.status === "synced" ? "text-green-600" : "text-yellow-600"
                    }`}>
                      {item.status === "synced" ? "Synced" : "Pending"}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* About */}
          {activeSection === "about" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#4CD7D0] to-[#0058bc] rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-black text-2xl">AM</span>
                </div>
                <div>
                  <h2 className="text-2xl font-headline font-black tracking-tight">AURA MARINE</h2>
                  <p className="text-sm text-gray-500">{t.version} 1.0.0</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Advanced Marine Vessel Digital Twin & Modular Monitoring System. Engine monitoring,
                real-time telemetry, trend analysis, and AI-powered optimization.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "React", version: "18.x" },
                  { label: "Tailwind CSS", version: "3.x" },
                  { label: "Three.js", version: "0.160+" },
                ].map((dep) => (
                  <div key={dep.label} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-200">
                    <p className="text-xs font-bold text-gray-700">{dep.label}</p>
                    <p className="text-[10px] text-gray-400">{dep.version}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ConfigPage;
