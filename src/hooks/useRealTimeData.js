import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { apiRequest, buildApiPath } from "../api/client";
import { API_ENDPOINTS, DEFAULT_API_CONTEXT } from "../api/contracts";
import { useApiResource } from "../api/useApiResource";

const DATA_SOURCE = (process.env.REACT_APP_DATA_SOURCE || "backend").toLowerCase();
const USE_BACKEND = DATA_SOURCE !== "mock";
const DEFAULT_VESSEL_ID = process.env.REACT_APP_VESSEL_ID || DEFAULT_API_CONTEXT.vesselId;

// 生成随机范围内的数值
const randomInRange = (min, max, decimals = 1) => {
  const value = Math.random() * (max - min) + min;
  return parseFloat(value.toFixed(decimals));
};

// 生成随机变化（基于当前值的微小波动）
const fluctuate = (current, min, max, volatility = 0.02) => {
  const change = current * volatility * (Math.random() - 0.5) * 2;
  let newValue = current + change;
  newValue = Math.max(min, Math.min(max, newValue));
  return parseFloat(newValue.toFixed(1));
};

// 初始船舶数据
const initialVesselData = {
  position: { lat: 31.503, lon: 122.105 },
  heading: 35,
  pitch: -0.3,
  cog: 30.3,
  sog: 10.0,
  wind: { direction: "NW", speed: 18 },
  draft: { fore: -0.7, aft: 0 },
  fuelConsumption: 3555.8,
  temperature: 28,
  humidity: 65,
};

// 初始引擎数据
const initialEngineData = {
  diesel1: {
    rpm: 850,
    power: 12450,
    load: 88,
    fuelRate: 285.5,
    torque: 142.3,
    thrust: 2850,
    exhaustTemp: 412.5,
    coolantTemp: 78,
    oilPressure: 4.2,
    turboSpeed: 18.2,
    cylinders: [438, 425, 418, 432, 420, 408, 445, 416, 422, 410, 430, 428, 415, 420, 422, 418],
    status: "running",
    alerts: [],
  },
  diesel2: {
    rpm: 820,
    power: 11800,
    load: 82,
    fuelRate: 270.2,
    torque: 138.5,
    thrust: 2720,
    exhaustTemp: 405.8,
    coolantTemp: 76,
    oilPressure: 4.0,
    turboSpeed: 17.5,
    cylinders: [420, 412, 405, 418, 415, 400, 430, 408, 415, 405, 422, 418, 408, 415, 418, 412],
    status: "running",
    alerts: [],
  },
  aux1: {
    rpm: 1500,
    power: 3200,
    load: 75,
    fuelRate: 720,
    frequency: 50.0,
    voltage: 400,
    current: 462,
    powerFactor: 0.85,
    exhaustTemp: 385.2,
    oilPressure: 3.8,
    cylinders: [392, 385, 378, 388, 382, 372, 395, 380, 385, 378, 390, 386, 378, 385, 388, 382],
    status: "running",
    alerts: [],
  },
  aux2: {
    rpm: 1500,
    power: 2800,
    load: 65,
    fuelRate: 630,
    frequency: 50.1,
    voltage: 398,
    current: 405,
    powerFactor: 0.84,
    exhaustTemp: 378.5,
    oilPressure: 3.6,
    cylinders: [380, 372, 365, 375, 370, 360, 382, 368, 372, 365, 378, 374, 365, 372, 375, 370],
    status: "standby",
    alerts: [],
  },
};

// 初始导航数据
const initialNavigationData = {
  route: {
    name: "Shanghai - Tokyo",
    eta: "2026-05-15 14:30",
    distanceRemaining: 1250,
    distanceTraveled: 380,
    waypoints: [
      { name: "Shanghai Port", lat: 31.23, lon: 121.47, status: "completed" },
      { name: "Waypoint Alpha", lat: 32.15, lon: 125.50, status: "completed" },
      { name: "East China Sea", lat: 32.80, lon: 127.00, status: "current" },
      { name: "Tokyo Bay", lat: 35.45, lon: 139.65, status: "upcoming" },
    ],
  },
  ais: [
    { mmsi: "123456789", name: "MV Pacific Star", type: "Cargo", distance: 2.5, bearing: 45, cog: 120, sog: 12.5, status: "underway" },
    { mmsi: "987654321", name: "MV Ocean Glory", type: "Tanker", distance: 4.2, bearing: 280, cog: 300, sog: 8.2, status: "anchored" },
    { mmsi: "456789123", name: "FV Sea Hunter", type: "Fishing", distance: 1.8, bearing: 160, cog: 45, sog: 6.5, status: "underway" },
  ],
  weather: {
    wind: { speed: 18, direction: "NW", gust: 22 },
    sea: { state: "Moderate", waveHeight: 1.5, swell: 0.8 },
    visibility: 10,
    pressure: 1015,
    trend: "steady",
  },
};

