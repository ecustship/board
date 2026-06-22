import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion } from "framer-motion";
import { useLanguage } from "./hooks/useLanguage";

const vessels = [
  {
    id: "MAYO-002",
    name: "MAYO-002",
    status: "En route: Singapore",
    statusZh: "航行中: 新加坡",
    statusColor: "#2ae500",
    lat: 31.23,
    lon: 122.10,
    time: "14:23:02",
    sog: "18.4 kn",
  },
  {
    id: "KARMIN-1131",
    name: "KARMIN 1131",
    status: "At Anchor: Shanghai",
    statusZh: "锚泊中: 上海",
    statusColor: "#2ae500",
    lat: 31.45,
    lon: 121.85,
    time: "14:20:15",
    sog: "0.0 kn",
  },
  {
    id: "RIVERBOSS-521",
    name: "RIVERBOSS 521",
    status: "System: Maintenance",
    statusZh: "系统: 维护中",
    statusColor: "#ba1a1a",
    lat: 31.10,
    lon: 122.30,
    time: "14:18:44",
    sog: "0.0 kn",
  },
  {
    id: "OCEANIC-PRIDE",
    name: "OCEANIC PRIDE",
    status: "En route: Busan",
    statusZh: "航行中: 釜山",
    statusColor: "#2ae500",
    lat: 31.60,
    lon: 122.50,
    time: "14:22:01",
    sog: "22.1 kn",
  },
];

const routeTrack = [
  [31.23, 122.10],
  [25.00, 120.00],
  [18.00, 115.00],
  [8.00, 108.00],
  [1.50, 104.00],
  [1.29, 103.85],
];

function FitBoundsOnMount({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions.map((p) => L.latLng(p[0], p[1])));
      map.fitBounds(bounds, { padding: [60, 60] });
      setTimeout(() => map.invalidateSize({ animate: false }), 100);
    }
  }, []);
  return null;
}

