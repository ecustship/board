import React, { useEffect, useMemo, useRef } from "react";
import { AlertTriangle, Bell, BellOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAlarmsData } from "../hooks/useRealTimeData";
import { useLanguage } from "../hooks/useLanguage";
import { useFocusMode } from "../hooks/useFocusMode";

const priorityRank = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const playAlarmTone = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(880, context.currentTime);
  oscillator.frequency.setValueAtTime(660, context.currentTime + 0.12);
  gain.gain.setValueAtTime(0.001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.05, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.28);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.3);
  oscillator.onended = () => context.close();
};

const GlobalAlarmBanner = () => {
  const { language } = useLanguage();
  const { focusMode, alarmMuted, toggleFocusMode } = useFocusMode();
  const { alarms } = useAlarmsData(5000, language);
  const previousCountRef = useRef(0);

  const activeAlarms = useMemo(
    () =>
      alarms.active
        .filter((alarm) => !alarm.acknowledged)
        .sort((a, b) => (priorityRank[b.priority] || 0) - (priorityRank[a.priority] || 0)),
    [alarms.active]
  );

  const topAlarms = activeAlarms.slice(0, 3);
  const hasAlarms = topAlarms.length > 0;
  const criticalCount = activeAlarms.filter(
    (alarm) => alarm.priority === "critical" || alarm.priority === "high"
  ).length;

  useEffect(() => {
    if (!alarmMuted && activeAlarms.length > previousCountRef.current && activeAlarms.length > 0) {
      try {
        playAlarmTone();
      } catch {
        // Browser autoplay policies can block synthetic tones until interaction.
      }
    }
    previousCountRef.current = activeAlarms.length;
  }, [activeAlarms.length, alarmMuted]);

  return (
    <AnimatePresence>
      {hasAlarms && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="mx-auto mt-2 w-[calc(100%-2rem)] max-w-[1400px] shrink-0 rounded-lg border border-red-200 bg-white/90 px-3 py-2 shadow-sm backdrop-blur dark:border-red-900/40 dark:bg-surface-container-lowest/90"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {language === "zh" ? "简易报警" : "Alarm"}
              </span>
              <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold dark:bg-red-900/20">
                {criticalCount}/{activeAlarms.length}
              </span>
            </div>

            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
              {topAlarms.map((alarm) => (
                <div key={alarm.id} className="min-w-0 rounded bg-red-50 px-2 py-1 text-[11px] dark:bg-red-900/20">
                  <span className="font-bold text-red-700 dark:text-red-300">{alarm.source}</span>
                  <span className="mx-1 text-red-300">/</span>
                  <span className="text-red-600 dark:text-red-200">{alarm.message}</span>
                </div>
              ))}
            </div>

            <button
              onClick={toggleFocusMode}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                focusMode
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-surface-container-high dark:text-on-surface"
              }`}
              title={language === "zh" ? "专注模式静音" : "Focus mode mutes alarms"}
            >
              {focusMode ? <BellOff className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
              {focusMode ? (language === "zh" ? "已静音" : "Muted") : (language === "zh" ? "有声" : "Sound")}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GlobalAlarmBanner;
