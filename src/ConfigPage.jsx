import React, { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "./hooks/useLanguage";
import { useFullscreen } from "./hooks/useFullscreen";
import { useUnitSystem } from "./hooks/useUnitSystem";

// Default threshold values
const DEFAULT_THRESHOLDS = {
  exhaustTemp: { yellow: 420, red: 450 },
  oilPressure: { yellow: 3.5, red: 3.0 },
  coolantTemp: { yellow: 85, red: 95 },
  rpm: { yellow: 950, red: 1000 },
  fuelRate: { yellow: 320, red: 350 },
};

const ConfigPage = () => {
  const { t, language, setLanguage } = useLanguage();
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const { unitSystem, setUnitSystem } = useUnitSystem();
  const [activeSection, setActiveSection] = useState("display");
  const [theme, setTheme] = useState("system");
  const [syncMode, setSyncMode] = useState("local");
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState(new Date());
  const [saveMessage, setSaveMessage] = useState(null);

  // Threshold config state
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);

  const sections = [
    { id: "display", label: t.displaySettings, icon: "palette" },
    { id: "sync", label: t.envSync, icon: "cloud_sync" },
    { id: "thresholds", label: t.thresholdConfig, icon: "tune" },
    { id: "about", label: t.about, icon: "info" },
  ];

  const handleSave = () => {
    setSaveMessage(t.savedSuccess);
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleReset = () => {
    setThresholds(DEFAULT_THRESHOLDS);
  };

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setLastSynced(new Date());
      setIsSyncing(false);
    }, 2000);
  };

  const thresholdMetrics = [
    {
      key: "exhaustTemp",
      label: t.exhTemp,
      unit: "°C",
      min: 300,
      max: 550,
    },
    {
      key: "oilPressure",
      label: t.oilPress,
      unit: "bar",
      min: 1,
      max: 6,
    },
    {
      key: "coolantTemp",
      label: t.coolantTemp,
      unit: "°C",
      min: 50,
      max: 110,
    },
    {
      key: "rpm",
      label: t.engineSpeed,
      unit: t.rpm,
      min: 500,
      max: 1200,
    },
    {
      key: "fuelRate",
      label: t.fuelRate,
      unit: t.lh,
      min: 100,
      max: 450,
    },
  ];

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
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Settings", status: "synced", icon: "settings" },
                  { label: "Thresholds", status: "synced", icon: "tune" },
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

          {/* Threshold Configurator */}
          {activeSection === "thresholds" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800">{t.thresholdConfig}</h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border-2 border-gray-300 text-gray-600 hover:bg-gray-50 transition-all"
                  >
                    {t.resetDefaults}
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#4cd7d0] text-[#00201e] hover:bg-[#3bc4bc] transition-all shadow-md"
                  >
                    {t.saveChanges}
                  </button>
                </div>
              </div>

              {saveMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-50 border border-green-200 text-green-700 text-xs font-bold px-4 py-2 rounded-lg"
                >
                  ✓ {saveMessage}
                </motion.div>
              )}

              <div className="space-y-4">
                {thresholdMetrics.map((metric) => (
                  <div
                    key={metric.key}
                    className="p-4 bg-gray-50 rounded-xl border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-gray-800">{metric.label}</span>
                      <span className="text-xs text-gray-500">({metric.unit})</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Yellow Warning */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-3 h-3 rounded-full bg-yellow-400" />
                          <span className="text-xs font-bold text-gray-600">{t.yellowWarningThreshold}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={thresholds[metric.key].yellow}
                            onChange={(e) =>
                              setThresholds((prev) => ({
                                ...prev,
                                [metric.key]: {
                                  ...prev[metric.key],
                                  yellow: parseFloat(e.target.value) || 0,
                                },
                              }))
                            }
                            className="flex-1 px-3 py-2 rounded-lg border border-yellow-300 bg-white text-sm font-bold text-yellow-700 focus:outline-none focus:border-yellow-500 text-center"
                            min={metric.min}
                            max={metric.max}
                          />
                          <span className="text-xs text-gray-500">{metric.unit}</span>
                        </div>
                      </div>
                      {/* Red Alarm */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          <span className="text-xs font-bold text-gray-600">{t.redAlarmThreshold}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={thresholds[metric.key].red}
                            onChange={(e) =>
                              setThresholds((prev) => ({
                                ...prev,
                                [metric.key]: {
                                  ...prev[metric.key],
                                  red: parseFloat(e.target.value) || 0,
                                },
                              }))
                            }
                            className="flex-1 px-3 py-2 rounded-lg border border-red-300 bg-white text-sm font-bold text-red-600 focus:outline-none focus:border-red-500 text-center"
                            min={metric.min}
                            max={metric.max}
                          />
                          <span className="text-xs text-gray-500">{metric.unit}</span>
                        </div>
                      </div>
                    </div>
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