const createVesselIcon = (color, isSelected) => {
  const size = isSelected ? 18 : 12;
  const ring = isSelected ? `<div style="width:${size + 8}px;height:${size + 8}px;border-radius:50%;border:2px solid #0058bc;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);box-shadow:0 0 12px rgba(0,160,233,0.6);"></div>` : "";
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;">
        <div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;box-shadow:0 0 15px ${color}80,0 0 30px ${color}40;border:1.5px solid #ffffff40;"></div>
        ${ring}
      </div>
    `,
    iconSize: [size + (isSelected ? 8 : 0), size + (isSelected ? 8 : 0)],
    iconAnchor: [size / 2 + (isSelected ? 4 : 0), size / 2 + (isSelected ? 4 : 0)],
  });
};

const bottomCards = [
  { id: 0, type: "voyage" },
  { id: 1, type: "power" },
];

const NauticalCharts = () => {
  const { t, language } = useLanguage();
  const [selectedVessel, setSelectedVessel] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize({ animate: false });
      }
      window.dispatchEvent(new Event("resize"));
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleVesselClick = (vessel) => {
    setSelectedVessel(vessel);
    if (mapRef.current) {
      mapRef.current.setView([vessel.lat, vessel.lon], 8, { animate: true });
    }
  };

  const handleClose = () => {
    setSelectedVessel(null);
    if (mapRef.current) {
      mapRef.current.setView([25, 122], 6, { animate: true });
    }
  };

  const getStatusText = (vessel) => {
    return language === "zh" ? vessel.statusZh : vessel.status;
  };

  const formatCoord = (val, isLat) => {
    const dir = isLat ? (val >= 0 ? "N" : "S") : val >= 0 ? "E" : "W";
    return `${Math.abs(val).toFixed(4)}° ${dir}`;
  };

  return (
    <main className="flex-1 relative overflow-hidden">
      {/* Leaflet Map Layer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        <MapContainer
          center={[25, 122]}
          zoom={6}
          style={{
            width: "100%",
            height: "100%",
            background: "#0a1628",
            pointerEvents: "auto",
          }}
          worldCopyJump={true}
          maxBounds={[[-85, -180], [85, 180]]}
          ref={mapRef}
          zoomControl={false}
          preferCanvas={true}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            subdomains="abcd"
          />

          <FitBoundsOnMount positions={vessels.map((v) => [v.lat, v.lon])} />

          <Polyline
            positions={routeTrack}
            pathOptions={{
              color: "#00ffcc",
              weight: 2,
              opacity: 0.7,
              dashArray: "8, 10",
            }}
          />

          {vessels.map((vessel) => (
            <Marker
              key={vessel.id}
              position={[vessel.lat, vessel.lon]}
              icon={createVesselIcon(vessel.statusColor, selectedVessel?.id === vessel.id)}
              eventHandlers={{
                click: () => handleVesselClick(vessel),
              }}
            >
              <Popup className="twin-popup" closeButton={false}>
                <div style={{ fontSize: 12, lineHeight: 1.5, minWidth: 160 }}>
                  <b style={{ color: "#00ffcc", display: "block", marginBottom: 4 }}>
                    {vessel.name}
                  </b>
                  <span style={{ color: "#aaa", display: "block", marginBottom: 4 }}>
                    {getStatusText(vessel)}
                  </span>
                  <hr style={{ borderColor: "#23394a", margin: "4px 0" }} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                    <span style={{ color: "#aaa" }}>LAT</span>
                    <span style={{ color: "#00ffcc", fontFamily: "monospace" }}>
                      {formatCoord(vessel.lat, true)}
                    </span>
                    <span style={{ color: "#aaa" }}>LON</span>
                    <span style={{ color: "#00ffcc", fontFamily: "monospace" }}>
                      {formatCoord(vessel.lon, false)}
                    </span>
                    <span style={{ color: "#aaa" }}>SOG</span>
                    <span style={{ color: "#00ffcc", fontFamily: "monospace" }}>
                      {vessel.sog}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Left Sidebar: Vessel List */}
      <motion.aside
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="fixed left-4 top-24 bottom-4 w-56 bg-[#2e3132]/95 backdrop-blur-md rounded-2xl shadow-xl z-20 flex flex-col p-4 overflow-hidden"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-white font-black text-sm">{t.vesselA}</h2>
            <p className="text-[#717786] text-[10px]">{t.systemOnline}</p>
          </div>
          <span className="material-symbols-outlined text-[#2ae500]" style={{ fontVariationSettings: "'FILL' 1" }}>
            sailing
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {vessels.map((vessel, idx) => (
            <motion.div
              key={vessel.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              onClick={() => handleVesselClick(vessel)}
              className={`flex items-center justify-between p-3 rounded-xl transition-colors cursor-pointer border-l-4 ${
                selectedVessel?.id === vessel.id
                  ? "bg-white/15 border-white/50"
                  : "bg-white/5 hover:bg-white/10"
              }`}
              style={{ borderLeftColor: selectedVessel?.id === vessel.id ? "#0058bc" : vessel.statusColor }}
            >
              <div>
                <p className="text-white text-[10px] font-bold uppercase tracking-wider">{vessel.name}</p>
                <p className="text-[#717786] text-[9px]">{getStatusText(vessel)}</p>
              </div>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: vessel.statusColor }} />
            </motion.div>
          ))}
        </div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-4 w-full py-3 bg-[#ba1a1a] text-white rounded-xl font-bold uppercase tracking-wider text-[10px] hover:bg-[#ba1a1a]/90 active:scale-95 transition-all"
        >
          {t.emergencyStop}
        </motion.button>
      </motion.aside>

      {/* Right Sidebar: Real-time Telemetry & Alarms */}
      <motion.aside
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="fixed right-4 top-24 bottom-4 w-64 bg-[#2e3132]/95 backdrop-blur-md rounded-2xl shadow-xl z-20 flex flex-col overflow-hidden"
      >
        <div className="p-4 border-b border-white/10 bg-[#191c1e]/30">
          <h3 className="text-white font-bold text-[10px] uppercase tracking-widest mb-3">{t.realTimeDataLabel}</h3>
          <div className="space-y-3">
            <div className="rounded-xl bg-white/5 p-3">
              <p className="text-[#2ae500] font-mono text-[15px]">
                {selectedVessel ? formatCoord(selectedVessel.lat, true) : "31.2300° N"}
              </p>
              <p className="text-[#2ae500] font-mono text-[15px]">
                {selectedVessel ? formatCoord(selectedVessel.lon, false) : "122.1000° E"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-[#717786] text-[10px] uppercase font-bold">{t.windSpeed}</p>
                <p className="text-[#2ae500] text-xl font-bold">14.2 <span className="text-[12px]">{t.knots}</span></p>
              </div>
              <div className="space-y-1">
                <p className="text-[#717786] text-[10px] uppercase font-bold">{t.vesselHeading}</p>
                <p className="text-[#2ae500] text-xl font-bold">112° <span className="text-[12px]">NW</span></p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          <section>
            <h4 className="text-white/40 font-bold text-[10px] uppercase tracking-widest mb-4">{t.vitals}</h4>
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="flex justify-between items-center group"
              >
                <span className="text-[#717786] text-[13px] group-hover:text-white transition-colors">{t.currentDraft}</span>
                <span className="text-[#2ae500] font-mono text-[13px]">14.8 m</span>
              </motion.div>
            </div>
          </section>

          <section>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-white/40 font-bold text-[10px] uppercase tracking-widest">{t.activeAlarmsLabel}</h4>
              <span className="text-[#ba1a1a] bg-[#ba1a1a]/10 px-2 py-0.5 rounded text-[10px] font-bold">2 {t.critical}</span>
            </div>
            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-[#ba1a1a]/10 border border-[#ba1a1a]/20 p-3 rounded-xl flex items-start gap-3"
              >
                <span className="material-symbols-outlined text-[#ba1a1a] text-[18px]">fire_extinguisher</span>
                <div>
                  <p className="text-white text-[12px] font-bold">{t.fireDetection} 4</p>
                  <p className="text-[#ba1a1a] text-[10px]">{t.mainEngineDeck} • 08:42:11</p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-[#ba1a1a]/10 border border-[#ba1a1a]/20 p-3 rounded-xl flex items-start gap-3"
              >
                <span className="material-symbols-outlined text-[#ba1a1a] text-[18px]">water_drop</span>
                <div>
                  <p className="text-white text-[12px] font-bold">{t.highBilge}</p>
                  <p className="text-[#ba1a1a] text-[10px]">{t.aftPumpRoom} • 08:39:02</p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-white/5 p-3 rounded-xl flex items-start gap-3 opacity-60"
              >
                <span className="material-symbols-outlined text-[#717786] text-[18px]">history</span>
                <div>
                  <p className="text-white/60 text-[12px] font-bold">{t.filterMaintenance}</p>
                  <p className="text-white/30 text-[10px]">Log ID: #9921 • {t.scheduled}</p>
                </div>
              </motion.div>
            </div>
          </section>
        </div>
      </motion.aside>

      {/* Center: Position Pop-up */}
      {selectedVessel && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#2e3132]/90 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl z-30 w-[360px]"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedVessel.statusColor }} />
                <h2 className="text-white font-black text-xl">{selectedVessel.name}</h2>
              </div>
              <p className="text-white/40 text-[11px] font-bold uppercase tracking-wider">{t.updatedAgo}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-[#0058bc]/20 p-3 rounded-2xl">
                <span className="material-symbols-outlined text-[#0058bc] text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  radar
                </span>
              </div>
              <button
                onClick={handleClose}
                className="w-10 h-10 bg-white/10 text-white flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-2xl">
                <p className="text-white/40 text-[10px] font-bold mb-1 uppercase">{t.latitude}</p>
                <p className="text-white text-[18px] font-mono">{formatCoord(selectedVessel.lat, true)}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl">
                <p className="text-white/40 text-[10px] font-bold mb-1 uppercase">{t.longitude}</p>
                <p className="text-white text-[18px] font-mono">{formatCoord(selectedVessel.lon, false)}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-2xl">
                <p className="text-white/40 text-[10px] font-bold mb-1 uppercase">{t.localTime}</p>
                <p className="text-white text-[18px] font-mono">{selectedVessel.time}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl">
                <p className="text-white/40 text-[10px] font-bold mb-1 uppercase">{t.speedOverGround}</p>
                <p className="text-[#2ae500] text-[18px] font-mono">{selectedVessel.sog}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button className="flex-1 py-4 bg-[#0058bc] text-white rounded-2xl font-bold transition-transform active:scale-95">
              {t.openChartDetails}
            </button>
            <button className="w-14 bg-white/10 text-white flex items-center justify-center rounded-2xl hover:bg-white/20 transition-colors">
              <span className="material-symbols-outlined">share</span>
            </button>
          </div>
        </motion.div>
      )}

      {!selectedVessel && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
          <div className="bg-[#2e3132]/60 backdrop-blur-sm border border-white/10 px-6 py-3 rounded-full">
            <p className="text-white/60 text-xs font-medium">{t.clickVessel}</p>
          </div>
        </div>
      )}

      {/* Bottom: Voyage Statistics Cards */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex gap-4 z-20">
        {bottomCards.map((card, idx) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + idx * 0.1 }}
            className="w-[320px] bg-[#2e3132]/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/5"
          >
            {card.type === "voyage" ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white font-bold text-[10px] uppercase tracking-wider">{t.voyageProgress}</h3>
                  <span className="text-[#2ae500] text-[10px] font-bold">84%</span>
                </div>

                <div className="h-16 flex items-end justify-between gap-1 mb-3">
                  <motion.div
                    initial={{ height: "10%" }}
                    animate={{ height: "50%" }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className="w-full bg-white/5 rounded-t"
                  />
                  <motion.div
                    initial={{ height: "10%" }}
                    animate={{ height: "66%" }}
                    transition={{ delay: 0.9, duration: 0.5 }}
                    className="w-full bg-white/5 rounded-t"
                  />
                  <motion.div
                    initial={{ height: "10%" }}
                    animate={{ height: "75%" }}
                    transition={{ delay: 1.0, duration: 0.5 }}
                    className="w-full bg-[#0058bc]/40 rounded-t"
                  />
                  <motion.div
                    initial={{ height: "10%" }}
                    animate={{ height: "80%" }}
                    transition={{ delay: 1.1, duration: 0.5 }}
                    className="w-full bg-[#0058bc]/60 rounded-t"
                  />
                  <motion.div
                    initial={{ height: "10%" }}
                    animate={{ height: "100%" }}
                    transition={{ delay: 1.2, duration: 0.5 }}
                    className="w-full bg-[#0058bc] rounded-t"
                  />
                  <motion.div
                    initial={{ height: "10%" }}
                    animate={{ height: "75%" }}
                    transition={{ delay: 1.3, duration: 0.5 }}
                    className="w-full bg-[#0058bc]/80 rounded-t"
                  />
                  <motion.div
                    initial={{ height: "10%" }}
                    animate={{ height: "50%" }}
                    transition={{ delay: 1.4, duration: 0.5 }}
                    className="w-full bg-white/5 rounded-t"
                  />
                  <motion.div
                    initial={{ height: "10%" }}
                    animate={{ height: "33%" }}
                    transition={{ delay: 1.5, duration: 0.5 }}
                    className="w-full bg-white/5 rounded-t"
                  />
                  <motion.div
                    initial={{ height: "10%" }}
                    animate={{ height: "25%" }}
                    transition={{ delay: 1.6, duration: 0.5 }}
                    className="w-full bg-white/5 rounded-t"
                  />
                </div>

                <div className="flex justify-between text-[10px] text-white/40 uppercase font-bold">
                  <span>{t.departure}</span>
                  <span>{t.eta}: 4h 12m</span>
                  <span>{t.arrival}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white font-bold text-[10px] uppercase tracking-wider">POWER</h3>
                  <span className="text-[#2ae500] text-[10px] font-bold">+3.8% {t.optimalLabel}</span>
                </div>

                <div className="relative h-16 mb-3 overflow-hidden rounded-xl bg-white/5">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 100">
                    <motion.path
                      d="M0,70 Q45,46 95,58 T190,30 T300,44 T400,24"
                      fill="none"
                      stroke="#79ff5b"
                      strokeWidth="2"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, delay: 0.8 }}
                    />
                    <path d="M0,70 Q45,46 95,58 T190,30 T300,44 T400,24 L400,100 L0,100 Z" fill="url(#gradient-green)" opacity="0.1" />
                    <defs>
                      <linearGradient id="gradient-green" x1="0%" x2="0%" y1="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#79ff5b', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#79ff5b', stopOpacity: 0 }} />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white/40 text-[10px] font-bold uppercase">AVG POWER</p>
                    <p className="text-white text-[16px] font-bold">12,450 <span className="text-[10px]">kW</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/40 text-[10px] font-bold uppercase">{t.efficiency}</p>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#2ae500]" />
                      <p className="text-white text-[16px] font-bold">98.2%</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        ))}
      </div>

      <style>{`
        .leaflet-container {
          font-family: inherit;
        }
        .leaflet-tile-pane {
          background: #0a1628;
        }
        .leaflet-tile-pane img {
          background: #0a1628;
        }
        img.leaflet-tile {
          background: #0a1628 !important;
        }
        .leaflet-popup.twin-popup .leaflet-popup-content-wrapper {
          background: #111c24;
          color: #ffffff;
          border: 1px solid #00a0e9;
          border-radius: 4px;
          box-shadow: 0 0 12px rgba(0,160,233,0.5);
        }
        .leaflet-popup.twin-popup .leaflet-popup-tip {
          background: #111c24;
        }
        .leaflet-popup.twin-popup .leaflet-popup-content {
          margin: 10px 12px;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </main>
  );
};

export default NauticalCharts;
