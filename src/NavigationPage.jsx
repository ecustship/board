import React, { useState } from "react";
import { motion } from "framer-motion";
import { Settings, MapPin, Wind, Compass, Gauge, Navigation, AlertTriangle, AlertCircle, ShipWheel } from "lucide-react";
import RealtimeDataConfigModal from "./components/RealtimeDataConfigModal";
import SystemStatusConfigModal from "./components/SystemStatusConfigModal";
import { useNavigationConfig } from "./hooks/useNavigationConfig";
import { useVesselData, useEngineData, useSystemStatus } from "./hooks/useRealTimeData";
import { useLanguage } from "./hooks/useLanguage";

const NavigationPage = () => {
  const { t, language } = useLanguage();
  const { realtimeDataConfig, systemStatusConfig } = useNavigationConfig();

  const [realtimeModalOpen, setRealtimeModalOpen] = useState(false);
  const [systemModalOpen, setSystemModalOpen] = useState(false);

  // 连接到配置参数
  const vesselData = useVesselData(realtimeDataConfig.refreshRate, {
    smoothingFilter: realtimeDataConfig.smoothingFilter,
  });

  const engineData = useEngineData(2000, {
    rpmHighAlertLimit: 750,
    lubeOilPressureLowLimit: 2.5,
    faultInjectionEnabled: systemStatusConfig.faultInjectionEnabled,
  });

  const systemStatus = useSystemStatus(1500);

  const subsystems = systemStatusConfig.subsystems;

  const visibleSubsystems = Object.entries(subsystems)
    .filter(([, visible]) => visible)
    .map(([key]) => key);

  const navigationAlarms = [
    ...(engineData?.diesel1?.alerts || []).map((alert) => ({
      ...alert,
      priority: alert.type === "critical" ? "critical" : "medium",
      source: "Main Engine",
    })),
    { id: "nav-1", priority: "high", message: t.fireAlarms, source: "Fire" },
    { id: "nav-2", priority: "medium", message: t.highBilgeLevel, source: "Bilge" },
    { id: "nav-3", priority: "low", message: "AIS target update", source: "Navigation" },
  ];

  const rank = { critical: 4, high: 3, medium: 2, low: 1 };
  const sortedNavigationAlarms = navigationAlarms
    .sort((a, b) => (rank[b.priority] || 0) - (rank[a.priority] || 0))
    .slice(0, 5);

  const dataCards = [
    {
      key: "bow",
      icon: <Compass className="w-4 h-4 text-primary-container shrink-0" />,
      label: language === "zh" ? "船首信息" : "Bow Heading",
      value: `${vesselData.heading}°`,
      detail: language === "zh" ? "正北为 0°" : "North = 0°",
    },
    {
      key: "gps",
      icon: <MapPin className="w-4 h-4 text-primary-container shrink-0" />,
      label: "GPS",
      value: `${vesselData.position.lat.toFixed(3)}° N`,
      detail: `${vesselData.position.lon.toFixed(3)}° E`,
    },
    {
      key: "wind",
      icon: <Wind className="w-4 h-4 text-primary-container shrink-0" />,
      label: t.wind,
      value: `${vesselData.wind.speed} ${t.knots}`,
      detail: vesselData.wind.direction,
    },
    {
      key: "attitude",
      icon: <Navigation className="w-4 h-4 text-primary-container shrink-0" />,
      label: language === "zh" ? "船舶姿态" : "Vessel Attitude",
      value: `${vesselData.pitch.toFixed(1)}°`,
      detail: `Roll ${vesselData.draft.fore.toFixed(1)}° / Trim ${vesselData.draft.aft.toFixed(1)}°`,
    },
    {
      key: "alarms",
      icon: <AlertTriangle className="w-4 h-4 text-tertiary shrink-0" />,
      label: t.activeAlarms,
      custom: true,
    },
  ];

  return (
    <div className="flex-1 min-h-0 w-full px-2 sm:px-3 py-2 grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-3 max-w-[1600px] mx-auto items-stretch">
      {/* Column 1: 监控画面 */}
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

        {/* System Status Card */}
        <div className="bg-on-secondary-fixed dark:bg-surface-container-low text-white dark:text-surface-container rounded-xl p-2 sm:p-3 shrink-0 text-center relative">
          {/* Settings Button */}
          <button
            onClick={() => setSystemModalOpen(true)}
            className="absolute top-2 right-2 p-1.5 hover:bg-white/10 rounded-lg transition-all group"
            title={language === "zh" ? "系统状态设置" : "System Status Settings"}
          >
            <motion.div
              whileHover={{ rotate: 90 }}
              transition={{ duration: 0.3 }}
            >
              <Settings className="w-4 h-4 text-white/60 group-hover:text-[#4CD7D0]" />
            </motion.div>
          </button>

          <h3 className="font-label text-[10px] uppercase tracking-widest text-primary-container mb-1 text-left">
            {t.systemStatus}
          </h3>
          <div className="flex justify-center items-start gap-8 sm:gap-10 py-1">
            <div className="flex flex-col items-center">
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0">
                <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 80 80">
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    fill="transparent"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="4"
                  />
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
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    fill="transparent"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="4"
                  />
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

          {/* Subsystem Status Grid */}
          {systemStatusConfig.displayMode === "grid" && (
            <div className="grid grid-cols-3 gap-1 mt-2">
              {visibleSubsystems.map((key) => (
                <div
                  key={key}
                  className="bg-white/5 rounded p-1.5 text-center"
                >
                  <div className="w-2 h-2 rounded-full bg-[#4CD7D0] mx-auto mb-0.5" />
                  <span className="text-[7px] text-white/70 block truncate">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                </div>
              ))}
            </div>
          )}

          {systemStatusConfig.displayMode === "list" && (
            <div className="space-y-1 mt-2 text-left">
              {visibleSubsystems.map((key) => (
                <div key={key} className="flex items-center gap-1.5 text-[8px]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#4CD7D0]" />
                  <span className="text-white/70">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                </div>
              ))}
            </div>
          )}
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

      {/* Column 2: Vessel Photo */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="lg:col-span-6 flex flex-col h-full min-h-[200px] lg:min-h-0"
      >
        <div className="bg-surface-container-lowest dark:bg-surface-container-lowest rounded-2xl flex-1 min-h-0 p-3 sm:p-4 relative flex flex-col shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 border-l-2 border-primary-container pl-3 z-20 pointer-events-none">
            <span className="block text-[9px] uppercase tracking-widest opacity-50 text-on-background dark:text-on-background">
              {t.currentConfiguration}
            </span>
            <h2 className="text-xl sm:text-2xl font-headline font-extrabold tracking-tighter text-on-background dark:text-on-background">
              {t.lux75Series}
            </h2>
          </div>
          <div className="mt-8 min-h-0 flex-1 overflow-hidden rounded-xl bg-surface-container-high dark:bg-surface-container-high">
            <img
              src="/image/微信图片_20260519205820_68_1477.png"
              alt="Vessel profile"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="mt-3 grid shrink-0 grid-cols-3 gap-3">
            {[
              { label: t.speedSog, value: `${vesselData.sog.toFixed(1)} ${t.knots}`, icon: <Gauge className="h-4 w-4" /> },
              { label: language === "zh" ? "船首角" : "Heading", value: `${vesselData.heading}°`, icon: <ShipWheel className="h-4 w-4" /> },
              { label: language === "zh" ? "风" : "Wind", value: `${vesselData.wind.speed} ${t.knots}`, icon: <Wind className="h-4 w-4" /> },
            ].map((item) => (
              <div key={item.label} className="rounded-lg bg-surface-container p-3 dark:bg-surface-container-low">
                <div className="mb-2 flex items-center justify-between text-primary-container">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">{item.label}</span>
                  {item.icon}
                </div>
                <div className="text-lg font-black text-on-background">{item.value}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 shrink-0 rounded-xl bg-[#1A1B1F] p-3 text-white dark:bg-surface-container-low">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary-container">
                {language === "zh" ? "仪表盘" : "Instrument Panel"}
              </span>
              <span className="text-[10px] text-white/40">LIVE</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[vesselData.sog * 10, vesselData.heading / 3.6, vesselData.wind.speed * 4, Math.abs(vesselData.pitch) * 40 + 20].map((value, idx) => (
                <div key={idx} className="h-2 rounded-full bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(value, 100)}%` }}
                    className="h-full rounded-full bg-[#4cd7d0]"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Column 3: REAL-TIME DATA */}
      <motion.section
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="lg:col-span-3 flex flex-col min-h-0 h-full overflow-hidden"
      >
        <div className="bg-on-secondary-fixed dark:bg-surface-container-low text-white dark:text-surface-container rounded-xl p-3 sm:p-4 h-full min-h-0 flex flex-col overflow-hidden relative">
          {/* Settings Button */}
          <button
            onClick={() => setRealtimeModalOpen(true)}
            className="absolute top-2 right-2 p-1.5 hover:bg-white/10 rounded-lg transition-all group z-10"
            title={language === "zh" ? "实时数据设置" : "Real-time Data Settings"}
          >
            <motion.div
              whileHover={{ rotate: 90 }}
              transition={{ duration: 0.3 }}
            >
              <Settings className="w-4 h-4 text-white/60 group-hover:text-[#4CD7D0]" />
            </motion.div>
          </button>

          <h2 className="font-headline font-black text-base sm:text-lg tracking-widest uppercase text-primary-container mb-2 shrink-0">
            {t.realTimeData}
          </h2>

          <div className="space-y-3 flex-1 min-h-0 flex flex-col overflow-y-auto">
            {dataCards.map((card, idx) => (
              <motion.div
                key={card.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + idx * 0.08 }}
                className="rounded-lg bg-white/5 p-3"
              >
                <div className="mb-1 flex items-center gap-3">
                  {card.icon}
                  <span className="text-[10px] uppercase tracking-widest opacity-50">{card.label}</span>
                </div>
                {card.custom ? (
                  <div className="space-y-1.5">
                    {sortedNavigationAlarms.slice(0, 5).map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate text-xs font-medium opacity-80 flex items-center gap-1">
                          {alert.priority === "critical" || alert.priority === "high" ? (
                            <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-yellow-500 shrink-0" />
                          )}
                          {alert.message}
                        </span>
                        <span className="text-[9px] uppercase text-white/40">{alert.priority}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="text-lg font-headline font-black text-primary-container">{card.value}</div>
                    <div className="text-[10px] opacity-60">{card.detail}</div>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Modals */}
      <RealtimeDataConfigModal isOpen={realtimeModalOpen} onClose={() => setRealtimeModalOpen(false)} />
      <SystemStatusConfigModal isOpen={systemModalOpen} onClose={() => setSystemModalOpen(false)} />
    </div>
  );
};

export default NavigationPage;
