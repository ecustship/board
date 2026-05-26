import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAlarmsData, useEngineData } from "./hooks/useRealTimeData";
import { useLanguage } from "./hooks/useLanguage";
import { AlarmRow, AlarmBadge, AlarmPill } from "./components/AlarmBadge";
import { useAlarmState, ALARM_STATUS, ALARM_COLORS } from "./hooks/useAlarmState";

const AlarmListView = ({ alarms, onAcknowledge, onResolve }) => {
  if (!alarms || alarms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-on-surface-variant">
        <span className="material-symbols-outlined text-5xl mb-3 text-green-400" style={{ fontVariationSettings: "'FILL' 1" }}>
          check_circle
        </span>
        <p className="text-sm font-medium">No Active Alarms</p>
        <p className="text-xs text-gray-500 mt-1">All systems operating normally</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-full overflow-y-auto pr-2">
      {alarms.map((alarm, idx) => (
        <motion.div
          key={alarm.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
        >
          <AlarmRow
            alarm={alarm}
            onAcknowledge={onAcknowledge}
            onResolve={onResolve}
          />
        </motion.div>
      ))}
    </div>
  );
};

const AlarmHistoryView = ({ history, onResolve }) => {
  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-on-surface-variant">
        <span className="material-symbols-outlined text-4xl mb-3">history</span>
        <p className="text-sm dark:text-on-surface">No alarm history</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-full overflow-y-auto pr-2">
      {history.map((alarm, idx) => (
        <motion.div
          key={alarm.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="flex items-center gap-3 p-3 rounded-xl bg-white/60 dark:bg-surface-container-low/60 border border-gray-200 dark:border-dark-surface-variant opacity-75"
        >
          <div className="w-3 h-3 rounded-full bg-green-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-600 truncate">{alarm.message}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {alarm.source} · {alarm.time}
              {alarm.resolvedTime && ` → Resolved: ${alarm.resolvedTime}`}
            </p>
          </div>
          <span className="text-[9px] font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full shrink-0">
            RESOLVED
          </span>
        </motion.div>
      ))}
    </div>
  );
};

const Alarms = () => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState("active");
  const [filterPriority, setFilterPriority] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { alarms, acknowledgeAlarm } = useAlarmsData(5000, language);
  const engines = useEngineData(2000);

  const unacknowledgedCount = alarms.active.filter((a) => !a.acknowledged).length;
  const criticalCount = alarms.active.filter(
    (a) => !a.acknowledged && (a.priority === "critical" || a.priority === "high")
  ).length;

  // Filter active alarms
  const filteredActiveAlarms = useMemo(() => {
    let filtered = alarms.active;
    if (filterPriority !== "all") {
      filtered = filtered.filter((a) => a.priority === filterPriority);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.message.toLowerCase().includes(q) ||
          a.source.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [alarms.active, filterPriority, searchQuery]);

  // Filter history
  const filteredHistory = useMemo(() => {
    let filtered = alarms.history;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.message.toLowerCase().includes(q) ||
          a.source.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [alarms.history, searchQuery]);

  const tabs = [
    { id: "active", label: t.activeAlarmsList, count: alarms.active.length },
    { id: "history", label: t.alarmHistory, count: alarms.history.length },
  ];

  const priorities = [
    { key: "all", label: t.filterAll },
    { key: "critical", label: t.criticalPriority },
    { key: "high", label: t.highPriority },
    { key: "medium", label: t.mediumPriority },
    { key: "low", label: t.lowPriority },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden px-4 pb-4 pt-2 bg-[#F5F6F8] dark:bg-background">
      {/* Header: Tabs + Stats */}
      <div className="flex items-center justify-between mb-3 shrink-0">
          <div className="flex gap-1 bg-gray-100 dark:bg-surface-container rounded-full p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === tab.id
                  ? "bg-white dark:bg-surface-container-low text-[#1A1B1F] dark:text-on-surface shadow-sm"
                  : "text-gray-500 dark:text-on-surface hover:text-gray-700 dark:hover:text-dark-on-surface"
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] ${
                activeTab === tab.id ? "bg-[#1A1B1F] dark:bg-surface-container-lowest text-white dark:text-on-surface" : "bg-gray-300 dark:bg-surface-container-high text-gray-600 dark:text-on-surface-variant"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Summary stats */}
        <div className="flex gap-3">
          {unacknowledgedCount > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-1 rounded-full">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold text-red-600">
                {unacknowledgedCount} Unacknowledged
              </span>
            </div>
          )}
          {criticalCount > 0 && (
            <div className="flex items-center gap-2 bg-red-100 border border-red-300 px-3 py-1 rounded-full animate-pulse">
              <span className="material-symbols-outlined text-red-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                emergency
              </span>
              <span className="text-xs font-bold text-red-700">
                {criticalCount} Critical
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Search & Filters — only on active tab */}
      {activeTab === "active" && (
        <div className="flex items-center gap-3 mb-3 shrink-0">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchFilters}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-surface-container-low border border-gray-200 dark:border-dark-surface-variant text-xs focus:outline-none focus:border-[#4cd7d0] transition-colors"
            />
          </div>
          <div className="flex gap-1">
            {priorities.map((p) => (
              <button
                key={p.key}
                onClick={() => setFilterPriority(p.key)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  filterPriority === p.key
                    ? "bg-[#1A1B1F] dark:bg-surface-container-low text-white dark:text-on-surface"
                    : "bg-white dark:bg-surface-container-low text-gray-500 dark:text-on-surface border border-gray-200 dark:border-dark-surface-variant hover:border-gray-300 dark:hover:border-dark-surface-variant"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {unacknowledgedCount > 1 && (
            <button
              onClick={() => alarms.active.forEach((a) => !a.acknowledged && acknowledgeAlarm(a.id))}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors"
            >
              {t.acknowledgeAll}
            </button>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-row flex-1 min-h-0 gap-3">
        {/* Left: Alarm List */}
        <section className="flex-1 bg-white/80 dark:bg-surface-container-low/50 backdrop-blur-sm rounded-2xl p-4 min-h-0 overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            {activeTab === "active" ? (
              <motion.div
                key="active"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 overflow-hidden"
              >
                <AlarmListView
                  alarms={filteredActiveAlarms}
                  onAcknowledge={acknowledgeAlarm}
                  onResolve={(id) => {/* resolve logic */}}
                />
              </motion.div>
            ) : (
              <motion.div
                key="history"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 overflow-hidden"
              >
                <AlarmHistoryView history={filteredHistory} />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Right: Status Panel */}
        <aside className="w-52 xl:w-56 shrink-0 flex flex-col gap-3">
          {/* Diagnosis Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className={`rounded-xl p-3 shadow-xl border-2 ${
              criticalCount > 0
                ? "bg-red-50 border-red-500"
                : unacknowledgedCount > 0
                ? "bg-yellow-50 border-yellow-400"
                : "bg-green-50 border-green-500"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`material-symbols-outlined text-xl ${
                criticalCount > 0 ? "text-red-500" : unacknowledgedCount > 0 ? "text-yellow-500" : "text-green-500"
              }`} style={{ fontVariationSettings: "'FILL' 1" }}>
                {criticalCount > 0 ? "emergency" : unacknowledgedCount > 0 ? "warning" : "check_circle"}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider">
                {t.diagnosis}
              </span>
            </div>
            <p className={`font-bold text-sm ${
              criticalCount > 0 ? "text-red-600" : unacknowledgedCount > 0 ? "text-yellow-600" : "text-green-600"
            }`}>
              {criticalCount > 0
                ? `${criticalCount} Critical Alarm(s)`
                : unacknowledgedCount > 0
                ? `${unacknowledgedCount} Alarm(s) Pending`
                : t.allSystemsNormal}
            </p>
            <p className="text-[10px] text-gray-500 mt-1">
              {criticalCount > 0 || unacknowledgedCount > 0
                ? `${unacknowledgedCount} ${t.requiresAttention}`
                : t.operatingNormally}
            </p>
          </motion.div>

          {/* Engine Status Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#2e3132] rounded-xl p-3 shadow-xl"
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-[9px] font-bold text-gray-300 uppercase tracking-wider">
                {t.operationStatus}
              </span>
              <span className="material-symbols-outlined text-[#79ff5b] text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                radar
              </span>
            </div>
            <div className="space-y-2">
              {["diesel1", "diesel2", "aux1", "aux2"].map((key) => {
                const eng = engines[key];
                const alarmForEng = alarms.active.find(
                  (a) =>
                    !a.acknowledged &&
                    (a.source?.toLowerCase().includes(key) ||
                      a.source?.toLowerCase().includes("engine"))
                );
                return (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-gray-400 uppercase">
                      {t[`engine${key === "diesel1" ? 1 : key === "diesel2" ? 2 : key === "aux1" ? "1" : "2"}`]}
                    </span>
                    <div className="flex items-center gap-2">
                      <AlarmBadge alarm={alarmForEng || {}} size="sm" />
                      <span className="text-[9px] font-medium text-gray-300">
                        {(eng?.power || 0).toLocaleString()} {t.kw}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-surface-container-lowest rounded-xl p-3 shadow-sm border border-gray-100 dark:border-dark-surface-variant"
          >
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-red-50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-red-600">{criticalCount}</p>
                <p className="text-[8px] uppercase text-red-400 tracking-wider">Critical</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-yellow-600">
                  {alarms.active.filter((a) => a.priority === "medium" || a.priority === "low").length}
                </p>
                <p className="text-[8px] uppercase text-yellow-400 tracking-wider">Warning</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-blue-600">
                  {alarms.active.filter((a) => a.acknowledged).length}
                </p>
                <p className="text-[8px] uppercase text-blue-400 tracking-wider">Ack'd</p>
              </div>
              <div className="bg-green-50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-green-600">{alarms.history.length}</p>
                <p className="text-[8px] uppercase text-green-400 tracking-wider">Resolved</p>
              </div>
            </div>
          </motion.div>
        </aside>
      </div>

      {/* Bottom: Status Cards */}
      <footer className="grid grid-cols-5 gap-3 mt-3 w-full">
        {[
          {
            label: t.overspeed,
            value: alarms.active.some((a) => a.priority === "critical") ? "TRIGGERED" : t.normal,
            unit: `${engines.diesel1?.rpm || 0} ${t.rpm}`,
            alert: alarms.active.some((a) => a.priority === "critical"),
            color: "red",
          },
          {
            label: t.eStopStatus,
            value: criticalCount > 0 ? t.armed : t.ready,
            unit: t.ready,
            alert: criticalCount > 0,
            color: criticalCount > 0 ? "red" : "green",
          },
          {
            label: t.waterLevel,
            value: alarms.active.some((a) => a.source?.toLowerCase().includes("bilge") || a.source?.toLowerCase().includes("water"))
              ? t.low
              : t.normal,
            unit: `${Math.round(engines.diesel1?.coolantTemp || 0)}%`,
            alert: alarms.active.some((a) => a.source?.toLowerCase().includes("bilge")),
            color: alarms.active.some((a) => a.source?.toLowerCase().includes("bilge")) ? "red" : "green",
          },
          {
            label: t.leakageStatus,
            value: alarms.active.length > 0 ? t.detected : t.clear,
            unit: alarms.active.length > 0 ? `${t.zone} ${alarms.active.length}` : t.ok,
            alert: alarms.active.length > 0,
            color: alarms.active.length > 0 ? "red" : "green",
          },
          {
            label: t.controlPower,
            value: t.online,
            unit: "24V DC",
            alert: false,
            color: "green",
          },
        ].map((metric, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`rounded-xl p-3 shadow-sm border flex flex-col justify-between ${
              metric.alert
                ? "bg-red-50 dark:bg-red-900/10 border-2 border-red-200 dark:border-red-900/30"
                : "bg-white dark:bg-surface-container-lowest border border-gray-100 dark:border-dark-surface-variant"
            }`}
          >
            <span className={`text-[9px] font-bold uppercase tracking-wider ${
              metric.alert ? "text-red-500 dark:text-red-400" : "text-gray-400 dark:text-on-surface-variant"
            }`}>
              {metric.label}
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className={`text-xl font-bold ${
                metric.alert ? "text-red-600 dark:text-red-400" : "text-[#1A1B1F] dark:text-on-surface"
              }`}>
                {metric.value}
              </span>
              <span className={`text-[10px] ${
                metric.alert ? "text-red-400" : "text-gray-400"
              }`}>
                {metric.unit}
              </span>
            </div>
          </motion.div>
        ))}
      </footer>
    </div>
  );
};

export default Alarms;
