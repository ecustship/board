import React, { useState, useEffect, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { YachtModel } from "./YachtModel";
import MainEngine from "./MainEngine";
import NauticalCharts from "./NauticalCharts";
import Alarms from "./Alarms";
import Trend from "./trend";
import EngineSystems from "./EngineSystems";
import ConfigPage from "./ConfigPage";
import { useVesselData, useSystemStatus } from "./hooks/useRealTimeData";
import { useFullscreen } from "./hooks/useFullscreen";
import { LanguageProvider, useLanguage } from "./hooks/useLanguage";

// Search Modal Component
const SearchModal = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const recentSearches = ["Engine Temperature", "Alarm History", "Fuel Consumption"];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white dark:bg-[#1A1B1F] rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-gray-400">search</span>
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-lg text-gray-900 dark:text-white placeholder-gray-400"
                autoFocus
              />
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-gray-400">close</span>
              </button>
            </div>
          </div>
          <div className="p-4 max-h-96 overflow-y-auto">
            {query === "" ? (
              <>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  {t.recentSearches}
                </h3>
                <div className="space-y-2">
                  {recentSearches.map((item, idx) => (
                    <button
                      key={idx}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-gray-400 text-sm">history</span>
                      <span className="text-gray-700 dark:text-gray-300">{item}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-400">
                {t.noResults}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Settings Modal Component
const SettingsModal = ({ isOpen, onClose, theme, setTheme }) => {
  const { t, language, setLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState("general");

  if (!isOpen) return null;

  const tabs = [
    { id: "general", label: t.general, icon: "settings" },
    { id: "display", label: t.display, icon: "palette" },
    { id: "notifications", label: t.notifications, icon: "notifications" },
    { id: "about", label: t.about, icon: "info" },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-16"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white dark:bg-[#1A1B1F] rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t.settings}</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-gray-400">close</span>
            </button>
          </div>

          <div className="flex">
            {/* Sidebar */}
            <div className="w-40 border-r border-gray-200 dark:border-gray-700 p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors mb-1 ${
                    activeTab === tab.id
                      ? "bg-[#4CD7D0] text-[#00201e] font-bold"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 p-4">
              {activeTab === "general" && (
                <div className="space-y-4">
                  {/* Language Selection */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      {t.language}
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setLanguage("en")}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                          language === "en"
                            ? "bg-[#4CD7D0] text-[#00201e]"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {t.english}
                      </button>
                      <button
                        onClick={() => setLanguage("zh")}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                          language === "zh"
                            ? "bg-[#4CD7D0] text-[#00201e]"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {t.chinese}
                      </button>
                    </div>
                  </div>

                  {/* Theme Selection */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      {t.theme}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setTheme("light")}
                        className={`py-2 px-3 rounded-lg text-xs font-medium transition-colors border-2 ${
                          theme === "light"
                            ? "border-[#4CD7D0] bg-[#4CD7D0]/10 text-[#00201e] dark:text-[#4CD7D0] dark:bg-[#4CD7D0]/10"
                            : "border-transparent bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {t.lightMode}
                      </button>
                      <button
                        onClick={() => setTheme("dark")}
                        className={`py-2 px-3 rounded-lg text-xs font-medium transition-colors border-2 ${
                          theme === "dark"
                            ? "border-[#4CD7D0] bg-[#4CD7D0]/10 text-[#00201e] dark:text-[#4CD7D0] dark:bg-[#4CD7D0]/10"
                            : "border-transparent bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {t.darkMode}
                      </button>
                      <button
                        onClick={() => setTheme("system")}
                        className={`py-2 px-3 rounded-lg text-xs font-medium transition-colors border-2 ${
                          theme === "system"
                            ? "border-[#4CD7D0] bg-[#4CD7D0]/10 text-[#00201e] dark:text-[#4CD7D0] dark:bg-[#4CD7D0]/10"
                            : "border-transparent bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {t.systemDefault}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "display" && (
                <div className="text-gray-500 dark:text-gray-400 text-sm">
                  Display settings coming soon...
                </div>
              )}

              {activeTab === "notifications" && (
                <div className="text-gray-500 dark:text-gray-400 text-sm">
                  Notification settings coming soon...
                </div>
              )}

              {activeTab === "about" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#4CD7D0] to-[#0058bc] rounded-2xl flex items-center justify-center">
                      <span className="text-white font-black text-xl">AM</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">AURA MARINE</h3>
                      <p className="text-sm text-gray-500">{t.version} 1.0.0</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    Advanced Marine Vessel Monitoring System
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Account Modal Component
const AccountModal = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-16"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white dark:bg-[#1A1B1F] rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-[#4CD7D0] to-[#0058bc] p-6 text-center">
            <div className="w-20 h-20 bg-white rounded-full mx-auto mb-3 flex items-center justify-center shadow-lg">
              <span className="text-3xl">👨‍✈️</span>
            </div>
            <h3 className="text-xl font-bold text-white">{t.userName}</h3>
            <p className="text-white/80 text-sm">{t.userRole}</p>
            <p className="text-white/60 text-xs mt-1">{t.userId}</p>
          </div>

          {/* Menu Items */}
          <div className="p-4 space-y-2">
            <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <span className="material-symbols-outlined text-[#4CD7D0]">person</span>
              <span className="text-gray-700 dark:text-gray-300 font-medium">{t.profile}</span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <span className="material-symbols-outlined text-[#4CD7D0]">history</span>
              <span className="text-gray-700 dark:text-gray-300 font-medium">Activity Log</span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <span className="material-symbols-outlined text-[#4CD7D0]">help</span>
              <span className="text-gray-700 dark:text-gray-300 font-medium">Help & Support</span>
            </button>
            <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
            <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group">
              <span className="material-symbols-outlined text-red-500">logout</span>
              <span className="text-red-500 font-medium">{t.logout}</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const InnerDashboard = () => {
  const { t, language, setLanguage } = useLanguage();
  const [theme, setTheme] = useState("system");

  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = theme === "dark" || (theme === "system" && prefersDark);

    root.classList.toggle("dark", shouldUseDark);
    root.style.colorScheme = shouldUseDark ? "dark" : "light";
  }, [theme]);
  const [activeView, setActiveView] = useState("navigation");
  const [modelRotationPct, setModelRotationPct] = useState(33);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const [yachtAutoRotate, setYachtAutoRotate] = useState(true);

  // Keyboard shortcut for fullscreen (F11)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "F11") {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleFullscreen]);

  // Real-time data hooks
  const vesselData = useVesselData(1000);
  const systemStatus = useSystemStatus(1500);

  const rotationY = (modelRotationPct / 100) * Math.PI * 2;

  const navButtons = [
    { key: "main-engine", label: t.mainEngine },
    { key: "engine-systems", label: t.engineSystems },
    { key: "navigation", label: t.navigation },
    { key: "alarms", label: t.alarms },
    { key: "trend", label: t.trend },
    { key: "nautical-charts", label: t.nauticalCharts },
    { key: "config", label: t.configParameters },
  ];

  return (
    <div className="h-[100dvh] max-h-[100dvh] flex flex-col overflow-hidden bg-[#F1F3F5] bg-[radial-gradient(#d1d5db_0.5px,transparent_0.5px)] [background-size:24px_24px] dark:bg-grid font-body">
        {/* TopNavBar */}
        <header className="w-full shrink-0 pt-2 px-2 relative z-50">
          <nav className="bg-[#F2F4F6] dark:bg-surface-container rounded-full mx-2 shadow-[0_16px_32px_rgba(25,28,30,0.06)] dark:shadow-[0_16px_32px_rgba(0,0,0,0.3)] flex justify-between items-center max-w-[1400px] lg:mx-auto px-4 h-12 sm:h-14">
            <div className="flex items-center h-full">
              <img
                src="/image/logo.png"
                alt="Logo"
                className="h-8 sm:h-9 w-auto object-contain"
              />
            </div>
            <div className="hidden md:flex items-center gap-2">
              {navButtons.map((btn) => (
                <button
                  key={btn.key}
                  className={`${
                    activeView === btn.key
                      ? "bg-[#1A1B1F] dark:bg-[#4CD7D0] text-white dark:text-[#00201e] rounded-full"
                      : "text-[#1A1B1F] dark:text-[#F8F9FB] opacity-70 rounded-full"
                  } px-3 sm:px-6 py-1.5 text-xs sm:text-sm transition-all font-bold tracking-wider uppercase scale-100 active:scale-95 duration-150 hover:opacity-100 hover:scale-105`}
                  onClick={() => setActiveView(btn.key)}
                >
                  {btn.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-[#4CD7D0]">
              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="material-symbols-outlined hover:scale-110 transition-transform p-1"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? "fullscreen_exit" : "fullscreen"}
              </button>
              {/* Search Button */}
              <button
                onClick={() => setSearchOpen(true)}
                className="material-symbols-outlined hover:scale-110 transition-transform p-1"
                title={t.search}
              >
                search
              </button>
              {/* Settings Button */}
              <button
                onClick={() => setSettingsOpen(true)}
                className="material-symbols-outlined hover:scale-110 transition-transform p-1"
                title={t.settings}
              >
                settings
              </button>
              {/* Account Button */}
              <button
                onClick={() => setAccountOpen(true)}
                className="material-symbols-outlined hover:scale-110 transition-transform p-1"
                title={t.account}
              >
                account_circle
              </button>
            </div>
          </nav>
        </header>

        {/* Modals */}
        <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          theme={theme}
          setTheme={setTheme}
        />
        <AccountModal isOpen={accountOpen} onClose={() => setAccountOpen(false)} />

        {/* Main Content */}
        {activeView === "main-engine" ? (
          <MainEngine />
        ) : activeView === "nautical-charts" ? (
          <NauticalCharts />
        ) : activeView === "alarms" ? (
          <Alarms />
        ) : activeView === "trend" ? (
          <Trend />
        ) : activeView === "engine-systems" ? (
          <EngineSystems />
        ) : activeView === "config" ? (
          <ConfigPage />
        ) : (
          <main className="flex-1 min-h-0 w-full px-2 sm:px-3 py-2 grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-3 max-w-[1600px] mx-auto items-stretch">
            {/* Column 1 */}
            <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-3 flex flex-col gap-1.5 min-h-0 h-full overflow-hidden"
            >
              <div className="flex justify-between items-end shrink-0">
                <h2 className="font-headline font-black text-lg sm:text-xl tracking-tighter text-on-background dark:text-on-background">
                  {t.vessel}
                </h2>
                <span className="font-label text-[10px] uppercase tracking-widest opacity-60 text-on-background dark:text-on-background">
                  {t.cctv}
                </span>
              </div>

              <div className="bg-surface-container-lowest dark:bg-surface-container-lowest rounded-xl p-2 sm:p-3 shadow-sm flex-1 min-h-0 flex flex-col">
                <div className="flex gap-1.5 mb-2">
                  <button className="bg-on-secondary-fixed dark:bg-surface-container-high text-white dark:text-surface-container px-4 py-1 rounded-full text-xs font-bold">
                    {t.cctv1}
                  </button>
                  <button className="bg-surface-container-low dark:bg-surface-container-low text-on-surface dark:text-surface-container px-4 py-1 rounded-full text-xs font-bold opacity-60">
                    {t.cctv2}
                  </button>
                  <button className="bg-surface-container-low dark:bg-surface-container-low text-on-surface dark:text-surface-container px-4 py-1 rounded-full text-xs font-bold opacity-60">
                    {t.cctv3}
                  </button>
                </div>
                <div className="grid grid-cols-2 grid-rows-2 gap-1 min-h-0 flex-1 lg:min-h-[120px]">
                  <div className="min-h-0 bg-surface-container-high dark:bg-surface-container-high rounded overflow-hidden relative">
                    <video
                      className="w-full h-full min-h-[72px] object-cover"
                      src="/4880777-uhd_3840_2160_30fps.mp4"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                    <span className="absolute top-1 left-1 bg-black/50 text-[8px] text-white px-1">
                      CAM 01
                    </span>
                  </div>
                  <div className="min-h-0 bg-surface-container-high dark:bg-surface-container-high rounded overflow-hidden relative">
                    <video
                      className="w-full h-full min-h-[72px] object-cover"
                      src="/5024852-hd_1920_1080_24fps.mp4"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                    <span className="absolute top-1 left-1 bg-black/50 text-[8px] text-white px-1">
                      CAM 02
                    </span>
                  </div>
                  <div className="min-h-0 bg-surface-container-high dark:bg-surface-container-high rounded overflow-hidden relative">
                    <video
                      className="w-full h-full min-h-[72px] object-cover"
                      src="/3918100-hd_1920_1080_30fps.mp4"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                    <span className="absolute top-1 left-1 bg-black/50 text-[8px] text-white px-1">
                      CAM 03
                    </span>
                  </div>
                  <div className="min-h-0 bg-surface-container-high dark:bg-surface-container-high rounded overflow-hidden relative">
                    <video
                      className="w-full h-full min-h-[72px] object-cover"
                      src="/6028721-hd_1920_1080_25fps.mp4"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                    <span className="absolute top-1 left-1 bg-black/50 text-[8px] text-white px-1">
                      CAM 04
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-on-secondary-fixed dark:bg-surface-container-low text-white dark:text-surface-container rounded-xl p-2 sm:p-3 shrink-0 text-center">
                <h3 className="font-label text-[10px] uppercase tracking-widest text-primary-container mb-1">
                  {t.systemStatus}
                </h3>
                <div className="flex justify-center items-start gap-8 sm:gap-10 py-1">
                  <div className="flex flex-col items-center">
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0">
                      <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 80 80">
                        {/* Background circle */}
                        <circle
                          cx="40"
                          cy="40"
                          r="32"
                          fill="transparent"
                          stroke="rgba(255,255,255,0.15)"
                          strokeWidth="4"
                        />
                        {/* Progress circle */}
                        <motion.circle
                          cx="40"
                          cy="40"
                          r="32"
                          fill="transparent"
                          stroke="#4CD7D0"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeDasharray="201"
                          initial={{ strokeDashoffset: 201 }}
                          animate={{ strokeDashoffset: 201 - (systemStatus.systemHealth / 100) * 201 }}
                          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-sm font-headline font-bold">{systemStatus.systemHealth}%</span>
                      </div>
                    </div>
                    <span className="text-[8px] uppercase tracking-tighter mt-0.5 text-center max-w-[5.5rem] leading-tight">
                      {t.operatingAngle}
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0">
                      <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 80 80">
                        {/* Background circle */}
                        <circle
                          cx="40"
                          cy="40"
                          r="32"
                          fill="transparent"
                          stroke="rgba(255,255,255,0.15)"
                          strokeWidth="4"
                        />
                        {/* Progress circle */}
                        <motion.circle
                          cx="40"
                          cy="40"
                          r="32"
                          fill="transparent"
                          stroke="#4CD7D0"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeDasharray="201"
                          initial={{ strokeDashoffset: 201 }}
                          animate={{ strokeDashoffset: 201 - (systemStatus.cpuLoad / 100) * 201 }}
                          transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-sm font-headline font-bold">{systemStatus.cpuLoad}%</span>
                      </div>
                    </div>
                    <span className="text-[8px] uppercase tracking-tighter mt-0.5 text-center max-w-[5.5rem] leading-tight">
                      {t.propulsionPower}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-on-secondary-fixed dark:bg-surface-container-low text-white dark:text-surface-container rounded-xl p-2 sm:p-3 shrink-0">
                <div className="flex justify-between items-center mb-1.5">
                  <h3 className="font-label text-[10px] uppercase tracking-widest text-primary-container">
                    {t.voyageStatistics}
                  </h3>
                  <span className="material-symbols-outlined text-primary-container text-sm">
                    trending_up
                  </span>
                </div>
                <div className="h-12 sm:h-14 w-full flex items-end gap-0.5">
                  {[0.4, 0.6, 0.75, 0.8, 1, 0.9].map((height, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ height: "10%" }}
                      animate={{ height: `${height * 100}%` }}
                      transition={{ duration: 0.5, delay: 0.3 + idx * 0.1 }}
                      className="bg-primary-container/20 w-full rounded-t-sm"
                      style={idx === 4 ? { backgroundColor: "rgb(76, 215, 208)" } : {}}
                    />
                  ))}
                </div>
              </div>
            </motion.section>

            {/* Column 2 */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-6 flex flex-col h-full min-h-[200px] lg:min-h-0"
            >
              <div className="bg-surface-container-lowest dark:bg-surface-container-lowest rounded-2xl flex-1 min-h-0 p-3 sm:p-4 relative flex flex-col items-center justify-center shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                <div className="absolute top-3 left-3 sm:top-4 sm:left-4 border-l-2 border-primary-container pl-3 z-20 pointer-events-none">
                  <span className="block text-[9px] uppercase tracking-widest opacity-50 text-on-background dark:text-on-background">
                    {t.currentConfiguration}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-headline font-extrabold tracking-tighter text-on-background dark:text-on-background">
                    {t.lux75Series}
                  </h2>
                </div>
                <div className="w-full flex-1 min-h-[200px] sm:min-h-[240px] lg:min-h-[280px] z-10 mt-8 sm:mt-12">
                  <YachtModel rotationY={rotationY} autoRotate={yachtAutoRotate} />
                </div>
                <div className="shrink-0 px-4 pb-3 pt-2 flex flex-col items-center gap-2">
                  <div className="flex items-center gap-3 bg-surface-container dark:bg-surface-container px-4 py-2 rounded-full w-full max-w-sm">
                    <button
                      onClick={() => setYachtAutoRotate(!yachtAutoRotate)}
                      className={`relative w-10 h-5 rounded-full transition-colors duration-300 shrink-0 ${yachtAutoRotate ? "bg-[#4cd7d0]" : "bg-surface-variant dark:bg-surface-container-high"}`}
                    >
                      <motion.div
                        className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow"
                        animate={{ left: yachtAutoRotate ? 22 : 2 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    </button>
                    <span className="font-label text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-surface-variant dark:text-surface-variant shrink-0">
                      {t.autoRotate3D}
                    </span>
                    <div className="flex-1 h-1 bg-surface-variant rounded-full overflow-hidden">
                      <input
                        type="range" min={0} max={100} value={modelRotationPct}
                        onChange={(e) => setModelRotationPct(Number(e.target.value))}
                        className="w-full h-full appearance-none bg-transparent cursor-pointer accent-[#4cd7d0] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#4cd7d0] [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[#4cd7d0]"
                      />
                    </div>
                    <span className="material-symbols-outlined text-primary-container text-sm shrink-0">360</span>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Column 3 */}
            <motion.section
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-3 flex flex-col min-h-0 h-full overflow-hidden"
            >
              <div className="bg-on-secondary-fixed dark:bg-surface-container-low text-white dark:text-surface-container rounded-xl p-3 sm:p-4 h-full min-h-0 flex flex-col overflow-hidden">
                <h2 className="font-headline font-black text-base sm:text-lg tracking-widest uppercase text-primary-container mb-2 shrink-0">
                  {t.realTimeData}
                </h2>
                <div className="space-y-3 sm:space-y-4 flex-1 min-h-0 flex flex-col overflow-y-auto">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-start gap-4"
                  >
                    <span className="material-symbols-outlined text-primary-container">
                      location_on
                    </span>
                    <div>
                      <span className="block text-[10px] uppercase tracking-widest opacity-50">
                        {t.latLon}
                      </span>
                      <span className="font-body text-sm font-medium">
                        {vesselData.position.lat.toFixed(3)}° N {vesselData.position.lon.toFixed(3)}° E
                      </span>
                    </div>
                  </motion.div>

                  <div className="grid grid-cols-1 gap-3">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="flex items-center gap-4"
                    >
                      <span className="material-symbols-outlined text-primary-container">
                        air
                      </span>
                      <div>
                        <span className="block text-[10px] uppercase tracking-widest opacity-50">
                          {t.wind}
                        </span>
                        <span className="font-body font-bold">{vesselData.wind.direction} {vesselData.wind.speed} {t.knots}</span>
                      </div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="flex items-center gap-4"
                    >
                      <span className="material-symbols-outlined text-primary-container">
                        straighten
                      </span>
                      <div>
                        <span className="block text-[10px] uppercase tracking-widest opacity-50">
                          {t.draft}
                        </span>
                        <span className="font-body font-bold">090° / {vesselData.draft.fore.toFixed(1)}° {vesselData.draft.aft.toFixed(1)}°</span>
                      </div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="flex items-center gap-4"
                    >
                      <span className="material-symbols-outlined text-primary-container">
                        speed
                      </span>
                      <div>
                        <span className="block text-[10px] uppercase tracking-widest opacity-50">
                          {t.speedSog}
                        </span>
                        <span className="font-body font-bold text-primary-container text-base sm:text-lg tracking-tight">
                          {vesselData.sog.toFixed(1)} {t.knots}
                        </span>
                      </div>
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-white/5 dark:bg-white/[0.05] p-2 sm:p-3 rounded-lg"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] uppercase tracking-widest opacity-60">
                        {t.headingPitch}
                      </span>
                      <span className="material-symbols-outlined text-primary-container text-sm">
                        north_east
                      </span>
                    </div>
                    <div className="text-lg sm:text-xl font-headline font-black mb-1">
                      {vesselData.heading}° / {vesselData.pitch.toFixed(1)}°
                    </div>
                    <div className="h-[1px] w-full bg-primary-container/30 relative">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary-container rounded-full" />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <span className="block text-[10px] uppercase tracking-widest opacity-50 mb-0.5">
                      DRAFT 8.5m
                    </span>
                    <div className="text-base sm:text-lg font-headline font-bold">{vesselData.fuelConsumption.toFixed(1)} L/h</div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="mt-auto pt-3 border-t border-white/10 shrink-0"
                  >
                    <span className="block text-[10px] uppercase tracking-widest text-tertiary mb-2">
                      {t.activeAlarms}
                    </span>
                      <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium opacity-80">{t.fireAlarms}</span>
                        <div className="w-2 h-2 rounded-full bg-tertiary shadow-[0_0_8px_rgba(187,22,31,0.6)]" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium opacity-80">{t.highBilgeLevel}</span>
                        <div className="w-2 h-2 rounded-full bg-tertiary" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium opacity-80">{t.engineOverheat}</span>
                        <div className="w-2 h-2 rounded-full bg-tertiary" />
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.section>
          </main>
        )}

        {/* Bottom Nav Bar */}
        <motion.footer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="shrink-0 w-full z-10 bg-[#F2F4F6] dark:bg-surface-container border-t border-black/5 dark:border-white/5 h-2 px-2"
        />
      </div>
  );
};

const Dashboard = () => {
  const [language, setLanguage] = useState("en");
  return (
    <LanguageProvider language={language} setLanguage={setLanguage}>
      <InnerDashboard />
    </LanguageProvider>
  );
};

export default Dashboard;