// 初始警报数据
const initialAlarmsData = {
  active: [
    { id: 1, time: "08:15:32", source: "Engine Room", type: "warning", priority: "high", message: "High bilge water level in engine room", acknowledged: false },
    { id: 2, time: "09:22:15", source: "Main Engine", type: "info", priority: "medium", message: "Scheduled maintenance reminder", acknowledged: false },
    { id: 3, time: "07:45:00", source: "Navigation", type: "info", priority: "low", message: "AIS target update", acknowledged: true },
  ],
  history: [
    { id: 101, time: "06:30:00", source: "Diesel Gen 1", type: "warning", priority: "high", message: "Oil pressure low warning", resolved: true, resolvedTime: "06:45:00" },
    { id: 102, time: "05:15:00", source: "Steering", type: "alarm", priority: "critical", message: "Steering system anomaly", resolved: true, resolvedTime: "05:20:00" },
    { id: 103, time: "04:00:00", source: "Fire System", type: "info", priority: "low", message: "Fire detector test completed", resolved: true, resolvedTime: "04:01:00" },
    { id: 104, time: "03:30:00", source: "Navigation", type: "warning", priority: "medium", message: "Course deviation detected", resolved: true, resolvedTime: "03:35:00" },
  ],
};

const initialSystemStatus = {
  systemHealth: 95,
  cpuLoad: 30,
  memoryUsage: 45,
  networkLatency: 12,
  sensors: {
    gps: true,
    gyro: true,
    radar: true,
    ais: true,
    depth: true,
    speed: true,
  },
};

const ALARMS_QUERY = { includeHistory: true };
const ENGINE_META_KEYS = new Set(["timestamp", "quality", "source"]);

const readValue = (value, fallback) => {
  if (value && typeof value === "object" && "value" in value) return value.value;
  return value ?? fallback;
};

const normalizeVesselData = (data) => {
  const source = data || {};
  const position = source.position || {};
  const wind = source.wind || {};
  const draft = source.draft || {};

  return {
    ...initialVesselData,
    ...source,
    timestamp: source.timestamp,
    quality: source.quality,
    source: source.source,
    position: {
      ...initialVesselData.position,
      ...position,
      lat: readValue(position.lat, initialVesselData.position.lat),
      lon: readValue(position.lon, initialVesselData.position.lon),
    },
    heading: readValue(source.heading, initialVesselData.heading),
    pitch: readValue(source.pitch, initialVesselData.pitch),
    roll: readValue(source.roll, source.draft?.fore ?? 0),
    cog: readValue(source.cog, initialVesselData.cog),
    sog: readValue(source.sog, initialVesselData.sog),
    wind: {
      ...initialVesselData.wind,
      ...wind,
      speed: readValue(wind.speed, initialVesselData.wind.speed),
      direction: readValue(wind.direction, initialVesselData.wind.direction),
    },
    draft: {
      ...initialVesselData.draft,
      ...draft,
      fore: readValue(draft.fore, initialVesselData.draft.fore),
      aft: readValue(draft.aft, initialVesselData.draft.aft),
    },
    fuelConsumption: readValue(source.fuelConsumption, initialVesselData.fuelConsumption),
    temperature: readValue(source.temperature, initialVesselData.temperature),
    humidity: readValue(source.humidity, initialVesselData.humidity),
  };
};

