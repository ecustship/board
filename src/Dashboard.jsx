import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MainEngine from "./MainEngine";
import NauticalCharts from "./NauticalCharts";
import Alarms from "./Alarms";
import Trend from "./trend";
import EngineSystems from "./EngineSystems";
import ConfigPage from "./ConfigPage";
import NavigationPage from "./NavigationPage";
import { useFullscreen } from "./hooks/useFullscreen";
import { LanguageProvider, useLanguage } from "./hooks/useLanguage";
import { NavigationConfigProvider } from "./hooks/useNavigationConfig";
import { UnitSystemProvider } from "./hooks/useUnitSystem";
import { FocusModeProvider, useFocusMode } from "./hooks/useFocusMode";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import GlobalAlarmBanner from "./components/GlobalAlarmBanner";
import LoginPage from "./components/LoginPage";
import AccessManagement from "./components/AccessManagement";
import ChangePasswordModal from "./components/ChangePasswordModal";

const AUTH_REQUIRED = (process.env.REACT_APP_AUTH_REQUIRED || "true").toLowerCase() === "true";

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
const AccountModal = ({ isOpen, onClose, user, onLogout, onChangePassword, onAccessManagement, canManageAccess }) => {
  const { t } = useLanguage();
  if (!isOpen) return null;

  const displayName = user?.displayName || user?.username || t.userName;
  const roleText = user?.roles?.join(" / ") || t.userRole;
  const userId = user?.userId || t.userId;
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0])
    .join("")
    .toUpperCase();

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
              <span className="text-2xl font-black text-[#0058bc]">{initials || "AM"}</span>
            </div>
            <h3 className="text-xl font-bold text-white">{displayName}</h3>
            <p className="text-white/80 text-sm">{roleText}</p>
            <p className="text-white/60 text-xs mt-1">{userId}</p>
          </div>

          {/* Menu Items */}
          <div className="p-4 space-y-2">
            <button onClick={() => { onClose(); onChangePassword(); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <span className="material-symbols-outlined text-[#4CD7D0]">key</span>
              <span className="text-gray-700 dark:text-gray-300 font-medium">修改密码</span>
            </button>
            {canManageAccess && (
              <button onClick={() => { onClose(); onAccessManagement(); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <span className="material-symbols-outlined text-[#4CD7D0]">admin_panel_settings</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium">用户与权限管理</span>
              </button>
            )}
            <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
            <button
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group"
            >
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
  const { t, language } = useLanguage();
  const { focusMode, toggleFocusMode } = useFocusMode();
  const { user, logout, hasPermission } = useAuth();
  const [theme, setTheme] = useState("system");

  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = theme === "dark" || (theme === "system" && prefersDark);

    root.classList.toggle("dark", shouldUseDark);
    root.style.colorScheme = shouldUseDark ? "dark" : "light";
  }, [theme]);
  const [activeView, setActiveView] = useState("navigation");
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const { isFullscreen, toggleFullscreen } = useFullscreen();

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

  const navButtons = useMemo(
    () => [
      { key: "main-engine", label: t.mainEngine, permission: "engine:read" },
      { key: "engine-systems", label: t.engineSystems, permission: "engine:read" },
      { key: "navigation", label: t.navigation },
      { key: "alarms", label: t.alarms, permission: "alarm:read" },
      { key: "trend", label: t.trend, permission: "trend:read" },
      { key: "nautical-charts", label: t.nauticalCharts },
      { key: "config", label: t.configParameters, permission: "ingest:write" },
    ].filter((item) => !item.permission || hasPermission(item.permission)),
    [hasPermission, t]
  );

  useEffect(() => {
    if (activeView === "access-management" && !hasPermission("user:read")) {
      setActiveView(navButtons[0]?.key || "navigation");
      return;
    }
    if (activeView !== "access-management" && !navButtons.some((item) => item.key === activeView)) {
      setActiveView(navButtons[0]?.key || "navigation");
    }
  }, [activeView, hasPermission, navButtons]);

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
              <button
                onClick={toggleFocusMode}
                className={`material-symbols-outlined hover:scale-110 transition-transform p-1 ${
                  focusMode ? "text-blue-600 dark:text-blue-300" : ""
                }`}
                title={language === "zh" ? "专注模式" : "Focus Mode"}
              >
                {focusMode ? "notifications_off" : "notifications_active"}
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
        <AccountModal
          isOpen={accountOpen}
          onClose={() => setAccountOpen(false)}
          user={user}
          onLogout={logout}
          onChangePassword={() => setPasswordOpen(true)}
          onAccessManagement={() => setActiveView("access-management")}
          canManageAccess={hasPermission("user:read")}
        />
        <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} onChanged={logout} />
        <GlobalAlarmBanner />

        {/* Main Content */}
        {activeView === "access-management" ? (
          <AccessManagement onExit={() => setActiveView("navigation")} />
        ) : activeView === "main-engine" ? (
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
          <NavigationPage />
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

const AuthenticatedDashboard = () => {
  const { isAuthenticated, status } = useAuth();

  if (AUTH_REQUIRED && status === "validating") {
    return <div className="flex h-[100dvh] items-center justify-center bg-[#f1f3f5] text-sm font-bold text-slate-500">正在验证登录状态...</div>;
  }

  if (AUTH_REQUIRED && !isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <UnitSystemProvider>
      <FocusModeProvider>
        <NavigationConfigProvider>
          <InnerDashboard />
        </NavigationConfigProvider>
      </FocusModeProvider>
    </UnitSystemProvider>
  );
};

const Dashboard = () => {
  const [language, setLanguage] = useState("en");
  return (
    <LanguageProvider language={language} setLanguage={setLanguage}>
      <AuthProvider>
        <AuthenticatedDashboard />
      </AuthProvider>
    </LanguageProvider>
  );
};

export default Dashboard;
