import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Bell, BellOff, CheckCircle2 } from "lucide-react";
import { useAlarmsData } from "./hooks/useRealTimeData";
import { useLanguage } from "./hooks/useLanguage";
import { useFocusMode } from "./hooks/useFocusMode";
import { useAuth } from "./hooks/useAuth";
import DataStateOverlay from "./components/DataStateOverlay";
import { getChineseApiError } from "./api/errorMessages";
import { PERMISSIONS } from "./auth/permissions";

const priorityRank = { critical: 4, high: 3, medium: 2, low: 1 };

const Alarms = () => {
  const { t, language } = useLanguage();
  const { focusMode, toggleFocusMode } = useFocusMode();
  const { hasPermission } = useAuth();
  const { alarms, acknowledgeAlarm, resetAlarm, resource } = useAlarmsData(5000, language);
  const [actionError, setActionError] = useState("");
  const [actionId, setActionId] = useState(null);
  const canAck = hasPermission(PERMISSIONS.ALARM_EVENT_ACK);
  const canReset = hasPermission(PERMISSIONS.ALARM_EVENT_RESET);

  const runAction = async (alarm) => {
    const permitted = alarm.acknowledged ? canReset : canAck;
    if (!permitted || actionId) return;
    setActionError("");
    setActionId(alarm.id);
    try {
      if (alarm.acknowledged) await resetAlarm(alarm.id);
      else await acknowledgeAlarm(alarm.id);
    } catch (error) {
      setActionError(getChineseApiError(error, "告警状态更新失败"));
    } finally {
      setActionId(null);
    }
  };

  const sortedAlarms = useMemo(
    () =>
      alarms.active
        .slice()
        .sort((a, b) => (priorityRank[b.priority] || 0) - (priorityRank[a.priority] || 0)),
    [alarms.active]
  );

  const criticalCount = sortedAlarms.filter((alarm) => alarm.priority === "critical" || alarm.priority === "high").length;
  const pendingCount = sortedAlarms.filter((alarm) => !alarm.acknowledged).length;

  return (
    <div className="relative flex flex-col flex-1 min-h-0 overflow-hidden px-4 pb-4 pt-2 bg-[#F5F6F8] dark:bg-background">
      <DataStateOverlay resources={resource} label={language === "zh" ? "告警数据" : "alarm data"} />
      <div className="grid min-h-0 flex-1 grid-cols-[1fr_320px] gap-4">
        <section className="flex min-h-0 flex-col rounded-2xl bg-white p-5 shadow-sm dark:bg-surface-container-lowest">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black tracking-tight text-[#1A1B1F] dark:text-on-surface">
                {language === "zh" ? "简易报警中心" : "Simple Alarm Center"}
              </h1>
              <p className="text-xs text-slate-500">
                {language === "zh" ? "所有页面共用同一套简易报警与声音策略。" : "Shared alarm summary and sound policy for every page."}
              </p>
            </div>
            <button
              onClick={toggleFocusMode}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider ${
                focusMode
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200"
                  : "bg-[#1A1B1F] text-white"
              }`}
            >
              {focusMode ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
              {focusMode ? (language === "zh" ? "专注静音" : "Focus Muted") : (language === "zh" ? "报警有声" : "Sound On")}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: t.activeAlarms, value: sortedAlarms.length, color: "text-red-600", bg: "bg-red-50" },
              { label: language === "zh" ? "高优先级" : "High Priority", value: criticalCount, color: "text-orange-600", bg: "bg-orange-50" },
              { label: language === "zh" ? "待确认" : "Unacknowledged", value: pendingCount, color: "text-blue-600", bg: "bg-blue-50" },
            ].map((item) => (
              <div key={item.label} className={`rounded-xl p-4 ${item.bg}`}>
                <div className={`text-3xl font-black ${item.color}`}>{item.value}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{item.label}</div>
              </div>
            ))}
          </div>

          {actionError && <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{actionError}</div>}

          <div className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-white/10 dark:bg-surface-container-low">
            {sortedAlarms.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-green-600">
                <CheckCircle2 className="mb-2 h-10 w-10" />
                <div className="text-sm font-bold">{t.allSystemsNormal}</div>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedAlarms.map((alarm, idx) => {
                  const urgent = alarm.priority === "critical" || alarm.priority === "high";
                  return (
                    <motion.div
                      key={alarm.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                        urgent
                          ? "border-red-200 bg-red-50 hover:bg-red-100"
                          : "border-yellow-200 bg-yellow-50 hover:bg-yellow-100"
                      } ${alarm.acknowledged ? "opacity-60" : ""}`}
                    >
                      <AlertTriangle className={`h-5 w-5 shrink-0 ${urgent ? "text-red-600" : "text-yellow-600"}`} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold text-slate-800">{alarm.message}</div>
                        <div className="text-[11px] text-slate-500">{alarm.source} / {alarm.time}</div>
                      </div>
                      <button
                        onClick={() => runAction(alarm)}
                        disabled={!(alarm.acknowledged ? canReset : canAck) || actionId === alarm.id}
                        title={!(alarm.acknowledged ? canReset : canAck) ? (language === "zh" ? "当前账号没有对应报警操作权限" : "No alarm action permission") : ""}
                        className={`min-w-16 rounded-md px-2 py-1.5 text-[9px] font-bold uppercase disabled:cursor-not-allowed disabled:opacity-45 ${
                          urgent ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {actionId === alarm.id ? "..." : alarm.acknowledged ? (language === "zh" ? "恢复" : "Reset") : (language === "zh" ? "确认" : "ACK")}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <aside className="flex min-h-0 flex-col gap-3">
          <div className="rounded-2xl bg-[#1A1B1F] p-4 text-white shadow-xl dark:bg-surface-container-lowest">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#4cd7d0]">
                {language === "zh" ? "声音策略" : "Sound Policy"}
              </span>
              {focusMode ? <BellOff className="h-4 w-4 text-blue-300" /> : <Bell className="h-4 w-4 text-[#79ff5b]" />}
            </div>
            <p className="text-sm font-bold">
              {focusMode
                ? (language === "zh" ? "专注模式开启，报警声音静音。" : "Focus mode is on. Alarm sound is muted.")
                : (language === "zh" ? "新报警触发时播放短提示音。" : "A short tone plays when new alarms arrive.")}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-surface-container-lowest">
            <div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {language === "zh" ? "优先级规则" : "Priority Rule"}
            </div>
            <div className="space-y-2 text-xs text-slate-600 dark:text-on-surface-variant">
              <div>1. Critical / High</div>
              <div>2. Medium</div>
              <div>3. Low</div>
              <div>4. Acknowledged</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Alarms;