const normalizeEngine = (engine = {}, fallback = {}) => {
  const source = engine && typeof engine === "object" ? engine : {};
  const cylinders = source.cylinders || source.cylinderTemperatures || fallback.cylinders || [];
  return {
    ...fallback,
    ...source,
    rpm: readValue(source.rpm, fallback.rpm ?? 0),
    power: readValue(source.power, fallback.power ?? 0),
    load: readValue(source.load, fallback.load ?? 0),
    fuelRate: readValue(source.fuelRate, fallback.fuelRate ?? 0),
    torque: readValue(source.torque, fallback.torque ?? 0),
    thrust: readValue(source.thrust, fallback.thrust ?? 0),
    exhaustTemp: readValue(source.exhaustTemp, fallback.exhaustTemp ?? 0),
    coolantTemp: readValue(source.coolantTemp, fallback.coolantTemp ?? 0),
    oilPressure: readValue(source.oilPressure, fallback.oilPressure ?? 0),
    turboSpeed: readValue(source.turboSpeed, fallback.turboSpeed ?? 0),
    voltage: readValue(source.voltage, fallback.voltage ?? 400),
    current: readValue(source.current, fallback.current ?? 450),
    powerFactor: readValue(source.powerFactor, fallback.powerFactor ?? 0.84),
    cylinders: cylinders.map((temp) => readValue(temp, 0)),
    status: source.status || fallback.status || "unknown",
    alerts: source.alerts || fallback.alerts || [],
  };
};

const normalizeEngineData = (data) => {
  const source = data?.engines || data || {};
  const keys = Array.from(new Set([...Object.keys(initialEngineData), ...Object.keys(source).filter((key) => !ENGINE_META_KEYS.has(key))]));
  const normalized = keys.reduce((acc, key) => {
    acc[key] = normalizeEngine(source[key], initialEngineData[key]);
    return acc;
  }, {});

  return {
    ...normalized,
    __meta: {
      timestamp: data?.timestamp,
      quality: data?.quality,
      source: data?.source,
    },
  };
};

const normalizeNavigationData = (data) => ({
  ...initialNavigationData,
  ...(data || {}),
  route: {
    ...initialNavigationData.route,
    ...(data?.route || {}),
  },
  ais: data?.ais || initialNavigationData.ais,
  weather: {
    ...initialNavigationData.weather,
    ...(data?.weather || {}),
    wind: {
      ...initialNavigationData.weather.wind,
      ...(data?.weather?.wind || {}),
    },
    sea: {
      ...initialNavigationData.weather.sea,
      ...(data?.weather?.sea || {}),
    },
  },
});

const normalizeAlarm = (alarm) => ({
  id: alarm.id || alarm.alarmId || alarm.pointCode || `${alarm.source}-${alarm.time}`,
  time: alarm.time || alarm.timestamp || alarm.occurredAt || "",
  source: alarm.source || alarm.deviceName || alarm.deviceGroup || "",
  pointCode: alarm.pointCode,
  type: alarm.type || alarm.level || "info",
  priority: alarm.priority || alarm.severity || "low",
  message: alarm.message || alarm.displayNameZh || alarm.pointName || alarm.pointCode || "",
  acknowledged: Boolean(alarm.acknowledged),
  resolved: Boolean(alarm.resolved),
  resolvedTime: alarm.resolvedTime || alarm.resolvedAt,
});

const normalizeAlarmsData = (data) => {
  const source = data?.alarms || data || {};
  return {
    timestamp: source.timestamp || data?.timestamp,
    active: (source.active || []).map(normalizeAlarm),
    history: (source.history || []).map(normalizeAlarm),
  };
};

const normalizeSystemStatus = (data) => ({
  ...initialSystemStatus,
  ...(data || {}),
  sensors: {
    ...initialSystemStatus.sensors,
    ...(data?.sensors || {}),
  },
});

const normalizeTrendPoints = (data) =>
  (data?.points || data || []).map((point) => ({
    ...point,
    time: point.time ? new Date(point.time) : new Date(point.timestamp),
  }));

const useBackendResource = (endpoint, intervalMs, initialData, transform, options = {}) =>
  useApiResource(buildApiPath(endpoint, { vesselId: DEFAULT_VESSEL_ID }), {
    enabled: USE_BACKEND,
    intervalMs,
    initialData,
    transform,
    ...options,
  });

// 添加平滑滤波处理
const applySmoothing = (currentValue, newValue, filterCoefficient) => {
  if (filterCoefficient === 0) return newValue;
  return currentValue * filterCoefficient + newValue * (1 - filterCoefficient);
};

// 自定义钩子：实时船舶数据
export const useVesselData = (updateInterval = 1000, config = {}) => {
  const { smoothingFilter = 0.3 } = config;
  const [data, setData] = useState(initialVesselData);
  const prevDataRef = useRef(initialVesselData);
  const backendResource = useBackendResource(
    API_ENDPOINTS.vessel,
    updateInterval,
    initialVesselData,
    normalizeVesselData
  );

  useEffect(() => {
    if (USE_BACKEND) return undefined;

    const interval = setInterval(() => {
      setData((prev) => {
        const newData = {
          ...prev,
          position: {
            lat: fluctuate(prev.position.lat, 30.0, 35.0, 0.0001),
            lon: fluctuate(prev.position.lon, 120.0, 130.0, 0.0001),
          },
          heading: Math.round(fluctuate(prev.heading, 30, 40, 0.01)),
          pitch: fluctuate(prev.pitch, -1, 1, 0.1),
          cog: fluctuate(prev.cog, 25, 35, 0.02),
          sog: fluctuate(prev.sog, 8, 12, 0.03),
          wind: {
            direction: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.floor(Math.random() * 8)],
            speed: Math.round(fluctuate(prev.wind.speed, 10, 25, 0.05)),
          },
          draft: {
            fore: fluctuate(prev.draft.fore, -1.5, 0, 0.02),
            aft: fluctuate(prev.draft.aft, -0.5, 0.5, 0.02),
          },
          fuelConsumption: fluctuate(prev.fuelConsumption, 3000, 4000, 0.01),
          temperature: fluctuate(prev.temperature, 20, 35, 0.02),
          humidity: Math.round(fluctuate(prev.humidity, 50, 80, 0.01)),
        };

        // 应用平滑滤波
        const smoothedData = {
          ...newData,
          sog: applySmoothing(prevDataRef.current.sog, newData.sog, smoothingFilter),
          heading: applySmoothing(prevDataRef.current.heading, newData.heading, smoothingFilter),
          fuelConsumption: applySmoothing(prevDataRef.current.fuelConsumption, newData.fuelConsumption, smoothingFilter),
        };

        prevDataRef.current = smoothedData;
        return smoothedData;
      });
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval, smoothingFilter]);

  return USE_BACKEND ? backendResource.data || initialVesselData : data;
};

// 自定义钩子：实时引擎数据
export const useEngineData = (updateInterval = 2000, config = {}) => {
  const { rpmHighAlertLimit = 750, lubeOilPressureLowLimit = 2.5, faultInjectionEnabled = false } = config;
  const [engines, setEngines] = useState(initialEngineData);
  const faultIntervalRef = useRef(null);
  const backendResource = useBackendResource(
    API_ENDPOINTS.engines,
    updateInterval,
    initialEngineData,
    normalizeEngineData
  );

  // 故障注入效果
  useEffect(() => {
    if (USE_BACKEND) return undefined;

    if (faultInjectionEnabled) {
      // 强制生成紧急故障
      faultIntervalRef.current = setInterval(() => {
        setEngines((prev) => {
          const updated = { ...prev };
          // 强制使柴油机1进入故障状态
          if (updated.diesel1) {
            updated.diesel1 = {
              ...updated.diesel1,
              rpm: Math.floor(Math.random() * 200) + 800, // 异常转速
              oilPressure: Math.random() * 1.5 + 1.0, // 低油压
              status: "fault",
              alerts: [
                {
                  id: Date.now(),
                  type: "critical",
                  message: "EMERGENCY: Lube oil pressure critically low",
                  timestamp: new Date().toISOString(),
                },
              ],
            };
          }
          return updated;
        });
      }, 3000);
    }

    return () => {
      if (faultIntervalRef.current) {
        clearInterval(faultIntervalRef.current);
      }
    };
  }, [faultInjectionEnabled]);

  useEffect(() => {
    if (USE_BACKEND) return undefined;

    const interval = setInterval(() => {
      setEngines((prev) => {
        const updated = { ...prev };

        // 更新每个气缸的温度
        Object.keys(updated).forEach((engineKey) => {
          const engine = updated[engineKey];
          const newOilPressure = engine.status === "running" 
            ? fluctuate(engine.oilPressure, 3.5, 5.0, 0.02) 
            : engine.oilPressure;

          // 检查报警阈值
          const alerts = [...(engine.alerts || [])];
          if (engineKey === "diesel1" && newOilPressure < lubeOilPressureLowLimit) {
            if (!alerts.find(a => a.message.includes("Lube oil pressure"))) {
              alerts.push({
                id: Date.now(),
                type: "warning",
                message: `Lube oil pressure below threshold: ${newOilPressure.toFixed(1)} Bar`,
                timestamp: new Date().toISOString(),
              });
            }
          }

          updated[engineKey] = {
            ...engine,
            rpm: engine.status === "running" ? Math.round(fluctuate(engine.rpm, engine.rpm * 0.9, engine.rpm * 1.1, 0.01)) : engine.rpm,
            power: engine.status === "running" ? Math.round(fluctuate(engine.power, engine.power * 0.8, engine.power * 1.1, 0.02)) : engine.power,
            load: engine.status === "running" ? Math.round(fluctuate(engine.load, 60, 100, 0.02)) : engine.load,
            fuelRate: engine.status === "running" ? fluctuate(engine.fuelRate, engine.fuelRate * 0.8, engine.fuelRate * 1.1, 0.02) : engine.fuelRate,
            torque: engine.status === "running" ? fluctuate(engine.torque, engine.torque * 0.8, engine.torque * 1.1, 0.02) : engine.torque,
            exhaustTemp: engine.status === "running" ? fluctuate(engine.exhaustTemp, 350, 500, 0.01) : engine.exhaustTemp,
            coolantTemp: engine.status === "running" ? fluctuate(engine.coolantTemp, 70, 95, 0.01) : engine.coolantTemp,
            oilPressure: newOilPressure,
            turboSpeed: engine.status === "running" ? fluctuate(engine.turboSpeed, 15, 22, 0.02) : engine.turboSpeed,
            cylinders: engine.cylinders.map((temp) => Math.round(fluctuate(temp, 350, 500, 0.015))),
            alerts: alerts.slice(-3), // 保留最近3条报警
          };
        });

        return updated;
      });
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval, lubeOilPressureLowLimit, rpmHighAlertLimit]);

  return USE_BACKEND ? backendResource.data || initialEngineData : engines;
};

// 自定义钩子：实时导航数据
export const useNavigationData = (updateInterval = 3000) => {
  const [data, setData] = useState(initialNavigationData);
  const backendResource = useBackendResource(
    API_ENDPOINTS.navigation,
    updateInterval,
    initialNavigationData,
    normalizeNavigationData
  );

  useEffect(() => {
    if (USE_BACKEND) return undefined;

    const interval = setInterval(() => {
      setData((prev) => ({
        ...prev,
        route: {
          ...prev.route,
          distanceRemaining: Math.max(0, prev.route.distanceRemaining - 0.1),
          distanceTraveled: Math.min(1630, prev.route.distanceTraveled + 0.1),
        },
        weather: {
          ...prev.weather,
          wind: {
            speed: Math.round(fluctuate(prev.weather.wind.speed, 5, 30, 0.05)),
            direction: prev.weather.wind.direction,
            gust: Math.round(fluctuate(prev.weather.wind.gust, prev.weather.wind.speed, prev.weather.wind.speed + 10, 0.03)),
          },
          sea: {
            ...prev.weather.sea,
            waveHeight: fluctuate(prev.weather.sea.waveHeight, 0.5, 4.0, 0.05),
            swell: fluctuate(prev.weather.sea.swell, 0.2, 2.0, 0.05),
          },
          pressure: Math.round(fluctuate(prev.weather.pressure, 990, 1030, 0.001)),
        },
        ais: prev.ais.map((target) => ({
          ...target,
          distance: fluctuate(target.distance, 0.5, 10, 0.01),
          sog: fluctuate(target.sog, 0, 20, 0.02),
        })),
      }));
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval]);

  return USE_BACKEND ? backendResource.data || initialNavigationData : data;
};

// 自定义钩子：实时警报数据
export const useAlarmsData = (updateInterval = 5000, language = "en") => {
  const [alarms, setAlarms] = useState(initialAlarmsData);
  const [acknowledgedIds, setAcknowledgedIds] = useState(() => new Set());
  const alarmIdRef = useRef(200);
  const backendResource = useBackendResource(
    API_ENDPOINTS.alarms,
    updateInterval,
    initialAlarmsData,
    normalizeAlarmsData,
    { query: ALARMS_QUERY }
  );

  const localizeSource = useCallback(
    (source) => {
      if (language !== "zh") return source;
      const map = {
        "Engine Room": "机舱",
        "Main Engine": "主机",
        "Diesel Gen 1": "柴油发电机 1",
        "Diesel Gen 2": "柴油发电机 2",
        Navigation: "导航",
        Steering: "舵机",
        "Fire System": "消防系统",
      };
      return map[source] || source;
    },
    [language]
  );

  const localizeMessage = useCallback(
    (message) => {
      if (language !== "zh") return message;
      const map = {
        "High bilge water level in engine room": "机舱舱底水位过高",
        "Scheduled maintenance reminder": "计划维护提醒",
        "AIS target update": "AIS 目标更新",
        "Oil pressure low warning": "油压过低警告",
        "Steering system anomaly": "舵机系统异常",
        "Fire detector test completed": "火灾探测器测试完成",
        "Course deviation detected": "检测到航向偏离",
        "Temperature sensor reading anomaly": "温度传感器读数异常",
        "Pressure below normal threshold": "压力低于正常阈值",
        "Scheduled system check required": "需要进行计划系统检查",
        "Fuel level low warning": "燃油液位低警告",
        "Communication timeout with sensor": "与传感器通信超时",
      };
      return map[message] || message;
    },
    [language]
  );

  const localizeAlarm = useCallback(
    (alarm) => ({
      ...alarm,
      source: localizeSource(alarm.source),
      message: localizeMessage(alarm.message),
    }),
    [localizeSource, localizeMessage]
  );

  const alarmSource = USE_BACKEND ? backendResource.data || initialAlarmsData : alarms;

  // expose localized alarms to consumers
  const localizedAlarms = {
    active: (alarmSource.active || []).map((alarm) =>
      localizeAlarm({
        ...alarm,
        acknowledged: alarm.acknowledged || acknowledgedIds.has(alarm.id),
      })
    ),
    history: (alarmSource.history || []).map(localizeAlarm),
  };

  useEffect(() => {
    if (USE_BACKEND) return undefined;

    const interval = setInterval(() => {
      setAlarms((prev) => {
        const newAlarms = { ...prev };

        // 随机生成新警报（低概率）
        if (Math.random() < 0.1) {
          const now = new Date();
          const newAlarm = {
            id: ++alarmIdRef.current,
            time: now.toLocaleTimeString(language === "zh" ? "zh-CN" : "en-US", { hour12: false }),
            source: ["Main Engine", "Diesel Gen 1", "Diesel Gen 2", "Navigation", "Steering"][Math.floor(Math.random() * 5)],
            type: ["info", "warning", "alarm"][Math.floor(Math.random() * 3)],
            priority: ["low", "medium", "high", "critical"][Math.floor(Math.random() * 4)],
            message: [
              "Temperature sensor reading anomaly",
              "Pressure below normal threshold",
              "Scheduled system check required",
              "Fuel level low warning",
              "Communication timeout with sensor",
            ][Math.floor(Math.random() * 5)],
            acknowledged: false,
          };
          newAlarms.active = [newAlarm, ...newAlarms.active.slice(0, 9)];
        }

        // 随机标记已确认
        newAlarms.active = newAlarms.active.map((alarm) => {
          if (!alarm.acknowledged && Math.random() < 0.05) {
            return { ...alarm, acknowledged: true };
          }
          return alarm;
        });

        return newAlarms;
      });
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval, language]);

  const acknowledgeAlarm = useCallback(async (id) => {
    if (USE_BACKEND) {
      setAcknowledgedIds((prev) => new Set(prev).add(id));
      try {
        await apiRequest(buildApiPath(API_ENDPOINTS.acknowledgeAlarm, { vesselId: DEFAULT_VESSEL_ID, alarmId: id }), {
          method: "POST",
          body: {
            acknowledgedAt: new Date().toISOString(),
          },
        });
      } catch (error) {
        setAcknowledgedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
      return;
    }

    setAlarms((prev) => ({
      ...prev,
      active: prev.active.map((alarm) =>
        alarm.id === id ? { ...alarm, acknowledged: true } : alarm
      ),
    }));
  }, []);

  return { alarms: localizedAlarms, acknowledgeAlarm };
};

// 自定义钩子：系统状态
export const useSystemStatus = (updateInterval = 1500) => {
  const [status, setStatus] = useState(initialSystemStatus);
  const backendResource = useBackendResource(
    API_ENDPOINTS.systemStatus,
    updateInterval,
    initialSystemStatus,
    normalizeSystemStatus
  );

  useEffect(() => {
    if (USE_BACKEND) return undefined;

    const interval = setInterval(() => {
      setStatus((prev) => ({
        ...prev,
        systemHealth: Math.round(fluctuate(prev.systemHealth, 90, 100, 0.005)),
        cpuLoad: Math.round(fluctuate(prev.cpuLoad, 15, 60, 0.05)),
        memoryUsage: Math.round(fluctuate(prev.memoryUsage, 30, 70, 0.02)),
        networkLatency: Math.round(fluctuate(prev.networkLatency, 5, 50, 0.1)),
      }));
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval]);

  return USE_BACKEND ? backendResource.data || initialSystemStatus : status;
};

// 生成图表数据
export const useTrendData = (hours = 24, points = 100) => {
  const [data, setData] = useState(() => {
    const now = Date.now();
    const start = now - hours * 3600000;
    return Array.from({ length: points }, (_, i) => ({
      time: new Date(start + i * (hours * 3600000 / Math.max(points - 1, 1))),
      temperature: randomInRange(400, 450),
      pressure: randomInRange(75, 90),
      rpm: randomInRange(800, 900),
      power: randomInRange(10000, 14000),
      lubeOilPressure: randomInRange(3.5, 4.8),
      coolantTemp: randomInRange(72, 88),
      lubeOilTemp: randomInRange(78, 92),
      fuelPressure: randomInRange(6.8, 8.4),
      fuelTemp: randomInRange(32, 46),
      load: randomInRange(60, 95),
      vesselSpeed: randomInRange(8, 16),
      windSpeed: randomInRange(5, 28),
    }));
  });
  const trendQuery = useMemo(
    () => ({
      hours,
      points,
    }),
    [hours, points]
  );
  const backendResource = useBackendResource(
    API_ENDPOINTS.trend,
    10000,
    data,
    normalizeTrendPoints,
    { query: trendQuery }
  );

  useEffect(() => {
    if (USE_BACKEND) return undefined;

    const interval = setInterval(() => {
      setData((prev) => {
        const newData = [...prev.slice(1)];
        const lastPoint = prev[prev.length - 1];
        newData.push({
          time: new Date(),
          temperature: fluctuate(lastPoint.temperature, 380, 480, 0.02),
          pressure: fluctuate(lastPoint.pressure, 70, 95, 0.01),
          rpm: Math.round(fluctuate(lastPoint.rpm, 750, 950, 0.01)),
          power: Math.round(fluctuate(lastPoint.power, 9000, 15000, 0.02)),
          lubeOilPressure: fluctuate(lastPoint.lubeOilPressure, 3.2, 5.0, 0.015),
          coolantTemp: fluctuate(lastPoint.coolantTemp, 68, 96, 0.012),
          lubeOilTemp: fluctuate(lastPoint.lubeOilTemp, 72, 98, 0.012),
          fuelPressure: fluctuate(lastPoint.fuelPressure, 6.2, 8.8, 0.015),
          fuelTemp: fluctuate(lastPoint.fuelTemp, 28, 52, 0.012),
          load: fluctuate(lastPoint.load, 45, 100, 0.02),
          vesselSpeed: fluctuate(lastPoint.vesselSpeed, 6, 18, 0.02),
          windSpeed: fluctuate(lastPoint.windSpeed, 0, 34, 0.025),
        });
        return newData;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return USE_BACKEND ? backendResource.data || data : data;
};

const realTimeDataHooks = {
  useVesselData,
  useEngineData,
  useNavigationData,
  useAlarmsData,
  useSystemStatus,
  useTrendData,
};

export default realTimeDataHooks;
